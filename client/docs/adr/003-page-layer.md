# Stage 4 — Page Layer Specification

**Status:** Draft  
**Dependencies:** Stage 2 (Routing Layer), Stage 3 (Layout Layer)  
**Next:** Stage 5 (Feature Layer)

---

## 1. Page Philosophy

### Purpose

Define the guiding principles that govern every page in the application.

### Engineering Rationale

Pages are the outermost orchestration unit of the App Router. Every route resolves to exactly one `page.tsx`. Placing orchestration concerns — data fetching, auth, metadata, error boundaries — inside the page keeps the architecture predictable. Deviating from this philosophy produces scattered concerns, duplicated logic, and untestable features.

### Recommended Option

**Thin Page as Orchestrator.** Each `page.tsx` is a thin composition layer that:

- Reads validated route parameters and search parameters
- Guards access via authentication and authorization
- Performs parallel data fetches at the top of the component tree
- Assigns fetched data to feature components via props
- Declares route-level metadata and viewport
- Does not contain JSX beyond feature composition, layout wrappers (if any), and Suspense boundaries

### Trade-offs

- _Thicker pages_ reduce file count but create monoliths that couple data, auth, and UI in one file — harder to test, harder to review, harder to refactor.
- _Over-splitting_ creates unnecessary indirection for trivial pages. The rule: if a page body would fit in ~20 lines of feature composition, a standalone feature module is not yet warranted.

### Industry Best Practice

Next.js App Router examples, Vercel's real-world demo apps, and enterprise reference architectures consistently demonstrate thin page orchestration with Server Components.

### Recommendation

Adopt Thin Page as Orchestrator for every route group. Allow exceptions only for trivial redirect pages or empty placeholder stubs.

---

## 2. Page Architecture

### Purpose

Define the structural anatomy of a page and how pages relate to surrounding files.

### Engineering Rationale

Every route directory contains a predictable set of files: `page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, and potentially feature modules under a `_features/` directory or co-located `_components/`. Consistent naming and placement reduces cognitive load.

### Recommended Option

**Co-located page bundle.** Each route directory contains:

```
<route>/
  page.tsx            — Orchestrator (always present)
  loading.tsx         — Loading fallback (per-group or per-route)
  error.tsx           — Error boundary (per-group or per-route)
  not-found.tsx        — Not-found boundary (per-group or per-route)
  _components/
    page-header.tsx   — Page-level composition helpers (optional)

<feature>/             — If feature is complex, a feature directory
  index.ts            — Public API of the feature
  feature.tsx         — Feature orchestrator
  _sections/
  _components/
```

The page imports from `@/features/<name>` (Stage 5) for reusable feature modules. Per-route helper components live in `_components/` to signal they are private to that route.

### Trade-offs

- _Flat import from features only_ is cleaner but forces even trivial page-specific UI into the features layer prematurely.
- _Per-route `_components/`_ allows pragmatic colocation for one-off composition helpers without polluting the shared component layer.

### Industry Best Practice

Next.js App Router treats `page.tsx` as the sole entry point. Co-location of route-private modules under underscore-prefixed directories is the documented convention.

### Recommendation

Enforce the co-located page bundle structure. Formalize `_components/` for page-private helpers only; promote reusable UI to `@/components/` (Stage 9) and reusable features to `@/features/` (Stage 5).

---

## 3. Page Classification

### Purpose

Categorize pages by rendering strategy, access level, and dynamic behavior to drive architectural decisions.

### Engineering Rationale

Not all pages are equal. A public landing page, an authenticated dashboard, and an admin settings page each have different rendering, data, and caching requirements. Classification makes these requirements explicit.

### Recommended Option

**Quadrant model with two axes: access level × rendering mode.**

| Access \ Rendering | Static (SSG)                                    | Dynamic (SSR)                                |
| ------------------ | ----------------------------------------------- | -------------------------------------------- |
| **Public**         | `/`, `/about`, `/faq`, `/legal/...`, `/contact` | `/events/[slug]`, `/directory/[slug]`        |
| **Auth**           | —                                               | `/auth/login`, `/auth/register`, `/auth/...` |
| **Alumni**         | —                                               | `/alumni/*`                                  |
| **Admin**          | —                                               | `/admin/*`                                   |

- **Static Public pages:** Pre-rendered at build time. No request-time data. Fastest possible delivery.
- **Dynamic Public pages:** Server-rendered with `generateStaticParams` for ISR + fallback blocking.
- **Auth pages:** Always dynamic. Redirect authenticated users away. Never cached.
- **Alumni pages:** Dynamic. Require authentication. Personalised data.
- **Admin pages:** Dynamic. Require admin role. Sensitive operations.

### Trade-offs

- _Fully static_ is fastest but cannot render user-specific content. Public marketing pages benefit most.
- _Fully dynamic_ adds server latency but enables personalisation. All authenticated pages must be dynamic.

### Industry Best Practice

Static generation is preferred for any page that can be pre-computed. Dynamic rendering is required when content depends on the request (user session, search params, real-time data).

### Recommendation

Classify every route at build time using the quadrant model. Document the classification in each page file as a top-level comment.

---

## 4. Page Responsibilities

### Purpose

Define exactly what a `page.tsx` file must and must not do.

### Engineering Rationale

Without explicit boundaries, pages accumulate responsibilities — inline data fetching, inline UI markup, inline error handling — defeating the layered architecture.

### Recommended Option

**Seven responsibilities, no more:**

1. **Parameter extraction** — read `params` and `searchParams` (both async in Next.js 16).
2. **Access control** — authenticate the user, authorize the role.
3. **Metadata declaration** — export `metadata` or `generateMetadata` object.
4. **Data orchestration** — call server-side data functions in parallel; create promises in parallel.
5. **Feature assignment** — pass fetched data as props to feature components.
6. **Suspense scaffolding** — wrap data-dependent features in Suspense boundaries.
7. **Loading/error delegation** — rely on co-located `loading.tsx` and `error.tsx`.

### Trade-offs

- _Strict responsibility enforcement_ requires discipline during code review but guarantees that feature modules remain reusable.
- _Lax responsibility enforcement_ is faster initially but creates tech debt that compounds as the application grows.

### Industry Best Practice

Single Responsibility Principle applied at the file level is a hallmark of maintainable Next.js codebases.

### Recommendation

Enforce the seven responsibilities via an ESLint rule or architectural review checklist. Treat violations as blocking.

---

## 5. Page Composition Strategy

### Purpose

Define how pages compose features, sections, and components into a final render tree.

### Engineering Rationale

The page is the root of the render tree. It must assemble the tree without knowing the internal details of each node. Composition happens at the feature level, not the component level.

### Recommended Option

**Feature-first composition.** The page imports feature components from `@/features/<name>` and passes only the data those features require as props. Features internally compose sections, which compose components.

```tsx
// page.tsx (illustrative, not code)
// 1. Extract params
// 2. Parallel data fetch
// 3. Access guard
// 4. Compose features
export default async function Page({ params }) {
  const { id } = await params;
  const [profile, events] = await Promise.all([getProfile(id), getEvents(id)]);
  return (
    <ProfileFeature profile={profile}>
      <Suspense fallback={<EventsSkeleton />}>
        <EventsFeature events={events} />
      </Suspense>
    </ProfileFeature>
  );
}
```

### Trade-offs

- _Feature-first composition_ creates a clean dependency graph but requires discipline during feature development.
- _Direct section composition_ is faster for simple pages but couples the page to section internals.

### Industry Best Practice

Feature-Based Architecture (FBA) and Domain-Driven Design (DDD) both advocate encapsulating domain logic behind a public interface. Feature modules are that interface.

### Recommendation

All page-level composition must go through feature modules. Direct section imports from `@/sections/` are allowed only for truly page-specific layouts that have no reusable domain value.

---

## 6. Page Lifecycle

### Purpose

Define the sequence of events from route match to final render.

### Engineering Rationale

Understanding the lifecycle helps developers reason about when data is fetched, when metadata is computed, when auth runs, and when the UI renders.

### Recommended Option

**Nine-stage lifecycle:**

1. **Route match** — Next.js matches the URL to a route directory.
2. **Middleware (proxy.ts) check** — Proxy runs auth and role check, sets/clears cookies, returns redirect if unauthenticated.
3. **Layout cascade** — Root layout → Route group layout → (if nested) nested layout renders before page.
4. **Metadata resolution** — `generateMetadata()` executes in parallel if data-dependent; otherwise static `metadata` is used.
5. **Page function execution** — `page.tsx` async function runs: params → auth → data → Suspense boundaries.
6. **Suspense boundary suspension** — Any feature wrapped in Suspense triggers its `fallback` (`loading.tsx` or inline fallback).
7. **Data resolution + stream flush** — As promises resolve, Suspense boundaries unblock and content streams to the client.
8. **Error boundary check** — If any feature throws, the nearest `error.tsx` catches and renders the fallback.
9. **Full hydration** — Client Components within the page hydrate and take over interactivity.

### Trade-offs

- _Deep lifecycle understanding_ is essential for debugging but rarely needed for routine development.
- _Simplified mental model_ ("it's just a React component") works for trivial pages but fails for streaming, Suspense, and error scenarios.

### Industry Best Practice

Next.js documentation explicitly maps the App Router lifecycle. Internalising this sequence prevents common mistakes (e.g., calling hooks in Server Components, fetching before auth).

### Recommendation

Document the lifecycle in the team's onboarding guide. Reference it during architectural reviews.

---

## 7. Rendering Strategy

### Purpose

Determine whether each page is statically generated, dynamically rendered, or incrementally regenerated.

### Engineering Rationale

Rendering strategy directly impacts performance, freshness, and infrastructure cost. Choosing the wrong strategy either wastes resources or serves stale content.

### Recommended Option

**Tiered rendering strategy:**

| Tier             | Strategy                               | Pages                                         | Rationale                                                 |
| ---------------- | -------------------------------------- | --------------------------------------------- | --------------------------------------------------------- |
| **T1 — Static**  | `force-static`, no revalidate          | `/`, `/about`, `/faq`, `/legal/*`, `/contact` | Content never changes per request. Fastest delivery.      |
| **T2 — ISR**     | `revalidate`, `generateStaticParams`   | `/events/[slug]`, `/directory/[slug]`         | Content updates infrequently. Freshness within bounds.    |
| **T3 — Dynamic** | `dynamic = "force-dynamic"` or default | `/auth/*`, `/alumni/*`, `/admin/*`            | Content is request-dependent (user session). Never cache. |

- T1 pages are pre-rendered at build time. No server compute at request time.
- T2 pages pre-render known paths at build time, regenerate on demand when revalidation time elapses.
- T3 pages render on every request. Required for personalised content and auth-gated routes.

### Trade-offs

- _ISR_ balances freshness and speed but adds complexity (stale-while-revalidate, on-demand revalidation).
- _Full dynamic_ simplifies the mental model but increases server load. Acceptable for authenticated routes where load is bounded by authenticated users.

### Industry Best Practice

Vercel and Next.js recommend static by default, ISR for content pages, and dynamic only when necessary. This aligns with the rendering tiers above.

### Recommendation

Label every route with its rendering tier in the page file. Use `export const dynamic` or `revalidate` export explicitly. Do not rely on heuristics for auth-gated routes — export `force-dynamic`.

---

## 8. Server Components vs Client Components

### Purpose

Define the boundary between server-rendered and client-rendered code at the page level.

### Engineering Rationale

Server Components reduce the client bundle size, improve initial load time, and simplify data fetching. Client Components enable interactivity, browser APIs, and state. The page must set the correct boundary.

### Recommended Option

**All pages are Server Components by default.** The `"use client"` directive exists only in:

- Interactive feature components (forms, search inputs, modals)
- Context providers (theme, auth state)
- Components that use hooks (`usePathname`, `useRouter`, `useSearchParams`)

The page itself (`page.tsx`) must never be a Client Component. If interactivity is required, the page delegates to a client feature component deeper in the tree.

### Trade-offs

- _Server-only pages_ are simpler and faster but cannot use browser APIs directly.
- _Entire page as Client Component_ is occasionally necessary (e.g., a highly interactive page), but this should be explicit and rare. Even then, most data can still be fetched in a Server Component wrapper.

### Industry Best Practice

React Server Components are the default in Next.js App Router. The React team and Vercel documentation emphasise moving `"use client"` as deep as possible.

### Recommendation

Enforce via ESLint: flag any `"use client"` directive in `page.tsx` files unless explicitly approved in code review. All pages are Server Components.

---

## 9. Data Fetching Strategy

### Purpose

Define how pages fetch data, who owns data fetching, and how data flows to features.

### Engineering Rationale

Data fetching is the most common source of performance problems in Next.js applications. Sequential fetches, waterfall requests, and missing caching directives degrade user experience.

### Recommended Option

**Parallel data fetching at the page level.** The page:

1. Defines all required data fetches as top-level awaited calls or parallel `Promise.all` calls.
2. Each data fetch is a call to a server function (`@/lib/data/<entity>.ts`), not direct database access.
3. Fetches are structured so that independent data loads in parallel.
4. Dependent data (fetch B depends on result of fetch A) is explicitly chained and documented.
5. The page passes fetched data via props to feature components.
6. Features do not fetch their own data — they receive it as props.

### Trade-offs

- _Page-level data fetching_ creates a single source of truth for data dependencies but makes the page file longer.
- _Feature-level data fetching_ makes features self-contained but risks waterfalls and duplicated fetches.

### Industry Best Practice

Next.js documentation, Vercel reference architectures, and React 19's `use` hook all promote fetching as high as possible in the tree. Parallel data fetching is specifically documented as a performance best practice.

### Recommendation

All data fetching is owned by the page. Feature components receive data as props. Server data functions live in `@/lib/data/` (Stage 13) and are called by the page, not by features.

---

## 10. Metadata Strategy

### Purpose

Define how pages provide SEO metadata, Open Graph tags, and viewport configuration.

### Engineering Rationale

Every page needs appropriate metadata for SEO, social sharing, and accessibility. Metadata is also used by the Layout Layer (Stage 3) for the document head. Inconsistent or missing metadata harms search ranking and user trust.

### Recommended Option

**Dual approach:**

| Type                 | Mechanism                                                          | Pages                                               |
| -------------------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| **Static metadata**  | `export const metadata = { ... }`                                  | T1 static pages with fixed title/description        |
| **Dynamic metadata** | `export async function generateMetadata({ params, searchParams })` | T2/T3 pages where title/description depends on data |

- Every page exports one of the two.
- Metadata includes: `title` (with template), `description`, `openGraph`, `robots`, `alternates`.
- Dynamic metadata reuses the same data fetches as the page (call once, share via deduplication or re-fetch).
- Viewport is set at the root layout and overridden only when absolutely necessary.

### Trade-offs

- _Dual metadata functions_ add a second data fetch in `generateMetadata` (which runs in parallel with the page). Data deduplication via React's `cache()` or Next.js fetch caching prevents double-fetching.
- _Single source of metadata_ (root layout only) is simpler but cannot provide page-specific Open Graph images or descriptions.

### Industry Best Practice

Next.js documentation recommends per-page metadata for optimal SEO. Dynamic `generateMetadata` is the documented pattern for data-driven titles.

### Recommendation

Every page exports either `metadata` or `generateMetadata`. Data-dependent metadata reuses the same fetch function, relying on React's `cache()` to deduplicate. No page is left without metadata.

---

## 11. Route Parameter Strategy

### Purpose

Define how pages receive, validate, and use route parameters (`params`).

### Engineering Rationale

Route parameters (e.g., `[slug]`, `[id]`) are the primary mechanism for data retrieval. Invalid or missing parameters must be handled gracefully — not thrown to a 500 error.

### Recommended Option

**Async params with validation guard.**

In Next.js 16, `params` is an async `Promise<Record<string, string>>`. Every page that receives dynamic params must:

1. Await the params object.
2. Validate each parameter (type, format, existence).
3. Throw a `notFound()` (imported from `next/navigation`) if a parameter is invalid.
4. Pass validated parameters down as plain values, not as the raw params object.

A validation helper (`@/lib/route-params.ts`) encapsulates common patterns (slug validation, ID parsing) so pages are not burdened with validation logic.

### Trade-offs

- _Validation at page entry_ adds a few lines but prevents invalid data from reaching data fetches and features.
- _Trusting the routing layer_ (assuming params are always valid) is optimistic but risks cryptic errors when a database query receives a malformed ID.

### Industry Best Practice

Defensive parameter validation at the page boundary is standard in enterprise applications. Next.js examples often skip validation for brevity but production applications should not.

### Recommendation

Every dynamic page validates its params. Use a shared utility for common validations. Call `notFound()` for invalid parameters — never render a broken page.

---

## 12. Search Parameter Strategy

### Purpose

Define how pages receive and use URL search parameters (`searchParams`).

### Engineering Rationale

Search parameters control pagination, filtering, sorting, and tab state. They are inherently user-supplied and must be validated. In Next.js 16, `searchParams` is an async `Promise<Record<string, string | string[] | undefined>>`.

### Recommended Option

**Validate, coerce, and pass to features.**

1. Await `searchParams` at the top of the page function.
2. Coerce to typed values using a validation schema (Zod or equivalent) at the page boundary.
3. If validation fails, use sensible defaults rather than throwing.
4. Never pass raw `searchParams` to child components — pass typed, validated objects.
5. For tab state, pagination, and filters, features receive the validated search params and emit URL changes via `Link` or `useRouter` (in Client Components).

### Trade-offs

- _Validating at page entry_ is defensive and clarifies the contract between URL and feature.
- _Passing raw searchParams_ is faster to write but leaks URL format assumptions throughout the component tree.

### Industry Best Practice

Coercing URL strings to typed values at the boundary is standard in TypeScript applications. Next.js documentation warns that `searchParams` is a plain object and developers should validate it.

### Recommendation

Every page that reads `searchParams` validates and coerces them using a shared schema. Invalid values use defaults. Never pass raw searchParams to features.

---

## 13. Authentication Handling

### Purpose

Define how pages ensure a user is authenticated before rendering.

### Engineering Rationale

Authentication is a cross-cutting concern. The proxy (`proxy.ts`, Stage 2) handles the redirect layer, but pages must also verify authentication for their content. This prevents rendering flash of unauthorised content and enables personalised experiences.

### Recommended Option

**Two-layer auth guard:**

| Layer           | Mechanism               | Responsibility                                                                                           |
| --------------- | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| **Proxy layer** | `proxy.ts` (middleware) | Redirect unauthenticated users to `/auth/login?redirect=`. Apply to all protected route groups.          |
| **Page layer**  | `getCurrentUser()` call | Verify session is still valid. Fetch current user data for the page. Redirect or render based on result. |

The page calls a server function (e.g., `getCurrentUser()`) that returns the authenticated user or `null`. If `null`, the page redirects. If the user exists, their data is passed to features.

This two-layer approach ensures that:

- The proxy handles the fast path (redirect before any page code runs).
- The page handles the verified path (confirming the session is still valid at render time).

### Trade-offs

- _Proxy-only auth_ is faster (no page data fetch for unauthorised users) but does not verify session validity at render time.
- _Page-only auth_ renders the layout before checking auth, causing a flash and wasted layout render.
- _Two-layer approach_ adds slight complexity but eliminates both problems.

### Industry Best Practice

Major production Next.js applications use a middleware + page-layer auth strategy. The middleware performs coarse-grained protection; the page performs fine-grained verification.

### Recommendation

All protected route groups implement both proxy-layer redirect (existing Stage 2) and page-layer verification. Public pages do not call `getCurrentUser()`.

---

## 14. Authorization Handling

### Purpose

Define how pages enforce role-based access control (RBAC).

### Engineering Rationale

Authentication confirms identity. Authorization confirms permission. An authenticated alumni user must not access admin pages, and vice versa. Authorization at the page boundary prevents data leaks and unauthorized operations.

### Recommended Option

**Page-level role guard via `getCurrentUser()` result.**

1. The page calls `getCurrentUser()`, which returns the user's role (`alumni`, `admin`, `alumni_lead`).
2. The page compares the role against the required role for the route group.
3. If the role is insufficient, the page redirects to the appropriate dashboard (e.g., alumni user visiting `/admin/*` is redirected to `/alumni/dashboard`).
4. The proxy layer also performs role-based routing (Stage 2), but the page layer is the authoritative check.

A helper function `requireRole(role: Role)` can encapsulate the check + redirect pattern.

### Trade-offs

- _Page-level authorization_ duplicates the proxy check but is the authoritative source.
- _Proxy-only authorization_ is sufficient for coarse-grained access but cannot implement fine-grained permissions per entity.

### Industry Best Practice

Enterprise Next.js applications implement authorization at multiple layers: network (proxy), application (page), and data (API). Each layer enforces the same policies independently.

### Recommendation

Every protected page verifies the user's role before rendering. Use a shared `requireRole` utility. Redirect to the appropriate fallback route if the role is insufficient.

---

## 15. Error Handling

### Purpose

Define how pages handle runtime errors, data fetch failures, and unexpected exceptions.

### Engineering Rationale

Errors are inevitable. The error boundary layer (`error.tsx`) catches rendering errors. Data fetch failures are caught and handled within the page. The two mechanisms work together to provide a resilient user experience.

### Recommended Option

**Two-tier error handling:**

| Layer                    | File                  | Catches                                       | Behaviour                             |
| ------------------------ | --------------------- | --------------------------------------------- | ------------------------------------- |
| **Route-group boundary** | `(<group>)/error.tsx` | Rendering errors in any page within the group | Shows group-level error UI with retry |
| **Root boundary**        | `app/error.tsx`       | Rendering errors in root layout               | Shows global error UI with retry      |

- Data fetch errors are caught at the page level using try/catch around `Promise.all`.
- If a data fetch fails, the page can either: (a) render a subset of features that succeeded, or (b) throw to trigger the error boundary for a full error page.
- Option (a) is preferred for dashboards where partial data is acceptable.
- Option (b) is preferred for detail pages where all data is required.

### Trade-offs

- _Partial rendering on error_ is more resilient but requires the page to handle partial data states.
- _Full error throw_ is simpler but loses the entire page's content.

### Industry Best Practice

Error boundaries in Next.js are documented as the primary error handling mechanism. Granular Suspense boundaries around each feature enable partial recovery.

### Recommendation

Use granular Suspense boundaries around features. Wrap each data fetch in a try/catch. For non-critical features, log the error and render a fallback. For critical page data, throw to trigger `error.tsx`.

---

## 16. Loading Strategy

### Purpose

Define how pages communicate loading state to users during data fetching and streaming.

### Engineering Rationale

Loading states improve perceived performance and prevent layout shift. The App Router provides `loading.tsx` (automatic Suspense boundary) and manual Suspense boundaries for granular loading states.

### Recommended Option

**Hybrid approach: automatic + manual Suspense.**

| Strategy                    | Mechanism                                             | When Used                                                |
| --------------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| **Automatic (loading.tsx)** | File-based Suspense boundary wrapping the entire page | Initial page navigation, full-page data load             |
| **Manual Suspense**         | Wrap individual features in `<Suspense>`              | Partial page load, dashboard grids, independent sections |

- Each route group has a `loading.tsx` file (Stage 3 provides skeleton variants).
- Pages that stream independent sections wrap each section in `Suspense` with a section-specific skeleton.
- The `loading.tsx` provides the outermost fallback while manual Suspense boundaries provide inner ones.

### Trade-offs

- _Automatic only_ is simple but shows a full-page skeleton even when only one section is slow.
- _Manual Suspense only_ gives the best granularity but requires more boundaries to maintain.

### Industry Best Practice

Next.js documentation recommends using both file-based and manual Suspense. File-based `loading.tsx` for the page shell; manual Suspense for streaming independent sections.

### Recommendation

Every route group has a `loading.tsx` with skeleton chrome. Pages with independent data sections add manual Suspense boundaries around each feature for streaming.

---

## 17. Empty State Strategy

### Purpose

Define how pages render when data fetches return empty results.

### Engineering Rationale

Empty states are not errors. They are legitimate states of the application (e.g., no events found, no messages yet). They must be handled gracefully with helpful messaging and calls to action.

### Recommended Option

**Empty state is a feature concern, not a page concern.**

1. The page passes the full data array (which may be empty) to the feature.
2. The feature checks for empty data and renders an appropriate empty state component.
3. Empty state components (`@/components/empty-state/`) are reusable across features.
4. Empty states include: a clear message, an icon or illustration, and a call to action (e.g., "Create your first event" → link to create page).

This approach keeps the page thin and lets features own their empty state logic.

### Trade-offs

- _Page-level empty state_ makes the page aware of feature internals and duplicates logic across pages sharing the same feature.
- _Feature-level empty state_ requires features to handle the empty case, which they should do anyway.

### Industry Best Practice

Empty state handling at the component level (not the page level) is standard in React application architecture.

### Recommendation

Pages pass data as-is (including empty arrays) to features. Features check for empty data and render appropriate empty state components. Shared empty state components live in `@/components/`.

---

## 18. Page State Boundaries

### Purpose

Define how global state, feature state, and URL state interact at the page level.

### Engineering Rationale

State management in the App Router is distributed: URL state is the source of truth for navigation, React Server Component state is ephemeral per request, and client state (Zustand, React context) persists across navigations.

### Recommended Option

**URL is the source of truth for page-level state.**

| State Type             | Location                 | Example                         |
| ---------------------- | ------------------------ | ------------------------------- |
| **Page state**         | URL search params        | `?page=2&sort=date`             |
| **Persisted UI state** | Zustand store            | `sidebarCollapsed`, `theme`     |
| **Ephemeral UI state** | useState inside features | `isDropdownOpen`, `selectedTab` |

- Page state (pagination, filters, sort) lives in the URL.
- Feature state (form state, modal open) lives in the feature's Client Component.
- Global UI state (theme, sidebar) lives in a Zustand store (Stage 15).
- Server state (data from the API) is fetched per request and not stored globally.

### Trade-offs

- _URL-based state_ enables deep linking and shareable URLs but makes state management more explicit (more code).
- _Local state_ is simpler but does not survive navigation or page refresh.

### Industry Best Practice

URL state for page-level concerns is a well-established pattern in web applications. Next.js App Router's `searchParams` API and `useSearchParams` hook support this natively.

### Recommendation

Page-level state belongs in URL parameters. Feature-level state belongs in the feature. Global state belongs in Zustand. Page files orchestrate this distinction by parsing URL params for features and not managing feature state directly.

---

## 19. Feature Composition

### Purpose

Define how features are imported, configured, and composed at the page level.

### Engineering Rationale

Features are the primary unit of composition in the Page Layer. A page selects which features to render and passes them data. Features should be swappable without changing the page's core structure.

### Recommended Option

**Feature-as-component pattern.**

- Each feature is a default export from `@/features/<name>/index.ts`.
- The page imports features and composes them in the render tree.
- Feature components receive typed props for the data they need.
- Feature components can be wrapped in Suspense boundaries by the page.
- Feature components can be wrapped in ErrorBoundary components (or rely on the route-group error boundary).

```tsx
// page.tsx (illustrative pattern)
import { ProfileCard } from "@/features/profile";
import { EventList } from "@/features/events";
```

### Trade-offs

- _Feature-as-component_ is simple and composable but may encourage prop drilling if features are deeply nested. This is mitigated by keeping features at a single level of nesting.
- _Feature-as-container + sections_ is more structured but adds an indirection layer.

### Industry Best Practice

Feature-based architecture in React commonly exposes feature components as the public API of a feature module. This is consistent with clean architecture and domain-driven design.

### Recommendation

Each feature module exports exactly one or two primary feature components. Pages import these and compose them. Features do not import other features directly — cross-feature communication happens through the page.

---

## 20. Component Composition

### Purpose

Define how features compose sections, sections compose components, and components compose primitives.

### Engineering Rationale

The composition hierarchy (Page → Feature → Section → Component → Primitive) must be enforced to prevent tight coupling and ensure reusability.

### Recommended Option

**Strict downward-only composition.**

| Layer         | Can compose                                     | Cannot compose                   |
| ------------- | ----------------------------------------------- | -------------------------------- |
| **Page**      | Features, Suspense boundaries, Error boundaries | Sections, Components, Primitives |
| **Feature**   | Sections, Page-level primitives (if justified)  | Other features, Pages            |
| **Section**   | Components, Primitives                          | Features, Sections               |
| **Component** | Primitives, Other components                    | Sections, Features               |
| **Primitive** | HTML elements, Other primitives                 | Components, Sections             |

- A page that needs a unique section not shared by any other page may compose that section directly (exception to the rule, justified in code review).
- Features that share a common layout pattern may import a shared section from `@/sections/`.

### Trade-offs

- _Strict hierarchy_ prevents circular dependencies but requires forward planning of shared UI.
- _Loose hierarchy_ is faster for prototyping but produces tangled dependencies that resist refactoring.

### Industry Best Practice

Clean Architecture and Domain-Driven Design both prescribe strict dependency rules. The UI equivalent is a one-way dependency graph from pages → features → sections → components → primitives.

### Recommendation

Enforce the downward-only composition hierarchy as an architectural invariant. Violations require written justification in the pull request.

---

## 21. Page Performance Strategy

### Purpose

Define performance best practices for every page.

### Engineering Rationale

Page performance directly impacts user experience, SEO rankings, and conversion rates. Core Web Vitals (LCP, CLS, INP) must be considered from the architecture phase.

### Recommended Option

**Performance checklist per page:**

1. **Small bundle size** — No `"use client"` in page files. Client boundaries pushed to leaves.
2. **Parallel data fetching** — Independent fetches use `Promise.all`, not sequential `await`.
3. **Streaming** — Slow sections wrapped in Suspense for progressive HTML delivery.
4. **Preload hints** — `preload()` for critical data and images.
5. **Image optimization** — All images use `next/image` with explicit `width`/`height` to prevent CLS.
6. **Font optimization** — Fonts loaded via `next/font` (Stage 1).
7. **Bundle analysis** — Regular `@next/bundle-analyzer` runs to identify large client modules.
8. **Route prefetching** — Key navigation targets prefetched via `<Link prefetch>`.

### Trade-offs

- _Applying all 8 checks_ adds review overhead but guarantees baseline performance.
- _Selective performance optimization_ saves effort but risks regressions.

### Industry Best Practice

Core Web Vitals are ranking factors. Vercel and Next.js documentation provide specific guidance for each metric.

### Recommendation

Apply the 8-point performance checklist to every page. Automate checks where possible (bundle size CI, Lighthouse CI).

---

## 22. Caching Strategy

### Purpose

Define how pages and their data fetches interact with Next.js caching layers.

### Engineering Rationale

Next.js has multiple caches: Full Route Cache, Data Cache, Router Cache, and static rendering cache. Understanding which cache applies to which page prevents stale content and unexpected behaviour.

### Recommended Option

**Cache configuration per rendering tier:**

| Tier             | Full Route Cache     | Data Cache                                         | Router Cache                      |
| ---------------- | -------------------- | -------------------------------------------------- | --------------------------------- |
| **T1 — Static**  | Enabled (build-time) | Not applicable                                     | Enabled (30s default)             |
| **T2 — ISR**     | Enabled (revalidate) | Enabled (revalidate)                               | Enabled (30s default)             |
| **T3 — Dynamic** | Disabled             | Use `fetch` `cache: "no-store"` or `revalidate: 0` | Disabled for authenticated routes |

- T3 pages must explicitly opt out of caching with `export const dynamic = "force-dynamic"`.
- Data fetches in T3 pages use `cache: "no-store"` to ensure fresh data.
- Router cache is automatically disabled for pages with `dynamic = "force-dynamic"`.

### Trade-offs

- _Aggressive caching_ improves performance but risks serving stale personalised data.
- _No caching_ ensures freshness but increases server load. Acceptable because authenticated users are a bounded set.

### Industry Best Practice

Next.js documentation recommends explicit cache configuration per route. Dynamic routes should use `force-dynamic` to prevent accidental caching.

### Recommendation

Every page explicitly exports its caching intent via `dynamic`, `revalidate`, or `fetch` options. No implicit caching for authenticated routes.

---

## 23. Streaming Strategy

### Purpose

Define how pages use streaming to progressively render content.

### Engineering Rationale

Streaming enables the server to send HTML as it becomes available, improving perceived performance. The page shell renders immediately while slow data sections stream in.

### Recommended Option

**Streaming via Suspense boundaries.**

1. The page immediately renders its shell (any content that does not require async data).
2. Async-dependent sections are wrapped in `<Suspense fallback={<Skeleton />}>`.
3. Each Suspense boundary streams independently as its data resolves.
4. Large lists or grids are chunked into multiple Suspense boundaries for progressive loading.
5. The `loading.tsx` file acts as the outermost Suspense fallback for the entire page.

### Trade-offs

- _Granular streaming_ (many Suspense boundaries) provides the best perceived performance but adds complexity.
- _Single Suspense boundary_ (the `loading.tsx`) is simpler but waits for all data before showing content.

### Industry Best Practice

Next.js documentation and Vercel recommendations advocate streaming for data-heavy pages. Dashboards, profile pages, and event listings are natural candidates.

### Recommendation

Every page with independent data sections uses granular Suspense boundaries. Simple static pages (T1) do not need streaming.

---

## 24. SEO Strategy

### Purpose

Define how pages achieve search engine visibility and optimise for organic traffic.

### Engineering Rationale

SEO affects discoverability. The Page Layer controls metadata, structured data, sitemaps, and robots directives — all critical for search ranking.

### Recommended Option

**Per-page SEO package:**

1. **Metadata** — Every page exports `metadata` or `generateMetadata` with `title`, `description`, and `openGraph`.
2. **Canonical URLs** — Pages with multiple URL representations set `alternates.canonical`.
3. **Structured data** — Event and directory pages include JSON-LD schema markup via a helper component.
4. **Robots directives** — Public pages default to index/follow. Auth pages and admin pages return `noindex, nofollow`.
5. **Sitemap** — `sitemap.ts` (Stage 2) includes all public static routes. Dynamic routes use `generateSitemaps` per data source.
6. **Semantic HTML** — Pages use `<article>`, `<section>`, `<nav>`, `<aside>` elements. Features are responsible for their own semantic structure.

### Trade-offs

- _Full SEO package_ adds 5–10 lines per page but ensures every page is optimised.
- _Minimal SEO_ (title only) works for small sites but limits organic discovery as the site grows.

### Industry Best Practice

Google's SEO documentation recommends unique titles and descriptions per page, structured data for entities, and clear robots directives.

### Recommendation

Every page implements the full SEO package. Use a biome or ESLint check to verify `metadata` export exists on all public pages.

---

## 25. Accessibility Strategy

### Purpose

Define how pages ensure accessibility compliance (WCAG 2.2 AA).

### Engineering Rationale

Accessibility is not optional. The Page Layer sets the foundation by ensuring semantic structure, focus management, and ARIA attributes are correct.

### Recommended Option

**Accessibility requirements at the page level:**

1. **Skip link** — Already provided by `SkipLink` in the root layout (Stage 3). Confirmed working on all pages.
2. **Landmark regions** — Each page uses `<main>` (already in layout), `<section>` for thematic groups, `<nav>` for navigation, `<aside>` for complementary content.
3. **Heading hierarchy** — Each page has exactly one `<h1>`. Headings descend logically (`h1 → h2 → h3`). No skipped levels.
4. **Focus management** — On route change, focus moves to `#main-content` (via the skip link target).
5. **ARIA live regions** — Dynamic content updates (e.g., search results) use `aria-live="polite"`.
6. **Reduced motion** — All animations respect `prefers-reduced-motion` (via globals.css, Stage 3).

### Trade-offs

- _Strict heading hierarchy_ may feel restrictive for complex layouts but is essential for screen reader navigation.
- _Focus management_ requires explicit implementation in the layout (already Stage 3) but is transparent to pages.

### Industry Best Practice

WCAG 2.2 AA is the standard. Next.js documentation provides guidance for accessible routing and focus management.

### Recommendation

All pages follow the accessibility requirements above. Automated a11y checks (axe-core via Playwright) run in CI.

---

## 26. Analytics Strategy

### Purpose

Define how pages integrate with analytics and what data is captured.

### Engineering Rationale

Analytics require page-level context: page name, route group, user role (anonymised), and performance metrics. The Page Layer is responsible for providing this context.

### Recommended Option

**Page-level analytics via a composable context provider (Stage 15).**

1. A `PageAnalytics` component (Client Component, placed in the route group layout) reads page metadata and sends a page view event.
2. Pages opt in by exporting a `analytics` object (or adding to metadata) with structured page information: `{ pageName, pageGroup, section }`.
3. Feature-level analytics (e.g., "button clicked") are handled by features, not by the page.
4. Performance analytics (Core Web Vitals) are captured by `web-vitals` library in the root layout.

### Trade-offs

- _Page-level analytics context_ provides consistent naming and grouping but requires each page to declare its analytics metadata.
- _URL-based analytics only_ is simpler but provides less context for analysis (e.g., tab state within a page is lost).

### Industry Best Practice

Enterprise analytics implementations typically use page-level naming conventions (e.g., GA4 page titles, custom dimensions).

### Recommendation

Implement a lightweight page analytics context. Pages declare their analytics metadata. The root layout captures Core Web Vitals.

---

## 27. Security Considerations

### Purpose

Define security best practices that apply at the page level.

### Engineering Rationale

The Page Layer is the first line of defence after the proxy. Security vulnerabilities at the page level can expose data or enable attacks.

### Recommended Option

**Security checklist per page:**

1. **Auth + Authz** — Every protected page verifies authentication and authorization before rendering (Sections 13, 14).
2. **Input validation** — All `params` and `searchParams` are validated and coerced (Sections 11, 12).
3. **No sensitive data in props** — Pages do not pass sensitive data (tokens, hashes, internal IDs) to Client Components.
4. **No secrets in page code** — API keys, database URLs, and other secrets are never referenced in page files.
5. **XSS prevention** — All user-generated content is sanitised before rendering. Client Components that render HTML use a sanitisation library.
6. **CSRF** — State-changing operations go through API routes with CSRF protection (future Stage 16).

### Trade-offs

- _Strict security enforcement_ adds overhead to development but is non-negotiable for production.
- _Relaxed enforcement_ speeds up initial development but creates security debt.

### Industry Best Practice

OWASP Top 10 and Next.js security documentation provide comprehensive guidance for web application security.

### Recommendation

Apply the security checklist to every page. Automated security scanning (semgrep, CodeQL) runs in CI.

---

## 28. Maintainability Guidelines

### Purpose

Define conventions and practices that keep the Page Layer maintainable over time.

### Engineering Rationale

Pages are the most frequently modified files in an application. Without guidelines, they become cluttered, inconsistent, and hard to reason about.

### Recommended Option

**Maintainability rules:**

1. **One responsibility per import line** — No import chaining that reaches across layers (e.g., page importing from `@/components/layout/shell` instead of `@/features/profile/ProfileCard` is a violation).
2. **Feature boundary enforcement** — A page file should never directly import from `@/sections/` or `@/components/` unless explicitly justified and documented.
3. **No business logic** — Transformations, calculations, and conditional data logic belong in utility functions or data functions, not in the page.
4. **Consistent structure** — Every page follows the same structural pattern: params → auth → data → features.
5. **Comment density** — Complex page logic (chained data fetches, conditional feature rendering) includes a brief comment explaining why.
6. **File size budget** — No `page.tsx` exceeds 100 lines. If it does, extract a feature, extract a data function, or refactor.

### Trade-offs

- _100-line limit_ forces extraction early but prevents page monoliths.
- _No limit_ is more flexible but allows gradual bloat.

### Industry Best Practice

File size budgets and consistent structural patterns are standard in maintainable codebases. ESLint's `max-lines` and `max-statements` rules can enforce budgets.

### Recommendation

Set a 100-line budget for `page.tsx`. Use ESLint or a custom script to flag violations. Extract features and data functions liberally.

---

## 29. Future Expansion Strategy

### Purpose

Design the Page Layer so that future stages (features, sections, components) integrate without structural changes.

### Engineering Rationale

The Page Layer precedes the Feature Layer (Stage 5), Section Layer (Stage 6), and Component Layer (Stage 9). The architecture must anticipate these layers without coupling to them prematurely.

### Recommended Option

**Stable page interface for future layers:**

1. **Feature modules** — Pages import from `@/features/<name>`. When Stage 5 creates feature modules, existing pages simply update their import paths — the composition pattern does not change.
2. **Section modules** — Features import from `@/sections/`. When Stage 6 creates section modules, features update their import paths.
3. **Component modules** — Sections import from `@/components/`. When Stage 9 creates shared components, sections update their import paths.
4. **Type modules** — All data transfer objects (DTOs) are typed in `@/types/`. Pages and features share the same types.
5. **Data functions** — Pages call functions from `@/lib/data/`. These functions are stable regardless of how data is fetched internally.

The key insight: pages only depend on `@/types/` and `@/lib/data/` for data, and on `@/features/` for UI. As long as these interfaces remain stable, pages do not need to change when lower layers are refactored.

### Trade-offs

- _Stable interfaces_ require up-front agreement on feature module shapes and data function signatures.
- _Evolving interfaces_ allow more flexibility but cause cascading changes when lower layers refactor.

### Industry Best Practice

Dependency inversion and stable interfaces are foundational to clean architecture and maintainable codebases.

### Recommendation

Define the data function interface (`@/lib/data/`) and feature component interface (`@/features/`) early. Protect these interfaces from downstream refactoring.

---

## 30. Page Best Practices

### Purpose

Summarise all guidelines into a concise, actionable checklist.

### Engineering Rationale

A single best-practices document is more useful than 29 scattered sections. This checklist serves as the canonical reference for page development and review.

### Recommended Option

**The Page Layer checklist:**

- [ ] **Thin page** — No business logic, no database calls, no large JSX trees.
- [ ] **Server Component** — No `"use client"` in `page.tsx`.
- [ ] **Access control** — Auth and authz verified at the page boundary.
- [ ] **Metadata** — Static or dynamic metadata exported.
- [ ] **Async params** — Params awaited and validated.
- [ ] **Async searchParams** — SearchParams awaited, validated, and coerced.
- [ ] **Parallel data fetching** — Independent fetches use `Promise.all`.
- [ ] **Feature composition** — Only feature components imported from `@/features/`.
- [ ] **Suspense boundaries** — Independent sections wrapped for streaming.
- [ ] **Caching intent** — `dynamic`, `revalidate`, or `fetch` cache options explicitly set.
- [ ] **Rendering tier** — Classified as T1 (static), T2 (ISR), or T3 (dynamic).
- [ ] **SEO** — Unique title, description, Open Graph tags.
- [ ] **Semantic HTML** — Heading hierarchy, landmarks, skip link target.
- [ ] **Analytics metadata** — Page name and group declared.
- [ ] **File budget** — Under 100 lines. If not, extract.

### Trade-offs

- _Full checklist_ adds review time but guarantees consistency.
- _Abbreviated checklist_ is faster but misses edge cases.

### Industry Best Practice

Checklists are widely adopted in engineering teams (surgery, aviation, software) to prevent oversight. A page checklist is no different.

### Recommendation

Apply the 15-point checklist to every new page. Include it in the PR template. Automate items that can be verified by linting or CI.

---

## Architecture Summary

```
  URL ──→ proxy.ts (auth redirect)
            │
            ▼
        Route Group Layout (Stage 3)
            │
            ▼
       page.tsx ──→ params/searchParams validation
            │
            ▼
       getCurrentUser() (auth + role)
            │
            ▼
       Parallel data fetches (Promise.all)
            │
            ▼
       Feature composition with Suspense boundaries
            │
            ▼
       Streaming HTML response
```

### Data flow:

1. URL hits the proxy — coarse auth check.
2. Route matched — layout renders shell.
3. Page function runs — fine-grained auth + data orchestration.
4. Features receive data — features compose sections, sections compose components.
5. HTML streams to client as Suspense boundaries resolve.
6. Client hydrates — interactivity enabled.

### Dependency graph:

```
Page Layer ──────→ @/config/       (navigation, route classification)
Page Layer ──────→ @/lib/data/     (data fetches)
Page Layer ──────→ @/lib/route-params/ (parameter validation)
Page Layer ──────→ @/features/     (feature components)
Page Layer ──────→ @/types/        (DTOs, parameter schemas)
Page Layer ──────→ @/app/(group)/layout.tsx (route group layout)
```

The Page Layer does NOT depend on:

- `@/sections/` (Section Layer, Stage 6) — features compose sections internally.
- `@/components/` (Component Layer, Stage 9) — features compose components through sections.
- `@/stores/` (State Layer, Stage 15) — state is managed by features, not pages.
