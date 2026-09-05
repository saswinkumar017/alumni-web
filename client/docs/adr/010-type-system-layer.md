# Stage 10 — Type System Layer Specification

**Status:** Implemented
**Dependencies:** Stage 0–9 (all previous architectural layers)
**Next:** Stage 11 (Constants Layer)

---

## Table of Contents

1. Type System Philosophy
2. Type Architecture
3. Type Classification
4. Domain Model Strategy
5. Data Flow & Type Pipeline
6. API Contract Types
7. DTO Strategy
8. Domain Model Types
9. View Models & Presentation Models
10. Form Models
11. Component Props Strategy
12. Shared Types
13. Feature Types
14. Event Types
15. State Types
16. Configuration Types
17. Permission & Authentication Types
18. Error Types
19. Validation Types
20. Pagination, Search, Sorting, Filter Types
21. Metadata Types
22. Utility Types
23. Generic Strategy
24. Enum, Union, Literal, Discriminated Union Strategy
25. Branded & Opaque Types
26. Type Mapping & Transformation Strategy
27. Serialization & Deserialization Strategy
28. Runtime Validation Strategy — Zod Integration
29. API Contract Strategy
30. Versioning Strategy
31. Nullability & Optional Property Strategy
32. Readonly Strategy
33. Naming Convention
34. Dependency Rules
35. Folder Organization Principles
36. Performance Considerations
37. Scalability
38. Maintainability
39. Documentation Strategy
40. Governance Strategy
41. Best Practices
42. Engineering Review

---

## 1. Type System Philosophy

### Purpose

Define the fundamental nature of the Type System Layer: what it is, why it exists as a first-class architectural layer, and how it differs from a mere collection of TypeScript interfaces.

### Engineering Rationale

In most frontend projects, types emerge organically — scattered across files, duplicated between layers, mixed with runtime code, and coupled to API shapes. This creates:

- **Brittle contracts** — changing an API shape cascades through the entire frontend because the DTO is used everywhere.
- **Type duplication** — the same `User` concept is redefined in features, components, tests, and stories, each slightly differently.
- **No compile-time safety** — optional fields introduced by the API are used as required in views, or vice-versa.
- **Mapping chaos** — transformations between API shapes, domain concepts, view models, and form values happen inline, untracked, and untested.

In an enterprise DDD-aligned architecture, types are the **shared language** between layers. They are not implementation detail — they are the contract.

### Recommended Option

**The Type System Layer is the compile-time contract layer and the frontend domain model.**

It is:

- **Horizontal** — every architectural layer (pages, features, sections, components, hooks, stores) depends on it.
- **Explicit** — every type has a defined purpose, owner, and lifecycle.
- **Safe** — runtime validation via Zod guards against API contract drift.
- **Mapped** — transformations between layers are explicit functions, not inline casts.

### Trade-offs

- *Upfront investment* — building explicit types and mappers costs time before any UI code is written.
- *Developer friction* — strict type boundaries require discipline during rapid prototyping.

### Industry Best Practice

Stripe, Shopify, and GitHub all maintain typed API client layers with generated schema → TypeScript mappings. Atlassian uses explicit domain models that are decoupled from GraphQL shapes. Vercel's SDK pattern separates DTOs from view models.

### Recommendation

Adopt the Type System Layer as a horizontal architectural layer. No code may be written for a Feature until its types and mappers are defined in the specification.

---

## 2. Type Architecture

### Purpose

Define the structural relationship between type categories and how they compose.

### Engineering Rationale

A flat `types/` directory with dozens of files creates no architectural boundaries. Types must be organized by scope (shared vs. feature) and by role (DTO, domain, view, form, props).

### Recommended Option

**Three-tier type hierarchy:**

| Tier | Scope | Owner | Examples |
|---|---|---|---|
| **System Types** | Global | Architecture | `PaginationParams`, `ApiResponse<T>`, `SortDirection`, `EntityId` |
| **Domain Types** | Cross-Feature | Domain | `User`, `Profile`, `Event`, `Job`, `Message` |
| **Feature Types** | Single Feature | Feature | `ProfileFormState`, `EventSearchFilters`, `MessageThread` |

System Types live in `@/types/`. Domain Types live in `@/types/domain/`. Feature Types are co-located in each feature's `_types/` directory.

### Trade-offs

- Shared domain types create coupling between features that depend on the same `User` shape.
- Feature-private types are isolated but may duplicate shared definitions.

### Industry Best Practice

Google's TypeScript style guide recommends file-per-type for domain models and grouped barrel exports. Shopify's Polaris uses explicit type modules separated by concern.

### Recommendation

Use the three-tier hierarchy. A type belongs at the lowest tier that all consumers share.

---

## 3. Type Classification

### Purpose

Define the complete taxonomy of every type that exists in the application.

### Engineering Rationale

Without classification, types accumulate in arbitrary locations. Classification gives every type a home and every architect a mental model of where to find any type.

### Recommended Option

The application recognizes 18 type classes:

| # | Class | Example | Location |
|---|---|---|---|
| 1 | **Entity Types** | `UserId`, `EventId` | `@/types/domain/` |
| 2 | **Domain Types** | `User`, `Event`, `Job` | `@/types/domain/` |
| 3 | **DTO Types** | `ApiUser`, `ApiEvent` | `@/types/api/` |
| 4 | **Request Types** | `CreateUserRequest`, `SearchEventsParams` | `@/types/api/` |
| 5 | **Response Types** | `PaginatedResponse<T>`, `ApiError` | `@/types/api/` |
| 6 | **View Models** | `UserProfileVM`, `EventCardVM` | `@/types/view/` |
| 7 | **Presentation Models** | `DashboardSummary`, `TimelineEntry` | `@/types/view/` |
| 8 | **Form Models** | `ProfileFormData`, `EventFormData` | `@/features/*/_types/` |
| 9 | **Component Props** | `ButtonProps`, `DataTableProps` | Co-located with component |
| 10 | **State Types** | `AuthState`, `AlumniState` | `@/stores/` or `@/types/state/` |
| 11 | **Event Types** | `UserRegistered`, `EventCreated` | `@/types/events/` |
| 12 | **Configuration Types** | `AppConfig`, `FeatureFlags` | `@/config/` |
| 13 | **Permission Types** | `Permission`, `Role` | `@/types/auth/` |
| 14 | **Auth Types** | `AuthUser`, `Session` | `@/types/auth/` |
| 15 | **Error Types** | `ApiError`, `ValidationError` | `@/types/errors/` |
| 16 | **Pag/Search/Sort/Filter Types** | `PaginationParams`, `SearchQuery` | `@/types/api/` |
| 17 | **Metadata Types** | `Timestamped`, `SoftDeletable` | `@/types/domain/` |
| 18 | **Utility Types** | `Nullable<T>`, `DeepPartial<T>` | `@/types/utils/` |

### Trade-offs

- 18 categories seem many, but each has a distinct lifecycle, ownership, and transformation rule.
- Consolidating categories reduces precision — a "form model" and a "DTO" have different responsibilities.

### Industry Best Practice

Domain-Driven Design classifies types into Entities, Value Objects, Domain Events, and Specifications. The DTO pattern separates transport shapes from domain shapes.

### Recommendation

Every type file must begin with a comment identifying its class, e.g. `// Class: Domain Type | Domain: User | Owner: Auth Feature`.

---

## 4. Domain Model Strategy

### Purpose

Define how real-world business concepts are represented as frontend types.

### Engineering Rationale

The frontend is not a thin API proxy. It has its own domain model derived from API responses but shaped by UI requirements. Without a domain layer, every component couples directly to the backend API shape.

### Recommended Option

**Frontend Domain Models as separate concepts from DTOs.**

A Domain Model:

- Represents a business concept as the UI needs it.
- Is **derived from** but **not identical to** API DTOs.
- Has its own properties, defaults, and invariants.
- Is constructed by a mapper function from one or more DTOs.
- Is consumed by view models, form models, and feature components.

### Example Rule

`ApiUserDto` contains `id`, `first_name`, `last_name`, `email`, `avatar_url`, `created_at`, `updated_at`, `status`.

`User` (domain model) contains `id`, `displayName` (computed), `email`, `avatarUrl`, `role`, `isActive`.

The mapper `apiUserToDomain(dto: ApiUserDto): User` does the transformation. No component ever imports `ApiUserDto`.

### Trade-offs

- Extra layer means extra mapping code.
- Protects against API shape changes (rename `first_name` + `last_name` to `full_name`? Only the mapper changes).

### Recommendation

Every backend entity must have a corresponding Frontend Domain Model. No Domain Model imports a DTO directly — mapping is always explicit.

---

## 5. Data Flow — Type Pipeline

### Purpose

Define the complete lifecycle of data through the application type system.

### Engineering Rationale

Data enters from the API, flows through the frontend, and renders as UI. At each stage, the type transforms. Without a defined pipeline, transformations happen in ad-hoc locations (inline in JSX, inside useEffect, inside store reducers) and are untestable.

### Recommended Option

**Six-stage type pipeline with explicit boundaries:**

```
┌─────────────────────────────────────────────────────────┐
│ 1. Database Entity        (backend — out of scope)      │
│           ↓                                              │
│ 2. API Response DTO       (transport shape, raw JSON)    │
│           ↓              ← deserialize + validate         │
│ 3. Domain Model           (frontend business shape)       │
│           ↓              ← map domain → view             │
│ 4. View Model             (display shape, computed fields)   │
│           ↓              ← derive form data              │
│ 5. Form Model            (editable shape, user input)     │
│           ↓              ← validate + serialize          │
│ 6. API Request DTO       (transport shape, outbound)    │
└─────────────────────────────────────────────────────────┘
```

### Responsibilities

| Stage | Responsibility | Owned By |
|---|---|---|
| API DTO | Exactly matches backend JSON | API Contract |
| Domain | Business concepts, computed properties, defaults | Domain Model |
| View Model | What the component needs to render | Feature / Page |
| Form Model | User input with validation state | Feature |
| API Request | Exactly matches backend request shape | API Contract |

### Where Mapping Occurs

- **API → Domain**: In the data access layer (`@/lib/api/` or repository hooks).
- **Domain → View Model**: In the feature or page hook.
- **View Model → Form Model**: In the feature's form initialization.
- **Form → API Request**: In the form submission handler.

### Recommendation

Every distinct transformation must be a pure function. No transformations inside JSX or component bodies.

---

## 6. API Contract Types

### Purpose

Define how API response and request shapes are represented and governed.

### Engineering Rationale

API shapes are the source of truth for external data. They must be explicit, versioned, and never mixed with UI concerns.

### Recommended Option

**API types live in `@/types/api/` and are organized by domain:**

```
src/types/api/
├── index.ts                        # barrel
├── common.ts                      # shared query params, headers
├── user.ts                       # ApiUserDto, CreateUserRequest, UpdateUserRequest
├── event.ts                      # ApiEventDto, CreateEventRequest, SearchEventsParams
├── job.ts                        # ApiJobDto, CreateJobRequest
├── message.ts                    # ApiMessageDto, SendMessageRequest
├── auth.ts                       # LoginRequest, RegisterRequest, AuthResponse
└── responses.ts                  # ApiResponse<T>, PaginatedResponse<T>, ApiError
```

### Rules

1. API types end with a suffix indicating their role: `Dto` for responses, `Request` for requests, `Params` for query parameters.
2. API types are **never** used directly in components or domain logic.
3. API types are **never** used in form state.
4. API types may reference each other (e.g., `PaginatedResponse<ApiUserDto>`).
5. API types must be validated at runtime with Zod schemas.
6. Breaking changes to API types require a version bump in the API contract.

### Recommendation

Every API endpoint has a corresponding Request type and Response type in `@/types/api/`.

---

## 7. DTO Strategy

### Purpose

Define the precise contract for Data Transfer Objects — the representation of backend data on the wire.

### Engineering Rationale

DTOs are the most coupling-prone type in the system. A change to a backend field name or shape ripples through every frontend layer unless there is a decoupling strategy.

### Recommended Option

**DTOs are the raw wire format — camelCase, serialized JSON.**

Rules:

1. Every DTO is an explicit interface, never `any` or inline.
2. DTO fields use **camelCase** regardless of the backend convention; transformation happens at the API boundary.
3. DTOs contain only scalar fields, nesting (other DTOs), and arrays of DTOs — no methods, no computed properties.
4. DTOs are always readonly (`interface` with readonly fields, or `as const`).
5. Every DTO has a corresponding Zod schema for runtime validation.
6. DTOs never extend frontend domain models. Domain models derive from DTOs.

### Naming Convention

`{EntityName}Dto` — e.g., `UserDto`, `EventDto`, `JobDto`.

### Example Pattern

```typescript
// @/types/api/user.ts
export interface UserDto {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly role: string;
  readonly createdAt: string;  // ISO 8601 from API
  readonly updatedAt: string;
}
```

### Recommendation

Strictly separate DTOs from Domain Models. No DTO crosses the API boundary into a component tree.

---

## 8. Domain Model Types (continued)

### Purpose

Define the shape of business entities on the frontend after transformation from API DTOs.

### Engineering Rationale

Domain models represent business concepts in the frontend's terms. They:

- Normalize API field names (snake_case → camelCase).
- Derive computed properties (`fullName`, `timeAgo`).
- Supply defaults for missing data.
- Flatten nested DTOs into flat models where appropriate.
- Add UI-relevant constants (e.g., `statusLabel`, `statusColor` as enums).

### Recommended Option

**Domain models are interfaces with explicit nullable handling and computed helper types.**

Domain models live in `@/types/domain/`:

```
src/types/domain/
├── index.ts
├── user.ts               # User domain model + related value types
├── event.ts
├── job.ts
├── message.ts
├── common.ts             # shared value objects: Address, PhoneNumber, etc.
└── metadata.ts           # Timestamped, SoftDeletable, etc.
```

### Mapping Rule

Every domain model has a corresponding **mapper factory** in `@/lib/mappers/` that converts DTO → Domain.

---

## 9. View Models & Presentation Models

### Purpose

Define the shape of data that components need for rendering.

### Engineering Rationale

A domain model may have 20 fields, but a card component needs 3. A dashboard needs summaries, not entities. View models and presentation models shape data specifically for UI.

### Recommended Option

**View Model** — A shape that represents a specific screen or section's display needs.

- Named `{Feature}{Component}VM` — e.g., `ProfileCardVM`, `EventListItemVM`.
- Flat structure — no nested objects beyond what the presentation needs.
- Contains pre-formatted strings (dates, prices, status labels).
- Contains pre-computed booleans (`isExpired`, `isEditable`).
- Co-located in the feature `_types/` directory.

**Presentation Model** — A shape that represents an aggregate view or dashboard summary.

- Named `{Context}Summary` — e.g., `DashboardSummary`, `EventDashboard`.
- Composed from multiple domain models.
- Located in `@/types/view/`.

### Mapping Rule

View Model mappers are co-located with the feature hook or component file, named `{entity}ToViewModel`.

### Example

```typescript
// View Model — feature-specific
// location: @/features/directory/_types/directory-view-models.ts
export interface MemberCardVM {
  readonly id: string;
  readonly displayName: string;
  readonly headline: string;
  readonly avatarUrl: string | null;
  readonly graduationYear: number;
  readonly isOnline: boolean;
  readonly initials: string;
}
```

### Recommendation

View Models belong in the feature, Presentation Models belong in `@/types/view/`.

---

## 10. Form Models

### Purpose

Define the shape of user input data for forms, including validation and submission state.

### Engineering Rationale

Form data differs from API request data — it may have intermediate states, partial updates, field-level validation, and UI-only fields (confirm password, terms acceptance).

### Recommended

**Form models are discriminated by creation vs. editing contexts:**

- `{Entity}CreateFormData` — all required fields, no defaults.
- `{Entity}EditFormData` — optional fields with initial values from domain model.

Form models co-locate in `@/features/{feature}/_types/`.

### Transformation Pipeline

```
View Model → populate defaults → Form Model
Form Model → validate → transform → API Request DTO
```

### Example

```typescript
// @/features/events/_types/event-form-types.ts
export interface EventCreateFormData {
  readonly title: string;
  readonly description: string;
  readonly date: string;
  readonly time: string;
  readonly location: string;
  readonly maxAttendees: number;
  readonly isPublic: boolean;
}
```

### Validation

Form models are validated at runtime by Zod schemas before submission. The Zod schema is co-located with the form model.

### Recommendation

Form models are always feature-private. Never share a form model across features.

---

## 11. Component Props Strategy

### Purpose

Define the architectural rules for how component props are typed.

### Engineering Rationale

Props are the public API of every component. Inconsistent prop typing leads to untraceable data flow, coupling to domain types, and poor developer experience.

### Recommended Option

**Strict prop classification by component layer:**

| Component Layer | Accepts | Does NOT Accept |
|---|---|---|
| UI Primitive | Primitives only (string, number, boolean, ReactNode, callback) | Domain models, DTOs, view models |
| Shared Component | Primitives + generic data types (`T[]`, `ColumnDef<T>`) | Domain models, DTOs, view models |
| Feature Component | View Models, Domain Models | DTOs, API response shapes |
| Section | View Models | DTOs, raw API data |
| Page | Domain Models (to pass to sections) | DTOs (must be mapped in the route handler) |

### Prop Naming Convention

- Props interface: `{ComponentName}Props` exported as named export.
- Props filenames: co-located with component, not in types directory.

### Pattern

```typescript
// co-located with Button.tsx
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: "primary" | "secondary" | "danger";
  readonly size?: "sm" | "md" | "lg";
}
```

### Recommendation

Component props follow the **"as primitive as possible" rule**. If a prop can be a string instead of a domain model, it should be.

---

## 12. Shared Types

### Purpose

Define types that are used across multiple features but are not domain models — pagination wrappers, ID types, response envelopes.

### Engineering Rationale

Without shared types, every feature redefines `PaginationParams` and `ApiResponse<T>` — introducing subtle inconsistencies.

### Recommended Shared Types

These go in `@/types/shared/`:

```typescript
// @/types/shared/identifiers.ts
export type EntityId = string;

// @/types/shared/pagination.ts
export interface PaginatedResponse<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

// @/types/shared/api-response.ts
export interface ApiResponse<T> {
  readonly data: T;
  readonly message?: string;
  readonly errors?: readonly string[];
}
```

### Rule

Shared types must not reference any domain model or DTO. They are **generic structures** that domain types parameterize.

### Recommendation

Any type that is used in 3+ features or 2+ architectural layers is a candidate for `@/types/shared/`.

---

## 13. Feature Types

### Purpose

Define how types are organized within each feature to maintain isolation and clarity.

### Engineering Rationale

Feature types are the bridge between the feature's UI and the rest of the system. They must import from shared/domain types but must never be imported by other features.

### Recommended Structure

Each feature directory contains a `_types/` subdirectory:

```
src/features/events/
├── _types/
│   ├── index.ts
│   ├── event-view-models.ts    # View models for event display
│   ├── event-form-types.ts     # Form data for create/edit
│   ├── event-state.ts          # Feature-level state types
│   └── event-filters.ts        # Feature-specific filter shapes
├── _components/
├── _sections/
└── page.tsx
```

### Dependency Rules (Feature Types)

- May import from `@/types/domain/`, `@/types/shared/`, `@/types/api/`.
- May **not** import from other features' `_types/`.
- May import from `@/types/view/` if applicable.

### Recommendation

Feature `_types/` is the only directory that may contain form data types, feature-specific view models, and feature-specific filter/sort types.

---

## 14. Event Types

### Purpose

Define how application events (tracking, domain events, UI events) are typed.

### Engineering Rationale

Events flow through stores, analytics, and cross-feature communication. Untyped events are untraceable.

### Recommended Approach

**Discriminated unions for all event types.**

```typescript
// @/types/events/domain-events.ts
export type AppEvent =
  | { readonly type: "USER_REGISTERED"; readonly payload: { userId: string } }
  | { readonly type: "EVENT_CREATED"; readonly payload: { eventId: string } }
  | { readonly type: "MESSAGE_SENT"; readonly payload: { conversationId: string } }
  | { readonly type: "JOB_APPLIED"; readonly payload: { jobId: string } };
```

### Classification

- **Domain Events** — business-meaningful events (user registered, event created) → `@/types/events/domain-events.ts`.
- **UI Events** — interaction events (modal opened, tab changed) — co-located in feature or store.
- **Analytics Events** — tracking events (page viewed, form submitted) — defined per feature in `_types/`.

### Recommendation

Domain events are system-global. UI and analytics events are feature-scoped.

---

## 15. State Types

### Purpose

Define how application state is typed in stores and React state.

### Engineering Rationale

State is the most complex type category — it combines API data, UI state, loading state, error state, and optimistic updates. Without a consistent pattern, state types become unmanageable.

### Recommended Approach

**Generic state wrapper pattern for all async state:**

```typescript
// @/types/state/async-state.ts
export interface IdleState { readonly status: "idle"; }
export interface LoadingState { readonly status: "loading"; }
export interface SuccessState<T> { readonly status: "success"; readonly data: T; }
export interface ErrorState { readonly status: "error"; readonly error: string; }

export type AsyncState<T> =
  | IdleState
  | LoadingState
  | SuccessState<T>
  | ErrorState;
```

Store-specific state types compose these:

```typescript
// inside a feature store or @/stores/
export interface EventsState {
  readonly events: AsyncState<Event[]>;
  readonly selectedEvent: AsyncState<Event | null>;
  readonly filters: EventFilters;
  readonly sort: SortConfig;
}
```

### Rules

1. All remote data uses `AsyncState<T>`.
2. Local UI state (modals open, active tabs) uses primitive types, not `AsyncState`.
3. State types are readonly at the top level.
4. State types are exported to enable external selectors.

### Recommendation

Use the `AsyncState<T>` discriminated union for all remote data. Never use ad-hoc `isLoading`/`error` pairs.

---

## 16. Configuration Types

### Purpose

Define how environment configuration, feature flags, and app settings are typed.

### Engineering Rationale

Configuration is a source of truth that must be compile-time checked. Missing config keys break at runtime.

### Recommended Approach

```typescript
// @/config/app-config.ts
export interface AppConfig {
  readonly appName: string;
  readonly apiBaseUrl: string;
  readonly version: string;
  readonly features: FeatureFlags;
  readonly pagination: { readonly defaultPageSize: number };
}

export interface FeatureFlags {
  readonly enableDarkMode: boolean;
  readonly enableNotifications: boolean;
  readonly enableEvents: boolean;
}

// @/config/index.ts — single config object
export const appConfig: AppConfig = { ... };
```

### Recommendation

All configuration is typed. Config types are in `@/config/`, not in `@/types/`.

---

## 17. Permission & Authentication Types

### Purpose

Define types for authentication state, user sessions, roles, and permissions.

### Recommended Approach

```typescript
// @/types/auth/auth-types.ts
export type Role = "admin" | "alumni" | "student" | "guest";

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly role: Role;
  readonly isEmailVerified: boolean;
}

export interface Permission {
  readonly action: "create" | "read" | "update" | "delete";
  readonly resource: string;  // e.g., "event", "job", "user"
  readonly scope: "own" | "all";
}
```

### Location

- `@/types/auth/auth-types.ts` — AuthUser, Session, Role.
- `@/types/auth/permissions.ts` — Permission, PermissionMap, RolePermissions.
- Feature-specific checks in `@/features/{feature}/_types/`.

### Recommendation

Permission logic is type-checked. No string comparisons for roles — use type-safe guards.

---

## 18. Error Types

### Purpose

Define how errors from the API, validation, and application are typed and propagated.

### Engineering Rationale

Errors are data. Untyped errors crash or requires `catch (e: any)` blocks.

### Recommended Approach

```typescript
// @/types/errors/api-error.ts
export interface ApiError {
  readonly status: number;
  readonly code: string;
  readonly message: string;
  readonly details?: readonly string[];
}

// @/types/errors/validation-error.ts
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

export type ValidationErrors = readonly ValidationError[];

// @/types/errors/index.ts
export type AppError =
  | { readonly kind: "api"; readonly error: ApiError }
  | { readonly kind: "validation"; readonly errors: ValidationErrors }
  | { readonly kind: "network"; readonly message: string }
  | { readonly kind: "unknown"; readonly message: string };
```

### Recommendation

Every error is typed. The `AppError` discriminated union is used in all error boundaries and error states.

---

## 19. Validation Types

### Purpose

Define the validation contract between form data, API requests, and the validation layer (Zod).

### Engineering Rationale

Validation is not an afterthought. The validation schema is the single source of truth for what constitutes valid data.

### Recommended Approach

Validation schemas are co-located with the types they validate:

- DTO Zod schemas in `@/types/api/`.
- Domain model Zod schemas in `@/types/domain/`.
- Form model Zod schemas in `@/features/{feature}/_types/`.

```typescript
// @/types/api/user.ts — schema co-located with DTO
export const UserDtoSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
});

export type UserDto = z.infer<typeof UserDtoSchema>;
```

### Rules

1. Every DTO has a Zod schema.
2. Every form model has a Zod schema.
3. Domain models may have Zod schemas if they are used in data entry.
4. Validation schemas are never duplicated (infer from schema, don't write separate interface + schema).

### Recommendation

The Zod schema is the source of truth. Types are inferred from schemas, not the reverse.

---

## 20. Pagination, Search, Sorting, Filter Types

### Purpose

Define shared shapes for data fetching patterns that recur in every feature.

### Recommended Approach

```typescript
// @/types/api/common.ts
export interface PaginationParams {
  readonly page: number;
  readonly pageSize: number;
}

export interface PaginatedResponse<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  readonly field: string;
  readonly direction: SortDirection;
}

export interface SearchQuery {
  readonly query: string;
  readonly fields?: readonly string[];
}

export type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains";

export interface FilterConfig {
  readonly field: string;
  readonly operator: FilterOperator;
  readonly value: string | number | boolean;
}
```

### Recommendation

Shared, generic, and parameterized. Features add feature-specific filters by extending `FilterConfig` or composing with union types.

---

## 21. Metadata Types

### Purpose

Define reusable metadata structures like timestamps, audit info, soft-delete markers.

### Recommended Approach

```typescript
// @/types/domain/metadata.ts
export interface Timestamped {
  readonly createdAt: string;  // ISO 8601
  readonly updatedAt: string;
}

export interface SoftDeletable extends Timestamped {
  readonly deletedAt: string | null;
}

export interface Authored {
  readonly createdBy: UserId;
}

export interface Versioned {
  readonly version: number;
}
```

### Recommendation

Metadata types are mixed into domain models via intersection types, not inheritance.

---

## 22. Utility Types

### Purpose

Define reusable utility types that simplify common patterns across the application.

### Recommended Set

```typescript
// @/types/utils/index.ts

// Mark a subset of fields as required
export type RequiredFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Mark a subset of fields as optional
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Deep partial — all nested fields optional
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

// Non-nullable wrapper
export type NonNull<T> = T extends null | undefined ? never : T;

// Extract value type from array
export type ValueOf<T> = T extends readonly (infer U)[] ? U : never;

// At least one of the keys must be present
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

// Mutually exclusive keys
export type XOR<T, U> = T | U extends object
  ? (T & { [K in Exclude<keyof U, keyof T>]?: never }) | (U & { [K in Exclude<keyof T, keyof U>]?: never })
  : T | U;
```

### Recommendation

Utility types are defined once in `@/types/utils/` and imported where needed. No inline conditional types.

---

## 23. Generic Strategy

### Purpose

Define when and how to use generics across the type system.

### Engineering Rationale

Generics are powerful but must be constrained. Unbounded generics produce confusing error messages and poor DX.

### Rules

1. Every generic parameter has a constraint (the `extends` clause).
2. Generic parameters are descriptive single words: `T` for element type, `TData` for data, `TId` for ID.
3. Generic types that accept 3+ parameters are documented.
4. Generics are used for:
   - `AsyncState<T>` — wrapper around any remote data type.
   - `PaginatedResponse<T>` — wrapper around any list type.
   - `DataTableProps<T>` — component that accepts any row type.
   - Mapper functions (`dtoToDomain<TDto, TDomain>`).
5. Generics are NOT used for:
   - Component props that can be explicit unions.
   - Simple derived types that can be utility types.

### Recommendation

Constrained, documented, and purposeful. Never open-ended.

---

## 24. Enum, Union, Literal, Discriminated Union Strategy

### Purpose

Define the strategy for each kind of finite type collection in the application.

### Engineering Rationale

TypeScript offers `enum`, union of `string` literals, `const objects`, and discriminated unions. Each has distinct trade-offs for bundle size, tree-shaking, serialization, and type safety.

### Recommended Approach

| Pattern | Use Case | Rationale |
|---|---|---|
| **String literal union** | Simple fixed sets: `type Status = "active" \| "inactive"` | Zero runtime cost, exhaustiveness checking, JSON compatible |
| **`const` objects + value type** | Key-value maps: `const ROLES = { admin: "admin", user: "user" } as const; type Role = (typeof ROLES)[keyof typeof ROLES]` | Enumerated access with string literal safety |
| **TypeScript `enum`** | Never use | Cannot be tree-shaken, produce runtime objects, inconsistent with `const` semantics |
| **Discriminated union** | Complex variants with unique payloads: `type AsyncState<T> = IdleState \| LoadingState \| SuccessState<T> \| ErrorState` | Pattern matching with `switch`, exhaustiveness, per-variant data |

### Recommendation

```
String literal union > const object + type > enum (never)
```

Discriminated unions for any type with 2+ variants.

---

## 25. Branded & Opaque Types

### Purpose

Define how to prevent mixing up structurally identical types (e.g., two different `string` ID types).

### Engineering Rationale

A `UserId` and `EventId` are both strings, but they are not interchangeable. Without branding, assigning one to the other is allowed by the compiler.

### Recommended Approach

**Branded types for all entity identifiers:**

```typescript
// @/types/domain/branded.ts
export type Brand<T, B> = T & { readonly __brand: B };

export type UserId = Brand<string, "UserId">;
export type EventId = Brand<string, "EventId">;
export type JobId = Brand<string, "JobId">;
export type MessageId = Brand<string, "MessageId">;
export type ConversationId = Brand<string, "ConversationId">;
```

### Rules

1. Every entity has a branded ID type.
2. Branded IDs are used in API types, domain models, and state.
3. Branding is stripped at the network boundary (API layer) and restored by mappers.
4. Functions that accept a generic ID parameter use the branded type.

### Recommendation

All entity IDs are branded. Nothing less than a branded ID is acceptable for entity references.

---

## 26. Type Mapping & Transformation Strategy

### Purpose

Define the architecture for transforming types between layers (DTO → Domain → View → Form → Request).

### Engineering Rationale

Mapping is the most error-prone part of the type pipeline. Without a consistent pattern, mappings are scattered, untested, and duplicated.

### Recommended Approach

**Mapper functions are pure functions with explicit input and output types.**

| Mapping | Name Convention | Location | Test |
|---|---|---|---|
| DTO → Domain | `dtoToDomain(dto: TDto): TDomain` | `@/lib/mappers/domain/` | Required |
| Domain → View Model | `toViewModel(domain: TDomain): TVM` | `@/features/*/_mappers/` | Recommended |
| Domain → Form | `domainToForm(domain: TDomain): TForm` | `@/features/*/_mappers/` | Recommended |
| Form → Request | `formToRequest(form: TForm): TRequest` | `@/features/*/_mappers/` | Required |
| View → Props | Inline in component | `src/features/*/_components/` | Not required |

### Rules

1. Mapper functions are pure — no side effects, no async.
2. Mapper functions are unit-tested.
3. Each mapper has a single responsibility.
4. Mappers never import from UI libraries.
5. Inline mapping in component bodies (inside `return (JSX)`) is forbidden.

### Recommendation

Mapper functions are first-class citizens of the type system architecture.

---

## 27. Serialization & Deserialization Strategy

### Purpose

Define how types are serialized for the wire and deserialized from the wire.

### Engineering Rationale

The API sends ISO strings, not Date objects. The API sends snake_case, the frontend uses camelCase. Serialization/deserialization is where these transformations happen.

### Recommended Approach

**Deserialization (API → Frontend)**

API response → Zod parse (validate shape) → transform (date strings → Date, etc.) → DTO

```typescript
async function fetchUser(id: UserId): Promise<UserDto> {
  const raw = await fetch(`/api/users/${id}`).then((r) => r.json());
  return UserDtoSchema.parse(raw); // Runtime validation + type narrowing
}
```

**Serialization (Frontend → API)**

Form model → Zod parse (validate) → transform (Date → ISO string) → JSON request body

### Rules

1. All API responses are validated at runtime with Zod before any code touches them.
2. Deserialization happens as close to the `fetch()` call as possible — in the data access layer.
3. Serialization happens immediately before the `JSON.stringify()` call.
4. Date objects are used in domain models; ISO strings are used in DTOs.

### Recommendation

Serializer and deserializer utilities live in `@/lib/api/serialization.ts`. Feature-specific transforms are co-located with mappers.

---

## 28. Runtime Validation Strategy — Zod Integration

### Purpose

Define the integration between TypeScript's compile-time type system and Zod's runtime validation.

### Engineering Rationale

TypeScript types vanish at runtime. API responses can violate type contracts. Zod provides runtime enforcement that TypeScript cannot.

### Recommended Approach

**Zod is the source of truth — types are inferred from schemas, not hand-written:**

```typescript
import { z } from "zod";

// 1. Define schema
export const UserDtoSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

// 2. Infer type (do NOT write a separate interface)
export type UserDto = z.infer<typeof UserDtoSchema>;
```

### Where Zod is Required

| Context | Zod Required? | Reason |
|---|---|---|
| API DTOs | Yes | API may send invalid data |
| Form data | Yes | User input is unpredictable |
| Domain models | Recommended | Catch mapper bugs early |
| View models | No | Derived from validated domain models |
| Component props | No | Always controlled by parent |

### Rules

1. Never write a DTO interface by hand — always infer from a Zod schema.
2. Never write a form model by hand — always infer from a Zod schema.
3. Store `z.infer<typeof Schema>` directly, not as a standalone type alias.
4. Parse at the boundary: `schema.parse(data)` for required data, `schema.safeParse(data)` for optional data.

### Recommendation

Infer from Zod. Never hand-write a DTO or form model interface.

---

## 29. API Contract Strategy

### Purpose

Define how the frontend's type system reflects and enforces the API contract.

### Engineering Rationale

The API contract is the agreement between frontend and backend. When the contract changes, the frontend should fail at compile time.

### Recommended Approach

**Suffix-based API types that match backend endpoints:**

```
GET  /api/users              → UserDto
POST /api/users              → CreateUserRequest + UserDto
GET  /api/users/:id          → UserDto
PUT  /api/users/:id          → UpdateUserRequest + UserDto
DELETE /api/users/:id        → void
GET  /api/users/:id/posts    → PaginatedResponse<PostDto>
```

### Versioning

- API types include a `version` field or are suffixed with a version number.
- Breaking API changes increment the version: `UserDtoV1` → `UserDtoV2`.
- Multiple versions coexist until the old version is fully removed.

### Contract Enforcement

1. Every API call has exact Request and Response types.
2. Zod schemas validate every response.
3. A breaking API change that updates `UserDto` causes compile errors in all consumers — this is intentional.

### Recommendation

Add `@/types/api/contract.ts` with endpoint-to-type mappings as a central contract document.

---

## 30. Versioning Strategy

### Purpose

Define how types evolve over time without breaking consumers.

### Engineering Rationale

Backend evolves independently. The frontend must be resilient to API changes.

### Recommended Approach

**Semantic versioning for API types:**

- Types that change shape get a versioned copy (`UserDtoV1`, `UserDtoV2`).
- Mappers handle `v1 → v2` or `v2 → domain model` as needed.
- Old types are tagged `@deprecated` with instructions for migration.
- Deprecated types are removed after 2 releases.

### Migration Flow

```
Backend deploys v2 API → Frontend adds UserDtoV2 + mapper
→ All features migrate to V2 → UserDtoV1 marked @deprecated
→ UserDtoV1 removed after deprecation window
```

### Recommendation

Version types at the API boundary. Domain models should rarely need versioning.

---

## 31. Nullability & Optional Property Strategy

### Purpose

Define clear rules for when a property is optional, required, nullable, or absent.

### Engineering Rationale

Confusion between `?`, `| undefined`, `| null` creates subtle bugs. A property that may be absent has different meanings:

- `?` means "may not be present in configuration/input".
- `null` means "explicitly absent / not applicable" (returned by the API).
- `undefined` means "not yet initialized".

### Recommended Approach

| Meaning | Syntax | When |
|---|---|---|
| Always present | `field: string` | Required, always has a value |
| May be absent (API) | `field: string \| null` | API returns null |
| Optional at use site | `field?: string` | Consumer may omit it (props, config) |
| Not yet initialized | `field: string \| undefined` | State before first fetch |

### Rule

1. API fields that can be null are typed `T | null`, never `T | undefined` or `T?`.
2. Local UI state uses `T | undefined` for "not yet loaded" and `T | null` for "could not load."
3. Optional props use `?` syntax.

### Recommendation

```
API null → T | null
Uninitialized → T | undefined
Optional config → T?
```

---

## 32. Readonly Strategy

### Purpose

Define where `readonly` is used and why.

### Engineering Rationale

Immutability prevents accidental mutations that cause silent bugs. In React's state model, mutation is always wrong.

### Recommended Approach

- All interface properties that represent external data are `readonly`.
- All state shapes are `readonly`.
- All DTO fields are `readonly`.
- All domain model fields are `readonly`.
- Component props are not marked `readonly` (React treats them as immutable anyway).
- Utility types are not marked `readonly` (they are generic).

### Exception

Form data may use mutable fields during user input, but the data is validated and frozen before submission.

### Recommendation

`readonly` on every property of DTOs, domain types, state types, and view models.

---

## 33. Naming Convention

### Purpose

Define strict naming conventions for types, files, and directories.

### Convention Table

| Entity | Convention | Example |
|---|---|---|
| Type file | `PascalCase.ts` | `UserDto.ts` |
| Interface | `PascalCase` | `UserDto` |
| Type alias | `PascalCase` | `UserId` |
| Enum alternative (const object) | `SCREAMING_SNAKE_CASE` | `ROLES` |
| Mapper function | `camelCase` | `dtoToDomain()` |
| General type suffix | Required | See below |

### Suffix Convention

| Suffix | Meaning | Example |
|---|---|---|
| `Dto` | API response transport | `UserDto` |
| `Request` | API request payload | `CreateUserRequest` |
| `Params` | Query/route params | `SearchEventsParams` |
| `VM` | View Model | `ProfileCardVM` |
| `Summary` | Aggregated presentation | `DashboardSummary` |
| `FormData` | Form input data | `EventFormData` |
| `Props` | Component props | `ButtonProps` |
| `State` | Store/state type | `AuthState` |
| `Schema` | Zod schema | `UserDtoSchema` |
| `Guard` | Type guard function | `isUserDto` |

### Recommendation

All type files and type names follow the convention table. No exceptions.

---

## 34. Dependency Rules

### Purpose

Define what each type layer may import and what may import it.

### Allowed Import Graph

```
@/types/api/     → may import: @/types/shared/, @/types/utils/
@/types/domain/  → may import: @/types/shared/, @/types/utils/, @/types/api/ (constructors only)
@/types/view/    → may import: @/types/domain/, @/types/shared/, @/types/auth/
@/types/auth/    → may import: @/types/shared/
@/types/errors/  → may import: none (standalone)
@/types/state/   → may import: @/types/shared/, @/types/domain/
@/types/utils/   → may import: none (standalone)

@/features/*/_types/ → may import: @/types/domain/, @/types/shared/, @/types/view/, @/types/auth/
                     → may NOT import: @/features/other/*/  @/features/other/_types/

@/components/*/   → may NOT import: @/types/api/, @/types/domain/ (use View Models only)
```

### Forbidden Imports

- Component → API DTO (forbidden)
- Feature → other Feature's `_types/` (forbidden)
- Shared utility type → domain type (forbidden)
- UI Primitive → domain type (forbidden)

### Enforcement

ESLint `import/no-restricted-paths` rules enforce these boundaries at the directory level.

### Recommendation

These rules are enforced by ESLint. Any violation is a compile-time error.

---

## 35. Folder Organization

### Complete Structure

```
src/
├── types/
│   ├── index.ts                         # barrel
│   ├── api/
│   │   ├── index.ts
│   │   ├── common.ts                    # PaginationParams, PaginatedResponse, ApiResponse
│   │   ├── auth.ts                     # LoginRequest, RegisterRequest, AuthResponse
│   │   ├── user.ts                     # UserDto, CreateUserRequest, UpdateUserRequest
│   │   ├── event.ts                    # EventDto, CreateEventRequest, etc.
│   │   ├── job.ts                      # JobDto, CreateJobRequest, etc.
│   │   ├── message.ts                  # MessageDto, SendMessageRequest, etc.
│   │   └── responses.ts               # ApiResponse<T>, ApiError, ErrorResponse
│   ├── domain/
│   │   ├── index.ts
│   │   ├── user.ts                     # User, UserId, UserStatus
│   │   ├── event.ts                    # Event, EventId, EventStatus
│   │   ├── job.ts                      # Job, JobId, JobStatus
│   │   ├── message.ts                 # Message, MessagesThread
│   │   ├── profile.ts                 # Profile, Education, Employment
│   │   ├── metadata.ts                # Timestamped, SoftDeletable, Authored, Versioned
│   │   └── branded.ts                 # Brand, UserId, EventId, etc.
│   ├── view/
│   │   ├── index.ts
│   │   ├── dashboard.ts               # DashboardSummary, ActivityFeedVM
│   │   ├── user.ts                     # UserProfileVM
│   │   └── event.ts                    # EventCardVM
│   ├── auth/
│   │   ├── index.ts
│   │   ├── auth-types.ts               # AuthUser, Session, Role
│   │   └── permissions.ts             # Permission, PermissionMap
│   ├── errors/
│   │   ├── index.ts
│   │   ├── api-error.ts               # ApiError
│   │   └── app-error.ts               # AppError discriminated union
│   ├── state/
│   │   ├── index.ts
│   │   └── async-state.ts             # AsyncState<T>, IdleState, LoadingState, etc.
│   ├── events/
│   │   ├── index.ts
│   │   └── domain-events.ts           # AppEvent discriminated union
│   ├── shared/
│   │   └── index.ts                   # EntityId, PaginatedResponse<T> (re-exported for convenience)
│   └── utils/
│       ├── index.ts
│       └── types.ts                    # DeepPartial, OptionalFields, RequiredFields, XOR, etc.
├── features/
│   ├── auth/
│   │   └── _types/
│   │       ├── index.ts
│   │       ├── auth-view-models.ts
│   │       └── auth-form-types.ts
│   ├── events/
│   │   └── _types/
│   │       ├── index.ts
│   │       ├── event-view-models.ts
│   │       ├── event-form-types.ts
│   │       └── event-filters.ts
│   ...   (repeat for each feature)
└── components/
    └── ui/  (component props co-located, not in types/)
```

---

## 36. Performance Considerations

### Impact of Generics and Complex Types

- Generics are erased at compile time — no runtime cost.
- Deep conditional types and mapped types can slow editor performance.
- Discriminated union type narrowing is fast at runtime.

### Recommendations

1. Avoid deeply recursive types (3+ levels of conditional recursion).
2. Avoid large intersections (12+ types intersected).
3. Prefer interfaces over `type` for large objects (interfaces are faster to evaluate).
4. Use `z.infer` sparingly in frequently-imported files — infer once, export the type.
5. Keep Zod schemas lean — validations beyond shape checking (e.g., complex business rules) live in domain logic.

### Build Time

- TypeScript `--noEmit --diagnostics` reports type-checking times.
- Keep type-checking under 30 seconds.
- Split large union types (60+ members) into smaller groups.

---

## 37. Scalability

### Type System Growth

As the application grows from 8 features to 40+ features:

- Shared types grow linearly with domains, not features.
- Each feature adds its own `_types/` — isolated from others.
- Domain model changes affect only features that use them.
- New API endpoints add new DTO types — existing types unchanged.

### Feature Onboarding

1. Define DTO in `@/types/api/new-domain.ts`.
2. Infer from Zod schema.
3. Define Domain Model in `@/types/domain/new-domain.ts`.
4. Create mapper `dtoToXDtoDomain()` in `@/lib/mappers/`.
5. Define View Model in `@/features/new-domain/_types/`.
6. Create view mapper.

This pattern scales to any number of features without refactoring.

---

## 38. Maintainability

### Rules for Long-term Health

1. **No duplicate types.** If a type exists in `@/types/api/user.ts`, it must not be redefined in a feature.
2. **One type per file** (except small closely related value types).
3. **File header comments** identify Class, Domain, and Owner.
4. **JSDoc on every public type** explains purpose and usage.
5. **Deprecated types** carry `@deprecated` with migration instructions.
6. **Mappers are tested.** A broken mapper is caught by a unit test.
7. **Zod schemas are the source of truth.** Hand-written interfaces that mirror Zod schemas are code review violations.

### Refactoring

- Renaming a DTO field causes compile errors in mappers only — not in components.
- Removing a domain model field causes compile errors in view model mappers.
- Adding a field to a Zod schema infers a new type automatically.

---

## 39. Documentation Strategy

### Type Documentation Requirements

| Element | Required Documentation |
|---|---|
| Public DTO | JSDoc: purpose, source endpoint, version |
| Public Domain Model | JSDoc: purpose, relationship to backend entity |
| View Model | JSDoc: feature context, display purpose |
| Mapper function | JSDoc: what it transforms and why |
| Type utility | JSDoc: usage example |
| Zod schema | Inline comment for complex validation rules |

### ADR Integration

The Stage 10 ADR itself serves as the canonical reference for the type architecture. Any deviation from these rules requires a new ADR update.

---

## 40. Governance Strategy

### How to Maintain the Type System

1. **ADR as source of truth** — this document governs all type decisions.
2. **Code reviews** flag violations of type dependency rules.
3. **ESLint rules** enforce `import/no-restricted-paths` between type layers.
4. **Biome linting** catches unused imports and unsafe type patterns.
5. **`tsc --noEmit`** in CI ensures zero type errors.
6. **Type hygiene script** (`scripts/verify-types.mjs`) audits type files for:
   - File header compliance (Class, Domain, Owner).
   - JSDoc presence on public types.
   - No `any` usage in type files.
   - Correct suffix naming.

### Type Committee

For large applications, a rotating "type steward" role reviews all type-related PRs for consistency with this specification.

---

## 41. Best Practices

### Summary of Rules

1. **Types are inferred from Zod schemas**, not hand-written (DTOs and form models).
2. **Domain models are independent from DTOs**.
3. **Mapper functions are explicit and tested**.
4. **Component props are as primitive as possible**.
5. **View Models are feature-scoped**, not global.
6. **State uses `AsyncState<T>` discriminated union**.
7. **All IDs are branded**.
8. **readonly on all external data types**.
9. **Suffixes are required** — no generic `User` export, always `UserDto` vs `User`.
10. **Discriminated unions over enums**.
11. **One type per file**.
12. **Error types are discriminated unions** — never `Error` or `unknown`.
13. **Configuration is typed with `satisfies AppConfig`**.
14. **Permissions are type-safe** — no string comparisons.
15. **Versioning is explicit** at the API type layer.
16. **No inline transformations in JSX**.
17. **No `any` in type files** (exceptions: generic JSON parsing with validation).

---

## 42. Engineering Review

### Architecture Analysis

The proposed type architecture is a **clean, layered, DDD-aligned type system** that separates concerns clearly:

- API types describe the transport layer.
- Domain types describe business concepts.
- View models describe presentation needs.
- Form models describe user input.
- Component props describe UI contracts.

The separation prevents the coupling that makes frontends brittle under API evolution. The mapper layer absorbs backend changes. The Zod schema layer protects against runtime contract violations.

### Type Safety Analysis

- **Compile-time safety:** branded IDs, discriminated unions, and strict readonly prevent the most common type errors.
- **Runtime safety:** Zod validation at every API boundary catches contract violations.
- **Exhaustiveness checking:** Discriminated unions with `never`-type exhaustiveness checks in reducers and handlers.
- **No escape hatches:** No `as any`, no `@ts-ignore`, no `as` casts in mappers.

### API Contract Analysis

- Synchronous type definitions per endpoint.
- Versioning at the type level.
- Zod validation ensures the frontend never processes data that violates the contract.
- Mapper functions shield the frontend from backend shape changes.

### Dependency Analysis

**Clean:** No circular dependencies in the type layer. Dependency direction is strictly top-down:

```
API → Domain → View → (Feature) → Props
```

Type categories import only from lower-level categories (utils is leaf, api imports utils, domain imports api + utils, etc.).

### Maintainability Analysis

- **Low coupling:** Each feature owns its view models and form types.
- **High cohesion:** Types are grouped by domain and by class.
- **Testability:** Mapper functions are pure and unit-testable.
- **Discoverability:** File naming conventions make any type findable.

### Scalability Analysis

- Adding a new endpoint: define DTO + Zod schema + mapper.
- Adding a new feature: add feature `_types/` with view + form types.
- Adding a new domain: add files in `api/`, `domain/`, and optionally `view/`.
- Each addition is additive — no existing types change.

### Performance Analysis

- No runtime performance impact from generics or union types.
- Zod parsing happens at fetch boundaries, not in render cycles.
- Type inference overhead is build-time only.

### Future Expansion Recommendations

1. **OpenAPI schema generation** — derive Zod schemas from OpenAPI spec to eliminate manual DTO definitions.
2. **GraphQL codegen** — if GraphQL is adopted, generate types, not hand-write them.
3. **Type testing** — add `@ts-expect-error` tests for utility types and conditional types.
4. **Schema-first API** — publish the Zod schema as the API contract (backend validates against the same schema).
5. **Automated type audit** — `scripts/verify-types.mjs` in CI to enforce all rules.

---

## 43. Implementation Checklist

When implementing this specification, verify:

- [ ] `@/types/api/` exists with DTOs + Zod schemas for every endpoint
- [ ] `@/types/domain/` exists with domain models + branded IDs
- [ ] `@/types/auth/` exists with typed permissions and roles
- [ ] `@/types/errors/` exists with `AppError` discriminated union
- [ ] `@/types/state/` exists with `AsyncState<T>` generic
- [ ] `@/types/events/` exists with `AppEvent` discriminated union
- [ ] `@/types/view/` exists with cross-feature presentation models
- [ ] `@/types/utils/` exists with utility types
- [ ] `@/types/shared/` exists with shared generic types
- [ ] `@/lib/mappers/domain/` exists with all DTO → Domain mappers
- [ ] Each feature has `_types/` with view models + form types
- [ ] ESLint rules enforce import/no-restricted-paths between type layers
- [ ] Zod schemas are the source of truth for all DTOs and form data
- [ ] All public types have JSDoc documentation
- [ ] All ID types are branded
- [ ] All discriminated unions have exhaustiveness checking
- [ ] `src/types/` fully organized per folder structure in Section 35