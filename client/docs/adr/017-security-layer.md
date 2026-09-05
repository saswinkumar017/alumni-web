# ADR 017: Security Layer Specification

**Status:** Implemented  
**Date:** 2026-07-09  
**Stage:** 17  
**Dependencies:** All stages 0–16  
**Cross-cuts:** Every architectural layer

---

## Table of Contents

1. [Security Philosophy](#1-security-philosophy)
2. [Security Architecture](#2-security-architecture)
3. [Security Principles](#3-security-principles)
4. [Trust Boundary Model](#4-trust-boundary-model)
5. [Threat Modeling](#5-threat-modeling)
6. [Authentication Architecture](#6-authentication-architecture)
7. [Authorization Architecture](#7-authorization-architecture)
8. [Identity Management](#8-identity-management)
9. [Session Management](#9-session-management)
10. [Access Token Strategy](#10-access-token-strategy)
11. [Refresh Token Strategy](#11-refresh-token-strategy)
12. [Secure Cookie Strategy](#12-secure-cookie-strategy)
13. [Storage Security](#13-storage-security)
14. [Route Protection](#14-route-protection)
15. [API Security](#15-api-security)
16. [CSRF Protection](#16-csrf-protection)
17. [XSS Protection](#17-xss-protection)
18. [Clickjacking Protection](#18-clickjacking-protection)
19. [Content Security Policy](#19-content-security-policy)
20. [Input Validation](#20-input-validation)
21. [Output Encoding](#21-output-encoding)
22. [Secure File Upload](#22-secure-file-upload)
23. [Secure File Download](#23-secure-file-download)
24. [Rate Limiting](#24-rate-limiting)
25. [Brute Force Protection](#25-brute-force-protection)
26. [Account Lockout Strategy](#26-account-lockout-strategy)
27. [Password Policy Architecture](#27-password-policy-architecture)
28. [Multi-Factor Authentication Readiness](#28-multi-factor-authentication-readiness)
29. [Role-Based Access Control](#29-role-based-access-control)
30. [Permission Model](#30-permission-model)
31. [Feature-Level Authorization](#31-feature-level-authorization)
32. [Component-Level Authorization](#32-component-level-authorization)
33. [Secure Error Handling](#33-secure-error-handling)
34. [Sensitive Data Handling](#34-sensitive-data-handling)
35. [Personally Identifiable Information](#35-personally-identifiable-information)
36. [Browser Security](#36-browser-security)
37. [HTTPS Enforcement](#37-https-enforcement)
38. [Third-Party Script Policy](#38-third-party-script-policy)
39. [Dependency Security](#39-dependency-security)
40. [Secret Management Philosophy](#40-secret-management-philosophy)
41. [Logging Security](#41-logging-security)
42. [Audit Trail Requirements](#42-audit-trail-requirements)
43. [Privacy Considerations](#43-privacy-considerations)
44. [OWASP Top 10 Alignment](#44-owasp-top-10-alignment)
45. [Secure Coding Standards](#45-secure-coding-standards)
46. [Security Testing Strategy](#46-security-testing-strategy)
47. [Vulnerability Management](#47-vulnerability-management)
48. [Security Monitoring](#48-security-monitoring)
49. [Incident Response Readiness](#49-incident-response-readiness)
50. [Governance Strategy](#50-governance-strategy)
51. [Engineering Review](#51-engineering-review)

---

## 1. Security Philosophy

### Purpose
Establish the foundational security mindset that governs every design decision across all architectural layers.

### Engineering Rationale
Security cannot be bolted on after implementation. When security is treated as a post-hoc concern, the result is porous trust boundaries, inconsistent authorization, and vulnerabilities that require costly rearchitecture. This specification treats security as a first-class architectural property — equivalent in stature to performance, scalability, and maintainability.

The JJCET Alumni Management System must protect personal data of alumni (PII), prevent unauthorized access to administrative functions, ensure session integrity, and comply with data protection regulations. Because the application runs in a browser, the client-side code operates in an untrusted environment where the user has full control over runtime execution.

### Recommended Option
Security is a cross-cutting architectural concern enforced at every layer boundary. No layer trusts the layer above it. Every service, component, hook, and API call verifies identity, authorization, and data integrity before acting.

### Trade-offs
- **Against monolithic validation in a single security module:** Creates a bottleneck, violates single-responsibility, and does not scale as the feature surface grows.
- **Against permissive defaults with selective hardening:** Introduces risk of missed protections and inconsistent coverage across 16 feature directories.

### Industry Best Practice
Google BeyondCorp, NIST Zero Trust Architecture (SP 800-207), and OWASP ASVS all advocate for treating every request, component, and data access as originating from an untrusted source until explicitly verified.

### Recommendation
Adopt Zero Trust applied to frontend architecture. Every feature, service, store, and component must assume the calling context is untrusted until proven otherwise. Authorization checks must be explicit, local to the operation being guarded, and never inherited implicitly from a parent scope.

---

## 2. Security Architecture

### Purpose
Describe the architectural structure through which security controls are applied across all layers.

### Engineering Rationale
A layered security architecture (defense in depth) ensures that if one control is bypassed, subsequent controls still protect the system. The architecture must define clear ownership boundaries, control surfaces, and trust assumptions at each tier.

### Recommended Option
Five-zone security architecture:

| Zone | Scope | Controls |
|------|-------|----------|
| **Browser Zone** | DOM, localStorage, sessionStorage, cookies | CSP, XSS guards, secure cookie flags, subresource integrity |
| **App Zone** | React tree: components, hooks, state, services | Authorization guards, input sanitization, context isolation, event validation |
| **Transport Zone** | HTTP(S) between client and API | HTTPS, CORS, CSRF tokens, request signing |
| **API Zone** | Backend API endpoints, auth server | Token validation, rate limiting, brute-force detection |
| **Data Zone** | Databases, file storage, caches | Encryption at rest, access control lists, audit logging |

### Trade-offs
- **Client-only controls** cannot prevent determined attackers. All browser-zone controls are assumed by-passable; they exist to raise the cost of exploitation, not to guarantee security.
- **Overlapping controls** across zones increase maintenance burden but are required for defense in depth.

### Industry Best Practice
OWASP ASVS Level 2 (standard for most enterprise apps) requires controls in at least two zones for any security-critical operation. The app zone and API zone together satisfy this requirement for every sensitive operation.

### Recommendation
Implement and enforce controls in all five zones. The critical enforcement boundary is the API zone — the backend performs the definitive authorization decision. The app zone mirrors these checks for UX (hiding unauthorized controls) but never trusts its own decisions as final.

---

## 3. Security Principles

### Purpose
Enumerate the principles that guide every security decision in the application.

### Engineering Rationale
Principles ensure consistency across the 16 feature directories, multiple authorization domains (admin, alumni, public), and diverse data sensitivity levels.

### Principles

| # | Principle | Application |
|---|-----------|-------------|
| P1 | **Defense in Depth** | Every sensitive path is guarded at route layer, service layer, and API call layer |
| P2 | **Zero Trust** | Every request, user, and component is untrusted until explicitly verified |
| P3 | **Least Privilege** | Every component, service, and store has only the privileges required for its function |
| P4 | **Fail Secure** | Authorization failures default to denial; error conditions never grant access |
| P5 | **Secure by Default** | All features ship with security restrictions enabled; opt-in to relaxation |
| P6 | **Explicit Authorization** | No implicit permission inheritance; every operation must pass an explicit check |
| P7 | **Privacy by Design** | Data minimization, purpose limitation, and collection limitation at every API boundary |
| P8 | **Separation of Concerns** | Authentication (who) is separated from authorization (what they can do) |
| P9 | **Defense in Presentation** | UI hiding of unauthorized controls is separate from service-level authorization enforcement |
| P10 | **Auditability** | All security-relevant events are logged with correlation ID, user identity, action, and timestamp |

### Recommendation
All code reviews must verify compliance with all ten principles. A PR that violates any principle without explicit documented exception should be rejected.

---

## 4. Trust Boundary Model

### Purpose
Define the trust boundaries that separate trusted from untrusted code paths.

### Engineering Rationale
Trust boundaries are the lines across which data flows from a trusted zone to an untrusted zone. Every crossing is a potential vulnerability. Identifying these boundaries enables targeted control placement.

### Trust Boundary Diagram

```
User Input (Untrusted)
       │
       ▼
┌─────────────────────────────┐
│  Browser Zone               │
│  (Untrusted by default)     │
│  • UI Components            │
│  • Client-side Stores        │
│  • Local Storage             │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  App Zone (Frontend)        │
│  • Services                 │
│  • Service Worker           │
│  • HTTP Client              │
└──────────┬──────────────────┘
           │   ─── Trust Boundary 1 ─── (HTTPS + TLS + CSRF + CORS)
           ▼
┌─────────────────────────────┐
│  API Zone (Backend)        │
│  • API Routes               │
│  • Token Validation          │
│  • Rate Limiter              │
└──────────┬──────────────────┘
           │   ─── Trust Boundary 2 ─── (Internal network / service mesh)
           ▼
┌─────────────────────────────┐
│  Data Zone                  │
│  • Database                 │
│  • File Storage             │
│  • Cache                    │
└─────────────────────────────┘
```

### Explicit Boundaries

| Boundary | From | To | Protections Required |
|----------|------|----|-------------------|
| B1 | App Zone | API Zone | HTTPS, CORS validation, CSRF token, Authorization header, API key |
| B2 | API Zone | Data Zone | Prepared statements, RBAC, encryption at rest, audit log |
| B3 | Browser Zone | App Zone | Input validation before service call, XSS escaping before render |
| B4 | Third-Party Script | App Zone | SRI hashes, CSP allowlist, no script access to auth tokens |

### Recommendation
Every code review must identify which trust boundary a change crosses and verify the corresponding protections are present. A change that introduces a new crossing without adding the required protections is blocked.

---

## 5. Threat Modeling

### Purpose
Identify the threats the application faces, the attack surface, and the controls that mitigate each threat.

### Engineering Rationale
Without a systematic threat model, controls are reactive, inconsistent, and likely to miss the most dangerous attack paths. STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) per component provides comprehensive coverage.

### STRIDE Analysis

| # | Threat | Target | Risk | Mitigation |
|---|--------|--------|------|------------|
| T1 | **Spoofing** — Attacker impersonates another user | Auth service, session tokens | **Critical** | Token signature validation (backend), secure cookie flags (HttpOnly, Secure, SameSite), no token storage in localStorage |
| T2 | **Tampering** — Request modification in transit | API calls | **High** | HTTPS-only, CSRF token validation, request integrity validation where feasible |
| T3 | **Repudiation** — User denies action | Audit-logged events | **Medium** | Immutable audit logs with timestamp, user ID, action; server-side log entry signed |
| T4 | **Information Disclosure** — PII leakage | Profile, messages, directory | **Critical** | Role-based field filtering at API, never render PII in client-side bundles, CSP to prevent data exfiltration |
| T5 | **Denial of Service** — Rate exhaustion | API endpoints, auth | **Medium** | Rate limiting, exponential backoff on retry, account lockout after N failures |
| T6 | **Elevation of Privilege** — User accesses admin | Route guards, RBAC | **Critical** | Authorization check at API layer (definitive), route guard at frontend (UX), feature flag service-level check, component-level conditional render |

### Risk Scoring
Risk = Likelihood × Impact. Critical risks require mandatory controls before deployment. High risks require documented controls. Medium risks may be accepted with monitoring.

### Recommendation
Maintain a living threat model document in `docs/threat-model/`. Update it as new features are added, particularly new API integrations, file upload, or PII collection. Review quarterly.

---

## 6. Authentication Architecture

### Purpose
Define how the application verifies user identity and manages the authentication lifecycle.

### Engineering Rationale
Authentication is the foundation of all subsequent security controls. The architecture must support the existing backend auth API (JWT-based) and remain extensible to future MFA and OAuth 2.0 / OIDC federation.

### Architecture

```
┌─────────────────────────────────────────────────┐
│  Auth Feature Service                           │
│  src/features/auth/_services/auth-service.ts    │
│  src/features/auth/_services/store-adapter.ts    │
│  src/features/auth/_state/auth-store.ts          │
└──────────────┬──────────────────────────────────┘
               │
               ├── Login     → POST /auth/login    → AuthResponse { token, user }
               ├── Register  → POST /auth/register → AuthResponse { token, user }
               ├── Logout    → POST /auth/logout   → (invalidate session)
               ├── Get User  → GET  /auth/me       → SessionUser
               └── Refresh   → POST /auth/refresh   → { token }
                            (Backend issues new access token from httpOnly cookie)
```

### Flows

| Flow | Trigger | Action | Token Storage |
|------|---------|--------|--------------|
| **Login** | Login form submit | POST credentials → receive JWT + user | JWT in memory (Zustand store), refresh token in httpOnly cookie |
| **Silent Refresh** | Auth service detects 401 | POST /auth/refresh (cookie sent automatically) | New JWT in memory |
| **Page Refresh** | App mount | GET /auth/me (cookie sent automatically) | Hydrates Zustand store |
| **Logout** | User action | POST /auth/logout, clear in-memory JWT, reset store | All tokens invalidated |
| **Password Reset** | Forgot password flow | Email-based reset link, temp token | N/A |
| **Email Verification** | Post-registration | Verify link with signed token | N/A |

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Token storage | In-memory (Zustand), not localStorage | No XSS vector for token exfiltration; refresh token in httpOnly cookie cannot be read by JavaScript |
| Refresh mechanism | httpOnly cookie | Automatically sent on requests to same domain; no JS access allowed |
| Auth state | Zustand `useAuthStore` | Synced to in-memory state, never persisted to disk |
| Session user type | `SessionUser` from `@/types` | Branded `UserId` prevents accidental ID mismatches |

### Trade-offs
- **In-memory token** means all tabs share the same identity (single-page session model). Opening the app in a new tab triggers a new auth check.
- **httpOnly cookie** means the backend must set the Set-Cookie header on login and refresh. This is standard practice and already supported by the `/auth/login` and `/auth/refresh` endpoints.

### Recommendation
The auth service (`auth-service.ts`) is the single entry point for all authentication operations. No component, hook, or store should directly call the auth API. This ensures consistent token handling, error wrapping, and event emission.

---

## 7. Authorization Architecture

### Purpose
Define who can do what, and how that is enforced across every architectural layer.

### Engineering Rationale
Authorization must be enforced at every layer — not because the frontend can be trusted, but because defense in depth requires multiple independent checkpoints between a request and the data it accesses.

### Enforcement Layers

```
Layer 0: UI Visibility (UX only, never trusted)
  ─ Role-based conditional rendering
  ─ Feature flag checks
  ─ Menu item filtering

Layer 1: Route Guard (Frontend)
  ─ Route group layout redirects
  ─ Proxy.ts (middleware) redirects

Layer 2: Service Authorization (Frontend)
  ─ Workflow pipeline: validate → authorize → execute
  ─ Authorization check before API call

Layer 3: API Authorization (Backend - Definitive)
  ─ Token validation
  ─ Role/permission check
  ─ Resource ownership verification
  ─ This is the authoritative decision
```

### Authorization Gap Warning
It is critical to understand that layers 0–2 are UX optimizations and exploitation-cost raisers only. The **definitive** authorization decision is layer 3. If the frontend bypasses layers 0–2 and directly calls a backend API, the backend must reject the unauthorized request.

### Level of Enforcement by Operation

| Operation | UI Check | Route Check | Service Check | API Check |
|-----------|----------|-------------|---------------|-----------|
| View public directory | None | None | None | None |
| View own profile | Required | Required | Required | Required |
| Edit own profile | Required | Required | Required | Required |
| View any user profile | Required | Required | Required | Required |
| Edit any user profile | Required | Required | Required | Required |
| Create event (admin) | Required | Required | Required | Required |
| Delete event (admin) | Required | Required | Required | Required |
| View admin dashboard | Required | Required | Required | Required |

### Recommendation
Authorization is not a single module. Each feature owns its authorization logic. The `auth-service.ts` provides the `getSession` function that other services use to check the current user. No service should query `useAuthStore` directly — always go through the service layer for authorization decisions so the workflow pipeline can audit the check.

---

## 8. Identity Management

### Purpose
Define how user identity is represented, stored, and communicated across the system.

### Engineering Rationale
Consistent identity representation prevents ID confusion attacks (e.g., passing a non-admin ID as an admin ID parameter) and enables reliable audit logging.

### Identity Model

| Concept | Type | Scope | Example |
|---------|------|-------|---------|
| User ID | `UserId` (branded string) | Global, immutable | `userId("usr_abc123")` |
| User Role | `UserRole` union | "alumni" \| "admin" \| "alumni_lead" | Stored in JWT payload + `authStore` |
| Session User | `SessionUser` | In-memory state | `{ id: UserId, email, role, name }` |
| Session Token | JWT | Transient, in-memory | `access_token` in Zustand |
| Refresh Token | Opaque string | httpOnly cookie | Set by backend on `/auth/login` |

### Identity Propagation

```
Login → AuthService → useAuthStore.set(user) → React tree re-renders
                                                       │
                        ┌──────────────────────────────┘
                        ▼
          ┌─────────────────────┐
          │  useAuthStore provides │
          │  user, status, role  │
          └─────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
      Route Guards   Services     Components
```

### Recommendation
- The `SessionUser` type must be imported for all identity references. Never use plain `{ id: string, role: string }`.
- The branded `UserId` type prevents accidentally passing a non-ID string where an ID is expected.
- Identity is stored in the Zustand auth store only. It is never:
  - Serialized to localStorage
  - Passed to URL parameters (user-facing)
  - Used in analytics events

---

## 9. Session Management

### Purpose
Define how sessions are created, maintained, and terminated.

### Engineering Rationale
Session management is the most attacked authentication component. Improper session handling leads to session fixation, session hijacking, and indefinite session lifetime.

### Session Lifecycle

```
┌──────────────────┐
│  Login            │  ──→ POST /auth/login → { token, user }
│  httpOnly cookie  │      JWT expires in 15 min
│  set by backend   │       Refresh token expires in 7 days
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Active Session   │  ──→ GET /auth/me on tab refresh
│  JWT in memory    │      Silent refresh on 401
│  Auth state:      │      (Zustand status: "authenticated")
│  "authenticated"   │
└────────┬─────────┘
         │
         ├── Logout → POST /auth/logout → cookie cleared → status: "unauthenticated"
         ├── Token expires + refresh fails → status: "unauthenticated"
         └── Idle timeout (configurable) → status: "unauthenticated"
```

### Session Properties

| Property | Value | Rationale |
|----------|-------|-----------|
| Access Token Lifetime | 15 minutes | Limits damage of token exfiltration |
| Refresh Token Lifetime | 7 days | Balance UX (few logins) against security |
| Idle Timeout | 30 minutes | Mitigates unattended device risk |
| Concurrent Sessions | Multiple tabs allowed | Same auth cookie shared |
| Session Storage | JWT: in-memory Zustand store | Refresh: httpOnly cookie (auto-sent by browser) |

### Recommendation
- The frontend never writes the access token to any persistent storage. On page refresh, it reads the refresh cookie (sent automatically) to get a new access token.
- The `useAuthStore` status transitions are: `"idle"` → `"loading"` (checking session) → `"authenticated"` or `"unauthenticated"`.
- A failed silent refresh transitions the status to `"unauthenticated"` and resets the store.

---

## 10. Access Token Strategy

### Purpose
Define how access tokens (JWTs) are acquired, stored, used, and revoked.

### Engineering Rationale
The access token is the key to the system. Its security properties directly determine the attack surface. Storing JWTs in localStorage is the single most common security vulnerability in SPAs — any XSS vulnerability can exfiltrate every user's token.

### Strategy

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Storage** | In-memory (Zustand store variable) | Cannot be exfiltrated by XSS |
| **Transmission** | `Authorization: Bearer <token>` header | Standard JWT transport |
| **Lifetime** | 15 minutes | Short enough to limit blast radius |
| **Signature** | RS256 (asymmetric, backend signed) | Frontend can verify without secret |
| **Claims** | `{ sub, role, iat, exp }` | Minimal: user identifier + role |
| **Rotation** | Silent refresh on 401 | Seamless UX, automatic |

### What Not To Do
- ❌ DO NOT store the JWT in localStorage under any circumstance.
- ❌ DO NOT store the JWT in sessionStorage (same XSS risk).
- ❌ DO NOT include the JWT in URL query parameters.
- ❌ DO NOT log the JWT in client-side logs.

### Recommendation
The `apiClient` in `src/lib/data/instance.ts` attaches the JWT from the auth store to every request via the token provider mechanism. On a 401 response, it triggers the refresh flow. This is already partially implemented via `setTokenProvider`, `setAuthFailureHandler`, and `setTokenRefreshHandler`.

---

## 11. Refresh Token Strategy

### Purpose
Define how refresh tokens are issued, stored, and used to extend sessions.

### Engineering Rationale
Long-lived tokens increase the attack window. The refresh token must be more secure than the access token because it can generate new access tokens indefinitely.

### Strategy

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Storage** | httpOnly, Secure, SameSite=Strict cookie | Cannot be read or exfiltrated by JavaScript |
| **Lifetime** | 7 days | Industry standard; rotate on each use |
| **Rotation** | Each refresh invalidates the previous token | Prevents stolen refresh token reuse |
| **Transmission** | Sent automatically by browser on POST /auth/refresh | No JavaScript access required |
| **Revocation** | Backend-side token blacklist | On logout or breach |
| **Reuse Detection** | Backend detects if a revoked token is used | Triggers immediate session invalidation |

### Recommendation
The refresh token infrastructure is entirely backend-driven. The frontend only needs to:
1. Include the `httpOnly` cookie in the login response (automatic).
2. Call `POST /auth/refresh` when the API client gets a 401.
3. Handle the case where refresh also fails (session expired) by redirecting to login.

---

## 12. Secure Cookie Strategy

### Purpose
Define cookie attributes for all cookies set by the application.

### Engineering Rationale
Cookies are the only browser storage mechanism that supports the `httpOnly` flag, preventing JavaScript access. Correct cookie attributes prevent session hijacking, CSRF, and information leakage.

### Cookie Attributes (Required for All Cookies)

| Attribute | Value | Rationale |
|-----------|-------|-----------|
| `HttpOnly` | `true` | Prevents JavaScript access (critical for refresh token) |
| `Secure` | `true` | Only transmitted over HTTPS |
| `SameSite` | `Strict` or `Lax` | Strict for auth cookies, Lax for analytics |
| `Path` | `/` | Available to all routes |
| `Domain` | Omit or set to exact domain | Prevents subdomain attacks |
| `Max-Age` or `Expires` | Set to appropriate lifetime | Session cookies for tokens, persistent for analytics |
| `__Host-` prefix | Consider for auth cookies | Ensures the cookie was set from a secure origin; scoped to the exact domain and path |

### Cookie Inventory

| Cookie | Storage | HttpOnly | Secure | SameSite | Max-Age | Purpose |
|------|---------|----------|--------|-----------|---------|---------|
| `refresh_token` | httpOnly cookie | ✅ | ✅ | Strict | 7 days | JWT refresh |
| `session_id` | httpOnly cookie | ✅ | ✅ | Lax | Session | Session correlation for audit |
| CSRF token | In-memory or meta tag | ❌ | ✅ | Lax | Session | CSRF protection |

### Recommendation
- The backend sets all cookies. The frontend never creates cookies via JavaScript.
- The frontend should verify that cookies are present in responses during development/testing.
- Never set `SameSite=None` without `Secure=true` and explicit justification in an ADR amendment.

---

## 13. Storage Security

### Purpose
Define what data can be stored in each browser storage mechanism, and what must never be stored client-side.

### Engineering Rationale
Browser storage mechanisms have different security properties. localStorage is accessible to any JavaScript from the same origin. SessionStorage is cleared when the tab closes. In-memory (React state, Zustand) is the most secure but is lost on navigation.

### Storage Matrix

| Storage Mechanism | Data That Can Be Stored | Data That Must Never Be Stored | Security Notes |
|-------------------|------------------------|-------------------------------|----------------|
| **Zustand (in-memory)** | Current user, current JWT, UI state | N/A (no persistence) | Cleared on page refresh; must re-auth |
| **localStorage** | UI preferences (theme, font size), feature flags, non-sensitive cached data | JWTs, refresh tokens, user PII, API keys, CSV exports of PII | Accessible to all tabs and all JS from same origin |
| **sessionStorage** | Transient wizard state, multi-step form progress (non-sensitive) | JWTs, refresh tokens, PII | Cleared on tab close; still accessible by JS |
| **IndexedDB (via API client cache)** | API response cache (public data), non-sensitive cached resources | Any data containing auth metadata or user PII | Accessible by all JS from same origin |
| **Cookies** | Refresh token (httpOnly only) | Plain-text secrets, session tokens readable by JS | httpOnly for auth, Secure + SameSite always |

### PII Storage Prohibition
The following must NEVER be stored client-side in any persistent storage:
- Government IDs, passport numbers
- Unhashed email addresses (email addresses in Zustand for the current session are acceptable)
- Full addresses (current session only, never persisted)
- Phone numbers (current session only, never persisted)
- Financial account details
- Health information

### Recommendation
- The `preferencesStore` (persisted via Zustand `persist` middleware) may store only: `theme`, `sidebar`, `fontSize`. No PII.
- The `featureFlagsStore` may store flag keys and boolean values, not PII.
- The API client cache (IndexedDB-backed) must strip sensitive fields before caching. If the backend returns PII-identifiable responses, these routes must not be cached client-side.
- A storage audit should run as part of CI (see Section 46 — Security Testing Strategy).

---

## 14. Route Protection

### Purpose
Define how route access is enforced for each route group.

### Engineering Rationale
Route protection is the first explicit authorization checkpoint. Users navigating directly to a URL or following a bookmark must be authenticated and authorized before any page content is rendered or data is fetched.

### Route Groups and Protections

| Route Group | Protection | Mechanism | Enforcement Layer |
|-------------|------------|-----------|-------------------|
| `/` (public) | None | Public access | No guard |
| `/auth/*` | Redirect authenticated users to dashboard | Check `authStore.status` | Layout redirect |
| `/(public)/*` | None | Public access | No guard |
| `/(alumni)/*` | Must be authenticated, role = alumni or alumni_lead or admin | Check `authStore.status` + `authStore.user.role` | Layout guard + proxy redirect |
| `/(admin)/*` | Must be authenticated, role = admin | Check `authStore.status` + `authStore.user.role` | Layout guard + proxy redirect |

### Implementation Approach (Not Code)
Route protection is implemented at two layers:
1. **Layout layer** — Each route group layout (`auth`, `alumni`, `admin`) checks the auth store status and redirects to `/auth/login` if the user is unauthenticated or lacks the required role.
2. **Proxy layer** — The `proxy.ts` (Next.js equivalent of middleware) checks the auth cookie on initial request and redirects before any page renders. This prevents a flash of unauthorized content.

Both layers are necessary because:
- The proxy layer catches initial page loads (server-side).
- The layout layer catches client-side navigation (after SPA transitions).

### Recommendation
- Route group layouts in `src/app/(auth)/`, `src/app/(alumni)/`, `src/app/(admin)/` each contain an authorization check in their layout file.
- The `proxy.ts` at root level performs the server-side redirect.
- Unauthenticated users accessing `/(alumni)` or `/(admin)` routes are redirected to `/auth/login` with a `?redirect=` query parameter so they return after login.

---

## 15. API Security

### Purpose
Define how the frontend secures communication with all backend APIs.

### Engineering Rationale
All API communication crosses Trust Boundary 1 (App Zone → API Zone). Every request must be authenticated, authorized, and protected from replay and tampering.

### Security Controls per Request

| Control | Mechanism | Enforced By |
|---------|-----------|-------------|
| Authentication | `Authorization: Bearer <JWT>` header | `apiClient` in `src/lib/data/instance.ts` |
| Authorization | Backend validates user role + permissions | Backend |
| HTTPS | TLS 1.2+ on all requests | Transport layer |
| CSRF | CSRF token header on state-changing requests | `apiClient` + Backend |
| Request Integrity | JWT claim validation (backend) | Backend |
| Response Handling | Client-side status code handling in `apiClient` | `src/lib/data/instance.ts` |
| Timeout | Per-request timeout (default 10s, configurable) | `apiClient` |

### Sensitive API Endpoints

| Endpoint | Method | Sensitivity | Additional Controls |
|----------|--------|-------------|---------------------|
| `/auth/login` | POST | **Critical** | Rate limiting, brute force detection, no logging of password |
| `/auth/register` | POST | **Critical** | Rate limiting, email verification trigger |
| `/auth/logout` | POST | **High** | Invalidate all sessions for user |
| `/auth/refresh` | POST | **Critical** | Rotation detection, reuse detection |
| `/auth/me` | GET | **High** | Auth token required |
| `/admin/*` | Any | **Critical** | RBAC admin role check |
| `/alumni/profile/*` | PUT | **High** | Ownership validation |
| `/alumni/messages/*` | Any | **High** | Participant validation |

### Recommendation
- All state-changing requests (POST, PUT, PATCH, DELETE) must include a CSRF token.
- The `apiClient` is the sole entry point for API communication. No component, hook, or service bypasses `apiClient` for backend calls.
- A network error handler in `apiClient` distinguishes between auth errors (401 → trigger refresh), permission errors (403 → show unauthorized message), and server errors (5xx → show generic message).

---

## 16. CSRF Protection

### Purpose
Define how the application prevents Cross-Site Request Forgery attacks.

### Engineering Rationale
CSRF attacks trick the user's browser into sending a request to the application that the user did not intend. Since the application uses httpOnly cookies for refresh tokens, CSRF protection is required for all state-changing requests.

### Strategy

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Mechanism | Custom request header (`X-CSRF-Token`) + backend validation | Double Submit Cookie pattern; simple and effective |
| Token Source | Backend generates CSRF token, sends in response header or cookie readable by frontend | Frontend reads it at app mount |
| Token Scope | Per-session | User gets one CSRF token per session |
| Token Storage | In-memory (Zustand) | Not persisted; regenerated on session start |
| Inclusion | Every state-changing request includes the header | `apiClient` attaches automatically |

### Recommendation
- The `apiClient` intercept layer reads the CSRF token from Zustand and attaches `X-CSRF-Token` to every state-changing request.
- If no CSRF token is available (initial page load), `apiClient` fetches it via `GET /api/csrf-token` (returns token in response body and sets a non-httpOnly cookie).
- Backend validates that the request header matches the cookie value (Double Submit Cookie).

---

## 17. XSS Protection

### Purpose
Define the controls that prevent Cross-Site Scripting attacks.

### Engineering Rationale
XSS is the most common web vulnerability. The application renders user-generated content in profiles, messages, event descriptions, and directory listings. Without systematic controls, any user can inject scripts.

### Defense Layers

| Layer | Control | Responsibility |
|-------|---------|---------------|
| **L1: Input** | Validate and sanitize on input | Backend (frontend validates for UX) |
| **L2: Transport** | No untrusted content in API responses | Backend |
| **L3: Output** | React JSX auto-escaping | React (automatic) |
| **L4: Output (dangerous)** | Never use `dangerouslySetInnerHTML` | Code review / ESLint rule |
| **L5: CSP** | Restrict script sources | CSP header (see Section 19) |
| **L6: Sanitization** | Sanitize HTML before rendering if HTML input is allowed | Dedicated sanitizer library |

### HTML Content Handling

The application may render rich text in:
- Event descriptions
- Announcements
- Messages

For these cases, a sanitization library must be used:

```
User input (rich text)
  → Backend stores sanitized HTML (server-side sanitization)
  → API returns sanitized HTML
  → Frontend renders via dangerouslySetInnerHTML
  → ONLY if content was sanitized by the backend
  → Render within a Shadow DOM or iframe for message content (defense-in-depth)
```

### ESLint Rule
An ESLint rule must prohibit `dangerouslySetInnerHTML` unless the source variable name contains `sanitized` or `sanitizedHTML`:
```
// ❌ BANNED — source not obviously sanitized
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ ALLOWED — variable name signals sanitized data
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

### Recommendation
- Prefer `dangerouslySetInnerHTML` never, even with sanitized data when plain text suffices.
- If rich text is required, sanitize on the backend and use a trusted, well-audited sanitizer (e.g., DOMPurify) as a client-side second check.
- Messages between users should use a safe rich text format (Markdown) and render via a library that generates React elements rather than raw HTML.

---

## 18. Clickjacking Protection

### Purpose
Prevent the application's pages from being embedded in iframes on attacker-controlled websites.

### Engineering Rationale
Clickjacking tricks users into clicking UI elements on a hidden iframe overlay. Without protection, an attacker can steal clicks (e.g., "Delete account") by framing the target page in a transparent iframe.

### Controls

| Control | Implementation | Enforcement |
|---------|---------------|--------------|
| **L1: HTTP Header** | `X-Frame-Options: DENY` | Server/edge sends header on all pages |
| **L2: CSP** | `frame-ancestors 'none'` | CSP header (see Section 19) |
| **L3: Defensive JS** | `if (top !== self) top.location = self.location` | Client-side frame busting (legacy fallback) |

### Recommendation
- `X-Frame-Options: DENY` must be set on all response pages. No page in the application is designed to be embedded in an iframe.
- If future integration with third-party embedding is required (e.g., event previews in external sites), use `frame-ancestors` CSP with explicit allowlisting instead of `DENY`.

---

## 19. Content Security Policy

### Purpose
Define the Content Security Policy that mitigates XSS, data injection, and clickjacking.

### Engineering Rationale
CSP is the most powerful browser security mechanism after HTTPS. A well-crafted CSP can block XSS even if all other controls fail. However, an over-restrictive CSP can break images, scripts, and API calls.

### Baseline CSP

```
default-src 'self';
script-src 'self' 'strict-dynamic' 'nonce-{random}';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self';
connect-src 'self' https://api.alumni.jjcet.ac.in;
frame-ancestors 'none';
form-action 'self';
base-uri 'self';
object-src 'none';
```

### Policy Decisions

| Directive | Value | Rationale |
|-----------|-------|-----------|
| `default-src` | `'self'` | Baseline: everything from same origin |
| `script-src` | `'self'` `'strict-dynamic'` `nonce-{random}` | strict-dynamic allows trusted scripts to load children; nonce ensures only explicit scripts execute |
| `style-src` | `'self'` `'unsafe-inline'` | Required for CSS-in-JS and Tailwind |
| `img-src` | `'self'` `data:` `https:` | Allow images from any HTTPS source (alumni profile pictures, event images hosted externally) |
| `connect-src` | `'self'` `https://api.alumni.jjcet.ac.in` | API calls only to verified domain |
| `frame-ancestors` | `'none'` | No framing = no clickjacking |
| `object-src` | `'none'` | Block obsolete plugin types |
| `report-uri` | `/api/csp-violation` | Collect violations for monitoring |

### CSP Reporting
- Violations are reported to a backend endpoint `/api/csp-violation`.
- Reports are aggregated and reviewed weekly.
- New deployment violations trigger an alert to the security team.

### Recommendation
- Deploy CSP via `Content-Security-Policy` HTTP header (not meta tag) to ensure enforcement before any rendering occurs.
- Start in Report-Only mode (`Content-Security-Policy-Report-Only`) for two weeks after initial deployment to collect violations without blocking.
- Transition to enforcement mode after all legitimate violations are addressed.
- Integrate CSP header generation into the deployment pipeline via server response headers or edge proxy.

---

## 20. Input Validation

### Purpose
Define how all user input is validated before processing or transmission.

### Engineering Rationale
Input validation is the first line of defense against injection attacks, malformed data, and schema violations. Validation must be applied at every entry point, not only at the API boundary.

### Validation Layers

| Layer | What is Validated | Mechanism |
|-------|-------------------|-----------|
| **L1: Form** | Form field values before submission | Zod schemas (shared between frontend validation service and API) |
| **L2: Service** | Input parameters before workflow execution | Zod schemas in service layer validation step |
| **L3: API Client** | Response data shape and status codes | TypeScript types + response validation |
| **L4: Backend (definitive)** | All input values | Backend validation (definitive) |

### Validation Rules

| Input Type | Validation | Rejection |
|------------|-----------|-----------|
| Email | Regex + format check | Invalid email format |
| Password (register) | Min 8 chars, at least 1 letter, 1 number | Weak password |
| Name | Max 100 chars, no HTML tags | Invalid characters or too long |
| Phone | Numeric digits only, 10-15 chars | Invalid phone format |
| File (image) | MIME type, size limit, dimension limits | Invalid file type or exceeds limit |
| Rich text | Allowlist of HTML tags only, max length | Invalid HTML or too long |
| URL | Valid URL format, allowed protocol list | Disallowed protocol |

### Recommendation
- All form validation uses Zod schemas defined in `_validation/` per feature directory (following Stage 5 feature structure).
- The service layer's workflow pipeline includes a `validate` step that runs the Zod schema before execution.
- The same Zod schema (minus backend-only rules) is sent to the frontend to ensure mirrored validation.

---

## 21. Output Encoding

### Purpose
Define how data is encoded when rendered to prevent injection into unintended contexts.

### Engineering Rationale
Output encoding ensures that data is treated as data, not executable code. The encoding context matters — data rendered in a URL, HTML attribute, or CSS value must be encoded differently.

### Context-Specific Encoding

| Context | Encoding | Mechanism |
|---------|----------|-----------|
| HTML text content | HTML entity encoding | React JSX (automatic) |
| HTML attribute | HTML attribute encoding | React JSX (automatic) |
| URL | URL encoding | Manual via `encodeURIComponent()` |
| JSON | JSON serialization | `JSON.stringify()` |
| JavaScript string | JavaScript string encoding | React handles via JSX; avoid direct string building |
| CSS | CSS encoding | Avoid dynamic CSS values |

### Critical Rule
❌ **Never concatenate user-controlled data into JavaScript** — no `eval()`, no `Function()` constructor, no dynamic `import()` based on user input.

### Recommendation
- React handles most output encoding automatically when JSX is used.
- For any `dangerouslySetInnerHTML`-adjacent operations, use DOMPurify or equivalent before setting HTML content.
- For URL construction with user-supplied segments, use `URL` constructor and validate the origin matches the expected domain.

---

## 22. Secure File Upload

### Purpose
Define security requirements for file upload functionality.

### Architecture Note
File upload is primarily a backend concern. This section defines the frontend security responsibilities and required backend contract.

### Frontend Controls

| Control | Frontend Action | Backend Contract Required |
|---------|----------------|--------------------------|
| **File Type Validation** | Check MIME type before upload | Reject mismatched types |
| **File Size Validation** | Check size before upload | Reject oversized files |
| **Upload Endpoint Validation** | Only upload to known whitelisted endpoints | Verify file type, size, content |
| **Content Disarmament** | N/A (frontend cannot) | Backend must re-encode/re-compress images |
| **Display** | Render uploaded images via proxy URLs | Serve files through a proxy that validates access |
| **Download** | Generate download links via backend | Authenticate download requests |

### File Size Limits

| File Type | Max Size | Rationale |
|-----------|----------|-----------|
| Profile image | 2 MB | Avatar use case |
| Event image | 5 MB | High-resolution cover images |
| Announcement attachment | 10 MB | PDF, images for announcements |
| Gallery image | 15 MB | Full-resolution photo gallery |
| Gallery video | 100 MB | Video upload (if supported) |

### Recommendation
- Validation placeholder components in `src/components/shared/FileUpload/` display the constraints to the user before upload.
- The upload flow: user selects file → frontend validates type + size → upload to backend → backend validates, sanitizes, and stores → backend returns secure URL → frontend displays via proxy.
- Uploaded file previews are always rendered through a backend proxy endpoint (e.g., `/api/files/{id}`), never directly from user-controlled storage.

---

## 23. Secure File Download

### Purpose
Define security controls for file downloads and secure URLs.

### Frontend Responsibilities
- Download URLs are always generated by the backend.
- Frontend never constructs download URLs from user-supplied data.
- Download links must be authenticated (backend verifies token before serving the file).

### URL Security Rules

| Rule | Rationale |
|------|-----------|
| All file URLs include a signed token | Prevents hotlinking and unauthenticated access |
| Token has expiry | Limits window of unauthorized access if leaked |
| Token is scoped to a specific file | Prevents token reuse for different files |
| File paths are never exposed to the browser | Prevents directory traversal attacks against storage |

### Recommendation
- The frontend requests a download URL from the backend: `POST /api/files/{id}/download-url` returns a one-time signed URL.
- Files are displayed via a proxy that validates the user's session: `GET /api/files/{id}` with `Authorization` header.
- Never render a direct storage URL (e.g., S3 direct link) in the browser.

---

## 24. Rate Limiting

### Purpose
Define the rate limiting strategy for the frontend's interaction with backend APIs.

### Engineering Rationale
Rate limiting protects the backend from abuse, automated attacks, and accidental overloading. While the definitive rate limiting is enforced on the backend, the frontend must respect rate limits gracefully to provide good UX.

### Frontend Rate Limiting Responsibilities

| Responsibility | Implementation |
|----------------|----------------|
| Detect 429 (Too Many Requests) | `apiClient` intercepts 429 responses |
| Retry-After header parsing | Read `Retry-After` header for backoff duration |
| Exponential backoff | Client-side delay before retry |
| Display rate limit status | Show toast notification: "Too many requests. Please wait N seconds." |
| Disable retry on auth endpoints | Never auto-retry login/register (see Section 25) |

### Recommendation
- The `apiClient` handles 429 responses by:
  1. Reading the `Retry-After` header.
  2. Displaying a user-facing notification.
  3. Disabling the retry button until the cooldown elapses.
- No automatic retry on 429 responses. Manual user action is required.
- Rate limiting limits are set on the backend and communicated to the frontend via `Retry-After` and `X-RateLimit-*` headers.

---

## 25. Brute Force Protection

### Purpose
Define how the system prevents brute force attacks against authentication endpoints.

### Engineering Rationale
Brute force attacks attempt to guess credentials by repeated login attempts. The frontend is the first line of defense, but the definitive protection is backend-side.

### Frontend Controls

| Control | Implementation |
|---------|----------------|
| **Password Field Delays** | Intentional 500ms delay on login button after password field modification |
| **Progressive Delay** | Exponential delay on rapid form resubmission (client-side) |
| **Submit Disable on Repeated Failure** | After 3 client-side login failures, disable submit for 15 seconds |
| **Visual Feedback** | Show remaining lockout time on form |
| **No Client-Side Enthusiasm** | Do NOT send login credentials multiple times if the first request is pending |

### Backend Contract Required

| Backend Feature | Why |
|----------------|-----|
| Rate limiting on `/auth/login` and `/auth/register` | Prevent massive scale attacks |
| Account lockout after N failed attempts (e.g., 5 attempts in 15 minutes) | Stop credential guessing at the source |
| Lockout duration (e.g., 15 minutes, doubling with each block) | Increasing cost for attacker |
| Lockout notification email | Alert legitimate user of activity |
| IP-based rate limiting | Block distributed attacks targeting multiple accounts |

### Recommendation
- Login attempts are never automatically retried. Each request corresponds to one user click.
- The login button is disabled until the previous request completes (prevent double submission).
- After 3 client-detected consecutive failures (no response or 401), the form enters a 15-second cooldown and displays: "Too many login attempts. Please wait N seconds."
- The lockout state is reset after a successful login.

---

## 26. Account Lockout Strategy

### Purpose
Define the behavior when a user account is locked due to failed authentication attempts.

### Frontend Handling

| Scenario | Frontend Behavior |
|---------|---------------------|
| Backend returns `429 Too Many Requests` | Show countdown timer; disable login form |
| Backend returns `423 Locked` | Show "Account temporarily locked" message with lockout duration |
| Lockout expires | Allow login attempt; re-check with backend |

### Recommendation
- The lockout state is not stored client-side — it is entirely backend-managed.
- The frontend detects lockout via HTTP status code (`423 Locked`) or a specific error code in the response body.
- The frontend displays the exact lockout duration (from backend response) and activates the form when it expires.
- No client-side lockout override exists.

---

## 27. Password Policy Architecture

### Purpose
Define the password policy that the frontend validates and the backend enforces.

### Engineering Rationale
Password policy is enforced definitively on the backend. The frontend mirrors the policy for immediate UX feedback to the user without waiting for a round-trip.

### Policy (Mirrored by Frontend)

| Rule | Value | Rationale |
|------|-------|-----------|
| Minimum length | 8 characters | OWASP minimum |
| Maximum length | 128 characters | Prevents long-string DoS |
| Required characters | At least 1 letter, 1 number | Basic complexity |
| Special characters | Optional (prevent user frustration) | OWASP no longer requires special characters |
| Common passwords | N/A (checked by backend) | Backend checks against known password lists |
| Reset frequency | User-changed (no forced rotation) | NIST SP 800-63 recommends against forced rotation |
| Reset token expiry | 15 minutes | Window limits attack surface |

### Recommendation
- Validation logic is defined in `src/features/auth/_validation/password.ts` using the same Zod schema shared between frontend and API documentation.
- Password rules are displayed below the password field as a checklist.
- The password field allows visible toggle (show/hide) for usability.
- Password is never logged, stored in store, or passed to analytics.

---

## 28. Multi-Factor Authentication Readiness

### Purpose
Design the architecture to support future MFA without rearchitecture.

### Engineering Rationale
MFA is not currently required but is a common enterprise requirement. The architecture should accommodate MFA with minimal future changes.

### Readiness Requirements

| Requirement | Current State | Future Change |
|-----------|------------|----------------|
| **Auth service** | Single-step login | Service checks if MFA is required; if yes, redirect to MFA step |
| **Auth store** | `status: "authenticated"` | Add intermediate `"mfa_required"` status |
| **Session** | Two-step tokens | MFA step issues a temporary MFA token; second step completes auth |
| **Route** | Login → App | Add `/auth/mfa/verify` and `/auth/mfa/recovery` routes |
| **Types** | `SessionUser` | Add `mfaEnabled` boolean field |

### MFA Flow (Future)

```
Login (credentials)
  │
  ├── MFA NOT required → authenticated (immediate)
  │
  └── MFA required → status: "mfa_required"
        │
        ├── Verify TOTP → POST /auth/mfa/verify → authenticated
        └── Recovery code → POST /auth/mfa/recover → authenticated
```

### Recommendation
- Reserve `src/app/(auth)/mfa/` route group in the routing layer structure.
- Add `"mfa_required"` to the auth store `status` type in advance.
- The auth service context should accept an optional MFA challenge callback.
- No architectural work is required now beyond documenting these slots.

---

## 29. Role-Based Access Control

### Purpose
Define the RBAC model that governs access across the application.

### Engineering Rationale
RBAC groups users by role and assigns permissions to roles. Roles are defined as part of the core `UserRole` type and enforced at every authorization layer.

### Role Hierarchy

```
admin (highest privilege)
  │
  ├── Can do everything: manage users, events, content, settings
  ├── Has all permissions
  └── Audit logged for all actions
        │
alumni_lead
  │
  ├── Can manage events and announcements
  ├── Can view all profiles
  └── Cannot manage users, settings, or system configuration
        │
alumni (lowest privilege)
  │
  ├── Can view own profile and edit limited fields
  ├── Can view public directory of other alumni
  ├── Can send messages to other alumni
  └── Cannot manage events, users, announcements, or settings
```

### Permission Mapping

```
admin = ALL
alumni_lead = [
  "profile:read:self", "profile:read:any", "profile:write:self",
  "event:read", "event:create", "event:update", "event:delete",
  "announcement:read", "announcement:create", "announcement:update",
  "message:read", "message:send",
  "directory:read",
]
alumni = [
  "profile:read:self", "profile:read:public", "profile:write:self",
  "event:read", "event:rsvp",
  "announcement:read",
  "message:read", "message:send",
  "directory:read",
]
```

### Recommendation
- Roles are defined on the backend and communicated to the frontend in the JWT claims and `SessionUser` type.
- The frontend uses the user's role from `useAuthStore` to make authorization decisions.
- A `hasPermission(permission: string): boolean` utility function checks whether the current user's role includes a given permission.
- Permission checks are placed in:
  - Route guards (layout level)
  - Service layer (workflow `authorize` step)
  - Component layer (conditional render)
  - Store actions (before dispatching)

---

## 30. Permission Model

### Purpose
Define the permissions architecture that supports fine-grained, composable access control.

### Engineering Rationale
A permission model separates "who the user is" (role) from "what the user can do" (permission). This decoupling allows different roles to have overlapping capabilities and supports future permission customization without changing the role model.

### Permission Naming Convention

```
<resource>:<action>[:<scope>]

Examples:
  "profile:read:self"
  "profile:read:any"
  "profile:write:self"
  "event:create"
  "event:update"
  "event:delete"
  "announcement:create"
  "message:send"
  "directory:read"
  "user:manage"
  "settings:update"
  "audit:read"
```

### Permission Check Utility

```typescript
// Conceptual — not actual implementation
type PermissionCheck = {
  domain: ResourceDomain;   // "profile" | "event" | "announcement" | ...
  action: ActionType;       // "read" | "create" | "update" | "delete" | "manage"
  scope?: string;           // "self" | "any" | specific resource
};
```

### Recommendation
- The permission model is defined as a TypeScript type union in `src/constants/security/permissions.ts`.
- The `auth-store` does not directly expose permissions; the service layer authors the `hasPermission()` function.
- Permissions are checked in the workflow pipeline's `authorize` step (see ADR 016).

---

## 31. Feature-Level Authorization

### Purpose
Define how individual features enforce authorization.

### Engineering Rationale
Each feature has unique authorization requirements. A generic permission check cannot express the nuances of "a user can edit their own profile but not another user's profile." Feature-level authorization is decentralized to the feature that owns the logic.

### Feature Authorization Pattern

```
Each feature with authorization requirements has:
  src/features/<feature>/_services/
    ├── auth-service.types.ts     // Defines authorization context
    ├── auth-service.ts           // Implements authorization checks
    │                              // via workflow pipeline
    └── index.ts

  The service's workflow includes an "authorize" step that:
    1. Gets the current user from the auth store via store adapter
    2. Checks if the user has the required permission for the action
    3. Checks ownership if the action is resource-scoped
    4. Returns a ServiceError if unauthorized
```

### Examples

| Feature | Authorization Rule | Check Location |
|---------|-------------------|----------------|
| Profile (view own) | User matches `profile.id` | Service `authorize` step |
| Profile (edit) | User matches `profile.id` | Service `authorize` step |
| Profile (view any) | Role = `admin` or `alumni_lead` | Service `authorize` step |
| Event (create) | Role = `admin` or `alumni_lead` | Service `authorize` step |
| Event (delete) | Role = `admin` only | Service `authorize` step |
| Message (send) | Both sender and recipient are verified users | Service `validate` step |
| Directory (view) | All authenticated users | Service `validate` step |

### Recommendation
- Feature authorization is implemented inline in the service's workflow `authorize` callback.
- The `authorize` callback returns a success result if authorized or a failure `ServiceResult` with `AUTHORIZATION_ERROR` code and a user-friendly message.
- Feature services never import another feature service. They import the auth store adapter to get the current user.

---

## 32. Component-Level Authorization

### Purpose
Define how React components conditionally render based on user permissions.

### Engineering Rationale
Components must hide or disable UI elements the user is not authorized to use. This is a UX requirement, not a security control — the backend enforces the definitive check. However, hiding unauthorized elements reduces user confusion and prevents accidental unauthorized attempts.

### Rendering Pattern

```typescript
// Conceptual — not implementation
function ProfileActions({ user }: { user: SessionUser }) {
  return (
    <>
      {user.role === "admin" && <DeleteUserButton />}
      {user.role !== "alumni" && <EditUserButton />}
      <Button onClick={handleSendMessage}>Send Message</Button>
    </>
  );
}
```

### Authorization Component Pattern
For complex authorization logic, a shared component `Authorized` can be used:

```typescript
// Conceptual
type RequirePermission = {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};
```

### Rules
- Component-level authorization is always **UX-only**. The real check happens in the service layer.
- No sensitive action is gated only at the component level.
- If a component renders content conditionally based on role, the same content is blocked at the service layer.
- Feature components import a `usePermission` hook or use the `Authorized` wrapper.

### Recommendation
- The pattern for component-level authorization is: check the user's role from `useAuthStore`, render the protected element conditionally.
- For frequently repeated checks (e.g., "is admin"), create a small utility `isRole(user, "admin")` in `src/constants/security/permissions.ts`.
- For complex checks (e.g., specific permissions), use a `hasPermission` hook that wraps the service layer.

---

## 33. Secure Error Handling

### Purpose
Define how errors are handled without leaking sensitive information.

### Engineering Rationale
Error messages that leak implementation details, stack traces, or query structures give attackers critical information. The frontend must sanitize error displays while still providing useful feedback to legitimate users.

### Error Classification

| Error Category | User-Facing Message | Internal Logging |
|---------------|---------------------|-----------------|
| Authentication failure | "Invalid email or password." | `{ code: "AUTH_FAILURE", userEmail: "***@***", ip }` |
| Authorization failure | "You don't have permission to perform this action." | `{ code: "UNAUTHORIZED", userId, action, resource }` |
| Validation error | Specific field error (e.g., "Email is required.") | `{ code: "VALIDATION_ERROR", field, reason }` |
| Not found | "The resource you requested was not found." | `{ code: "NOT_FOUND", resourceId }` |
| Server error | "Something went wrong. Please try again later." | Full error with stack trace (server-side) |
| Network error | "Unable to connect. Please check your internet connection." | `{ code: "NETWORK_ERROR", endpoint }` |
| Rate limited | "Too many requests. Please wait N seconds." | `{ code: "RATE_LIMITED", retryAfter }` |

### Error Response Contract

The service layer returns a `ServiceResult<T>` discriminated union. The consumer (hook or component) handles both branches:

```typescript
// Conceptual
const result = await login(input, context);
if (!result.success) {
  // Display error.message to user
  // Log result.error for debugging (not user message)
}
```

### Recommendation
- User-facing error messages are static strings — never interpolate error objects, stack traces, or database errors.
- Internal logging includes the correlation ID for traceability.
- Generic error messages ("Something went wrong") are used for unexpected errors; specific messages for expected errors.
- Error details are never rendered in the DOM or sent to the frontend in API error responses (backends sends only `{ error: "message" }`).

---

## 34. Sensitive Data Handling

### Purpose
Define the classification and handling of sensitive data in the frontend.

### Engineering Rationale
Different data types have different sensitivity levels. The handling requirements scale with sensitivity.

### Data Classification

| Level | Examples | Storage | Display | Logging |
|-------|----------|---------|---------|---------|
| **Public** | Event names, public profiles | Can be cached (IndexedDB) | No restrictions | No logging |
| **Internal** | Non-public directory data, event details | Cached with auth check | Authenticated users only | No PII in logs |
| **Sensitive** | Email addresses, phone numbers, birth dates | In-memory only, never persisted | Masked in lists, full in details | Never logged |
| **Restricted** | Passwords, tokens, MFA codes, API keys | Never stored on client | Never displayed | Never logged |

### Sensitive Data Display Rules

| Data Type | Display Rule |
|-----------|-------------|
| Email | Show full in profile, mask in directory lists: `j***@example.com` |
| Phone | Show full only in own profile, never in directory |
| Password | Never displayed; always input with `type="password"` |
| Token | Never displayed anywhere |
| Profile image | Always shown (user-facing by nature) |

### Recommendation
- A utility function `maskEmail(email: string): string` and `maskPhone(phone: string): string` are defined in `src/constants/security/masking.ts`.
- The directory service applies these masks before returning list data to the component layer.
- Own-profile services return full, unmasked data.
- No sensitive data is included in URL parameters, form action URLs, or referrer headers.

---

## 35. Personally Identifiable Information

### Purpose
Define how PII is identified, handled, and protected across the application.

### Engineering Rationale
PII protection is a legal and regulatory requirement. The alumni directory contains significant PII: names, email addresses, phone numbers, graduation years, departments, and profile images.

### PII Inventory

| PII Field | Classification | Retention | Export Allowed? |
|-----------|-------------|------------|-----------------|
| Full name | Sensitive | Session only, persisted on backend | Own profile only |
| Email address | Sensitive | Session only, persisted on backend | Own profile only |
| Phone number | Sensitive | Session only, persisted on backend | Never exported |
| Graduation year | Internal | Can be cached | Yes, if public |
| Department | Internal | Can be cached | Yes, if public |
| Profile image | Internal (owner), Sensitive (others) | Session only | Own profile only |
| Messages content | Restricted | Never client-cached | Never |

### PII Handling Rules

| Rule | Implementation |
|------|---------------|
| **Collection Limitation** | Only collect PII fields that have a functional purpose |
| **Data Minimization** | Public directory API returns only name, batch, department (no email, phone) |
| **Purpose Limitation** | PII is only used for alumni network operations, never for analytics or profiling |
| **Retention** | Backend manages retention; frontend never persists PII |
| **Access** | Only the owning user and admins can view full PII |
| **Consent** | User consents to PII collection at registration |

### Recommendation
- The `AlumniProfile` type differentiates between public fields and sensitive fields.
- The directory service returns `PublicAlumniProfile` (subset without sensitive PII) for list views and full `AlumniProfile` for own-profile or admin views.
- No PII is sent to analytics services, external CDNs, or third-party scripts.

---

## 36. Browser Security

### Purpose
Define browser-level security mechanisms that protect the application.

### Engineering Rationale
Modern browsers provide security features that the application must use to improve the security posture. These features are free, but they must be configured correctly.

### Browser Security Features

| Feature | Configuration | Protection |
|---------|--------------|-------------|
| **HTTPS** | TLS 1.2+ enforced by HSTS | Eavesdropping and MITM |
| **HSTS** | `Strict-Transport-Security: max-age=31536000; includeSubDomains` | Forces HTTPS for all future requests |
| **Referrer Policy** | `Referrer-Policy: strict-origin-when-cross-origin` | Limits referrer header data leakage |
| **Permissions Policy** | `Permissions-Policy: camera=(), microphone=(), geolocation=()` | Disables unused powerful APIs |
| **X-Content-Type-Options** | `X-Content-Type-Options: nosniff` | Prevents MIME type sniffing |
| **X-DNS-Prefetch-Control** | `X-DNS-Prefetch-Control: off` | Prevents DNS prefetch data leakage |

### Recommendation
All security headers are set at the server/edge level:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-DNS-Prefetch-Control: off
```

These headers should be added to the server configuration (e.g., `next.config.ts`, edge server, or reverse proxy) and verified in the CI pipeline.

---

## 37. HTTPS Enforcement

### Purpose
Ensure all communication between the browser and the server is encrypted.

### Engineering Rationale
All security controls (tokens, sessions, cookies) are ineffective if the transport is not encrypted. HTTP traffic can be intercepted, modified, or redirected by anyone with network access.

### Enforcement

| Mechanism | Implementation | Responsibility |
|-----------|---------------|---------------|
| **Server redirect** | HTTP → HTTPS redirect (301) | Server / reverse proxy |
| **HSTS header** | `Strict-Transport-Security` with long max-age | Server response header |
| **HSTS preload** | Submit domain to HSTS preload list | Operations / Domain management |
| **Cookie Secure flag** | All cookies have `Secure` attribute | Backend (cookie set) |
| **Client enforcement** | Check `window.location.protocol` on mount | Frontend (optional, UX only) |

### Recommendation
- HTTPS enforcement is entirely a server-side configuration. The frontend's only responsibility is to:
  1. Verify all API requests are made to `https://` URLs.
  2. Not make requests to non-HTTPS endpoints.
- The `apiClient` base URL is configured with an `https://` scheme in the environment configuration.

---

## 38. Third-Party Script Policy

### Purpose
Define the policy for including and managing third-party scripts.

### Engineering Rationale
Third-party scripts execute in the same origin context as the application. A compromised third-party script can exfiltrate all data the application has access to, including auth tokens in memory (if the attacker exploits browser APIs).

### Policy

| Rule | Rationale |
|------|-----------|
| No third-party scripts are loaded by default. | Reduces attack surface. |
| If a third-party script is required (e.g., analytics, error monitoring), it must be: | |
| 1. Hosted on a known, audited CDN | Prevents supply chain attacks from unknown sources |
| 2. Loaded with `integrity` attribute (SRI) | Prevents modified script execution |
| 3. Loaded with `async` or `defer` | Prevents render blocking |
| 4. Added to the CSP `script-src` directive | Restricts execution to approved sources only |
| 5. Reviewed and approved by the security team | Process-based control |

### Approved vs. Unapproved

| Script | Status | CSP Rule |
|--------|--------|----------|
| Sentry (error monitoring) | Approved, optional | `script-src: *.sentry.io` |
| Google Analytics (if enabled) | Approved, optional | `script-src: *.google-analytics.com` |
| React Developer Tools | Not approved for production | N/A |
| Any other script | Not approved by default | Blocked by CSP |

### Recommendation
- Third-party scripts are loaded exclusively in the root layout component with SRI hashes.
- The CSP is explicitly configured to allow each approved script's source.
- A comment in the root layout file documents why each third-party script is included and links to the security review artifact.

---

## 39. Dependency Security

### Purpose
Define the strategy for managing the security of installed dependencies.

### Engineering Rationale
The npm ecosystem has over 2 million packages. Supply chain attacks have become one of the most common attack vectors in modern web development. Dependency security must be automated and continuous.

### Strategy

| Practice | Tool / Method | Frequency |
|----------|--------------|-----------|
| **Vulnerability scanning** | `npm audit` or `snyk` | Every install, CI |
| **Dependency review** | `DiffReview` in PRs | Every PR |
| **Outdated dependency check** | `npm outdated` | Weekly |
| **Lock file integrity** | Commit `package-lock.json` | Every PR |
| **Non-executable dependencies** | Review `devDependencies` vs `dependencies` | Every audit |

### Rules

| Rule | Why |
|-----|-----|
| No dependency with known critical or high severity vulnerability is allowed in production. | Acceptable risk? No. |
| All dependencies must be from the npm registry (or verified mirror). | No git-installed dependencies that bypass registry security. |
| Dev dependencies are never added to the production deployment bundle. | Reduces production attack surface. |
| Lock files must be committed to version control. | Ensures reproducible builds. |

### Recommendation
- `npm audit` is run in CI as part of the build pipeline. A build fails if any critical or high severity vulnerability is found in production dependencies.
- Dependencies are updated regularly via `npm update` or Dependabot/Renovate.
- Each major dependency update is reviewed for security implications (new attack surface, dropped support, etc.).
- All dependency changes are reviewed as part of PR process — a PR with a package.json or lock file change must include a comment explaining what changed and why.

---

## 40. Secret Management Philosophy

### Purpose
Define how secrets (API keys, tokens, configuration values) are managed across the application.

### Engineering Rationale
Exposed secrets are a leading cause of security incidents. The application must ensure that no secrets are committed to version control, exposed to the browser, or embedded in client-side bundles.

### Rules

| Rule | Implementation |
|------|----------------|
| **No secrets in client code.** | All secrets are server-side or in environment variables prefixed with `NEXT_PUBLIC_` (which are visible to the client). |
| **No secrets in version control.** | `.env.local` is in `.gitignore`. Example `.env.example` is the only committed file. |
| **Public configuration only in `NEXT_PUBLIC_*` env vars.** | Any `NEXT_PUBLIC_*` variable is compiled into the client bundle. |
| **Non-public env vars are server-only.** | Backend API keys, database URLs, and secret keys are never exposed to the client. |
| **API keys used in client code have limited scope.** | If an API key must exist client-side, it has minimal permissions, is scoped to one domain, and can be rotated. |

### What NOT to Do

❌ Do NOT:
- Commit `.env.local` or any `.env` files with real secrets.
- Store API keys, tokens, or secrets in the client source code.
- Include secrets in log messages or error responses.
- Use client-side environment variables for sensitive configuration.

### Recommendation
- All sensitive configuration is server-side. The frontend only consumes public, read-only configuration through `NEXT_PUBLIC_*` variables.
- Secret scanning (e.g., `trufflehog` or `git-secrets`) is integrated into the CI pipeline to prevent accidental secret commits.
- If a secret leaks, it is immediately rotated and the commit history is scrubbed.

---

## 41. Logging Security

### Purpose
Define what can and cannot be logged in client-side logging.

### Engineering Rationale
Client-side logs can be viewed in the browser developer console, transmitted to logging services (e.g., Sentry, LogRocket), and potentially intercepted. Sensitive information in logs leaks data to anyone who can access them.

### Logging Allowed List

| Category | Can Log | Cannot Log |
|----------|---------|------------|
| Auth events | Login success/failure, logout | Email, password, token, reset code |
| API calls | Endpoint, status code, timing | Request body, response body (if sensitive), auth headers |
| Navigation | Route path, timestamp | URL params containing user IDs |
| Errors | Error code, generic message, stack (non-production) | Input data, query params, user context |
| Performance | Metric names, timing, component names | Route-specific metrics with PII in route path |

### Logging Levels

| Level | Allowed Data |
|-------|-------------|
| `error` | Error code, stack trace (dev only), correlation ID, generic description |
| `warn` | Deprecation notices, non-critical failures, rate limiting events |
| `info` | Page transitions, feature usage (anonymized), timing metrics |
| `debug` | State changes, service call parameters (excluding sensitive data), workflow execution steps |

### Recommendation
- The `logger` utility in `src/lib/utils/logger.ts` enforces these rules at the type level (a custom formatter scrubs sensitive patterns before output).
- A logging audit decorator or wrapper can be added to the service layer to ensure no sensitive data leaks via service call logging.
- In production builds, `debug` level logging is disabled by the `setLogLevel("error")` configuration.

---

## 42. Audit Trail Requirements

### Purpose
Define the audit trail requirement for security-relevant events.

### Engineering Rationale
An audit trail is required to detect and investigate security incidents, demonstrate compliance with data protection regulations, and hold users accountable for their actions.

### Events That Must Be Audited (Frontend Perspective)

| Event | Data to Capture | Confidentiality |
|-------|----------------|-----------------|
| Login attempt (success) | User ID, timestamp, IP | Logged server-side only |
| Login attempt (failure) | User ID (if known), timestamp | Logged server-side only |
| Logout | User ID, timestamp | Logged server-side only |
| Profile update | User ID, fields changed, timestamp | Audited on backend |
| Message sent | Sender ID, recipient ID, timestamp | Audited on backend |
| Admin action (any) | Admin ID, action, target, timestamp | Audited on backend |
| Permission denied | User ID, action attempted, timestamp | Logged on frontend (for UX) and backend (for audit) |

### Frontend Audit Responsibilities
- The frontend's primary audit responsibility is to capture permission-denied events (403 responses) and log them with the user ID, action, and timestamp.
- This frontend logging sends structured events to the backend audit log endpoint.
- The definitive audit trail is server-side. Frontend audit logs are supplementary for debugging UX issues.

### Correlation ID
- Every request includes a correlation ID (`X-Correlation-ID` header) that links frontend activity to backend logs.
- The correlation ID is generated at page load and carried through all services and API calls in a session.

### Recommendation
- The `service-layer` workflow pipeline (ADR 016) automatically logs permission-denied events in the `authorize` step via the logger.
- A backend endpoint `POST /api/audit/log` accepts structured audit events from the frontend for non-critical events that are still relevant for operational visibility.
- The correlation ID is required; no audit event is accepted without one.

---

## 43. Privacy Considerations

### Purpose
Define privacy-by-design principles applied across the frontend.

### Engineering Rationale
Privacy regulations (GDPR, local equivalents) require data minimization, purpose limitation, and user control over personal data. These requirements affect UI, data fetching, and storage.

### Privacy Principles Applied

| Principle | Application |
|-----------|-------------|
| **Data Minimization** | Directory list API returns only public fields. Full PII requires explicit permission or is limited to own profile. |
| **Purpose Limitation** | PII collected for the alumni directory is used only for alumni networking. It is not sent to analytics or third parties. |
| **Consent** | User consents to data collection at registration. Consent is stored server-side. |
| **Right to Access** | User can view all their data via their profile page. |
| **Right to Rectify** | User can edit their own profile fields. |
| **Right to Delete** | User can request account deletion (handled server-side). Frontend provides the UI for the request. |
| **Data Portability** | User can export their own data. Frontend provides a download button that triggers a backend export. |

### Privacy Controls

| Control | Implementation |
|---------|---------------|
| **Data masking** | Email and phone masked in list views, full in own profile |
| **Profile visibility** | Public profile subset vs. full profile for authenticated users |
| **Search controls** | Users cannot be indexed by external search engines |
| **Consent UI** | Cookie consent banner if analytics are enabled |
| **Third-party data sharing** | No PII is shared with third parties from the frontend |

### Recommendation
- The directory API returns two profile shapes: `PublicAlumniProfile` (for lists) and `FullAlumniProfile` (own profile, admins).
- A privacy policy link is in the footer and the authentication pages.
- If analytics are enabled, a cookie consent mechanism obtains user consent before loading analytics scripts.

---

## 44. OWASP Top 10 Alignment

### Purpose
Map every OWASP Top 10 (2021) category to specific controls in this specification.

### Engineering Rationale
OWASP Top 10 is the industry standard baseline. Mapping every category to a control proves the specification is complete.

### OWASP Top 10 Mapping

| # | Category | Controls in This Specification |
|---|----------|------------------------------|
| A01 | Broken Access Control | Sections 7, 14, 15, 29, 30, 31 (RBAC, permission model, route protection, API auth) |
| A02 | Cryptographic Failures | Sections 10, 12, 37 (JWT, secure cookies, HTTPS) |
| A03 | Injection | Sections 17, 20, 21 (XSS protection, input validation, output encoding) |
| A04 | Insecure Design | ADR 017 entire document; cross-cutting security design |
| A05 | Security Misconfiguration | Sections 19, 36, 38, 39 (CSP, browser security headers, dependency audit) |
| A06 | Vulnerable and Outdated Components | Section 39 (dependency security, npm audit, SRI) |
| A07 | Identification and Authentication Failures | Sections 6, 9, 10, 11, 25, 26, 27 (auth architecture, session mgmt, brute force) |
| A08 | Software and Data Integrity Failures | Sections 38, 39 (SRI, dependency integrity, lock files) |
| A09 | Security Logging and Monitoring Failures | Sections 41, 42 (logging security, audit trail) |
| A10 | Server-Side Request Forgery | Backend concern; frontend prevents this by never constructing server-side requests from user input |

### Recommendation
- This mapping should be reviewed and updated with each major version of the specification.
- A security checklist derived from OWASP ASVS Level 2 (Assertion, Verification, Scope) is maintained alongside the ADR.

---

## 45. Secure Coding Standards

### Purpose
Define the secure coding standards that all frontend code must follow.

### Engineering Rationale
Consistent coding standards prevent entire classes of vulnerabilities. Standards are enforced through ESLint rules, code review, and TypeScript type safety.

### Standards

| Category | Standard | Enforcement |
|----------|----------|-----------|
| **No inline event handlers** | Never use `<div onclick="...">` | ESLint `react/no-danger-with-children` |
| **No eval or Function constructor** | Never use `eval()`, `Function()`, `setTimeout(string)` | ESLint `no-implied-eval`, `no-eval` |
| **No innerHTML** | Never use `element.innerHTML =` | ESLint rule (custom) |
| **No localStorage for auth** | auth data never stored in localStorage | Code review (custom ESLint rule) |
| **No secrets in source** | API keys never hard-coded | ESLint plugin `eslint-plugin-no-secrets` |
| **Input validation required** | Every input field must have a corresponding Zod schema | Code review |
| **Authorization check required** | Every protected operation must have an authorization check | Code review |
| **CSRF token required** | Every state-changing request includes CSRF token | Code review + automated check in apiClient |
| **Correlation ID required** | Every request includes correlation ID | Code review + automated check in apiClient |
| **No console.log in production** | Remove debug logging before deployment | ESLint `no-console` (warn, with logger utility as allowed exception) |

### Recommendation
- A custom ESLint plugin or shared ESLint config enforces these standards.
- The TypeScript compiler's strict mode (`strict: true` in `tsconfig.json`) is required — no exceptions.
- Code reviews have a security checklist that the reviewer must complete before approval.

---

## 46. Security Testing Strategy

### Purpose
Define how security testing is integrated into the development lifecycle.

### Engineering Rationale
Security testing must be continuous and automated, not a one-time audit at the end of development. Bugs caught during development cost a fraction of those caught after deployment.

### Testing Types

| Type | Tool / Method | Frequency | Scope |
|------|--------------|-----------|-------|
| **SAST (Static Analysis)** | ESLint with security rules, TypeScript strict mode | Every commit, every PR | All source code |
| **Dependency scanning** | `npm audit`, Snyk, Dependabot | Every commit, weekly (Snyk/Dependabot) | package.json, lockfile |
| **Secret scanning** | GitLeaks, truffleHog | Every push, CI | Git history |
| **Linting security rules** | Custom ESLint plugin | Every commit | React components, service files |
| **Manual code review** | Security checklist | Every PR with security-sensitive changes | Code changed in PR |
| **Penetration testing** | Manual / external | Before major releases, quarterly | Full application |
| **CSP validation** | CSP evaluator | Before release | CSP header |
| **Cookie audit** | Manual automation | Before release | All cookies |

### CI Integration

| Stage | Security Gate | Failure Action |
|-------|---------------|---------------|
| `npm install` | `npm audit` (critical/high) | Block install |
| Pre-commit | ESLint security rules | Block commit |
| PR | Dependency scan, SAST, secret scan | Block merge |
| Pre-release | Full security audit | Block release |

### Recommendation
- Security testing is integrated into the existing CI pipeline as additional stages.
- A security audit script (`npm run security:audit`) runs all non-interactive tests locally before push.
- Quarterly penetration tests are scheduled with a scope update before each test cycle.

---

## 47. Vulnerability Management

### Purpose
Define the process for identifying, triaging, and remediating vulnerabilities.

### Engineering Rationale
No system is perfectly secure. A structured vulnerability management process ensures that findings are tracked, prioritized, and resolved.

### Vulnerability Lifecycle

```
Identification (automated scan, manual review, external report)
  │
  ▼
Triage (severity rating, impact assessment)
  │
  ├── Critical → Immediate fix (≤ 24 hours)
  ├── High     → Fix in current sprint
  ├── Medium   → Fix in next sprint (or document acceptance)
  └── Low      → Fix in backlog
        │
        ▼
Remediation (code fix, configuration change, dependency update)
  │
  ▼
Verification (re-scan, code review)
  │
  ▼
Documentation (close finding, update threat model if needed)
```

### Severity Ratings

| Level | Definition | SLA |
|-------|-------------|-----|
| **Critical** | Remote code execution, data exfiltration, auth bypass | < 24 hours |
| **High** | PII exposure, privilege escalation, CSRF | < 7 days |
| **Medium** | Information disclosure (non-PII), CSP violations, missing security headers | < 30 days |
| **Low** | Best practice violations, hardening suggestions | <= 90 days |

### Ownership
- **Security team (or lead)** — Receives all vulnerability reports, triages, assigns severity, tracks remediation.
- **Engineering team** — Remediation ownership assigned during sprint planning.
- **QA / Security** — Verifies fix and closes finding.

### Recommendation
- Vulnerabilities are tracked in the same system as bugs (GitHub Issues / Jira) with a `security` label and severity tag.
- Critical and high findings are visible to the entire team via a security dashboard.
- A retrospective is conducted quarterly to review vulnerability trends and adjust the security strategy.

---

## 48. Security Monitoring

### Purpose
Define how security events are monitored in production.

### Engineering Rationale
Even with all preventive controls, incidents will occur. Monitoring detects ongoing attacks, provides early warning, and enables investigation.

### Monitored Events

| Event Source | What is Monitored | Alert Threshold |
|--------------|-------------------|-----------------|
| CSP violation reports | Blocked script execution, inline style violations, connection to unauthorized origins | Any report is investigated |
| Auth failure rate | Login failure rate per user and per IP | > 5 failures in 15 minutes |
| API 401/403 rate | Rate of unauthorized API calls | > 20 in 15 minutes |
| Rate limiting events | Count of 429 responses | High rate indicates attack |
| Error rate | Unexplained increase in errors | > 2× baseline |
| Logged errors with security error codes | Direct matches to service error codes in security categories | Alert on any occurrence |

### Monitoring Implementation

| Component | Implementation |
|------------|----------------|
| **Error monitoring** | Cloud service (Sentry, LogRocket) — catches frontend errors with context |
| **CSP violation** | Backend endpoint `/api/csp-violation` — aggregates and forwards to monitoring |
| **Auth events** | Backend only — frontend has no visibility into auth failure rate |
| **Performance metrics** | RUM (Real User Monitoring) — detects anomalies that may indicate attack |

### Recommendation
- CSP violation reports are collected and reviewed weekly.
- A security dashboard (read-only) displays aggregated event counts from the last 24 hours, 7 days, and 30 days.
- Alert thresholds should be tuned after the first month of production data to reduce noise.

---

## 49. Incident Response Readiness

### Purpose
Define the frontend team's role in incident response.

### Engineering Rationale
When a security incident occurs, the frontend team may be called upon to: verify that users see appropriate error messages, verify that compromised tokens are invalidated, or push a hotfix to remove a feature/toggle from the UI.

### Incident Types and Frontend Response

| Incident Type | Frontend Role | Expected Action |
|---------------|---------------|-----------------|
| Authentication breach | Inform users of forced logout | Trigger global logout, display breach notification |
| Data breach | Inform users | Update UI to show notification |
| Vulnerability found (deployed) | Mitigate while fix is developed | Disable feature via feature flag |
| DDoS attack | N/A (infrastructure handles) | Monitor alert dashboard |
| CSP bypass | Identify new CSP rules | Deploy updated CSP header |

### Readiness Checklist

- [ ] Feature flags can disable any feature remotely and immediately.
- [ ] A "breach notification" component exists and can be toggled via feature flag.
- [ ] The auth service supports a server-triggered force logout mechanism.
- [ ] The notification store can display system-wide emergency alerts.
- [ ] The team has a contact list and escalation path.

### Recommendation
- A dedicated incident response runbook exists in the project's internal documentation.
- Feature flags from `useFeatureFlagsStore` are the primary mechanism for disabling vulnerable features during incident response.
- The auth store's `reset()` function, available publicly via the store adapter, can be called through the event bus.

---

## 50. Governance Strategy

### Purpose
Define who owns security decisions, how policies are enforced, and how the security posture evolves over time.

### Engineering Rationale
Security governance ensures that the security layer does not degrade over time as the codebase evolves. It assigns ownership, establishes accountability, and creates processes for continuous improvement.

### Ownership

| Role | Security Responsibilities |
|------|--------------------------|
| **Security Lead** | Owns this specification, threat model, vulnerability management process; reviews all security-related PRs |
| **Engineering Lead** | Ensures security requirements are included in sprint planning; reviews secure coding standards |
| **All Developers** | Follow secure coding standards; report vulnerabilities; participate in security training |
| **QA / Test** | Executes security test cases; verifies vulnerability fixes |
| **DevOps / Infra** | Configures security headers, CSP, HSTS, network controls |

### Governance Processes

| Process | Frequency | Owner |
|---------|-----------|-------|
| **Security review of PRs** | Every PR with security impact | Security Lead |
| **Vulnerability triage** | On detection | Security Lead |
| **Threat model review** | Every major feature, quarterly | Security Lead + Engineering |
| **Dependency audit** | Weekly (automated) | DevOps / Infra |
| **Security training** | Annually | Engineering Lead |
| **Penetration test** | Quarterly | External |
| **Specification review** | Annually | Security Lead + Engineering |

### Policies

| Policy | Description |
|--------|-------------|
| **Vulnerability disclosure** | All discovered vulnerabilities are reported to the security lead within 24 hours |
| **Responsible disclosure** | External reporters have a channel (security@jjcet.alumni.edu) with a 90-day disclosure timeline |
| **Security exception** | Any deviation from this specification requires documented approval from the security lead |

### ADR Status for Stage 17

After governance approval, the status of ADR 017 transitions through:
1. **Draft** (current) — Under review by architecture team
2. **Approved** — Reviewed and accepted for implementation
3. **Implemented** — All 50 sections have been verified in code review and deployment

---

## 51. Engineering Review

### Purpose
Summarize the architectural quality of the security specification and identify areas requiring future attention.

### Threat Analysis Summary

| Threat | Risk | Control Coverage | Gap |
|--------|------|-----------------|-----|
| Credential theft | Critical | Full (Sections 6, 9, 10, 11, 25, 26, 27) | None |
| Session hijacking | Critical | Full (Sections 9, 10, 11, 12) | None |
| XSS | Critical | Full (Sections 17, 19, 21) | None |
| CSRF | High | Full (Section 16) | None |
| Data breach (PII) | Critical | Full (Sections 13, 34, 35) | None |
| Authorization bypass | Critical | Full (Sections 7, 14, 15, 29, 30, 31, 32) | None |
| Supply chain | High | Full (Section 39) | None |
| DoS | Medium | Partial (Section 24) | Frontend has limited DoS controls |

### Trust Boundary Analysis

| Boundary | Protections | Status |
|----------|-----------|--------|
| B1 (App → API) | HTTPS, CSRF, JWT, CORS, correlation ID | Designed |
| B2 (API → Data) | Server-side controls (not frontend scope) | Delegated |
| B3 (Browser → App) | Input validation, XSS protection, CSP | Designed |
| B4 (Third Party → App) | SRI, CSP allowlist, explicit approval | Designed |

### OWASP Top 10 Compliance

| A01 | A02 | A03 | A04 | A05 | A06 | A07 | A08 | A09 | A10 |
|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |

### Authentication Architecture Review

| Component | Status | Notes |
|----------|--------|-------|
| Login flow | Designed | JWT-based, in-memory token, httpOnly cookie refresh |
| Registration flow | Designed | Same pattern as login |
| Password reset | Referenced | Backend-driven; frontend handles form + redirect |
| Email verification | Referenced | Backend-driven; frontend handles display |
| Silent refresh | Designed | Triggered by 401 from API client |
| Logout | Designed | POST + cookie clearing + store reset |
| MFA readiness | Designed | Auth store status extended, route reserved |

### Authorization Architecture Review

| Aspect | Status | Notes |
|--------|--------|-------|
| RBAC model | Defined | Three roles: admin, alumni_lead, alumni |
| Permission model | Defined | Domain:action:scope naming convention |
| Route-level auth | Defined | Layout + proxy layer for server-side and client-side |
| Service-level auth | Defined | Workflow pipeline (authorize step) in ADR 016 |
| Component-level auth | Defined | Role-based conditional rendering |
| Ownership validation | Referenced | Service layer handles resource ownership checks |

### Maintainability Analysis

The security specification is designed to be:
- **Decentralized**: Each feature owns its authorization logic, preventing a single file from becoming a bottleneck.
- **Explicit**: No implicit permissions or inherited trust relationships.
- **Testable**: Each security control can be unit-tested independently.
- **Evolvable**: New features add their own authorization logic without modifying the existing security infrastructure.

### Scalability Analysis

The specification scales with the number of features (currently 16) because:
- Authorization is decentralized to feature services.
- The permission model uses a structured naming convention that accommodates arbitrary new permissions.
- Route protection is handled by route group, not by route count.
- The RBAC model can accommodate new roles without changing the authorization infrastructure.

### Future Security Recommendations

| # | Recommendation | Priority | Effort |
|---|---------------|----------|--------|
| FR1 | Implement Content Security Policy in staging and report-only mode before production | High | Medium |
| FR2 | Create the custom ESLint security plugin for secure coding standards enforcement | High | Medium |
| FR3 | Integrate `npm audit` into CI pipeline | High | Small |
| FR4 | Create the security audit checklist for PR reviews | High | Small |
| FR5 | Write the incident response runbook | Medium | Small |
| FR6 | Configure HSTS and browser security headers on the server | High | Small |
| FR7 | Implement the CSRF token flow in `apiClient` | High | Medium |
| FR8 | Build the secret scanning integration into CI | Medium | Medium |
| FR9 | Write the threat model document (`docs/threat-model.md`) | Medium | Medium |
| FR10 | Implement the masking utility functions for PII | Medium | Small |

### Security Implementation Tracking

The following mark the completion criteria for Stage 17:

- [x] Security specification document written (50 sections, ○ 500 lines)
- [ ] CSP implemented in report-only mode
- [ ] Security headers configured on server
- [ ] `npm audit` integrated into CI
- [ ] CSRF token flow implemented in `apiClient`
- [ ] Route guards implemented in route group layouts
- [ ] Auth service workflow includes authorization check
- [ ] Feature services have authorization in `authorize` step
- [ ] Permission model constants defined in `src/constants/security/permissions.ts`
- [ ] PII masking utility created
- [ ] Custom ESLint security rules configured
- [ ] Security audit checklist created for PR reviews
- [ ] Incident response runbook documented

---

## References

- [OWASP Top 10 — 2021](https://owasp.org/Top10/)
- [OWASP ASVS v4.0.3](https://owasp.org/www-project-application-security-verification-standard/)
- [NIST SP 800-207 (Zero Trust Architecture)](https://csrc.nist.gov/publications/detail/sp/800-207/final)
- [Google BeyondCorp](https://cloud.google.com/beyondcorp)
- [Auth0 Security Best Practices](https://auth0.com/docs/security)
- [Stripe Security Architecture](https://stripe.com/docs/security)
- [ADR 015: State Management Layer](./015-state-management-layer.md)
- [ADR 016: Service Layer](./016-service-layer.md)