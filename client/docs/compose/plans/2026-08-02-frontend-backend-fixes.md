# Frontend/Backend Contract Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the locked contract mismatches between the Next.js client and the Spring Boot backend, and remove known dead code, so public/alumni pages resolve without 404s and the dashboard contract matches the client's types.

**Architecture:** Targeted fixes to existing files — no new architectural changes. New backend endpoints reuse the existing `MasterAlumniRepository`, `MasterAlumniMapper`, and exception-handling machinery. Client changes are confined to `_services` files, `lib/data`, and two event pages.

**Tech Stack:** Next.js 16 (Turbopack, `proxy.ts`, async request APIs), React 19, TypeScript, Zod (branded IDs), Vitest; Spring Boot (Java 21), MapStruct, Spring Security, MockMvc.

## Global Constraints

- Next.js 16: `cookies`, `headers`, `params`, `searchParams` are ASYNC only; Turbopack is default; ESLint flat config (`npx eslint .`), `next lint` removed.
- Do NOT modify `AGENTS.md` or stage status.
- The `server/alumniweb` directory is NOT a git repository. Only `client/` is under git. Server changes therefore cannot be committed via `git` — skip commit steps for server files (or note them as manual FS changes).
- The client git tree is dirty with unrelated uncommitted WIP. Each client task must stage/commit ONLY its own files (`git add <exact paths>`).
- Keep the two client API layers straight: `_services/*` use `apiClient` from `@/lib/api/client` (fetch-based, base `http://localhost:8080/api`, NO `.data` unwrap, 401 → redirect). `lib/data/*` use the axios `apiClient` from `@/lib/data/instance` (baseURL already `/api`, axios paths like `/alumni` are correct — do NOT add `/api`).
- Axios-layer paths (`lib/data/{alumni,events,auth}.ts`) are already correct; the missing piece there is backend endpoints, not client paths.
- Vitest: `npm test` (vitest), `npm run typecheck` (tsc --noEmit), `npm run lint` (eslint). Server: `.\mvnw.cmd test` / `.\mvnw.cmd compile`.

---

### Task 1: Strip double `/api` prefix from five `_services` files + contract tests

**Covers:** Every service call whose `apiClient` path starts with `/api/...` even though `apiClient` already prefixes `env.api.baseUrl` = `http://localhost:8080/api` (double `/api/api` → 404).

**Files (edit):**
- `client/src/features/community/_services/community-service.ts` — `getCommunities` (line 26), `getCommunity` (30), `joinCommunity` (34), `leaveCommunity` (38), `getCommunityMessages` (42), `postCommunityMessage` (46); `createCommunity` (line 50) is already correct (`/api/communities` → `/communities` too, for consistency)
- `client/src/features/messages/_services/message-service.ts` — `getMessage` (42), `markAsRead` (50), `deleteMessage` (54)
- `client/src/features/networking/_services/connection-service.ts` — `acceptConnection` (17), `rejectConnection` (21), `removeConnection` (25)
- `client/src/features/donations/_services/donation-service.ts` — `getDonation` (15)
- `client/src/features/dashboard/_services/notification-service.ts` — `markAsRead` (13)

**Interfaces:**
- Consumes: `apiClient.get/post/put/delete` from `@/lib/api/client`
- Produces: paths like `/communities`, `/messages/{id}`, `/connections/{id}/accept`, `/donations/{id}`, `/notifications/{id}/read` (no leading `/api`)

- [ ] **Step 1: Write the failing contract test**

Create `client/tests/api-path-contract.test.ts`. Mock `globalThis.fetch` with `vi.fn()`, set `localStorage.setItem("accessToken", "test-token")` in `beforeEach`, and have the mock return `new Response(JSON.stringify({ content: [] }), { status: 200 })`. For each affected service function, assert `fetch` was called with a URL that starts with `http://localhost:8080/api` and does NOT contain `/api/api`.

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getCommunities, getCommunityMessages } from "@/features/community/_services/community-service";
import { getMessage } from "@/features/messages/_services/message-service";
import { acceptConnection } from "@/features/networking/_services/connection-service";
import { getDonation } from "@/features/donations/_services/donation-service";
import { markAsRead as markNotificationRead } from "@/features/dashboard/_services/notification-service";

const API_BASE = "http://localhost:8080/api";

beforeEach(() => {
  localStorage.setItem("accessToken", "test-token");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ content: [] }), { status: 200 })
  ));
});

function expectNoDoubleApi(calls: unknown[]) {
  const url = String(calls[0]);
  expect(url).toMatch(new RegExp(`^${API_BASE}`));
  expect(url).not.toContain("/api/api");
}

describe("API path contract (no double /api)", () => {
  it("community-service", async () => {
    await getCommunities();
    expectNoDoubleApi((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]);
    await getCommunityMessages(1);
    expectNoDoubleApi((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[1]);
  });
  it("message-service", async () => {
    await getMessage(1);
    expectNoDoubleApi((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]);
  });
  it("connection-service", async () => {
    await acceptConnection(1);
    expectNoDoubleApi((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]);
  });
  it("donation-service", async () => {
    await getDonation(1);
    expectNoDoubleApi((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]);
  });
  it("notification-service", async () => {
    await markNotificationRead(1);
    expectNoDoubleApi((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]);
  });
});
```

Run `npm test` — expect failures (URLs contain `/api/api`).

- [ ] **Step 2: Fix the community service**

In `community-service.ts`, remove the leading `/api` from the 6 paths listed above (all except the correct one becomes `/communities`, `getCommunity` → `/communities/${id}`, join/leave/messages posts → `/communities/${id}/...`, `createCommunity` → `/communities`).

- [ ] **Step 3: Fix message, connection, donation, notification services**

Same edit in the other four files, per the line list above. Use a single logical change per file (string-only edits; no signature changes).

- [ ] **Step 4: Verify**

Run `npm test` (contract tests pass), `npm run typecheck`, `npm run lint`.

- [ ] **Step 5: Commit (client only)**

`git add` exactly: `tests/api-path-contract.test.ts` and the five `_services/*.ts` files. Commit message: `fix: strip double /api prefix in feature service calls`.

---

### Task 2: Public backend alumni endpoints + re-enable directory detail

**Covers:** Client `directory/[slug]/page.tsx` and `lib/data/alumni.ts` call `/api/alumni` and `/api/alumni/{slug}`, which do not exist on the server. Add them as public routes. Map server `MasterAlumni` to the client `AlumniProfileSchema` shape.

**Server files (create/edit — NO git):**
- Create: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/dto/search/AlumniProfileResponse.java`
- Create: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/controller/AlumniController.java`
- Edit: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/service/AlumniSearchService.java` (interface)
- Edit: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/service/impl/AlumniSearchServiceImpl.java`
- Edit: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/model/mapper/MasterAlumniMapper.java`
- Edit: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/security/SecurityConstants.java`

**Interfaces (contract):**
- `GET /api/alumni` → `List<AlumniProfileResponse>` (used by `generateStaticParams`)
- `GET /api/alumni/{slug}` → `AlumniProfileResponse`; missing → `AlumniNotFoundException` (already → 404 via `GlobalExceptionHandler.handleAlumniNotFound`)
- `AlumniProfileResponse` fields must match client `AlumniProfileSchema` (`client/src/types/domain/profile.ts`): `id` (String, branded), `slug`, `name`, `batch`, `department`, plus nullable `bio`, `avatar`, `location`, `jobTitle`, `company`
- Map from `MasterAlumni`: `slug = registerNumber`, `name`, `batch`, `department`, `bio = feedback`, `location = address`, `jobTitle = designation`, `company`, `id = String.valueOf(id)`

- [ ] **Step 1: Write the failing backend tests**

Create `server/alumniweb/src/test/java/com/alumniweb/alumniweb/controller/AlumniControllerTest.java` as a `@WebMvcTest(AlumniController.class)` with `@MockBean AlumniSearchService` and `@MockBean` for the security dependencies used by the security filter chain (or use `@AutoConfigureMockMvc(addFilters = false)` if wiring the full security chain is heavy). Assert:
- `GET /api/alumni/{slug}` returns 200 and JSON contains `slug`, `name`, `batch`, `department`, `bio`, `location`, `jobTitle`, `company`, `id` (String)
- `GET /api/alumni/{slug}` returns 404 when the mock service throws `AlumniNotFoundException`
- `GET /api/alumni` returns 200 with a JSON array

Run `.\mvnw.cmd test` — expect compile failure (controller/DTO do not exist). This is the TDD red.

- [ ] **Step 2: Create `AlumniProfileResponse` DTO**

Java `record` with fields matching the contract above (`String id, slug, name, batch, department, bio, avatar, location, jobTitle, company` — nullable ones `String` with no `@NotNull`).

- [ ] **Step 3: Extend `AlumniSearchService` + impl**

Add to interface:
```java
AlumniProfileResponse getAlumniProfile(String registerNumber);
List<AlumniProfileResponse> getAllAlumniProfiles();
```
In `AlumniSearchServiceImpl`: `getAlumniProfile` → `masterAlumniRepository.findByRegisterNumber(registerNumber).map(mapper::toProfileResponse).orElseThrow(() -> new AlumniNotFoundException("Alumni not found with register number: " + registerNumber))`; `getAllAlumniProfiles` → `masterAlumniRepository.findAll().stream().map(mapper::toProfileResponse).toList()`. Inject `MasterAlumniMapper` (check the impl's existing constructor/field list; it already uses `masterAlumniRepository`).

- [ ] **Step 4: Extend `MasterAlumniMapper`**

`unmappedTargetPolicy = ReportingPolicy.ERROR` means every target field must be mapped or explicitly ignored. Add:
```java
@Mapping(target = "id", expression = "java(String.valueOf(alumni.getId()))")
@Mapping(target = "slug", source = "registerNumber")
@Mapping(target = "bio", source = "feedback")
@Mapping(target = "location", source = "address")
@Mapping(target = "jobTitle", source = "designation")
@Mapping(target = "avatar", ignore = true)
AlumniProfileResponse toProfileResponse(MasterAlumni alumni);

List<AlumniProfileResponse> toProfileResponseList(List<MasterAlumni> alumni);
```
Import the DTO. `avatar` is ignored (no source column) and stays null.

- [ ] **Step 5: Create `AlumniController`**

`@RestController @RequestMapping("/api/alumni")` with `GET ""` → `getAllAlumniProfiles()` and `GET "/{slug}"` → `getAlumniProfile(slug)`.

- [ ] **Step 6: Make `/api/alumni/**` public**

In `SecurityConstants.PUBLIC_URLS`, add `"/api/alumni/**"`.

- [ ] **Step 7: Verify server**

Run `.\mvnw.cmd test` — all tests pass (new controller tests + existing `AlumniwebApplicationTests`). Server changes are NOT under git — do not attempt `git commit`.

- [ ] **Step 8: Re-enable client directory detail**

`client/src/app/(public)/directory/[slug]/page.tsx` already contains the full implementation (`revalidate = 3600`, `generateStaticParams` via `getAlumniDirectory`, `generateMetadata` via `getAlumniProfile`, `DirectoryProfile` render). No client path changes needed in `lib/data/alumni.ts` — axios baseURL already includes `/api`. If this page was disabled, restore it to the current committed form. Verify with `npm run build` (or `npm run typecheck` + `npm run lint`) that nothing else regressed.

- [ ] **Step 9: Optional — trim leftover admin CRUD modals from public list page**

`client/src/app/(public)/directory/page.tsx` (client component) contains leftover admin request modals (`showUpdateModal`, `showAddModal`, `selectedAlumni`, `updateFields`, `addFields`). If desired, remove that modal state/handlers from the public page. Only do this if it does not break the page's public search/pagination behavior.

- [ ] **Step 10: Commit client changes (client only)**

`git add` exactly the client files touched (directory page if edited, else none beyond T1). Message: `feat: expose public alumni profile endpoints`.

---

### Task 3: Align server dashboard response to client `DashboardData` shape

**Covers:** Server `DashboardResponse` returns `views/viewsTrend/connections/.../eventsList`; client `DashboardData` expects `totalAlumni`, `upcomingEvents`, `activeConnections`, `unreadMessages`, `recentEvents[{id,title,date,location}]`, `recentActivities[{id,description,timestamp}]`.

**Files (server — NO git):**
- `server/alumniweb/src/main/java/com/alumniweb/alumniweb/dto/dashboard/DashboardResponse.java`
- `server/alumniweb/src/main/java/com/alumniweb/alumniweb/service/impl/DashboardServiceImpl.java`

**Interfaces (contract):** response JSON keys must equal client `DashboardData` in `client/src/features/dashboard/_services/dashboard-api.ts`. Values may remain hardcoded.

- [ ] **Step 1: Write the failing backend test**

Extend/create a `@WebMvcTest(DashboardController.class)` (or `@AutoConfigureMockMvc(addFilters = false)`) test that hits `GET /api/dashboard` and asserts the JSON contains the client keys (`totalAlumni`, `upcomingEvents`, `activeConnections`, `unreadMessages`, `recentEvents[].id`, `recentActivities[].description`). Run `.\mvnw.cmd test` — expect red (old field names).

- [ ] **Step 2: Rewrite `DashboardResponse`**

Replace the record fields with the client shape: `int totalAlumni`, `int upcomingEvents`, `int activeConnections`, `int unreadMessages`, `List<RecentEvent> recentEvents`, `List<RecentActivity> recentActivities`, with `RecentEvent(String id, String title, String date, String location)` and `RecentActivity(String id, String description, String timestamp)` (as nested records in the same file or top-level records in the DTO package). Remove the old `views/viewsTrend/.../eventsList` fields.

- [ ] **Step 3: Rewrite `DashboardServiceImpl.getDashboard`**

Return the new shape with hardcoded demo values (mirror the current hardcoded values where sensible, e.g. totalAlumni 128, activeConnections 48, unreadMessages 12, upcomingEvents 3). Keep `getDashboard(Long userId)` signature (client calls `/dashboard` unauthenticated? verify — if the controller requires auth, keep it; the client `dashboard-api.ts` path `/dashboard` is already correct).

- [ ] **Step 4: Verify server**

`.\mvnw.cmd test` green; `.\mvnw.cmd compile` clean. No client code changes required.

---

### Task 4: Descope events — render gracefully without build-time fetch

**Covers:** `(public)/events` pages fail because they fetch `/events` and `/events/{slug}`, which have no backend. Remove build-time fetch hooks so the pages render static empty states.

**Files (client):**
- `client/src/app/(public)/events/page.tsx`
- `client/src/app/(public)/events/[slug]/page.tsx`
- (optional, read-only context) `client/src/features/events/feature.tsx`, `_sections/events-list-section.tsx`, `_sections/event-info-section.tsx`

**Interfaces:**
- `EventsList` feature stub currently renders an empty state — keep it as the public list body
- `EventsListSection` props: `events: EventSummary[]`, `emptyMessage?` — use with `events={[]}`
- `EventInfoSection` props: `event: EventDetailData`, `headingTag`, `className`, `children`

- [ ] **Step 1: Write a component test for the empty state**

In `client/src/features/events/_sections/events-list-section.test.tsx` (or `tests/`), render `EventsListSection` with `events={[]}` and assert the `emptyMessage` (or its default empty state) is shown. Run `npm test` — confirm it passes against the existing component (documented as the descope anchor).

- [ ] **Step 2: Make the list page fully static-safe**

In `(public)/events/page.tsx`, remove `export const dynamic = "force-static";` so the page is a normal static render (no fetch anywhere). Keep `metadata` and the `<EventsList />` body. Remove any fetch/`getEvents` import if present (currently there is none).

- [ ] **Step 3: Make the detail page render without fetching**

In `(public)/events/[slug]/page.tsx`, remove `export const revalidate`, `generateStaticParams` (its `getEvents` call), and `generateMetadata` (its `getEvent` call). Replace the body's `<EventDetail slug={validated} />` (which fetches `/events/{slug}` → 404) with a graceful static fallback — e.g. render `EventsListSection` with `events={[]}` and an `emptyMessage` such as "Event details coming soon", or a simple section component. Keep `validateSlug`/`notFound()` for malformed slugs.

- [ ] **Step 4: Verify**

`npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` all pass (build must not attempt any `/events` fetch).

- [ ] **Step 5: Commit (client only)**

`git add` exactly the two pages (+ test file). Message: `fix: descope public events pages from backend fetch`.

---

### Task 5: Remove dead auth `login()`/`register()` + update barrel

**Covers:** `client/src/lib/data/auth.ts` `login()`/`register()` hit `/auth/login` and `/auth/register`, which don't exist on the server and are never called (feature auth uses `features/auth/_services/auth-api.ts` → POST `baseUrl/login`). Also fix the a11y issue on the login-form error icon.

**Files (client):**
- `client/src/lib/data/auth.ts`
- `client/src/lib/data/index.ts` (line 2 barrel re-exports `login, register, logout, refreshToken`)
- optional: `client/src/features/auth/_components/login-form.tsx` (svg line 79)

**Interfaces:** Keep live exports: `getCurrentUser`, `getServerUser`, `requireAuth`, `requireRole`, `logout`, `refreshToken`, and the re-exported `setTokenProvider`, `setAuthFailureHandler`, `setTokenRefreshHandler`. Remove only `login` and `register`.

- [ ] **Step 1: Write the failing barrel test**

In `client/tests/auth-barrel.test.ts`, `import * as auth from "@/lib/data"` and assert `auth.login === undefined && auth.register === undefined`, while `getServerUser`, `getCurrentUser`, `requireAuth` are functions. Run `npm test` — expect red (they currently exist).

- [ ] **Step 2: Remove the two dead functions**

Delete `login()` and `register()` from `lib/data/auth.ts`. Remove the now-unused imports (`LoginRequest`, `RegisterRequest`, `AuthResponse`) and any other references only those functions used.

- [ ] **Step 3: Update the barrel**

In `lib/data/index.ts` line 2, remove `login, register` from the `./auth` re-export, keeping `logout, refreshToken` (and the others re-exported there). Verify no other file imports `login`/`register` from `@/lib/data`.

- [ ] **Step 4: Optional a11y fix**

In `login-form.tsx` line 79, add `aria-hidden="true"` (decorative error icon, with adjacent text). Keep `role="img"` off unless the icon is the only content.

- [ ] **Step 5: Verify**

`npm test`, `npm run typecheck`, `npm run lint`.

- [ ] **Step 6: Commit (client only)**

`git add` exactly `lib/data/auth.ts`, `lib/data/index.ts`, the test, and (if done) `login-form.tsx`. Message: `refactor: remove dead auth login/register helpers`.

---

### Task 6 (optional): Extend `DataSeeder` for community/donation/message demo data

**Covers (optional, skippable):** `DataSeeder` currently seeds developer user, permissions, roles, platform configs, and feature flags — no communities, donations, or messages. Only relevant if you want manual demo data for the public pages.

- [ ] **Step 1:** In `server/alumniweb/src/main/java/com/alumniweb/alumniweb/config/DataSeeder.java`, add a guarded `seedDemoData()` (guard on `communityRepository.count() == 0` and `donationRepository.count() == 0`) inserting one or two sample communities (tied to an existing `masterAlumni` row if present), sample donations, and a sample message. Respect the existing "skip if present" pattern used by every other `seed*` method.
- [ ] **Step 2:** Wire `seedDemoData()` into `run(...)` and verify `.\mvnw.cmd test` + a boot smoke check. Server is not under git — no commit.
