# Errors & Fixes — Every Bug We Hit and How It Was Solved

This document records every error encountered during development, why it happened, and what the fix was. Read this to understand the hard-won lessons.

## Error 1: Spring Security @Component Filter Not Invoked

### Symptom
All API requests returned 401 Unauthorized. Login worked but authenticated endpoints failed.

### Root Cause
**Spring Security 6.5 does NOT auto-register `@Component` filters.** A filter annotated with `@Component` is a servlet filter in Spring's context, but NOT in Spring Security's filter chain.

### What We Tried (8 Approaches, All Failed)
1. `@Component` + constructor injection + `addFilterBefore()` — FAILED
2. `@Component` alone — FAILED  
3. `@Bean` method + field reference — FAILED
4. `addFilterAt()` — FAILED
5. `@Component` + `implements Ordered` + `addFilterBefore()` — FAILED
6. Subagent re-attempting — FAILED
7. Removed `addFilterBefore()` entirely — FAILED
8. Multiple `@Component` beans — FAILED

### The Fix
```java
// SecurityConfig.java
@Bean @Order(Ordered.HIGHEST_PRECEDENCE)
public JwtAuthenticationFilter jwtAuthenticationFilter(JwtService jwtService) {
    return new JwtAuthenticationFilter(jwtService, userDetailsService);
}

public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) {
    http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
}

// JwtAuthenticationFilter.java — Remove @Component entirely
public class JwtAuthenticationFilter extends OncePerRequestFilter { ... }
```

### Key Lesson
**In Spring Security 6.5, filters MUST be `@Bean` methods, NOT `@Component` classes.** The `@Bean` method must be called inside `securityFilterChain()` to trigger CGLIB proxy registration.

---

## Error 2: Hibernate Detached Entity version=null

### Symptom
After fixing the JWT filter, requests returned `Access Denied` with error:
```
PropertyValueException: Detached entity with generated id '9' 
has an uninitialized version value 'null': User.version
```

### Root Cause
The `User` entity has `@Version private Long version` with `nullable = false`. The DataSeeder created users without setting version, so it was null in the DB. When the JWT filter loaded the User entity outside a transaction, it became "detached" with version=null.

### The Fix
```java
// User.java
@Version
@Column(name = "version", nullable = false)
private Long version = 0L;  // ← Default value prevents null
```

### Key Lesson
**Always set default values for `@Version` fields.** Hibernate uses the version to determine if an entity is new or existing — null version on a detached entity causes `PropertyValueException`.

---

## Error 3: @PreAuthorize "Access Denied" with Valid JWT

### Symptom
Login returned 200 + valid token. But all authenticated endpoints returned `AuthorizationDeniedException: Access Denied`.

### Root Cause
Two issues combined:
1. The `User.version = null` error (Error 2) crashed the JWT filter before it could set authentication
2. Even with fixed version, the `@PreAuthorize` check needed proper Spring Security configuration

### The Fix
- Fixed `version` default (Error 2) — JWT filter now runs without crashing
- Added `@EnableMethodSecurity` to SecurityConfig
- Verified `CustomUserDetails.getAuthorities()` returns `ROLE_DEVELOPER` (with `ROLE_` prefix)
- Verified `@PreAuthorize("hasRole('DEVELOPER')")` checks for `ROLE_DEVELOPER`

### Key Lesson
**`hasRole("X")` in Spring Security checks for authority `"ROLE_X"`.** If your authorities return `"DEVELOPER"` (without prefix) and `hasRole("DEVELOPER")` checks for `"ROLE_DEVELOPER"`, you get a mismatch. Always return authorities WITH the `ROLE_` prefix.

---

## Error 4: Blank Developer Portal After Login

### Symptom
After logging in as developer, the portal showed a blank page. Only after refreshing did content appear.

### Root Cause
The auth Zustand store initial state is `status: "idle"`. The developer layout checked `if (status === "loading")` but NOT `"idle"`. So when status was `"idle"` and user was null, the layout returned `null` (blank).

Additionally, the `StoreHydrator` useEffect runs once on mount. After login, `router.push()` navigated before the hydrate effect completed.

### The Fix (Two Parts)
```
Part 1: Developer layout — handle both idle and loading
  if (status === "loading" || status === "idle") → show spinner

Part 2: Login form — immediately hydrate auth store
  storeAuthTokens(response);
  login(responseToSessionUser(response));  // ← sync, before navigation
  router.push(redirectUrl);
```

### Key Lesson
**Zustand store hydration via useEffect is async.** If you navigate before the effect fires, the next page sees stale/empty state. Always hydrate the store synchronously when possible (e.g., in the login handler).

---

## Error 5: Audit Logs 400 Bad Request on Category Filter

### Symptom
```
GET /api/developer/audit?page=0&category=ADMIN&logLevel=INFO → 400 Bad Request
```

### Root Cause
Frontend sent `category=ADMIN` but backend `AuditCategory` enum only has:
`AUTH, ENDPOINT, DATABASE, SECURITY, USER_ACTION, SYSTEM`

`ADMIN` is not a valid enum value — Spring threw `MethodArgumentTypeMismatchException`.

### Additional Mismatches Found
- Frontend log level `DEBUG` → Backend has `INFO, WARN, ERROR, CRITICAL` (no DEBUG)
- Frontend category `API` → Backend has `ENDPOINT` not `API`

### The Fix
Frontend dropdowns updated to match backend enums exactly:
```tsx
<option value="AUTH">Auth</option>
<option value="ENDPOINT">Endpoint</option>
<option value="DATABASE">Database</option>
<option value="SECURITY">Security</option>
<option value="USER_ACTION">User Action</option>
<option value="SYSTEM">System</option>
```

### Key Lesson
**Always validate enum values match between frontend and backend.** A mismatch in enum strings causes 400 errors that are hard to debug from the browser console alone.

---

## Error 6: Audit Logs Filters Were Mutually Exclusive

### Symptom
Selecting category=AUTH AND logLevel=ERROR only filtered by category. Log level was ignored.

### Root Cause
Backend `queryLogs()` used `if/else if` chains — only the FIRST matching filter was applied:
```java
if (userId != null) → findByUserId
else if (category != null) → findByCategory  // ← stops here
else if (logLevel != null) → findByLogLevel  // ← never reached
```

### The Fix
Replaced with JPA Specifications for AND logic:
```java
Specification<AuditLog> spec = (root, query, cb) -> {
    var predicates = new ArrayList<Predicate>();
    if (category != null) predicates.add(cb.equal(root.get("category"), category));
    if (logLevel != null) predicates.add(cb.equal(root.get("logLevel"), logLevel));
    // ... all filters combine with AND
    return cb.and(predicates.toArray(new Predicate[0]));
};
```

### Key Lesson
**Mutually exclusive if/else chains are a common mistake in filter implementations.** JPA Specifications or Criteria API allow combining multiple predicates with AND/OR logic.

---

## Error 7: Audit Logs Oldest First + Slow Loading

### Symptom
Audit page loaded slowly and showed oldest logs first.

### Root Cause
1. `PageRequest.of(page, size)` had no sort — Spring Data defaults to insertion order (oldest first)
2. `getStats()` loaded ALL records into memory 3 times to compute aggregations

### The Fix
```java
// Sort by newest first
PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))

// Stats using SQL aggregates instead of loading all records
@Query("SELECT a.action, COUNT(a) FROM AuditLog a GROUP BY a.action")
List<Object[]> countByActionGrouped();
```

Result: Stats went from ~2 seconds to 199ms.

### Key Lesson
**Never `findAll()` + stream for aggregation.** Use SQL GROUP BY queries. Also, always add explicit sort to paginated endpoints.

---

## Error 8: Audit Logs Growing Indefinitely (Recursive Logging)

### Symptom
Every time developer fetched audit logs, a NEW audit log was created — growing the table with every refresh.

### Root Cause
The `AuditFilter` logged EVERY request except static assets and health checks. This included:
- `GET /api/developer/audit` → creates audit log
- `GET /api/developer/audit/stats` → creates audit log
- `GET /api/developer/monitoring` → creates audit log
- `GET /api/developer/feature-flags` → creates audit log

### The Fix
Selective logging — only record sensitive operations:
```java
// SKIP: read-only GET to audit/monitoring/config
// RECORD: auth events, mutations (POST/PUT/PATCH/DELETE), errors (4xx/5xx)
// RECORD: sensitive reads (admin endpoints, user management)

boolean isSkippedRead = "GET".equals(method) && SKIP_READ_PATHS.stream().anyMatch(uri::startsWith);
boolean isMutation = !"GET".equals(method);
boolean isError = statusCode >= 400;

if (isAuth || isMutation || isError || isSensitiveRead) {
    auditEventPublisher.publish(auditLog);
}
```

### Key Lesson
**Audit logging must be selective.** Logging every request creates infinite bloat. Log only: auth events, mutations, errors, and security-sensitive reads.

---

## Error 9: SSE Stream Not Receiving Events

### Symptom
Frontend connected to SSE endpoint but no events appeared.

### Root Cause
Two issues:
1. Backend SSE broadcast used `event:audit-event` named events
2. Frontend `connectAuditStream()` only listened via `source.onmessage` (catches unnamed events only)

### The Fix
```typescript
// Before (broken)
source.onmessage = (event) => { parse(event.data) };

// After (fixed)
source.addEventListener("audit-event", ((event: MessageEvent) => {
    parse(event.data);
}) as EventListener);
```

### Key Lesson
**`EventSource.onmessage` only catches events WITHOUT a name.** If server sends `event:audit-event`, you must use `addEventListener("audit-event", ...)`.

---

## Error 10: SSE Connection Could Not Authenticate

### Symptom
SSE endpoint returned 403/401 when EventSource connected with `?token=...` query param.

### Root Cause
The JWT filter only checked the `Authorization` header. EventSource cannot set custom headers, so the token in query param was ignored.

### The Fix
```java
// JwtAuthenticationFilter.java
String token = null;

// 1. Check Authorization header
String authHeader = request.getHeader(AUTHORIZATION_HEADER);
if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
    token = authHeader.substring(BEARER_PREFIX.length());
}

// 2. Fallback: check query param (for SSE EventSource)
if (token == null) {
    token = request.getParameter("token");
}
```

### Key Lesson
**EventSource API limitations require server-side workarounds.** Always support token-in-query-param for SSE endpoints that need authentication.

---

## Summary Pattern

Most errors in this project fell into these categories:

| Category | Errors | Example |
|----------|--------|---------|
| Spring Security quirks | #1, #3 | @Component filters, hasRole prefix |
| Hibernate pitfalls | #2 | version=null on detached entities |
| Frontend-backend mismatch | #5 | Enum values, response shapes |
| Async timing | #4, #9 | useEffect hydration, SSE event names |
| Architecture oversights | #6, #7, #8 | Mutual exclusion, missing sort, recursive logging |
| API limitations | #10 | EventSource can't set headers |
