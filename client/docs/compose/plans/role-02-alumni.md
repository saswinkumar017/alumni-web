# Alumni Role — Implementation Plan

**Status:** Draft
**Created:** 2026-07-12
**Depends on:** Stage 1 (Environment Layer) — frozen

---

## 1. Role Definition

### 1.1 Mapping

| Layer | Value | Notes |
|-------|-------|-------|
| Server `UserRole` | `USER` | Existing enum; Alumni = USER |
| Client `SessionUser.role` | `"alumni"` | Already defined in `src/types/domain/session.ts` |
| Client `User.role` | `"alumni"` | Already defined in `src/types/domain/user.ts` |
| Permission scope | `own` | Alumni can only access their own data (except public directory) |

### 1.2 Capabilities

| Domain | Capability | Read | Write | Scope |
|--------|-----------|------|-------|-------|
| Dashboard | Personal stats, notifications, announcements | Yes | No | own |
| Profile | View/edit profile, change password, upload picture | Yes | Yes | own |
| Alumni Network | Search directory, view public profiles, send connection requests | Yes | Yes | own requests |
| Communication | Read/send messages, receive broadcasts/notifications | Yes | Yes | own |
| Community | Batch community, discussions, private gallery, reunion RSVPs | Yes | Yes | own |
| Contributions | Make donations, view donation history | Yes | Yes | own |

### 1.3 Data Isolation Rules

- Alumni can only read/write their own profile, messages, donations, connections.
- Alumni can read the alumni directory (public profiles only).
- Alumni can read published announcements.
- Alumni cannot access admin endpoints, user management, or other alumni's private data.
- Connection requests: sender sees own sent requests; recipient sees own received requests.

---

## 2. Backend Changes

### 2.1 New Entities

#### Community

```
Table: community
├── id              UUID (PK)
├── name            VARCHAR(200)
├── description     TEXT
├── batch           VARCHAR(20)       -- batch year, e.g. "2015"
├── department      VARCHAR(100)
├── created_by      UUID (FK → user_account)
├── is_public       BOOLEAN DEFAULT true
├── member_count    INTEGER DEFAULT 0
├── deleted         BOOLEAN DEFAULT false
├── deleted_at      TIMESTAMP
├── created_at      TIMESTAMP
└── updated_at      TIMESTAMP
```

```
Table: community_member
├── id              UUID (PK)
├── community_id    UUID (FK → community)
├── user_id         UUID (FK → user_account)
├── role            ENUM('MEMBER', 'MODERATOR', 'ADMIN')
├── joined_at       TIMESTAMP
└── UNIQUE(community_id, user_id)
```

#### Message

```
Table: message
├── id              UUID (PK)
├── sender_id       UUID (FK → user_account)
├── receiver_id     UUID (FK → user_account, nullable)
├── community_id    UUID (FK → community, nullable)
├── subject         VARCHAR(200)
├── body            TEXT
├── message_type    ENUM('DIRECT', 'BROADCAST', 'COMMUNITY')
├── is_read         BOOLEAN DEFAULT false
├── parent_id       UUID (FK → message, nullable)  -- for threads
├── deleted         BOOLEAN DEFAULT false
├── deleted_at      TIMESTAMP
├── created_at      TIMESTAMP
└── updated_at      TIMESTAMP
```

#### Connection

```
Table: connection
├── id              UUID (PK)
├── requester_id    UUID (FK → user_account)
├── recipient_id    UUID (FK → user_account)
├── status          ENUM('PENDING', 'ACCEPTED', 'REJECTED')
├── message         TEXT                          -- optional request note
├── responded_at    TIMESTAMP
├── created_at      TIMESTAMP
├── updated_at      TIMESTAMP
└── UNIQUE(requester_id, recipient_id)
```

#### Donation

```
Table: donation
├── id              UUID (PK)
├── user_id         UUID (FK → user_account)
├── amount          DECIMAL(10,2)
├── currency        VARCHAR(3) DEFAULT 'INR'
├── purpose         VARCHAR(200)
├── transaction_id  VARCHAR(100)                 -- payment gateway reference
├── status          ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')
├── receipt_url     VARCHAR(500)
├── notes           TEXT
├── created_at      TIMESTAMP
└── updated_at      TIMESTAMP
```

### 2.2 New Endpoints

#### Community (`/api/community`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/community` | Alumni | List communities (filterable by batch/department) |
| `GET` | `/api/community/:id` | Alumni | Get community detail + member list |
| `POST` | `/api/community/:id/join` | Alumni | Join a community |
| `DELETE` | `/api/community/:id/leave` | Alumni | Leave a community |
| `GET` | `/api/community/:id/messages` | Alumni | Get community discussion threads |
| `POST` | `/api/community/:id/messages` | Alumni | Post to community discussion |

#### Messages (`/api/messages`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/messages` | Alumni | List conversations (inbox + sent) |
| `GET` | `/api/messages/:id` | Alumni | Get message thread |
| `POST` | `/api/messages` | Alumni | Send a message |
| `PUT` | `/api/messages/:id/read` | Alumni | Mark message as read |
| `DELETE` | `/api/messages/:id` | Alumni | Soft-delete a message |
| `GET` | `/api/messages/broadcasts` | Alumni | List broadcasts received |
| `GET` | `/api/messages/unread-count` | Alumni | Get unread count |

#### Connections (`/api/connections`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/connections` | Alumni | List own connections (accepted) |
| `GET` | `/api/connections/pending` | Alumni | List pending requests (sent + received) |
| `POST` | `/api/connections` | Alumni | Send connection request |
| `PUT` | `/api/connections/:id/accept` | Alumni | Accept a connection request |
| `PUT` | `/api/connections/:id/reject` | Alumni | Reject a connection request |
| `DELETE` | `/api/connections/:id` | Alumni | Remove a connection |

#### Donations (`/api/donations`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/donations` | Alumni | List own donation history |
| `GET` | `/api/donations/:id` | Alumni | Get donation detail |
| `POST` | `/api/donations` | Alumni | Create a donation record |
| `GET` | `/api/donations/stats` | Alumni | Get own donation summary |

#### Profile (enhance existing)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/profile/avatar` | Alumni | Upload profile picture |
| `POST` | `/api/profile/change-password` | Alumni | Change password |

#### Dashboard (fix existing)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/dashboard` | Alumni | Return real data from DB (fix mock) |
| `GET` | `/api/dashboard/notifications` | Alumni | List notifications |
| `PUT` | `/api/dashboard/notifications/:id/read` | Alumni | Mark notification as read |

### 2.3 Fix DashboardServiceImpl

Current state: `DashboardServiceImpl.getDashboard()` does a repo lookup but returns hardcoded mock data.

Changes:
- Inject `ConnectionRepository`, `MessageRepository`, `EventRepository`, `DonationRepository`
- Compute real counts:
  - `views`: count of profile views (add `profile_view` table or counter on `MasterAlumni`)
  - `connections`: count of `connection` records where `status = ACCEPTED` and user is requester or recipient
  - `messages`: count of unread `message` records where `receiver_id = userId`
  - `events`: count of upcoming events the user has RSVP'd to
- Compute trends by comparing with previous 30-day period
- Fetch real activity feed from `message`, `connection`, `donation` tables ordered by `created_at DESC`
- Fetch real upcoming events from `event` table

### 2.4 Repositories to Create

- `CommunityRepository` extends `JpaRepository<Community, UUID>`
- `CommunityMemberRepository` extends `JpaRepository<CommunityMember, UUID>`
- `MessageRepository` extends `JpaRepository<Message, UUID>`
- `ConnectionRepository` extends `JpaRepository<Connection, UUID>`
- `DonationRepository` extends `JpaRepository<Donation, UUID>`

### 2.5 Services to Create

- `CommunityService` / `CommunityServiceImpl`
- `MessageService` / `MessageServiceImpl`
- `ConnectionService` / `ConnectionServiceImpl`
- `DonationService` / `DonationServiceImpl`

### 2.6 Controllers to Create

- `CommunityController` (`@RequestMapping("/api/community")`)
- `MessageController` (`@RequestMapping("/api/messages")`)
- `ConnectionController` (`@RequestMapping("/api/connections")`)
- `DonationController` (`@RequestMapping("/api/donations")`)

---

## 3. Frontend Changes

### 3.1 Pages (existing routes to implement)

| Route | Page File | Component | Status |
|-------|-----------|-----------|--------|
| `/alumni/dashboard` | `src/app/(alumni)/alumni/dashboard/page.tsx` | `<AlumniDashboard>` | Exists, needs real data wiring |
| `/alumni/profile` | `src/app/(alumni)/alumni/profile/page.tsx` | `<ProfileManager>` | Exists, needs sections |
| `/alumni/networking` | `src/app/(alumni)/alumni/networking/page.tsx` | `<NetworkingPage>` | Exists, needs search + connect |
| `/alumni/networking/[id]` | `src/app/(alumni)/alumni/networking/[id]/page.tsx` | `<ProfileDetailPage>` | Exists, needs detail view |
| `/alumni/events` | `src/app/(alumni)/alumni/events/page.tsx` | `<EventsPage>` | Exists, needs list + RSVP |
| `/alumni/events/[id]` | `src/app/(alumni)/alumni/events/[id]/page.tsx` | `<EventDetailPage>` | Exists, needs detail view |
| `/alumni/messages` | `src/app/(alumni)/alumni/messages/page.tsx` | `<MessagesPage>` | Exists, needs inbox/compose |
| `/alumni/settings` | `src/app/(alumni)/alumni/settings/page.tsx` | `<SettingsPage>` | Exists, needs account/security |

### 3.2 New Pages

| Route | Purpose |
|-------|---------|
| `/alumni/community` | List communities (batch, department) |
| `/alumni/community/[id]` | Community detail, members, discussions |
| `/alumni/donations` | Donation history + make donation |
| `/alumni/notifications` | Full notification inbox |

### 3.3 Feature Services (client-side)

#### `src/features/dashboard/_services/dashboard-service.ts`
- Update `DashboardServiceContext` to call real API endpoints
- Wire up `getDashboardData()` to `GET /api/dashboard`
- Add `getNotifications()` → `GET /api/dashboard/notifications`
- Add `markNotificationRead()` → `PUT /api/dashboard/notifications/:id/read`

#### `src/features/profile/_services/profile-service.ts`
- Add `uploadAvatar()` → `POST /api/profile/avatar` (multipart)
- Add `changePassword()` → `POST /api/profile/change-password`

#### `src/features/networking/_services/networking-service.ts`
- Add `getConnections()` → `GET /api/connections`
- Add `getPendingRequests()` → `GET /api/connections/pending`
- Add `sendConnectionRequest()` → `POST /api/connections`
- Add `acceptConnection()` → `PUT /api/connections/:id/accept`
- Add `rejectConnection()` → `PUT /api/connections/:id/reject`
- Add `removeConnection()` → `DELETE /api/connections/:id`

#### `src/features/messages/_services/message-service.ts`
- Add `getConversations()` → `GET /api/messages`
- Add `getThread(id)` → `GET /api/messages/:id`
- Add `sendMessage()` → `POST /api/messages`
- Add `markAsRead(id)` → `PUT /api/messages/:id/read`
- Add `getBroadcasts()` → `GET /api/messages/broadcasts`
- Add `getUnreadCount()` → `GET /api/messages/unread-count`

#### New: `src/features/community/_services/community-service.ts`
- `getCommunities(filters)` → `GET /api/community`
- `getCommunity(id)` → `GET /api/community/:id`
- `joinCommunity(id)` → `POST /api/community/:id/join`
- `leaveCommunity(id)` → `DELETE /api/community/:id/leave`
- `getCommunityMessages(id)` → `GET /api/community/:id/messages`
- `postCommunityMessage(id, body)` → `POST /api/community/:id/messages`

#### New: `src/features/donations/_services/donation-service.ts`
- `getDonations()` → `GET /api/donations`
- `getDonation(id)` → `GET /api/donations/:id`
- `createDonation(data)` → `POST /api/donations`
- `getDonationStats()` → `GET /api/donations/stats`

### 3.4 New Types

#### `src/types/domain/community.ts`
```ts
export interface Community {
  id: string;
  name: string;
  description: string;
  batch: string;
  department: string;
  createdBy: string;
  isPublic: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: "MEMBER" | "MODERATOR" | "ADMIN";
  joinedAt: string;
}
```

#### `src/types/domain/connection.ts`
```ts
export interface Connection {
  id: string;
  requesterId: string;
  recipientId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  message?: string;
  respondedAt?: string;
  createdAt: string;
}
```

#### `src/types/domain/donation.ts`
```ts
export interface Donation {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  purpose: string;
  transactionId?: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
}
```

#### `src/types/domain/notification.ts`
```ts
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "CONNECTION" | "MESSAGE" | "EVENT" | "COMMUNITY" | "SYSTEM";
  isRead: boolean;
  link?: string;
  createdAt: string;
}
```

### 3.5 New Components

#### Community
- `community-card.tsx` — Card showing community name, batch, member count, join button
- `community-header.tsx` — Community title, description, member count badge
- `community-member-list.tsx` — List of members with roles
- `community-discussion.tsx` — Thread list for community messages

#### Messages
- `compose-form.tsx` — Already exists, wire to real API
- `conversation-item.tsx` — Already exists, wire to real API
- `message-bubble.tsx` — Already exists, wire to real API
- `unread-badge.tsx` — Badge showing unread count

#### Connections
- `connection-card.tsx` — Card showing alumni info + accept/reject buttons
- `connection-status-badge.tsx` — PENDING/ACCEPTED/REJECTED indicator
- `connection-request-form.tsx` — Optional message when sending request

#### Donations
- `donation-form.tsx` — Amount, purpose, notes
- `donation-card.tsx` — Single donation record display
- `donation-history-list.tsx` — Paginated list of past donations
- `donation-stats.tsx` — Summary: total donated, number of donations

#### Dashboard
- `notification-item.tsx` — Single notification with read/unread state
- `notification-list.tsx` — List of notifications
- `announcement-card.tsx` — Announcement display card

### 3.6 New Sections

- `src/features/community/_sections/community-list-section.tsx`
- `src/features/community/_sections/community-detail-section.tsx`
- `src/features/donations/_sections/donation-history-section.tsx`
- `src/features/donations/_sections/donation-form-section.tsx`
- `src/features/messages/_sections/broadcasts-section.tsx`
- `src/features/dashboard/_sections/notifications-section.tsx`

### 3.7 Hooks to Create

- `src/features/dashboard/_hooks/use-notifications.ts` — Fetch + cache notifications
- `src/features/messages/_hooks/use-unread-count.ts` — Poll or subscribe to unread count
- `src/features/networking/_hooks/use-connections.ts` — Fetch connections + pending
- `src/features/community/_hooks/use-community.ts` — Fetch community detail
- `src/features/donations/_hooks/use-donations.ts` — Fetch donation history

---

## 4. Security

### 4.1 Authorization Checks

| Resource | Check |
|----------|-------|
| Profile (own) | `userId == session.userId` |
| Profile (other) | Only public fields visible via directory |
| Messages (inbox) | `receiverId == session.userId OR senderId == session.userId` |
| Messages (send) | `senderId == session.userId` |
| Connections (own) | `requesterId == session.userId OR recipientId == session.userId` |
| Community (join/leave) | Any authenticated alumni can join public communities |
| Community (messages) | Only members can post/read |
| Donations (own) | `userId == session.userId` |
| Dashboard | Returns only current user's aggregated data |
| Announcements | Any authenticated user can read published ones |

### 4.2 Implementation Pattern

- Server: Spring Security `@PreAuthorize` annotations on controller methods
- Use a shared `SecurityUtils.getCurrentUserId()` utility that reads from JWT
- Create `@PreAuthorize("hasRole('USER')")` at class level for alumni controllers
- Add method-level checks: `@PreAuthorize("#userId == authentication.principal.userId")`

### 4.3 Data Isolation

- All queries must filter by `userId` for own-data endpoints
- Directory search returns only `approved` users with `accountStatus = ACTIVE`
- Soft-deleted records excluded via `@Where(clause = "deleted = false")` or query filters
- Connection requests: prevent duplicate requests, prevent self-connections

### 4.4 Input Validation

- Donation amounts: min 1.00, max 100000.00, positive decimal
- Message body: max 5000 chars
- Community name: max 200 chars
- Profile fields: existing validation rules apply

---

## 5. Implementation Tasks

### Phase 1: Backend Foundation (Server)

| # | Task | Depends | Estimated |
|---|------|---------|-----------|
| 1.1 | Create `Community`, `CommunityMember` entities + repository | — | 1h |
| 1.2 | Create `Message` entity + repository | — | 1h |
| 1.3 | Create `Connection` entity + repository | — | 1h |
| 1.4 | Create `Donation` entity + repository | — | 1h |
| 1.5 | Create `Notification` entity + repository | — | 1h |
| 1.6 | Create DB migrations (Flyway/Liquibase) for all new tables | 1.1–1.5 | 1h |

### Phase 2: Backend Services & Controllers

| # | Task | Depends | Estimated |
|---|------|---------|-----------|
| 2.1 | Fix `DashboardServiceImpl` — replace mock data with real queries | 1.2–1.3 | 2h |
| 2.2 | Create `CommunityService` + `CommunityController` | 1.1 | 2h |
| 2.3 | Create `MessageService` + `MessageController` | 1.2 | 2h |
| 2.4 | Create `ConnectionService` + `ConnectionController` | 1.3 | 2h |
| 2.5 | Create `DonationService` + `DonationController` | 1.4 | 2h |
| 2.6 | Create `NotificationService` + notification endpoints in `DashboardController` | 1.5 | 1.5h |
| 2.7 | Enhance `ProfileController` — avatar upload, change password | — | 1.5h |
| 2.8 | Add `@PreAuthorize` checks to all new controllers | 2.2–2.7 | 1h |

### Phase 3: Frontend Types & Services

| # | Task | Depends | Estimated |
|---|------|---------|-----------|
| 3.1 | Create domain types: `community.ts`, `connection.ts`, `donation.ts`, `notification.ts` | — | 0.5h |
| 3.2 | Create API types: `community.ts`, `connection.ts`, `donation.ts` | 3.1 | 0.5h |
| 3.3 | Update `dashboard-service.ts` to call real API | — | 1h |
| 3.4 | Update `profile-service.ts` — add avatar upload, change password | — | 1h |
| 3.5 | Update `networking-service.ts` — add connection operations | 3.1 | 1h |
| 3.6 | Update `message-service.ts` — add all message operations | 3.1 | 1h |
| 3.7 | Create `community-service.ts` | 3.1 | 1h |
| 3.8 | Create `donation-service.ts` | 3.1 | 1h |

### Phase 4: Frontend Components & Pages

| # | Task | Depends | Estimated |
|---|------|---------|-----------|
| 4.1 | Dashboard: wire `AlumniDashboard` to real data, add notifications section | 3.3 | 2h |
| 4.2 | Profile: wire avatar upload + change password sections | 3.4 | 1.5h |
| 4.3 | Networking: wire search, connect, accept/reject flows | 3.5 | 2h |
| 4.4 | Messages: wire inbox, compose, thread, broadcasts | 3.6 | 2h |
| 4.5 | Community: create page + list/detail sections | 3.7 | 2h |
| 4.6 | Donations: create page + history/form sections | 3.8 | 2h |
| 4.7 | Notifications: create full notification inbox page | 3.3 | 1h |
| 4.8 | Settings: wire account + security sections | — | 1h |

### Phase 5: Integration & Polish

| # | Task | Depends | Estimated |
|---|------|---------|-----------|
| 5.1 | Add notification badge to navbar/navigation | 4.1 | 0.5h |
| 5.2 | Add unread message count polling | 4.4 | 0.5h |
| 5.3 | Error handling + loading states for all new pages | 4.1–4.8 | 2h |
| 5.4 | Empty state components for each section | 4.1–4.8 | 1h |

**Total estimated:** ~40h

---

## 6. Testing Strategy

### 6.1 Backend Unit Tests

| Area | Tests |
|------|-------|
| Services | Test each service method with mocked repositories |
| Controllers | Test endpoints with `@WebMvcTest`, mocked security context |
| Authorization | Test that `@PreAuthorize` blocks cross-user access |
| Validation | Test input validation for donation amounts, message length, etc. |

### 6.2 Backend Integration Tests

| Area | Tests |
|------|-------|
| Dashboard | Verify real data aggregation, trend calculation |
| Community | Full flow: create → join → post → leave |
| Messages | Full flow: send → receive → mark read |
| Connections | Full flow: request → accept → list |
| Donations | Full flow: create → list → stats |

### 6.3 Frontend Unit Tests (Vitest)

| Area | Tests |
|------|-------|
| Services | Mock API calls, test service return types |
| Hooks | Test `useNotifications`, `useUnreadCount` with mocked fetch |
| Components | Render tests for cards, badges, forms |

### 6.4 Frontend E2E Tests (Playwright)

| Scenario | Steps |
|----------|-------|
| Dashboard loads with real data | Login → navigate → verify stats are non-zero |
| Send message | Login → messages → compose → send → verify in sent |
| Connect with alumni | Login → networking → search → send request → verify pending |
| Join community | Login → community → browse → join → verify member status |
| Make donation | Login → donations → fill form → submit → verify in history |
| Read notification | Login → notifications → click → verify marked as read |

### 6.5 Security Tests

| Test | Method |
|------|--------|
| Alumni cannot access admin endpoints | HTTP 403 on `/api/admin/*` |
| Alumni cannot read other's messages | HTTP 403 on `/api/messages/:otherId` |
| Alumni cannot modify other's profile | HTTP 403 on `PUT /api/profile` with other userId |
| Alumni cannot delete users | HTTP 403 on `/api/admin/alumni/:id` |
| Connection self-request blocked | HTTP 400 on self-connection |
| Donation amount validation | HTTP 400 on negative/zero amounts |

---

## Appendix: Migration Script Outline

```sql
-- Community tables
CREATE TABLE community (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    batch VARCHAR(20),
    department VARCHAR(100),
    created_by UUID NOT NULL REFERENCES user_account(id),
    is_public BOOLEAN DEFAULT true,
    member_count INTEGER DEFAULT 0,
    deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE community_member (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES community(id),
    user_id UUID NOT NULL REFERENCES user_account(id),
    role VARCHAR(20) DEFAULT 'MEMBER',
    joined_at TIMESTAMP DEFAULT now(),
    UNIQUE(community_id, user_id)
);

-- Message table
CREATE TABLE message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES user_account(id),
    receiver_id UUID REFERENCES user_account(id),
    community_id UUID REFERENCES community(id),
    subject VARCHAR(200),
    body TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'DIRECT',
    is_read BOOLEAN DEFAULT false,
    parent_id UUID REFERENCES message(id),
    deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Connection table
CREATE TABLE connection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES user_account(id),
    recipient_id UUID NOT NULL REFERENCES user_account(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    message TEXT,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(requester_id, recipient_id)
);

-- Donation table
CREATE TABLE donation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_account(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    purpose VARCHAR(200),
    transaction_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    receipt_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Notification table
CREATE TABLE notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_account(id),
    title VARCHAR(200) NOT NULL,
    message TEXT,
    notification_type VARCHAR(30) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    link VARCHAR(500),
    created_at TIMESTAMP DEFAULT now()
);
```
