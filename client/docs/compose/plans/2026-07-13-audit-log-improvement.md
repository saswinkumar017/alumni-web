# Audit Log Improvement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive, real-time audit logging system that captures all website traffic (HTTP requests, endpoint access, database queries, security events) with structured filtering and live streaming to the developer portal.

**Architecture:** Add a servlet filter for request logging, a JPA interceptor for database query logging, an event-driven audit publisher, and SSE endpoint for real-time streaming. Frontend gets enhanced filters, log categories, and live updates.

**Tech Stack:** Spring Boot 3.5, Servlet Filters, JPA Interceptors, Server-Sent Events (SSE), React 19, TypeScript

---

## Current State Analysis

### What Exists
- `AuditLog` entity: id, user, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent, requestId, createdAt
- `DeveloperAuditController`: GET /api/developer/audit (paginated query), GET /{id} (detail), GET /stats
- `DeveloperAuditServiceImpl`: basic query by userId, action, date range; stats with totalCount, eventsToday, eventsByAction, eventsByEntity
- Frontend audit page: basic table with action/userId/date filters

### What's Missing
- No request logging (HTTP method, URL, status code, response time)
- No endpoint access tracking (which endpoints are hit, how often, latency)
- No database query logging
- No security event logging (failed logins, unauthorized access, CSRF violations)
- No log categories (AUTH, ENDPOINT, DATABASE, SECURITY, USER_ACTION, SYSTEM)
- No log levels (INFO, WARN, ERROR, CRITICAL)
- No risk level classification
- No real-time log streaming
- No export functionality
- Audit log not wired to actual service mutations (services don't create audit entries)

---

## File Structure

### Server Files to Create
- `src/main/java/com/alumniweb/alumniweb/config/AuditFilter.java` — Servlet filter for request logging
- `src/main/java/com/alumniweb/alumniweb/config/DatabaseAuditInterceptor.java` — JPA interceptor for query logging
- `src/main/java/com/alumniweb/alumniweb/service/AuditEventPublisher.java` — Event-driven audit publisher
- `src/main/java/com/alumniweb/alumniweb/controller/AuditStreamController.java` — SSE endpoint for real-time logs

### Server Files to Modify
- `src/main/java/com/alumniweb/alumniweb/model/AuditLog.java` — Add fields: method, statusCode, duration, logLevel, category, endpoint, requestParams
- `src/main/java/com/alumniweb/alumniweb/model/enums/AuditCategory.java` — NEW: AUTH, ENDPOINT, DATABASE, SECURITY, USER_ACTION, SYSTEM
- `src/main/java/com/alumniweb/alumniweb/model/enums/AuditLogLevel.java` — NEW: INFO, WARN, ERROR, CRITICAL
- `src/main/java/com/alumniweb/alumniweb/model/repository/AuditLogRepository.java` — Add query methods
- `src/main/java/com/alumniweb/alumniweb/service/impl/DeveloperAuditServiceImpl.java` — Enhanced stats, export
- `src/main/java/com/alumniweb/alumniweb/controller/DeveloperAuditController.java` — Add export, category filter
- `src/main/resources/db/migration/V3__enhance_audit_log.sql` — Add new columns

### Client Files to Modify
- `src/features/developer/_services/developer-service.ts` — Add export, SSE, category filter
- `src/features/developer/_types/index.ts` — Update AuditLog type
- `src/app/(developer)/developer/audit/page.tsx` — Enhanced filters, categories, export, real-time toggle

---

## Task 1: Enhance AuditLog Entity + Migration

**Files:**
- Create: `src/main/java/com/alumniweb/alumniweb/model/enums/AuditCategory.java`
- Create: `src/main/java/com/alumniweb/alumniweb/model/enums/AuditLogLevel.java`
- Modify: `src/main/java/com/alumniweb/alumniweb/model/AuditLog.java`
- Create: `src/main/resources/db/migration/V3__enhance_audit_log.sql`

- [ ] **Step 1: Create AuditCategory enum**

```java
package com.alumniweb.alumniweb.model.enums;

public enum AuditCategory {
    AUTH,           // Login, logout, password reset, MFA
    ENDPOINT,       // HTTP request/response logging
    DATABASE,       // Query logging, slow queries
    SECURITY,       // CSRF violations, unauthorized access, suspicious activity
    USER_ACTION,    // CRUD operations on business entities
    SYSTEM          // System events, config changes, deployments
}
```

- [ ] **Step 2: Create AuditLogLevel enum**

```java
package com.alumniweb.alumniweb.model.enums;

public enum AuditLogLevel {
    INFO,
    WARN,
    ERROR,
    CRITICAL
}
```

- [ ] **Step 3: Enhance AuditLog entity with new fields**

Add to AuditLog.java:
```java
@Column(name = "category", length = 20)
@Enumerated(EnumType.STRING)
private AuditCategory category;

@Column(name = "log_level", length = 10)
@Enumerated(EnumType.STRING)
@Builder.Default
private AuditLogLevel logLevel = AuditLogLevel.INFO;

@Column(name = "method", length = 10)
private String method;           // GET, POST, PUT, DELETE

@Column(name = "endpoint", length = 500)
private String endpoint;         // /api/developer/users

@Column(name = "status_code")
private Integer statusCode;      // 200, 401, 500

@Column(name = "duration_ms")
private Long durationMs;         // Response time in ms

@Column(name = "request_params", columnDefinition = "TEXT")
private String requestParams;    // Query params, request body summary

@Column(name = "response_summary", length = 500)
private String responseSummary;  // Brief response description
```

- [ ] **Step 4: Create Flyway migration V3**

```sql
ALTER TABLE audit_log
  ADD COLUMN category VARCHAR(20) DEFAULT 'SYSTEM',
  ADD COLUMN log_level VARCHAR(10) DEFAULT 'INFO',
  ADD COLUMN method VARCHAR(10),
  ADD COLUMN endpoint VARCHAR(500),
  ADD COLUMN status_code INT,
  ADD COLUMN duration_ms BIGINT,
  ADD COLUMN request_params TEXT,
  ADD COLUMN response_summary VARCHAR(500);

CREATE INDEX idx_audit_category ON audit_log(category);
CREATE INDEX idx_audit_level ON audit_log(log_level);
CREATE INDEX idx_audit_method ON audit_log(method);
CREATE INDEX idx_audit_status ON audit_log(status_code);
CREATE INDEX idx_audit_duration ON audit_log(duration_ms);
```

- [ ] **Step 5: Update AuditLogRepository with new query methods**

```java
Page<AuditLog> findByCategory(AuditCategory category, Pageable pageable);
Page<AuditLog> findByLogLevel(AuditLogLevel level, Pageable pageable);
Page<AuditLog> findByMethod(String method, Pageable pageable);
Page<AuditLog> findByStatusCode(Integer statusCode, Pageable pageable);
Page<AuditLog> findByCategoryAndAction(AuditCategory category, String action, Pageable pageable);
long countByCategory(AuditCategory category);
long countByLogLevel(AuditLogLevel level);
long countByCreatedAtAfter(LocalDateTime since);
```

---

## Task 2: Request Logging Filter

**Files:**
- Create: `src/main/java/com/alumniweb/alumniweb/config/AuditFilter.java`

- [ ] **Step 1: Create servlet filter that logs every HTTP request**

```java
@Component
@Order(1)
public class AuditFilter implements Filter {

    private final AuditEventPublisher auditPublisher;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
        HttpServletRequest httpReq = (HttpServletRequest) request;
        HttpServletResponse httpRes = (HttpServletResponse) response;

        long startTime = System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString();

        // Set request ID for correlation
        httpReq.setAttribute("requestId", requestId);
        httpRes.setHeader("X-Request-Id", requestId);

        try {
            chain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            int status = httpRes.getStatus();
            String method = httpReq.getMethod();
            String uri = httpReq.getRequestURI();

            // Skip static assets and health checks
            if (!uri.startsWith("/_next") && !uri.startsWith("/swagger")
                && !uri.equals("/api/health")) {

                AuditLogLevel level = status >= 500 ? AuditLogLevel.ERROR
                    : status >= 400 ? AuditLogLevel.WARN
                    : AuditLogLevel.INFO;

                AuditCategory category = uri.startsWith("/api/developer") ? AuditCategory.ENDPOINT
                    : uri.startsWith("/api/auth") || uri.contains("/login") ? AuditCategory.AUTH
                    : AuditCategory.ENDPOINT;

                auditPublisher.publish(AuditLog.builder()
                    .action(method + " " + uri)
                    .category(category)
                    .logLevel(level)
                    .method(method)
                    .endpoint(uri)
                    .statusCode(status)
                    .durationMs(duration)
                    .ipAddress(getClientIp(httpReq))
                    .userAgent(httpReq.getHeader("User-Agent"))
                    .requestId(requestId)
                    .requestParams(sanitizeParams(httpReq))
                    .build());
            }
        }
    }
}
```

- [ ] **Step 2: Register filter in SecurityConfig**

Add `@Autowired private AuditFilter auditFilter;` and register it before the JWT filter.

---

## Task 3: Audit Event Publisher (Event-Driven)

**Files:**
- Create: `src/main/java/com/alumniweb/alumniweb/service/AuditEventPublisher.java`

- [ ] **Step 1: Create publisher that saves to DB and broadcasts via SSE**

```java
@Service
public class AuditEventPublisher {

    private final AuditLogRepository auditLogRepository;
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public void publish(AuditLog auditLog) {
        // Save to database
        auditLogRepository.save(auditLog);

        // Broadcast to SSE subscribers
        broadcast(auditLog);
    }

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L); // No timeout
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        return emitter;
    }

    private void broadcast(AuditLog log) {
        AuditLogResponse response = toResponse(log);
        List<SseEmitter> deadEmitters = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                    .name("audit-log")
                    .data(response));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }
        emitters.removeAll(deadEmitters);
    }
}
```

---

## Task 4: SSE Endpoint for Real-Time Logs

**Files:**
- Create: `src/main/java/com/alumniweb/alumniweb/controller/AuditStreamController.java`

- [ ] **Step 1: Create SSE endpoint**

```java
@RestController
@RequestMapping("/api/developer/audit")
@PreAuthorize("hasRole('DEVELOPER')")
public class AuditStreamController {

    private final AuditEventPublisher auditEventPublisher;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return auditEventPublisher.subscribe();
    }
}
```

---

## Task 5: Enhanced Audit Service + Controller

**Files:**
- Modify: `src/main/java/com/alumniweb/alumniweb/service/impl/DeveloperAuditServiceImpl.java`
- Modify: `src/main/java/com/alumniweb/alumniweb/controller/DeveloperAuditController.java`

- [ ] **Step 1: Enhance queryLogs to support category, logLevel, method filters**

Update the service to accept new filter parameters and use the new repository methods.

- [ ] **Step 2: Add export endpoint**

```java
@GetMapping("/export")
public ResponseEntity<byte[]> exportLogs(
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String action,
        @RequestParam(required = false) String from,
        @RequestParam(required = false) String to,
        @RequestParam(defaultValue = "csv") String format) {
    // Query all matching logs (no pagination)
    // Convert to CSV or JSON
    // Return as download
}
```

- [ ] **Step 3: Enhance stats to include category breakdown, response time stats, error rate**

---

## Task 6: Wire Audit Logging to Service Mutations

**Files:**
- Modify: All `*ServiceImpl.java` files

- [ ] **Step 1: Inject AuditEventPublisher into each service**

- [ ] **Step 2: Add audit logging after each mutation**

Example in `AdminServiceImpl`:
```java
auditPublisher.publish(AuditLog.builder()
    .user(currentUser)
    .action("APPROVE_REQUEST")
    .category(AuditCategory.USER_ACTION)
    .logLevel(AuditLogLevel.INFO)
    .entityType("Request")
    .entityId(requestId)
    .oldValues("{\"status\":\"PENDING\"}")
    .newValues("{\"status\":\"APPROVED\"}")
    .build());
```

---

## Task 7: Frontend — Enhanced Audit Page

**Files:**
- Modify: `src/features/developer/_services/developer-service.ts`
- Modify: `src/features/developer/_types/index.ts`
- Modify: `src/app/(developer)/developer/audit/page.tsx`

- [ ] **Step 1: Update AuditLog type to match enhanced entity**

```typescript
export interface AuditLog {
  id: number;
  userId?: number;
  username?: string;
  action: string;
  category?: string;      // AUTH, ENDPOINT, DATABASE, SECURITY, USER_ACTION, SYSTEM
  logLevel?: string;      // INFO, WARN, ERROR, CRITICAL
  entityType?: string;
  entityId?: number;
  method?: string;         // GET, POST, PUT, DELETE
  endpoint?: string;       // /api/developer/users
  statusCode?: number;     // 200, 401, 500
  durationMs?: number;     // Response time
  ipAddress?: string;
  userAgent?: string;
  riskLevel?: string;
  requestParams?: string;
  responseSummary?: string;
  oldValues?: string;
  newValues?: string;
  createdAt: string;
}
```

- [ ] **Step 2: Add service functions for export and category filter**

```typescript
export function getAuditLogs(filters: {
  page?: number; action?: string; userId?: number;
  from?: string; to?: string; category?: string;
  logLevel?: string; method?: string; statusCode?: number;
} = {}) { ... }

export function exportAuditLogs(filters: { category?: string; from?: string; to?: string; format?: string }) {
  return apiFetch(`/developer/audit/export?${params}`, { ... });
}

export function connectAuditStream(): EventSource {
  const token = localStorage.getItem("accessToken");
  return new EventSource(`${API_BASE}/developer/audit/stream?token=${token}`);
}
```

- [ ] **Step 3: Rebuild audit page with:**

- **Category filter** (dropdown: All, Auth, Endpoint, Database, Security, User Action, System)
- **Log level filter** (dropdown: All, Info, Warn, Error, Critical)
- **Method filter** (dropdown: All, GET, POST, PUT, DELETE, PATCH)
- **Status code filter** (input: specific status code)
- **Action filter** (existing)
- **User ID filter** (existing)
- **Date range filter** (existing, with proper datetime format)
- **Real-time toggle** (enable/disable SSE streaming)
- **Export button** (CSV/JSON download)
- **Enhanced table** with columns: Time, Category (color badge), Level (badge), Action, Method, Endpoint, Status (colored), Duration (ms), User, IP
- **Click row** to expand and show old/new values, user agent, request params
- **Stats cards** at top: Total events, Events today, Error rate, Avg response time
- **Auto-refresh** every 30 seconds when real-time is off

---

## Task 8: Frontend — Real-Time Log Stream

**Files:**
- Modify: `src/app/(developer)/developer/audit/page.tsx`

- [ ] **Step 1: Add SSE connection with toggle**

```typescript
const [realTime, setRealTime] = useState(false);
const [liveLogs, setLiveLogs] = useState<AuditLog[]>([]);

useEffect(() => {
  if (!realTime) return;
  const eventSource = connectAuditStream();
  eventSource.onmessage = (event) => {
    const log = JSON.parse(event.data);
    setLiveLogs((prev) => [log, ...prev].slice(0, 100)); // Keep last 100
  };
  return () => eventSource.close();
}, [realTime]);
```

- [ ] **Step 2: Merge live logs with fetched logs when real-time is on**

- [ ] **Step 3: Add visual indicator for live connection status (green dot when connected)**

---

## Task 9: Final Verification

- [ ] **Step 1: Run Flyway migration V3**
- [ ] **Step 2: Restart backend server**
- [ ] **Step 3: Verify audit logs are created for login, feature flag toggle, role create**
- [ ] **Step 4: Verify request logging filter captures all API calls**
- [ ] **Step 5: Verify SSE streaming works (open audit page, toggle real-time, perform action in another tab)**
- [ ] **Step 6: Verify export downloads CSV/JSON**
- [ ] **Step 7: Verify all filters work (category, level, method, action, user, date)**
- [ ] **Step 8: Verify stats cards show correct numbers**

---

## Audit Log Categories

| Category | What It Captures | Example Actions |
|----------|-----------------|-----------------|
| **AUTH** | Authentication events | LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_RESET, MFA_VERIFY |
| **ENDPOINT** | HTTP request/response | GET /api/developer/users, POST /api/developer/roles |
| **DATABASE** | Query patterns | SLOW_QUERY, QUERY_ERROR |
| **SECURITY** | Security events | UNAUTHORIZED_ACCESS, CSRF_VIOLATION, RATE_LIMIT, SUSPICIOUS_ACTIVITY |
| **USER_ACTION** | Business operations | CREATE_USER, UPDATE_ROLE, APPROVE_REQUEST, DELETE_FEATURE_FLAG |
| **SYSTEM** | System events | CONFIG_CHANGE, MAINTENANCE_MODE, FEATURE_FLAG_TOGGLE |

## Audit Log Levels

| Level | When | Color |
|-------|------|-------|
| **INFO** | Normal operations | Blue |
| **WARN** | Slow responses (>2s), rate limits | Yellow |
| **ERROR** | 4xx/5xx responses, failed operations | Orange |
| **CRITICAL** | Security violations, data breaches | Red |

## Real-Time Architecture

```
Browser (SSE) ←── AuditStreamController ←── AuditEventPublisher ←── AuditFilter
                                                                    ←── Service mutations
                                                                    ←── Security events
```

- `AuditFilter` captures every HTTP request → publishes to `AuditEventPublisher`
- Service methods publish business events → `AuditEventPublisher`
- `AuditEventPublisher` saves to DB + broadcasts to all SSE subscribers
- Frontend `EventSource` receives real-time updates
