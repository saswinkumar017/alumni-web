# Architecture Decisions — Why We Chose This Way

Every non-obvious choice has a reason. This document explains the "why" behind key decisions.

## Decision 1: Platform Config as Key-Value Store

**What:** Many developer pages (branding, maintenance, auth policies, MFA, themes, notifications, navigation) store settings in `platform_config` table instead of dedicated tables.

**Why:**
- **One API serves all config pages** — `GET/PUT/POST /api/developer/config`
- **No new DB tables** for each setting group — just new key prefixes (`brand.*`, `auth.*`, `mfa.*`, etc.)
- **Change without deployment** — modify any setting via the developer portal
- **Non-technical users** can change settings through the UI

**Tradeoff:**
- Less type safety (values are strings, not typed columns)
- No relational constraints (can't enforce "must have brand.site_name")
- But for a config system, flexibility > strictness

---

## Decision 2: Audit Filter — Selective Logging

**What:** The AuditFilter only records auth events, mutations, errors, and sensitive reads — not every GET request.

**Why:**
- **Prevents recursive bloat** — fetching audit logs creates more audit logs
- **Reduces DB growth** — most reads are read-only and not security-relevant
- **Faster queries** — fewer rows to scan and aggregate

**What's logged vs skipped:**

| Operation | Logged? | Reason |
|-----------|---------|--------|
| `POST /api/login` | Yes | Auth event — security critical |
| `DELETE /api/admin/users/5` | Yes | Mutation — data change |
| `GET /api/developer/audit` | No | Read-only, creates recursive logs |
| `GET /api/developer/monitoring` | No | Read-only, high frequency |
| `GET /api/developer/users` | Yes | Sensitive read — user management |
| Any 4xx/5xx response | Yes | Error — security relevant |

---

## Decision 3: JWT as @Bean, Not @Component

**What:** JwtAuthenticationFilter is instantiated via `@Bean` method in SecurityConfig, not as a `@Component` class.

**Why:**
- **Spring Security 6.5 ignores `@Component` filters** — confirmed across 8 failed attempts
- **`@Bean` method + CGLIB proxy** is the only pattern that works
- The filter must be registered in the security filter chain via `addFilterBefore()`

**What was tried and failed:**
1. `@Component` alone
2. `@Component` + `addFilterBefore()`
3. `@Component` + `implements Ordered`
4. `@Bean` without calling in `securityFilterChain()`
5. Multiple others — all failed

**The only working pattern:**
```java
@Bean @Order(HIGHEST_PRECEDENCE)
public JwtAuthenticationFilter jwtAuthenticationFilter(JwtService jwtService) {
    return new JwtAuthenticationFilter(jwtService, userDetailsService);
}

securityFilterChain(http, jwtFilter) {
    http.addFilterBefore(jwtFilter, ...)
}
```

---

## Decision 4: JPA Specifications for Audit Filters

**What:** Audit log query uses JPA `Specification` API instead of separate repository methods per filter combination.

**Why:**
- **Combined filters need AND logic** — `category=AUTH AND logLevel=ERROR AND method=POST`
- **Repository `findByX` methods** only support single-column queries
- **Specifications compose dynamically** — add/remove predicates without new repository methods

**Before (broken — mutually exclusive):**
```java
if (userId != null) return findByUserId(...);
else if (category != null) return findByCategory(...); // ← ignores other filters
```

**After (working — AND logic):**
```java
Specification<AuditLog> spec = (root, query, cb) -> {
    if (category != null) predicates.add(cb.equal(root.get("category"), category));
    if (logLevel != null) predicates.add(cb.equal(root.get("logLevel"), logLevel));
    return cb.and(predicates.toArray(...));
};
```

---

## Decision 5: SSE over WebSockets for Audit Stream

**What:** Real-time audit logs use Server-Sent Events (SSE) instead of WebSockets.

**Why:**
- **Simpler** — one-way server→client, no handshake complexity
- **Works with Spring Security** — standard HTTP, authentication via query param
- **Auto-reconnect** — EventSource reconnects automatically on disconnect
- **No separate server** — runs on the same Tomcat instance

**Limitation:** EventSource cannot set custom headers, so JWT is passed as `?token=` query param. Server-side JWT filter had to be updated to support this.

---

## Decision 6: Frontend Zustand for Auth State

**What:** Auth state (user, status, role) managed by Zustand store, not React Context.

**Why:**
- **Simpler than Context** — no Provider nesting, no useContext wrapping
- **Works outside components** — `useAuthStore.getState()` for non-React code
- **Selective subscriptions** — components only re-render when their specific slice changes
- **Middleware support** — devtools, persistence (via StoreHydrator)

---

## Decision 7: Light-Only Theme

**What:** No dark mode, no system preference switching. All components are light-only.

**Why:**
- **User explicitly requested** — "Light theme ONLY, no dark mode"
- **Simpler implementation** — no theme switching logic, no `dark:` Tailwind classes
- **Consistent institutional feel** — like jjcet.ac.in
- **Fewer bugs** — no flash of wrong theme on load

---

## Decision 8: Server-Side Form Validation + Client-Side Zod

**What:** Dual validation — Zod schemas on frontend, Jakarta Validation on backend.

**Why:**
- **Defense in depth** — even if frontend validation is bypassed (curl, Postman), backend rejects bad data
- **Better UX** — frontend validates instantly without server round-trip
- **Single source of truth** — Zod schema defines the shape, TypeScript types inferred from it

---

## Decision 9: Selective Audit Logging Categories

**What:** AuditFilter assigns categories based on endpoint pattern, not content analysis.

```java
if (isAuth) return AuditCategory.AUTH;
if (uri.startsWith("/api/admin")) return AuditCategory.SECURITY;
if (uri.startsWith("/api/developer/")) return AuditCategory.USER_ACTION;
if (isMutation) return AuditCategory.DATABASE;
return AuditCategory.ENDPOINT;
```

**Why:**
- **Deterministic** — same URL always gets same category
- **Fast** — string comparison, no content inspection
- **Predictable** — developers know what category an endpoint gets

---

## Decision 10: Branded Types for IDs

**What:** TypeScript uses branded types like `UserId = Brand<string, "UserId">` instead of plain `string`.

**Why:**
- **Compile-time safety** — can't accidentally pass an `EventId` where `UserId` is expected
- **Self-documenting** — function signatures show what kind of ID is needed
- **Zero runtime cost** — branded types vanish after compilation

**Tradeoff:** More verbose code (`as UserId` casts), but catches type mix-ups at compile time.
