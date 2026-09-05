# Audit Log System — Architecture Deep Dive

## Why Audit Logs Matter

Every sensitive action in the system must be traceable. When something goes wrong (unauthorized access, data change, system error), audit logs answer:
- **Who** did it (user ID, username)
- **What** happened (endpoint, method, status)
- **When** (timestamp with microseconds)
- **How** (IP address, user agent, duration)
- **Result** (success/failure, old vs new values)

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────┐
│   HTTP Request   │────▶│   AuditFilter     │────▶│ AuditEvent   │
│   (any API call) │     │   (Servlet Filter)│     │ Publisher    │
└──────────────────┘     └──────────────────┘     └──────┬───────┘
                                                         │
                                          ┌──────────────┴──────────────┐
                                          ▼                             ▼
                                   ┌─────────────┐             ┌──────────────┐
                                   │  MySQL DB    │             │  SSE Broadcast│
                                   │  audit_log   │             │  to all       │
                                   │  table       │             │  subscribers  │
                                   └─────────────┘             └──────┬───────┘
                                                                     │
                                                                     ▼
                                                              ┌──────────────┐
                                                              │  Frontend    │
                                                              │  Audit Page  │
                                                              │  (SSE stream)│
                                                              └──────────────┘
```

## Components

### 1. AuditFilter (Servlet Filter)
- Intercepts ALL HTTP requests (except skipped paths)
- Runs BEFORE Spring Security filter chain
- Creates `AuditLog` entity with request metadata
- Publishes to `AuditEventPublisher`

**Selective logging** — only records:
- Auth events (login, register, password changes)
- Mutations (POST, PUT, PATCH, DELETE)
- Errors (4xx, 5xx responses)
- Sensitive reads (admin endpoints, user management)

**Skipped** (no log created):
- Read-only GET to `/api/developer/audit/*`
- Read-only GET to `/api/developer/monitoring`
- Read-only GET to `/api/developer/config`
- Health checks, static assets, SSE stream

### 2. AuditEventPublisher
- Singleton service with `CopyOnWriteArrayList<SseEmitter>` subscribers
- `publish(auditLog)` → saves to DB + broadcasts to SSE subscribers
- `subscribe()` → creates new `SseEmitter`, adds to subscriber list
- Dead subscribers auto-removed on IOException

### 3. AuditLog Table (MySQL)
```sql
audit_log
├── id              BIGINT (auto PK)
├── user_id         BIGINT (FK to user_account, nullable)
├── action          VARCHAR(100) — e.g., "POST /api/login"
├── entity_type     VARCHAR(100) — "HTTP_REQUEST", "User", etc.
├── entity_id       BIGINT (nullable)
├── category        ENUM(AUTH, ENDPOINT, DATABASE, SECURITY, USER_ACTION, SYSTEM)
├── log_level       ENUM(INFO, WARN, ERROR, CRITICAL)
├── method          VARCHAR(10) — GET, POST, PUT, DELETE
├── endpoint        VARCHAR(500) — full URL path
├── status_code     INT — HTTP status
├── duration_ms     BIGINT — request processing time
├── ip_address      VARCHAR(45) — client IP
├── user_agent      VARCHAR(500) — browser info
├── request_id      VARCHAR(100) — UUID per request
├── request_params  TEXT — query/body params (nullable)
├── response_summary VARCHAR(500) — truncated response (nullable)
├── old_values      JSON — previous state for updates (nullable)
├── new_values      JSON — new state for updates (nullable)
├── created_at      DATETIME — auto-set on insert
├── INDEX: user_id, category, log_level, method, status_code, created_at, request_id
```

### 4. Query System (JPA Specifications)
```
GET /api/developer/audit?
    category=AUTH&         ← AuditCategory enum
    logLevel=ERROR&        ← AuditLogLevel enum
    method=POST&           ← HTTP method
    action=LOGIN&          ← substring search on action field
    userId=9&              ← exact match on user_id
    from=2026-01-01T00:00:00&
    to=2026-12-31T23:59:59&
    page=0&size=20         ← pagination
```

All filters combine with **AND** logic via JPA Specifications. Default sort: `createdAt DESC` (newest first).

## SSE Realtime Flow

```
1. Frontend toggles "Live" button
2. EventSource connects to GET /api/developer/audit/stream?token=<jwt>
3. JWT filter authenticates via query param (not header)
4. AuditStreamController returns SseEmitter
5. EventPublisher adds emitter to subscriber list
6. Any future API request triggers AuditFilter → publish → broadcast
7. All connected SSE subscribers receive the event
8. Frontend adds new log to top of table
```

**Event format:**
```
event: audit-event
data: {"id":316,"userId":9,"username":"developer","action":"GET /api/developer/feature-flags",...}
```

## Stats Optimization

Before: `findAll()` loaded 10K records 3 times into memory → ~2 seconds
After: SQL aggregate queries → 199ms

```java
@Query("SELECT a.action, COUNT(a) FROM AuditLog a GROUP BY a.action")
List<Object[]> countByActionGrouped();

@Query("SELECT COALESCE(AVG(a.durationMs), 0) FROM AuditLog a WHERE a.durationMs IS NOT NULL")
Double avgDurationMs();
```

## Export

```
GET /api/developer/audit/export?category=AUTH&from=...&to=...&format=csv
```

Returns `byte[]` with `Content-Disposition: attachment` header. Supports CSV and JSON formats. Same filter logic as query endpoint.
