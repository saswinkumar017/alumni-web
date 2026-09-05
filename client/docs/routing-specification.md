# Stage 2 — Routing Layer Specification

## 1. Routing Philosophy

**Purpose** — Define the foundational principles that govern every routing decision in the application.

**Engineering Rationale** — A consistent philosophy prevents ad-hoc patterns from accumulating as the application scales. Every developer should be able to predict where a route lives without consulting documentation. The philosophy must align with the existing project foundations: layered architecture, feature orientation, business domain driven, and RBAC. The App Router's file-system-based routing makes this especially important because the directory structure _is_ the route structure — any mistake propagates directly to the URL surface.

**Recommended Option** — **Domain-Driven Route Separation.** Partition the routing tree into three discrete domains — Public, Alumni, and Admin — each isolated via route groups with distinct layouts, loading states, error boundaries, and authorization requirements. The URL namespace must directly reflect the domain boundary (`/` for public, `/alumni/*` for authenticated alumni, `/admin/*` for administrators). Authentication flows occupy a fourth transient domain (`/auth/*`) that bridges public and private.

**Trade-offs** — Slight duplication of the route group wrapping (`(alumni)/alumni/...` → URL `/alumni/...`) is an accepted cost. The alternative — a single flat route tree with conditionally rendered layouts — becomes unmaintainable as new domains are added (e.g., a future `/api` or `/careers` surface).

**Industry Best Practice** — The Next.js App Router documentation and Vercel's reference architectures recommend route groups to isolate layouts and authorization boundaries. Major production Next.js applications (Vercel, Sanity, Linear) use domain-based route separation.

**Recommendation** — Adopt Domain-Driven Route Separation. All future domain additions must create a new route group rather than nesting into an existing one.

---

## 2. Routing Architecture

**Purpose** — Define how routes are organized in the file system and how they relate to the URL structure, layout hierarchy, and authorization boundaries.

**Engineering Rationale** — The App Router uses a file-system-as-route-table model. The directory tree must therefore encode three concerns with equal fidelity: (1) the URL path, (2) the layout nesting, and (3) the authorization domain. A route group per domain achieves this naturally because route groups contribute neither to the URL nor to the layout inheritance of sibling groups, but they do carry their own `layout.tsx`.

**Recommended Option** — Five route groups in `src/app/`:

| Route Group | URL Prefix  | Authorization             | Layout             |
| ----------- | ----------- | ------------------------- | ------------------ |
| `(public)`  | `/`         | None (public)             | Header + Footer    |
| `(auth)`    | `/auth/*`   | Redirect if authenticated | Centered (minimal) |
| `(alumni)`  | `/alumni/*` | JWT + alumni role         | Sidebar + Topbar   |
| `(admin)`   | `/admin/*`  | JWT + admin role          | Sidebar + Topbar   |
| `(legal)`   | `/legal/*`  | None (public)             | Minimal footer     |

The route groups `(alumni)` and `(admin)` each contain a single top-level segment matching their URL prefix (`alumni/`, `admin/`). This creates the correct URL while allowing group-specific layouts.

**Trade-offs** — The `(alumni)/alumni/` and `(admin)/admin/` nesting pattern duplicates the segment name between the group and the folder. This is the canonical App Router pattern for authenticated route groups and is well understood by the ecosystem. Abandoning it would require either (a) flat files with conditional layouts or (b) URL rewriting in middleware — both inferior for maintainability and debug-ability.

**Industry Best Practice** — This exact pattern is used by Vercel's own marketing site, Sanity CMS, and is the recommended structure in the Next.js documentation for applications with multiple authenticated domains.

**Recommendation** — Adopt the five-route-group architecture. Do not add a sixth group unless it introduces a fundamentally new layout or authorization model.

---

## 3. Route Classification

**Purpose** — Categorize every route by access level, rendering strategy, and SEO impact to make architectural decisions consistent across the codebase.

**Engineering Rationale** — Not all routes are equal. Public routes need SEO metadata and server rendering. Auth routes need redirect logic to prevent authenticated users from seeing login forms. Alumni routes need session validation. Admin routes need elevated role checks. A classification system makes the middleware, layout, and loading strategies self-evident for each route.

**Recommended Option** — Six classifications:

| Classification     | Access                    | Rendering | SEO            | Cache Strategy | Example                 |
| ------------------ | ------------------------- | --------- | -------------- | -------------- | ----------------------- |
| `STATIC_PUBLIC`    | None                      | SSG       | Critical       | `force-static` | `/`, `/about`, `/faq`   |
| `DYNAMIC_PUBLIC`   | None                      | SSR/ISR   | High           | `revalidate`   | `/directory`, `/events` |
| `STATIC_LEGAL`     | None                      | SSG       | Low            | `force-static` | `/legal/privacy`        |
| `TRANSIENT_AUTH`   | None (redirect if authed) | SSR       | None (noindex) | No cache       | `/auth/login`           |
| `PROTECTED_ALUMNI` | Alumni                    | SSR/ISR   | None (noindex) | Auth-dependent | `/alumni/dashboard`     |
| `PROTECTED_ADMIN`  | Admin                     | SSR       | None (noindex) | No cache       | `/admin/dashboard`      |

**Trade-offs** — Not every route fits perfectly (e.g., a public event detail page could be `DYNAMIC_PUBLIC` or `STATIC_PUBLIC` with ISR). The classification is a guiding framework, not a rigid taxonomy. Route designers should use judgment for edge cases and document exceptions.

**Industry Best Practice** — Google's Technical SEO guidelines distinguish between crawlable (public), non-crawlable (auth-gated), and noindex (auth/admin) pages. Vercel's data fetching patterns distinguish static, dynamic, and ISR at the route level.

**Recommendation** — Classify every new route at design time. Document the classification in the route's metadata export. The middleware should use the classification to determine cache headers and redirect behavior.

---

## 4. Public Route Strategy

**Purpose** — Define how public-facing routes are structured, rendered, and optimized for discoverability.

**Engineering Rationale** — Public routes are the primary SEO surface. They must be crawlable, fast, and semantically structured. They share a common layout (header + footer) and require no authentication. The strategy must also accommodate dynamic public content (directory listings, event calendars) without sacrificing performance.

**Recommended Option** — All public routes live under the `(public)` route group at the root level. This keeps URLs clean (`/about`, `/contact`, `/faq`, `/directory`). Static content pages (`about`, `faq`, `contact`) are SSG with static metadata. Dynamic content pages (`directory`, `events`) use ISR with appropriate revalidation periods. The directory uses search params for filtering rather than URL segments (`/directory?batch=2020&department=cs`). Public sub-resources follow RESTful conventions (`/events/[id]`, `/directory/[id]`).

**Trade-offs** — Using search params for directory filtering (rather than path segments like `/directory/batch/2020`) sacrifices "shareable filter state" in the URL but avoids deep nesting and keeps URLs readable. SEO impact is negligible because the canonical page is the unfiltered listing.

**Industry Best Practice** — RESTful conventions for resource URLs (`/events/[id]`), search params for filtering and pagination (`/directory?page=2`), static generation for content pages, ISR for data-driven pages.

**Recommendation** — Implement all public routes under `(public)`. No public route should require authentication, and no public route should live outside the `(public)` route group.

---

## 5. Private Route Strategy

**Purpose** — Define how authenticated routes are protected, organized, and rendered.

**Engineering Rationale** — Private routes constitute the largest and most complex part of the application. They must enforce authentication at the middleware layer before any JavaScript loads, provide consistent navigation (sidebar + topbar), and support nested sub-navigation. They must also be invisible to search engines and un-crawlable.

**Recommended Option** — All private routes live under `(alumni)/alumni/` or `(admin)/admin/`. The middleware enforces authentication before any private route group is entered. Each private route group has its own root layout providing sidebar navigation, a top bar with user menu, and a content outlet. Within each group, routes are organized by business domain feature, not by HTTP method or UI component type. No private route exports static metadata; metadata is generated dynamically based on the authenticated user's context.

**Trade-offs** — The sidebar/topbar layout means every page in the portal renders the navigation shell. This is by design — consistent navigation is a UX requirement for authenticated portals. If performance becomes a concern, the sidebar can be wrapped in a `<Suspense>` boundary with a skeleton fallback.

**Industry Best Practice** — Authenticated portals universally use a persistent navigation frame with a content outlet. GitHub, Linear, and Vercel all follow this pattern. App Router route groups are the idiomatic way to implement this in Next.js.

**Recommendation** — Private routes exist only within their respective route groups. No private route URL should be reachable without a valid session, and no private route should be indexable by search engines (ensure `robots.txt` disallows `/alumni/` and `/admin/`).

---

## 6. Alumni Portal Route Organization

**Purpose** — Define the URL structure and layout strategy for the authenticated alumni domain.

**Engineering Rationale** — The alumni portal is the primary user-facing application after authentication. It must organize features by business domain (events, jobs, networking, profile) while remaining extensible. Each domain should be a parallel track that can be developed independently.

**Recommended Option** — Alumni portal routes follow a consistent pattern: `/alumni/{domain}/{resource?}/{action?}`.

| Route                     | Domain   | Purpose                                                          |
| ------------------------- | -------- | ---------------------------------------------------------------- |
| `/alumni`                 | —        | Redirect to `/alumni/dashboard`                                  |
| `/alumni/dashboard`       | Core     | Summary view (upcoming events, recent activity, new connections) |
| `/alumni/profile`         | Profile  | Own profile (edit mode)                                          |
| `/alumni/networking`      | Network  | Alumni directory (connections, search)                           |
| `/alumni/networking/[id]` | Network  | Public profile card (within authed context)                      |
| `/alumni/events`          | Events   | Event listings (upcoming, past, registered)                      |
| `/alumni/events/[id]`     | Events   | Event detail, registration                                       |
| `/alumni/jobs`            | Jobs     | Job board listing                                                |
| `/alumni/jobs/[id]`       | Jobs     | Job detail, apply                                                |
| `/alumni/gallery`         | Gallery  | Photo gallery                                                    |
| `/alumni/messages`        | Messages | Inbox                                                            |
| `/alumni/settings`        | Settings | Account, notification, privacy preferences                       |

Each domain is a top-level segment under `/alumni/`. Domains with sub-resources use `[id]` for individual items. No domain exceeds two levels of nesting (e.g., `/alumni/jobs/[id]` is acceptable; `/alumni/jobs/[id]/applications/[aid]` is not — that belongs in a separate domain or modal).

**Trade-offs** — Flat domain organization (one level under `/alumni/`) means many top-level segments. This is acceptable because the sidebar can accommodate the full list, and users benefit from predictable URLs. A nested domain hierarchy (`/alumni/network/connections`) would make URLs less guessable.

**Industry Best Practice** — Flat, noun-based domain organization is the standard for SaaS applications (Linear, Notion, GitHub all use a single level of domain names under their authenticated routes).

**Recommendation** — Organize alumni domains as flat top-level segments under `/alumni/`. Add new domains by adding a new top-level folder. Do not nest domains more than one level deep.

---

## 7. Admin Portal Route Organization

**Purpose** — Define the URL structure and layout strategy for the administration domain.

**Engineering Rationale** — The admin portal is a management interface. Its route structure should mirror the resources administrators manage. Each managed resource type becomes a top-level segment with CRUD sub-pages. Admin routes also include system-level functions (settings, reports, content management) that don't map to a single resource.

**Recommended Option** — Admin routes follow: `/admin/{resource}[/{id}][/{action}]`.

| Route                  | Resource  | Purpose                                               |
| ---------------------- | --------- | ----------------------------------------------------- |
| `/admin`               | —         | Redirect to `/admin/dashboard`                        |
| `/admin/dashboard`     | Core      | System-wide metrics, recent activity, pending actions |
| `/admin/alumni`        | Alumni    | Alumni record management (list, search, filter)       |
| `/admin/alumni/[id]`   | Alumni    | Individual record details and editing                 |
| `/admin/events`        | Events    | Event CRUD                                            |
| `/admin/events/[id]`   | Events    | Event editing                                         |
| `/admin/events/create` | Events    | Event creation wizard                                 |
| `/admin/users`         | Users     | System user management                                |
| `/admin/users/[id]`    | Users     | User detail and role management                       |
| `/admin/content`       | Content   | CMS for public site pages                             |
| `/admin/announcements` | Comms     | Send broadcast announcements                          |
| `/admin/reports`       | Analytics | System usage and engagement reports                   |
| `/admin/settings`      | System    | Application configuration                             |
| `/admin/audit-log`     | System    | Audit trail of admin actions                          |

The resource-based pattern ensures that any new managed entity follows the same structure (`/admin/{resource}`, `/admin/{resource}/[id]`, `/admin/{resource}/create`).

**Trade-offs** — The `/admin/alumni/[id]` route overlaps semantically with `/alumni/networking/[id]`. This is by design — they serve different purposes (networking vs. management) and have different layouts, permissions, and capabilities. The URL namespace difference (`/admin/` vs. `/alumni/`) disambiguates them.

**Industry Best Practice** — Admin portals typically organize by managed resource type. Shopify admin, Stripe dashboard, and Vercel dashboard all follow this pattern.

**Recommendation** — Admin routes mirror the managed resource model. Every resource gets a list view, a detail view, and (where applicable) a create view, all under `/admin/{resource}/`.

---

## 8. Authentication Routing

**Purpose** — Define the URL structure, redirect behavior, and layout strategy for authentication flows.

**Engineering Rationale** — Authentication flows are transient: users enter them to authenticate and leave upon success. They must be isolated from both the public site and the authenticated portals. The layout should be minimal (no header/footer/sidebar) to focus attention on the auth form. Redirect logic must prevent authenticated users from seeing auth pages and must route users to the correct portal upon completion.

**Recommended Option** — All auth routes live under `(auth)/auth/`:

| Route                   | Purpose                                    |
| ----------------------- | ------------------------------------------ |
| `/auth/login`           | Email/password sign-in, OAuth options      |
| `/auth/register`        | New alumni registration                    |
| `/auth/verify`          | Email verification (token in search param) |
| `/auth/forgot-password` | Password reset request                     |
| `/auth/reset-password`  | Password reset (token in search param)     |

The `(auth)` route group has its own minimal layout (centered card, app logo, no navigation). Middleware redirects authenticated users away from `/auth/*` to their respective portal home (`/alumni/dashboard` or `/admin/dashboard`). Upon successful authentication, the auth service returns the user's role and the client/navigation code redirects accordingly.

OAuth callbacks (e.g., `/auth/callback/google`) are handled by a server action or API route — no page component needed.

**Trade-offs** — Placing auth routes in a separate route group adds a folder but ensures the layout is fully isolated. Alternative approaches (inline conditional layouts) would be more fragile.

**Industry Best Practice** — SaaS applications universally isolate auth flows into a minimal layout. Auth0, Clerk, and NextAuth.js all recommend a separate auth layout.

**Recommendation** — All auth flows exist under `/auth/`. Use the `(auth)` route group for the isolated layout. Post-authentication redirect is determined by the authenticated user's role.

---

## 9. Authorization Strategy

**Purpose** — Define the mechanism for enforcing role-based access control at the routing level, independent of feature-level permission checks.

**Engineering Rationale** — RBAC at the routing level prevents unauthorized users from accessing entire sections of the application. The routing layer should enforce two role levels: `alumni` and `admin`. The middleware is the enforcement point for route-level authorization; feature-level granularity (e.g., "can edit events" vs. "can view events") belongs in the feature layer, not the routing layer.

**Recommended Option** — Two-tier authorization:

1. **Route group level (middleware):** The JWT token carries a `role` claim. Middleware checks this claim for all routes under `/alumni/*` and `/admin/*`. Access to `/admin/*` requires `role === "admin"`. Access to `/alumni/*` requires `role === "alumni" || role === "admin"`.

2. **Layout level (server component):** The layout for each route group performs an additional verification by reading the session. This is a defense-in-depth measure — if middleware were somehow bypassed, the layout is a second enforcement point.

Feature-level authorization (e.g., "admin can approve profiles" vs. "admin can only view") is handled by the feature layer, not the routing layer. The routing layer's responsibility ends at "can this user access this URL prefix?"

**Trade-offs** — Two-tier enforcement adds minimal code but ensures defense in depth. Feature-level checks are intentionally excluded from the routing layer to avoid coupling route structure to granular permissions.

**Industry Best Practice** — Middleware-based route protection with JWT role claims is the standard approach for Next.js applications. Vercel's documentation recommends this pattern.

**Recommendation** — Enforce role-based access at the route group level in middleware. Do not add feature-level permission logic to the routing layer.

---

## 10. Middleware Strategy

**Purpose** — Define the authorization enforcement point, its file location, the routes it protects, and its redirect/cache behavior.

**Engineering Rationale** — Next.js 16 moves middleware from `middleware.ts` to `proxy.ts` at the project root. This is a breaking change from Next.js 15. Middleware runs on every request before the route handler. It must be fast, avoid external API calls (except perhaps cache lookups), and never read from the file system. Its only responsibilities are route protection, redirect, and cache-header management.

**Recommended Option** — Single `proxy.ts` at project root with the following matchers and behaviors:

- **Matcher:** All routes except `/_next/static`, `/_next/image`, `/favicon.ico`, `/public/*`
- **Protected route patterns:** `/alumni/:path*`, `/admin/:path*`, `/auth/:path*`
- **For unauthenticated requests to `/alumni/*` or `/admin/*`:** Redirect to `/auth/login` with a `?redirect=` query param preserving the original URL
- **For authenticated requests to `/auth/*`:** Redirect to `/alumni/dashboard` (or `/admin/dashboard` based on role)
- **Role check for `/admin/*`:** If the authenticated user's role is not `admin`, redirect to `/alumni/dashboard` with a 307
- **Public routes:** Pass through without any check
- **Cache headers:** Set `X-Robots-Tag: noindex` for `/alumni/*` and `/admin/*`; allow caching for public routes

**Trade-offs** — The middleware must decode the JWT on every request. Using an HTTP-only cookie for the token is strongly recommended. Token validation should be lightweight (signature verification only, no database lookup).

**Industry Best Practice** — Single-file middleware with route-specific logic is the Next.js 16 recommended pattern. The `proxy.ts` file replaces the earlier `middleware.ts` convention.

**Recommendation** — Implement `proxy.ts` with route-pattern-based protection. Keep the middleware stateless and fast. Never make database calls in middleware.

---

## 11. Route Protection

**Purpose** — Define the defense-in-depth layers that protect private routes, from the network edge to the component tree.

**Engineering Rationale** — A single enforcement point is a single point of failure. Multiple overlapping layers ensure that even if one layer is compromised, others remain. The routing layer participates in this by enforcing access at the middleware, layout, and — where necessary — the page component level.

**Recommended Option** — Three protection layers:

1. **Edge (Middleware/`proxy.ts`):** JWT verification, role check, route-level redirect. Catches unauthorized access before any page JavaScript loads.

2. **Layout (Server Component):** Session re-validation in the root layout of each private route group. Reads the session cookie and verifies the user exists and the session is still valid. This catches edge cases where middleware was bypassed or the token is stale.

3. **Component (Optional):** For pages within a nominally "alumni" route group that contain admin-specific functionality, a `withRole` utility wraps the admin section. This is rare and should be explicitly approved during route design.

**Trade-offs** — Three layers are sufficient for a routing-layer specification. Adding more (e.g., API route protection for server actions) belongs in the API/data layer specification, not here.

**Industry Best Practice** — Defense in depth is a security fundamental. OWASP recommends multiple enforcement layers. Next.js applications commonly implement middleware + layout + component-level protection.

**Recommendation** — Implement middleware and layout-level protection for all private routes. Component-level protection only when a single page spans multiple authorization levels.

---

## 12. Route Groups

**Purpose** — Define the use and organization of App Router route groups to separate layouts, loading states, and error boundaries.

**Engineering Rationale** — Route groups are a structural mechanism, not a URL mechanism. They enable different layouts for different URL prefixes without affecting the URL. Misusing route groups (e.g., creating one per feature) adds complexity without benefit. Route groups should only exist when they introduce a new layout, a new loading state, or a new error boundary.

**Recommended Option** — Five route groups as defined in Section 2. No additional route groups. Specifically:

- Do not create route groups for individual features (no `(events)`, `(jobs)`, etc.)
- Do not create route groups for HTTP verbs
- Do not create route groups for mobile vs. desktop variants

Route groups are purely organizational for layout/error/loading boundaries. Feature isolation is achieved through folder structure within the route group, not through additional route groups.

**Trade-offs** — The five-group structure is opinionated and may feel restrictive. A future `(careers)` group for public job listings could be justified if careers need a distinct layout. Each additional route group adds cognitive overhead and should be justified.

**Industry Best Practice** — Route groups should be limited to layout/authorization boundaries. Next.js documentation warns against overusing route groups as logical folder organizers.

**Recommendation** — Enforce a strict limit of five route groups. Any proposed addition requires an architecture review.

---

## 13. Nested Layout Strategy

**Purpose** — Define the layout nesting hierarchy and the responsibility of each layout in the tree.

**Engineering Rationale** — The App Router supports unlimited layout nesting. Each layout wraps its children and persists across navigations within its segment. This makes layouts the ideal mechanism for persistent UI (navigation, headers, footers). The layout hierarchy should map cleanly to the UI chrome hierarchy.

**Recommended Option** — The layout tree differs by route group:

**Public:**

```
RootLayout (html, body, fonts, providers)
└── PublicLayout (header, main, footer)
```

**Auth:**

```
RootLayout (html, body, fonts, providers)
└── AuthLayout (centered card container, logo)
```

**Alumni:**

```
RootLayout (html, body, fonts, providers)
└── AlumniLayout (sidebar, topbar, content outlet)
    └── [Domain Layouts] (optional, per-domain sub-navigation)
```

**Admin:**

```
RootLayout (html, body, fonts, providers)
└── AdminLayout (sidebar, topbar, content outlet)
    └── [Resource Layouts] (optional, per-resource sub-navigation)
```

Domain-level layouts (e.g., `/alumni/events/layout.tsx`) are optional and used only when a domain needs its own sub-navigation or data-fetching boundary. Most domains do not need their own layout.

**Trade-offs** — The root layout is shared across all route groups. This means providers (theme, i18n, query client) initialized in the root layout are available everywhere, which is desirable. However, the root layout cannot use `notFound()` or `redirect()` conditionally — those belong in child layouts.

**Industry Best Practice** — Shallow nesting (3 levels max) is the recommended depth for Next.js applications. Deeper nesting causes unnecessary re-renders and complexity.

**Recommendation** — Nest layouts no more than three levels deep. Most route groups need only one group-level layout. Domain-level layouts should be the exception, not the default.

---

## 14. Dynamic Routes

**Purpose** — Define the use of dynamic route segments (`[param]`) and their naming conventions.

**Engineering Rationale** — Dynamic segments enable resource-level URLs without creating individual files. Consistent naming of dynamic segments is essential because the parameter name becomes the variable name in the page component's props. The name must be semantic, unambiguous, and predictable.

**Recommended Option** — Use `[id]` for entity identifiers (numeric or UUID primary keys) and `[slug]` for human-readable identifiers derived from entity names. Never use `[param]`, `[key]`, or other generic names.

| Context                        | Dynamic Segment | Example                                      |
| ------------------------------ | --------------- | -------------------------------------------- |
| Entity detail (PK-based)       | `[id]`          | `/events/[id]` → `/events/42`                |
| Entity detail (slug-based)     | `[slug]`        | `/events/[slug]` → `/events/homecoming-2026` |
| User profile                   | `[id]`          | `/networking/[id]` → `/networking/42`        |
| Catch-all for nested resources | `[...slug]`     | For document-like content (rare)             |

**Trade-offs** — Using `[id]` for primary keys means users see numeric or UUID URLs. This is acceptable for authenticated pages (where SEO is irrelevant) and for public pages where the entity ID is the canonical identifier. Where SEO matters for public resources (e.g., event pages), use `[slug]` with the slug derived from the title.

**Industry Best Practice** — `[id]` for database keys, `[slug]` for SEO-friendly identifiers. This is the universal convention across Next.js applications and documentation.

**Recommendation** — Use `[id]` for all authenticated resource URLs. Use `[slug]` for public resource URLs where SEO matters. Never use generic parameter names.

---

## 15. URL Naming Convention

**Purpose** — Establish a single, unambiguous standard for naming URL segments across the entire application.

**Engineering Rationale** — URL naming inconsistency is one of the most common sources of technical debt in large applications. Every developer must follow the same convention without having to think about it. The convention must be documented and enforced in code review.

**Recommended Option** — **RESTful lowercase kebab-case.** All URL segments must:

- Be lowercase (no `CamelCase`, no `camelCase`)
- Use hyphens for multi-word segments (`event-details`, not `eventDetails` or `event_details`)
- Use nouns, never verbs (`/events`, not `/view-events`)
- Use singular nouns for resource detail (`/events/[id]`, not `/events/[id]`)
- Use plural nouns for resource collections (`/events`, not `/event`)
- Never use file extensions (no `.html`, no `.php`)

| Correct            | Incorrect                                                  |
| ------------------ | ---------------------------------------------------------- |
| `/about`           | `/About`                                                   |
| `/faq`             | `/FAQ` (avoid acronyms unless they are the canonical name) |
| `/forgot-password` | `/forgotPassword`                                          |
| `/audit-log`       | `/audit_log`                                               |

**Trade-offs** — Kebab-case is slightly longer than camelCase for multi-word segments. This is an acceptable cost for readability and SEO.

**Industry Best Practice** — Google's URL Structure Guidelines recommend lowercase, hyphen-separated, descriptive URLs. RESTful API conventions recommend plural nouns for collections.

**Recommendation** — Enforce lowercase kebab-case for all URL segments. Reject any route design that violates this convention at design review.

---

## 16. Route Naming Rules

**Purpose** — Define hard rules for the directory and file naming within `src/app/` that govern every developer's decisions.

**Engineering Rationale** — The App Router uses special file conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.tsx`). While these are enforced by the framework, the naming of non-special folders (route segments) within groups must be governed by project convention.

**Recommended Option** — Hard rules:

1. **Route segment folders:** Always `kebab-case`. Single-word folders are preferred over multi-word if the business domain name is a single word.
2. **Dynamic segment folders:** Only `[id]` and `[slug]` as defined in Section 14.
3. **Route group folders:** Always `(lowercase-single-word)`. The group name matches the URL prefix it contains (e.g., `(public)` for routes at `/`, `(alumni)` for routes at `/alumni/*`).
4. **No folder nesting beyond 3 levels from the route group root.** A route like `/admin/alumni/[id]/settings` would be 4 levels deep — this is too deep. Flatten to `/admin/alumni/[id]` with settings in a tab or modal.
5. **No parallel routes or intercepting routes** unless explicitly justified in an architecture review. These are advanced patterns that introduce significant complexity.
6. **No `route.ts` (API routes) inside route groups.** API routes belong in a separate `src/app/api/` directory at the root level (no route group).

**Trade-offs** — The 3-level depth limit may force some UI patterns into tabs or modals instead of sub-pages. This is intentional — deep nesting degrades UX and navigability.

**Industry Best Practice** — Next.js documentation and Vercel's production applications follow similar conventions. The 3-level depth limit is a project-specific rule but aligns with UX research on navigation depth.

**Recommendation** — Codify these rules in the project's `AGENTS.md` and enforce them in code review.

---

## 17. Navigation Strategy

**Purpose** — Define how navigation is structured, rendered, and activated across route groups.

**Engineering Rationale** — Navigation is the primary user-facing interface to the routing layer. It must be consistent, predictable, and accessible. The implementation of nav components belongs in the component layer, but the routing layer must define which navigation primitives exist, where they render, and how they determine active state.

**Recommended Option** — Three navigation contexts:

1. **Public navigation** — Horizontal top nav in the public layout. Links to `/about`, `/directory`, `/events`, `/faq`, `/contact`. Sign-in button links to `/auth/login`. Active state is determined by `pathname.startsWith()`.

2. **Alumni navigation** — Vertical sidebar in the alumni layout. Links to all alumni domains. User menu in the top bar (profile, settings, sign out). Active state is determined by the current domain segment (`pathname.split("/")[1]`).

3. **Admin navigation** — Vertical sidebar in the admin layout. Links to all admin resources. User menu in the top bar. Active state follows the same pattern as alumni.

Navigation items are defined as a configuration array indexed by route group, not hard-coded in the component. This makes it straightforward to add or reorder nav items without touching layout code.

**Trade-offs** — A declarative navigation config is slightly more complex than hard-coding links but pays for itself as the application scales.

**Industry Best Practice** — Declarative navigation configuration is standard across enterprise Next.js applications. Vercel's website, Sanity CMS, and Linear all use this pattern.

**Recommendation** — Define navigation as a configuration, indexed by route group. Implement active-state detection at the route segment level, not the full path level.

---

## 18. Breadcrumb Strategy

**Purpose** — Define when breadcrumbs appear, how they are generated, and what URL segments they contain.

**Engineering Rationale** — Breadcrumbs provide secondary navigation for deep routes, improve wayfinding, and enhance accessibility. They are most valuable in the authenticated portals where users navigate between related resources. On public pages, breadcrumbs are rarely needed due to flat URL structures.

**Recommended Option** — Breadcrumbs appear only in the alumni and admin portals (within the content area, below the top bar). They are generated from the URL path segments:

- Each URL segment maps to a breadcrumb label.
- The mapping is defined in a configuration object keyed by segment name: `/alumni/events/[id]` → `[Home, Events, {event-title}]`.
- Dynamic segments (`[id]`) use a function to resolve the label from the entity data.
- The last breadcrumb is always plain text (not a link), representing the current page.
- The first breadcrumb links to the portal home (`/alumni/dashboard` or `/admin/dashboard`).
- Breadcrumbs use JSON-LD structured data for SEO on public pages (e.g., `/events/[slug]`).

**Trade-offs** — Resolving dynamic segment labels requires data fetching. This is acceptable because breadcrumbs are only shown on authenticated pages where data is already being fetched for the page content. The breadcrumb label can share the same data.

**Industry Best Practice** — Breadcrumbs on SaaS platforms universally follow the "provide context, not navigation" principle. Google's BreadcrumbList structured data is the standard for SEO breadcrumbs.

**Recommendation** — Render breadcrumbs on all authenticated pages deeper than one level from the portal root. Generate labels from a segment-to-label configuration, with a resolver function for dynamic segments.

---

## 19. Loading Strategy

**Purpose** — Define how loading states (Suspense boundaries and `loading.tsx`) are placed in the route hierarchy.

**Engineering Rationale** — The App Router supports `loading.tsx` at every route segment level, which automatically wraps the page in a `<Suspense>` boundary. Strategic placement of loading boundaries ensures that users see meaningful loading indicators without jarring layout shifts. Overusing loading boundaries causes unnecessary UI fragmentation.

**Recommended Option** — Place `loading.tsx` at three levels:

1. **Route group root layout** (`(public)/loading.tsx`, `(alumni)/loading.tsx`, `(admin)/loading.tsx`): A skeleton shell matching the group's layout. Shows a content placeholder within the layout frame. This is the boundary of last resort — if no descendant loading file exists, this one is used.

2. **Domain/Resource root** (e.g., `/alumni/events/loading.tsx`, `/admin/alumni/loading.tsx`): A tailored skeleton matching the typical content shape of that domain (table skeleton for list views, card skeleton for grid views).

3. **Individual page** (e.g., `/alumni/events/[id]/loading.tsx`): Only for pages with slow data dependencies. Most pages should rely on the domain-level loading boundary.

Do not add `loading.tsx` to every folder. The rule is: add a loading boundary only when the data dependency for that segment is observably slower than 200ms under typical conditions.

**Trade-offs** — Fewer loading boundaries mean users sometimes see a blank content area during navigation. This is preferable to a "skeleton flash" where the loading indicator appears and disappears in milliseconds (causing visual noise).

**Industry Best Practice** — The React team and Vercel's documentation recommend adding Suspense boundaries strategically, not exhaustively. The "200ms rule" is widely cited in UX research on perceived performance.

**Recommendation** — Add `loading.tsx` at the route group root and at key domain roots. Add page-level loading only when data dependencies are slow. Measure before adding.

---

## 20. Error Route Strategy

**Purpose** — Define how error pages (`error.tsx`, `not-found.tsx`, global `error.tsx`) are scoped and rendered.

**Engineering Rationale** — Different route groups need different error aesthetics. A public 404 should match the public site design. An admin 404 should match the admin portal design. Global errors (500) should be consistent but branded. The App Router's error boundary hierarchy makes this natural — each route group can have its own `error.tsx` and `not-found.tsx`.

**Recommended Option** — Error boundaries at three scopes:

1. **Global (`src/app/error.tsx`):** Generic "Something went wrong" page. Used when an error propagates past the route group boundary. No navigation (layout may not load). Minimal branding.

2. **Per-route-group (`src/app/(public)/error.tsx`, etc.):** Route-group-specific error page matching the group's layout. Public errors show the public header/footer. Alumni errors show the sidebar. These cover the most common error scenarios.

3. **Per-domain (optional):** Domain-specific error pages (e.g., `/alumni/events/error.tsx`). Used when a domain needs error handling that differs from the group default (e.g., "Event not found" vs. generic error).

The 404 strategy follows the same scoping. Each route group defines its own `not-found.tsx`. Public 404 redirects to a friendly `/404` page (a static page, not an error boundary — better for SEO). Authenticated 404s render inline in the portal layout.

**Trade-offs** — Multiple `error.tsx` files means some duplication of error UI. This is acceptable for brand consistency across different app contexts.

**Industry Best Practice** — Route-group-scoped error boundaries are the idiomatic Next.js pattern. Sentry's Next.js documentation recommends error boundaries at logical UI boundaries.

**Recommendation** — Implement error boundaries at the route group level. Add domain-level boundaries only when the error handling needs differ from the group default.

---

## 21. Redirect Strategy

**Purpose** — Define the rules and mechanisms for URL redirection across the application.

**Engineering Rationale** — Redirects serve several purposes: auth flow routing, canonical URL enforcement, legacy URL support, and temporary maintenance pages. Mixing redirect logic across middleware, server components, and configuration files creates maintenance hazards. A centralized approach prevents this.

**Recommended Option** — Redirects are handled in three places, strictly scoped:

1. **`next.config.ts` → `redirects()`:** Permanent (301) redirects for migrated URLs, www-to-non-www, and trailing-slash normalization. These are configuration-only, never involve runtime logic.

2. **`proxy.ts` (middleware):** Auth-driven redirects (unauthenticated → `/auth/login`, authenticated → portal home, wrong role → correct portal). These are runtime decisions based on session state.

3. **`redirect()` in server components:** Feature-driven redirects within page handlers (e.g., an event detail page redirects to the event listing if the event is cancelled). These are rare and specific to business logic.

All redirects use the appropriate HTTP status code:

- 301 (Moved Permanently): For `next.config.ts` redirects
- 307 (Temporary Redirect): For middleware auth redirects
- 308 (Permanent Redirect): For trailing-slash normalization
- 303 (See Other): For post-redirect-get patterns in server actions

**Trade-offs** — The three-location strategy requires developers to choose the right mechanism. This is documented in AGENTS.md and enforced in code review to prevent sprawl.

**Industry Best Practice** — Next.js documentation recommends `redirects()` in `next.config.ts` for static redirects, middleware for request-driven redirects, and `redirect()` in server components for business-logic redirects.

**Recommendation** — Centralize redirect logic in the three locations defined above. No redirect should be implemented in client-side code (no `router.push` for redirects).

---

## 22. SEO Routing Strategy

**Purpose** — Define how the routing layer supports search engine optimization through URL structure, metadata, and crawl directives.

**Engineering Rationale** — SEO is primarily relevant for public routes. Authenticated routes must be excluded from search engine indexes. The routing layer must enforce this distinction automatically — no developer should have to remember to set `noindex` on private routes.

**Recommended Option** — Automated SEO enforcement at the route group level:

1. **`proxy.ts` sets `X-Robots-Tag` headers** based on the route group: `all` for `(public)` and `(legal)`, `noindex` for `(auth)`, `(alumni)`, and `(admin)`. This is the first line of SEO enforcement.

2. **`robots.txt`** disallows `/auth/`, `/alumni/`, and `/admin/` completely. The sitemap references only public routes.

3. **Metadata API** — Every public page exports a `generateMetadata` function that returns Open Graph, Twitter Card, and canonical URL metadata. The canonical URL is constructed from environment variables (not hard-coded).

4. **Sitemap generation** — A `src/app/sitemap.ts` file generates the sitemap dynamically, listing all public routes. Private routes are excluded.

5. **URL structure** — Public URLs follow the conventions in Section 15. Hyphens, not underscores. Descriptive, not cryptic.

**Trade-offs** — Dynamic sitemap generation adds a build-time dependency on the CMS/database. This is acceptable for SEO correctness. If build-time data access is problematic, a static sitemap with the primary routes can be used as a fallback.

**Industry Best Practice** — Google's SEO documentation recommends `X-Robots-Tag` for automated index control, semantic URLs, and accurate sitemaps. Next.js documentation provides examples for all patterns described.

**Recommendation** — Enforce SEO at the infrastructure level (middleware headers, robots.txt, sitemap). Individual developers on public routes only need to provide accurate Open Graph metadata.

---

## 23. Metadata Strategy

**Purpose** — Define the metadata creation pattern per route segment, including static, dynamic, and default metadata.

**Engineering Rationale** — Metadata (title, description, Open Graph) is critical for SEO, social sharing, and browser UX. The App Router supports both static `metadata` exports and async `generateMetadata` functions. The choice depends on whether the metadata depends on route params or fetched data.

**Recommended Option** — Three metadata patterns:

1. **Static metadata** — For content pages with fixed values. The page exports a `metadata` object. Used for `/about`, `/faq`, `/contact`, `/legal/*`.

2. **Dynamic metadata** — For pages whose metadata depends on route params or data. The page exports `generateMetadata({ params })`. Used for `/events/[slug]`, `/directory/[id]`, `/directory` (dynamic title includes current filter state).

3. **Template metadata** — The root layout defines a `metadata` object with `title.template = "%s | JJCET Alumni"` to ensure consistent branding. Route group layouts and individual pages can override the title suffix.

All authenticated routes use a single metadata generator at the route group level: `{ title: "Alumni Portal | JJCET Alumni" }` (no per-page customization). This is intentional — authenticated pages are not indexed, so per-page metadata adds cost without benefit.

**Trade-offs** — Not customizing metadata for authenticated pages means shared links to `/alumni/events/42` show generic portal metadata. This is acceptable because auth-gated pages should not be shared outside the authenticated context.

**Industry Best Practice** — Template metadata, `generateMetadata` for dynamic pages, and static metadata for content pages are the three patterns recommended by the Next.js documentation.

**Recommendation** — Use the pattern that fits the page's data requirements. Do not generate metadata for authenticated pages beyond the route group default.

---

## 24. Route-Level Performance Optimization

**Purpose** — Define the rendering and caching strategies per route classification to ensure optimal Core Web Vitals.

**Engineering Rationale** — Different route types have different performance characteristics. SSG is fastest but only suitable for static content. ISR provides a balance of speed and freshness. SSR is necessary for dynamic content. The routing layer must define which strategy applies to each route classification.

**Recommended Option** — Route-level strategies by classification:

| Classification     | Rendering                 | Caching                                      | TTFB Target |
| ------------------ | ------------------------- | -------------------------------------------- | ----------- |
| `STATIC_PUBLIC`    | SSG (build-time)          | `force-static`, CDN cache                    | < 200ms     |
| `DYNAMIC_PUBLIC`   | ISR (revalidate: 60-3600) | `revalidate` per page type, CDN              | < 500ms     |
| `STATIC_LEGAL`     | SSG (build-time)          | `force-static`, CDN                          | < 200ms     |
| `TRANSIENT_AUTH`   | SSR (dynamic)             | `no-store`, no CDN                           | < 800ms     |
| `PROTECTED_ALUMNI` | SSR (dynamic) or ISR      | `no-store` for user-specific, ISR for shared | < 800ms     |
| `PROTECTED_ADMIN`  | SSR (dynamic)             | `no-store`, no CDN                           | < 1000ms    |

Key optimizations:

- Public SSG pages fetch data at build time and serve from CDN edge.
- Public ISR pages fetch data once per revalidation window and serve stale-from-CDN in between.
- Authenticated pages skip CDN entirely (cache headers set by middleware).
- Streaming (React Suspense) is enabled for data-heavy authenticated pages.

**Trade-offs** — SSG means content updates require a rebuild unless ISR is used. ISR adds complexity and requires a persistent data store. The trade-off is documented in the ADR for each decision.

**Industry Best Practice** — Vercel's rendering strategy documentation recommends choosing the most static option that meets freshness requirements. Core Web Vitals targets follow Google's recommended thresholds.

**Recommendation** — Default to the most static option possible for each route. Prefer ISR over SSR for public routes. Accept SSR for authenticated routes where data freshness is critical.

---

## 25. Route-Level Code Splitting

**Purpose** — Define how the routing layer leverages automatic and manual code splitting for optimal bundle sizes.

**Engineering Rationale** — Next.js automatically code-splits by `page.tsx` boundaries. Each page loads only its own JavaScript bundle. Route groups further isolate code — the alumni portal code never loads on the public site, and vice versa. Manual code splitting (via `next/dynamic`) is occasionally needed within a page for heavy components.

**Recommended Option** — Automatic code splitting is sufficient for most routes. Manual code splitting is applied only when:

- A page imports a component that adds >50KB to the initial bundle
- A component depends on a library not needed for the initial render (e.g., a rich text editor, a charting library, a map component)

The route group separation already provides the most significant code-splitting benefit — the public site, auth portal, alumni portal, and admin portal each produce separate bundles. No additional route-level code splitting configuration is needed beyond what Next.js provides automatically.

**Trade-offs** — Automatic code splitting means each page is a separate network request during client-side navigation. This is the correct default. If metrics show excessive navigation-time latency, prefetching (`<Link prefetch>`) can be enabled for high-traffic routes.

**Industry Best Practice** — Next.js's default code-splitting behavior is optimal for most applications. Manual dynamic imports should be the exception, not the rule.

**Recommendation** — Rely on automatic Next.js code splitting by route group and page boundary. Use `next/dynamic` only for individual heavy components within a page.

---

## 26. Future Expansion Strategy

**Purpose** — Define how the routing architecture accommodates new domains, features, and route groups without restructuring.

**Engineering Rationale** — The application will grow. New features, user types, and even new portals (e.g., a public careers page, a "Chapter" portal for regional chapters) must slot into the routing architecture without structural changes. The architecture must be additive, not transformative.

**Recommended Option** — Expansion rules:

1. **New public feature pages:** Add a new segment folder under `(public)`. Example: `/careers` → `app/(public)/careers/page.tsx`. No configuration changes needed.

2. **New alumni domain:** Add a new segment folder under `(alumni)/alumni/`. Example: `/alumni/polls` → `app/(alumni)/alumni/polls/page.tsx`. Update the navigation config. No restructuring needed.

3. **New admin resource:** Add a new segment folder under `(admin)/admin/`. Same pattern as alumni.

4. **New user role/portal:** If a new user type (e.g., "Chapter Lead") needs its own layout and route prefix, add a new route group. Example: `(chapter)/chapter/*` with its own layout and role-based authorization. This is the only case that requires a new route group.

5. **New public top-level route:** Add under `(public)` if it shares the public layout, or add a new route group if it needs a distinct layout.

The architecture is "open for extension, closed for modification." Existing routes, groups, and layouts should never require changes to accommodate new additions.

**Trade-offs** — The new-route-group-on-new-role pattern means the number of route groups grows with the number of distinct user interfaces. This is acceptable because each interface has unique layout and authorization requirements.

**Industry Best Practice** — The Open/Closed Principle applies to route architecture. Good architecture makes extension trivial and modification unnecessary.

**Recommendation** — Follow the additive expansion rules. When in doubt, add under an existing route group. When a new user type needs distinct navigation, create a new route group.

---

## 27. Route Versioning Considerations

**Purpose** — Define how the application handles URL changes, deprecation, and potential future versioning needs.

**Engineering Rationale** — URL changes are inevitable. A "directory" page may become "find-alumni" after rebranding. A feature may need a v2 that coexists with v1 during migration. The architecture must support graceful transitions without breaking existing bookmarks or links.

**Recommended Option** — Do not implement explicit route versioning (no `/v2/alumni/events`). URLs should reflect the business domain, not the implementation version. URL changes are handled through:

1. **Redirects in `next.config.ts`:** Old URL → new URL (301 permanent). The redirects array is the single source of truth for URL migrations.

2. **Feature flagging at the page level:** During a migration, the old page continues to exist at the original URL. The navigation defaults to the new URL. After the migration window, the old URL becomes a 301 redirect.

3. **Progressive enhancement within a route:** A page's layout, data sources, or behavior can change without URL changes. The URL is the stable identifier; what renders at that URL is versioned independently.

Explicit versioned URLs (`/v1/events`, `/v2/events`) are only considered for API routes (`/api/v1/...`, `/api/v2/...`), which are out of scope for this specification.

**Trade-offs** — Not supporting explicit route versioning means backward-incompatible URL changes require coordinated redirects. This is acceptable because UI routes change less frequently than API contracts.

**Industry Best Practice** — Public-facing URLs should be permanent. Versioned URLs (`/v2/`) are universally considered an anti-pattern for UI routes. Redirect-based migration is the standard approach.

**Recommendation** — Never version UI routes. Use redirects for URL changes. Use feature flags for gradual feature rollout at the same URL.

---

## 28. Security Considerations

**Purpose** — Define the routing layer's security boundaries, threat model, and secure defaults.

**Engineering Rationale** — The routing layer is the first line of defense against unauthorized access. Security decisions made at the routing level affect the entire application. The principle of least privilege applies: no route should have more access than it needs, and every route should have the minimum access required by default.

**Recommended Option** — Security rules:

1. **Private by default.** Routes outside the `(public)` and `(legal)` groups require authentication. There is no opt-out at the route level — middleware enforces this globally.

2. **Role-separated route groups.** `(alumni)` and `(admin)` routes are physically separated by route group. A misconfiguration cannot accidentally expose an admin page in the alumni sidebar.

3. **No secrets in URLs.** Dynamic parameters (`[id]`) use database IDs, not sensitive information. Never use email addresses, phone numbers, or personal identifiers in URL segments.

4. **No sensitive data in search params.** Search params are logged by analytics, CDNs, and referrer headers. Never pass tokens, session IDs, or personal data through search params.

5. **CSP headers.** The middleware sets Content-Security-Policy headers appropriate to each route group. Admin routes have stricter CSP rules than public routes.

6. **Referrer-Policy headers.** The middleware sets `strict-origin-when-cross-origin` for all routes, preventing sensitive URL data from leaking in referrer headers.

7. **Rate limiting on auth routes.** Auth routes (`/auth/*`) may be rate-limited at the infrastructure level (not in middleware). This is an operational concern but must be designed for.

**Trade-offs** — Strict CSP headers may block legitimate inline scripts. Any CSP violations must be resolved by adjusting the application code, not by relaxing the CSP.

**Industry Best Practice** — OWASP's Top Ten and Google's Web Security guidelines provide the foundation for all recommendations above. Next.js security documentation covers CSP and header management.

**Recommendation** — Enforce security at the middleware and route group boundary. Use defense in depth. Never rely on client-side checks for security.

---

## 29. Maintainability Guidelines

**Purpose** — Define the practices and conventions that keep the routing layer maintainable over years of development.

**Engineering Rationale** — A routing layer that is difficult to maintain will gradually accumulate inconsistencies, dead routes, and bypasses. The guidelines must be simple enough to remember but strict enough to prevent drift.

**Recommended Option** — Maintainability rules:

1. **One route per file.** Never put multiple pages in a single file (no conditional rendering of different pages based on search params). Each `page.tsx` represents exactly one URL pattern.

2. **No page.tsx in route groups.** Route groups contain only `layout.tsx`, `loading.tsx`, `error.tsx`, and segment folders. Route groups must never have their own `page.tsx`.

3. **Flat is better than nested.** If a route can be a top-level segment under its route group, it should be. Prefer `/alumni/settings` over `/alumni/account/settings`.

4. **Dead route removal.** When a route is removed, delete its folder and all associated files. Remove redirects after the migration window closes. Run a build to verify no dangling imports.

5. **Route ownership documentation.** Each route group has a comment block or README listing the routes it contains (or a reference to the navigation config). This helps developers discover all routes without reading the file tree.

6. **Code review checklist.** Every PR that touches `src/app/` is reviewed against the routing specification. The reviewer checks URL naming, nesting depth, authorization, and metadata compliance.

**Trade-offs** — Documentation overhead is minimal (a README per route group). The code review rule adds friction to simple route changes but prevents accumulation of technical debt.

**Industry Best Practice** — Code review checklists, ownership documentation, and flat route structures are standard practices in enterprise Next.js applications.

**Recommendation** — Codify the maintainability rules in the project's `AGENTS.md` and enforce through code review.

---

## 30. Routing Best Practices

**Purpose** — Consolidate the essential routing principles into a quick-reference guide for everyday development.

**Engineering Rationale** — A comprehensive specification is useful for reference, but developers need a concise summary during daily work. This section distills the specification into actionable rules.

**Recommended Option** — The following best practices form the project's routing contract:

| #   | Rule                                                   | Rationale                          |
| --- | ------------------------------------------------------ | ---------------------------------- |
| 1   | Route groups separate layouts, not features.           | Five groups max.                   |
| 2   | URLs are lowercase kebab-case nouns.                   | Consistent, RESTful, SEO-friendly. |
| 3   | Public routes are SSG or ISR.                          | Performance by default.            |
| 4   | Private routes are SSR or ISR.                         | Noindex by default.                |
| 5   | Middleware protects every private route.               | No exceptions.                     |
| 6   | Auth routes redirect if authenticated.                 | Users shouldn't see login twice.   |
| 7   | Use `[id]` for database keys, `[slug]` for SEO.        | Predictable parameter naming.      |
| 8   | Maximum 3 levels of nesting.                           | Flatter is better.                 |
| 9   | One `page.tsx` per route.                              | No conditional page rendering.     |
| 10  | Redirects in three places only.                        | Centralized, not scattered.        |
| 11  | Metadata is per-public-route, group-level for private. | SEO effort where it matters.       |
| 12  | Loading boundaries at group and domain root only.      | Avoid skeleton flash.              |
| 13  | Error boundaries at the route group level.             | Consistent error UX per domain.    |
| 14  | Navigation is a config array, not hard-coded links.    | Additive, not transformative.      |
| 15  | New user types get new route groups.                   | Open for extension.                |

**Recommendation** — Print this table. Reference it in every code review that touches the routing layer.
