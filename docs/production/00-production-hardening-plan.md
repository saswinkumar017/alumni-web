# JJCET Alumni — Production Hardening & Business Logic Implementation Plan

Status: Active — created 2026-08-06 (Phase 1 completed; Phase 2 in progress)
Owner: AI-assisted session (user manages hosting manually)
Timebox: ~24h target ("deployable tomorrow")

## Execution Log
- **Phase 1 (client contract fixes) — DONE 2026-08-06**: `features/profile/feature.tsx` double-`/api` fixed (B7); `admin/announcements/page.tsx` interim prefix fix + a11y fixes (B6 — full rewrite pending Phase 2); dead `login/register/logout/refreshToken` removed from `lib/data/auth.ts`, `lib/data/jobs.ts` deleted, `lib/services/infra/analytics-service.ts` deleted, barrels `lib/data/index.ts` + `lib/services/index.ts` + `lib/services/infra/index.ts` trimmed (B12); ESLint flat config repaired (registered `eslint-plugin-import` 2.32.0 — lint previously crashed). Client typecheck clean; remaining 31 lint errors are pre-existing repo-wide `react-hooks/set-state-in-effect` + 2 security rules (deferred).
- **Correction to §1**: B1–B5 (community/message/connection/donation/notification services) were verified CLEAN — those services already use apiClient with relative paths; no `/api/api` there. The only real double-`/api` sites were profile feature + announcements page (both fixed above).

## 1. Executive Summary

The app is feature-complete on the surface (54 client pages, 25 backend controllers) but has
three classes of problems that block production:

1. **404s in production paths** — 12+ client call sites double-prefix `/api` (base URL already
   includes it), producing `/api/api/...` requests. Verified via docs + grep.
2. **Missing backend business logic** — Events, Announcements, Reports have real client pages
   but **no backend tables/endpoints**. Jobs, Analytics, Gallery are client-only stubs with no
   backend (will be cut or flagged, per decision).
3. **Not production-safe** — real credentials committed in `application.properties`
   (Gmail app password, JWT secret, MySQL password), `show-sql=true`, `ddl-auto=update`,
   debug mail logging, CORS origins not env-driven, no backend rate limiting.

User decisions (2026-08-06):
- **Hosting**: user manages manually — this plan produces code/config only, no Docker/CI.
- **UI**: match branding + public pages of https://alumni.jjcet.ac.in; keep existing portal UIs.
- **Scope**: implement Events + Announcements + Reports; cut Jobs/Analytics/Gallery stubs.
- **Secrets**: rotate Gmail app password, JWT secret, DB password; move all secrets to env vars.

## 2. Verified Baseline

### Stack
- Client: Next.js 16.2.10 (Turbopack default, `proxy.ts` instead of `middleware.ts`, async
  request APIs), React 19.2.4, TS strict, Tailwind 4 (light-only), Zustand, Axios, Zod,
  next-intl, Sonner. Scripts: `dev/build/start/lint/typecheck/test`.
- Server: Spring Boot 3.5.16, Java 21, Spring Security (JWT HS512, BCrypt-12, RBAC),
  Spring Data JPA, Flyway (V1–V3; **V1 file missing** — `baseline-on-migrate=true` covers it),
  MySQL 8.0, springdoc-openapi 2.8.9.
- `client/node_modules` has broken `.pnpm` symlinks — **do not touch**; use `pnpm install` or
  `npm ci` only if a build requires it.

### Endpoint inventory (verified, 25 controllers)
| Area | Base | Endpoints |
|---|---|---|
| Auth | `/api` | POST `/login`, POST `/register`, POST `/auth/refresh`, GET `/auth/verify`, POST `/auth/logout` |
| Profile | `/api/profile` | GET, PUT, POST `/change-password` |
| Alumni (public) | `/api/alumni` | GET, GET `/{slug}` — **no `/search`** (client calls it → 404) |
| Search | `/api/search` | GET |
| Requests | `/api/request` | POST `/email-correction`, POST `/new-alumni` |
| Messages | `/api/messages` | GET, GET `/{id}`, POST, PUT `/{id}/read`, DELETE `/{id}`, GET `/unread/count`, GET `/broadcasts` |
| Connections | `/api/connections` | GET, GET `/pending`, POST, PUT `/{id}/accept`, PUT `/{id}/reject`, DELETE `/{id}` |
| Communities | `/api/communities` | GET, GET `/{id}`, POST `/{id}/join`, POST `/{id}/leave`, GET `/{id}/messages`, POST `/{id}/messages` |
| Donations | `/api/donations` | GET, GET `/{id}`, POST, GET `/stats` |
| Notifications | `/api/notifications` | list/read (see controller) |
| Dashboard | `/api/dashboard` | GET |
| Health | `/api/health` | GET |
| Admin (ROLE_ADMIN) | `/api/admin` | `/dashboard`, `/requests`, `/request/{id}`, `/{id}/approve`, `/{id}/reject`, `/alumni`, `/users`, `/users/{id}`, `/{id}/suspend`, `/{id}/activate`, `/audit`, `/audit/stats`, `/audit/stream` (SSE) |
| Developer (ROLE_DEVELOPER) | `/api/developer/*` | users, roles, permissions(+categories), monitoring, feature-flags(+toggle), email-templates (GET only), config (GET/POST/PUT + GET `/public`), audit (+stats/export/stream) |
| **Missing** | — | events, announcements, reports, jobs, analytics |

Security: `PUBLIC_URLS` = `/api/register/**`, `/api/login/**`, `/api/auth/**`, `/api/search/**`,
`/api/alumni/**`, `/api/request/**`, `/api/otp/**`, `/api/health`. `ADMIN_URL=/api/admin/**`,
`DEVELOPER_URL=/api/developer/**`.

### Confirmed bug list (priority order)
| # | File | Lines | Bug |
|---|---|---|---|
| B1 | `client/src/features/community/_services/community-service.ts` | 26,30,34,38,42,46,50 | All 7 calls double-`/api` → `/api/api/communities` 404 |
| B2 | `client/src/features/messages/_services/message-service.ts` | 42,50,54 | getMessage/markAsRead/deleteMessage double-`/api` |
| B3 | `client/src/features/networking/_services/connection-service.ts` | 17,21,25 | accept/reject/removeConnection double-`/api` |
| B4 | `client/src/features/donations/_services/donation-service.ts` | 15 | getDonation double-`/api` |
| B5 | `client/src/features/dashboard/_services/notification-service.ts` | 13 | markNotificationRead double-`/api` |
| B6 | `client/src/app/(admin)/admin/announcements/page.tsx` | 22,42,53,59 | `${API}/api/developer/config` → double `/api` AND wrong role (developer-gated) |
| B7 | `client/src/features/profile/feature.tsx` | 17,27 | `${API}/api/...` double-`/api` |
| B8 | `client/src/lib/data/events.ts` | all | `/api/events*` — no EventController exists (public events pages 404) |
| B9 | `client/src/lib/data/alumni.ts` | search fn | `/api/alumni/search` — endpoint missing server-side |
| B10 | `client/src/lib/data/auth.ts` | login/register | `/auth/login` `/auth/register` → 404 (dead duplicates; forms use `auth-api.ts`) |
| B11 | `client/src/app/(admin)/admin/requests/page.tsx` | 72 | payload `{requestId,decision,adminNotes}` vs service `{adminNotes}` — normalize |
| B12 | `client/src/lib/services/infra/analytics-service.ts` | 54 | `/api/analytics/events` — no backend; cut or gate |

## 3. Phases

### Phase 0 — Baseline & Safety (≈30 min)
- [ ] Add `server/alumniweb/.env.example` (or `application.properties.example`) with placeholders;
      move real values out of tracked `application.properties`.
- [ ] Replace secrets in `application.properties` with `${ENV_VAR}` placeholders:
  `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `MAIL_USERNAME`, `MAIL_PASSWORD`.
- [ ] Add `application-prod.properties`: `ddl-auto=validate`, `show-sql=false`,
  debug mail logging off, `logging.level.com.alumniweb=INFO`.
- [ ] Verify builds: `client: npm run typecheck && npm run lint`; `server: mvnw compile`.
- [ ] Note for user (manual): rotate Gmail app password (Google → Security → App passwords),
      regenerate JWT secret (HS512 ≥ 64 bytes), change MySQL root/app password.

### Phase 1 — Client API contract fixes (≈1–2 h)
- [ ] B1–B5: strip `/api/` prefix from 15 call sites (verify each against Phase-2 endpoint list).
- [ ] B8: after backend lands, rewire `lib/data/events.ts` (and `features/events/_services/event-service.ts`)
      to the new public EventController; keep `[slug]` page `generateStaticParams` working.
- [ ] B9: add `GET /api/alumni/search` to `AlumniController` (delegates to `AlumniSearchService`)
      OR point `lib/data/alumni.ts` at `/api/search` — pick one, keep client untouched where possible.
- [ ] B10: delete dead `login()`/`register()` from `lib/data/auth.ts` (keep `requireAuth`,
      `requireRole`, `getCurrentUser`).
- [ ] B11: align approve payload; add `requestId`+`decision` to `admin-service.approveAdminRequest`.
- [ ] B12: remove analytics event POSTs (or gate behind feature flag `analytics.enabled`).
- [ ] B6/B7: once announcements backend exists, rewrite announcements page to call
      `/api/admin/announcements`; strip double `/api` in `profile/feature.tsx`.
- [ ] Delete/cut stubs: `lib/data/jobs.ts`, gallery types if unused; verify no imports remain.

### Phase 2 — Missing backend business logic (≈3–4 h)
All new code follows existing patterns: entity in `model/`, repo in `model/repository/`,
service interface + `service/impl/`, controller in `controller/`, DTOs in `dto/`,
Flyway migration in `resources/db/migration/`.

1. **Events** (public read + admin CRUD)
   - `V4__add_events.sql`: `event` table (id, slug unique, title, description, venue, starts_at,
     ends_at, capacity, image_url, status enum DRAFT/PUBLISHED/CANCELLED, created_by FK user_account, timestamps).
   - `Event`, `EventRepository` (find by slug, upcoming/past queries), `EventService` +
     `EventServiceImpl` (validation: title/date required, slug unique).
   - `EventController` (`/api/events`, public): GET list (upcoming default), GET `/{slug}`,
     GET `/upcoming`, GET `/past` — return `PageResponse`-style or plain list per client.
   - `EventAdminController` or extend `AdminController` (`/api/admin/events`): CRUD + publish —
     `@PreAuthorize("hasRole('ADMIN')")`, audit via `AuditEventPublisher`.
   - Wire client: `lib/data/events.ts` → real endpoints; `(public)/events` + `[slug]` + alumni events.

2. **Announcements** (admin CRUD, alumni read)
   - `V5__add_announcements.sql`: `announcement` table (id, title, body, category, target
     audience enum, published flag, created_by, timestamps).
   - `Announcement`, `AnnouncementRepository`, `AnnouncementService(+Impl)`.
   - `GET /api/admin/announcements` (+ POST/PUT/DELETE) for admins; `GET /api/announcements`
     public/authenticated list for alumni pages.
   - Rewire admin announcements page (B6) — remove the `/api/developer/config` hack.

3. **Reports** (admin, query-only — no new tables)
   - `ReportController` under `/api/admin/reports`: `/summary` (users by role/status, requests
     by status, donations total/count, audit counts) — computed from existing repositories.
   - Wire `(admin)/admin/reports/page.tsx`.

4. **Alumni search** (B9): `GET /api/alumni/search` in `AlumniController` via `AlumniSearchService`.

### Phase 3 — Security hardening (≈2 h)
- [ ] Secrets → env (Phase 0); verify nothing sensitive remains in tracked files (grep
      `mysql21`, `bmqosacwyzjtvchn`, JWT value).
- [ ] `CorsFilter`/`CorsConfig`: read allowed origins from env (`CORS_ALLOWED_ORIGINS`,
      comma-separated; default localhost:3000).
- [ ] Backend rate limiting: `RateLimitFilter`/interceptor on `/api/login`, `/api/register`,
      `/api/request/**`, `/api/otp/**` (per-IP sliding window, in-memory; no new deps).
- [ ] `GlobalExceptionHandler`: verify it maps `MethodArgumentNotValidException` →
      `ValidationErrorResponse` (exists) and does not leak internals (stacktrace already off).
- [ ] Server security headers mirror client (X-Content-Type-Options, X-Frame-Options,
      Referrer-Policy) on API responses.
- [ ] Disable `spring.mail.properties.mail.smtp.debug` in prod; `include-stacktrace=never` stays.
- [ ] JWT: confirm refresh rotation + logout revocation path (`AppSessionRepository` exists).

### Phase 4 — UI alignment with https://alumni.jjcet.ac.in (≈3 h)
1. Capture reference: webfetch `/`, `/about`, `/contact` → extract nav, hero headline
   ("Register At JJCET Alumni Portal For Great Networking & Opportunity"), sections, footer,
   palette, logo (`/wp-content/uploads/2021/05/jjcet-site-logo.png`).
2. Branding: add logo asset (download via curl or hotlink with `images.remotePatterns` entry),
   set site name/colors in design tokens to match reference; update `config/navigation.ts` +
   `(public)` layouts.
3. Public pages: rework home hero + section copy, about, contact, footer to mirror the
   reference site's content/structure while keeping the existing design system.
4. Keep alumni/admin/developer portal UIs unchanged (decision).

### Phase 5 — Verification & QA (≈1–2 h)
- [ ] `client: npm run typecheck && npm run lint && npm run build`.
- [ ] `server: mvnw -q compile && mvnw -q test` (3 existing tests must pass).
- [ ] Manual smoke (local): register/login → alumni dashboard; community/messages/connections/
      donations actions (B1–B5 fixed); events list + detail (B8); admin announcements CRUD (B6);
      admin reports; directory search (B9).
- [ ] E2E: optionally author 3 Playwright smoke specs (public home, login, admin audit) — low priority.
- [ ] Hand-off note: document env vars + seed creds rotation for user's manual deploy.

## 4. Out of scope (user decision)
- Docker/CI/CD/hosting artifacts — user deploys manually.
- Jobs, Analytics, Gallery features — stubs removed/flagged, no backend.
- Password-reset-by-email flow (existing UX: "contact admin") — unless time remains.

## 5. Risk register
| Risk | Mitigation |
|---|---|
| Gmail app password committed — exposure | Rotate now; move to env before any push |
| `client/node_modules` broken symlinks | Don't touch; `pnpm install` if build fails |
| No git history (0 commits) | Work in place; user approves committing at checkpoints |
| Flyway V1 file absent | `baseline-on-migrate=true`; new migrations V4/V5 applied normally |
| Reference site blocks scraping (Playwright ERR_ABORTED) | Use webfetch HTML; fall back to user-supplied screenshots |
