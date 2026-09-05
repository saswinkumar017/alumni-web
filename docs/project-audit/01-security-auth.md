# Security & Authentication — How It Works

## Authentication Flow

```
1. User enters username + password on login page
2. Client sends POST /api/login to Spring Boot
3. Backend validates credentials with BCrypt
4. Backend generates JWT (HS512, contains: userId, role, username, exp)
5. Backend returns { accessToken, refreshToken, tokenType, expiresAt, username, role }
6. Client stores tokens:
   - localStorage: accessToken, refreshToken, user JSON
   - Cookies: session_token (for SSR proxy), user_role
7. Client hydrates Zustand auth store with user data
8. Client redirects to role-based URL
```

### Role-Based Redirect After Login
```
developer    → /developer
admin        → /admin/dashboard
alumni       → /alumni/dashboard
alumni_lead  → /alumni/dashboard
```

## JWT Filter — The Critical Piece

### Problem We Solved
Spring Security 6.5 ignores `@Component` filters. The JWT filter MUST be a `@Bean` method in `SecurityConfig`.

### How It Works Now
```
SecurityConfig.java:
  @Bean @Order(HIGHEST_PRECEDENCE)
  public JwtAuthenticationFilter jwtAuthenticationFilter(JwtService jwtService) {
      return new JwtAuthenticationFilter(jwtService, userDetailsService);
  }

  securityFilterChain(http, jwtFilter) {
      http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
  }
```

### JWT Filter Logic
```
1. Check Authorization header for "Bearer <token>"
2. Fallback: check query param ?token=<token> (for SSE EventSource)
3. If token found + valid:
   a. Extract username from JWT
   b. Load UserDetails from DB
   c. Create UsernamePasswordAuthenticationToken with authorities
   d. Set in SecurityContextHolder
4. Continue filter chain
```

### Why Query Param Fallback?
`EventSource` (browser SSE API) cannot set custom headers. So the SSE stream endpoint receives the JWT as `?token=...` query param.

## Auto-Logout on JWT Expiry

### Two-Layer Protection
```
Layer 1 — StoreHydrator (page load):
  - Reads JWT from localStorage
  - Decodes payload, checks exp claim
  - If expired → clears all tokens/cookies → logout

Layer 2 — apiFetch (every request):
  - No token in localStorage → logout + redirect
  - Server returns 401 → logout + redirect
```

### Why Two Layers?
- Layer 1 catches expired tokens when user returns to a tab after a long time
- Layer 2 catches tokens that expire mid-session while user is active

## Login Page — The Blank Page Fix

### Problem
After login, developer portal showed blank page until refresh.

### Root Cause
Auth Zustand store initial state is `status: "idle"`. The developer layout only showed loading spinner for `"loading"` state. When status is `"idle"` and user is `null`, layout returns `null` (blank).

Additionally, after login `router.push("/developer")` navigates BEFORE the StoreHydrator's useEffect hydrates the store.

### Fix (Two Parts)
```
1. Developer layout: Show spinner for BOTH "idle" AND "loading" states
   if (status === "loading" || status === "idle") → show spinner

2. Login form: Immediately hydrate auth store after storing tokens
   storeAuthTokens(response);
   login(responseToSessionUser(response));  // ← sync Zustand store
   router.push(redirectUrl);
```

## RBAC System

### Three Permission Layers
```
1. Route Protection (proxy.ts):
   - Checks user_role cookie
   - Redirects non-developer users away from /developer/*

2. Layout Protection (layout.tsx):
   - useAuthStore checks user.role
   - Returns null if role doesn't match

3. API Protection (@PreAuthorize):
   - Every controller method annotated
   - @PreAuthorize("hasRole('DEVELOPER')")
   - Spring Security checks JWT authorities
```

### How Roles Work
```
Backend returns role as: "DEVELOPER", "ADMIN", "USER"
storeAuthTokens() normalizes to: "developer", "admin", "user"
All layout/store checks use lowercase roles.
```

## Password Security
- BCrypt with strength 12
- Minimum password rules configurable via auth policies
- Passwords never returned in API responses
