# Project Foundation Specification v1.0

**Project:** JJCET Alumni Website
**Stage:** 0 — Project Foundation
**Date:** 2026-07-07
**Status:** Approved
**Target Client:** `client-new` (Next.js 16 · React 19 · Tailwind CSS v4 · TypeScript 5)

---

## 1. Project Identity

### 1.1 Project Name

JJCET Alumni Website

### 1.2 Purpose

The official digital platform connecting JJCET alumni with the institution. The system bridges alumni across batches, departments, and geographies, enabling reconnection, participation, communication, and contribution to college life.

### 1.3 Goals

- Reconnect alumni with the institution and each other
- Maintain verified alumni identity through a Single Source of Truth
- Enable alumni participation in events, mentoring, guest lectures, placements, internships, sponsorships, and donations
- Provide a secure administrative backend for managing the alumni database
- Scale to support the complete alumni lifecycle from registration to active engagement

### 1.4 Target Users

- **Public Visitors** — unauthenticated users browsing the landing page and alumni directory
- **Registered Alumni** — verified alumni with authenticated access to dashboards, profiles, events, and announcements
- **Administrators** — institutional staff managing master_alumni records, user accounts, verification requests, events, and announcements

### 1.5 Business Scope

- Alumni registration and email-based identity verification
- Alumni verification request workflow (email correction, new alumni addition)
- Alumni profile management
- Event management (creation, registration, attendance)
- Announcements and communications
- Administrative dashboard for master_alumni management
- Role-based access control

### 1.6 Future Scope

- Multi-college federation
- AI-powered alumni assistant
- Real-time chat and notifications
- Mobile application
- Career portal and job board
- Mentorship program matching
- Donation and sponsorship management
- Advanced analytics and reporting

### 1.7 Non-Goals

- Backend API implementation (handled by Spring Boot server)
- Database schema design (handled by server-layer JPA entities)
- Infrastructure provisioning
- Third-party OAuth provider integration (email verification only)
- Payment processing (future scope)
- Mobile app development (future scope)

---

## 2. Business Architecture

### 2.1 Business Actors

| Actor             | Type         | Authenticated | Capabilities                                                                                           |
| ----------------- | ------------ | ------------- | ------------------------------------------------------------------------------------------------------ |
| Public Visitor    | Unregistered | No            | Browse landing, search alumni, attempt registration, submit verification request                       |
| Registered Alumni | User         | Yes           | Dashboard, profile management, event registration, announcements                                       |
| Administrator     | Admin        | Yes           | Manage master_alumni, manage users, approve verification requests, manage events, manage announcements |

### 2.2 Responsibilities

**Public Visitor**

- Browse the landing page and public alumni directory
- Initiate registration by providing email
- Submit a verification request if email is not found in master_alumni

**Registered Alumni**

- Access personalized dashboard
- View and update own profile (limited to non-master fields)
- Register for events
- View announcements
- Cannot modify master_alumni data directly

**Administrator**

- Full CRUD on master_alumni records
- Approve or reject verification requests
- Manage user accounts
- Create and manage events
- Post announcements
- View system analytics

### 2.3 Identity Model

```
master_alumni (Single Source of Truth)
  ├── register_number (UNIQUE, immutable)
  ├── name, department, degree, batch, year_of_passing
  ├── email, phone, dob, gender, address
  ├── company, designation, profession
  ├── marital_status, availability, current_status
  └── feedback
       │
       │ (1:1, FK on User side)
       ▼
user_account (authentication only)
  ├── username, password_hash
  ├── role (SUPER_ADMIN, ADMIN, USER)
  ├── email_verified, account_status
  └── last_login, created_at
       │
       │ (1:N, nullable FK for NEW_ALUMNI)
       ▼
alumni_request (verification workflow)
  ├── request_type (EMAIL_CORRECTION, NEW_ALUMNI)
  ├── status (PENDING, APPROVED, REJECTED)
  └── payload, admin_notes, resolved_at
```

### 2.4 Registration Pipeline

```
Public Visitor
    │
    ▼
Enter email for registration
    │
    ▼
Search master_alumni by email
    │
    ├── Match found
    │       │
    │       ▼
    │   Send verification email
    │       │
    │       ▼
    │   Email verified
    │       │
    │       ▼
    │   Create user_account (linked to master_alumni)
    │       │
    │       ▼
    │   Authenticated Alumni
    │
    └── No match
            │
            ▼
        Redirect to Verification Request Form
            │
            ▼
        Submit request (EMAIL_CORRECTION or NEW_ALUMNI)
            │
            ▼
        PENDING → Admin reviews
```

### 2.5 Verification Pipeline

```
Alumni Verification Request submitted
    │
    ▼
Admin reviews in admin dashboard
    │
    ├── APPROVED
    │       │
    │       ├── EMAIL_CORRECTION: Admin updates email in master_alumni
    │       └── NEW_ALUMNI: Admin creates record in master_alumni
    │       │
    │       ▼
    │   Approval email sent to user
    │       │
    │       ▼
    │   User retries registration with email → Account created
    │
    └── REJECTED
            │
            ▼
        Rejection email with reason
```

### 2.6 Administrative Workflow

- Admin logs in with SUPER_ADMIN or ADMIN role
- Admin dashboard displays pending requests, user stats, master_alumni stats
- Admin can search, filter, and edit master_alumni records
- Admin can approve/reject verification requests with notes
- Admin can create events and post announcements
- All admin actions are logged for audit

---

## 3. Technology Decisions

### 3.1 Frontend Stack

| Technology   | Version | Purpose                         |
| ------------ | ------- | ------------------------------- |
| Next.js      | 16.2.10 | React framework with App Router |
| React        | 19.2.4  | UI library                      |
| TypeScript   | 5.x     | Type safety                     |
| Tailwind CSS | 4.x     | Utility-first styling           |
| ESLint       | 9.x     | Code quality                    |

### 3.2 Backend Stack

| Technology      | Version | Purpose                          |
| --------------- | ------- | -------------------------------- |
| Java            | 21      | Runtime                          |
| Spring Boot     | 3.5.16  | Application framework            |
| Spring Security | 3.5.x   | Authentication and authorization |
| Spring Data JPA | 3.5.x   | Data access                      |
| Hibernate       | 6.x     | ORM                              |

### 3.3 Database

- **MySQL 8** — Primary database
- All schema managed by JPA entities on the server side
- Frontend has zero direct database access

### 3.4 Authentication

- **JWT-based authentication** issued by Spring Boot backend
- Frontend stores token in HTTP-only cookies or secure storage
- Role-based access control via JWT claims
- Session invalidation on server side

### 3.5 Package Manager

- **npm** (lockfile: `package-lock.json`)

### 3.6 Runtime

- **Node.js** (version as required by Next.js 16)
- Client-side rendering with selective server-side rendering via Next.js App Router

### 3.7 Deployment Strategy

- Static export or Node.js server deployment via Vercel / equivalent
- Environment-specific configuration via `NEXT_PUBLIC_*` environment variables
- Staged deployment: development → staging → production
- CI/CD pipeline using GitHub Actions

---

## 4. Frontend Engineering Principles

### 4.1 Feature-First Organization

Code is organized by business feature, not by technical type. Features are self-contained modules with their own components, hooks, types, and utilities. This principle governs folder structure, module boundaries, and dependency direction.

### 4.2 Single Responsibility

Every module, component, function, and file has exactly one reason to change. A component renders UI. A hook manages stateful logic. A utility performs a calculation. These concerns never mix.

### 4.3 Composition over Configuration

Systems are built by composing small, focused units rather than configuring large, monolithic ones. Layouts compose sections. Pages compose features. Components compose smaller components.

### 4.4 Local before Shared

Code starts local to its feature. Only when a pattern is proven reusable across at least two independent features does it graduate to a shared layer. This prevents premature abstraction and keeps the shared layer lean.

### 4.5 Convention over Configuration

Naming patterns, file placement, and export strategies follow fixed conventions. If a file follows the naming convention, its role is immediately understood without reading its contents. This reduces decision fatigue and improves navigability.

### 4.6 Explicit Dependencies

Every module declares its dependencies explicitly. No implicit globals, no magically resolved modules, no hidden side effects. Imports are traceable and deterministic.

### 4.7 Boundary Separation

Presentation logic never contains business logic. Data fetching never lives inside visual components. State management never leaks into rendering logic. Each concern has a dedicated layer with strict boundaries.

### 4.8 Scalability First

Every architectural decision is evaluated against the question: "Does this scale to 10x the current requirement?" Folder structures, routing, state management, and component design all assume future growth.

### 4.9 Maintainability over Cleverness

Code is written for readability and long-term maintenance first. Clever optimizations, advanced type gymnastics, and framework trickery are avoided unless performance measurements prove their necessity.

### 4.10 Consistency over Perfect

When multiple approaches are equally valid, the team chooses one and follows it everywhere. Consistent patterns, even if imperfect, are preferred over a collection of individually optimized but incompatible approaches.

---

## 5. Architecture Philosophy

### 5.1 Why Feature-First Architecture

Feature-first architecture groups code by business capability rather than by technical concern. This is the foundational organizational principle because:

- **Cohesion** — Everything related to "events" lives together: the event page, event components, event hooks, event types, event API calls. A developer working on events navigates a single directory, not ten scattered folders.
- **Autonomy** — Features can be developed, tested, and deployed independently. Multiple teams (or multiple future stages) can work on different features without merge conflicts.
- **Discoverability** — A new developer looking for "how does the dashboard work" opens `features/dashboard/` and immediately sees all relevant files.
- **Scalability** — As the application grows (events, mentorship, job board, donations), each new capability slots into its own feature folder without restructuring existing code.
- **Removability** — If a feature is deprecated, deleting its folder removes the entire capability with no orphaned code elsewhere.

### 5.2 Why Section Layer

Sections are the visible regions of a page: Hero, Features, Testimonials, Footer, etc. They exist as a distinct layer because:

- **Page Composition** — A page is a sequence of sections. Sections are reusable across pages. The Home page and the About page may both use the same Testimonials section.
- **Layout Independence** — Sections do not know which layout renders them. A section renders its content and emits events upward. This allows the same section to appear in public and authenticated layouts.
- **Variation Management** — When a section appears differently in different contexts, a single section component handles both variants internally, preventing section proliferation.

### 5.3 Why Component Layer

Components are the atomic UI building blocks. They exist as a distinct layer because:

- **Reusability** — A Button, Card, Modal, or Input is used across every feature and section. Centralizing them prevents duplication and ensures visual consistency.
- **Isolation** — Components have no knowledge of features, pages, or data fetching. They receive props and render UI. This makes them testable, portable, and themeable.
- **Graduation Path** — Components start inside features. When reuse is proven, they graduate to the shared component layer. This prevents premature abstraction.

### 5.4 Why Layout Layer

Layouts provide the structural shell that surrounds page content. They exist as a distinct layer because:

- **Cross-Page Consistency** — Navigation, sidebars, footers, and authentication guards repeat across multiple pages. Defining them once in layouts prevents repetition.
- **Routing Integration** — Layouts map directly to Next.js App Router layout files. A public layout wraps public routes; an admin layout wraps admin routes.
- **State Boundaries** — Layouts manage persistent UI state (sidebar open/closed, theme selection) that survives page navigation within the same layout group.

### 5.5 Why Routing Layer

Routing defines the URL structure and page hierarchy. It exists as a distinct layer because:

- **Information Architecture** — The route structure reflects the application's information architecture. Home, search, alumni dashboard, admin panel — each has a clearly defined URL space.
- **Access Control** — Route groups enforce authentication and authorization boundaries. Unauthenticated users cannot access `/dashboard`; non-admin users cannot access `/admin`.
- **Layout Mapping** — Each route segment maps to a layout. The routing layer is the bridge between URLs and the layout tree.

---

## 6. Layer Development Roadmap

```
Stage 0:  Project Foundation          ← CURRENT STAGE
             │
             ▼
Stage 1:  Environment Layer           — env config, project setup
             │
             ▼
Stage 2:  Routing Layer               — App Router structure, route groups
             │
             ▼
Stage 3:  Layout Layer                — public, auth, admin, dashboard layouts
             │
             ▼
Stage 4:  Page Layer                  — page.tsx files, data fetching on pages
             │
             ▼
Stage 5:  Feature Layer               — feature modules (auth, alumni, events, admin)
             │
             ▼
Stage 6:  Section Layer               — reusable page sections (Hero, Features, etc.)
             │
             ▼
Stage 7:  Feature Component Layer     — components scoped to a single feature
             │
             ▼
Stage 8:  Styling Layer               — Tailwind config, design tokens, global styles
             │
             ▼
Stage 9:  Shared Component Layer      — Button, Card, Input, Modal, etc.
             │
             ▼
Stage 10: Type Layer                  — TypeScript interfaces and types
             │
             ▼
Stage 11: Constants Layer             — application-wide constants and enums
             │
             ▼
Stage 12: Utility Layer               — pure helper functions
             │
             ▼
Stage 13: Data / API Layer            — API client, request functions, react-query
             │
             ▼
Stage 14: Hook Layer                  — custom React hooks
             │
             ▼
Stage 15: State Layer                 — global state (auth, UI, preferences)
             │
             ▼
Stage 16: Security Layer              — auth middleware, route protection, CSRF
             │
             ▼
Stage 17: Performance Layer           — code splitting, lazy loading, caching
             │
             ▼
Stage 18: Accessibility Layer         — ARIA, keyboard nav, screen reader support
             │
             ▼
Stage 19: Testing Layer               — unit, integration, E2E tests
             │
             ▼
Stage 20: Deployment Layer            — CI/CD, environment config, build, deploy
             │
             ▼
Stage 21: Monitoring & Observability  — error tracking, analytics, performance monitoring
```

Build order rationale:

1. **Foundation first** — Without clear principles, every decision is arbitrary.
2. **Environment before code** — Configuration must exist before any code runs.
3. **Structure before content** — Routes, layouts, and pages define the skeleton.
4. **Feature before shared** — Features establish usage patterns; shared code emerges from real needs, not guesses.
5. **Building blocks after features** — Components, types, and utilities are extracted from working features.
6. **Horizontal layers after vertical** — Styling, API, state, security, and performance cut across all features and must be implemented after features exist to validate their correctness.
7. **Quality at the end** — Testing, deployment, and monitoring wrap the system after core functionality is stable.

---

## 7. Layer Dependency Matrix

### 7.1 Environment Layer (Stage 1)

| Property       | Value                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------ |
| **Purpose**    | Define environment variables, project configuration, and tooling setup                     |
| **Inputs**     | Project Foundation specification                                                           |
| **Outputs**    | `.env.local`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs` |
| **Depends On** | Stage 0 (Foundation)                                                                       |
| **Used By**    | Every subsequent stage                                                                     |

### 7.2 Routing Layer (Stage 2)

| Property       | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| **Purpose**    | Define the URL structure, route groups, and page hierarchy via App Router |
| **Inputs**     | Business architecture (actor-based route separation)                      |
| **Outputs**    | Route group directories, `layout.tsx` stubs, `page.tsx` stubs             |
| **Depends On** | Stage 1 (Environment)                                                     |
| **Used By**    | Stage 3 (Layout), Stage 4 (Page)                                          |

### 7.3 Layout Layer (Stage 3)

| Property       | Value                                                                           |
| -------------- | ------------------------------------------------------------------------------- |
| **Purpose**    | Provide structural shells — navigation, headers, footers, sidebars, auth guards |
| **Inputs**     | Route groups from Stage 2                                                       |
| **Outputs**    | Root layout, public layout, auth layout, dashboard layout, admin layout         |
| **Depends On** | Stage 2 (Routing)                                                               |
| **Used By**    | Stage 4 (Page)                                                                  |

### 7.4 Page Layer (Stage 4)

| Property       | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| **Purpose**    | Define page-level composition — which features and sections a page renders |
| **Inputs**     | Layout components from Stage 3                                             |
| **Outputs**    | `page.tsx` files with composed content                                     |
| **Depends On** | Stage 3 (Layout)                                                           |
| **Used By**    | Stage 5 (Feature)                                                          |

### 7.5 Feature Layer (Stage 5)

| Property       | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| **Purpose**    | Implement business capabilities — auth, alumni directory, events, dashboard, admin |
| **Inputs**     | Page shells from Stage 4                                                           |
| **Outputs**    | Feature modules with sections, components, hooks, types, and API calls             |
| **Depends On** | Stage 4 (Page)                                                                     |
| **Used By**    | Stage 6 (Section), Stage 7 (Feature Component)                                     |

### 7.6 Section Layer (Stage 6)

| Property       | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| **Purpose**    | Implement reusable page sections — Hero, Features, Testimonials, AlumniGrid |
| **Inputs**     | Feature context from Stage 5                                                |
| **Outputs**    | Section components consumed by features                                     |
| **Depends On** | Stage 5 (Feature)                                                           |
| **Used By**    | Stage 4 (Page)                                                              |

### 7.7 Feature Component Layer (Stage 7)

| Property       | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| **Purpose**    | Build components scoped to a single feature (never shared across features) |
| **Inputs**     | Feature requirements from Stage 5                                          |
| **Outputs**    | Feature-scoped UI components                                               |
| **Depends On** | Stage 5 (Feature)                                                          |
| **Used By**    | Stage 6 (Section)                                                          |

### 7.8 Styling Layer (Stage 8)

| Property       | Value                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------- |
| **Purpose**    | Define design tokens, Tailwind config extensions, global CSS, typography scale, color palette |
| **Inputs**     | Design philosophy from Stage 0                                                                |
| **Outputs**    | Tailwind config, `globals.css`, design token classes                                          |
| **Depends On** | Stage 0 (Foundation)                                                                          |
| **Used By**    | Stages 3-9                                                                                    |

### 7.9 Shared Component Layer (Stage 9)

| Property       | Value                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| **Purpose**    | Provide reusable UI primitives — Button, Card, Input, Modal, Table, Pagination |
| **Inputs**     | Real reuse patterns extracted from Stage 7                                     |
| **Outputs**    | Shared component library                                                       |
| **Depends On** | Stage 7 (Feature Component), Stage 8 (Styling)                                 |
| **Used By**    | Stages 5-7                                                                     |

### 7.10 Type Layer (Stage 10)

| Property       | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| **Purpose**    | Define shared TypeScript interfaces, enums, and type utilities |
| **Inputs**     | API contracts from server, feature requirements                |
| **Outputs**    | `types/` directory with shared type definitions                |
| **Depends On** | Stage 0 (Foundation)                                           |
| **Used By**    | Stages 5-15                                                    |

### 7.11 Constants Layer (Stage 11)

| Property       | Value                                                                               |
| -------------- | ----------------------------------------------------------------------------------- |
| **Purpose**    | Define application-wide constants — API base URLs, route paths, pagination defaults |
| **Inputs**     | Environment configuration, routing structure                                        |
| **Outputs**    | `constants/` directory                                                              |
| **Depends On** | Stage 2 (Routing)                                                                   |
| **Used By**    | Stages 5-15                                                                         |

### 7.12 Utility Layer (Stage 12)

| Property       | Value                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- |
| **Purpose**    | Provide pure utility functions — date formatting, string manipulation, validation helpers |
| **Inputs**     | Identified reusable logic from feature implementations                                    |
| **Outputs**    | `lib/` directory with utility functions                                                   |
| **Depends On** | Stage 10 (Types)                                                                          |
| **Used By**    | Stages 5-15                                                                               |

### 7.13 Data / API Layer (Stage 13)

| Property       | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| **Purpose**    | Define API client configuration, request functions, and data fetching logic |
| **Inputs**     | Server API contracts                                                        |
| **Outputs**    | `lib/api/` with fetch wrappers and endpoint functions                       |
| **Depends On** | Stage 10 (Types), Stage 12 (Utilities)                                      |
| **Used By**    | Stages 5, 14, 15                                                            |

### 7.14 Hook Layer (Stage 14)

| Property       | Value                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- |
| **Purpose**    | Provide reusable React hooks — `useAuth`, `useDebounce`, `usePagination`, `useMediaQuery` |
| **Inputs**     | State patterns, API layer                                                                 |
| **Outputs**    | `hooks/` directory                                                                        |
| **Depends On** | Stage 13 (Data/API)                                                                       |
| **Used By**    | Stages 5-9                                                                                |

### 7.15 State Layer (Stage 15)

| Property       | Value                                                                           |
| -------------- | ------------------------------------------------------------------------------- |
| **Purpose**    | Manage global application state — authentication, UI preferences, notifications |
| **Inputs**     | Auth flow, UI requirements                                                      |
| **Outputs**    | State stores (Zustand or Context)                                               |
| **Depends On** | Stage 13 (Data/API)                                                             |
| **Used By**    | Stages 5-9                                                                      |

### 7.16 Security Layer (Stage 16)

| Property       | Value                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| **Purpose**    | Enforce authentication, authorization, CSRF protection, input sanitization on frontend |
| **Inputs**     | Auth system, route protection requirements                                             |
| **Outputs**    | Middleware, route guards, protected layouts                                            |
| **Depends On** | Stage 2 (Routing), Stage 15 (State)                                                    |
| **Used By**    | Stages 3-5                                                                             |

### 7.17 Performance Layer (Stage 17)

| Property       | Value                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| **Purpose**    | Optimize bundle size, implement code splitting, lazy loading, caching strategies |
| **Inputs**     | Build analysis, performance budgets                                              |
| **Outputs**    | Dynamic imports, prefetching, cache configurations                               |
| **Depends On** | Stages 1-16                                                                      |
| **Used By**    | Production deployment                                                            |

### 7.18 Accessibility Layer (Stage 18)

| Property       | Value                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------ |
| **Purpose**    | Ensure WCAG 2.2 AA compliance — semantic HTML, ARIA, keyboard navigation, focus management |
| **Inputs**     | Accessibility audit, WCAG guidelines                                                       |
| **Outputs**    | A11y enhancements across all components                                                    |
| **Depends On** | Stages 5-9                                                                                 |
| **Used By**    | Production deployment                                                                      |

### 7.19 Testing Layer (Stage 19)

| Property       | Value                                                 |
| -------------- | ----------------------------------------------------- |
| **Purpose**    | Implement unit, integration, and end-to-end tests     |
| **Inputs**     | All implemented code                                  |
| **Outputs**    | Test files (`.test.ts`, `.spec.ts`, Playwright tests) |
| **Depends On** | Stages 1-16                                           |
| **Used By**    | CI/CD pipeline                                        |

### 7.20 Deployment Layer (Stage 20)

| Property       | Value                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| **Purpose**    | Configure CI/CD, build optimization, environment promotion, deployment automation |
| **Inputs**     | Infrastructure requirements, deployment target specification                      |
| **Outputs**    | CI/CD config, Dockerfile (if needed), deployment scripts                          |
| **Depends On** | Stages 1-19                                                                       |
| **Used By**    | Production                                                                        |

### 7.21 Monitoring & Observability Layer (Stage 21)

| Property       | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| **Purpose**    | Implement error tracking, performance monitoring, user analytics         |
| **Inputs**     | Monitoring tool configuration, alerting requirements                     |
| **Outputs**    | Error boundary integration, analytics setup, performance instrumentation |
| **Depends On** | Stages 1-20                                                              |
| **Used By**    | Operations team                                                          |

---

## 8. Folder Strategy

### 8.1 Folder Philosophy

The folder structure is the system architecture made visible. Every folder communicates intent. Navigation should take less than three seconds to find any file.

### 8.2 Ownership

Each top-level directory in `src/` has a single owner:

| Directory         | Owner                  |
| ----------------- | ---------------------- |
| `src/app/`        | Routing & Layout Layer |
| `src/features/`   | Feature Layer          |
| `src/components/` | Shared Component Layer |
| `src/sections/`   | Section Layer          |
| `src/lib/`        | Utility & Data Layer   |
| `src/hooks/`      | Hook Layer             |
| `src/stores/`     | State Layer            |
| `src/types/`      | Type Layer             |
| `src/constants/`  | Constants Layer        |
| `src/config/`     | Configuration          |
| `public/`         | Static assets          |

### 8.3 Naming Conventions

| Artifact         | Convention                                                 | Example                        |
| ---------------- | ---------------------------------------------------------- | ------------------------------ |
| Directories      | `kebab-case`                                               | `features/event-registration/` |
| React components | `PascalCase.tsx`                                           | `EventCard.tsx`                |
| Hooks            | `camelCase.ts`                                             | `useEventRegistration.ts`      |
| Utilities        | `camelCase.ts`                                             | `formatDate.ts`                |
| Types            | `PascalCase.ts`                                            | `EventTypes.ts`                |
| Constants        | `SCREAMING_SNAKE_CASE` for values, `camelCase.ts` for file | `API_ROUTES.ts`                |
| Page files       | `page.tsx`                                                 | `page.tsx`                     |
| Layout files     | `layout.tsx`                                               | `layout.tsx`                   |
| Loading files    | `loading.tsx`                                              | `loading.tsx`                  |
| Error files      | `error.tsx`                                                | `error.tsx`                    |
| Test files       | `*.test.tsx` or `*.spec.ts`                                | `Button.test.tsx`              |

### 8.4 Feature Module Structure

```
src/features/<feature-name>/
├── components/       # Feature-scoped components
├── hooks/            # Feature-scoped hooks
├── types/            # Feature-scoped types
├── constants/        # Feature-scoped constants
├── utils/            # Feature-scoped utilities
├── api/              # Feature-scoped API calls
├── <FeaturePage>.tsx # Feature's page-level composition (if applicable)
└── index.ts          # Public barrel export
```

### 8.5 Growth Strategy

- **New features** are added as new directories under `src/features/`
- **No structural refactoring** is needed to add new capabilities
- **Shared code extraction** is done only after 2+ independent features demonstrate identical patterns
- **Deprecated features** are deleted by removing their directory and cleaning up any shared references

---

## 9. Design Philosophy

### 9.1 Visual Principles

- Clean, professional, and trustworthy — befitting an educational institution's official platform
- Content-forward — typography and spacing take precedence over decorative elements
- Consistent rhythm — every element relates to a unified spacing and sizing system
- Progressive disclosure — information is revealed as needed, never overwhelming the user

### 9.2 Consistency

- One spacing scale across the entire application
- One typography scale across the entire application
- One color semantic system (no ad-hoc colors)
- One component API pattern (all shared components follow identical prop patterns)
- One responsive strategy (mobile-first, single breakpoint system)

### 9.3 Spacing Philosophy

- A single-base spacing unit (e.g., 4px)
- All spacing values are multiples of the base unit
- Consistent padding, margin, and gap values across all components
- No inline spacing overrides in component code — spacing is controlled by the design system

### 9.4 Typography Philosophy

- Limited type scale (3-4 sizes max: small, body, heading, display)
- One primary typeface
- Hierarchy is communicated through size and weight, not color
- Line height and letter spacing are standardized per size

### 9.5 Color Philosophy

- Limited palette (primary, neutral, success, warning, error)
- Colors are semantic, not descriptive — "brand" not "blue", "danger" not "red"
- No hardcoded color values outside the design token system
- Dark mode consideration built at the token level, not ad-hoc

### 9.6 Component Philosophy

- Components accept props, not context
- Components do not fetch data
- Components do not manage application state
- Components are the only layer that outputs DOM elements
- Every component has a consistent loading, empty, error, and success state

### 9.7 Responsive Philosophy

- Mobile-first — base styles target mobile, breakpoints add complexity
- Single breakpoint system (no component-level custom breakpoints)
- Layout changes at breakpoints; component content adapts within
- Navigation is the primary responsive concern — all other patterns follow from it

---

## 10. Quality Standards

### 10.1 Maintainability

- Maximum file length: 300 lines for components, 200 lines for utilities, 150 lines for hooks
- Maximum function length: 50 lines
- Maximum nesting depth: 3 levels
- Every export has a single, obvious purpose
- Barrel files (`index.ts`) explicitly re-export public API

### 10.2 Scalability

- Feature directories are independent — no cross-feature imports
- Shared code has a single source of truth — no duplicated logic across features
- State is as local as possible, as global as necessary
- API layer is replaceable — all API calls go through a single client abstraction

### 10.3 Accessibility

- All interactive elements are keyboard accessible
- All images have alt text
- All forms have associated labels
- Color is never the sole indicator of state
- ARIA landmarks identify page regions

### 10.4 Performance

- Components are code-split at route segment boundaries
- Images are lazy-loaded with explicit dimensions
- No render-blocking third-party scripts
- State updates are batched and debounced where appropriate

### 10.5 Readability

- Descriptive names over abbreviated names
- One export per file (default export for pages and sections, named exports for utilities)
- Consistent import ordering: React → Next.js → third-party → internal alias → relative
- No commented-out code in version control

### 10.6 Consistency

- All files in a directory follow the same pattern
- All similar components follow the same prop naming
- All API calls follow the same error handling pattern
- All constants follow the same naming convention

### 10.7 Code Review Standards

- Every PR is reviewed by at least one other developer
- PRs are smaller than 400 lines of changed code
- Every PR includes or references corresponding documentation
- No PR merges with failing tests
- Review checks: correctness, consistency, accessibility, performance implications, test coverage

---

## 11. Engineering Constraints

### 11.1 Prohibited Patterns

1. **No duplicated logic.** If the same logic appears twice, extract it to a shared utility or hook. Duplication is the primary source of bugs and divergence.

2. **No business logic inside pages.** Pages compose and delegate. They do not compute, validate, or transform data. Business logic lives in features, hooks, or utilities.

3. **No styling inside routing files.** `layout.tsx` and `page.tsx` should never contain Tailwind classes or style definitions. They import styled components or sections.

4. **No shared components before reuse.** A component begins its life inside a feature. Only when a second feature needs it does it graduate to `src/components/`.

5. **No API logic inside UI components.** Components do not call `fetch`, do not import API modules, and do not handle loading/error states directly. They receive data via props from parent features or sections.

6. **No direct database access.** The frontend never connects to the database. All data flows through the backend API.

7. **No inline styles.** All styling uses Tailwind utility classes or the design system. Inline styles defeat theming, responsiveness, and consistency.

8. **No hardcoded strings in components.** Strings are either constants, props, or translatable resources. Hardcoded user-facing strings make localization impossible.

9. **No circular dependencies.** Feature A must never import from Feature B if Feature B imports from Feature A. The dependency graph is acyclic.

10. **No cross-feature imports.** One feature cannot directly import another feature's components, hooks, or types. Shared logic must be extracted to the appropriate shared layer.

11. **No side effects in utility functions.** Utility functions are pure — they take input, return output, and modify nothing.

12. **No magic numbers or strings.** Every literal with semantic meaning is assigned to a named constant.

13. **No nested ternaries.** Conditionals beyond a binary choice use `if/else`, `switch`, or lookup maps.

14. **No `any` types.** Every value has an explicit TypeScript type. `any` defeats type safety and is forbidden.

### 11.2 Enforcement

- Constraint 8 is enforced by the Architecture Review checklist
- Constraint 10 is enforced by ESLint import rules
- Constraint 14 is enforced by `strict: true` in `tsconfig.json` and the `no-explicit-any` ESLint rule
- All constraints are verified during code review

---

## 12. Future Expansion

The architecture is designed to accommodate the following expansions without structural redesign:

### 12.1 Multi-College Federation

- Feature directories are self-contained. A "college" concept can be added as a new feature or as a parameter across existing features
- master_alumni already contains department, batch, and year_of_passing fields that serve as natural filters
- Route structure can support `/colleges/:id/` prefix without changing existing route patterns

### 12.2 AI Assistant

- An AI assistant is a new feature under `src/features/ai-assistant/`
- It consumes existing API endpoints and data structures; no architectural changes needed
- The assistant section renders within existing layouts

### 12.3 Notifications

- Notifications are a horizontal concern added to the state layer
- A notification store integrates with existing auth state
- UI components (toast, notification bell) fit within the existing layout shell

### 12.4 Real-Time Communication

- WebSocket integration lives in the Data/API Layer as a socket client abstraction
- Existing state stores receive real-time updates via the same interface as API responses
- No component or page changes needed — they consume data the same way

### 12.5 Mobile Application

- The API layer abstraction means any mobile client consumes the same API
- The feature-first organization of types means sharing TypeScript types with a React Native app is straightforward
- The architecture document serves as the contract between web and mobile teams

### 12.6 Career Portal

- A new feature: `src/features/career-portal/`
- Leverages existing alumni data, auth, and layout infrastructure
- No architectural changes needed

### 12.7 Mentorship Program

- A new feature: `src/features/mentorship/`
- Uses existing user profiles and notification infrastructure
- Matching logic lives on the server; frontend displays match results

### 12.8 Job Board

- A new feature: `src/features/job-board/`
- Independent of other features except for shared AlumniProfile references
- Admin management of job postings reuses existing admin patterns

---

## 13. Risks

### 13.1 Architectural Risks

| Risk                            | Description                                                                           | Mitigation                                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Over-engineering**            | Stage 0 defines more architecture than the project requires, leading to wasted effort | Stage 0 is intentionally principle-based, not implementation-based. Layers are built only when needed. Features are added incrementally.          |
| **Premature abstraction**       | Code is extracted to shared layers before reuse is proven                             | The "Local before Shared" principle explicitly forbids this. Shared extraction requires 2+ independent consumers.                                 |
| **Feature boundary violations** | Features begin importing from other features, creating coupling                       | ESLint rules enforce no cross-feature imports. Code review catches violations. Shared code is extracted to the appropriate layer.                 |
| **State management entropy**    | State migrates from local to global without discipline                                | State is local by default. Global state is only for: auth, UI preferences, and notifications. Business data state is never global.                |
| **API coupling**                | Frontend becomes tightly coupled to backend API shapes                                | The Data/API layer provides an abstraction. Page-level data transformation happens in feature hooks, not in components.                           |
| **Layout rigidity**             | Layout changes require changes across many pages                                      | Layouts are composed in the routing layer. Pages receive layout via Next.js App Router's nested layout system. Layouts and pages are independent. |

### 13.2 Project Risks

| Risk                        | Description                                                  | Mitigation                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend API instability** | Backend API changes break frontend                           | The API layer is the single point of change. TypeScript types shared between contracts provide compile-time safety.                                              |
| **Scope creep**             | Requirements expand beyond initial scope                     | The modular feature architecture absorbs new requirements without restructuring. The Layer Development Roadmap prioritizes core features first.                  |
| **Developer onboarding**    | New developers cannot navigate the architecture              | Consistent conventions, explicit folder ownership, and this document serve as the primary onboarding reference.                                                  |
| **Technology churn**        | Next.js or React version upgrades require significant rework | The abstraction layers (API, State, Types) shield business logic from framework changes. Upgrade impact is limited to the Routing, Layout, and Component layers. |

---

## 14. Project Foundation Audit

### 14.1 Completeness

| Criterion                          | Status | Notes      |
| ---------------------------------- | ------ | ---------- |
| Project identity defined           | ✅     | Section 1  |
| Business architecture documented   | ✅     | Section 2  |
| Technology decisions specified     | ✅     | Section 3  |
| Engineering principles established | ✅     | Section 4  |
| Architecture philosophy explained  | ✅     | Section 5  |
| Layer roadmap defined              | ✅     | Section 6  |
| Layer dependency matrix provided   | ✅     | Section 7  |
| Folder strategy documented         | ✅     | Section 8  |
| Design philosophy captured         | ✅     | Section 9  |
| Quality standards defined          | ✅     | Section 10 |
| Engineering constraints listed     | ✅     | Section 11 |
| Future expansion covered           | ✅     | Section 12 |
| Risks identified                   | ✅     | Section 13 |

### 14.2 Scalability Assessment

- **Feature scalability:** Excellent. New features are additive — they slot into `src/features/` without restructuring. The architecture supports 10+ features without degradation.
- **Team scalability:** Good. Independent feature directories allow parallel development. Cross-feature communication through shared layers provides coordination without coupling.
- **Data scalability:** Adequate. The architecture assumes the backend handles data complexity. If the frontend needs client-side data caching at scale, the Data/API layer can incorporate a caching library (e.g., TanStack Query) without broader changes.

### 14.3 Maintainability Assessment

- **Strengths:** Clear ownership, consistent conventions, enforced boundaries, explicit dependency declarations.
- **Weaknesses:** The discipline required for the "Local before Shared" principle depends on team culture. Without vigilance, the shared component layer may grow prematurely or inconsistently.

### 14.4 Extensibility Assessment

- **New features:** Trivial — add directory, implement, compose.
- **New layouts:** Moderate — requires routing changes and layout file creation, but existing features are unaffected.
- **New shared components:** Moderate — requires extraction from features, which is straightforward if the component has clean prop interfaces.
- **Framework upgrade:** Moderate — business logic in features is isolated from framework concerns. The Routing and Layout layers are most affected by framework changes.

### 14.5 Engineering Quality Assessment

| Criterion                  | Grade | Notes                                                                 |
| -------------------------- | ----- | --------------------------------------------------------------------- |
| Principle clarity          | A     | Every principle is stated and justified                               |
| Boundary enforcement       | A-    | ESLint rules will enforce no cross-feature imports and no `any` types |
| Documentation completeness | A     | Every layer has purpose, inputs, outputs, and dependencies documented |
| Constraint specificity     | A     | 14 concrete "not allowed" rules with enforcement strategy             |
| Future readiness           | A     | 7 future expansions mapped to specific architectural impact           |

### 14.6 Reported Weaknesses

1. **Testing strategy is deferred to Stage 19.** While this follows the roadmap (quality at the end), early features may accrue untested code. Mitigation: critical path features (auth, registration) should receive tests earlier than Stage 19.

2. **No monitoring tool specified.** The architecture identifies monitoring as Stage 21 but does not prescribe a specific tool (Sentry, Datadog, etc.). This is acceptable as the decision depends on operational environment.

3. **State management library is implied but not specified.** Zustand is present in the existing codebase and is a strong candidate, but the architecture does not mandate it. This is acceptable — the State Layer abstraction allows library substitution.

4. **No internationalization (i18n) consideration.** Current scope does not require multi-language support. The constant string constraint (Section 11.1, rule 8) ensures future i18n integration is feasible. This is acceptable for v1.0.

5. **Design tokens are deferred to Stage 8.** The Styling Layer will define the design token system. While Stage 0 establishes the design philosophy, the actual token definitions require implementation. This is correct per the roadmap.

---

_End of Project Foundation Specification v1.0_
