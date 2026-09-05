# Stage 11 — Constants & Configuration Layer Specification

**Status:** Implemented
**Dependencies:** Stage 10 (Type System Layer), Stage 9 (Shared Component Layer)
**Next:** Stage 12 (Utility Layer)

---

## Table of Contents

1. Constants Philosophy
2. Configuration Philosophy
3. Layer Architecture
4. Constant Classification
5. Configuration Classification
6. Ownership Rules
7. Lifecycle Strategy
8. Route Constants
9. Navigation Constants
10. Authentication Constants
11. Authorization Constants
12. User Role Constants
13. Permission Constants
14. Status Constants
15. Workflow Constants
16. Business Constants
17. Feature Constants
18. Theme Constants — Deferred to Design System
19. Locale Constants
20. Date & Time Constants
21. UI Constants
22. Layout Constants
23. Animation Constants
24. Responsive Breakpoints
25. Validation Constants
26. Pagination Constants
27. Search, Sorting, Filter Constants
28. API Constants
29. HTTP Constants
30. Cache Constants
31. Query Constants
32. Storage Keys
33. Session & Cookie Keys
34. Local Storage Keys
35. Environment Variables
36. Runtime Configuration
37. Feature Flags
38. Error, Success, Warning Codes
39. Analytics Constants
40. Logging Constants
41. Security Constants
42. File Upload & Image Constraints
43. Naming Convention
44. Folder Organization Principles
45. Dependency Rules
46. Promotion Rules
47. Deprecation Strategy
48. Versioning Strategy
49. Documentation Strategy
50. Governance Strategy
51. Performance Considerations
52. Maintainability
53. Scalability
54. Best Practices
55. Engineering Review

---

## 1. Constants Philosophy

### Purpose

Define the fundamental nature of Constants in the application — what they are, how they differ from Configuration, Runtime State, and Runtime Data.

### Engineering Rationale

The current codebase has 50+ locations with scattered magic strings and numbers (roles, section titles, validation limits, pagination defaults, enum values). These are duplicated across type definitions, Zod schemas, components, data layers, and config files. Without a clear philosophy, developers cannot decide where a value belongs, leading to inconsistency.

### Recommended Option

**Constants are immutable, compile-time, globally-predictable values that are version-controlled and never change between environments.**

The four categories of application values:

| Category | Mutability | Environment-Dependent | Source | Example |
|---|---|---|---|---|
| **Constant** | Immutable | No | Code | `PAGE_SIZE = 20`, `ROLE_ADMIN = "admin"` |
| **Configuration** | Immutable at runtime | Yes | Env / Build | `API_BASE_URL`, `SENTRY_DSN` |
| **Runtime State** | Mutable | No | User session | `currentUser`, `activePage` |
| **Runtime Data** | Mutable | No | API responses | `events[]`, `users[]` |

### Decision Rules

| If a value... | It belongs in |
|---|---|
| Is the same in dev, staging, and prod | Constants |
| Varies by environment | Configuration |
| Changes during a user session | Runtime State |
| Comes from the backend | Runtime Data |
| Is a validation boundary | Validation Constants |
| Is a display string | i18n messages file |
| Is a feature toggle | Feature Flags |

### Recommendation

Never hardcode a value that is the same everywhere, equally never use a constant where configuration is needed. The lifecycle decision flowchart determines placement.

---

## 2. Configuration Philosophy

### Purpose

Define how Configuration differs from Constants and how it is managed across environments.

### Engineering Rationale

The current `src/config/env.ts` centralizes `process.env` reads with defaults. This is correct but incomplete — Configuration must include feature flags, runtime config resolved at startup, and build-time config.

### Recommended Option

**Three tiers of Configuration:**

| Tier | Resolved At | Source | Location |
|---|---|---|---|
| **Build-time Config** | `next build` | `.env.production` / CI env | `src/config/` |
| **Runtime Config** | Server startup | Environment variables | `src/config/` |
| **Feature Flags** | Application init / per-request | Config file, API, env | `src/config/flags/` |

### Configuration vs. Constants Decision

A value is Configuration if:
- It differs between development, staging, and production.
- It contains secrets or credentials.
- It is resolved from an environment variable.
- It is set by the deployment platform.

### Recommendation

Configuration is always typed with `satisfies` against a Config interface. Configuration is never imported directly into components — it flows through the data or state layer.

---

## 3. Layer Architecture

### Purpose

Define the position of the Constants & Configuration Layer in the architectural stack.

### Engineering Rationale

Constants is a horizontal layer — every other layer depends on it. However, feature-level constants must not be visible to other features. Configuration flows downward through the app, never upward.

### Recommended Option

```
Application (pages, layouts)
       │
┌──────┴──────┐
│  Constants  │ ← Global constants (shared by all layers)
│  & Config   │
└──────┬──────┘
       │
┌──────┴──────┐
│  Features   │ ← Each feature has its own _constants/
│             │   (NOT exported outside feature)
└──────┬──────┘
       │
┌──────┴──────┐
│  Components │ ← Components import from constants but never define them
└─────────────┘
```

### Dependency Direction

```
Shared Constants ← Config ← Env Variables
        ↓
Feature Constants (private, not shared)
        ↓
Section / Component (consumers only, never producers of constants)
```

### Recommendation

Constants flow downward. No feature imports constants from another feature. Components never define constants — they consume them.

---

## 4. Constant Classification

### Purpose

Define the complete taxonomy of constants in the application.

### Recommended Taxonomy

14 constant classes, each with a specific location and ownership:

| # | Class | Location | Owner | Examples |
|---|---|---|---|---|
| 1 | **Route Constants** | `@/constants/routes.ts` | Architecture | Path prefixes, route names |
| 2 | **Navigation Constants** | `@/config/navigation.ts` (migrate to `@/constants/`) | Architecture | Nav structure |
| 3 | **Auth Constants** | `@/constants/auth.ts` | Auth Feature | Token keys, cookie names |
| 4 | **Role Constants** | `@/constants/roles.ts` | Architecture | Role strings, hierarchy |
| 5 | **Permission Constants** | `@/constants/permissions.ts` | Architecture | Resource list, action list |
| 6 | **Status Constants** | `@/constants/status.ts` | Domain | Event status, job status |
| 7 | **Business Constants** | `@/constants/business.ts` | Domain | Limits, defaults, labels |
| 8 | **UI Constants** | `@/constants/ui.ts` | Design System | Breakpoints, animation durations |
| 9 | **Validation Constants** | `@/constants/validation.ts` | Architecture | Min/max lengths, regex patterns |
| 10 | **API Constants** | `@/constants/api.ts` | Architecture | Timeouts, retry counts, headers |
| 11 | **Storage Constants** | `@/constants/storage.ts` | Architecture | Local storage keys, cookie keys |
| 12 | **Analytics Constants** | `@/constants/analytics.ts` | Analytics | Event names, dimensions |
| 13 | **Security Constants** | `@/constants/security.ts` | Architecture | CSP headers, rate limits |
| 14 | **Feature Constants** | `@/features/*/_constants/` | Feature | Feature-specific limits |

### Rule

Every constant belongs to exactly one class. If a constant does not fit, it is either misclassified or should be promoted.

### Recommendation

Use the taxonomy to determine the location of any new constant.

---

## 5. Configuration Classification

### Purpose

Define the complete taxonomy of configuration values.

### Recommended Taxonomy

| # | Class | Examples | Source |
|---|---|---|---|
| 1 | **App Config** | App name, app URL, app version | `env.ts` |
| 2 | **API Config** | Base URL, timeout | `env.ts` |
| 3 | **Auth Config** | Token key, session duration | `env.ts` |
| 4 | **Sentry Config** | DSN, environment, sample rates | `env.ts` |
| 5 | **Logging Config** | Log level, transport | `env.ts` |
| 6 | **Feature Flags** | Enable/disable feature X | Env + runtime API |
| 7 | **Build Config** | `next.config`, `tsconfig` | Next.js config files |
| 8 | **CI Config** | Test runner, lint, typecheck | `package.json`, CI YAML |

### Rule

Configuration has typed defaults. Every configuration value is read through the `env` object with a fallback. No raw `process.env` reads exist outside `src/config/`.

### Recommendation

Validate configuration at startup with Zod. A missing or invalid env var should fail at launch, not silently.

---

## 6. Ownership Rules

### Purpose

Define who owns each constant and each configuration value.

### Ownership Model

| Scope | Owner | Review Required |
|---|---|---|
| Global Constants | Architecture team | Yes — architecture review |
| Shared Constants | Architecture team | Yes |
| Feature Constants | Feature team | No (private) |
| UI Constants | Design system team | Yes |
| Build Config | DevOps / Infra | Yes |
| Runtime Config | DevOps / Infra | Yes |
| Feature Flags | Product + Architecture | Yes |

### Rule

Feature constants belong to the feature team. They are private to that feature directory and are never imported by other features.

### Recommendation

Enforce feature constant isolation via ESLint `import/no-restricted-paths`.

---

## 7. Lifecycle Strategy

### Purpose

Define how values move through the system and when a constant should be promoted, demoted, or deprecated.

### Decision Flowchart

```
Is the value the same in all environments?
  ├─ No  → Is it a secret?        → Secrets (vault/env)
  │      ├─ No → Is it a toggle?  → Feature Flags
  │      └─ No                     → Configuration (env)
  └─ Yes → Is it a UI string?     → i18n messages
           ├─ Is it business?      → Business Constant
           ├─ Is it technical?     → System Constant
           └─ Is it a limit?       → Validation/UI Constant
```

### Promotion Rules

| Current Location | Candidate For Promotion | Condition |
|---|---|---|
| Hardcoded in component | Constant | Used in 2+ locations |
| Feature-private constant | Shared constant | Used by 2+ features |
| Shared constant | Config | Varies by environment |
| Config | Feature flag | Needs runtime toggling |

### Deprecation

1. Mark `@deprecated` in JSDoc with replacement path.
2. Keep for 2 release cycles.
3. Remove.

### Recommendation

Every constant has a clear lifecycle phase — `new`, `stable`, `deprecated`, `removed`.

---

## 8. Route Constants

### Purpose

Centralize every route path, path prefix, and route segment used in the application.

### Engineering Rationale

The current codebase has route strings hardcoded in: `proxy.ts`, `route-protection.ts`, `navigation.ts`, `breadcrumbs.ts`, `sitemap.ts`, and 28 page files with `force-static`/`force-dynamic`. Any route change requires hunting through all these locations.

### Recommended Option

**Single source of truth for all route paths.**

Categories:

- **Route prefixes:** `"/admin"`, `"/alumni"`, `"/auth"`, `"/legal"` — used in `proxy.ts`, `route-protection.ts`, navigation config.
- **Route patterns:** `"/admin/dashboard"`, `"/alumni/events/[slug]"` — used in navigation, breadcrumbs, links.
- **Auth routes:** `"/auth/login"`, `"/auth/register"` — used in redirects, proxies.
- **Route metadata:** `isPublic`, `isProtected`, `renderStrategy` — derived from classification.

### Implementation Pattern

Route constants are `as const` objects with full type safety. Every route in the application references these constants. No route string literal exists outside `@/constants/routes.ts`.

### Recommendation

Consolidate `proxy.ts` matchers, `route-protection.ts` path checks, navigation hrefs, and breadcrumb segments into a single route constants file.

---

## 9. Navigation Constants

### Purpose

Define the structure and lifecycle of navigation menus.

### Engineering Rationale

Navigation is currently defined in `src/config/navigation.ts` as route arrays. This is correct but belongs in `@/constants/` rather than `@/config/` since navigation is the same in every environment.

### Recommended Option

Navigation constants define:

- **Public navigation** — routes available without authentication.
- **Alumni navigation** — routes available to alumni role users.
- **Admin navigation** — routes available to admin role users.
- **Navigation groups** — logical groupings within each role.

### Ownership

Navigation is owned by the architecture team. Changes to navigation items require architecture review.

### Recommendation

Migrate navigation from `@/config/navigation.ts` to `@/constants/navigation.ts`. Keep the type definitions in the same file since they are not used outside this context.

---

## 10. Authentication Constants

### Purpose

Centralize all authentication-related constant values.

### Recommended Set

- **Token keys:** `AUTH_TOKEN_KEY`, `REFRESH_TOKEN_KEY`
- **Cookie names:** `"session_token"`
- **Session duration:** in milliseconds
- **Auth route paths:** login, register, forgot-password, reset-password, verify
- **Redirect routes:** post-login, post-logout
- **Bcrypt rounds** (if client-side, rare): salt rounds

### Current Issues

- `AUTH_COOKIE_NAME = "session_token"` is in `route-protection.ts` — belongs in auth constants.
- `"auth_token"` default in `env.ts` token key — belongs with other auth constants.
- `"/auth/login"` and `"/alumni/dashboard"` are hardcoded in `proxy.ts` redirects — belong in route constants.

### Recommendation

Consolidate all auth-related strings into `@/constants/auth.ts`.

---

## 11. Authorization Constants

### Purpose

Define the type-level hierarchy and constant representations for authorization.

### Engineering Rationale

Authorization is currently split across `types/domain/session.ts` (UserRole type), `route-protection.ts` (role checks), and 15 page files (`requireRole(user, ["admin"])`). Role strings are duplicated.

### Recommended Approach

**Role constants as a const object with inferred type:**

Role hierarchy is used for `hasAccess` checks. The hierarchy must be a single source of truth so that adding `"super_admin"` does not require hunting through 15 files.

### Recommendations

- Define all roles in `@/constants/roles.ts`.
- Infer the `UserRole` type from the const object.
- Import the roles list into Zod schemas instead of redefining the enum.

---

## 12. User Role Constants

### Purpose

Define the constant representation of user roles.

### Current State

Three roles exist: `"alumni"`, `"admin"`, `"alumni_lead"`. They are defined as:
- A type union in `src/types/domain/session.ts` and `user.ts`.
- Three Zod enums in `src/types/api/user.ts`, `api/auth.ts`, `domain/user.ts`, `domain/session.ts`.
- String literals in `route-protection.ts` (`user.role === "admin"`).
- String literals in 15 admin page files (`requireRole(user, ["admin"])`).

This is the **definition of fragmentation** — the same three strings exist in 20+ locations.

### Recommended Approach

```typescript
// @/constants/roles.ts — single source of truth
const ROLES = ["alumni", "admin", "alumni_lead"] as const;

// Infer the type from the const
type UserRole = (typeof ROLES)[number];
```

- Zod schemas import `ROLES` and use `z.enum(ROLES)`.
- Route protection imports `ROLES` for `hasAccess` checks.
- The type is inferred, never hand-written.

### Recommendation

Single source of truth for all roles. Every role string literal in every file must reference this constant.

---

## 12. Permission Constants

### Purpose

Define constant lists for permission actions, resources, and scopes.

### Current State

Defined as type aliases in `src/types/auth/permissions.ts`:

```typescript
export type PermissionAction = "create" | "read" | "update" | "delete";
export type PermissionResource = "event" | "job" | "user" | "message" | "profile" | "report" | "announcement" | "gallery" | "audit_log" | "settings";
export type PermissionScope = "own" | "all";
```

### Recommended Approach

Promote type aliases to constants with inferred types:

- `PERMISSION_ACTIONS` as const array.
- `PERMISSION_RESOURCES` as const array.
- `PERMISSION_SCOPES` as const array.
- Infer `PermissionAction`, `PermissionResource`, `PermissionScope` from these arrays.

### Location

`@/constants/permissions.ts`

### Recommendation

Constants first, types inferred.

---

## 13. Status Constants

### Purpose

Define status values for domain entities.

### Current State

Status values are defined as string literal types and Zod enums in domain and API type files:
- `EventCategory: "upcoming" | "past"` — in 3 locations.
- `JobType: "full-time" | "part-time" | "contract" | "internship"` — in 3 locations.

### Recommended Approach

Each domain status set is a constant array:

```typescript
// @/constants/status.ts
export const EVENT_CATEGORIES = ["upcoming", "past"] as const;
export const JOB_TYPES = ["full-time", "part-time", "contract", "internship"] as const;
export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export const FILTER_OPERATORS = ["eq", "neq", "gt", "gte", "lt", "lte", "contains"] as const;
```

- Zod schemas use `z.enum(EVENT_CATEGORIES)` and `z.enum(JOB_TYPES)`.
- Domain types infer from these arrays.

### Recommendation

Consolidate all enum-style domain constants into one file. Zod enums reference the same arrays that define the type.

---

## 14. Business Constants

### Purpose

Define business rules expressed as numeric or string constants.

### Current State

- `MAX_VISIBLE_ITEMS = 5` and `MAX_VISIBLE_REQUESTS = 10` in dashboard sections.
- Section titles (`"Recent Activity"`, `"Quick Actions"`, etc.) hardcoded in 18 section files.
- Empty state messages (`"No recent activity."`, `"No pending requests."`, `"No conversations yet."`) hardcoded.

### Recommended Approach

- **Page-size limits** → `@/constants/business.ts` (e.g. `DASHBOARD_MAX_RECENT = 5`).
- **Section titles** → i18n messages file (`messages/en.json`) since they are user-facing strings.
- **Empty state messages** → i18n messages file.

### Location

| What | Where |
|---|---|
| Numeric business limits | `@/constants/business.ts` |
| Section titles | `messages/{locale}.json` |
| Empty messages | `messages/{locale}.json` |
| Default labels | `messages/{locale}.json` |

### Recommendation

Migrate all section titles and empty messages to i18n in Stage 12 (Utility + i18n integration). Numeric limits go to business constants now.

---

## 14. Theme Constants

### Purpose

Define theme-related constants for the design system.

### Engineering Rationale

Theme constants (color tokens, typography scale, spacing) are defined in Stage 8 Styling Layer via CSS custom properties and Tailwind config. The Constants Layer should not redefine them.

### Recommended Approach

**Defer to CSS custom properties and Tailwind config.**

Only define constants that control theme behavior:
- `DEFAULT_THEME: "light" | "dark" | "system"`
- `THEME_STORAGE_KEY: "theme"`
- `THEME_ATTRIBUTE: "class"`

### Location

`@/constants/ui.ts`

### Recommendation

Do not duplicate design tokens in TypeScript constants. CSS custom properties + Tailwind config are the single source of truth for visual properties.

---

## 15. Locale Constants

### Purpose

Define locale-related constants.

### Current State

Defined in `src/config/i18n.ts`:

```typescript
export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
```

### Recommended Approach

Keep in `@/constants/i18n.ts` (migrate from `@/config/`). Add:
- `SUPPORTED_LOCALES`: for validation.
- `LOCALE_LABELS`: `{ en: "English" }` for locale selector UI.
- `LOCALE_DIRECTIONS`: `{ en: "ltr" }` for RTL support.
- `DATE_FORMATS`: per-locale date/time format preferences.

### Recommendation

Locale is a constant (same in all environments). Migrate from config to constants.

---

## 16. Date & Time Constants

### Purpose

Define date/time formats, day names, month names, and timezone constants.

### Recommended Set

- Date format strings: `DISPLAY_DATE_FORMAT = "MMM d, yyyy"`, `DISPLAY_TIME_FORMAT = "h:mm a"`.
- Relative time thresholds: `MS_IN_SECOND`, `MS_IN_MINUTE`, `MS_IN_HOUR`, `MS_IN_DAY`.
- Month and day name arrays (used for locale fallback).

### Location

`@/constants/datetime.ts`

### Recommendation

Format strings are constants, not inline in components.

---

## 17. UI Constants

### Purpose

Define UI-level constants that control component behavior without being visual tokens.

### Recommended Set

| Constant | Value | Purpose |
|---|---|---|
| `TRANSITION_DURATION_FAST` | `150` | Fast animations (ms) |
| `TRANSITION_DURATION_NORMAL` | `200` | Standard animations (ms) |
| `TRANSITION_DURATION_SLOW` | `300` | Emphasis animations (ms) |
| `TOAST_DURATION` | `5000` | Auto-dismiss duration (ms) |
| `TOAST_POSITION` | `"bottom-right"` | Toast position |
| `EMPTY_STATE_MIN_HEIGHT` | `200` | Minimum empty state height (px) |
| `SKELETON_ROWS_DEFAULT` | `5` | Default skeleton rows |
| `SKELETON_COLUMNS_DEFAULT` | `4` | Default skeleton columns |

### Location

`@/constants/ui.ts`

### Recommendation

Migrate inline numeric values from components to UI constants.

---

## 18. Layout Constants

### Purpose

Define layout boundaries, sidebar widths, header heights, and content max-widths.

### Recommended Set

| Constant | Purpose |
|---|---|
| `SIDEBAR_WIDTH` | Desktop sidebar width |
| `SIDEBAR_WIDTH_COLLAPSED` | Collapsed sidebar width |
| `HEADER_HEIGHT` | Top navigation bar height |
| `CONTENT_MAX_WIDTH` | Max content area width |
| `MOBILE_BREAKPOINT` | Mobile vs desktop breakpoint |

### Location

`@/constants/layout.ts`

### Recommendation

Layout constants should match Tailwind config values. Use the same values in both systems.

---

## 19. Animation Constants

### Purpose

Define animation durations, easings, and delay constants.

### Recommended Set

| Constant | Value | Purpose |
|---|---|---|
| `EASE_OUT` | `"ease-out"` | Standard easing |
| `EASE_IN_OUT` | `"ease-in-out"` | Entrance/easing |
| `FADE_DURATION` | `200` | Fade animation |
| `SLIDE_DURATION` | `300` | Slide animation |
| `STAGGER_DELAY` | `50` | Stagger delay for lists |

### Location

`@/constants/animation.ts`

### Recommendation

Animation constants must match Tailwind animation durations to prevent visual mismatch.

---

## 20. Responsive Breakpoints

### Purpose

Define the application's responsive breakpoint values as constants.

### Current State

Breakpoints are defined only in Tailwind config. Components that need responsive logic either rely on Tailwind classes or hardcode breakpoint values.

### Recommended Approach

```typescript
// @/constants/responsive.ts
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;
```

### Recommendation

Breakpoint constants must match Tailwind config. Use for programmatic responsive logic (useMediaQuery, dynamic rendering).

---

## 21. Validation Constants

### Purpose

Define all validation boundaries, regex patterns, and length limits.

### Current State

Validation boundaries are scattered across 35+ Zod schemas:

| Rule | Occurrences | Current Locations |
|---|---|---|
| `.min(1)` (required) | 15+ | Every Zod schema |
| `.min(8)` (password) | 2 | `api/auth.ts`, `api/user.ts` |
| `.min(1).max(100)` (page size) | 1 | `api/common.ts` |
| `.email()` | 4 | `api/auth.ts`, `api/user.ts`, domain schemas |

### Recommended Approach

```typescript
// @/constants/validation.ts
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  BIO_MAX_LENGTH: 2000,
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MIN_LENGTH: 1,
  DESCRIPTION_MAX_LENGTH: 5000,
  EMAIL_MAX_LENGTH: 254,
  PAGE_SIZE_MIN: 1,
  PAGE_SIZE_MAX: 100,
  PAGE_SIZE_DEFAULT: 20,
  PAGE_DEFAULT: 1,
  CONTENT_MIN_LENGTH: 1,
  CONTENT_MAX_LENGTH: 10000,
} as const;
```

Zod schemas reference these constants: `z.string().min(VALIDATION.PASSWORD_MIN_LENGTH).max(VALIDATION.PASSWORD_MAX_LENGTH)`.

### Recommendation

All validation boundaries are centralized. No magic numbers in Zod schemas or form validation.

---

## 22. Pagination Constants

### Purpose

Define pagination defaults and limits.

### Current State

- Default page size `20` in `api/common.ts` Zod schema.
- Min `1` max `100` for pageSize.
- Default page `1`.

### Recommended Approach

```typescript
// @/constants/api.ts
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MIN_PAGE_SIZE: 1,
  MAX_PAGE_SIZE: 100,
} as const;
```

### Recommendation

Pagination constants in `@/constants/api.ts`, imported by Zod schemas and UI components.

---

## 23. Search, Sorting, Filter Constants

### Purpose

Define constant values for search, sort, and filter operations.

### Recommended Set

```typescript
// @/constants/api.ts
export const SEARCH = {
  DEBOUNCE_MS: 300,
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 200,
} as const;

export const SORT_DIRECTIONS = ["asc", "desc"] as const;
```

### Recommendation

Search debounce timing is a constant, not hardcoded in search hooks.

---

## 24. API Constants

### Purpose

Define constants related to API communication.

### Recommended Set

| Constant | Value | Purpose |
|---|---|---|
| `API_TIMEOUT_MS` | 30000 | Default request timeout |
| `API_RETRY_COUNT` | 3 | Max retries on failure |
| `API_RETRY_DELAY_MS` | 1000 | Base retry delay |
| `PAGINATION_DEFAULT_PAGE_SIZE` | 20 | Default items per page |
| `CONTENT_TYPE_JSON` | `"application/json"` | Request content type |
| `AUTH_HEADER_PREFIX` | `"Bearer "` | Token prefix |

### Location

`@/constants/api.ts`

### Recommendation

API timeout should be both a constant (default) and configurable via env.

---

## 25. HTTP Constants

### Purpose

Define HTTP status codes and common headers.

### Recommended Set

```typescript
// @/constants/http.ts
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
} as const;

export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;
```

### Location

`@/constants/http.ts`

### Recommendation

Never hardcode numeric status codes in data fetching or error handling.

---

## 26. Cache Constants

### Purpose

Define cache TTL values, revalidation intervals, and stale-while-revalidate durations.

### Current State

- `export const revalidate = 3600;` in 2 page files (ISR interval).

### Recommended Set

```typescript
// @/constants/cache.ts
export const CACHE_TTL = {
  REVALIDATE_EVENT: 3600,        // 1 hour
  REVALIDATE_DIRECTORY: 3600,    // 1 hour
  REVALIDATE_PROFILE: 300,       // 5 minutes
  REVALIDATE_STATIC: 86400,      // 24 hours
  STALE_TIME: 30000,             // 30 seconds (SWR)
  GC_TIME: 300000,              // 5 minutes
} as const;

export const RENDER_STRATEGIES = {
  SSG: "SSG",
  ISR: "ISR",
  SSR: "SSR",
} as const;
```

### Location

`@/constants/cache.ts`

### Recommendation

ISR revalidation intervals are constants, not inline numbers in page files.

---

## 27. Query Constants

### Purpose

Define React Query / SWR query key constants and stale times.

### Engineering Rationale

Query keys must be unique and consistent across hooks and components. Without constants, query keys are duplicated as string literals across hooks.

### Recommended Set

```typescript
// @/constants/query.ts
export const QUERY_KEYS = {
  EVENTS: { all: ["events"] as const, list: "events", detail: (id: string) => ["events", id] as const },
  USERS: { all: ["users"] as const, list: "users", detail: (id: string) => ["users", id] as const },
  PROFILE: { all: ["profile"] as const, detail: (slug: string) => ["profile", slug] as const },
  JOBS: { all: ["jobs"] as const, list: "jobs", detail: (id: string) => ["jobs", id] as const },
  MESSAGES: { all: ["messages"] as const, list: "messages", thread: (id: string) => ["messages", id] as const },
  FEATURE_FLAGS: { all: ["feature-flags"] as const },
} as const;
```

### Location

`@/constants/query.ts`

### Recommendation

Every `useQuery` and `useMutation` uses query key constants, not string literals.

---

## 28. Storage Keys

### Purpose

Centralize all keys used for localStorage, sessionStorage, cookies, and cache storage.

### Current State

- `AUTH_COOKIE_NAME = "session_token"` in `route-protection.ts`.
- Token key from env: `NEXT_PUBLIC_AUTH_TOKEN_KEY`.
- Theme key implied: `"theme"` (used by next-themes).

### Recommended Set

```typescript
// @/constants/storage.ts
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  THEME: "theme",
  SESSION: "session_token",
  LOCALE: "locale",
  ONBOARDING_COMPLETED: "onboarding_completed",
} as const;
```

### Location

`@/constants/storage.ts`

### Recommendation

All storage keys are in one file. No string literal `localStorage.getItem("theme")` exists outside this file.

---

## 29. Session & Cookie Keys

### Purpose

Define session and cookie key constants.

### Recommended Approach

Cookie keys in `@/constants/storage.ts` with a `COOKIE_KEYS` sub-object:

```typescript
export const COOKIE_KEYS = {
  SESSION: "session_token",
  LOCALE: "NEXT_LOCALE",
  THEME: "theme",
} as const;
```

### Recommendation

Separate from localStorage keys in the same file with clear grouping.

---

## 30. Local Storage Keys

### Purpose

Define all localStorage key constants.

### Recommendation

```typescript
export const LOCAL_STORAGE_KEYS = {
  THEME: "theme",
  ONBOARDING: "onboarding_completed",
  DRAFT: (entity: string) => `draft_${entity}`,
  LAST_VISITED: "last_visited_page",
  SIDEBAR_STATE: "sidebar_collapsed",
} as const;
```

### Recommendation

Dynamic keys use factory functions within the constants file.

---

## 31. Environment Variables

### Purpose

Define the complete list of environment variables used by the application, their types, required status, and default values.

### Current State

9 unique env vars spread across 9 files, read via `process.env` directly in some files and through `env.ts` in others.

### Recommended Approach

**Single env schema validated at startup:**

```typescript
// @/config/env-schema.ts
import { z } from "zod/v3";

export const envSchema = z.object({
  // Public (browser-accessible)
  NEXT_PUBLIC_APP_NAME: z.string().default("JJCET Alumni"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:8080/api"),

  // Server-side only
  API_TIMEOUT_MS: z.coerce.number().default(30000),
  AUTH_REFRESH_TOKEN_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  SENTRY_ENVIRONMENT: z.enum(["development", "staging", "production"]).default("development"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});
```

### Rules

1. Every env var is declared exactly once in the schema.
2. Every env var has a default or is marked optional.
3. `process.env` is never read outside the env schema.
4. The schema is validated at application startup.
5. Env vars that are public (NEXT_PUBLIC_) are treated as configuration passed to the client.

### Recommendation

Validate environment variables against a Zod schema at build time / startup. Failing vars cause build failures, not runtime crashes.

---

## 32. Runtime Configuration

### Purpose

Define how configuration that is resolved at server startup is structured and consumed.

### Recommended Approach

```typescript
// @src/config/env.ts
import { envSchema } from "./env-schema";

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten());
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
```

### Consumption Pattern

- Components never import `env` directly.
- Configuration flows through hooks, stores, or context.
- Server Components read `env` in data loading functions.
- Client Components receive configuration via props or context.

### Recommendation

Fail fast on invalid config at startup.

---

## 33. Feature Flags

### Purpose

Define the mechanism for enabling and disabling features at runtime.

### Engineering Rationale

The application currently has no feature flag system. All feature pages are statically built and served. Future features, gradual rollouts, experimental features, and enterprise-specific features require a flag mechanism.

### Recommended Approach

**Three-tier feature flag system:**

| Tier | Visibility | Source | Update Mechanism |
|---|---|---|---|
| **Build-time flags** | Both | `env` | Requires rebuild |
| **Server-side flags** | Server + hydrated to client | Environment / Config API | Per-request | 
| **Client-side flags** | Client only | Config API | Real-time |

### Recommended Set

```typescript
// @/constants/flags.ts — flag definitions as a single source of truth
export const FEATURE_FLAGS = {
  // Build-time flags (from env)
  ENABLE_DARK_MODE: process.env.NEXT_PUBLIC_ENABLE_DARK_MODE === "true",
  ENABLE_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === "true",

  // Server-side flags (resolved per-request)
  ENABLE_AI_FEATURES: false, // default off
  ENABLE_ADVANCED_SEARCH: false,
  ENABLE_BULK_OPERATIONS: false,

  // Client-only flags (fetched from API)
  ENABLE_EXPERIMENTAL_UI: false,
} as const;
```

### Future Evolution

For enterprise scale, adopt a feature flag service (LaunchDarkly, GrowthBook, Flagsmith) that provides:
- Gradual rollout (% of users).
- A/B testing integration.
- Environment-specific overrides.
- Audit trail for flag changes.

### Recommendation

Start with build-time flags. Add server-side flags when per-request toggling is needed. Add a flag service when gradual rollout is required.

---

## 34. Error, Success, Warning Codes

### Purpose

Define constant codes and messages for application-level errors, success states, and warnings.

### Current State

Error messages are hardcoded:
- `"Authentication required"` in `lib/data/auth.ts`.
- `"Insufficient permissions"` in `lib/data/auth.ts`.

### Recommended Approach

```typescript
// @/constants/codes.ts
export const ERROR_CODES = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  NOT_FOUND: "NOT_FOUND",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
} as const;

export const SUCCESS_CODES = {
  CREATED: "CREATED",
  UPDATED: "UPDATED",
  DELETED: "DELETED",
  SENT: "SENT",
} as const;
```

### Location

`@/constants/codes.ts`

### Recommendation

Error and success codes are constants. User-facing messages are in i18n.

---

## 35. Analytics Constants

### Purpose

Define analytics event names and dimension constants.

### Engineering Rationale

Analytics is not yet implemented. When it is, event names must be constants to prevent typos and enable searchability.

### Recommended Set

```typescript
// @/constants/analytics.ts
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  FORM_SUBMIT: "form_submit",
  LOGIN: "login",
  REGISTER: "register",
  EVENT_RSVP: "event_rsvp",
  JOB_APPLY: "job_apply",
  MESSAGE_SEND: "message_send",
  SEARCH: "search",
} as const;
```

### Recommendation

Define now even if not implemented. Ready for future Stage 21 (Monitoring & Observability).

---

## 36. Logging Constants

### Purpose

Define log levels and logging configuration constants.

### Current State

Log level from env: `process.env.LOG_LEVEL || "info"`.

### Recommended Set

```typescript
// @/constants/logging.ts
export const LOG_LEVELS = ["debug", "info", "warn", "error", "fatal"] as const;
export const DEFAULT_LOG_LEVEL = "info";
export const LOG_LEVELS_PRIORITY = {
  debug: 0, info: 1, warn: 2, error: 3, fatal: 4,
} as const;
```

### Recommendation

Log levels are both constants and configuration (level is env-driven, levels themselves are constant).

---

## 37. Security Constants

### Purpose

Define CSP directives, rate limits, and security-related constants.

### Recommended Set

```typescript
// @/constants/security.ts
export const CSP = {
  DEFAULT_SRC: ["'self'"],
  SCRIPT_SRC: ["'self'"],
  STYLE_SRC: ["'self'", "'unsafe-inline'"],
  IMG_SRC: ["'self'", "data:", "https:"],
  CONNECT_SRC: ["'self'"],
  FONT_SRC: ["'self'"],
} as const;

export const RATE_LIMITS = {
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_WINDOW_MS: 300000,  // 5 minutes
  API_MAX_REQUESTS: 100,
  API_WINDOW_MS: 60000,     // 1 minute
} as const;
```

### Location

`@/constants/security.ts`

### Recommendation

Security constants are reviewed by the architecture team. Scattered security limits are a risk.

---

## 38. File Upload & Image Constraints

### Purpose

Define upload size limits, allowed file types, and image dimensions.

### Recommended Set

```typescript
// @/constants/upload.ts
export const UPLOAD = {
  AVATAR_MAX_SIZE: 5 * 1024 * 1024,        // 5 MB
  AVATAR_ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"] as const,
  AVATAR_MAX_DIMENSIONS: { width: 1024, height: 1024 },
  AVATAR_ASPECT_RATIO: 1,                   // Square

  IMAGE_MAX_SIZE: 10 * 1024 * 1024,         // 10 MB
  IMAGE_ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp", "image/avif"] as const,

  DOCUMENT_MAX_SIZE: 20 * 1024 * 1024,      // 20 MB
  DOCUMENT_ALLOWED_TYPES: ["application/pdf"] as const,

  MAX_FILE_COUNT: 10,                        // Max files per upload
} as const;
```

### Location

`@/constants/upload.ts`

### Recommendation

File upload limits use `UPLOAD` constants, not hardcoded byte values in upload components.

---

## 39. Validation Constants

### Purpose

Define all validation boundaries (covered in detail in Section 21).

### Summary

`@/constants/validation.ts` contains:
- Length limits (min/max) for all string fields.
- Numeric range limits for all number fields.
- Regex patterns for format validation.
- Password complexity requirements.

---

## 40. Naming Convention

### Purpose

Define strict naming rules for all constants and configuration values.

### Convention Table

| Entity | Convention | Example |
|---|---|---|
| Constant variable | `SCREAMING_SNAKE_CASE` | `MAX_PAGE_SIZE` |
| Config variable | `SCREAMING_SNAKE_CASE` | `API_TIMEOUT_MS` |
| Constant groups (objects) | `SCREAMING_SNAKE_CASE` | `VALIDATION`, `UPLOAD` |
| Config file | `camelCase.ts` | `env.ts`, `env-schema.ts` |
| Constant file | `camelCase.ts` | `validation.ts`, `routes.ts` |
| Feature constants directory | `_constants/` | `src/features/events/_constants/` |
| Feature constant file | `kebab-case.ts` | `event-limits.ts` |

### Rules

1. All constants are `SCREAMING_SNAKE_CASE` at the top level.
2. Group constants use an object wrapper with `as const`.
3. Config values follow the same naming.
4. The `MS` suffix is required for all millisecond values.
5. The `PX` suffix is optional — use `number` type annotation instead.

### Example

```typescript
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PAGE_SIZE_DEFAULT: 20,
} as const;
```

### Recommendation

Strictly enforce naming. Code review rejects constants that violate the convention.

---

## 41. Folder Organization Principles

### Purpose

Define the folder structure for all constants and configuration.

### Complete Structure

```
src/
├── constants/                     # Global constants (shared across features)
│   ├── index.ts                  # Barrel export
│   ├── routes.ts                # Route paths, prefixes, patterns
│   ├── navigation.ts            # Public, alumni, admin nav structures
│   ├── auth.ts                  # Token keys, cookie names, session limits
│   ├── roles.ts                 # User roles (single source of truth)
│   ├── permissions.ts           # Permission actions, resources, scopes
│   ├── status.ts                # Domain entity statuses (event, job)
│   ├── business.ts              # Business limits, numeric defaults
│   ├── ui.ts                    # UI durations, toast config, skeleton defaults
│   ├── layout.ts                # Sidebar, header, content dimensions
│   ├── animation.ts             # Duration, easing values
│   ├── responsive.ts            # Breakpoint values
│   ├── validation.ts            # Validation boundaries
│   ├── api.ts                   # API timeouts, retries, headers
│   ├── http.ts                  # HTTP status codes, methods
│   ├── cache.ts                 # Cache TTLs, revalidation intervals
│   ├── query.ts                 # Query key factories
│   ├── storage.ts               # Local storage, cookie, session keys
│   ├── datetime.ts              # Date formats, time constants
│   ├── upload.ts                # File upload limits
│   ├── codes.ts                 # Error, success, warning codes
│   ├── analytics.ts             # Event names, dimensions
│   ├── logging.ts               # Log levels
│   ├── security.ts              # CSP, rate limits
│   └── flags.ts                 # Feature flag definitions
├── config/                       # Configuration (env-dependent)
│   ├── index.ts                 # Barrel export
│   ├── env.ts                   # Compiled env config
│   ├── env-schema.ts            # Zod schema for env validation
│   ├── i18n.ts                  # Locale config (migrate from @/config/)
│   ├── routing.ts               # i18n routing config
│   └── error-monitoring.ts      # Sentry init (stays as config)
├── features/
│   ├── events/
│   │   ├── _constants/          # Feature-private constants
│   │   │   └── event-limits.ts  # Feature-specific limits
│   │   ├── _types/
│   │   ├── _components/
│   │   ├── _sections/
│   │   └── feature.tsx
│   ... (repeat per feature)
└── config/ (root level)
    ├── next.config.ts            # Next.js build config
    ├── playwright.config.ts      # E2E test config
    ├── sentry.*.config.ts        # Sentry config
    └── proxy.ts                  # Middleware config
```

### Rules

1. `src/constants/` contains only values that are identical in all environments.
2. `src/config/` contains environment-dependent configuration.
3. `src/features/*/_constants/` contains feature-private constants.
4. Root config files (next.config.ts, playwright.config.ts) remain at root — they are framework config.

### Recommendation

The file-per-constant-class pattern prevents any constants file from exceeding 100 lines. If a constants file exceeds 100 lines, split by sub-domain.

---

## 42. Dependency Rules

### Purpose

Define what may import constants and configuration and from where.

### Allowed Imports

```
@/constants/      ←  Any layer may import (horizontal layer)
@/config/         ←  Only service layer, data layer, layout
@/features/*/_constants/  ←  Only within the owning feature
```

### Forbidden Imports

| Pattern | Reason |
|---|---|
| Feature → other feature `_constants/` | Violates feature isolation |
| Component → `process.env` directly | Must go through config layer |
| Component → `@/config/env.ts` | Config is not a UI concern |
| Schema → hardcoded enum literals | Must import from constants |
| UI → `@/constants/api.ts` | UI should not know API internals |

### Enforcement

ESLint `import/no-restricted-paths` with rules blocking:
- `src/features/*/` importing from `src/features/<other>/*/`.
- `src/components/` importing from `@/config/`.
- `src/constants/` importing from `src/features/`.

### Recommendation

Dependency rules are enforced at the ESLint level.

---

## 43. Promotion Rules

### Purpose

Define when a hardcoded value becomes a constant, and when a constant becomes configuration.

### Promotion Criteria

| Current | Promotion Trigger | New Home |
|---|---|---|
| Hardcoded new | Used in 2+ locations | `@/constants/` |
| Hardcoded in component | Any business or domain value | `@/constants/` |
| Private feature constant | Used by 2+ features | `@/constants/` (shared) |
| Constant | Varies by environment | `@/config/` |
| Static config | Needs runtime toggling | Feature flag |

### Rule

No magic value larger than the number `1` or the string `""` (empty) exists outside a constant or configuration file.

### Recommendation

Every PR must eliminate at least one magic value that does not follow the rules.

---

## 44. Deprecation Strategy

### Purpose

Define how deprecated constants are phased out.

### Process

1. Add `@deprecated` JSDoc tag with replacement path.
2. Keep the deprecated constant for 2 release cycles.
3. In the third release cycle, remove it.
4. ESLint rule `no-restricted-imports` blocks usage of removed constants.

### Example

```typescript
/** @deprecated Use VALIDATION.PASSWORD_MIN_LENGTH instead. */
export const OLD_MIN_PASSWORD = 8;
```

### Recommendation

Never remove a deprecated constant without a migration guide.

---

## 45. Versioning Strategy

### Purpose

Define how configuration and constants are versioned.

### Approach

- Constants are versioned via git history only — they rarely change shape.
- Configuration (env) is versioned via .env files named by environment: `.env.development`, `.env.staging`, `.env.production`.
- Feature flag versions are tracked via the deploy environment name.
- Schema changes to `env-schema.ts` follow semantic versioning in the project changelog.

### Recommendation

Configuration is environment-versioned. Constants are git-versioned.

---

## 46. Documentation Strategy

### Purpose

Define documentation requirements for constants and configuration.

### Requirements

| Element | Documentation Needed |
|---|---|
| Shared constant file | File header: purpose, owner |
| Grouped constant object | JSDoc on the object |
| Individual constant | Inline comment only if value is non-obvious |
| Environment variable | Comment: purpose, required/optional, example value |
| Feature flag | Comment: feature name, ticket link, rollout plan |
| Deprecated constant | JSDoc `@deprecated` with replacement |

### Example

```typescript
/**
 * Authentication token storage keys.
 * Owner: Auth Feature
 */
export const AUTH = {
  /** @deprecated Use COOKIE_KEYS.SESSION instead. Will be removed in v2. */
  TOKEN_KEY: "auth_token",
  REFRESH_KEY: "refresh_token",
} as const;
```

### Recommendation

File headers and group-level JSDoc are required. Per-constant comments are for non-obvious values only.

---

## 47. Governance Strategy

### Purpose

Define how the constants & configuration system is maintained, reviewed, and enforced.

### Ownership

| Scope | Steward | Review |
|---|---|---|
| `@/constants/` | Architecture team | Required for all changes |
| `@/config/` | DevOps / Architecture | Required for env changes |
| Feature `_constants/` | Feature team | Recommended |
| Root config files | DevOps | Required |

### Enforcement Mechanisms

1. **ESLint:** `import/no-restricted-paths` blocks cross-feature constant imports.
2. **Code review:** Every PR adding a magic value (not from `@/constants/`) must be flagged.
3. **TypeScript:** `as const` ensures immutability at the type level.
4. **Biome:** Linting catches unused constants.
5. **Hygiene script:** `scripts/verify-constants.mjs` audits for:
   - File headers on every `@/constants/*.ts` file.
   - No magic numbers in `src/features/` outside `_constants/`.
   - All constants use `SCREAMING_SNAKE_CASE`.
   - All constants objects use `as const`.

### Recommendation

A constants hygiene check runs in CI. PRs that add new magic values fail.

---

## 48. Performance Considerations

### Impact of Constants

- Constants are tree-shaken by bundlers when unused.
- `as const` produces zero runtime overhead.
- Environment config is resolved at startup, not per-request.
- Feature flags from env have zero runtime cost (replaced at build time).

### Recommendations

1. Use `as const` for all constant objects — enables literal types and tree-shaking.
2. Prefer build-time feature flags over runtime flags when possible.
3. Keep `@/constants/` files small — unused imports are tree-shaken more efficiently.
4. Avoid large arrays as constants (over 100 members) — use a configuration file instead.

---

## 49. Maintainability

### Rules for Long-term Health

1. **One concept per file.** Route constants in `routes.ts`, not mixed with validation.
2. **Single source of truth.** Every unique concept is defined exactly once.
3. **No magic values.** Any value that appears more than once in the codebase is a constant.
4. **Scream-case for all constants.** `pageSize` in a component is a variable. `PAGE_SIZE_DEFAULT` is a constant.
5. **Group levels matter.** `VALIDATION.PASSWORD_MIN_LENGTH` tells you immediately this is a validation boundary.
6. **Deprecation is documented.** Every deprecated constant has a visible replacement path.
7. **Constants are immutable.** Use `as const` and `readonly` on all constant objects.

---

## 50. Scalability

### Growth Model

As the application grows from 16 to 50+ features:

- `@/constants/` grows by adding files (one per domain), never by growing existing files beyond 100 lines.
- Each feature adds its own `_constants/` directory — fully isolated.
- Adding a new domain (e.g., "Donations") adds:
  - `@/constants/donations.ts` (if shared).
  - `@/features/donations/_constants/` (feature-specific).
  - No existing file changes (fully additive).
- Feature flags scale by adding entries to `FEATURE_FLAGS` object — all flags remain discoverable in one place.

### Decoupling

- Constants are decoupled from code — changing `PAGE_SIZE_DEFAULT` from 20 to 25 touches one file.
- Configuration is decoupled from components — changing `API_BASE_URL` touches only `env.ts`.
- Role constants are decoupled from permissions — adding a role does not require changing permissions.

---

## 51. Best Practices

### Summary of Rules

1. **Constants are not configuration.** If it changes between environments, it is not a constant.
2. **Configuration is validated.** Every env var is typed and validated at startup.
3. **No magic values.** Every numeric or string literal used in business logic is a constant.
4. **as const on every constant object.** No exception.
5. **Feature constants are private.** No feature imports another feature's `_constants/`.
6. **Component constants are forbidden.** Components consume constants, they never define them.
7. **One constant per file.** Except closely related groups under 100 lines.
8. **Scream case for variables, camelCase for files.**
9. **Deprecation is documented.** Two-release cycle for removal.
10. **Feature flags are defined at build time.** Runtime flags require explicit product justification.
11. **Validation boundaries are centralized.** Every `.min()`, `.max()`, `.length()` is a constant.
12. **Storage keys are centralized.** Every `localStorage.getItem()` key is a constant.
13. **Query keys are centralized.** Every `queryKey` string is a constant.
14. **Error codes are constants.** User-facing messages are i18n.
15. **Envs are validated at startup.** Invalid env = failed build.

---

## 52. Engineering Review

### Architecture Analysis

The Constants & Configuration Layer is positioned as a horizontal layer — every other layer depends on it, and it depends on nothing below. This creates no circular dependencies. The separation of constants (environment-independent) from configuration (environment-dependent) prevents accidental coupling between environment-specific values and shared business logic.

The two-tier structure (`@/constants/` + feature `_constants/`) mirrors the same isolation strategy used in the Type System Layer, ensuring a consistent developer mental model across layers.

### Configuration Analysis

Centralizing all `process.env` reads into `src/config/env-schema.ts` (validated with Zod) eliminates the risk of:
- Typo'd env var names (schema validates keys).
- Missing env vars in some environments (defaults ensure graceful degradation).
- Inconsistent env var patterns (all vars snake_case, all NEXT_PUBLIC_ prefixed for client vars).
- Config sprawl across 9+ files.

### Dependency Analysis

**Clean:** Constants import nothing from the application (leaf layer). Config imports only Zod for schema validation. Feature constants import nothing from other features.

**Unidirectional:** Application → Constants → nothing. Configuration → app services → components.

### Maintainability Analysis

- **Low coupling:** Each constants file is independent.
- **High cohesion:** Constants are grouped by domain.
- **Discoverability:** File naming convention makes any constant findable in seconds.
- **Change impact:** Changing a validation boundary in `validation.ts` updates every Zod schema automatically.

### Scalability Analysis

- Fully additive — new domains add new files.
- Feature `_constants/` scales with the number of features.
- Constants never grow existing files beyond 100 lines.

### Security Considerations

- Secrets are never in constants (mistakenly committed) or configuration (kept in env). Env is the boundary for secrets.
- Feature flags prevent unreleased features from being visible.
- Storage keys being constants prevents accidentally exposing the storage schema.

### Performance Considerations

- `as const` objects are tree-shakable and have zero runtime overhead.
- Build-time feature flags are dead-code eliminated by the bundler.
- Zod env validation runs once at startup, not per-request.

### Future Expansion Recommendations

1. **Environment schema CI check.** Validate `.env.*` files against `env-schema.ts` in CI to catch missing vars before deployment.
2. **Constants lint script.** `scripts/verify-constants.mjs` to detect magic values in PRs.
3. **Runtime flag service integration.** When gradual rollout is needed, migrate from `FEATURE_FLAGS` to a flag service adapter that swaps at the import boundary.
4. **Automated deprecation.** ESLint rule to warn on `@deprecated` constant imports.
5. **OpenAPI env integration.** Derive API constants (timeouts, retries) from OpenAPI spec if available.