# ==========================================================

Stage 3 — Layout Layer Specification

# ==========================================================

## 1. Layout Philosophy

**Purpose**  
Define the governing principles that guide every layout decision in the application.

**Engineering Rationale**  
A layout layer is not merely a collection of wrappers. It is the persistent UI shell that survives navigations, provides structural consistency, and anchors the user's spatial orientation within the application. In Next.js App Router, layouts are the only components that persist across page transitions — making their design a first-class architectural concern.

**Recommended Option**  
Adopt a **Shell-and-Slot** architecture. The root layout owns the outermost shell (`<html>`, `<body>`, providers). Each route-group layout acts as a **slot** that composes a self-contained app shell (sidebar, topbar, content area, etc.) without duplicating concerns. Shells are server-rendered by default; interactivity is injected only at leaf nodes via isolated client islands.

**Trade-offs**

- Shell-and-slot adds indirection compared to monolithic layouts, but this indirection buys testability, independent deployability, and team-scalable development.
- Over-engineering the shell for edge cases that do not yet exist is wasteful; the specification balances present-day requirements with clear extension points.

**Industry Best Practice**  
Leading Next.js production applications (Vercel dashboard, Linear, Resend) use nested route-group layouts with server-first shells. The App Router's layout nesting semantics were designed specifically for this pattern.

**Recommendation**  
Adopt Shell-and-Slot. It is the canonical pattern for the App Router and aligns with every principle listed in the design brief.

---

## 2. Layout Architecture

**Purpose**  
Describe the structural composition of layouts across the entire route tree.

**Engineering Rationale**  
The layout architecture must mirror the route-group hierarchy established in Stage 2. Each route group gets exactly one layout file. These layouts compose — they do not duplicate. The root layout provides the document shell and global providers. Group layouts provide domain-specific shell elements (navigation, chrome). Pages provide content only.

**Recommended Option**

```
app/layout.tsx                          ← Document shell + global providers
app/(public)/layout.tsx                 ← Public header + footer
app/(auth)/layout.tsx                   ← Centered card container
app/(legal)/layout.tsx                  ← Minimal footer only
app/(alumni)/layout.tsx                 ← Alumni sidebar + topbar + content
app/(admin)/layout.tsx                  ← Admin sidebar + topbar + content
```

Each group layout is a **full-height flex column** (for public/legal) or a **sidebar + content row** (for alumni/admin). The content area renders `{children}` — no further wrapping inside the layout.

**Trade-offs**

- Five layouts is minimal for the domain count. Adding more route groups in the future (e.g., `(mentor)`) would add one more layout; this is linear, not exponential.
- Combining alumni and admin into a single layout with role-based switching was considered but rejected — it violates separation of concerns and couples two distinct domains.

**Industry Best Practice**  
One layout per route group. No shared layout inheritance between groups; instead, extract shared chrome elements into composable components that each group layout imports.

**Recommendation**  
The existing five-layout structure from Stage 2 is correct. No change needed at the architectural level.

---

## 3. Root Layout

**Purpose**  
Define the responsibilities and boundaries of `app/layout.tsx`.

**Engineering Rationale**  
The root layout is the outermost React component in the tree. It renders `<html>` and `<body>`, sets global metadata, loads fonts, injects CSS, and wraps the application in providers. It must be as thin as possible — any provider added here affects every route, including error pages.

**Responsibilities**

- `<html>` element with `lang` and `suppressHydrationWarning` for theme
- `<body>` with base styling classes
- Metadata exports (`metadata`, `viewport`)
- Font loading via `next/font`
- CSS imports (`globals.css`)
- **Providers scoped to the entire app** (see §17 Provider Layer)
- `{children}` slot for route-group layouts

**Non-Responsibilities**

- Navigation chrome (that belongs to group layouts)
- Business-logic providers (those belong in feature layers or group layouts)
- Data fetching for pages

**Recommended Option**  
Keep the root layout strictly for document shell and truly global providers. Move session/auth providers to the alumni/admin group layouts so that unauthenticated routes are not burdened by auth context.

**Trade-offs**

- Placing auth providers in group layouts means the public site never initializes auth. This is a performance win but requires that any public page that conditionally shows auth state must use a separate mechanism (e.g., a lightweight cookie check).
- This is the correct trade-off. 99% of public pages do not need auth context.

**Industry Best Practice**  
The Next.js team recommends minimal root layouts. Auth providers, theme providers, and i18n providers are the three commonly accepted global providers.

**Recommendation**  
Restructure the existing root layout to contain only: `<html>`, `<body>`, font loading, CSS, metadata, `ThemeProvider` (for dark mode), `next-intl` provider (if used globally), and `{children}`. All other providers move to group layouts or feature boundaries.

---

## 4. Public Layout

**Purpose**  
Define the shell for `/(public)/*` routes — the marketing-facing portion of the site.

**Engineering Rationale**  
Public routes are the entry point for unauthenticated visitors. The layout must project trust, provide clear navigation to key sections, and include a call-to-action (sign in). The layout is server-rendered and fully indexable.

**Structure**

- **Topbar**: Logo + nav links (About, Directory, Events, FAQ, Contact) + Sign In button
- **Content**: `{children}` — full-width flex-1 container
- **Footer**: Logo, quick links, legal links, social icons, copyright

**Responsive Behavior**

- Desktop (`≥1024px`): Full horizontal topbar, multi-column footer
- Tablet (`≥640px`): Collapsed topbar with hamburger menu, two-column footer
- Mobile: Hamburger drawer, stacked footer

**Recommended Option**  
The topbar navigation should derive its items from `src/config/navigation.ts` (already created in Stage 2) rather than hardcoding links. The Sign In button should detect authentication state via a lightweight cookie check (not a full provider query) to optionally swap to a profile avatar.

**Trade-offs**

- A client-side mobile hamburger adds a small JavaScript footprint on the public site. This is acceptable — navigation interactivity is a baseline UX expectation.
- Server-rendering the hamburger as a static toggle without JS is possible but provides a degraded mobile experience.

**Industry Best Practice**  
Public-facing layouts should be SSR with minimal JS. The hamburger drawer is a progressively enhanced island — it works without JS as a same-page anchor, and JS upgrades it to a slide-over.

**Recommendation**  
The existing Stage 2 public layout structure is correct at the macro level. The next implementation pass should: (1) source nav items from the config module, (2) add the mobile hamburger drawer, (3) add a lightweight auth-status indicator.

---

## 5. Authentication Layout

**Purpose**  
Define the shell for `/(auth)/*` routes — login, register, password reset, and verification pages.

**Engineering Rationale**  
Auth pages are transient by nature. Users arrive here to authenticate and leave immediately afterward. The layout must minimize distraction, focus attention on the form, and provide a clear path back to the public site.

**Structure**

- **Logo**: Centered above the card, links to `/`
- **Card**: Centered, max-width `sm` (`384px`), rounded, bordered, shadow
- **Footer**: None (or minimal "Back to home" link)

**Responsive Behavior**

- Desktop: Vertically and horizontally centered on the viewport
- Mobile: Full-width card with padding, no shadow
- Keyboard: Form fields receive automatic focus; enter-to-submit works natively

**Recommended Option**  
This layout should remain minimal and unchanged from Stage 2. No navigation chrome, no sidebar, no footer. The card pattern is the industry standard for auth flows.

**Trade-offs**

- A minimal layout means no global navigation — users who need to go back must use the logo link. This is intentional; it prevents auth-page abandonment through distraction.

**Industry Best Practice**  
Every major SaaS application (Vercel, Stripe, GitHub) uses the centered-card pattern for authentication.

**Recommendation**  
Keep the existing Stage 2 auth layout as-is. Add automatic `autofocus` on the first form field of each page component.

---

## 6. Alumni Layout

**Purpose**  
Define the authenticated shell for `/(alumni)/*` routes — the primary experience for graduated students.

**Engineering Rationale**  
Alumni users spend extended time within this route group. The layout must support multi-tasking, provide quick access to key features (dashboard, networking, events, jobs, gallery, messages, settings), and maintain spatial consistency across navigations.

**Structure**

- **Sidebar** (desktop): Logo + nav links + user avatar + sign out
- **Topbar** (mobile): Logo + hamburger toggle + page title + notifications bell
- **Content**: `flex-1` padded container, scrollable independently
- **Mobile Drawer**: Overlay sidebar triggered by hamburger

**Responsive Behavior**

- Desktop (`≥1024px`): Persistent sidebar (264px), topbar with minimal chrome
- Tablet (`≥768px`): Collapsible sidebar (icon-only mode), topbar visible
- Mobile: Full-width content, sidebar becomes a drawer overlay

**Nav Items** (derived from `src/config/navigation.ts`):  
Dashboard, Profile, Networking, Events, Jobs, Gallery, Messages, Settings

**Recommended Option**  
The sidebar should render as a Server Component. The active-link highlighting and mobile toggle are the only client-side concerns. Extract the sidebar and topbar into composable components (`<AlumniSidebar>`, `<AlumniTopbar>`, `<AlumniMobileNav>`) that the layout composes.

**Trade-offs**

- A Server Component sidebar means nav items cannot react to real-time state without client islands. Acceptable — nav item visibility (e.g., unread message count) can be added later as a client island within the server sidebar.
- Icon-only sidebar on tablet saves space but requires tooltips for accessibility.

**Industry Best Practice**  
Enterprise applications (Linear, Notion, Sentry) use persistent sidebars for authenticated workspaces. The pattern signals "you are inside the application" and provides a stable navigation anchor.

**Recommendation**  
Refactor the existing Stage 2 alumni layout to extract `<AlumniSidebar>` and `<AlumniTopbar>` as composable components. Add mobile drawer support. Source nav items from the config module.

---

## 7. Admin Layout

**Purpose**  
Define the authenticated shell for `/(admin)/*` routes — the administrative backend.

**Engineering Rationale**  
Admin users require access to management interfaces not available to alumni. While the visual structure is similar to the alumni layout, the nav items, permissions model, and visual branding differ. The layout must reflect elevated privilege without unnecessary visual distinction.

**Structure**

- **Sidebar** (desktop): Logo + grouped nav sections (Main, Content, System)
- **Topbar**: Page breadcrumbs + user avatar + sign out
- **Content**: `flex-1` padded container

**Responsive Behavior**

- Identical responsive strategy to alumni layout (sidebar → drawer on mobile)
- The admin sidebar may show a "Back to site" link to `/alumni/dashboard`

**Nav Sections** (derived from `src/config/navigation.ts`):

- **Main**: Dashboard, Alumni, Events, Users
- **Content**: Content, Announcements
- **System**: Reports, Audit Log, Settings

**Recommended Option**  
Create an analogous `<AdminSidebar>` and `<AdminTopbar>` component set. Do not attempt to share sidebar components with alumni — the nav structure, permission checks, and visual grouping differ enough to warrant separate implementations. However, extract any common patterns (e.g., `<SidebarNavItem>`, `<SidebarSection>`) into shared primitives.

**Trade-offs**

- Duplicating sidebar components violates DRY but respects domain separation. The shared primitive layer prevents actual duplication of rendering logic.
- A unified role-based sidebar was considered but adds conditional complexity that makes both domains harder to reason about.

**Industry Best Practice**  
Admin panels commonly have dedicated layouts with distinct navigation hierarchies (see: Shopify Admin, Stripe Dashboard, Vercel's team/project switcher).

**Recommendation**  
The existing Stage 2 admin layout structure is sound. Extract composable sub-components analogously to the alumni layout, with shared primitives for sidebar items and sections.

---

## 8. Layout Hierarchy

**Purpose**  
Document the exact nesting order of layouts as React renders them.

**Engineering Rationale**  
Understanding the render order is essential for determining where providers, context, and styles apply. The hierarchy determines which layout is the "closest" ancestor for any given page.

**Render Order (top to bottom)**

```
<html>                              ← app/layout.tsx
  <body>
    <ThemeProvider>
    <I18nProvider>
      <RouteGroup.Layout>           ← One of: (public), (auth), (alumni), (admin), (legal)
        <Page>                      ← page.tsx
      </RouteGroup.Layout>
    </I18nProvider>
    </ThemeProvider>
  </body>
</html>
```

For nested groups (e.g., `/(alumni)/alumni/jobs/[id]`), the hierarchy remains flat because no additional layout files exist at deeper path segments — only the route-group layout wraps the page.

**Key Insight**  
There is no shared layout between alumni and admin beyond the root. Each authenticated group layout is independently responsible for its chrome. This means auth-initialization logic (session fetch, token refresh) must be duplicated or extracted into a shared composable that both group layouts invoke.

**Recommended Option**  
Create a `<AuthenticatedShell>` composable that encapsulates auth-check logic, session initialization, and the sidebar+topbar+content grid. Both the alumni and admin layouts use this composable, passing nav configuration and branding as props. This avoids duplication while keeping each layout file as a thin configuration layer.

**Trade-offs**

- `<AuthenticatedShell>` introduces a shared abstraction between the two layouts. If the shells diverge significantly over time, the abstraction may need to be broken apart. Acceptable for now — the layouts are structurally identical.

**Industry Best Practice**  
Layout composition via shared shell components is the standard pattern in enterprise Next.js applications (see: Vercel's `@vercel/layout` pattern).

**Recommendation**  
Extract `<AuthenticatedShell>` as a shared composable that accepts `navItems`, `branding`, and `role` as props.

---

## 9. Layout Composition Strategy

**Purpose**  
Define how layouts compose with pages, error boundaries, loading states, and nested content.

**Engineering Rationale**  
In Next.js App Router, composition is hierarchical. A layout file at a route-group level wraps all pages and nested routes within that group. Error boundaries and loading states are files co-located with layouts. Understanding this composition model prevents anti-patterns like wrapping `{children}` in unnecessary `<div>` elements.

**Composition Rules**

1. A layout renders `{children}` — always a React node, never an array.
2. `loading.tsx` wraps the layout's children during navigation: `<Layout><Loading>{children}</Loading></Layout>` is incorrect; the correct mental model is `<Layout>{loading ? <Loading /> : <Page />}</Layout>`.
3. `error.tsx` at the layout level catches errors from both the layout and its children. An `error.tsx` at the page level only catches errors in that page.
4. `not-found.tsx` at the route-group level catches `notFound()` calls from within that group.

**Recommended Option**  
Place `error.tsx` and `loading.tsx` at each route-group level (already done in Stage 2). Do not add layout files at deeper path segments unless a new sub-layout is architecturally justified. The five route-group layouts are sufficient.

**Trade-offs**

- Adding deeper layout files would enable sub-navigation within a section (e.g., a sub-layout for `/alumni/jobs/*` that shows a "back to jobs" link). This is a valid future optimization but is not needed at launch.

**Industry Best Practice**  
Flat layout hierarchies with error/loading boundaries at the route-group level are the recommended Next.js pattern.

**Recommendation**  
Maintain the existing layout granularity. Add sub-layouts only when a section's chrome requirements demonstrably differ from its parent.

---

## 10. App Shell Architecture

**Purpose**  
Define the common structural pattern used by authenticated layouts.

**Engineering Rationale**  
Both the alumni and admin layouts follow the same app-shell pattern: a sidebar on the left, a topbar at the top, and a scrollable content area filling the remaining space. This pattern is sometimes called the "holy grail layout" and is the de facto standard for authenticated web applications.

**Shell Anatomy**

```
+------------------------------------------+
| Topbar (fixed height, full width)         |
+----------+-------------------------------+
| Sidebar  | Content (scrollable)          |
| (fixed   |                               |
|  width)  |                               |
|          |                               |
+----------+-------------------------------+
```

**Implementation Pattern**

- Use CSS `display: grid` with explicit `grid-template-columns` and `grid-template-rows` for the shell. This avoids nested flexbox complexity and keeps the scroll behavior predictable.
- The sidebar is in the document flow (not `position: fixed`) to avoid z-index stacking issues with overlays and modals.
- The content area uses `overflow-y: auto` for independent scrolling.
- On mobile, the grid collapses to a single column; the sidebar becomes a `position: fixed` drawer.

**Recommended Option**  
Extract the shell grid into a `<Shell>` component that accepts `sidebar`, `topbar`, and `children` slots. This single component is used by both alumni and admin layouts.

**Trade-offs**

- A grid-based shell is slightly less intuitive than nested flex containers but provides more predictable sizing behavior across viewports.
- Using `position: fixed` for the mobile drawer is standard practice and does not conflict with the grid shell.

**Industry Best Practice**  
CSS Grid is the recommended approach for application shells (see: Rachel Andrew's "Grid for App Layout" and every major design system).

**Recommendation**  
Implement a `<Shell>` grid component as the single source of truth for the app-shell layout pattern. Use it in both alumni and admin layouts.

---

## 11. Shared UI Components

**Purpose**  
Identify the UI primitives that will be shared across layouts.

**Engineering Rationale**  
Layout composition relies on reusable primitives. These primitives live in `src/components/` (the shared component layer, Stage 9) and are imported by layout files. Defining the primitive set here prevents ad-hoc component creation within layout files.

**Primitive Inventory**

- `SidebarNavItem` — A single navigation link with icon, label, active state, and badge
- `SidebarSection` — A group of nav items with an optional section heading
- `Sidebar` — Composes sections and items into a vertical navigation panel
- `Topbar` — Horizontal bar with branding, breadcrumbs, and actions
- `Shell` — CSS Grid layout container (see §10)
- `Footer` — Site footer with links and copyright
- `MobileDrawer` — Overlay navigation for mobile viewports
- `Breadcrumbs` — Breadcrumb trail derived from path segments
- `Avatar` — User avatar with fallback initials
- `NotificationBell` — Unread notification indicator (client island)

**Non-Primitives** (belong in feature or section layers):

- `AlumniSidebar` — Composes primitives with alumni-specific nav config
- `AdminSidebar` — Composes primitives with admin-specific nav config
- `PublicNavigation` — Composes primitives with public nav config

**Recommended Option**  
Create each primitive as a Server Component by default. Only add `"use client"` where interactivity is required (e.g., `MobileDrawer` toggle, active link detection). This keeps the layout tree mostly server-rendered.

**Trade-offs**

- A strictly typed primitive API increases upfront design cost but prevents coupling between layouts and implementation details.

**Industry Best Practice**  
Design systems (shadcn/ui, Radix, Ariakit) all follow the primitive → composition pattern.

**Recommendation**  
Define these primitives in the specification. They will be implemented in Stage 9.

---

## 12. Navigation Containers

**Purpose**  
Define how navigation items are rendered and activated.

**Engineering Rationale**  
Navigation items must reflect the current route for active-link highlighting. In the App Router, the current pathname is accessed via `headers()` (Server Component) or `usePathname()` (Client Component). Active-link detection must be consistent across all navigation containers.

**Recommended Option**  
Use a server-first approach for active-link detection. The layout, as a Server Component, reads the pathname — but wait, layouts don't have access to `usePathname()` since they're not client components. There are two options:

1. **Server pathname injection**: Pass the pathname from the page component up via context or prop-drilling. This is impractical because layouts are parents, not children.
2. **Client island**: Create a `<NavLink>` client component that uses `usePathname()` internally. The rest of the sidebar remains a Server Component; only the individual links are client islands.

**Recommended Option**: Option 2 (client island for links). Each `<SidebarNavItem>` becomes a client component that detects the active state. The total client footprint is limited to the link elements — approximately 8-14 small components, each reading pathname. This is negligible for performance.

**Trade-offs**

- Option 1 (pure server) would require passing pathname through URL search params or cookies, which is a hack. Avoid.
- Option 3 (make entire sidebar a client component) would defeat server-first benefits.

**Industry Best Practice**  
The `usePathname()` hook in leaf client components nested within server layouts is the canonical Next.js pattern.

**Recommendation**  
Implement `<SidebarNavItem>` as a `"use client"` component that renders a `<Link>` and applies active styles based on `usePathname()`. All other sidebar structure remains server-rendered.

---

## 13. Sidebar Strategy

**Purpose**  
Define the behavior, states, and responsiveness of the sidebar component.

**Engineering Rationale**  
The sidebar is the primary navigation mechanism for authenticated users. It must be persistent, predictable, and accessible. It must support three visual states: expanded, collapsed (icon-only), and hidden (mobile drawer).

**States**

- **Expanded** (desktop default): Full-width sidebar with icons + labels
- **Collapsed** (tablet optional): Icon-only sidebar, labels visible on hover via tooltip
- **Hidden** (mobile): Sidebar is a `position: fixed` drawer overlay, triggered by hamburger

**Behavior**

- Sidebar state (expanded/collapsed) is persisted in a cookie or localStorage
- Mobile drawer is always closed by default; opened by user action
- Navigation via sidebar closes the mobile drawer
- Active section is visually distinguished
- Keyboard navigation: Tab through links, Enter to activate

**Recommended Option**  
Implement sidebar state with a simple cookie-based preference. The layout reads the cookie to apply the appropriate CSS class (server-side), and a small client island toggles the value. This avoids global state management for a layout preference.

**Trade-offs**

- Cookie-based persistence means the server renders the correct initial state. localStorage-only would cause a flash of incorrect state on SSR.
- A more sophisticated solution (zustand, jotai) is overkill for a binary layout preference.

**Industry Best Practice**  
Cookie-based layout preferences with progressive enhancement via a client toggle is the standard approach (see: Vercel, Linear).

**Recommendation**  
Implement sidebar state as a cookie-read server default with a lightweight client toggle.

---

## 14. Topbar Strategy

**Purpose**  
Define the content and behavior of the top bar in authenticated layouts.

**Engineering Rationale**  
The topbar provides context (breadcrumbs, page title), secondary actions (notifications, user menu), and serves as the mobile navigation trigger. It is present in both alumni and admin layouts but may differ in content.

**Content**

- **Left**: Breadcrumbs or current page title
- **Right**: Notification bell, user avatar + dropdown (settings, sign out)

**Responsive Behavior**

- Desktop: Full topbar with all elements
- Mobile: Reduced topbar with hamburger menu replacing the sidebar

**Recommended Option**  
The topbar should be a Server Component that receives breadcrumbs as a prop from the layout. The user avatar and notification bell are client islands that fetch their own data. The hamburger toggle is a client component that communicates with the mobile drawer via a shared toggle state.

**Trade-offs**

- Fetching user data in the topbar from a server component requires a session lookup. This is an acceptable server cost since the topbar renders once per navigation, not per interaction.

**Industry Best Practice**  
Topbars universally contain breadcrumbs, search, notifications, and user menus (see: GitHub, Linear, Sentry).

**Recommendation**  
Define a `<Topbar>` component that accepts breadcrumbs and optionally a hamburger toggle. The user avatar and notifications are fetched server-side where possible.

---

## 15. Footer Strategy

**Purpose**  
Define the footer behavior across route groups.

**Engineering Rationale**  
Footers provide legal links, copyright, and secondary navigation. They are domain-dependent: public routes need a full footer, legal routes need a minimal "back" link, and authenticated routes may not need a footer at all (or display a simplified version).

**Per-Group Strategy**

- **Public**: Full footer with logo, nav links, legal links, social icons, copyright
- **Legal**: Minimal "Back to home" link only
- **Auth**: No footer (the card layout is self-contained)
- **Alumni**: No footer (or optional simplified version at the bottom of content)
- **Admin**: No footer

**Recommended Option**  
Keep the footer exclusively in `(public)` and `(legal)` layouts. Authenticated layouts do not render a footer — the content scrolls to the bottom of the viewport naturally, and additional links belong in the sidebar or topbar.

**Trade-offs**

- Some enterprise applications include a footer in authenticated areas for legal compliance (e.g., SOC2 badge, privacy link). If required, add a minimal footer only to the alumni group layout, not the admin.

**Industry Best Practice**  
Authenticated application shells rarely include footers. The sidebar and topbar absorb all navigational needs.

**Recommendation**  
Exclude footers from authenticated layouts. Include a full footer in the public layout and a minimal footer in the legal layout.

---

## 16. Content Container Strategy

**Purpose**  
Define how page content is sized, padded, and scrolled within layouts.

**Engineering Rationale**  
The content area is the slot where pages render. It must provide consistent padding, maximum width constraints, and independent scrolling without interfering with the layout shell.

**Recommended Option**  
The content container is the `flex-1` or `grid` cell that contains `{children}`. Apply the following as layout-level defaults:

- Padding: `px-6 py-8` (desktop), `px-4 py-6` (mobile)
- Max width: `max-w-7xl` for standard pages, `max-w-full` for data-heavy pages
- Overflow: `overflow-y-auto` for independent scrolling
- Background: `bg-zinc-50` (light), `bg-black` (dark)

Pages that need different padding or width constraints should override these via their own container within the page component.

**Trade-offs**

- Setting overflow on the content container means the sidebar and topbar remain fixed while the content scrolls. This is the expected behavior for application shells.
- Pages with full-width data tables may need to reset the padding and max-width. This is a per-page concern and should not be dictated by the layout.

**Industry Best Practice**  
Application shells use fixed chrome and independently scrolling content areas (see: Material Design, shadcn/ui Sidebar examples).

**Recommendation**  
Define content container defaults at the layout level, with per-page overrides when necessary. Use CSS Grid for the shell to avoid nested scroll containers.

---

## 17. Provider Layer

**Purpose**  
Define the provider hierarchy and placement strategy.

**Engineering Rationale**  
React providers wrap the component tree and supply context to descendants. Placing providers at the wrong level causes unnecessary re-renders, memory overhead, or initialization costs for routes that do not need the context.

**Provider Inventory and Placement**

| Provider                            | Placement                    | Rationale                                                     |
| ----------------------------------- | ---------------------------- | ------------------------------------------------------------- |
| `ThemeProvider`                     | Root layout                  | Dark mode must be available everywhere, including error pages |
| `next-intl` (I18nProvider)          | Root layout                  | Internationalization must be available everywhere             |
| `SessionProvider` / `AuthProvider`  | Alumni + Admin group layouts | Public and auth routes do not need auth context               |
| `NotificationProvider`              | Alumni + Admin group layouts | Notifications are only relevant for authenticated users       |
| `ModalProvider`                     | Alumni + Admin group layouts | Modal system is only relevant inside the app                  |
| `QueryClientProvider` (React Query) | Root layout                  | Data fetching may be needed on any page                       |
| `ToastProvider`                     | Root layout                  | Toasts must be available across all routes                    |

**Recommended Option**  
Layer providers at the minimum common ancestor. Do not place a provider at the root level if only a subset of routes need it.

**Trade-offs**

- `QueryClientProvider` at root means public pages initialize a query client unnecessarily. The overhead is negligible (a few KB of memory) and avoids an awkward provider boundary.
- `SessionProvider` at the group level means navigating from public to alumni re-mounts the provider tree. This is intentional — the public tree is clean of auth concerns.

**Industry Best Practice**  
The "minimum common ancestor" rule for provider placement is universally recommended by the React team.

**Recommendation**  
Use the placement table above. Implement provider wrappers as composable provider components (e.g., `<AuthProviders>{children}</AuthProviders>`) for group layouts.

---

## 18. Theme Strategy

**Purpose**  
Define how theming (light/dark mode) is implemented and persisted.

**Engineering Rationale**  
The application must support light and dark modes with a system-default fallback. The theme must persist across sessions and render without a flash of incorrect theme (FOIT).

**Recommended Option**

- Use `next-themes` for theme management (industry standard for Next.js)
- Persist the preference in localStorage
- Default to system preference
- Apply a `class` strategy (adds `.dark` to `<html>`) rather than `data-*` attributes
- The root layout sets `suppressHydrationWarning` on `<html>` to prevent hydration mismatch

**FOIT Prevention**  
`next-themes` injects an inline script in `<head>` that reads localStorage and applies the correct class before the first paint. No additional work is needed.

**Dark Mode Styling**  
Tailwind CSS v4 supports `@custom-variant dark (&:is(.dark *))` which is already configured in `globals.css`. All layout components use `dark:` variants for color overrides.

**Recommended Option**  
Configure `next-themes` `ThemeProvider` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`. Place it in the root layout.

**Trade-offs**

- The `class` strategy is slightly more work than `data-*` but is broadly compatible with third-party components.
- A pure CSS approach (using `prefers-color-scheme` media query without JavaScript) would eliminate the FOIT entirely but cannot persist a manual override.

**Industry Best Practice**  
`next-themes` with the `class` strategy is the most widely adopted theme solution in the Next.js ecosystem.

**Recommendation**  
Integrate `next-themes` in the root layout with `class` strategy, system default, and localStorage persistence.

---

## 19. Responsive Layout Strategy

**Purpose**  
Define how layouts adapt to different viewport sizes.

**Engineering Rationale**  
The application must be fully usable across desktop (1920px+), laptop (1366px), tablet (768px-1024px), and mobile (320px-428px) viewports. The layout architecture must gracefully transition between these states without duplicating content.

**Breakpoints**

| Name    | Min Width | Layout Applied                                               |
| ------- | --------- | ------------------------------------------------------------ |
| Mobile  | 0         | Full-width content, sidebar as drawer, topbar with hamburger |
| Tablet  | 768px     | Collapsible sidebar, topbar with page title                  |
| Desktop | 1024px    | Expanded sidebar, full topbar                                |

**Transition Behavior**

- **Mobile → Tablet**: Sidebar transitions from drawer to collapsible panel. Content gains left padding.
- **Tablet → Desktop**: Sidebar transitions from icon-only to expanded. Content width adjusts.
- All transitions use CSS only — no JavaScript resize observers.

**Recommended Option**  
Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) for all layout adjustments. The sidebar's grid column uses `grid-cols-[0_1fr]` on mobile, `grid-cols-[64px_1fr]` on tablet, and `grid-cols-[264px_1fr]` on desktop. Avoid `useMediaQuery` for layout-level changes — CSS is sufficient.

**Trade-offs**

- Hiding the sidebar with `display: none` on mobile and showing an overlay drawer requires a small JavaScript toggle. The toggle state lives in a React context at the group-layout level.
- Using CSS-only for the sidebar collapse (without JavaScript) would require CSS `:has()` selector, which has limited browser support.

**Industry Best Practice**  
Responsive application shells use CSS Grid with media queries for layout. JavaScript is used only for interactive state (drawer open/close).

**Recommendation**  
Implement responsive layout exclusively through CSS media queries and Tailwind responsive prefixes. Use a minimal client component for the mobile drawer toggle state.

---

## 20. Loading Boundary Strategy

**Purpose**  
Define how loading states are rendered during page transitions and data fetching.

**Engineering Rationale**  
Next.js automatically shows `loading.tsx` during page transitions when using the App Router. These loading states must be visually consistent with the layout they belong to — a public loading state differs from an alumni loading state.

**Per-Group Loading States**

- **Public**: Skeleton placeholders matching page content structure (hero skeleton, card skeletons)
- **Auth**: Centered spinner within the auth card
- **Alumni**: Sidebar and topbar rendered with skeleton content in the main area
- **Admin**: Same as alumni but with admin-branded skeletons
- **Legal**: Minimal skeleton with a centered spinner

**Recommended Option**  
Each route-group `loading.tsx` should render a skeleton that matches the layout's chrome. The sidebar and topbar are real (not skeleton) since they are part of the persistent layout, while the content area shows a skeleton. This provides the perception of instant navigation — the chrome appears immediately while content loads.

**Implementation Pattern**  
The `loading.tsx` at the route-group level should re-render the layout chrome (sidebar, topbar) and place a skeleton in the content slot. This is achieved by duplicating the chrome structure in the loading file. While DRY concerns exist, this is the canonical Next.js pattern for loading boundaries.

**Trade-offs**

- Duplicating chrome in loading files is not DRY. However, extracting the chrome into reusable components (as recommended in §11) minimizes the duplication — each loading file simply imports and composes the same components with skeleton content.
- An alternative approach using `Parallel Routes` with `@slot` for independent streaming is architecturally superior but adds significant complexity for marginal gain at this stage.

**Industry Best Practice**  
The Next.js documentation explicitly recommends this pattern: loading files that mirror their parent layout's structure.

**Recommendation**  
Refactor each route-group `loading.tsx` to show real chrome components with skeleton content. The existing `loading.tsx` files from Stage 2 that show a simple "Loading..." text are placeholders and must be replaced.

---

## 21. Error Boundary Strategy

**Purpose**  
Define how errors are caught, displayed, and recovered at each layout level.

**Engineering Rationale**  
Next.js `error.tsx` files catch unhandled errors in their scope and display a fallback UI. The boundary scope is: the layout file, its page, and all nested children. Each route group must have its own error boundary with domain-appropriate messaging and recovery actions.

**Per-Group Error Boundaries**

- **Public**: "Something went wrong" + "Try again" button. Friendly, non-technical.
- **Auth**: "Authentication error" + "Try again" or "Back to login". Should never leak error details.
- **Alumni**: "We encountered an error" + "Try again" + "Return to dashboard". May include a support contact link in the future.
- **Admin**: "An administrative error occurred" + "Try again" + "Return to dashboard". May include error ID for support.
- **Legal**: "Something went wrong" + "Try again". Minimal.

**Global Error Boundary**  
The root `error.tsx` (already created in Stage 2) is a fallback for errors outside any route-group boundary. It must render `<html>` and `<body>` tags independently since the root layout is not available during a global error. This is correct in the existing implementation.

**Recovery Actions**

- `reset()` — Attempts to re-render the segment. Works for transient errors.
- "Return to dashboard" — Navigates to a safe route. Implemented via `window.location.href` or a `<Link>` in the error UI.
- Error logging — `error.tsx` receives an `Error` object. Send it to the monitoring service (Sentry, already configured in Stage 1).

**Recommended Option**  
Keep the existing error boundary structure from Stage 2. The key improvement is to ensure each `error.tsx` sends the error details to Sentry. The `error` parameter should be forwarded to the monitoring service even if not displayed to the user.

**Trade-offs**

- Displaying error details to users is a security concern for auth and admin routes. Never expose stack traces or internal messages. The existing Stage 2 error boundaries use generic messages — this is correct.

**Industry Best Practice**  
Error boundaries at every route-group level with generic user-facing messages and detailed server-side logging.

**Recommendation**  
Add Sentry error reporting calls to each `error.tsx`. Keep the generic user-facing messages. The existing structure is sound.

---

## 22. Not Found Strategy

**Purpose**  
Define how 404 states are rendered across the application.

**Engineering Rationale**  
A "not found" state occurs when a route does not match any file in the file-system router, or when `notFound()` is explicitly called (e.g., a dynamic route segment references a non-existent resource). Next.js renders `not-found.tsx` at the nearest layout boundary.

**Scenarios**

1. **Invalid URL**: User navigates to a path that has no matching route file → root `not-found.tsx`
2. **Missing resource**: User navigates to `/alumni/jobs/999` where job `999` does not exist → route-group `not-found.tsx`

**Per-Group NotFound**

- **Public**: "Page not found" with a link to home. Preserves the public layout chrome.
- **Auth**: "Page not found" within the auth card. Preserves the auth layout.
- **Alumni**: "Resource not found" with links to dashboard and relevant sections. Preserves alumni chrome.
- **Admin**: "Resource not found" with links to dashboard. Preserves admin chrome.
- **Legal**: "Page not found" with a link to home. Preserves legal layout.

**Recommended Option**  
Place `not-found.tsx` at each route-group level (currently only the root `not-found.tsx` exists). Each file renders within its group layout's chrome, displaying a domain-appropriate message and navigation links.

**Trade-offs**

- A single root `not-found.tsx` that applies to all routes is simpler but loses domain context. The user seeing an admin-styled 404 page while browsing public pages would be confusing.
- Adding a `not-found.tsx` per route group is the correct balance between consistency and context.

**Industry Best Practice**  
Per-route-group not-found pages with consistent base styling and contextual navigation.

**Recommendation**  
Add `not-found.tsx` files to each of the five route groups. The existing root `not-found.tsx` acts as a catch-all for truly unmatched routes.

---

## 23. Modal Layer

**Purpose**  
Define how modals, dialogs, and overlays are rendered within the layout architecture.

**Engineering Rationale**  
Modals require a portal that renders above the current layout's z-index stack. The portal target should be a container element at the root layout level so that modals overlay the sidebar, topbar, and content equally.

**Recommended Option**  
Implement a `<ModalProvider>` that renders a portal container at the root layout level. The provider exposes an `openModal()` / `closeModal()` API via React context. Modals are rendered as client components inside the portal.

**Placement**: The `<ModalProvider>` belongs in the alumni and admin group layouts (not the root). Public routes do not need modals. If a future requirement calls for a public modal (e.g., image lightbox), it can be added as a page-level concern.

**Key Requirements**

- Modals must trap focus (accessible)
- Modals must close on `Escape` key
- Modals must close on backdrop click (configurable)
- Modals must prevent body scroll while open
- Only one modal should be open at a time (no stacked modals)

**Trade-offs**

- A portal-based approach adds complexity compared to inline modals. However, inline modals cannot overlay the sidebar, which violates the modal pattern.
- Using a third-party library (e.g., `@radix-ui/react-dialog`) reduces implementation effort significantly. Recommend using Radix Dialog as the primitive.

**Industry Best Practice**  
Portal-based modals with focus trapping, escape dismissal, and scroll lock are the WCAG-compliant standard.

**Recommendation**  
Implement modal support using `@radix-ui/react-dialog` with a portal rendered at the root layout level. The provider lives in the authenticated group layouts.

---

## 24. Notification Layer

**Purpose**  
Define how in-app notifications (toasts, alerts, banners) are rendered.

**Engineering Rationale**  
Notifications are ephemeral UI elements that communicate system state, success/failure feedback, or real-time updates. They must overlay the application chrome but not block interaction.

**Notification Types**

- **Toast**: Transient notification (auto-dismiss), bottom-right corner
- **Alert**: Persistent notification requiring user action, center of viewport
- **Banner**: Site-level notification between topbar and content

**Recommended Option**

- **Toasts**: Use a `<ToastProvider>` with `@radix-ui/react-toast` or `sonner`. Place the provider at the root layout level so toasts work across all routes.
- **Alerts**: Use the same `<ModalProvider>` from §23 for alert dialogs.
- **Banners**: Render as a child of the group layout, above the content area.

**Placement**:

- `<ToastProvider>` → Root layout (available everywhere)
- `<ModalProvider>` → Authenticated group layouts
- Banner → Per-group layout, rendered as a conditional element

**Trade-offs**

- Root-level toast provider means toasts could theoretically appear on the public site. This is acceptable — toasts are a transient UI pattern that degrades gracefully.
- `sonner` is recommended over custom toast implementations due to its accessibility support and small bundle size.

**Industry Best Practice**  
Toast notifications use a portal at the application root, with the provider wrapping the entire app tree (see: shadcn/ui, Vercel's own toast implementation).

**Recommendation**  
Integrate `sonner` for toasts at the root layout level. Use the modal infrastructure for alert dialogs. Keep banners as a per-group-layout concern.

---

## 25. Overlay Layer

**Purpose**  
Define how semi-transparent overlays (loaders, blockers, full-screen states) are rendered.

**Engineering Rationale**  
Overlays communicate that the application is in a transient state — saving data, processing a request, or awaiting a response. They differ from modals in that they do not require user interaction to dismiss.

**Overlay Types**

- **Full-screen loader**: Entire application is blocked (rare, used during initial auth check)
- **Section loader**: A specific section (e.g., content area) is blocked
- **Inline loading indicator**: No overlay, just a spinner within the component

**Recommended Option**

- **Full-screen loader**: Implemented as a conditional overlay in the group layout, rendered when the auth session is initializing. Not a portal — simply a positioned overlay within the layout shell.
- **Section loader**: Implemented by individual pages using `loading.tsx` (see §20). Not a separate layer.
- **Inline loading**: Implemented by individual components. Not a layout concern.

**Key Requirement**  
Full-screen loaders must be accessibility-compliant: `role="status"` and `aria-live="polite"` for screen readers.

**Trade-offs**

- Full-screen loaders are often misused. The application should avoid full-screen blocking except during initial auth verification. Prefer granular loading states within the persistent shell.

**Industry Best Practice**  
Full-screen overlays are reserved for initial application bootstrap. After the shell is rendered, all loading states are scoped to the content area.

**Recommendation**  
Do not implement a generic overlay layer. Handle full-screen loading as part of the auth initialization flow in the group layouts. Use `loading.tsx` for content-area loading. Use inline states for component-level loading.

---

## 26. Command Palette Strategy (Future)

**Purpose**  
Define the architectural placeholder for a command palette (⌘K) feature.

**Engineering Rationale**  
A command palette is a power-user feature that allows searching and executing commands across the application. It is not required at launch but must be architecturally anticipated — retrofitting it into the layout layer is significantly more expensive than leaving a slot.

**Recommended Option**  
Reserve a `<CommandPalette>` slot in the authenticated group layouts. The slot renders `null` by default and is replaced by the command palette component when implemented.

**Architecture**

- The command palette is rendered as a portal at the root layout level
- It is triggered by `Meta+K` / `Ctrl+K` keyboard shortcut
- It is registered at the authenticated group layout level
- Commands are registered by features (decentralized command registration)

**Trade-offs**

- A `null` slot adds negligible overhead (~5 lines of JSX). The alternative — retrofitting into every layout file later — would be far more disruptive.

**Industry Best Practice**  
Command palettes (Linear, GitHub, VS Code) are implemented as a top-level portal with a keyboard shortcut listener registered once at the app shell level.

**Recommendation**  
Add a commented placeholder or a `null`-rendering `<CommandPaletteSlot />` component in the authenticated layout implementations. Document the integration contract for future implementation.

---

## 27. Accessibility Strategy

**Purpose**  
Define the accessibility requirements for all layout elements.

**Engineering Rationale**  
The application must comply with WCAG 2.2 AA standards. Layout-level accessibility — semantic structure, keyboard navigation, focus management, and screen reader announcements — is foundational to overall accessibility.

**Requirements**

1. **Semantic HTML**: Use `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` elements in layouts
2. **Skip Link**: A "Skip to content" link as the first focusable element on every page
3. **Landmarks**: Each layout section must have an `aria-label` or `aria-labelledby`:
   - `nav` → `aria-label="Main navigation"`
   - `aside` → `aria-label="Sidebar navigation"`
   - `main` → `role="main"` or implicit `<main>` element
4. **Focus Management**: When a modal opens, focus is trapped within it. When it closes, focus returns to the triggering element.
5. **Keyboard Navigation**: All interactive elements in the sidebar and topbar must be keyboard-accessible (Tab order, Enter/Space activation)
6. **Reduced Motion**: Respect `prefers-reduced-motion` for all animations in layouts
7. **Color Contrast**: All text in layouts must meet WCAG AA contrast ratios (4.5:1 normal, 3:1 large)

**Skip Link Implementation**  
The skip link is the first focusable child of `<body>`. It is visually hidden until focused (via `focus:not-sr-only`). When activated, it moves focus to the `<main>` element.

**Recommended Option**  
Implement a `<SkipLink>` component in the root layout. Add `aria-label` attributes to all navigation sections. Ensure all interactive elements receive visible focus indicators (default browser focus ring is acceptable).

**Trade-offs**

- Adding explicit focus indicators may conflict with design preferences. Use the browser default ring (`outline: 2px solid`) to maintain accessibility without custom CSS maintenance.
- An `aria-label` on the `<nav>` element is not strictly required if there is only one `<nav>` per page, but it is a best practice.

**Industry Best Practice**  
WCAG 2.2 AA compliance requires skip links, semantic landmarks, keyboard accessibility, and focus management. The WAI-ARIA Authoring Practices Guide provides detailed guidance.

**Recommendation**  
Add a skip link to the root layout. Add `aria-label` attributes to all layout landmarks. Ensure focus indicators are visible on all interactive elements. The existing layout structure (using semantic HTML elements) already provides a strong baseline.

---

## 28. Animation Strategy

**Purpose**  
Define the animation philosophy for layout transitions and interactions.

**Engineering Rationale**  
Animations improve perceived performance and provide spatial orientation during navigation. However, excessive or unnecessary animations degrade performance and cause accessibility issues. The layout layer must define a restrained, purposeful animation vocabulary.

**Animation Types**

- **Page transitions**: The content area fades in on navigation (opacity 0→1, 200ms)
- **Sidebar collapse**: Width transitions smoothly (150ms ease-in-out)
- **Mobile drawer**: Slides in from the left (250ms ease-out)
- **Hover states**: Instant or very fast (100ms) for interactive elements
- **Loading skeletons**: Pulse animation (1.5s cycle)

**Performance Requirements**

- All animations must use `transform` and `opacity` only (GPU-composited properties)
- No animations on page load (use `motion-reduce` / `prefers-reduced-motion`)
- No layout-triggering animations (avoid animating `width`, `height`, `top`, `left`)
- Animation duration must not exceed 300ms for functional animations

**Recommended Option**  
Use CSS transitions and animations for all layout-level motion. Avoid JavaScript animation libraries (Framer Motion, GSAP) for layout primitives — they add bundle weight for effects that CSS handles natively. Reserve JavaScript animations for page-level micro-interactions and feature animations (Stage 6+).

**Trade-offs**

- CSS animations are less expressive than Framer Motion for complex orchestrated sequences. However, layout animations are intentionally simple — opacity fades, width transitions, and slide-ins. CSS handles these perfectly.
- `prefers-reduced-motion` support requires adding `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; } }` to the global CSS.

**Industry Best Practice**  
CSS-only animations for application shells, JavaScript animations for feature-level interactions (see: Vercel, Linear — both use CSS for shell transitions).

**Recommendation**  
Implement all layout animations in CSS. Add `prefers-reduced-motion` support globally. Reserve JavaScript animation libraries for feature-level work.

---

## 29. Performance Strategy

**Purpose**  
Define performance targets and optimization strategies for the layout layer.

**Engineering Rationale**  
The layout layer is rendered on every navigation. Its performance directly impacts Core Web Vitals (LCP, CLS, INP). A sluggish layout makes the entire application feel slow.

**Performance Targets**

| Metric                          | Target  |
| ------------------------------- | ------- |
| Time to First Byte (TTFB)       | < 200ms |
| First Contentful Paint (FCP)    | < 1.0s  |
| Largest Contentful Paint (LCP)  | < 1.5s  |
| Cumulative Layout Shift (CLS)   | < 0.05  |
| Interaction to Next Paint (INP) | < 100ms |

**Optimization Strategies**

1. **Server Components by default**: All layout files are Server Components unless interactivity requires `"use client"`. This eliminates client-side JavaScript for layout rendering.
2. **Minimal client islands**: Only interactive elements (NavLink, MobileDrawer toggle, ThemeToggle) are client components. Each is small and independently loaded.
3. **CSS Grid for shell**: CSS Grid avoids JavaScript layout calculations and is GPU-accelerated.
4. **Font loading**: Use `next/font` with `display="swap"` and preconnect to font CDN.
5. **No layout-level data fetching**: Layouts should not fetch data that pages could fetch. This prevents layout-induced waterfall.
6. **CSS animations over JavaScript**: CSS animations run on the compositor thread and do not block the main thread.
7. **Preconnect to APIs**: Add `<link rel="preconnect">` for API origins in the root layout's head.

**Bundle Budget**  
The total JavaScript footprint for layout-level client components must not exceed 15 KB (minified + gzipped), excluding third-party provider libraries.

**Recommended Option**  
Conduct a layout-based performance audit after implementation. Use Next.js `next dev --turbo` for development and production builds for final measurements.

**Trade-offs**

- Aggressive server component usage means some navigational features (like real-time unread counts in the sidebar) require client islands. These are acceptable trade-offs — the server still renders the initial state.

**Industry Best Practice**  
Next.js performance best practices align with the strategies listed above (see: Next.js Performance docs, Web Vitals).

**Recommendation**  
Follow the optimization strategies above. Enforce the bundle budget during code review. Measure Core Web Vitals in CI.

---

## 30. Layout State Management

**Purpose**  
Define how layout-level state (sidebar state, mobile drawer, theme) is managed.

**Engineering Rationale**  
Layout state is UI-only state — it does not represent business data. It must be managed with the simplest possible mechanism. Global state management libraries (zustand, redux) are not justified for layout state.

**State Inventory**

| State                      | Scope          | Mechanism                               |
| -------------------------- | -------------- | --------------------------------------- |
| Sidebar expanded/collapsed | Alumni + Admin | Cookie + CSS class                      |
| Mobile drawer open/closed  | Alumni + Admin | React `useState` in group layout        |
| Theme (light/dark/system)  | Global         | `next-themes` (localStorage)            |
| Active nav item            | Alumni + Admin | Derived from `usePathname()` (computed) |

**Recommended Option**

- **Sidebar state**: A cookie read by the server layout, toggled by a client component. The cookie value is a boolean (`expanded=true`). Server renders the correct initial CSS class; client toggles and updates the cookie. For the toggle component, use a `"use client"` island.
- **Mobile drawer**: Local React state in the group layout. No persistence required — the drawer always opens closed.
- **Theme**: Fully managed by `next-themes`. No custom state needed.
- **Active nav item**: Derived state from `usePathname()`. No persistence needed.

**Trade-offs**

- Cookie-based sidebar state means the preference is sent with every HTTP request. The overhead is negligible (a few bytes). localStorage-only would not persist across SSR.
- React context for sidebar state is unnecessary — the state is consumed by only 2-3 components (sidebar toggle, mobile drawer trigger) within the same layout tree. Prop drilling is sufficient.

**Industry Best Practice**  
Layout preferences stored as cookies; transient UI state managed locally; derived state never stored.

**Recommendation**  
Implement the state management strategy as defined above. Do not introduce a state management library for layout concerns.

---

## 31. Scroll Management

**Purpose**  
Define scroll behavior across navigations and content areas.

**Engineering Rationale**  
The application shell has two scrollable contexts: the content area (within the layout grid) and individual pages. Scroll position must be managed to avoid disorienting the user during navigation.

**Scroll Rules**

1. **Content area scrolls independently**: The sidebar and topbar remain fixed while the content area scrolls.
2. **Restore scroll position on back navigation**: Next.js automatically restores scroll position for `history.back()` within the same layout.
3. **Reset scroll position on forward navigation**: When navigating to a new page, the content area scrolls to top.
4. **No body scroll**: The `<body>` element should have `overflow: hidden` on authenticated layouts to prevent double scrollbars.
5. **Modal scroll lock**: When a modal is open, the content area should not scroll.

**Recommended Option**

- The `<body>` overflow is controlled by a CSS class applied by the layout. Authenticated layouts add `overflow-hidden` to body.
- Content area scrolling is managed by `overflow-y: auto` on the content grid cell.
- Next.js handles scroll restoration automatically via the App Router.
- Modal scroll lock is handled by the modal provider (see §23) — it applies `overflow: hidden` to the content area when a modal is open.

**Trade-offs**

- Disabling body scroll on authenticated layouts prevents the browser's native overscroll behavior. This is intentional — overscroll can reveal the page background behind the layout shell, which looks unpolished.

**Industry Best Practice**  
Application shells universally disable body scroll and manage scroll within the content area (see: Linear, Notion, VS Code).

**Recommendation**  
Apply `overflow: hidden` to `<body>` in authenticated layouts via a CSS class. Let the content area handle scrolling with `overflow-y: auto`.

---

## 32. Layout Security Considerations

**Purpose**  
Identify security concerns relevant to the layout layer.

**Engineering Rationale**  
While layouts are primarily concerned with UI structure, they also render content that depends on authentication and authorization state. Security misconfigurations in the layout layer can leak information or provide incorrect access.

**Security Requirements**

1. **Never render auth-only content in public layouts**: Public routes must never include user-specific chrome (avatars, notifications, admin links).
2. **Never pre-fetch admin data in alumni layouts**: The alumni layout must not query admin-only endpoints.
3. **Conditional rendering ≠ security**: Hiding an admin link in the sidebar is not access control. The `proxy.ts` middleware (Stage 2) and page-level checks handle actual authorization. The layout simply respects those boundaries.
4. **Error boundaries must not leak information**: Error messages in auth and admin layouts must be generic (see §21).
5. **No secrets in layout components**: Layout files are Server Components and may contain server-side logic. Never embed secrets, tokens, or API keys.

**Recommended Option**  
The existing Stage 2 proxy middleware handles route-level authorization. Layouts should not perform authorization checks — they render chrome based on the route group they belong to. If a user reaches an admin route, the proxy has already verified their role. The layout trusts this.

**Trade-offs**

- Rendering chrome based solely on route group assumes the middleware has already enforced access. This is correct — defense in depth is achieved by adding page-level checks (e.g., `hasAccess()` from `route-protection.ts`), but the layout layer does not duplicate these checks.

**Industry Best Practice**  
Middleware enforces route access, layouts render chrome, pages check granular permissions. Each layer trusts the layer above it.

**Recommendation**  
Do not add authorization logic to layout components. Rely on the middleware for route-level access control and page-level utilities for granular permission checks.

---

## 33. Layout Maintainability Guidelines

**Purpose**  
Establish code standards, file organization, and review criteria for layout-related code.

**Engineering Rationale**  
Layouts are long-lived — they persist across feature additions, refactors, and team changes. Maintainability standards prevent layout bloat and architectural drift.

**Guidelines**

1. **One layout file per route group**: Never add a second layout file to an existing route group. If the chrome needs to differ, extract conditional sub-components rather than adding parallel layouts.
2. **Layout files under 150 lines**: If a layout file exceeds 150 lines, extract chrome sections into composable components.
3. **No data fetching in layouts**: Layouts should not call `fetch()`, query databases, or invoke API routes. Data fetching belongs in pages or feature components.
4. **No business logic in layouts**: Conditional rendering based on user role, feature flags, or application state belongs in feature components, not layouts.
5. **Layout components use `Readonly<{children: React.ReactNode}>`**: The TypeScript signature for a layout should never grow additional props — additional data should be fetched by children, not passed from layouts.
6. **CSS is co-located with layouts**: Use Tailwind classes directly in layout files. Do not create separate CSS modules or `.module.css` files for layout styling — the layout file itself is the source of truth.
7. **Test layout boundaries**: Write integration tests for layout + page composition, not for layout DOM structure. Test that loading states render, error boundaries catch, and navigation links exist.

**Recommended Option**  
Codify these guidelines in the project's AGENTS.md and enforce them during code review.

**Trade-offs**

- The "no data fetching in layouts" rule may require additional wrapping components in some cases (e.g., a sidebar that shows the current user's name). Acceptable — the user name should be fetched by a `UserAvatar` component, not by the layout.

**Industry Best Practice**  
These guidelines align with the Next.js team's recommendations for maintainable layouts and the broader industry pattern of "skinny layouts, rich pages."

**Recommendation**  
Adopt and enforce these guidelines. Add them to the project's linting configuration where possible.

---

## 34. Future Expansion Strategy

**Purpose**  
Define how the layout architecture supports future route groups, features, and modules.

**Engineering Rationale**  
The application will grow over time. New route groups (e.g., `(mentor)`, `(faculty)`, `(chapter)`) will need their own layouts. The architecture must accommodate this growth without refactoring existing layouts.

**Expansion Paths**

1. **New role-based group**: Add a new route group folder (e.g., `(mentor)`) with its own `layout.tsx`. The new layout imports `<AuthenticatedShell>` from shared components and passes mentor-specific nav config and branding. No changes to existing layouts.
2. **New public section**: Add a new segment under `(public)` (e.g., `/blog`). No layout changes needed — the public layout automatically wraps it.
3. **Nested sub-layout**: If a section's chrome requirements diverge from the parent group (e.g., `/alumni/admin` needs a different sidebar), add a `layout.tsx` in that subdirectory. This is a last resort — prefer conditional rendering within the group layout.
4. **Feature-based sub-navigation**: For sections with many sub-routes (e.g., jobs with list + detail + create), consider a sub-layout at `/(alumni)/alumni/jobs/layout.tsx` that adds a "back to jobs" breadcrumb and a secondary nav. This is a valid use of nested layouts.

**Backward Compatibility**  
The existing five layouts form a stable base. Adding a new route group does not require modifying any existing layout file — the new group sits alongside the existing ones at the same level in the file tree.

**Recommended Option**  
Document the expansion paths above in the project's architecture documentation. When adding a new route group, follow the pattern established by alumni/admin: create the layout, compose `<AuthenticatedShell>`, and configure nav items in the config module.

**Trade-offs**

- Sub-layouts within a route group can create confusion about which layout is responsible for which chrome. Document the rule: "A sub-layout adds chrome specific to that section; it does not replace the group layout."

**Industry Best Practice**  
Layered architecture with clear extension points is the standard approach for enterprise applications. The Next.js file-system router makes this natural — new route groups are additive, not invasive.

**Recommendation**  
The existing architecture already supports future expansion without modification. Document the expansion patterns for future developers.

---

## 35. Layout Best Practices

**Purpose**  
Summarize the key best practices derived from this specification.

**Engineering Rationale**  
A concise reference of best practices ensures consistent application of the specification across the team.

**The Ten Layout Commandments**

1. **Server-first**: Every layout file is a Server Component by default. Add `"use client"" only for interactive islands.
2. **Compose, don't inherit**: Extract shared chrome into composable components. Layouts import these components; they do not extend a base layout.
3. **One layout per route group**: Exactly one layout file per route group. No more, no fewer.
4. **Layouts do not fetch data**: Data fetching belongs in pages and feature components. Layouts provide structure, not data.
5. **Layouts do not hold business logic**: Conditional rendering based on roles, permissions, or feature flags belongs in feature components.
6. **Error boundaries at every group**: Each route group has its own `error.tsx` with domain-appropriate messaging.
7. **Loading states with chrome**: Each `loading.tsx` renders the real layout chrome and skeletons, not a simple spinner.
8. **Responsive via CSS**: All responsive layout changes use Tailwind breakpoints. No JavaScript media queries for layout.
9. **Accessibility is structural**: Semantic HTML, skip links, `aria-label`s on landmarks, and keyboard navigation are non-negotiable.
10. **CSS animations only**: Layout animations use CSS transitions and animations. No JavaScript animation libraries for the shell.

**Verification Checklist**  
Before merging any layout change:

- [ ] Is the layout a Server Component? (No `"use client"` unless necessary)
- [ ] Does it render semantic HTML? (`<header>`, `<nav>`, `<main>`, `<footer>`)
- [ ] Does it have a skip link? (Root layout)
- [ ] Does it have `aria-label` on navigation landmarks?
- [ ] Does it respect `prefers-reduced-motion`?
- [ ] Is it responsive? (Mobile, tablet, desktop)
- [ ] Does it have an error boundary? (Per group)
- [ ] Does it have a loading state? (Per group)
- [ ] Is it under 150 lines? (If not, extract components)
- [ ] Does it avoid data fetching? (If not, move to feature component)

**Recommended Option**  
Add the verification checklist to the project's pull request template and CI pipeline.

**Trade-offs**

- A detailed checklist may feel bureaucratic for small teams. However, layout bugs are disproportionately expensive to fix after they reach production. The checklist is insurance.

**Industry Best Practice**  
Checklists in software engineering are proven to reduce defects and improve consistency (see: The Checklist Manifesto, Google's engineering practices).

**Recommendation**  
Adopt the ten commandments and verification checklist as part of the project's engineering standards.
