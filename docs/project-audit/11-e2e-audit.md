# 11 — E2E Audit (Playwright + GitNexus)

Status: In-progress (audit complete; specs not yet authored)

## 1. Harness state

- `client/playwright.config.ts` is fully configured:
  - `testDir: "./e2e"`, chromium-only, `baseURL: http://localhost:3000`.
  - `webServer`: `npm run build && npm run start`, `reuseExistingServer: true` (false in CI), `timeout` default.
  - `retries: 2` in CI only, `trace: "on-first-retry"`, `screenshot: "only-on-failure"`.
- **Zero specs exist.** `client/e2e/` and `client/tests/` are empty; no `*.spec.ts`/`*.test.ts` anywhere in the repo.
- Command exists (`npm run test:e2e`) but runs nothing.
- Backend must be running on `:8080` with seed data (`DataSeeder`/dev users) for any authed journey.

## 2. Auth model that E2E must reproduce (dual implementation — split-brain)

Two parallel stacks coexist; only one is wired to the forms:

| Concern | Wired path (forms/pages) | Dead/broken duplicate |
| --- | --- | --- |
| Login | `features/auth/_services/auth-api.ts` → raw `fetch` POST **`/login`** (→ `http://localhost:8080/api/login`) | `lib/data/auth.ts login()` → POST `/auth/login` → **404** (server has no `/auth/login`) |
| Register | `auth-api.ts` → `/register` (→ `/api/register`) | `lib/data/auth.ts register()` → `/auth/register` → **404** |
| Refresh | `auth-api.ts` / `lib/data/auth.ts` `/auth/refresh` → **OK** (server has it) | — |
| Logout | `/auth/logout` → **OK** | — |
| Session (SSR) | `getServerUser(cookieHeader)` → `fetch /api/profile` w/ `Bearer session_token` → **OK** (ProfileController) | `getCurrentUser()` (client, `/profile`) unused in most flows |
| Token storage | `storeAuthTokens` → `localStorage.accessToken`; `session_token` + `user_role` cookies set after login (commits `b027740`, `d0ce606`) | `lib/data/instance.ts` reads cookies + `X-CSRF-Token` |

Playwright storage-state strategy: seed `session_token`/`user_role` cookies + `localStorage.accessToken` (via `storageState` or `context.addInitScript`) instead of scripting the login form; login flow itself still gets one dedicated happy-path spec.

## 3. Route inventory for coverage

Protected via `proxy.ts`/`src/lib/route-protection.ts`:

| Group | Routes | Auth |
| --- | --- | --- |
| Public | `/`, `/events`, `/events/[slug]`, `/directory`, `/request-access`, `/legal/*` | open (legals = static) |
| Auth (transient) | `/auth/login`, `/auth/register`, `/auth/verify-email`, `/auth/otp` | redirect to `/alumni/dashboard` when authed |
| Alumni | `/alumni/dashboard`, `/alumni/profile`, `/alumni/community*`, `/alumni/messages`, `/alumni/networking*`, `/alumni/donations`, `/alumni/events`, `/alumni/settings`, `/alumni/announcements` | `session_token` cookie |
| Admin | `/admin/dashboard`, `/admin/requests`, `/admin/alumni`, `/admin/users*`, `/admin/audit`, `/admin/reports`, `/admin/overrides` | cookie + `user_role=ADMIN` |
| Developer | `/developer/dashboard`, `/developer/audit`, `/developer/config`, `/developer/feature-flags`, `/developer/roles`, `/developer/permissions`, `/developer/users`, `/developer/monitoring`, `/developer/api-keys`, `/developer/auth-policies`, `/developer/branding`, `/developer/sessions`, `/developer/mfa`, `/developer/maintenance` | cookie + `user_role=DEVELOPER` |

User roles on backend: `ADMIN`, `USER`, `DEVELOPER` (`SecurityConstants`).

## 4. Backend endpoints (complete controller inventory)

Controllers under `controller\` (22 files): `AdminController` (`/api/admin`: dashboard, requests, request/{id}/approve|reject, alumni, users, users/{id}, suspend/activate, audit, audit/stats, audit/stream SSE), `AlumniMessageController` (`/api/messages`), `AlumniSearchController` (`/api/search`), `AuditStreamController` (`/api/developer/audit/stream`), `AuthenticationController` (`/api` login, auth/refresh, auth/verify, auth/logout), `CommunityController` (`/api/communities`), `ConnectionController` (`/api/connections`), `DashboardController` (`/api/dashboard`), `DeveloperAuditController` (`/api/developer/audit`), `DeveloperConfigController`, `DeveloperEmailTemplateController`, `DeveloperFeatureFlagController`, `DeveloperMonitoringController`, `DeveloperPermissionController`, `DeveloperRoleController`, `DeveloperUserController`, `DonationController` (`/api/donations`), `HealthController` (`/api/health`), `NotificationController` (`/api/notifications`), `OtpController`, `ProfileController` (`/api/profile`), `RegistrationController`, `RequestController` (`/api/request`).

## 5. Confirmed integration bugs (block or flake E2E)

### A. Double `/api` prefix in feature services → 404
`@/lib/api/client` base is `http://localhost:8080/api`; several item/action calls redundantly prefix `/api/`:

| File | Line(s) | Broken call | Result |
| --- | --- | --- | --- |
| `features/community/_services/community-service.ts` | 26, 30, 34, 38, 42, 46, 50 | **all** community calls (`/api/communities...`) | `/api/api/communities` 404 |
| `features/messages/_services/message-service.ts` | 42, 50, 54 | `getMessage`, `markAsRead`, `deleteMessage` | `/api/api/messages/...` 404 (list/unread/broadcasts OK) |
| `features/networking/_services/connection-service.ts` | 17, 21, 25 | `accept`, `reject`, `removeConnection` | `/api/api/connections/...` 404 |
| `features/donations/_services/donation-service.ts` | 15 | `getDonation(id)` | `/api/api/donations/...` 404 |
| `features/dashboard/_services/notification-service.ts` | 13 | `markNotificationRead` | `/api/api/notifications/...` 404 |

Pattern: list/collection endpoints correct (`/x`), item/action endpoints double-prefixed. Detail pages and action buttons fail at runtime; list views work.

### B. Public pages with no backend endpoint → SSR 404
- **Events**: `lib/data/events.ts` → `GET /events`, `/events/{slug}`, `/events/upcoming`, `/events/past` → `/api/events*`. **No EventController exists.** `(public)/events` + `[slug]` render error/empty; `generateStaticParams` returns `[]`.
- **Directory**: `lib/data/alumni.ts` → `/alumni`, `/alumni/{slug}`, `/alumni/search` → `/api/alumni*`. **No public alumni endpoint** (only `/api/admin/alumni`, `/api/search`). `(public)/directory` broken.

### C. Auth duplicates
`lib/data/auth.ts login()`/`register()` target `/auth/login`/`/auth/register` (404) — unused by forms (forms use `auth-api.ts`), but any spec importing the data layer would hit them.

## 6. Recommended E2E scope (phased)

Phase 1 — smoke (health of harness + happy paths):
1. Public: `/` renders; `/legal/...` static pages; `/events` + `/events/[slug]` **expected-failure guard** (documented known 404, assert graceful UI not crash).
2. Login happy path via form (`/auth/login` → `/alumni/dashboard`); bad-credentials assertion.
3. Auth redirect: unauthenticated `/alumni/dashboard` → `/auth/login?redirect=...`; authenticated `/auth/login` → `/alumni/dashboard`.

Phase 2 — authed journeys (storage-state seeded): alumni dashboard stats, profile read, community list (document known item-action 404s), messages list, donations list, networking list, settings read.

Phase 3 — admin/developer: admin audit-log, admin requests approve/reject, developer audit stream (SSE), feature-flags read, roles list.

Phase 4 — regression: after fixing double-`/api` + missing endpoints, re-run full suite.

## 7. Pre-flight checklist before authoring

- [ ] Backend on `:8080`; confirm `POST /api/login`, `GET /api/profile` with dev creds (or capture auth responses for storage-state fixture).
- [ ] Seed users for alumni/admin/developer roles; note any role-based route differences.
- [ ] Decide spec of `storageState` fixture vs `addInitScript` token injection.
- [ ] Fix (or explicitly document + guard) Section 5 bugs so smoke suite is stable.
- [ ] Confirm `npm run build` + `npm run start` on `:3000` (webServer) works headless on this machine.

## 8. GitNexus cross-reference

- Index: `client` repo, 7,679 nodes / 10,349 edges / 99 communities / 206 flows (`indexedAt 2026-08-02`, lastCommit `b027740`). FTS disabled (offline) — structural/cypher queries only.
- Page→flow map used to derive Section 3/6 (e.g. `CommunityDetailPage → GetServerUser/GetToken/HandlePost`, `AlumniMessagesPage → GetServerUser/GetToken`, `UsersPage → FetchUsers`, `AuditPage → ExportAuditLogs/GetAuthHeaders`).
