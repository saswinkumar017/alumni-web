# JJCET Alumni — Feature Logic & Design System Enhancement Plan

Status: Active — created 2026-08-07
Owner: AI-assisted session (user deploys manually)
Scope: Networking (connections/suggestions), Community, profile routing, design-token alignment with https://alumni.jjcet.ac.in
Prereq: Phase 0–2 of `docs/production/00-production-hardening-plan.md` (API contract fixes + missing backend) are assumed done.

## 1. Executive Summary

The alumni features look complete but are **logically inconsistent** and **visually scattered**:

1. **Broken profile links from the Connections tab.** Cards link to `/alumni/networking/{numeric user id}` but the
   profile route resolves `/api/alumni/{slug}` by **register number** (`AlumniSearchServiceImpl.getAlumniProfile` →
   `findByRegisterNumber`). Every connection-card link 404s for register numbers like `20CS001`. Suggestions cards
   (which use `registerNumber`) work, which makes the inconsistency obvious.
2. **Status enum lies to the client.** Backend stores `ACCEPTED/PENDING/REJECTED` (uppercase); the client
   `Connection.status` type says `"pending"|"accepted"|"rejected"` (lowercase). Nothing compares it today, so it is
   latent — but it is a guaranteed future bug and breaks any status-driven UI.
3. **Two auth guards, two route validators, two api clients.** Networking page uses `getCurrentUser()` + redirect;
   community page uses `requireAuth()`. Networking uses `validateId()` (actually a slug sanitizer); community uses
   `Number(idStr)+isNaN`. Networking/community services use the minimal `@/lib/api/client` (no timeout/retry/refresh);
   the directory/profile services use the richer `./instance` Result-client. Fragmented contract layers.
4. **Client-side pagination + fetch-all.** `CommunityList` and `NetworkingListClient` fetch entire collections and
   slice/filter in the browser; backend supports `batch`/`department` filters but no pagination. Not scalable.
5. **Brand tokens bypassed.** The live site's palette was captured (see §3); `globals.css` already defines a matching
   `--primary` #2d5be3 token family, but feature components hardcode Tailwind defaults (`bg-blue-600`,
   `text-zinc-900`, `bg-zinc-100`) — hence the "scattered" feel.

Goal: one identity contract (register-number slug for public profiles), consistent auth/validation, server-driven
pagination, and 100% token-based styling — verified against the live reference.

## 2. Verified Baseline

- Client: Next.js 16.2.10 (Turbopack default, async params/searchParams), React 19.2.4, TS strict, Tailwind 4
  (light-only), `client/node_modules` broken symlinks — do not touch; use `pnpm install`/`npm ci` only if a build
  needs it.
- Server: Spring Boot 3.5.16, Java 21, JWT HS512, Flyway V1–V3 (`baseline-on-migrate=true`), MySQL 8, springdoc 2.8.9.
- Live reference: `https://alumni.jjcet.ac.in/` is WordPress + Elementor + BuddyPress (`bp-legacy`), title
  "Register At JJCET Alumni Portal For Great Networking & Opportunity", 179 console errors (reference site is noisy;
  we only copy brand, not behavior).

### Confirmed endpoints
| Resource | Base | Endpoints |
|---|---|---|
| Connections | `/api/connections` | GET (ACCEPTED only), GET `/pending`, GET `/sent`, GET `/suggestions?batch=`, POST (send), PUT `/{id}/accept`, PUT `/{id}/reject`, DELETE `/{id}` |
| Communities | `/api/communities` | GET (batch/department filters), GET `/{id}` (isMember), POST (create), POST `/{id}/join`, POST `/{id}/leave`, GET `/{id}/messages`, POST `/{id}/messages` |
| Alumni (public) | `/api/alumni` | GET, GET `/{slug}` where **slug = register number** (e.g. `20CS001`) |

## 3. Captured Design Palette (verified live 2026-08-07 via Playwright)

| Token | Live value | Source | Client mapping |
|---|---|---|---|
| Primary | `#2d5be3` | `--wp--preset--color--cirkle-primary` | `--primary` (oklch ~ #2d5be3 family) in `globals.css` ✅ |
| Secondary | `#34b7f1` | `--cirkle-secondary` | add `--secondary` token |
| Navy/indigo | `#36348E` (rgb 54,52,142) | computed section bg | add `--accent` / `--brand-navy` token |
| Tint light | `#F7F8FF` (rgb 247,248,255) | computed container bg | add `--surface-tint` |
| Tint 2 | `#EFF1FF` (rgb 239,241,255) | computed container bg | add `--surface-tint-strong` |
| Header bg | `#F4F4F4` | `--color-headers-background` | add `--surface-muted` |
| Dark | `#0a0a0a` | `--cirkle-dark` | keep existing `--foreground` |
| Body text | rgb(100,100,100) | computed `body` color | `--muted-foreground` reference |

Decision: keep `#2d5be3` as primary (already matches), add the navy/tints/secondary as new semantic tokens, then
**migrate every hardcoded `blue-*`/`zinc-*` in feature components to tokens** so the UI shares one accent.

## 4. Confirmed Bug & Gap Register (priority order)

| # | Where | Lines | Issue |
|---|---|---|---|
| N1 | `features/networking/_components/networking-list-client.tsx` | 145 | Connection card links to `/alumni/networking/${c.recipientId}` (numeric user id). Profile route requires register number → **404**. |
| N2 | `dto/connection/ConnectionResponse.java` | 6–14 | Missing `recipientRegisterNumber` (and `requesterRegisterNumber`) — client has no way to build the correct profile link. |
| N3 | `types/domain/connection.ts` | 9 | `status: "pending"\|"accepted"\|"rejected"` vs backend `ACCEPTED/PENDING/REJECTED`. Fix type (or map in service). |
| N4 | `features/networking/_components/networking-list-client.tsx` | 145, 229 | Connections tab and Suggestions tab build profile URLs from **different identity keys** (user id vs registerNumber). Unify. |
| N5 | `app/(alumni)/alumni/networking/[id]/page.tsx` | 21–26 | Uses `getCurrentUser()`+`redirect` (other detail pages use `requireAuth()`); `validateId` is a slug sanitizer, not an id validator. |
| N6 | `app/(alumni)/alumni/community/[id]/page.tsx` | 15–18 | `Number(idStr)+isNaN` instead of a shared validator; no `validateId` — inconsistent with N5. |
| N7 | `lib/route-params.ts` | 9–15 | `validateId` misnamed — it allows non-numeric slugs. Either rename to `validateSlug`-style and use consistently, or add a real numeric `validateNumericId`. |
| N8 | `features/networking/_components/networking-list-client.tsx` | 30–35 | `Promise.all` of 4 requests on mount, full reload after every action (accept/reject/withdraw/connect). Optimistic updates + targeted refetch needed. |
| N9 | `features/community/feature.tsx` | 26–51 | Fetch-all communities, client-side search + slice pagination (`PAGE_SIZE=12`). Move filtering/paging server-side (backend has batch/department but no paging). |
| N10 | `lib/api/client.ts` | whole | No timeout, no retry, no token refresh, sync `localStorage.getItem` (fine in browser, N/A on server). Distinct from richer `lib/data/instance` client — consolidate or document boundary. |
| N11 | `lib/data/alumni.ts` | 24–34 | `getAlumniProfile(slug)` → `/alumni/{slug}`. This is correct (register-number slug) — keep as the single source of truth for profile URLs. |
| N12 | `features/networking/feature.tsx` | 11–22 | `NetworkingProfile({id})` passes `id` straight to `getAlumniProfile(id)` — must receive the register-number slug, not a user id. Enforce at the call site (page) via shared helper `getAlumniProfileSlug`. |
| N13 | `types/domain/community.ts` | 10–23 | `Community` type has no `isOwner`/member-role field though backend `CommunityMember.role` exists — future moderation gate. Optional. |
| N14 | `ConnectionService.getConnections` | 24–28 | Already filters to ACCEPTED ✅. Suggest sort by `createdAt` desc and cap page size. |

## 5. Phases

### Phase A — Design-system alignment (≈2 h)
- [ ] Add missing semantic tokens to `app/globals.css`: `--secondary`, `--brand-navy`, `--surface-tint`,
      `--surface-tint-strong`, `--surface-muted` from §3; keep `--primary` #2d5be3.
- [ ] Grep feature dirs for hardcoded `bg-blue-6|text-zinc-9|bg-zinc-1|border-zinc-3` → replace with token utilities
      (e.g. `bg-primary`, `text-foreground`, `bg-surface-tint`). Files known affected:
      `networking-list-client.tsx`, `features/community/feature.tsx`, `profile-actions-section.tsx`,
      `profile-header-section.tsx`, admin/announcements page.
- [ ] Verify with Playwright against live `alumni.jjcet.ac.in` side-by-side screenshots (see Phase E).

### Phase B — Networking identity contract (≈2–3 h)
Single rule: **public alumni profile URL key = register number slug** (matches `/api/alumni/{slug}`).
- [x] Backend: add `recipientRegisterNumber` + `requesterRegisterNumber` to `ConnectionResponse` (populate via
      `resolve()` — thread `MasterAlumni.getRegisterNumber()`; requires looking up MasterAlumni by user id in
      `ConnectionService`).
- [x] Client: `networking-list-client.tsx:145` → link to
      `/alumni/networking/${c.recipientRegisterNumber}` (fall back to `recipientId` only if null, for pre-alumni users).
      Also fixed pending/recipient links in the same component.
- [x] Client: `types/domain/connection.ts` → add `recipientRegisterNumber?`, `requesterRegisterNumber?`; fix
      `status` to uppercase union OR normalize in service; add `registerNumber` to `ConnectionSuggestion` (already `string|null`).
- [x] Add shared helper `getAlumniProfileSlug(slug|id)` in `lib/data/alumni.ts` (or `route-params.ts`) and use it in
      `networking/[id]/page.tsx` so NetworkingProfile always receives the slug.
- [x] Normalize the connection-status type: map server `PENDING/ACCEPTED/REJECTED` → client union once in
      `connection-service.ts` so UI code stays lowercase-safe.

### Phase C — Community & networking list correctness (≈2 h)
- [ ] Backend: add pagination to `GET /api/communities` (`page`, `size`) returning `PageResponse` (exists in
      `dto/common/PageResponse.java`); keep `batch`/`department` filters. Same for `GET /api/connections` (page/size).
- [ ] Client `CommunityList`: server-driven page state (`?page=`), keep client search only as a secondary filter;
      wire `createCommunity` → refresh page 1.
- [ ] Client `NetworkingListClient`: optimistic status update on connect/accept/reject/withdraw (patch the single
      suggestion/connection locally), then background refetch instead of full `load()`.
- [ ] Align auth guards: both `networking/[id]/page.tsx` and `community/[id]/page.tsx` use `requireAuth()`; both use
      the same id validator (numeric for community, register-number slug for networking — via shared `validateId` /
      `validateSlug` from N7).

### Phase D — API client consolidation (≈1 h)
- [ ] Decide boundary: keep minimal `lib/api/client.ts` for browser feature services but add `AbortSignal.timeout`
      (or a default `timeout: 15000`) + `retry-once` on 5xx; do NOT silently duplicate the Result-client.
- [ ] Document in `docs/adr/` that `lib/data/*` (Result-based, cache tags) is for directory/profile reads and
      `features/*/_services` (plain apiClient) is for authenticated actions. Update both barrels to match.
- [ ] Ensure `apiClient` never called server-side (it reads `localStorage`). Grep for `apiClient.` usage inside
      server components/layouts and move to `lib/data/*`.

### Phase E — Verification & QA (≈1–2 h)
- [ ] `client: npm run typecheck && npm run lint && npm run build` (note: `next lint` removed — use `npx eslint .`).
- [ ] `server: .\mvnw.cmd compile` (add `MAVEN_OPTS=-Xms256m -Xmx768m` if OOM while dev server runs).
- [ ] Backend smoke (curl, login first to get Bearer):
  - `GET /api/connections` → only `ACCEPTED`, includes `recipientRegisterNumber`.
  - `GET /api/connections/suggestions?batch=2020` → statuses correct.
  - `GET /api/alumni/20CS001` → 200; `GET /api/alumni/3` (numeric) → 404 (expected — proves links must use register number).
- [ ] Playwright MCP (reliable; openbrowser MCP drops sessions):
  1. Capture `alumni.jjcet.ac.in` palette screenshot → compare against client Networking/Community pages.
  2. Client: log in (alumni / `Alumni@123`) → Networking → Connections tab → click a card → profile renders (200).
  3. Suggestions tab → Connect → card flips to "Requested" without full page reload.
  4. Community → create → appears; join/leave toggles; message posts with sender name.
- [ ] `gitnexus detect_changes` before committing (index on `alumni-web`; FTS indexes degraded — run
      `gitnexus analyze --repair-fts` if keyword search needed).

## 6. Out of scope (this pass)
- WebSocket/SSE realtime (polling kept), DM threads, photo upload, admin community moderation UI, dark mode.
- Rebuilding reference site behaviors (BuddyPress replication); only brand palette is copied.

## 7. Risk register
| Risk | Mitigation |
|---|---|
| N1 broken links shipped | Fix before deploy; E2E step 2 covers it |
| Backend pagination changes client contracts | Keep default page/size so existing callers unaffected; update contract test |
| Two api clients drift | ADR decision + barrel sweep in Phase D |
| `client/node_modules` symlinks | Don't touch; build/typecheck only |
| Live site slow/unstable for screenshots | Use Playwright with generous waits; palette already captured in §3 |

## 8. Execution log
- 2026-08-07: Palette captured from live site (Playwright MCP). DTOs, services, and pages read; bugs N1–N14
  confirmed with file:line. Plan created.
- 2026-08-07: Phase A done — migrated `community/feature.tsx`, `networking/*` (list client, profile-info,
  profile-card, feature skeleton) to semantic tokens; grep-verified zero hardcoded colors; typecheck + eslint clean
  (2 pre-existing `set-state-in-effect` only).
- 2026-08-07: Phase B done — added `requesterRegisterNumber`/`recipientRegisterNumber` to `ConnectionResponse`
  (populated in `ConnectionService.resolve()` via `getRegisterNumber`); fixed profile links in all three tabs to use
  register-number slug with `recipientId`/`requesterId` fallback; normalized connection `status` (uppercase→lowercase)
  in `connection-service.ts`; added `getAlumniProfileSlug` helper + used it in `networking/[id]/page.tsx`.
  Backend `mvnw.cmd compile` → BUILD SUCCESS; client typecheck passes; eslint only pre-existing error.
