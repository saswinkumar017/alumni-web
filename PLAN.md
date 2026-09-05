# Alumni Networking & Community â€” Implementation Plan

**Objective:** Deliver dynamic (non-static) alumni networking/community features with realtime data: connect with same-batch alumni, join/create communities, richer profiles, UI upgrade toward `alumni.jjcet.ac.in` quality.

**Repos:** Backend `server/alumniweb` (Spring Boot 3 + MySQL + Flyway, `.\mvnw.cmd compile`), Client `client` (Next.js 16 App Router + TS + Tailwind, `npx eslint .` / `npm run typecheck`).

**Blast radius (gitnexus):** `getConnections`, `listCommunities`, `getCommunity` â€” all LOW (serviceâ†”controller only). No HIGH/CRITICAL risk.

---

## Known Bugs / Contract Mismatches (must fix first)

1. **`ConnectionService.getConnections()` returns ALL statuses** including PENDING (server `.../service/ConnectionService.java:21`). Should return ACCEPTED only.
2. **Leave-community verb mismatch:** backend exposes `POST /api/communities/{id}/leave` (`CommunityController.java`), client calls `apiClient.delete` (`community-service.ts:leaveCommunity`). Align to `POST` on the client.
3. **`getCommunity({id})` never populates `isMember`** (`CommunityService.getCommunity`), so the community detail Join/Leave button is wrong. Populate it (needs current userId threaded through).
4. **Community messages return raw `AlumniMessage`** (senderId only) â€” client sets `displayName:""`. Need sender name/avatar resolved for the richer UI.

---

## Phase 1 â€” Backend (server/alumniweb)

### 1.1 Connection fixes + suggestions (`ConnectionService` / `ConnectionController` / repo) âœ…
- `ConnectionService.getConnections`: filter to `status == "ACCEPTED"` in-memory. âœ…
- Add `getSentRequests(userId)`: PENDING where `requesterId == userId`. âœ…
- Add **suggestions** endpoint `GET /api/connections/suggestions?batch=` returning same-batch alumni NOT already connected and NOT self:
  - `ConnectionSuggestionResponse` record (id, registerNumber, name, department, batch, yearOfPassing, company, designation, connectionStatus: NONE|PENDING_SENT|PENDING_RECEIVED|CONNECTED). âœ…
  - connectionStatus via `computeConnectionStatus` (checks both directions). âœ…
  - When `batch` omitted, fall back to current user's own batch (from `masterAlumni`). âœ…
- `sendConnectionRequest`: not yet rejected on reverse request â€” TODO in client E2E pass if needed.

### 1.2 Community create + isMember + message names (`CommunityService` / `CommunityController` / repo) âœ…
- `getCommunity(id)` â†’ `getCommunity(id, userId)` overload sets `isMember`; internal callers keep `getCommunity(id)`. âœ…
- Add `createCommunity(CreateCommunityRequest, userId)`: name (required), description, batch, department, isPublic; `createdBy=userId`; creator auto-joined as member (role ADMIN) + memberCount=1. âœ…
- Add `CommunityMessageResponse` DTO (id, communityId, senderId, senderName, senderAvatar, body, createdAt) resolved via Userâ†’MasterAlumni name. `getCommunityMessages` + `postCommunityMessage` return it. âœ…
- Controller: `POST /api/communities` (create) added; `POST /{id}/leave` stays; `GET /api/communities/{id}/members` not yet added (nice-to-have).

### 1.3 Data seeding (Java `NetworkDataSeeder` instead of V5 SQL) âœ…
- Seeded 8 `master_alumni` (regs 20CS001/20CS002/20IT001/20EC001/21CS001/21CS002/21IT001/21EC001, batches 2020/2021), 3 demo users (alumni/`Alumni@123`, kavitha/`Kavitha@123`, ravi2021/`Ravi@123`), ACCEPTED + PENDING connections, 3 communities (CSE Batch 2020, Batch 2021 Network, JJCET Alumni Association) with members, 3 community messages. Idempotent; empty guard skips all if demo users exist.
- Chose Java seeder over V5 SQL because Flyway V2 creates `user_account` and Hibernate `ddl-auto=update` ordering makes V5 seed SQL fragile. âœ…

### 1.4 Verify
- `.\mvnw.cmd compile` clean âœ… (note: may need `MAVEN_OPTS=-Xms256m -Xmx768m` to avoid native OOM when dev server is running).
- Backend smoke-test with curl: GET `/api/connections`, `/api/connections/pending`, `/api/connections/sent`, `/api/connections/suggestions`, GET/POST `/api/communities`, GET `/api/communities/{id}` (isMember), GET/POST `/api/communities/{id}/messages` â€” done (verified on 8081; fixed infinite JSON recursion in `Community.members` via `@JsonIgnoreProperties({"community"})` on `CommunityMember`).

---

## Phase 2 â€” Client (client/)

### 2.1 Networking â€” directory + suggestions + send request
- `_services/connection-service.ts`: add `getSuggestions(batch?)`, `getSentRequests()`, fix `sendConnectionRequest` return type to match backend `ApiResponse<Connection>` (currently typed `Connection`).
- `networking-list-client.tsx`: add tabs **Connections | Pending | Suggestions | Directory**:
  - Suggestions: server-backed suggestions grid with avatar initials, name, batch, company/designation, `Connect` button (`sendConnectionRequest`) that immediately updates local state + moves card to Sent.
  - Directory: reuse `getAlumniDirectory` from `@/lib/data/alumni` (or `/api/search`) with batch filter + client search.
  - Pending: show requester info + Accept/Reject (existing).
- Profile page (`[id]`): ensure `ConnectButton` wires to `sendConnectionRequest` and reflects state; show batch/department/company chips.

### 2.2 Community â€” create + realtime messages + sender names
- `community-service.ts`: fix `leaveCommunity` â†’ `POST`; `getCommunityMessages`/`postCommunityMessage` map new `CommunityMessageResponse` (senderName, senderAvatar); add `getCommunityMembers`.
- `CommunityList`: add **Create community** button + modal form (name, description, batch, department) â†’ `createCommunity` â†’ refresh.
- `CommunityDetail`: show sender names/avatars on messages; polling refresh (e.g. every 15s) while tab visible for "realtime" feel; post appends optimistically.

### 2.3 UI upgrade (toward `alumni.jjcet.ac.in` quality)
- Shared card components: gradient header band, avatar-with-initials, batch/department badges, hover lift, consistent rounded-2xl + shadow. âœ… (`AlumniCard` in `components/ui/alumni-card.tsx`)
- Networking + community pages restyle to match existing design tokens (zinc + blue-600 accent already in use). âœ… (networking tabs + community list/detail)
- Keep every interactive button `type="button"`; keep initial-fetch `setState` in `useEffect` pattern (pre-existing repo-wide, no per-file eslint exceptions). âœ…

### 2.4 Verify
- `npm run typecheck` clean. âœ…
- `npx eslint .` on changed dirs (`src/features/networking`, `src/features/community`) â€” fix new issues only. âœ… (no new issues; only pre-existing `set-state-in-effect` baseline)
- Manual: login â†’ Networking (suggestions connect, tabs), Community (create, join, message send with names) with backend running.

---

## Phase 3 â€” End-to-end pass
- Backend dev server up; client `npm run dev`.
- Walk the alumni flow: directory â†’ profile â†’ connect â†’ accept â†’ community â†’ create â†’ post message.
- Confirm `detect_changes`/typecheck/lint clean; update this plan's status.

## Out of scope (this pass)
- WebSocket/SSE push (polling used instead), DM conversations UI, admin community moderation, photo upload.
