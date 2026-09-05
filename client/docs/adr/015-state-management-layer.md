# ADR 015: State Management Layer

**Status:** Implemented ✦ 2026-07-09  
**Date:** 2026-07-09  
**Stage:** 15

---

## Table of Contents

1. [Context](#1-context)
2. [Decision](#2-decision)
3. [Consequences](#3-consequences)
4. [State Classification](#4-state-classification)
5. [Ownership Matrix](#5-ownership-matrix)
6. [Store Architecture](#6-store-architecture)
7. [State Lifecycle](#7-state-lifecycle)
8. [Store Boundaries & Dependency Rules](#8-store-boundaries--dependency-rules)
9. [Synchronization Strategy](#9-synchronization-strategy)
10. [Selector, Subscription & Memoization](#10-selector-subscription--memoization)
11. [Persistence & Hydration](#11-persistence--hydration)
12. [Governance & Best Practices](#12-governance--best-practices)
13. [File Structure Convention](#13-file-structure-convention)
14. [Migration Strategy](#14-migration-strategy)
15. [References](#15-references)

---

## 1. Context

The application spans 15+ features (auth, alumni, events, jobs, directory, networking, gallery, donations, admin dashboard, messaging, notifications, feedback, polls, mentorship, analytics) across 4 route groups (public, auth, dashboard, admin). As feature integration progresses in Stages 5-6, components across sections and features need to share state, respond to mutations, and remain consistent.

Current state management is ad hoc:
- Server components read from the Data/API Layer (Stage 13) directly — no issue.
- Client components that need shared state either prop-drill from page-level providers or use local `useState`.
- Cross-feature updates (e.g., "update profile picture → refresh header avatar") require page-level coordination or hard reloads.
- No hydration strategy exists for server data reaching client stores.
- No offline or optimistic update patterns are established.

A unified state management strategy is needed before Section Layer (Stage 6) and Page Layer (Stage 4) composition begins.

### Key Challenges

1. **Server-as-source-of-truth:** Next.js RSC data flows server → client. Client stores must hydrate from server data, not refetch on mount.
2. **Cross-feature updates:** A mutation in one feature (e.g., events → RSVP) affects another (dashboard → upcoming events count).
3. **Auth state:** Session state must be available globally on the client, with automatic sync on token refresh / expiry.
4. **Form state vs server state:** Form drafts, selections, UI toggles belong to the client; entity data belongs to the server.
5. **Offline resilience:** The app should degrade gracefully when the network is unavailable, showing cached data and queuing mutations.

## 2. Decision

### 2.1 Library Independence

**Decouple the specification from any specific library.** The architecture supports:

- **Zustand** — lightweight, minimal boilerplate, excellent for global stores and cross-tab sync
- **Redux Toolkit** — if the app grows to need middleware-heavy patterns, devtools, or normalized entity caches
- **React Context** — for truly ephemeral, provider-scoped state (themes, toasts, modals)

**Initial recommendation: Zustand for global/shared stores, React Context for ephemeral state.** Libraries are swappable within the same store interface.

### 2.2 Three-Tier Store Classification

| Tier | Scope | Persistence | Examples |
|------|-------|-------------|---------|
| **Global** | App-wide, single instance | Optional (user prefs) | Auth session, theme, notifications |
| **Shared** | Multi-feature, route-scoped | No | Event list cache, directory results |
| **Ephemeral** | Single component/page | No | Form inputs, accordion state, modal open |

### 2.3 Cache-is-State Principle (from Stage 13)

Server data retrieved through the Data/API Layer must **never be duplicated** in client stores. Instead:

- Server data is consumed directly in RSC.
- For client re-use, wrap data-layer queries in hooks (Stage 14) that cache responses in a shared query client (e.g., TanStack Query or Zustand + `useSyncExternalStore`).
- Mutations invalidate or optimistically update the query cache — not a separate store.

### 2.4 Store Actions as the Only Mutation Path

All state mutations must go through **named store actions**, not direct property assignment. This ensures:

- Action logging / instrumentation hooks
- Middleware (persist, undo, cross-tab sync)
- Type-safe mutation boundaries

## 3. Consequences

### Positive

1. **Predictable data flow** — every piece of state has a known owner and lifecycle.
2. **Cross-feature consistency** — mutations in one feature propagate to affected stores without page reloads.
3. **Testability** — stores are pure functions with no UI dependency; actions are unit-testable.
4. **Hydration path** — server data safely seeds client stores without duplication or race conditions.
5. **Offline foundation** — persistence middleware + action queuing enable basic offline support.
6. **Performance** — granular selectors prevent unnecessary re-renders.

### Negative

1. **Boilerplate cost** — each shared/global store requires a definition file, selector file, type file, and test file.
2. **Learning curve** — developers must understand the classification system and ownership rules.
3. **Over-engineering risk** — teams may create global stores for state that should be ephemeral or server-derived.
4. **Migration cost** — existing ad hoc state must be refactored into the three-tier system.

### Mitigations

1. Code generation (plop / Hygen templates) for store boilerplate.
2. ESLint rules enforcing store boundary hierarchy (global → shared → feature).
3. Code review checklist item: "Is this state truly global/shared, or should it be ephemeral or server-derived?"
4. No refactoring of working code until it touches a store boundary — incremental adoption.

## 4. State Classification

Every piece of client state must be classified into one of 10 categories:

| # | Category | Tier | Example | Source of Truth |
|---|----------|------|---------|-----------------|
| 1 | **Auth Session** | Global | Current user, token, permissions | Server (API, refreshed) |
| 2 | **UI Preferences** | Global | Theme, sidebar collapsed, font size | Client (localStorage) |
| 3 | **Notification Feed** | Global | Toast queue, badge counts | Server (polled/WebSocket) |
| 4 | **Server Entity Cache** | Shared | Event list, alumni directory, job posts | Server (API, stale-while-revalidate) |
| 5 | **Search / Filter State** | Shared | Active filters, sort order, pagination cursor | Client (URL params as source, store as mirror) |
| 6 | **Form Drafts** | Ephemeral | Create-event form data, profile editor | Client (discard on submit) |
| 7 | **UI Interaction State** | Ephemeral | Accordion open/close, dropdown open, tooltip hover | Client (auto-cleanup) |
| 8 | **Scroll Position** | Ephemeral | List scroll restoration | Client (session-only) |
| 9 | **Feature Flags** | Global | Beta features, A/B test variant | Server (request-time) |
| 10 | **Cross-Feature Events** | Shared | "Profile updated" → refresh header | Event bus (pub/sub) |

## 5. Ownership Matrix

| Owning Layer | State Categories | Persistence | Notes |
|-------------|-----------------|-------------|-------|
| **Global Store** (`stores/global/`) | 1, 2, 3, 9 | localStorage for 2; session only for 1, 3, 9 | 1 read from server, refreshed on 401 |
| **Feature Stores** (`features/*/stores/`) | 4, 5 | None (cache layer handles 4) | 5 mirrors URL params for SSG compatibility |
| **Component State** (`useState`/`useReducer`) | 6, 7, 8 | None | Must clean up on unmount |
| **Event Bus** (`lib/event-bus/`) | 10 | None | Decoupled pub/sub with WeakRef subscribers |

## 6. Store Architecture

### 6.1 Global Store

```
stores/global/
├── auth-store.ts          # Auth session, token, permissions
├── preferences-store.ts   # Theme, sidebar, font size
├── notifications-store.ts # Toast queue, badge counts
├── feature-flags-store.ts # Beta flags, A/B variants
├── index.ts               # Barrel exports
└── types.ts               # Shared store types
```

Each global store:
- Is a **singleton** (one instance at app level).
- May use **persist middleware** (Zustand `persist` or Redux Toolkit `redux-persist`).
- Has a **`reset()` action** for logout/cleanup.
- Is accessible from anywhere via a `use<Name>Store()` hook.

### 6.2 Shared (Feature) Stores

```
features/events/stores/
├── events-cache-store.ts     # Cached event list + detail (thin — data layer is source)
├── events-filter-store.ts    # Active filters, sort, pagination
├── index.ts
└── types.ts
```

Each shared store:
- Is **scoped to a feature** but may be imported by other features.
- Must **not duplicate** server data (use the Data/API Layer hooks).
- **Invalidates** when the user navigates away from the feature.
- Has an **`onEnter()`/`onLeave()`** lifecycle pair.

### 6.3 Ephemeral State

- Lives in **component-local `useState` / `useReducer`**.
- Must clean up in `useEffect` return / `onUnmount`.
- May be lifted to a shared store only when 2+ unrelated components need it.

### 6.4 Event Bus (Cross-Feature Communication)

```
lib/event-bus/
├── create-event-bus.ts    # Typed pub/sub (EventEmitter pattern)
├── events.ts              # Event type definitions (namespace per feature)
├── index.ts
└── types.ts
```

Events are strings like `"profile:updated"`, `"events:rsvp-changed"`, `"auth:logged-out"`.  
Subscribers are cleaned up via WeakRef or explicit `unsubscribe()` in `onLeave()`.

## 7. State Lifecycle

### 7.1 Initialization Order

```
1. Auth store hydrates from cookie/session
2. Preferences store hydrates from localStorage
3. Feature flags loaded (blocking for A/B)
4. Per-feature stores created on route enter
5. Per-feature stores destroyed on route leave
```

### 7.2 Hydration from Server

Server components render data directly. Client components receive initial data as props to seed stores:

```typescript
// page.tsx (server component)
const events = await getEvents(page);

// Client wrapper receives data
<EventsPageClient initialData={events} />
```

```typescript
// events-page-client.tsx
function EventsPageClient({ initialData }: Props) {
  const { hydrate } = useEventsCacheStore();
  useEffect(() => { hydrate(initialData); }, [initialData]);
  // ...
}
```

### 7.3 Cleanup

- **Global stores:** Never destroyed (app lifecycle).
- **Shared stores:** `onLeave()` — reset filters, clear caches if stale.
- **Ephemeral state:** Automatic on unmount.
- **Event bus:** All subscriptions for a feature unregistered on route leave.

## 8. Store Boundaries & Dependency Rules

### 8.1 Import Rules

| From \ To | Global Store | Shared Store | Event Bus |
|-----------|-------------|-------------|-----------|
| **Global Store** | ✅ Allowed | ❌ Forbidden | ✅ Allowed |
| **Shared Store** | ✅ Allowed | ✅ Same feature only | ✅ Allowed |
| **Component** | ✅ Allowed | ✅ Allowed | ❌ Direct — use hook |
| **Hook** | ✅ Allowed | ✅ Allowed | ❌ Use event bus hook |
| **Section** | ✅ Allowed | ✅ Allowed | ❌ Use event bus hook |

### 8.2 Dependency Direction

```
Component/Hook  →  Shared Store  →  Global Store
                                       ↓
                                  Event Bus (sideways)
```

- Stores must **never import stores from a different feature** directly. Use the event bus to communicate.
- Stores must **never import UI components** (circular dependency risk).
- Stores must **never import Data/API Layer functions directly** — use hooks (Stage 14).

### 8.3 What Not to Store

The following must **never** be placed in a global or shared store:

- **Derived state** that can be computed from props or other store values (use `useMemo` or selectors).
- **Server data that is only used in RSC** (read it directly from the Data/API Layer).
- **URL state** (search params, pathname) — use `useSearchParams()` / `usePathname()`.
- **Form state that doesn't outlive the component** — use local state.
- **Static configuration** — use constants (Stage 11).

## 9. Synchronization Strategy

### 9.1 Cross-Tab Sync

- **Preferences store:** Sync across tabs via `BroadcastChannel` API (or Zustand `subscribeWithSelector` + `BroadcastChannel`).
- **Auth store:** Invalidated on token expiry in one tab → broadcast logout to all tabs.
- **Entity caches:** No cross-tab sync (each tab fetches independently; cache layer deduplicates).

### 9.2 Offline Support

- **Read path:** If network unavailable, serve from persisted store (Zustand persist middleware).
- **Write path:** Queue mutations in an action log; replay on reconnection.
- **Conflict resolution:** Last-write-wins for simple fields; server-authoritative for entity data.
- **UI feedback:** Show "You're offline" banner; show pending indicators for queued mutations.

### 9.3 Optimistic Updates

- Mutations update stores immediately.
- On success, store is refreshed from server response.
- On failure, store is rolled back (snapshot captured before mutation).
- Rollback triggers a toast: "Failed to save. Your change has been reverted."

## 10. Selector, Subscription & Memoization

### 10.1 Selectors

- Every store exposes **atomic selectors** (return a single value) and **compound selectors** (return derived data).
- Selectors use **shallow equality** by default; deep-compare only when explicitly needed.
- Selectors are defined in the store file and exported.

```typescript
// Good — atomic selector
const userName = useAuthStore((s) => s.user?.name);

// Good — compound selector with shallow comparison
const { items, total } = useEventsCacheStore(
  (s) => ({ items: s.items, total: s.total }),
  shallow
);

// Bad — returning new object without shallow
const { items, total } = useEventsCacheStore((s) => ({ items: s.items, total: s.total }));
```

### 10.2 Subscription Outside React

For event bus handlers, service workers, and imperative code:

```typescript
const unsubscribe = useAuthStore.subscribe(
  (state) => state.user,
  (user) => { /* handle change */ }
);
```

### 10.3 Memoization

- Derived values use `useMemo` with correct dependency arrays.
- Expensive computations use `useMemo` + `useDeferredValue` to avoid blocking the UI thread.
- Store data that passes through multiple components uses `React.memo` at the component boundary.

## 11. Persistence & Hydration

### 11.1 What to Persist

| Data | Medium | Key |
|------|--------|-----|
| UI preferences (theme, sidebar) | `localStorage` | `jjcet:prefs` |
| Form drafts (session only) | `sessionStorage` | `jjcet:draft:<feature>:<id>` |
| Auth token | HTTP-only cookie | — |
| Offline mutation queue | `localStorage` | `jjcet:offline-queue` |
| Entity caches | None (server-source) | — |

### 11.2 Hydration Delay

- Persisted stores show a **loading state** (skeleton/spinner) until hydration completes.
- Auth store hydrates from the cookie/server on first render — no flash of logged-out state.
- Preferences hydrate before the first paint (synchronous read from localStorage, or use `<script>` injection).

## 12. Governance & Best Practices

### 12.1 Store Definition Template

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthActions {
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  reset: () => void;
}

type AuthStore = AuthState & AuthActions;
```

### 12.2 Store Naming

- File: `kebab-case-store.ts`
- Hook: `use<KebabCase>Store` (e.g., `useAuthStore`, `useEventsFilterStore`)
- Type: `<Name>State`, `<Name>Actions`, `<Name>Store`
- Action verbs: `set`, `toggle`, `reset`, `hydrate`, `invalidate`, `optimistic<Action>`

### 12.3 Testing

- **Unit tests:** Test each action with known starting state; verify state transitions.
- **Integration tests:** Test that a component dispatching an action produces correct UI updates.
- **Persistence tests:** Mock `localStorage` and verify hydrate/rehydrate round-trip.
- **Cross-tab tests:** Verify `BroadcastChannel` messages produce correct state changes.

### 12.4 ESLint Rules

Enforce via custom ESLint plugin or `@typescript-eslint`:

- `no-store-import-from-feature` — shared stores must not import from other features' stores.
- `no-direct-store-mutation` — state must be modified through actions only.
- `store-must-have-reset` — every global/shared store must expose a `reset()` action.
- `no-server-data-in-store` — warn if a store property name matches a known API entity type.

## 13. File Structure Convention

```
src/
├── stores/
│   ├── global/
│   │   ├── auth-store.ts
│   │   ├── preferences-store.ts
│   │   ├── notifications-store.ts
│   │   ├── feature-flags-store.ts
│   │   ├── index.ts
│   │   └── types.ts
│   ├── index.ts              # Barrel — re-exports all global stores
│   └── create-store.ts       # Factory for creating stores with middleware
├── features/
│   └── events/
│       ├── stores/
│       │   ├── events-cache-store.ts
│       │   ├── events-filter-store.ts
│       │   ├── index.ts
│       │   └── types.ts
│       └── ...
├── lib/
│   └── event-bus/
│       ├── create-event-bus.ts
│       ├── events.ts
│       ├── index.ts
│       └── types.ts
```

## 14. Migration Strategy

### Phase 1 — Foundation (this stage)
1. Create `stores/` directory with global auth, preferences, and notifications stores.
2. Create `lib/event-bus/` with typed pub/sub.
3. Create store factory (`create-store.ts`) with common middleware (persist, devtools, cross-tab).
4. Define all store types in `stores/global/types.ts`.
5. Wire auth store into the root layout provider.

### Phase 2 — Feature Adoption (during Stage 5-6)
6. Each feature creates its own `stores/` directory as needed.
7. Event bus events are defined as features are integrated.
8. Existing ad hoc state is migrated opportunistically.

### Phase 3 — Optimization (during Stage 17-18)
9. Performance audit — identify unnecessary re-renders.
10. Add selector optimization and `React.memo` boundaries.
11. Cross-tab sync for preferences store.
12. Offline support for reading persisted entity caches.

## 15. References

- [ADR 013: Data / API Layer](013-data-api-layer.md) — Cache-is-State principle, repository pattern
- [ADR 014: Hook Layer](014-hooks-layer.md) — Hook patterns for data access
- Zustand: https://github.com/pmndrs/zustand
- TanStack Query (if adopted): https://tanstack.com/query/latest
- Next.js `useSyncExternalStore`: https://react.dev/reference/react/useSyncExternalStore
