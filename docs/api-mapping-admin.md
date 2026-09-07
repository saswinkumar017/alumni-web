# Frontend Pages ↔ Backend API Mapping — Public & Admin

> **Scope:** `public` + `legal` + `auth` (public-adjacent) + `admin` only. Explicitly **excludes** `alumni/*` (`/alumni/dashboard`, `/alumni/profile`, `/alumni/networking`, `/alumni/community`, `/alumni/messages`, `/alumni/donations`, `/alumni/settings`) and `developer/*`. For those, see `docs/project-audit/07-api-mapping.md` and `PLAN.md`.

*Generated:* 2026-09-06
*Frontend:* `client/` — Next.js 16 App Router (`src/app/(public)`, `src/app/(legal)`, `src/app/(auth)`, `src/app/(admin)`). API base: `NEXT_PUBLIC_API_BASE_URL` (`env.api.baseUrl`, default `http://localhost:8080/api`) — `client/src/config/env.ts`.
*Backend:* `server/alumniweb/` — Spring Boot 3.5.x (`com.alumniweb.alumniweb.controller.*`, base `/api`).
*Index:* This file replaces scattered route→service→controller notes; verify against `SecurityConstants.PUBLIC_URLS` and `SecurityConfig` when adding endpoints.

---

## 0. Conventions & Cross-Cutting

| Concern | Frontend | Backend |
|---------|----------|---------|
| **API clients** | `client/src/lib/data/instance.ts` exports `apiClient` (Axios + `createApiClient` in `client/src/lib/data/client.ts:26`), and `client/src/lib/api/client.ts:4` (`API_BASE = env.api.baseUrl` + Bearer header from `localStorage.accessToken`). Auth pages use raw `fetch` in `client/src/features/auth/_services/auth-api.ts:4`. Admin pages use `adminFetch()` helper in `client/src/features/admin/_services/admin-service.ts:15` (same pattern). | All controllers `@RestController` + `@RequestMapping("/api/...")`. Common wrappers: `dto/common/PageResponse.java` (`content, number, size, totalElements, totalPages`), `dto/common/ApiResponse.java`. |
| **Auth storage** | `storeAuthTokens()` in `client/src/features/auth/_services/auth-api.ts:154` → `localStorage` (`accessToken`, `refreshToken`, `user`) + `document.cookie` (`session_token`, `user_role`, 7 days, `SameSite=Lax`). `clearAuthTokens()` fires `POST /api/auth/logout` (fire-and-forget). | `security/SecurityConstants.java:13` — `PUBLIC_URLS` listed below. Everything else requires `Authorization: Bearer <JWT>` (HS512, access 15 m, refresh 7 d). Admin routes additionally `@PreAuthorize("hasRole('ADMIN')")` (`controller/AdminController.java:36`). `JwtAuthenticationFilter` also accepts `?token=` for SSE. |
| **Route guard** | `client/proxy.ts` (edge) + `client/src/lib/route-protection.ts:25` (`/admin` → `PROTECTED_ADMIN`). `ADMIN` role required for `/admin/**`. | `@PreAuthorize` on `AdminController`, `AdminEventController`, `AdminAnnouncementController`, `AdminReportController`. |
| **Pagination** | Client typically `?page=0&size=20` + optional `query/type/status/category/...`. | `PageRequest.of(page, size)` → `PageResponse.of(...)`. |
| **Excluded** | Do NOT document `/alumni/**` (`ConnectionController`, `CommunityController`, `ProfileController`, `NotificationController`, `DashboardController`, `DonationController` except admin stats) or `/developer/**` here. |  |

### Public URL allow-list (`server/.../security/SecurityConstants.java:13`)

```
/api/register/**, /api/login/**, /api/auth/**, /api/search/**, /api/alumni/**,
/api/request/**, /api/otp/**, /api/events/**, /api/announcements/**, /api/health
```

`/api/admin/**` and `/api/developer/**` are **not** public.

---

## 1. Public Pages — `src/app/(public)` + `src/app/(legal)`

### 1.1 Landing — `/` — `client/src/app/(public)/page.tsx:10`

| Field | Value |
|-------|-------|
| **Route** | `/` |
| **File** | `client/src/app/(public)/page.tsx:23` (`export const dynamic = "force-static"`) |
| **Sections** | `HeroSection`, `StatsSection`, `AboutSection`, `EventsSection`, `SuccessStoriesSection`, `DepartmentsSection`, `CTASection` — all from `client/src/sections/*` |
| **Data fetching** | **None (currently static).** `Sections/events-section.tsx:11` uses hardcoded `events: Event[]` (3 items). No `getEvents` call. |
| **Available public API if wired** | `GET /api/events/upcoming` + `GET /api/events/past` → `EventController.java:27,32` via `client/src/lib/data/events.ts:28,39` (`getUpcomingEvents` / `getPastEvents`). `GET /api/announcements/featured` → `AnnouncementController.java:25` via `lib/data/announcements.ts:16`. `GET /api/search` for alumni counts. `GET /api/health` for status. |
| **Backend controller if wired** | `EventController`, `AnnouncementController`, `AlumniSearchController`, `HealthController` |
| **Auth** | Public (`force-static`, no guard) |
| **SEO** | `metadata` + `sitemap.ts:5` includes `""` in `publicRoutes` |

### 1.2 About — `/about` — `client/src/app/(public)/about/page.tsx:8`

| Field | Value |
|-------|-------|
| **Route** | `/about` |
| **File** | `client/src/app/(public)/about/page.tsx` (static JSX) |
| **API** | **None** — purely static content (mission/history/what-we-do/contact) |
| **Auth** | Public |

### 1.3 Contact — `/contact` — `client/src/app/(public)/contact/page.tsx:8`

| Field | Value |
|-------|-------|
| **Route** | `/contact` |
| **File** | `client/src/app/(public)/contact/page.tsx` |
| **API** | **None** — `<form action="mailto:alumni@jjcet.ac.in" method="post" encType="text/plain">` (`contact/page.tsx:35`). No backend endpoint. |
| **Auth** | Public |
| **Gap** | No `POST /api/contact` endpoint exists. If a backend contact inbox is added, route would need a service + controller. |

### 1.4 FAQ — `/faq` — `client/src/app/(public)/faq/page.tsx:18`

| Field | Value |
|-------|-------|
| **Route** | `/faq` |
| **File** | `client/src/app/(public)/faq/page.tsx:1` (`"use client"` + local `useState`) |
| **API** | **None** — `FAQ_ITEMS` is a hardcoded constant (`faq/page.tsx:5`). |
| **Auth** | Public |

### 1.5 Legal — `/legal/privacy` & `/legal/terms` — `client/src/app/(legal)/legal/{privacy,terms}/page.tsx`

| Route | File | API | Auth |
|-------|------|-----|------|
| `/legal/privacy` | `client/src/app/(legal)/legal/privacy/page.tsx:11` (`force-static`) | None | Public |
| `/legal/terms` | `client/src/app/(legal)/legal/terms/page.tsx:11` (`force-static`) | None | Public |

---

### 1.6 Events Listing — `/events` — `client/src/app/(public)/events/page.tsx:13`

| Field | Value |
|-------|-------|
| **Route** | `/events` |
| **File** | `client/src/app/(public)/events/page.tsx:14` (`<EventsList />`) |
| **Feature** | `client/src/features/events/feature.tsx:18` (`EventsList`) |
| **Data flow** | `EventsList` → `Promise.all([getUpcomingEvents(), getPastEvents()])` (`events/feature.tsx:19`) → `client/src/lib/data/events.ts:28,39` → `apiClient.get` via `lib/data/instance.ts:22` |
| **HTTP** | `GET /api/events/upcoming` and `GET /api/events/past` (two parallel calls, merged client-side at `lib/data/events.ts:5` if `getEvents` is used) |
| **Backend** | `server/.../controller/EventController.java:27` `@GetMapping("/upcoming")` → `eventService.getUpcoming()` ; `EventController.java:32` `@GetMapping("/past")` → `eventService.getPast()` . Base `@RequestMapping("/api/events")`. Returns `List<EventResponse>` (no `PageResponse` wrapper). |
| **Service layer** | `client/src/features/events/_services/event-service.ts:45,64` (`getUpcomingEvents`, `getPastEvents` via `EventServiceContext.eventsRepo`) — indirection through `lib/services/executeWorkflow`. Not used by this public route (route uses `lib/data` directly). |
| **Auth** | Public — `SecurityConstants.PUBLIC_URLS` includes `/api/events/**` |
| **Cache** | `lib/data/events.ts:28` `cache: { tags: ["events:upcoming"], ttlMs: 2 min }` ; `past` `ttlMs: 10 min`, `staleWhileRevalidate: true` |

### 1.7 Event Detail — `/events/[slug]` — `client/src/app/(public)/events/[slug]/page.tsx:39`

| Field | Value |
|-------|-------|
| **Route** | `/events/:slug` |
| **File** | `client/src/app/(public)/events/[slug]/page.tsx:39` (`revalidate = 3600`) |
| **Data flow** | `generateStaticParams` → `getEvents()` → `lib/data/events.ts:5` (calls `getUpcomingEvents` + `getPastEvents`) to enumerate slugs (`[slug]/page.tsx:11`). `generateMetadata` + `EventDetailPage` → `validateSlug(slug)` → `getEvent(slug)` → `lib/data/events.ts:16` → `apiClient.get<Event>(\`/events/${slug}\`)` with `cache: { tags: [\`events:${slug}\`], ttlMs: 5 min }` |
| **HTTP** | `GET /api/events` (for static params via the combined `getEvents` helper) ; `GET /api/events/{slug}` (detail) |
| **Backend** | `EventController.java:22` `@GetMapping` → `listEvents()` (`GET /api/events`) ; `EventController.java:42` `@GetMapping("/{slug}")` → `eventService.getEvent(slug, false)` (`GET /api/events/:slug`). Also `GET /api/events/search?q=` (`EventController.java:37`) exists but **not used** by this page. |
| **Auth** | Public |
| **Error** | `notFound()` if `validateSlug` fails or `getEvent` returns `!success` (`[slug]/page.tsx:23,26,41`) |

### 1.8 Alumni Directory (Public Search) — `/directory` — `client/src/app/(public)/directory/page.tsx:17`

This is the **most API-intensive public page** (client component with live search + two request modals).

| Field | Value |
|-------|-------|
| **Route** | `/directory` |
| **File** | `client/src/app/(public)/directory/page.tsx:17` (`"use client"`) |
| **Primary data** | `fetchAlumni` → `fetch(\`\${API}/search?\${params}\`)` (`directory/page.tsx:48`) where `API = env.api.baseUrl` (`env.api.baseUrl`, not via `apiClient`). Query string built as `page`, `size=20`, plus optional `query` (name search), `department`, `batch`. State: `query`, `department`, `batch`, `page`, `totalPages`, `totalElements`. |
| **HTTP (list/search)** | `GET /api/search?query=&department=&batch=&page=0&size=20`  — maps to `AlumniSearchController.java:32` `@GetMapping` on `@RequestMapping("/api/search")`. Controller delegates to `AlumniSearchService.search(AlumniSearchRequest)` and returns `PageResponse<AlumniSearchResponse>` (`PageResponse.of(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements())`). Frontend reads `data.content`, `data.totalPages`, `data.totalElements` (`directory/page.tsx:50`). |
| **DTO** | `dto/search/AlumniSearchRequest.java` (validated `@Valid`, accepts `q/query`, `department`, `batch`, `registerNumber`, `yearOfPassing`, pagination). `dto/search/AlumniSearchResponse.java` / `AlumniSummaryResponse.java` (fields: `id, name, registerNumber, department, batch, email` — matches `directory/page.tsx:7` `interface Alumni`). |
| **Auth** | Public — `/api/search/**` is in `PUBLIC_URLS`. `GET /api/search` is `@Operation(security = {})` (no bearer). |
| **Modal: "Request Email Update"** | `openUpdateModal(person)` → `submitUpdateRequest()` → `POST /api/request/email-correction` (`directory/page.tsx:68`) with body `{ registerNumber, currentEmail, newEmail, reason: "Alumni self-update request via directory" }`. Frontend sets `Content-Type: application/json`, no auth header. |
| **HTTP (email correction)** | `POST /api/request/email-correction` → `RequestController.java:34` `@PostMapping("/email-correction")` (`@RequestMapping("/api/request")`) → `requestService.createEmailCorrectionRequest(EmailCorrectionRequest)` → `201 Created` with `RequestStatusResponse` (`RequestController.java:46`). Validated `@Valid`; 404 if alumni not found. |
| **Modal: "Request to Add Alumni"** | `submitAddRequest()` → `POST /api/request/new-alumni` (`directory/page.tsx:86`) with body `{ registerNumber, name, email, department, batch, yearOfPassing, phone }` (`addFields`). |
| **HTTP (new alumni)** | `POST /api/request/new-alumni` → `RequestController.java:51` `@PostMapping("/new-alumni")` → `requestService.createNewAlumniRequest(NewAlumniRequest)` → `201 Created` `RequestStatusResponse`. Same public status. |
| **Rendering nuance** | The `src/features/directory/feature.tsx:11` `DirectoryList` component is **not** used by this route (the route implements its own client-side fetch loop instead). The `/directory/[slug]` sibling **does** use `lib/data/alumni`. |

### 1.9 Directory Profile — `/directory/[slug]` — `client/src/app/(public)/directory/[slug]/page.tsx:39`

| Field | Value |
|-------|-------|
| **Route** | `/directory/:slug` (slug is `registerNumber` or `id`) |
| **File** | `client/src/app/(public)/directory/[slug]/page.tsx:39` (`revalidate = 3600`) |
| **Data flow** | `generateStaticParams` → `getAlumniDirectory()` → `lib/data/alumni.ts:11` → `apiClient.get<AlumniProfile[]>("/alumni")` with `cache: { tags: ["alumni:all"], ttlMs: 5 min }`. `generateMetadata` + `DirectoryProfilePage` → `validateSlug(slug)` → `getAlumniProfile(slug)` → `lib/data/alumni.ts:30` → `apiClient.get<AlumniProfile>(\`/alumni/${encodeURIComponent(slug)}\`)` with `cache: { tags: [\`alumni:${slug}\`], ttlMs: 5 min, timeout: 15s }`. Rendered via `features/directory/feature.tsx:30` `DirectoryProfile` → `getAlumniProfile` → `ProfileHeaderSection` + `ProfileDetailsSection`. |
| **HTTP** | `GET /api/alumni` (for static params) ; `GET /api/alumni/{slug}` (detail). `AlumniController.java:26` `@GetMapping` → `alumniSearchService.getAllAlumniProfiles()` ; `AlumniController.java:33` `@GetMapping("/{slug}")` → `alumniSearchService.getAlumniProfile(slug)`. Also available: `GET /api/search?q=` → `lib/data/alumni.ts:60` (`searchAlumni`) maps hits via `toProfile(hit: SearchHit)` but **not** used by this route. |
| **Backend** | `server/.../controller/AlumniController.java:16` `@RequestMapping("/api/alumni")` — both endpoints annotated `@Operation(security = {})` (public). Returns `List<AlumniProfileResponse>` / `AlumniProfileResponse`. |
| **Auth** | Public — `/api/alumni/**` in `PUBLIC_URLS` |
| **Error** | `notFound()` on invalid slug or `!result.success` (`[slug]/page.tsx:23,26,42`) |

---

## 2. Auth Pages (Public-Adjacent) — `src/app/(auth)`

Auth pages sit under `/auth/*`; all are `force-dynamic`, `robots: { index: false }`, and delegate to `features/auth`.

### 2.1 Sign In — `/auth/login` — `client/src/app/(auth)/auth/login/page.tsx:12`

| Field | Value |
|-------|-------|
| **Route** | `/auth/login` |
| **File** | `client/src/app/(auth)/auth/login/page.tsx:12` → `<LoginForm />` |
| **Component** | `client/src/features/auth/_components/login-form.tsx:43` (`loginApi`) |
| **Service** | `client/src/features/auth/_services/auth-api.ts:51` `loginApi(data: LoginRequest)` → `fetch(\`\${API_BASE}/login\`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })` ; on success `storeAuthTokens(data: LoginResponse)` → `localStorage` + `session_token` cookie (`auth-api.ts:154`), then role-redirect (`developer`→`/developer`, `admin`→`/admin/dashboard`, else `/alumni/dashboard` — `login-form.tsx`). |
| **HTTP** | `POST /api/login` |
| **Backend** | `AuthenticationController.java:47` `@PostMapping("/login")` on `@RequestMapping("/api")` → `authenticationService.authenticate(LoginRequest)` → `LoginResponse { accessToken, refreshToken, tokenType, expiresAt, username, role }` (see `auth-api.ts:10`). `@Operation(security = {})`. |
| **Auth** | Public |
| **Related** | `POST /api/auth/refresh` (`AuthenticationController.java:61`) and `GET /api/auth/verify?token=` are called indirectly via `auth-service.ts:130` (`wireAuthHandlers`, `refreshSession`) and `verifyEmailApi`. |

### 2.2 Register — `/auth/register` — `client/src/app/(auth)/auth/register/page.tsx:13`

| Field | Value |
|-------|-------|
| **Route** | `/auth/register` |
| **File** | `client/src/app/(auth)/auth/register/page.tsx:13` → `<RegisterForm />` |
| **Component** | `client/src/features/auth/_components/register-form.tsx:32` (`registerApi` + `verifyRegistrationOtp`) |
| **Service** | `registerApi(data: RegisterRequest)` → `fetch(\`\${API_BASE}/register\`, { method: "POST", ... })` (`auth-api.ts:78`) with `{ registerNumber, email, username, password }` (`auth-api.ts:19`). After create, user must verify via OTP. |
| **HTTP** | `POST /api/register` |
| **Backend** | `RegistrationController.java:33` `@PostMapping("/register")` on `@RequestMapping("/api")` → `registrationService.register(RegisterRequest)` → `201 Created` `RegisterResponse { userId, username, message }` (`auth-api.ts:26`). Also handles `409` if username taken, `404` if alumni record not found for email. |
| **Auth** | Public — `/api/register/**` in `PUBLIC_URLS` |
| **OTP step** | `verifyRegistrationOtp(username, otp)` → `POST /api/otp/verify` with `{ username, otp, purpose: "REGISTRATION" }` (`auth-api.ts:124`). Maps to `OtpController.java:64` `@PostMapping("/verify")` → `otpService.verifyByPurpose(email, otp, "REGISTRATION")` ; on success promotes `User.emailVerified=true`, `accountStatus=ACTIVE`. |

### 2.3 Verify Email — `/auth/verify` — `client/src/app/(auth)/auth/verify/page.tsx:13`

| Field | Value |
|-------|-------|
| **Route** | `/auth/verify` (query `?token=`) |
| **File** | `client/src/app/(auth)/auth/verify/page.tsx:13` → `<VerifyEmail />` |
| **Service** | `verifyEmailApi(token)` → `fetch(\`\${API_BASE}/auth/verify?token=${encodeURIComponent(token)}\`)` (`auth-api.ts:109`) |
| **HTTP** | `GET /api/auth/verify?token=` |
| **Backend** | `AuthenticationController.java:75` `@GetMapping("/auth/verify")` → `registrationService.verifyEmail(token)` → `RegisterResponse`. `@Operation(security = {})`. |
| **Auth** | Public — `/api/auth/**` in `PUBLIC_URLS` |

### 2.4 Forgot / Reset Password — `/auth/forgot-password`, `/auth/reset-password` — `client/src/app/(auth)/auth/{forgot-password,reset-password}/page.tsx`

| Route | File | Current Behavior | API |
|-------|------|------------------|-----|
| `/auth/forgot-password` | `client/src/app/(auth)/auth/forgot-password/page.tsx:11` → `<ForgotPasswordForm />` | Form UI; **no confirmed backend wiring** in this audit (would typically be `POST /api/otp/send` with `purpose=PASSWORD_RESET` + email, then `POST /api/otp/verify` + password update). | `OtpController.java:31` `POST /api/otp/send` (`{ username, purpose }` → e.g. `PASSWORD_RESET`) exists and is public. `ProfileController.java:63` `POST /api/profile/change-password` exists for authenticated users but is not a public reset. |
| `/auth/reset-password` | `client/src/app/(auth)/auth/reset-password/page.tsx:13` → `<ResetPasswordForm />` | Similar stub | Same notes — gap between form and `OtpController`/`AuthenticationService` for anonymous reset. |

### 2.5 Logout helper (used by auth & admin)

| Field | Value |
|-------|-------|
| **Service** | `clearAuthTokens()` in `auth-api.ts:166` — fire-and-forget `fetch(\`\${API_BASE}/auth/logout\`, { method: "POST", headers: { Authorization: \`Bearer \${token}\` } })` then clears `localStorage` + cookies. `auth-service.ts:69` `logout(context)` → `context.authRepo.logout()` → same endpoint. |
| **HTTP** | `POST /api/auth/logout` |
| **Backend** | `AuthenticationController.java:87` `@PostMapping("/auth/logout")` → revokes `AppSession`s for `jwtService.extractUserId(token)`. Requires `Authorization` header (authenticated). Returns `{ message: "Logged out successfully" }`. |
| **Token refresh** | `POST /api/auth/refresh` (`AuthenticationController.java:61`) — `@Valid RefreshTokenRequest { refreshToken }` → `authenticationService.refreshAccessToken(...)` → `TokenPair`. Used by `auth-service.ts:106` `refreshSession` / `wireAuthHandlers`. Public. |

---

## 3. Admin Pages — `src/app/(admin)` (requires `ADMIN` role)

Every route below assumes `client/proxy.ts` redirects unauthenticated/unauthorized to `/auth/login`. In-page fetches use `adminFetch()` (`admin-service.ts:15`) which injects `Authorization: Bearer <token>` from `localStorage.accessToken` and handles `401 → clearAuthTokens() + /auth/login`. Page containers are `client/src/app/(admin)/admin/layout.tsx` + admin nav (`config/navigation.ts:50`).

> **Data layer note:** Admin pages **do not** use `lib/data/*` (Axios `apiClient` with `apiClient.get<Result>`). They call `admin-service.ts` (`adminFetch`) or direct `fetch` with `env.api.baseUrl`. This distinction is intentional (Axios `Result` vs `adminFetch` throwing on `!res.ok`).

### 3.1 Admin Root — `/admin` — `client/src/app/(admin)/admin/page.tsx:5`

| Field | Value |
|-------|-------|
| **Route** | `/admin` |
| **File** | `client/src/app/(admin)/admin/page.tsx:5` (`redirect("/admin/dashboard")`) |
| **API** | **None** — server-side `redirect`. |
| **Auth** | `PROTECTED_ADMIN` |

### 3.2 Admin Dashboard — `/admin/dashboard` — `client/src/app/(admin)/admin/dashboard/page.tsx:7`

| Field | Value |
|-------|-------|
| **Route** | `/admin/dashboard` |
| **File** | `client/src/app/(admin)/admin/dashboard/page.tsx:7` (`"use client"`) |
| **Service** | `getAdminDashboard()` → `adminFetch<any>("/admin/dashboard")` (`admin-service.ts:36`) |
| **HTTP** | `GET /api/admin/dashboard` |
| **Backend** | `AdminController.java:49` `@GetMapping("/dashboard")` on `@RequestMapping("/api/admin")` (`@PreAuthorize("hasRole('ADMIN')")`) → `adminService.getDashboard()` → `AdminDashboardResponse`. Frontend renders `totalAlumni`, `totalRequests`, `pending`, `approvedToday`, `recentRequests[]` (`dashboard/page.tsx:44`). Auto-refresh `setInterval(60000)` + manual Refresh. |
| **Auth** | ADMIN |
| **DTO** | `dto/admin/AdminDashboardResponse.java` (`totalAlumni, totalRequests, pending, approvedToday, recentRequests`) |

### 3.3 Alumni Directory (Admin) — `/admin/alumni` — `client/src/app/(admin)/admin/alumni/page.tsx:7`

| Field | Value |
|-------|-------|
| **Route** | `/admin/alumni` |
| **File** | `client/src/app/(admin)/admin/alumni/page.tsx:7` (`"use client"`) |
| **Service** | `getAdminAlumni(query?, page=0)` → `adminFetch<{ content, totalElements, totalPages }>(\`/admin/alumni?${params}\`)` where `params = page, size=20, +query?query` (`admin-service.ts:96`) |
| **HTTP** | `GET /api/admin/alumni?query=&page=0&size=20[&department=&batch=]` — note admin controller actually reads `@RequestParam(required=false) String query, department, batch` (`AdminController.java:90`) → `adminService.searchAlumni(query, department, batch, PageRequest)`. Frontend currently only sends `query`, not Department/Batch, but backend supports them. |
| **Backend** | `AdminController.java:90` `@GetMapping("/alumni")` → `PageResponse<AlumniSummaryResponse>` |
| **Auth** | ADMIN |

### 3.4 Alumni Record Detail — `/admin/alumni/[id]` — `client/src/app/(admin)/admin/alumni/[id]/page.tsx:15`

| Field | Value |
|-------|-------|
| **Route** | `/admin/alumni/:id` |
| **File** | `client/src/app/(admin)/admin/alumni/[id]/page.tsx:15` (`dynamic="force-dynamic"`, `requireAuth()`, `requireRole(user, ["admin"])`, `validateId(id)`) → `<AlumniRecordDetail id={validated} user={user} />` |
| **Feature** | `client/src/features/alumni-mgmt/feature.tsx:12` `AlumniRecordDetail` — **currently a stub**: renders `Record ID: {id}` only (`feature.tsx:14`). No data fetch. |
| **Intended API** | Would be `GET /api/admin/alumni/{id}` or reuse `GET /api/alumni/{slug}` (public) or `GET /api/admin/users/{id}` — but **no matching admin alumni-by-id endpoint is implemented**. `AdminController` exposes `GET /api/admin/alumni` (list) but not `/{id}`. `AlumniController` `GET /api/alumni/{slug}` is public and could be reused. `features/alumni-mgmt/_services/alumni-mgmt-service.ts` (`getAlumnus`, `approveAlumnus`, `rejectAlumnus`) exists but is **not wired** to this page. |
| **Auth** | ADMIN (SSR guard) |
| **Gap** | Page is placeholder — implement detail fetch + alumni actions (edit/approve/reject) per ADR/Service spec before relying on it. |

### 3.5 User Management — `/admin/users` — `client/src/app/(admin)/admin/users/page.tsx:21`

| Field | Value |
|-------|-------|
| **Route** | `/admin/users` |
| **File** | `client/src/app/(admin)/admin/users/page.tsx:21` (`"use client"`) |
| **Actions** | Search (`query`, `page`), Suspend, Activate |
| **Services** | `getAdminUsers(query?, page=0)` → `adminFetch<{ content: User[]; totalElements; totalPages }>(\`/admin/users?${params}\`)` (`admin-service.ts:41`); `suspendAdminUser(id, reason?)` → `adminFetch(\`/admin/users/${id}/suspend\`, { method: "POST", body: JSON.stringify({ reason }) })` (`admin-service.ts:47`); `activateAdminUser(id)` → `adminFetch(\`/admin/users/${id}/activate\`, { method: "POST" })` (`admin-service.ts:54`) |
| **HTTP** | `GET /api/admin/users?query=&page=0&size=20` ; `POST /api/admin/users/{id}/suspend` `{ reason }` ; `POST /api/admin/users/{id}/activate` |
| **Backend** | `AdminController.java:104` `@GetMapping("/users")` → `adminService.listUsers(query, PageRequest)` → `PageResponse<User>` ; `AdminController.java:119` `@PostMapping("/users/{id}/suspend")` → `adminService.suspendUser(id, reason)` → `{ message, status:"suspended" }` ; `AdminController.java:128` `@PostMapping("/users/{id}/activate")` → `adminService.activateUser(id)` → `{ message, status:"active" }`. Also `GET /api/admin/users/{id}` (`AdminController.java:114`) exists (single user) — not used by list page. |
| **Auth** | ADMIN |
| **Note** | `features/users/_services/user-service.ts:6` (`getUsers`, `getUser` via `UserServiceContext`) is **not used** by this route — the route uses `admin-service.ts`. |

### 3.6 User Detail — `/admin/users/[id]` — `client/src/app/(admin)/admin/users/[id]/page.tsx:15`

| Field | Value |
|-------|-------|
| **Route** | `/admin/users/:id` |
| **File** | `client/src/app/(admin)/admin/users/[id]/page.tsx:15` (`force-dynamic`, `requireAuth()`, `requireRole(... ["admin"])`, `validateId`) → `<UserDetail id={validated} user={user} />` |
| **Feature** | `client/src/features/users/feature.tsx:12` `UserDetail` — **stub** (`User ID: {id}` only). No fetch. |
| **Intended API** | `GET /api/admin/users/{id}` (`AdminController.java:114`) → `adminService.getUser(id)` → `User`. Would need `GET` wired via `admin-service.ts` or `user-service.ts`. |
| **Auth** | ADMIN (SSR) |
| **Gap** | Placeholder page — wire to backend before use. |

### 3.7 Manage Requests — `/admin/requests` — `client/src/app/(admin)/admin/requests/page.tsx:37`

| Field | Value |
|-------|-------|
| **Route** | `/admin/requests` |
| **File** | `client/src/app/(admin)/admin/requests/page.tsx:37` (`"use client"`) |
| **Primary fetch** | `fetchRequests()` → `fetch(\`\${API}/admin/requests?${params}\`, { headers: HEADERS() })` (`requests/page.tsx:53`) where `HEADERS() = { Authorization: Bearer ${TOKEN()}, "Content-Type":"application/json" }`, `TOKEN = localStorage.accessToken`. `params = page, size=20, +status?status, +type?type`. Direct `fetch`, not `adminFetch`. Response shaped as `PageData { content: PendingRequest[], totalElements, totalPages, number }` → reads `data.content`. |
| **HTTP (list)** | `GET /api/admin/requests?page=0&size=20&status=PENDING|APPROVED|REJECTED&type=NEW_ALUMNI|EMAIL_CORRECTION&query=` |
| **Backend** | `AdminController.java:54` `@GetMapping("/requests")` → `adminService.getFilteredRequests(type, status, query, pageable)` or `adminService.getPendingRequests(pageable)` → `PageResponse<PendingRequestResponse>` (`AdminController.java:63`). Filters typed as `RequestType` / `RequestStatus` enums. Also `GET /api/admin/request/{id}` (`AdminController.java:69`) exists for single request but **not used** by this page (page inlines payload in list items). |
| **Approve** | `handleApprove()` → `fetch(\`\${API}/admin/request/${selected.requestId}/approve\`, { method:"POST", headers: HEADERS(), body: JSON.stringify({ requestId, decision:"APPROVED", adminNotes }) })` (`requests/page.tsx:69`) ; toast `Approved — email sent`. |
| **Reject** | `handleReject()` similarly → `POST /api/admin/request/{id}/reject` (`requests/page.tsx:90`) with `{ requestId, decision:"REJECTED", adminNotes }`. |
| **HTTP (mutate)** | `POST /api/admin/request/{id}/approve` (`AdminController.java:74`) and `POST /api/admin/request/{id}/reject` (`AdminController.java:82`) — both accept `@RequestBody(required=false) RequestApprovalRequest { adminNotes }` and delegate to `adminService.processRequest(RequestApprovalRequest(id, status, notes))` → `RequestApprovalResponse`. Frontend sends extra `requestId`/`decision` fields which backend ignores (uses path `id`). |
| **Auth** | ADMIN |
| **Also available but unused** | `GET /api/admin/request/{id}` for detail; `getAdminRequests(status?, page)` helper in `admin-service.ts:103` wraps `GET /api/admin/requests` with `status` filter only — the page's richer filter (`type`) bypasses that helper. |

### 3.8 Announcements (Admin CRUD) — `/admin/announcements` — `client/src/app/(admin)/admin/announcements/page.tsx:12`

| Field | Value |
|-------|-------|
| **Route** | `/admin/announcements` |
| **File** | `client/src/app/(admin)/admin/announcements/page.tsx:12` (`"use client"`) |
| **List** | `load()` → `fetch(\`\${API}/admin/announcements\`, { headers: HEADERS() })` (`announcements/page.tsx:22`) → `setItems(await res.json())`. `HEADERS()` uses `localStorage.accessToken`. |
| **HTTP (list)** | `GET /api/admin/announcements` |
| **Backend (list)** | `AdminAnnouncementController.java:31` `@GetMapping("/announcements")` on `@RequestMapping("/api/admin")` → `announcementService.listAnnouncements(true)` → `List<AnnouncementResponse>`. The public sibling is `GET /api/announcements` (`AnnouncementController.java:20`). |
| **Create** | `save()` when `editingId===null` → `fetch(\`\${API}/admin/announcements\`, { method:"POST", headers: HEADERS(), body: JSON.stringify({ title, body, featured }) })` (`announcements/page.tsx:34`) |
| **HTTP (create)** | `POST /api/admin/announcements` → `AdminAnnouncementController.java:41` → `announcementService.createAnnouncement(CreateAnnouncementRequest)` → `AnnouncementResponse`. |
| **Update** | `save()` when `editingId!==null` → `fetch(\`\${API}/admin/announcements/${editingId}\`, { method:"PUT", body: { title, body, featured } })` (`announcements/page.tsx:39`) ; `toggleActive(a)` → `fetch(PUT .../${a.id}`, `{ isActive: !a.isActive })` (`announcements/page.tsx:53`). |
| **HTTP (update)** | `PUT /api/admin/announcements/{id}` → `AdminAnnouncementController.java:46` → `announcementService.updateAnnouncement(id, UpdateAnnouncementRequest)` → `AnnouncementResponse`. |
| **Delete** | `remove(id)` → `fetch(\`\${API}/admin/announcements/${id}\`, { method:"DELETE", headers: HEADERS() })` (`announcements/page.tsx:65`) |
| **HTTP (delete)** | `DELETE /api/admin/announcements/{id}` → `AdminAnnouncementController.java:52` → `announcementService.deleteAnnouncement(id)` → `{ message, status:"deleted" }`. |
| **Detail (unused)** | `GET /api/admin/announcements/{id}` (`AdminAnnouncementController.java:36`) exists but is not fetched by this list page. |
| **Auth** | ADMIN (`@PreAuthorize` on class) |
| **Note** | `features/announcements/_services/announcement-service.ts:6` (`getAnnouncements`, `getFeaturedAnnouncements` via `AnnouncementServiceContext`) serves **public** announcement display; this admin route bypasses it with direct `fetch`. |

### 3.9 Reports — `/admin/reports` — `client/src/app/(admin)/admin/reports/page.tsx:6`

| Field | Value |
|-------|-------|
| **Route** | `/admin/reports` |
| **File** | `client/src/app/(admin)/admin/reports/page.tsx:6` (`"use client"`) |
| **Service** | `fetchData()` → `Promise.allSettled([getAdminDashboard(), getAdminAuditStats()])` (`reports/page.tsx:14`) — both from `admin-service.ts`. |
| **HTTP** | `GET /api/admin/dashboard` (see 3.2) ; `GET /api/admin/audit/stats` → `admin-service.ts:72` `getAdminAuditStats()` → `adminFetch<{ totalEvents, errorCount }>("/admin/audit/stats")`. |
| **Backend** | `AdminController.java:49` (dashboard) ; `AdminController.java:162` `@GetMapping("/audit/stats")` → `auditLogRepository.count()` + `countByLogLevel(ERROR)+countByLogLevel(CRITICAL)` → `{ totalEvents, errorCount }`. The dedicated reports endpoint `AdminReportController.java:21` `GET /api/admin/reports/summary` → `reportService.getReportSummary()` → `ReportSummaryResponse` is **not currently consumed** by this page. |
| **Rendering** | `StatCard` grid for `totalAlumni`, `totalRequests`, `pending`, `approvedToday`, `totalEvents`, `errorCount` + recent-requests table. |
| **Auth** | ADMIN |

### 3.10 Audit Log — `/admin/audit-log` — `client/src/app/(admin)/admin/audit-log/page.tsx:10`

| Field | Value |
|-------|-------|
| **Route** | `/admin/audit-log` |
| **File** | `client/src/app/(admin)/admin/audit-log/page.tsx:10` (`"use client"`) |
| **List** | `fetchLogs()` → `getAdminAuditLogs({ page, category?, logLevel?, method? })` → `adminFetch<{ content: AuditLog[]; totalElements; totalPages }>(\`/admin/audit?${params}\`)` where `params = page,size=20,+category,+logLevel,+method` (`admin-service.ts:59`). Filters: `category IN { AUTH, ENDPOINT, DATABASE, SECURITY, USER_ACTION, SYSTEM }`, `logLevel IN { INFO,WARN,ERROR,CRITICAL }`, `method IN { GET,POST,PUT,DELETE }` (`audit-log/page.tsx:66`). |
| **HTTP (list)** | `GET /api/admin/audit?userId=&category=&logLevel=&method=&page=0&size=20` |
| **Backend** | `AdminController.java:136` `@GetMapping("/audit")` — builds `Specification<AuditLog>` on `category, logLevel, method, userId` → `auditLogRepository.findAll(spec, PageRequest(..., Sort DESC createdAt))` → `PageResponse<AuditLog>`. Developer mirror: `DeveloperAuditController.java:35` `GET /api/developer/audit` (excluded from this doc). |
| **Stats (not on this page)** | `GET /api/admin/audit/stats` (see 3.9) |
| **Realtime (SSE)** | `connectAdminAuditStream(onMessage, onError)` → `new EventSource(\`\${API_BASE}/admin/audit/stream?token=${token}\`)` (`admin-service.ts:76`), listening for `audit-event` messages → prepends to table (`audit-log/page.tsx:35`). Backend: `AdminController.java:172` `@GetMapping("/audit/stream", produces=TEXT_EVENT_STREAM)` → `auditEventPublisher.subscribe()` → `SseEmitter`. `JwtAuthenticationFilter` accepts `?token=` for this SSE path. Toggle `● Live / ○ Live` (`audit-log/page.tsx:55`). |
| **Auth** | ADMIN |
| **Note** | `features/audit-log/_services/audit-log-service.ts:23` (`queryEvents`) wraps `context.fetchAuditLogs` but is **not** used by this page (page uses `admin-service.ts` helpers). |

### 3.11 Admin Settings — `/admin/settings` — `client/src/app/(admin)/admin/settings/page.tsx:3`

| Field | Value |
|-------|-------|
| **Route** | `/admin/settings` |
| **File** | `client/src/app/(admin)/admin/settings/page.tsx:3` (`"use client"`) |
| **API** | **None** — static placeholder (`Account Settings`, `Email Notifications`, `Session Timeout` copy). No fetch/service import. |
| **Auth** | `PROTECTED_ADMIN` (layout guard) |
| **Gap** | Future: wire to settings/config endpoints (currently developer-only under `/api/developer/config`). No `GET/PUT /api/admin/settings` exists. |

### 3.12 Admin Events (Controller exists, page not in admin route group)

| Field | Value |
|-------|-------|
| **Note** | `AdminEventController.java:31` exposes `GET /api/admin/events`, `GET /api/admin/events/{id}`, `POST /api/admin/events`, `PUT /api/admin/events/{id}`, `DELETE /api/admin/events/{id}` (ADMIN). There is **no** `client/src/app/(admin)/admin/events/page.tsx` in the current repo — event management is currently handled via public/admin event controllers but has no dedicated admin UI route. Public events are served by `EventController` (1.6–1.7); admin CRUD would need a page similar to `announcements`. |
| **HTTP** | `GET /api/admin/events` ; `GET /api/admin/events/{id}` ; `POST /api/admin/events` `{ CreateEventRequest }` ; `PUT /api/admin/events/{id}` `{ UpdateEventRequest }` ; `DELETE /api/admin/events/{id}` |
| **Backend** | `AdminEventController.java:24` (`@RequestMapping("/api/admin")`, `@PreAuthorize ADMIN`) |

---

## 4. Backend Endpoint Catalog (Only endpoints relevant to Public/Admin pages)

### 4.1 Public (no auth)

| Method | Full path | Controller | Security | Used by |
|--------|-----------|------------|----------|---------|
| GET | `/api/health` | `HealthController.java:17` `@GetMapping("/health")` | PUBLIC | Infra/monitoring; not rendered |
| GET | `/api/search` | `AlumniSearchController.java:32` (`/api/search`) | PUBLIC | `/directory` (`directory/page.tsx:48`) + `lib/data/alumni.ts:60` (`searchAlumni`) |
| GET | `/api/alumni` | `AlumniController.java:26` | PUBLIC | `/directory/[slug]` static params |
| GET | `/api/alumni/{slug}` | `AlumniController.java:33` | PUBLIC | `/directory/[slug]` detail (`lib/data/alumni.ts:30`) |
| GET | `/api/events` | `EventController.java:22` | PUBLIC | `/events/[slug]` static params (`[slug]/page.tsx:11` via `getEvents`) |
| GET | `/api/events/upcoming` | `EventController.java:27` | PUBLIC | `/events` (`lib/data/events.ts:28`) |
| GET | `/api/events/past` | `EventController.java:32` | PUBLIC | `/events` (`lib/data/events.ts:39`) |
| GET | `/api/events/search?q=` | `EventController.java:37` | PUBLIC | *Available, not wired* |
| GET | `/api/events/{slug}` | `EventController.java:42` | PUBLIC | `/events/[slug]` |
| GET | `/api/announcements` | `AnnouncementController.java:20` | PUBLIC | (public announcements display) |
| GET | `/api/announcements/featured` | `AnnouncementController.java:25` | PUBLIC | `lib/data/announcements.ts:16` |
| POST | `/api/request/email-correction` | `RequestController.java:34` | PUBLIC | `/directory` modal (`directory/page.tsx:68`) |
| POST | `/api/request/new-alumni` | `RequestController.java:51` | PUBLIC | `/directory` modal (`directory/page.tsx:86`) |
| POST | `/api/login` | `AuthenticationController.java:47` | PUBLIC | `/auth/login` |
| POST | `/api/register` | `RegistrationController.java:33` | PUBLIC | `/auth/register` |
| GET | `/api/auth/verify?token=` | `AuthenticationController.java:75` | PUBLIC | `/auth/verify` |
| POST | `/api/auth/refresh` | `AuthenticationController.java:61` | PUBLIC | `auth-service.ts:106` |
| POST | `/api/auth/logout` | `AuthenticationController.java:87` | Authenticated (Bearer required), but URL in PUBLIC list — logic checks header | `auth-api.ts:166` |
| POST | `/api/otp/send` | `OtpController.java:31` `{ username, purpose }` | PUBLIC | (forgot-password flow, register after `POST /api/register`) |
| POST | `/api/otp/verify` | `OtpController.java:64` `{ username, otp, purpose }` | PUBLIC | `/auth/register` (REGISTRATION), verify |

### 4.2 Admin (ADMIN role required)

| Method | Full path | Controller | Notes |
|--------|-----------|------------|-------|
| GET | `/api/admin/dashboard` | `AdminController.java:49` | Used by `/admin/dashboard`, `/admin/reports` |
| GET | `/api/admin/alumni?query=&department=&batch=&page=&size=` | `AdminController.java:90` | `/admin/alumni` |
| GET | `/api/admin/users?query=&page=&size=` | `AdminController.java:104` | `/admin/users` |
| GET | `/api/admin/users/{id}` | `AdminController.java:114` | Intended for `/admin/users/[id]` (currently stub) |
| POST | `/api/admin/users/{id}/suspend` | `AdminController.java:119` `{ reason }` | `/admin/users` |
| POST | `/api/admin/users/{id}/activate` | `AdminController.java:128` | `/admin/users` |
| GET | `/api/admin/requests?type=&status=&query=&page=&size=` | `AdminController.java:54` | `/admin/requests` (frontend adds `type`) |
| GET | `/api/admin/request/{id}` | `AdminController.java:69` | Available, not used by list page |
| POST | `/api/admin/request/{id}/approve` | `AdminController.java:74` `{ adminNotes }` | `/admin/requests` |
| POST | `/api/admin/request/{id}/reject` | `AdminController.java:82` `{ adminNotes }` | `/admin/requests` |
| GET | `/api/admin/announcements` | `AdminAnnouncementController.java:31` | `/admin/announcements` |
| GET | `/api/admin/announcements/{id}` | `AdminAnnouncementController.java:36` | Available, not used by list |
| POST | `/api/admin/announcements` | `AdminAnnouncementController.java:41` | `/admin/announcements` |
| PUT | `/api/admin/announcements/{id}` | `AdminAnnouncementController.java:46` | `/admin/announcements` (edit + toggleActive) |
| DELETE | `/api/admin/announcements/{id}` | `AdminAnnouncementController.java:52` | `/admin/announcements` |
| GET | `/api/admin/events` | `AdminEventController.java:31` | Controller exists; **no admin UI page** |
| GET | `/api/admin/events/{id}` | `AdminEventController.java:36` | — |
| POST | `/api/admin/events` | `AdminEventController.java:41` | — |
| PUT | `/api/admin/events/{id}` | `AdminEventController.java:46` | — |
| DELETE | `/api/admin/events/{id}` | `AdminEventController.java:51` | — |
| GET | `/api/admin/reports/summary` | `AdminReportController.java:21` | Controller exists; **not consumed** (reports page uses dashboard+audit/stats) |
| GET | `/api/admin/audit?category=&logLevel=&method=&userId=&page=&size=` | `AdminController.java:136` | `/admin/audit-log` |
| GET | `/api/admin/audit/stats` | `AdminController.java:162` | `/admin/reports`, `/admin/audit-log` (future) |
| GET | `/api/admin/audit/stream` | `AdminController.java:172` (SSE `text/event-stream`) | `/admin/audit-log` Live toggle (`?token=` supported) |

---

## 5. Frontend Service → HTTP Reference (Public/Admin only)

```
client/src/lib/data/alumni.ts
  getAlumniDirectory()          → GET /api/alumni                  (apiClient)
  getAlumniProfile(slug)        → GET /api/alumni/:slug             (apiClient)
  searchAlumni(q, signal)       → GET /api/search?q=               (apiClient, maps PageResponse.content → AlumniProfile[])

client/src/lib/data/events.ts
  getEvents()                   → GET /api/events/upcoming + GET /api/events/past (merged)
  getEvent(slug)                → GET /api/events/:slug
  getUpcomingEvents()           → GET /api/events/upcoming
  getPastEvents()               → GET /api/events/past

client/src/lib/data/announcements.ts
  getAnnouncements()            → GET /api/announcements
  getFeaturedAnnouncements()    → GET /api/announcements/featured

client/src/features/auth/_services/auth-api.ts
  loginApi({username,password}) → POST /api/login
  registerApi({registerNumber,email,username,password}) → POST /api/register
  verifyEmailApi(token)         → GET  /api/auth/verify?token=
  verifyRegistrationOtp(username,otp) → POST /api/otp/verify { purpose:REGISTRATION }
  storeAuthTokens / clearAuthTokens  → (client) + POST /api/auth/logout (fire-and-forget)

client/src/features/auth/_services/auth-service.ts
  login/register/logout/getSession/refreshSession → wrappers over auth-api + wiring token provider
  wireAuthHandlers                                   → POST /api/auth/refresh on 401

client/src/features/admin/_services/admin-service.ts  (adminFetch)
  getAdminDashboard()            → GET  /api/admin/dashboard
  getAdminUsers(query, page)     → GET  /api/admin/users?query=&page=&size=20
  suspendAdminUser(id, reason)   → POST /api/admin/users/:id/suspend
  activateAdminUser(id)          → POST /api/admin/users/:id/activate
  getAdminAuditLogs({page,category,logLevel,method}) → GET /api/admin/audit?...
  getAdminAuditStats()           → GET  /api/admin/audit/stats
  connectAdminAuditStream()      → GET  /api/admin/audit/stream (SSE, EventSource, ?token=)
  getAdminAlumni(query, page)    → GET  /api/admin/alumni?query=&page=&size=20
  getAdminRequests(status, page) → GET  /api/admin/requests?status=&page=&size=20
  approveAdminRequest(id, notes) → POST /api/admin/request/:id/approve
  rejectAdminRequest(id, notes)  → POST /api/admin/request/:id/reject

Direct fetch in admin pages (not via admin-service.ts helpers)
  /admin/requests/page.tsx       → GET  /api/admin/requests (+ type filter) ; POST /api/admin/request/:id/approve|reject
  /admin/announcements/page.tsx  → GET/POST/PUT/DELETE /api/admin/announcements[/:id]
  /admin/dashboard|reports       → (via admin-service) as above

Direct fetch in public pages (not via lib/data)
  /directory/page.tsx            → GET  /api/search?query=&department=&batch=&page=&size=20
                                  POST /api/request/email-correction
                                  POST /api/request/new-alumni
```

---

## 6. How to Verify

```bash
# Public — list/search (unauthenticated)
curl -s http://localhost:8080/api/search?page=0&size=5 | jq .
curl -s http://localhost:8080/api/alumni | jq .
curl -s http://localhost:8080/api/events/upcoming | jq .
curl -s http://localhost:8080/api/announcements/featured | jq .

# Requests (public)
curl -s -X POST http://localhost:8080/api/request/email-correction \
  -H "Content-Type: application/json" \
  -d '{"registerNumber":"...","currentEmail":"old@x","newEmail":"new@x","reason":"test"}' | jq .

# Auth
curl -s -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"..."}' | jq .

# Admin (needs ADMIN JWT → TOKEN)
TOKEN="$(curl -s -X POST http://localhost:8080/api/login -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"..."}' | jq -r .accessToken)"
curl -s http://localhost:8080/api/admin/dashboard -H "Authorization: Bearer $TOKEN" | jq .
curl -s "http://localhost:8080/api/admin/users?query=&page=0&size=20" -H "Authorization: Bearer $TOKEN" | jq .
curl -s "http://localhost:8080/api/admin/audit?page=0&size=5" -H "Authorization: Bearer $TOKEN" | jq .
# SSE requires token as query param as well:
curl -N -H "Accept: text/event-stream" "http://localhost:8080/api/admin/audit/stream?token=$TOKEN"
```

---

## 7. Gaps & Next Steps (Public/Admin scope)

* `/` and `/about|contact|faq|legal/*` are static — no public stats/event/announcement APIs wired yet; if dynamic counts or CMS-backed FAQ are desired, wire `GET /api/events/upcoming` / `GET /api/admin/dashboard` (for stats) into `EventsSection`/`StatsSection`.
* `/contact` has no backend — consider adding `POST /api/contact` if form submissions should be persisted/emailed.
* `/auth/forgot-password` & `/auth/reset-password` are UI stubs — connect to `POST /api/otp/send` (`purpose=PASSWORD_RESET`) + password-reset endpoint (currently authenticated only: `POST /api/profile/change-password`).
* `/admin/alumni/[id]` and `/admin/users/[id]` render `AlumniRecordDetail` / `UserDetail` stubs — wire `GET /api/admin/users/{id}` (or `GET /api/alumni/{slug}`) and promote `alumni-mgmt-service.ts` / `user-service.ts` from dead code to real data layer.
* `GET /api/admin/reports/summary` (`AdminReportController`) is implemented but **not used** — either consume it in `/admin/reports` or remove it to avoid drift (reports page currently composes `dashboard + audit/stats`).
* `GET /api/admin/events` CRUD exists with **no admin page** — mirroring the announcements CRUD page for events would close the gap.
* SSE auth uses `?token=` query param (accepted by `JwtAuthenticationFilter`) — document as intentional for `EventSource` and review exposure in logs/CDN.
```