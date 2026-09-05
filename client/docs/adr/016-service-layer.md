# ADR 016: Service Layer Specification

**Status:** Implemented  
**Date:** 2026-07-09  
**Stage:** 16  
**Dependencies:** Stage 13 (Data & API Layer), Stage 14 (Hooks Layer), Stage 15 (State Layer)  
**Next:** Stage 17 (Security Layer)

---

## Table of Contents

1. [Service Philosophy](#1-service-philosophy)
2. [Service Architecture](#2-service-architecture)
3. [Service Responsibilities](#3-service-responsibilities)
4. [Service Classification](#4-service-classification)
5. [Service Ownership](#5-service-ownership)
6. [Service Lifecycle](#6-service-lifecycle)
7. [Business Workflow Design](#7-business-workflow-design)
8. [Use Case Modeling](#8-use-case-modeling)
9. [Service Boundaries](#9-service-boundaries)
10. [Service Communication](#10-service-communication)
11. [State Integration](#11-state-integration)
12. [Repository Integration](#12-repository-integration)
13. [API Integration](#13-api-integration)
14. [Validation Coordination](#14-validation-coordination)
15. [Authorization Coordination](#15-authorization-coordination)
16. [Error Handling Strategy](#16-error-handling-strategy)
17. [Loading Coordination](#17-loading-coordination)
18. [Transaction Strategy](#18-transaction-strategy)
19. [Retry Coordination](#19-retry-coordination)
20. [Optimistic Workflow Strategy](#20-optimistic-workflow-strategy)
21. [Service Composition](#21-service-composition)
22. [Shared Service Strategy](#22-shared-service-strategy)
23. [Feature Service Strategy](#23-feature-service-strategy)
24. [Dependency Injection Strategy](#24-dependency-injection-strategy)
25. [Concurrency Strategy](#25-concurrency-strategy)
26. [Async Workflow Management](#26-async-workflow-management)
27. [Event Coordination](#27-event-coordination)
28. [Notification Coordination](#28-notification-coordination)
29. [Logging Strategy](#29-logging-strategy)
30. [Monitoring Integration](#30-monitoring-integration)
31. [Performance Considerations](#31-performance-considerations)
32. [Caching Coordination](#32-caching-coordination)
33. [Offline Workflow Strategy](#33-offline-workflow-strategy)
34. [Security Considerations](#34-security-considerations)
35. [Testing Strategy](#35-testing-strategy)
36. [Mocking Strategy](#36-mocking-strategy)
37. [Documentation Strategy](#37-documentation-strategy)
38. [Governance Strategy](#38-governance-strategy)
39. [Versioning Strategy](#39-versioning-strategy)
40. [Scalability Strategy](#40-scalability-strategy)
41. [Maintainability](#41-maintainability)
42. [Enterprise Best Practices](#42-enterprise-best-practices)

---

## 1. Service Philosophy

### Purpose

Define the foundational philosophy that governs every service in the application. The Service Layer is the **single authority for business logic execution** — it is not a pass-through to the repository and not a thin wrapper over API calls.

### Engineering Rationale

In feature-oriented architectures without a dedicated service layer, business logic leaks into hooks, components, and state stores. This creates four systemic problems:

1. **Logic duplication** — the same business rule (e.g., "an event can only be RSVP'd if it's within 7 days of the event date") is replicated across hooks, utilities, and validation schemas.
2. **Untestable workflows** — business logic embedded in hooks and components requires DOM simulation to test, adding brittleness and setup cost.
3. **Hidden orchestration complexity** — multi-step workflows (e.g., "register for event → update RSVP count → send confirmation notification → refresh badge count") are scattered across useEffect chains and store subscriptions.
4. **Architecture erosion** — as features grow, UI code and business logic become entangled, making backend migration or API changes disproportionately costly.

### Recommended Option

Every business use case is represented as a **Service Function** — a pure TypeScript function that accepts a service context (repositories, stores, validators) and returns typed results. Services are NOT classes, NOT singletons, and NOT instantiated through constructors.

### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **Service Functions** (Recommended) | Framework-agnostic, tree-shakeable, trivially testable, no DI container needed | Less familiar to OOP-background teams |
| **Service Classes** | Familiar DI patterns (constructor injection), lifecycle hooks | Heavier test setup, harder to tree-shake, encourages stateful services |
| **Service Hooks** | Seamless React integration | Untestable without React, couples business logic to UI framework, violates separation of concerns |

### Industry Best Practice

Stripe's frontend architecture, Vercel's SDK design, and Shopify's Polaris patterns all converge on **function-based service boundaries** with explicit dependency injection through a context object. This is consistent with the hexagonal architecture port-adapter pattern: services are ports, repositories are adapters.

### Recommendation

**Adopt Service Functions** as the single pattern for business logic orchestration. A service function has the signature:

```
(params, context) → Promise<ServiceResult<T>>
```

Where `context` is an explicitly injected object containing all dependencies (repositories, stores, validators, event bus, logger). This makes every service function unit-testable with zero mocking framework overhead.

---

## 2. Service Architecture

### Purpose

Define the structural arrangement of services within the application. The architecture must support feature isolation, shared business logic, and clean dependency flow.

### Engineering Rationale

Without an explicit architecture, services tend to form a flat namespace where any service can import any other service. This creates circular dependencies, unclear ownership, and a "big ball of mud" at the business logic layer.

### Recommended Option

**Three-tier service topology:**

```
                     ┌─────────────────────────────────┐
                     │     Infrastructure Services      │
                     │  (logging, error, validation,    │
                     │   event bus, auth, cache)        │
                     └─────────────────────────────────┘
                                    │
                     ┌─────────────────────────────────┐
                     │       Shared Services            │
                     │  (notification, search, upload,  │
                     │   pagination, permission)        │
                     └─────────────────────────────────┘
                                    │
         ┌────────────┬──────────────┬──────────────┐
         │            │              │              │
  ┌────────────┐ ┌────────┐ ┌────────────┐ ┌────────────┐
  │  Auth      │ │ Events │ │  Alumni    │ │  Jobs      │
  │  Service   │ │Service │ │  Service   │ │  Service   │
  └────────────┘ └────────┘ └────────────┘ └────────────┘
  │  Profile   │ │ Msg    │ │  Directory │ │  Admin     │
  │  Service   │ │Service │ │  Service   │ │  Services  │
  └────────────┘ └────────┘ └────────────┘ └────────────┘
```

**Dependency direction:** Feature Services → Shared Services → Infrastructure Services.  
No Feature Service may import another Feature Service. Cross-feature workflows use the Event Bus (Stage 15).

### Trade-offs

| Topology | Pros | Cons |
|----------|------|------|
| **Three-tier** (Recommended) | Clear ownership, prevents cycles, matches folder structure | Requires discipline in code review |
| Flat namespace | Simple to start | Unmaintainable beyond 5 services |
| Per-page services | Maximum isolation | Massive duplication, no shared logic |

### Industry Best Practice

Atlassian's frontend monorepo and Google's web UI architecture both use a tiered service model where infrastructure services are universal, shared services are cross-cutting, and feature services own domain logic.

### Recommendation

**Three-tier topology with strict dependency lint rules.** Feature services in `features/*/_services/`, shared services in `src/lib/services/`, infrastructure services in `src/lib/services/infra/`. Import violations are caught by ESLint `no-restricted-paths`.

---

## 3. Service Responsibilities

### Purpose

Define exactly what a service does and — equally important — what it does NOT do. Clear responsibility boundaries prevent architectural drift.

### Engineering Rationale

When responsibilities blur, services become anemic (pure pass-through to repositories) or god objects (absorbing validation, formatting, UI logic). Both extremes defeat the purpose of the layer.

### Recommended Option

A service has exactly **five responsibilities**, and nothing else:

| # | Responsibility | Description | Example |
|---|---------------|-------------|---------|
| 1 | **Orchestrate** | Sequence multi-step workflows in the correct order with proper error handling | `createEvent → validate → authorize → persist → invalidate cache → emit event → return result` |
| 2 | **Apply Business Rules** | Enforce domain logic that spans beyond a single entity | "User cannot RSVP if event is full AND waitlist is disabled" |
| 3 | **Coordinate State** | Update client stores after mutations | After RSVP succeeds, increment the event's attendee count in the local cache store |
| 4 | **Translate Contracts** | Convert between API DTOs and UI-friendly view models | Map `PaginatedResponse<EventDto>` to `ServiceResult<EventCardVM[]>` with computed fields |
| 5 | **Handle Errors** | Normalize, classify, and escalate failures | Wrap repository errors with business context: "Failed to create event: event date is in the past" |

### What a Service Must NOT Do

| Forbidden Responsibility | Why |
|-------------------------|-----|
| Access DOM or browser APIs | Creates testability coupling |
| Manage React state directly | Belongs to stores (Stage 15) |
| Render UI or manage visibility | Belongs to components/sections |
| Define form validation schemas | Belongs to Zod schemas (Stage 10) |
| Make raw HTTP calls | Belongs to the API client (Stage 13) |
| Import from `next/*` or `react/*` | Framework coupling makes services untestable outside Next.js |

### Trade-offs

Strict responsibility boundaries increase the number of files per feature. A single "create event" flow touches: service, validator, repository, store, event bus, and UI hooks. This is intentional — each concern is independently testable and swappable.

### Industry Best Practice

This follows the **Single Responsibility Principle** as applied in domain-driven design. Each service function owns one complete use case. If a function does two conceptually different things, it should be two service functions.

### Recommendation

**Enforce responsibility boundaries via ESLint rules and code review.** Every service file should be reviewable with a single question: "Does this function do more than orchestrate, apply rules, coordinate state, translate contracts, or handle errors?"

---

## 4. Service Classification

### Purpose

Categorize every service by its scope, state interaction pattern, and lifecycle. Classification determines where the service lives, how it's tested, and when it's instantiated.

### Engineering Rationale

Without classification, teams create inconsistent service patterns. Some services become stateful singletons, others become stateless utilities. Classification provides a shared vocabulary and structural consistency.

### Recommended Option

**Six service classes:**

| Class | Scope | State Interaction | Lifecycle | Example |
|-------|-------|-------------------|-----------|---------|
| **Infrastructure** | Application-wide | None | App lifetime | `errorService`, `cacheService`, `validationService` |
| **Auth** | Application-wide | Read-only from auth store | App lifetime | `authService`, `sessionService`, `permissionService` |
| **Shared** | Cross-feature | Read/write from shared stores | App lifetime | `notificationService`, `searchService`, `uploadService` |
| **Feature** | Single feature | Read/write from feature stores | Route enter to route leave | `eventService`, `jobService`, `directoryService` |
| **Composite** | Multi-feature | Coordinates multiple stores | Request scope | `dashboardService` (reads from event + job + message services) |
| **Transient** | Single action | None (stateless) | Single call | `rsvpService.exportAttendees` |

### Classification Rules

1. **Infrastructure services** must never import feature logic or shared business rules.
2. **Auth services** must never mutate stores — only read.
3. **Feature services** must never import another feature's service directly. Use event bus for cross-feature coordination.
4. **Composite services** are the only services permitted to call multiple feature services.
5. **Transient services** must be pure functions with no side effects beyond their return value.

### Trade-offs

Over-classification creates bureaucracy. Under-classification creates ambiguity. The six classes above balance precision with simplicity and map directly to file system locations.

### Industry Best Practice

This classification mirrors **Domain-Driven Design's layered architecture** where Application Services (feature), Domain Services (shared), and Infrastructure Services map to distinct layers with strict dependency rules.

### Recommendation

**Every service file must declare its class in a JSDoc `@category` tag.** This is enforced by a lint rule and used by automated documentation generators.

---

## 5. Service Ownership

### Purpose

Define which team or developer owns which service and the boundaries of that ownership.

### Engineering Rationale

In feature-oriented architectures, ownership ambiguity causes three problems: merge conflicts on shared files, unclear accountability for bugs, and resistance to refactoring.

### Recommended Option

**Single ownership per service file.** The feature team owns all services in `features/<name>/_services/`. The platform team owns `src/lib/services/`. Cross-cutting changes require RFC and review from both teams.

### Ownership Matrix

| Service | Owner | Review Required From |
|---------|-------|---------------------|
| `features/events/_services/` | Events Feature Team | — |
| `features/jobs/_services/` | Jobs Feature Team | — |
| `features/auth/_services/` | Auth Feature Team | Security team |
| `src/lib/services/notificationService` | Platform Team | All feature teams |
| `src/lib/services/validationService` | Platform Team | All feature teams |
| `src/lib/services/infra/cacheService` | Platform Team | Infrastructure team |

### Trade-offs

Single ownership can create knowledge silos. Mitigate through:
- Mandatory code review rotation across teams
- Shared ownership of infrastructure services
- Architecture review for any service that grows beyond 300 lines

### Industry Best Practice

Spotify's **squad model** and Google's **ownership through CODEOWNERS** both use file-level ownership with cross-team review requirements for shared boundaries.

### Recommendation

**Define ownership in CODEOWNERS.** Feature service directories are owned by their respective teams. The `src/lib/services/` directory is owned by the platform team with `@global-owners` as secondary.

---

## 6. Service Lifecycle

### Purpose

Define when services are created, how long they live, and when they are destroyed.

### Engineering Rationale

Long-lived stateful services cause memory leaks. Short-lived services with expensive initialization cause performance problems. Without an explicit lifecycle strategy, services default to singleton modules with implicit global state.

### Recommended Option

**Lifecycle-per-class:**

| Class | Creation | Destruction | Instance Strategy |
|-------|----------|-------------|-------------------|
| Infrastructure | App bootstrap | Never | Singleton module |
| Auth | App bootstrap | On logout | Singleton re-initialized on auth change |
| Shared | First import | Never | Singleton module |
| Feature | Route enter | Route leave | Scoped to feature mount |
| Composite | Demand | After response | Instantiated per call |
| Transient | Call time | After return | Created and garbage-collected per call |

### Stateful vs Stateless Services

- **Stateless services** (infrastructure, shared, transient) are exported as plain function modules. Zero initialization cost.
- **Stateful services** (auth, feature) are created through a factory function that accepts context and returns service functions bound to that context.

### Trade-offs

Factory-based services add indirection but prevent implicit global state. Module-level singletons are simpler but leak state across route transitions.

### Industry Best Practice

React Query's service-like architecture uses per-query scope. Stripe's frontend SDK uses factory functions for stateful services. Both patterns converge on: **stateless by default, factory for stateful**.

### Recommendation

**Stateless services as plain modules. Stateful services as factory functions.** No service class may have module-level mutable state.

---

## 7. Business Workflow Design

### Purpose

Define the standard pattern for implementing multi-step business workflows within a service function.

### Engineering Rationale

Business workflows (e.g., "RSVP to event") involve multiple steps: validation, authorization, optimistic update, API call, error recovery, cache invalidation, event emission. Without a standard pattern, each service implements these steps differently, creating inconsistency and hard-to-find bugs.

### Recommended Option

**Uniform workflow pipeline using a `withWorkflow` wrapper:**

```
withWorkflow(context, async (workflow) => {
  1. workflow.validate(input)         → schema validation
  2. workflow.authorize(user, rule)   → permission check
  3. workflow.optimistic(store, data) → immediate UI update
  4. workflow.persist(repository)     → API call with retry
  5. workflow.invalidate(cacheTags)   → cache clear
  6. workflow.emit(event)             → event bus publish
  7. workflow.notify(toast)           → user notification
})
```

Each step in the pipeline has typed input/output, a consistent error path, and automatic rollback on failure. Steps are optional — a read-only service only needs steps 2 and 4.

### Pipeline Step Details

| Step | Purpose | Success | Failure |
|------|---------|---------|---------|
| `validate` | Check input against schema | Continue | Return `ValidationError` |
| `authorize` | Check permissions | Continue | Return `AuthorizationError` |
| `optimistic` | Apply change to local store | Continue | Rollback on failure |
| `persist` | Call repository | Return data | Rollback optimistic update |
| `invalidate` | Clear stale cache | Continue | Log warning (non-critical) |
| `emit` | Publish event bus event | Continue | Log warning (non-critical) |
| `notify` | Show user notification | Continue | Swallow (non-critical) |

### Trade-offs

A pipeline wrapper adds abstraction. For simple two-step workflows (validate + persist), the wrapper may feel heavy. However, workflows consistently grow over time — starting with a pipeline prevents later refactoring.

### Industry Best Practice

Amazon's **Step Functions** and **Temporal.io** both use pipeline/workflow primitives to model business processes. The frontend equivalent is a lightweight pipeline that mirrors the backend's workflow engine.

### Recommendation

**Adopt a `withWorkflow` helper in `src/lib/services/infra/workflow-service.ts`.** Every feature service uses it. The helper is ~50 lines of TypeScript with zero dependencies on React or Next.js.

---

## 8. Use Case Modeling

### Purpose

Define how individual business use cases are identified, named, and mapped to service functions.

### Engineering Rationale

Ambiguous use case naming leads to inconsistent APIs. Some services use `createX`, others `newX`, others `addX`. Some combine unrelated operations into a single function. Standardized use case modeling eliminates this inconsistency.

### Recommended Option

**Every service function maps to exactly one actor goal.** The naming convention is `<verb><DomainEntity>` in camelCase.

| Actor | Use Case | Service Function |
|-------|----------|-----------------|
| Alumni | View upcoming events | `getUpcomingEvents` |
| Alumni | RSVP to event | `rsvpToEvent` |
| Alumni | Cancel RSVP | `cancelRsvp` |
| Admin | Create announcement | `createAnnouncement` |
| Admin | Approve alumni registration | `approveRegistration` |
| Admin | Generate event report | `generateEventReport` |
| System | Send reminder notifications | `sendEventReminders` |
| System | Archive past events | `archivePastEvents` |

### Use Case Template

Every use case is documented with:

```
Use Case: <name>
Actor: <who triggers this>
Preconditions: <what must be true before>
Postconditions: <what must be true after>
Primary Flow: <happy path steps>
Alternative Flows: <error paths, edge cases>
Business Rules: <domain constraints enforced>
```

### Trade-offs

Formal use case documentation adds overhead. For simple CRUD operations, the template feels bureaucratic. Value emerges for workflows with 4+ steps, multiple actors, or regulatory requirements.

### Industry Best Practice

**Alistair Cockburn's Use Case template** (used by IBM, NASA, and enterprise banking systems) is the gold standard. The frontend adaptation above retains the structure while dropping implementation-irrelevant sections (technology constraints, frequency of use).

### Recommendation

**Use case documentation is mandatory for all non-CRUD workflows.** CRUD workflows follow the standard `create/read/update/delete/list/invalidate` naming pattern and do not need individual use case docs.

---

## 9. Service Boundaries

### Purpose

Define where one service ends and another begins. Service boundaries prevent bloat, clarify ownership, and enable independent development.

### Engineering Rationale

Without explicit boundaries, services naturally grow. An `eventService` that starts with CRUD operations accumulates RSVP logic, calendar export logic, notification scheduling, and reporting. Eventually it becomes unmaintainable.

### Recommended Option

**One service file per domain aggregate.** An aggregate is a cluster of domain objects that are changed together.

| Feature | Aggregate | Service File |
|---------|-----------|-------------|
| Events | Event | `eventService` |
| Events | RSVP | `rsvpService` (separate — changes for different reasons than events) |
| Events | Calendar | `calendarService` (separate — export logic is independent) |
| Jobs | Job | `jobService` |
| Jobs | Application | `applicationService` |
| Directory | Profile | `profileService` |
| Directory | Search | `directoryService` |

### Boundary Rules

1. A service file must not exceed **250 lines**. Beyond that, extract a sub-service.
2. A service must not import from **more than 3 different feature directories**. Beyond that, it's a composite service.
3. A service must not depend on **more than 5 repositories**. Beyond that, split the service.
4. Domain aggregates that can be updated independently must be in **separate service files**.

### Trade-offs

Fine-grained boundaries increase the number of files. A feature like Events might have 4-6 service files. However, each file is independently testable, independently documented, and independently owned.

### Industry Best Practice

**Domain-Driven Design's Aggregate pattern** (Eric Evans) provides the theoretical foundation. Vaughn Vernon's "Implementing Domain-Driven Design" recommends one aggregate per service boundary.

### Recommendation

**Boundaries are enforced through file size linting and import count linting.** Teams that follow the aggregate pattern report significantly fewer merge conflicts and faster onboarding.

---

## 10. Service Communication

### Purpose

Define how services exchange information without creating direct dependencies between feature services.

### Engineering Rationale

When service A directly imports service B, a change to B's internal logic can break A. Over time, the dependency graph becomes a tangled mesh. The Event Bus pattern from Stage 15 breaks this coupling.

### Recommended Option

**Three communication channels, each for a specific purpose:**

| Channel | Purpose | Synchronous? | Example |
|---------|---------|-------------|---------|
| **Direct import** | Service A calls Service B's exposed function | Yes | Dashboard composite service calls eventService + jobService |
| **Event Bus** | Service A notifies interested parties an action occurred | No | After RSVP, emit `events:rsvp-changed` → notificationService picks it up |
| **Shared Store** | Service A writes to a store; Service B reads it | No | After profile update, write to profile store → directory service reads updated data |

### Rules

1. **Direct import is allowed only for:** composite services calling feature services, shared services calling infrastructure services.
2. **Event Bus is preferred for:** cross-feature notifications, cache invalidation triggers, side effects.
3. **Shared Store is preferred for:** state that multiple features read but only one feature writes.
4. **Direct import between feature services is FORBIDDEN.** Violations cause circular dependency cycles.

### Trade-offs

Event-driven communication is harder to debug than direct calls (no explicit call stack). However, it's the only way to maintain independent deployability of features.

### Industry Best Practice

**Event-driven architecture** is standard at Netflix, Amazon, and Uber for decoupling services. At the frontend layer, the same principle applies with lighter infrastructure (event bus vs. Kafka).

### Recommendation

**Enforce the "no direct feature-to-feature service import" rule via ESLint.** Use a lint rule that blocks imports from `features/*/_services/` into any file outside that feature's directory, except for composite services in `features/composite/`.

---

## 11. State Integration

### Purpose

Define how services read from and write to client-side state stores (Stage 15) without becoming coupled to the state management library.

### Engineering Rationale

If a service directly imports `useAuthStore`, it's coupled to Zustand. Migrating to Redux Toolkit requires changing every service. Services must interact with state through an abstraction.

### Recommended Option

**Store adapters.** A store adapter is a thin module in the service's directory that exposes only the store operations the service needs:

```
features/events/_services/
├── eventService.ts       # Business logic — imports adapter
├── eventService.types.ts # Service-specific types
└── storeAdapter.ts       # State operations — ONLY file importing Zustand
```

The adapter pattern:
```
// storeAdapter.ts (only file that knows about Zustand)
import { useEventsCacheStore } from "@/features/events/stores";

export function readEventsCache() { return useEventsCacheStore.getState(); }
export function updateAttendeeCount(eventId, delta) {
  useEventsCacheStore.getState().adjustAttendeeCount(eventId, delta);
}
export function invalidateCache() { useEventsCacheStore.getState().invalidate(); }
```

The service never imports `zustand` or any store directly.

### Adapter Rules

1. Adapters expose only **`getState()` and action functions** — never the hook itself. Services are not React components.
2. Adapters must be **stateless** — they proxy to the store.
3. Adapters are **not unit-tested** separately (they delegate to stores, which have their own tests).
4. A store adapter must never import services or repositories.

### Trade-offs

The adapter layer adds 1-2 files per feature service. It's boilerplate that pays off during state library migrations.

### Industry Best Practice

**Hexagonal Architecture's port-adapter pattern.** The store interface is the port; the Zustand adapter is the implementation. Swapping implementations does not change the service.

### Recommendation

**Adopt the store adapter pattern for all feature services.** Shared services (in `src/lib/services/`) may read global stores directly since those stores are stable and rarely swapped.

---

## 12. Repository Integration

### Purpose

Define how services consume repositories from Stage 13 without leaking data access patterns into business logic.

### Engineering Rationale

Repositories return `Result<T>` types — services must unwrap these, handle failures, and transform data. If services pass repository errors directly to the UI, the UI must interpret raw API errors. Services should translate errors into business-meaningful messages.

### Recommended Option

**Repository injection through service context.** The service receives a `repository` object as part of its context parameter:

```
type EventServiceContext = {
  eventRepo: Repository;
  rsvpRepo: Repository;
  storeAdapter: EventStoreAdapter;
  eventBus: EventBus;
  logger: Logger;
};
```

The service calls `eventRepo.getById(id)` and wraps the `Result<T>` in a `ServiceResult<T>` that adds business context.

### Repository-to-Service Contract

| Repository Returns | Service Transforms To |
|-------------------|----------------------|
| `Result<T>` | `ServiceResult<T>` |
| `Result<PaginatedResponse<T>>` | `ServiceResult<{ items: VM[], total, hasMore }>` |
| `FailureResult` | `ServiceResult` with categorized business error |

### Error Translation Rules

1. **Never pass raw API errors to the UI.** Translate them:
   - `NOT_FOUND` → "The event you're looking for was removed or expired."
   - `CONFLICT` → "You've already RSVP'd to this event."
   - `VALIDATION` → "Please check your input and try again."
2. **Preserve the original error** in `error.cause` for debugging.
3. **Use error codes** (strings, not numbers) for the UI to key on: `"EVENT_ALREADY_RSVPED"`, `"EVENT_FULL"`.

### Trade-offs

Error translation adds code but dramatically improves user experience. Raw API errors are unhelpful: `"Error: 409"` becomes `"You've already responded to this invitation."`

### Industry Best Practice

**Stripe's API error model** — every error has a `type`, `code`, and `message`. The frontend SDK maps these to human-readable messages without losing the structured error data.

### Recommendation

**Every service function wraps repository calls in a business-aware error boundary.** The `withWorkflow` pipeline's `persist` step automatically translates repository errors.

---

## 13. API Integration

### Purpose

Define the boundary between services and API communication. Services must not make raw HTTP calls, construct URLs, or handle request/response serialization.

### Engineering Rationale

When services construct API URLs and handle HTTP details, every API change requires service changes. The Repository pattern (Stage 13) exists precisely to isolate HTTP concerns.

### Recommended Option

**Zero HTTP awareness in services.** Services interact exclusively through repositories. The repository is the only layer that knows about:
- API endpoint paths
- HTTP methods
- Request/response serialization
- Authentication token injection
- Request cancellation

### What Services Must Do With API Responses

| API Response | Service Action |
|-------------|---------------|
| Success with data | Transform to view model if needed, return |
| Success with empty | Return empty state with metadata |
| Validation error | Re-throw with field-level business context |
| Auth error | Signal auth store for token refresh |
| Network error | Check retry policy, determine offline fallback |
| Unexpected error | Log with correlation ID, return generic error |

### Trade-offs

The strict boundary means that adding a new API field requires changes in the DTO type, the repository, and potentially the service and view model. This is intentional — each layer validates the field independently.

### Industry Best Practice

**Backend-for-Frontend (BFF) pattern** — the frontend service layer acts as its own mini-BFF, transforming backend contracts into UI-optimized contracts.

### Recommendation

**Repositories return DTOs. Services transform DTOs to view models.** The transformation is explicit and type-safe, not implicit mapping.

---

## 14. Validation Coordination

### Purpose

Define how services coordinate input validation, including when validation happens, who owns validation rules, and how errors are reported.

### Engineering Rationale

In layered architectures, validation appears in multiple places: Zod schemas (Stage 10), form components (react-hook-form), hooks (Stage 14), and services. Without coordination, rules are duplicated and inconsistent.

### Recommended Option

**Three-tier validation with clear handoffs:**

| Tier | Location | What It Validates | When |
|------|----------|-------------------|------|
| **Schema** | Zod schema in `src/types/` | Data shape and format | Before any service call |
| **Service** | Service function | Business rules across entities | After schema, before repository |
| **API** | Backend | All rules (authoritative) | After service |

### Service Validation Rules

- **Pre-condition validation:** Check that the system state supports the operation (e.g., "event is not full before RSVP").
- **Authorization validation:** Check that the user has permission (delegated to authorization service).
- **Idempotency validation:** Check that the operation hasn't already been performed (e.g., "user hasn't already RSVP'd").

### Error Aggregation

Multiple validation errors must be aggregated and returned together, not fail-fast on the first error:

```
ServiceResult<{ errors: [{ field, code, message }] }>
```

### Trade-offs

Three-tier validation means rules exist in up to three places. Schema validation and backend validation are essential. Service validation is the middle ground that catches business rule violations before they reach the API.

### Industry Best Practice

**The validation pyramid** — schema validation is wide (catches most errors), service validation is narrow (catches business rule violations), API validation is the authoritative source. Each layer trusts but verifies the previous layer.

### Recommendation

**Service validation is mandatory for any operation that modifies data.** Read operations may skip service-level validation (schema validation is sufficient).

---

## 15. Authorization Coordination

### Purpose

Define how services enforce authorization rules without coupling to the auth implementation.

### Engineering Rationale

Authorization rules differ by use case: "anyone can read public events," "only admins can create events," "only the event creator can edit it." Embedding these rules in components or hooks creates security holes when new entry points bypass those components.

### Recommended Option

**Authorization is a service-level concern, enforced in the workflow pipeline before any mutation.** The service receives the current user from its context and checks permissions before proceeding.

### Authorization Integration Points

| Integration | Purpose | Implementation |
|-------------|---------|---------------|
| `workflow.authorize` | Use-case-level gate | Check role + resource + action against Permission matrix |
| `service.authorize` | Entity-level gate | Check ownership: "does this user own this event?" |
| `repository.authorize` | Data-level gate | Repository filters results based on user permissions |

### Authorization Rules for Services

1. **Every mutation service must call `authorize` as its second step** (after validate, before any state change).
2. **Read services must filter results based on user role** (e.g., alumni see published events; admins see all).
3. **Resource ownership checks** (e.g., "can this user edit this profile?") are the service's responsibility, not the repository's.
4. **Authorization failures must return `AuthorizationError`**, not a generic 403. The UI needs to distinguish "not logged in" from "insufficient permissions" from "not your resource."

### Trade-offs

Centralized authorization adds a dependency on the auth store and permission definitions. The benefit is that no code path can accidentally execute a mutation without permission checks.

### Industry Best Practice

**Stripe's authorization model** checks permissions at the API boundary (before any business logic). The frontend equivalent is checking at the service layer — if the service is the entry point for business operations.

### Recommendation

**Use an `authorize` helper in the workflow pipeline.** The helper accepts the user, the required permission, and optionally an ownership check function. It throws `AuthorizationError` on failure.

---

## 16. Error Handling Strategy

### Purpose

Define how services handle, classify, and propagate errors consistently across all use cases.

### Engineering Rationale

Without a strategy, services handle errors ad hoc: some re-throw, some return null, some log and swallow, some pass raw API errors to the UI. This creates unpredictable user experiences and makes debugging difficult.

### Recommended Option

**All service errors are `ServiceError` discriminated unions:**

```
type ServiceErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "NETWORK_ERROR"
  | "TIMEOUT_ERROR"
  | "SERVER_ERROR"
  | "UNEXPECTED_ERROR";

type ServiceError = {
  code: ServiceErrorCode;
  message: string;         // User-facing
  detail: string;          // Developer-facing
  field?: string;          // For field-level validation
  cause?: unknown;         // Original error (dev-only)
  retryable: boolean;
};
```

### Error Handling Rules

1. **All service functions return `ServiceResult<T>`** — never throw exceptions for expected errors.
2. **Expected errors** (validation, authorization, conflict, not found) are returned as typed error results.
3. **Unexpected errors** (network timeout, server 500) are caught, logged, and returned as `UNEXPECTED_ERROR`.
4. **Errors must never bubble uncaught from a service.** The workflow pipeline catches all exceptions.
5. **User-facing messages must not leak implementation details** (no stack traces, no internal IDs).

### Error-to-UI Mapping

| ServiceError.code | UI Treatment |
|-------------------|-------------|
| `VALIDATION_ERROR` | Field-level error on form |
| `AUTHORIZATION_ERROR` | Toast + redirect to login |
| `NOT_FOUND` | 404 page or inline "not found" |
| `CONFLICT` | Toast with resolution action |
| `NETWORK_ERROR` | Offline banner + retry button |
| `TIMEOUT_ERROR` | Toast + retry button |
| `SERVER_ERROR` | Toast + support contact info |
| `UNEXPECTED_ERROR` | Toast + "Something went wrong" |

### Trade-offs

Returning errors instead of throwing means every call site must check `result.success`. This is consistent with the Repository pattern (Stage 13) and forces callers to handle failure.

### Industry Best Practice

**Rust's `Result<T, E>` pattern** and **Elm's error handling** both use discriminated union types for errors. TypeScript's discriminated unions make this pattern type-safe and ergonomic.

### Recommendation

**Service functions return `ServiceResult<T>` which is a discriminated union of success and error types.** The workflow pipeline provides helpers to match on error codes.

---

## 17. Loading Coordination

### Purpose

Define who sets loading states, who clears them, and how the UI knows an operation is in flight.

### Engineering Rationale

Loading state management is often fragmented: hooks set loading, components clear it, services are unaware. This leads to "stuck loading" bugs where a state transition fails and the spinner never disappears.

### Recommended Option

**Loading state is owned by the hook layer (Stage 14), not the service layer.** Services are agnostic to loading indicators. The hook wrapping a service call manages the `isLoading` / `isExecuting` state.

### Loading Lifecycle

```
Hook: setIsLoading(true)
Hook: await service.execute(params)
Hook: setIsLoading(false)
Hook: handle result (success → update stores, error → show toast)
```

### Why Not in Services?

| Argument | Counter-argument |
|----------|-----------------|
| "Services could set loading in stores" | Services would need to know about every UI that cares about loading — the wrong abstraction level |
| "Services could return loading state" | A service call is either in-flight or complete. The caller tracks in-flight state |
| "But it's repetitive in every hook" | A `useService` hook helper abstracts the pattern: `const { execute, isLoading } = useService(serviceFn)` |

### Exception

Long-running operations (file uploads, batch processing) may expose progress through a shared store that the service writes to and the UI reads from. This is a **progress channel**, not loading state.

### Industry Best Practice

**React Query's `useMutation`** pattern — the hook manages `isLoading`, `isError`, `isSuccess`. The service/mutation function manages business logic. The store manages cached data. Separation of concerns.

### Recommendation

**Services do not manage loading state.** Hooks (Stage 14) manage loading state via a `useService` wrapper that standardizes the loading/success/error lifecycle.

---

## 18. Transaction Strategy

### Purpose

Define how services handle operations that span multiple repository calls where partial failure is unacceptable.

### Engineering Rationale

Business operations often involve multiple repository calls: "create event → send notification → update calendar." If the notification fails, should the event creation be rolled back? Without a transaction strategy, services implement ad hoc rollback logic that is easy to get wrong.

### Recommended Option

**Optimistic transaction pattern for frontend services:** assume success, commit changes, and provide compensation actions on failure.

| Step | Action | On Failure |
|------|--------|-----------|
| 1 | Update local store (optimistic) | Revert store change |
| 2 | Call repository 1 (primary entity) | Revert store change, return error |
| 3 | Call repository 2 (side effect) | Log warning, do NOT revert (best effort) |
| 4 | Call repository 3 (secondary) | Log warning, do NOT revert (best effort) |
| 5 | Invalidate cache | Skip invalidation |
| 6 | Emit event bus event | Skip emission |

### Transaction Levels

| Level | Guarantee | When to Use |
|-------|-----------|-------------|
| **Atomic** | All-or-nothing | Financial operations, account changes |
| **Best-effort** | Primary success required, side effects best-effort | Event creation, profile updates |
| **Fire-and-forget** | No rollback needed | Logging, analytics, notifications |

### Implementation

The workflow pipeline's `persist` step supports multi-step persistence with compensation:

```
workflow.transaction([
  { action: () => eventRepo.create(data), compensate: () => eventRepo.delete(id) },
  { action: () => notificationRepo.send(notif), compensate: () => {} },
]);
```

### Trade-offs

True atomic transactions are impossible at the frontend level (no distributed transaction coordinator). The optimistic pattern provides the best UX: the UI updates immediately and rolls back if the server rejects the operation.

### Industry Best Practice

**Saga pattern** — a sequence of local transactions where each step has a compensating action. This is the standard pattern for distributed transactions in microservices (Netflix, Uber) and applies equally to frontend multi-repository workflows.

### Recommendation

**Use optimistic transactions with compensation for all mutation workflows.** The `withWorkflow` pipeline supports this natively through its `transaction` helper.

---

## 19. Retry Coordination

### Purpose

Define when and how services retry failed operations, distinguishing between retryable and non-retryable failures.

### Engineering Rationale

Network errors, timeouts, and rate limits are transient — retrying often succeeds. Validation errors and authorization failures are permanent — retrying wastes resources and frustrates users. Services need a policy to distinguish these.

### Recommended Option

**Retry configuration per service call, inherited from the repository's default but overridable:**

```typescript
type RetryPolicy = {
  maxRetries: number;         // Default: 3 for mutations, 1 for reads
  baseDelayMs: number;        // Default: 1000
  maxDelayMs: number;         // Default: 30000
  backoffFactor: number;      // Default: 2
  jitter: boolean;            // Default: true
  retryableErrors: ErrorType[]; // Default: [TRANSPORT, TIMEOUT, RATE_LIMIT]
};
```

### Retry Rules

1. **Mutations** (create, update, delete): retry up to 3 times with exponential backoff. A mutation reaching the server but failing on the response does NOT retry (idempotency keys handle this).
2. **Reads** (list, detail): retry once after a short delay. Stale cache is preferred over waiting for retry.
3. **Non-retryable errors**: `VALIDATION`, `AUTHORIZATION`, `NOT_FOUND`, `CONFLICT` — fail immediately.
4. **Rate limits**: retry after the `Retry-After` header value, up to 2 times.
5. **Offline errors**: do not retry — switch to offline mode.

### Coordination with Repository

The repository (Stage 13) already implements retry logic for HTTP calls. The service layer adds a second layer of retry for business-level retries:

| Scenario | Repository Retry | Service Retry |
|----------|-----------------|---------------|
| HTTP 502 | Yes (x3) | No — repository handles it |
| HTTP 429 | Yes (x2 with Retry-After) | No — repository handles it |
| Offline | No (throws OFFLINE) | Yes — switch to offline mode |
| Optimistic conflict | No (returns CONFLICT) | Yes — refresh state, retry with fresh data |

### Trade-offs

Double retry (repository + service) can lead to excessive wait times. To avoid this, the repository handles transport-level retries, and the service handles business-level retries. They never both retry the same error.

### Industry Best Practice

**AWS SDK retry strategy** — exponential backoff with jitter is the industry standard. The frontend equivalent should mirror this with shorter timeouts (frontend users won't wait 30 seconds for retries).

### Recommendation

**Repository handles transport retries. Service handles business retries.** The workflow pipeline's `persist` step applies the appropriate retry policy based on the operation type.

---

## 20. Optimistic Workflow Strategy

### Purpose

Define how services update the UI immediately before the server confirms, and how they recover from server rejection.

### Engineering Rationale

Users perceive sub-300ms operations as instantaneous. API calls typically take 500-3000ms. Optimistic updates eliminate the perceived delay by applying changes to local state immediately and synchronizing with the server asynchronously.

### Recommended Option

**Optimistic workflow as the default for all user-initiated mutations:**

```
1. Capture current state snapshot
2. Apply change to local store immediately
3. Call repository (API)
4a. On success: invalidate cache, update store with server response
4b. On failure: rollback to snapshot, notify user, log error
```

### When to Use Optimistic vs. Pessimistic

| Use Case | Strategy | Rationale |
|----------|----------|-----------|
| RSVP to event | Optimistic | Low conflict probability, high UX value |
| Like/upvote | Optimistic | Idempotent, easy to roll back |
| Create entity | Pessimistic | Need server-generated ID |
| Payment | Pessimistic | Financial accuracy required |
| Delete entity | Optimistic | Immediate feedback, rollback rare |
| Profile update | Optimistic | User owns the data, low conflict |

### Rollback Strategy

```
type OptimisticSnapshot = {
  storeName: string;
  previousState: unknown;
  timestamp: number;
};

function rollback(snapshot: OptimisticSnapshot): void {
  // Restore store to pre-mutation state
  // Show toast "Your change could not be saved. It has been reverted."
  // Log the rollback with correlation ID
}
```

### Trade-offs

Optimistic updates add complexity (snapshot management, rollback logic) but dramatically improve perceived performance. For low-conflict operations, the UX benefit outweighs the complexity.

### Industry Best Practice

**Linear's optimistic UI** is the gold standard. Every action (creating an issue, updating a title, toggling a checkbox) updates the UI immediately. Reverts are silent and instant. This level of polish requires disciplined optimistic update patterns.

### Recommendation

**Optimistic is the default for all non-financial, non-conflict-prone mutations.** The workflow pipeline's `optimistic` step handles snapshot capture and rollback automatically.

---

## 21. Service Composition

### Purpose

Define how services are composed into higher-level workflows without creating circular dependencies or violating the dependency hierarchy.

### Engineering Rationale

Complex pages like the Dashboard read from multiple services (events, jobs, messages, directory). Without composition, either the page imports 6+ services directly (tight coupling) or a single god service duplicates logic (maintenance burden).

### Recommended Option

**Composite services** are the only layer permitted to import multiple feature services:

```
features/dashboard/_services/
├── dashboardService.ts    # Imports eventService, jobService, messageService
├── dashboardService.types.ts
└── index.ts
```

A composite service:
- Calls multiple feature services in parallel where possible
- Aggregates results into a single view model
- Handles partial failure (some services succeed, others fail)
- Does NOT contain new business logic — only orchestration

### Composition Patterns

| Pattern | When to Use | Implementation |
|---------|-------------|---------------|
| **Parallel** | Independent calls | `Promise.allSettled` — aggregate results and partial failures |
| **Sequential** | One call depends on another | `await` each step, passing results forward |
| **First-success** | Multiple sources, pick first | `Promise.any` — try local cache first, then API |
| **Waterfall** | Progressive enhancement | Load critical data first, then secondary |

### Partial Failure Handling

```
type ServiceResult<T> = {
  success: true; data: T;
} | {
  success: false; error: ServiceError;
};

// Composite handles partial failure:
type DashboardData = {
  events: { success: true; data: EventVM[] } | { success: false; error: ServiceError };
  jobs: { success: true; data: JobVM[] } | { success: false; error: ServiceError };
  // ...
};
```

### Trade-offs

Composite services duplicate the "call and aggregate" pattern across pages. The alternative — letting pages import individual services — avoids the composite layer but creates tight page-to-service coupling.

### Industry Best Practice

**Backend-for-Frontend (BFF) pattern** — composite services are the frontend equivalent of a BFF, aggregating downstream service calls into a page-optimized response.

### Recommendation

**Create composite services only when a page needs 3+ independent data sources.** Pages with 1-2 dependencies should import feature services directly.

---

## 22. Shared Service Strategy

### Purpose

Define the pattern for services that are used by multiple features and should not be duplicated.

### Engineering Rationale

Without a shared service category, cross-cutting logic (notifications, file uploads, search) is either duplicated in every feature that needs it or incorrectly placed in a single feature's service directory.

### Recommended Option

**Shared services live in `src/lib/services/` and follow these rules:**

1. They must not import from any feature directory.
2. They may import from infrastructure services, utilities, types, and constants.
3. They may be stateful (using store adapters) or stateless.
4. They are versioned through their function signatures (no semver — breaking changes require updating all consumers).

### Shared Service Catalog

| Service | Responsibility | State Interaction |
|---------|---------------|-------------------|
| `notificationService` | Send toasts, manage notification preferences | Writes to notifications store |
| `fileUploadService` | Handle upload progress, validation, cancellation | Writes to upload progress store |
| `searchService` | Coordinate full-text search across entities | Read-only from search store |
| `paginationService` | Manage page cursors, offsets, and metadata | Stateless |
| `exportService` | Generate CSV/PDF exports | Stateless |
| `shareService` | Generate share links, handle clipboard | Stateless |
| `analyticsService` | Track events, manage analytics queue | Writes to analytics buffer |

### When to Create a Shared Service

| Decision | Action |
|----------|--------|
| Same logic in 2+ feature services | Extract to shared service |
| Logic has no specific feature owner | Place in shared service |
| Logic is used by 1 feature only | Keep in feature service |
| Logic is generic but has 1 consumer today | Keep local; extract when second consumer appears |

### Trade-offs

Premature extraction creates unused shared services. Late extraction creates duplication. The rule "extract at third use" balances these forces.

### Industry Best Practice

**James Shore's "Extract at Third Use"** rule — twice is coincidence, three times is a pattern. This prevents speculative generality while avoiding harmful duplication.

### Recommendation

**Shared services are created only when the same logic is needed in 3+ features.** Until then, keep logic in the feature service and tolerate the duplication.

---

## 23. Feature Service Strategy

### Purpose

Define the standard structure and conventions for services within a single feature.

### Engineering Rationale

Feature services are the majority of the service layer. Without a standard structure, each feature organizes its services differently, making cross-feature navigation unpredictable.

### Recommended Option

**Every feature has a `_services/` directory with a standard structure:**

```
features/events/
├── _services/
│   ├── eventService.ts          # CRUD + core use cases
│   ├── eventService.types.ts    # Input/output types
│   ├── storeAdapter.ts          # Store interaction
│   ├── rsvpService.ts           # RSVP-specific use cases
│   ├── calendarService.ts       # Export/sync use cases
│   └── index.ts                 # Barrel
├── _hooks/
├── _utils/
├── _state/
├── stores/
├── components/
└── index.ts
```

### Feature Service Conventions

1. **One file per domain aggregate.** Services with >250 lines are split.
2. **Service functions return `ServiceResult<T>`** — never raw `Result<T>` from repositories.
3. **Service functions accept a `context` object** as the second parameter, never individual dependencies.
4. **Feature services import shared services** from `@/lib/services` but NEVER from other features.
5. **Feature services may be stateful** (managed by the feature's store adapter).

### Required Functions Per Feature

| Feature | Required Service Functions |
|---------|---------------------------|
| Events | `getEvents`, `getEvent`, `createEvent`, `updateEvent`, `deleteEvent`, `rsvpToEvent`, `cancelRsvp` |
| Jobs | `getJobs`, `getJob`, `createJob`, `updateJob`, `deleteJob`, `applyForJob`, `withdrawApplication` |
| Directory | `searchAlumni`, `getProfile`, `updateProfile` |
| Messages | `getConversations`, `getMessages`, `sendMessage`, `deleteMessage` |
| Auth | `login`, `register`, `logout`, `refreshSession`, `getSession` |
| Admin | `getDashboardSummary`, `getReports`, `getAuditLog`, `manageUsers` |

### Trade-offs

Standardization reduces flexibility. Some features naturally have fewer or more service functions than the standard. The convention is a starting point, not a straitjacket.

### Industry Best Practice

**Feature-Sliced Design (FSD)** — each feature is a self-contained slice with its own services, hooks, stores, and components. This is the frontend equivalent of microservices.

### Recommendation

**Every feature includes a `_services/` directory.** The barrel (`index.ts`) exports only the public service functions — internal helpers are private.

---

## 24. Dependency Injection Strategy

### Purpose

Define how services receive their dependencies without resorting to global singletons, magic imports, or DI containers.

### Engineering Rationale

When services import their dependencies directly (e.g., `import { eventRepo } from "../repositories"`), testing requires mocking modules — a fragile practice. When services receive dependencies through a constructor or function parameter, any mock can be substituted.

### Recommended Option

**Explicit context injection.** Every service function accepts a context object as its last parameter:

```typescript
export async function createEvent(
  input: CreateEventInput,
  context: EventServiceContext,
): Promise<ServiceResult<EventVM>> {
  const { eventRepo, storeAdapter, eventBus, logger } = context;
  // ...
}
```

The context type is defined per service file and includes only the dependencies that service needs.

### Context Types

| Service Level | Context Contains |
|--------------|-----------------|
| Feature | Feature-specific repository, feature store adapter, shared services, event bus, logger |
| Shared | Relevant global stores, infrastructure services, logger |
| Infrastructure | Only logger, config, and other infrastructure services |
| Composite | Multiple feature service contexts, logger |

### No DI Container

The project does NOT use a Dependency Injection container (Inversify, tsyringe, etc.). Explicit context injection is sufficient for this scale and avoids:

- Runtime reflection / decorators
- Container configuration files
- Circular dependency detection overhead
- Framework lock-in

### Factory Pattern for Context Assembly

```
// features/events/_services/createEventService.ts
export function createEventServiceContext(
  eventRepo: Repository,
  rsvpRepo: Repository,
  notificationService: NotificationService,
  eventBus: EventBus,
): EventServiceContext {
  return {
    eventRepo,
    rsvpRepo,
    storeAdapter: createEventStoreAdapter(),
    notificationService,
    eventBus,
    logger: createLogger("EventService"),
  };
}
```

### Trade-offs

Explicit context injection adds a parameter to every service function. The alternative — importing dependencies directly — is less verbose but makes testing impossible without module mocking.

### Industry Best Practice

**Explicit dependency injection (a.k.a. "poor man's DI")** is the standard pattern at Stripe, GitHub, and Basecamp. It provides all the testability benefits of a DI container with zero runtime overhead or framework coupling.

### Recommendation

**All service functions accept a context parameter.** Contexts are assembled in factories at the feature boundary. Hooks and components never construct service contexts — they receive them through the hook layer.

---

## 25. Concurrency Strategy

### Purpose

Define how services handle concurrent operations, race conditions, and duplicate submissions.

### Engineering Rationale

Users can double-click submit buttons, navigate away and back, or open multiple tabs. Without concurrency controls, duplicate event creations, double RSVPs, and inconsistent state are inevitable.

### Recommended Option

**Three concurrency guards:**

| Guard | Scope | Mechanism | Implementation |
|-------|-------|-----------|---------------|
| **Debounce** | Single input | Prevent rapid re-execution | `useService` hook debounces calls; service checks `inProgress` flag |
| **Idempotency** | Single operation | Prevent duplicate processing | Service generates idempotency key; repository sends with request; backend deduplicates |
| **Last-write-wins** | Entity update | Resolve concurrent edits | Service sends full entity state; server accepts latest version |

### Service-Level Concurrency Rules

1. **Mutation service functions must check `context.inProgress`** before executing. If the same service function is already running, return a `CONFLICT` error.
2. **Mutation service functions must use the workflow pipeline's `withIdempotency` step** to prevent duplicate submissions when the user retries.
3. **Read service functions must NOT have concurrency guards** — concurrent reads are always safe.
4. **Service functions must NOT hold locks** — concurrency control is stateless.

### Progress Tracking

```
type ServiceContext = {
  // ...
  inProgress: boolean;  // Set by the hook, read by the service
};
```

### Trade-offs

Concurrency controls add complexity to simple operations. The debounce guard alone handles 90% of accidental double-submissions. Idempotency keys add the remaining 10% for critical operations.

### Industry Best Practice

**Stripe's idempotency keys** (`Idempotency-Key` header) are the standard for preventing duplicate charges. The same pattern applies to any mutation: generate a UUID key, send it with the request, reject duplicates at the server.

### Recommendation

**Use debounce for all mutations, idempotency keys for critical mutations (payments, registrations, event creations).** The workflow pipeline's `persist` step supports both.

---

## 26. Async Workflow Management

### Purpose

Define how services handle asynchronous operations where the result is not immediately available (file processing, batch operations, webhook-dependent flows).

### Engineering Rationale

Some business operations complete asynchronously: exporting a report, processing an uploaded CSV, generating a certificate. The service cannot return the result synchronously — it must initiate the operation and provide a way to check progress and retrieve results later.

### Recommended Option

**Polling pattern for async workflows:**

```
1. Service calls repository → backend accepts operation → returns operationId
2. Service returns ServiceResult with { operationId, status: "accepted" }
3. Hook starts polling: service.getOperationStatus(operationId) every N seconds
4. On completion: service.getOperationResult(operationId) → returns final data
```

### Async Workflow States

```
type AsyncWorkflowStatus =
  | "accepted"    // Backend received the request
  | "processing"  // Backend is working on it
  | "completed"   // Result is available
  | "failed"      // Operation failed
  | "cancelled";  // User cancelled the operation
```

### Async Service Pattern

```
async function initiateExport(
  input: ExportInput,
  context: ServiceContext,
): Promise<ServiceResult<{ operationId: string; status: "accepted" }>>;

async function getExportStatus(
  operationId: string,
  context: ServiceContext,
): Promise<ServiceResult<{ status: AsyncWorkflowStatus; progress?: number }>>;

async function getExportResult(
  operationId: string,
  context: ServiceContext,
): Promise<ServiceResult<Blob>>;
```

### Trade-offs

Polling is simple but wasteful for long-running operations. WebSocket-based status updates are more efficient but add infrastructure complexity. For frontend async workflows where operations complete within 30 seconds, polling is adequate.

### Industry Best Practice

**AWS S3 presigned URLs** — the frontend initiates an operation, receives a token, and polls or receives a callback when the result is ready. This pattern works for file processing, batch operations, and report generation.

### Recommendation

**Use polling for async workflows with expected completion under 30 seconds.** For longer operations, provide a "Notify me when done" option that triggers a push notification.

---

## 27. Event Coordination

### Purpose

Define how services publish and subscribe to application events (Stage 15 event bus) to coordinate cross-feature side effects.

### Engineering Rationale

After a service completes a mutation, other parts of the application need to react: invalidating caches, updating badge counts, sending notifications. Directly calling those side effects from the service creates coupling. Events decouple the publisher from the subscribers.

### Recommended Option

**Services publish events at the end of the workflow pipeline, after the mutation is confirmed:** 

```
pipeline: validate → authorize → optimistic → persist → invalidate → emit
                                                                       ↑
                                                            Events are emitted here
```

### Event Naming Convention

```
<domain>:<action>  (lowercase, kebab-case)
```

| Event | Publisher | Example Subscribers |
|-------|-----------|-------------------|
| `events:created` | Event Service | Calendar service (sync), Notification service (alert attendees) |
| `events:rsvp-changed` | RSVP Service | Event cache (update count), Dashboard (refresh widget) |
| `profile:updated` | Profile Service | Directory cache (invalidate), Header (update avatar) |
| `jobs:applied` | Application Service | Job cache (update count), Notification service |
| `messages:sent` | Message Service | Conversation list (update preview), Notification service |

### Event Payload Rules

1. Events carry the **minimum data** needed for subscribers to act — typically just an entity ID.
2. Events must NOT carry sensitive data (tokens, passwords, PII).
3. Events must be **serializable** (no functions, no class instances).
4. Events include a **`timestamp`** and **`correlationId`** for tracing.

### Subscriber Rules

1. Subscribers must be **idempotent** — processing the same event twice must be safe.
2. Subscribers must **never fail the publisher** — exceptions in subscribers are caught and logged.
3. Subscribers are registered at **app bootstrap** or **feature mount**, not in service functions.
4. Subscribers must not import the publishing service (would create a circular dependency).

### Trade-offs

Event-driven coordination makes the execution path harder to trace (no explicit caller). However, this is the only way to avoid circular service dependencies.

### Industry Best Practice

**Event-driven architecture** at Amazon, Netflix, and Uber. Even at the frontend layer, the event bus (Stage 15) provides the same decoupling benefits as a message queue at the backend layer.

### Recommendation

**All cross-feature side effects go through the event bus.** Intra-feature side effects may use direct service calls or internal events.

---

## 28. Notification Coordination

### Purpose

Define how services trigger user-facing notifications (toasts, badges, in-app alerts) without coupling to the notification UI.

### Engineering Rationale

Services need to notify users of results: "Event created successfully," "RSVP confirmed," "Upload failed." If services directly call `toast.success()`, testing requires mocking the toast library, and the notification channel is hardcoded.

### Recommended Option

**Services write notifications to the Notifications Store (Stage 15). The UI layer reads from the store and renders toasts, badges, or banners.** The service never imports a toast library.

```
Service → notificationsStore.addNotification({ type, title, message })
                                             ↓
NotificationsStore → UI component → renders toast/badge/banner
```

### Notification Levels

| Level | Store Method | UI Rendering |
|-------|-------------|-------------|
| Success | `addNotification({ type: "success", title, message })` | Toast with checkmark |
| Warning | `addNotification({ type: "warning", title, message })` | Toast with warning icon |
| Error | `addNotification({ type: "error", title, message })` | Toast with error icon (persistent) |
| Info | `addNotification({ type: "info", title, message })` | Toast or in-app banner |
| Badge | `notificationsStore.incrementBadge()` | Badge count on nav icon |

### Notification Timing

| Phase | Notification | Timing |
|-------|-------------|--------|
| Optimistic | None (user sees immediate UI change) | — |
| Persist success | Success notification | After API confirms |
| Persist failure | Error notification with rollback details | After API rejects + rollback complete |
| Rollback | Notification explaining the reversion | After rollback |

### Trade-offs

The store indirection means the notification appears when the store updates, which may lag behind the API response by a few milliseconds. This delay is imperceptible to users.

### Industry Best Practice

**Sonner's toast API** (already in the project) — the toaster component subscribes to a store-like state. Writing to the store is equivalent to showing a toast. The service layer writes to the store.

### Recommendation

**Services use the notifications store adapter to enqueue notifications.** The hook layer never creates success/error toasts — it reads from the store. This ensures consistent notification behavior regardless of which code path triggered the mutation.

---

## 29. Logging Strategy

### Purpose

Define how services log their operations without coupling to a specific logging library or implementation.

### Engineering Rationale

Without explicit logging, debugging production issues requires attaching a debugger or adding temporary `console.log` statements. Services should log their key operations with structured data that can be correlated across layers.

### Recommended Option

**Services receive a `logger` in their context and use structured logging:**

```
logger.info("Event created", {
  correlationId,
  eventId,
  duration,
  userId,
});
```

### Log Levels per Service Operation

| Operation Type | Log Level | Examples |
|---------------|-----------|----------|
| Business operation start | `info` | "Creating event...", "Processing RSVP..." |
| Business operation success | `info` | "Event created successfully", "RSVP confirmed" |
| Business operation failure | `warn` / `error` | "Failed to create event: validation failed" |
| Authorization check | `debug` | "User 123 authorized to create event: true" |
| Cache invalidation | `debug` | "Invalidating cache for tags: [events:list]" |
| Retry attempt | `warn` | "Retry 2/3 for createEvent after timeout" |
| Rollback | `error` | "Rolling back optimistic update for event 456" |
| Unexpected error | `error` | "Unexpected error in createEvent: TypeError..." |

### Structured Data Requirements

Every log entry should include:

```
{
  correlationId: string;     // Tied to the request flow
  service: string;           // Service name
  operation: string;         // Function name
  duration?: number;         // Operation duration in ms
  userId?: string;           // Authenticated user
  metadata?: Record<string, unknown>; // Operation-specific data
  error?: {                  // Present on error entries
    code: string;
    message: string;
    stack?: string;          // Development builds only
  };
}
```

### Trade-offs

Structured logging adds a dependency on a logger utility. The `logger.ts` utility in Stage 12 already provides structured logging with configurable levels.

### Industry Best Practice

**Structured logging** (JSON-formatted log entries with consistent schemas) is standard at Google, Stripe, and Shopify. It enables log aggregation tools (Datadog, Splunk, Grafana Loki) to parse and query logs without regex parsing.

### Recommendation

**All service functions log start, success, and failure using the structured logger from their context.** Sensitive data (passwords, tokens, PII) is never logged — the logger's `sanitize` helper redacts known sensitive fields.

---

## 30. Monitoring Integration

### Purpose

Define how services expose metrics and traces for observability without coupling to a specific monitoring vendor.

### Engineering Rationale

Without monitoring integration, performance regressions and error spikes go unnoticed until users report them. Services should emit metrics that can be consumed by any monitoring tool (Datadog, Sentry, Grafana).

### Recommended Option

**Services emit performance markers through the context's `tracer`:**

```
const tracer = context.tracer.startSpan("createEvent");
// ... business logic ...
tracer.end({ success: true, duration: 120 });
```

### Metrics to Track

| Metric | Type | Example Value |
|--------|------|-------------|
| Service call count | Counter | `eventService.createEvent.count` |
| Service call duration | Histogram | `eventService.createEvent.duration.p50: 45ms, p95: 200ms` |
| Service error rate | Counter | `eventService.createEvent.errors` |
| Service retry count | Counter | `eventService.createEvent.retries` |
| Cache hit ratio | Histogram | `eventService.getEvent.cacheHit: 0.85` |

### Integration Points

| Monitoring Concern | Service Action | Tool |
|--------------------|---------------|------|
| Performance | Start/end trace spans | OpenTelemetry compatible |
| Errors | Report error with context | Sentry-compatible (`Sentry.captureException`) |
| Business metrics | Increment counters | Analytics / Datadog |
| Dead letter | Log unrecoverable errors | Logger.error + Sentry |

### Trade-offs

Monitoring instrumentation adds ~3 lines per service function. The tracer wrapper handles this automatically — service authors don't write instrumentation code manually.

### Industry Best Practice

**OpenTelemetry** is the industry standard for observability. The service tracer should use the OpenTelemetry API so that any backend (Jaeger, Zipkin, Datadog) can consume traces.

### Recommendation

**The workflow pipeline automatically wraps every service call in a trace span.** Individual service functions do not need to manage spans manually. Error reporting is automatic through the pipeline's error handler.

---

## 31. Performance Considerations

### Purpose

Define the performance characteristics that service implementations must respect to maintain a responsive UI.

### Engineering Rationale

Services are called on the main thread in response to user actions. A slow service blocks the UI. Unlike backend services, frontend services must complete within user-perception thresholds.

### Performance Budgets

| Operation Type | Target Latency | Maximum |
|---------------|---------------|---------|
| Read (cache hit) | < 5ms | < 15ms |
| Read (cache miss) | < 200ms | < 500ms |
| Mutation (optimistic) | < 10ms | < 50ms |
| Mutation (pessimistic) | < 500ms | < 2000ms |
| Search | < 300ms | < 1000ms |
| File upload | < 5000ms | < 30000ms |

### Performance Rules

1. **Service functions must batch repository calls.** If a page needs events and their attendee counts, the service should make one `getEventsWithDetails` call, not N+1 calls.
2. **Service functions must parallelize independent repository calls.** Use `Promise.allSettled` for concurrent reads.
3. **Service functions must not block on non-critical operations.** Notifications, analytics, and cache invalidation are fire-and-forget.
4. **Service functions must yield to the main thread periodically.** Use `setTimeout` / `scheduler.yield` for operations that iterate over large arrays.
5. **Service functions must prefer cache over network.** The store adapter reads from the cache store first; the repository call is the fallback.

### Avoiding Expensive Operations in Services

| Operation | Move To |
|-----------|---------|
| Large data transformation | Selector/memoization in component |
| Expensive computation | Web Worker |
| Image processing | Service Worker or backend |
| Sorting/filtering large lists | Repository (server-side) |

### Trade-offs

Performance optimization adds complexity. Premature optimization is wasteful — measure first, optimize second. The workflow pipeline adds negligible overhead (< 0.1ms per call).

### Industry Best Practice

**RAIL model (Response, Animation, Idle, Load)** — Google's performance model for frontend applications. Service calls should complete within 100ms (Response target) to avoid perceptible delay.

### Recommendation

**Every service function includes a `// Performance note:` JSDoc comment** documenting expected latency and optimization decisions. The pipeline's tracer automatically captures latency for monitoring.

---

## 32. Caching Coordination

### Purpose

Define how services interact with the client-side cache (Stage 13) without creating stale data or memory leaks.

### Engineering Rationale

The repository layer (Stage 13) has a built-in cache with TTLs and tag-based invalidation. Services must coordinate with this cache to ensure users see fresh data without unnecessary network requests.

### Recommended Option

**Services manage cache invalidation; repositories manage cache reads.** The service tells the repository which cache tags to invalidate after mutations; the repository handles the invalidation.

### Cache Invalidation Rules

| Mutation Type | Tags to Invalidate | Strategy |
|---------------|-------------------|----------|
| Create entity | `[feature:list]` | Invalidate list caches |
| Update entity | `[feature:list, feature:detail:{id}]` | Invalidate list + specific detail |
| Delete entity | `[feature:list, feature:detail:{id}]` | Invalidate list + specific detail |
| RSVP | `[events:detail:{eventId}, dashboard:summary]` | Invalidate event + dependents |

### Stale-While-Revalidate

For read operations, the service uses the repository's `staleWhileRevalidate` mode:
- Return cached data immediately
- Fetch fresh data in the background
- Update the cache with fresh data
- The UI re-renders when fresh data arrives (via the store subscription)

### Cache vs. Store Boundaries

| Concern | Cache (Repository) | Store (Stage 15) |
|---------|-------------------|------------------|
| Role | Server data cache | Client UI state |
| Data | Raw DTOs | View models |
| Lifetime | TTL-based eviction | Feature lifecycle |
| Invocation | Automatic on read | Explicit on mutation |
| Source | API responses | Service output |

### Trade-offs

Dual cache (repository cache + state store) requires coordination. The rule "cache invalidates, stores update" prevents them from diverging: after a mutation, the cache is invalidated (forcing a fresh read), and the store is optimistically updated (providing instant UI feedback).

### Industry Best Practice

**SWR (stale-while-revalidate)** — the HTTP cache strategy adopted by Vercel's Next.js and SWR library. The repository's cache implements this at the frontend level, providing fast subsequent renders while keeping data reasonably fresh.

### Recommendation

**Services never write to the repository cache directly.** They call `invalidateTags()` after mutations. The cache refreshes on the next read. This keeps the cache ownership in one layer (repositories).

---

## 33. Offline Workflow Strategy

### Purpose

Define how services behave when the network is unavailable, and how they recover when connectivity returns.

### Engineering Rationale

Users may browse the application on unstable networks, in transit, or with intermittent connectivity. Services should degrade gracefully: show cached data, queue mutations, and synchronize when online.

### Recommended Option

**Offline-first read, online-required write:**

| Operation | Offline Behavior |
|-----------|-----------------|
| Read | Serve from cache if available; show stale indicator |
| Read (no cache) | Return `OFFLINE_ERROR` with "Connect to the internet to load this data" |
| Mutation | Queue in `localStorage` with timestamp; attempt replay on reconnect |
| Mutation (queue full) | Reject with "Too many pending changes. Please wait for sync." |

### Offline Mutation Queue

```
interface QueuedMutation {
  id: string;
  operation: string;    // e.g., "createEvent"
  params: unknown;      // Serialized input
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

// Service checks online status before mutation:
if (!context.isOnline) {
  return queueMutation(operation, params);
}
```

### Recovery Strategy

| Event | Action |
|-------|--------|
| App comes online | Dequeue mutations in FIFO order |
| Mutation replay succeeds | Remove from queue, refresh affected stores |
| Mutation replay fails (permanent) | Remove from queue, notify user, keep cache unchanged |
| Mutation replay fails (transient) | Keep in queue, retry with backoff |

### Conflict Resolution

When a queued mutation conflicts with server state:
- Prefer server state for system-managed fields (audit timestamps, counters).
- Prefer client state for user-managed fields (profile description, event title).
- Surface conflicts that affect business rules (e.g., "event is now full") as notifications.

### Trade-offs

Offline support significantly increases service complexity. The offline mutation queue, conflict resolution, and sync logic are the hardest parts of the service layer to implement correctly. Only critical features should support offline mutations initially.

### Industry Best Practice

**CouchDB's replication protocol** and **Firebase's offline persistence** both use a mutation log replayed in order. The frontend equivalent is a simpler version: `localStorage` queue + ordered replay.

### Recommendation

**Read operations support offline by default (cache fallback). Offline mutations are opt-in per feature.** Start with events RSVP and profile updates as the first offline-enabled mutations.

---

## 34. Security Considerations

### Purpose

Define the security boundaries that services must enforce to prevent data access violations and injection attacks.

### Engineering Rationale

Security cannot rely solely on the backend. A compromised backend connection or a malicious intermediary could expose data that the frontend failed to filter. Services must apply defense-in-depth: validate, authorize, sanitize.

### Security Rules for Services

1. **Services must not log or send sensitive data** (passwords, tokens, PII, financial data). The context's logger automatically redacts known sensitive fields.
2. **Services must validate all input** even if the UI already validated it. A compromised UI or a script-injected call bypasses client-side validation.
3. **Services must enforce authorization** even if the UI hides unauthorized actions. The service is the last line of defense before the repository.
4. **Services must sanitize output** — strip HTML from user-generated content, truncate oversized fields, prevent data leakage through error messages.
5. **Services must not expose internal IDs** in URLs or error messages if they reveal business information (sequential IDs, internal naming).

### Data Minimization

| Operation | Service Responsibility |
|-----------|----------------------|
| Fetch user profile | Return only fields the current user is authorized to see |
| Fetch event list | Filter out unpublished events for non-admin users |
| Search results | Strip internal notes, moderation flags, and admin-only metadata |
| Error responses | Return user-safe messages, never stack traces or DB error details |

### XSS Prevention

- Service output to stores is sanitized before display.
- User-generated content passes through the utility layer's `sanitizeHtml` function.
- URLs in user content are validated against the utility layer's `sanitizeUrl` function.

### Trade-offs

Defense-in-depth adds processing overhead (validation, sanitization, authorization checks at every layer). The overhead is negligible for the data volumes this application handles (< 100ms per operation).

### Industry Best Practice

**OWASP Top 10** — the service layer addresses A1 (Injection) through input validation, A2 (Broken Authentication) through authorization delegation, and A3 (Sensitive Data Exposure) through sanitization and redaction.

### Recommendation

**Security is not optional at any layer.** The workflow pipeline automatically validates input, checks authorization, and sanitizes output. Service authors add business-specific security rules (e.g., "only the event owner can edit") as authorization middleware steps.

---

## 35. Testing Strategy

### Purpose

Define how every service function is tested in isolation, including what to test, what to mock, and how to structure test files.

### Engineering Rationale

Services contain business logic that cannot be tested through UI integration tests alone. Unit-testing services requires mocking their dependencies (repositories, stores, event bus) and verifying their orchestration.

### Recommended Option

**Every service file has a co-located test file:**

```
features/events/_services/
├── eventService.ts
├── eventService.test.ts     # Unit tests
├── eventService.types.ts
├── eventService.integration.test.ts  # Integration tests (optional)
```

### Test Structure (AAA Pattern)

```
describe("eventService", () => {
  describe("createEvent", () => {
    // Arrange
    const context = createMockContext();
    const input = createMockInput();

    it("creates event successfully", async () => {
      // Act
      const result = await createEvent(input, context);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({ title: input.title });
      expect(context.eventRepo.create).toHaveBeenCalledWith(input);
      expect(context.storeAdapter.updateCache).toHaveBeenCalled();
      expect(context.eventBus.emit).toHaveBeenCalledWith("events:created");
    });

    it("returns validation error for invalid input", async () => {
      const result = await createEvent(invalidInput, context);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(context.eventRepo.create).not.toHaveBeenCalled();
    });

    it("rolls back on repository failure", async () => {
      context.eventRepo.create.mockRejectedValue(networkError);
      const result = await createEvent(input, context);
      expect(result.success).toBe(false);
      expect(result.error.retryable).toBe(true);
    });
  });
});
```

### What to Mock

| Dependency | Mock Strategy |
|-----------|--------------|
| Repository (Stage 13) | Jest mock function returning `Result<T>` |
| Store adapter (Stage 15) | Jest spy on adapter methods |
| Event bus (Stage 15) | Jest mock with `emit`, `on` spies |
| Logger | Jest mock (verify fatal errors are logged) |
| Validator | Use real schema (Zod) — no mock needed |

### What Not to Mock

| Concern | Reason |
|---------|--------|
| Validation (Zod) | Use real schemas — testing the service should validate real rules |
| Business logic | This is what we're testing! |
| Error normalization | Errors should be real to verify correct error codes |

### Coverage Targets

| Metric | Target |
|--------|--------|
| Statement coverage | ≥ 90% |
| Branch coverage | ≥ 85% |
| Error path coverage | 100% (every `ServiceError` code must be tested) |
| Authorization path coverage | 100% (every permission check must be tested) |

### Trade-offs

Co-located test files increase file count but make it immediately clear whether a service is tested. The alternative (centralized `__tests__` directory) hides the testing status.

### Industry Best Practice

**Co-located tests** are the standard at Google, Spotify, and GitHub. A developer looking at `eventService.ts` sees `eventService.test.ts` right next to it — no searching for the test file.

### Recommendation

**Tests are mandatory for all service functions. A pull request adding a service function without tests must be rejected.** The testing utility layer (Stage 12) provides mock factories (`createMockUser`, `createMockEvent`, etc.) to reduce test setup boilerplate.

---

## 36. Mocking Strategy

### Purpose

Define how service dependencies are mocked in tests, including which tools to use and how mock factories are structured.

### Engineering Rationale

Without a standard mocking approach, each test file creates mocks differently: some use `jest.fn()`, some use manual objects, some use `sinon`. This inconsistency makes tests harder to read and maintain.

### Recommended Option

**Context factory per service.** Each service file exports a `createMockContext` function that returns a fully mocked context with sensible defaults:

```
// eventService.test.ts
import { createMockContext, createMockEventInput } from "./eventService.test-utils";

// The mock context factory:
export function createMockContext(overrides?: Partial<EventServiceContext>): EventServiceContext {
  return {
    eventRepo: createMockRepository(),
    rsvpRepo: createMockRepository(),
    storeAdapter: {
      updateCache: jest.fn(),
      invalidateCache: jest.fn(),
      readEvent: jest.fn().mockReturnValue(mockEvent),
    },
    notificationService: {
      notify: jest.fn(),
      schedule: jest.fn(),
    },
    eventBus: { on: jest.fn(), emit: jest.fn(), off: jest.fn(), clear: jest.fn() },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
    ...overrides,
  };
}
```

### Mock Repository Factory

```
// src/lib/services/infra/__mocks__/repository.ts
export function createMockRepository(): jest.Mocked<Repository> {
  return {
    getById: jest.fn(),
    list: jest.fn(),
    listPaginated: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    patch: jest.fn(),
    remove: jest.fn(),
  };
}
```

### Mock Hierarchy

| Level | Mock | Location |
|-------|------|----------|
| 1 | Repository mock factory | `src/lib/services/infra/__mocks__/` |
| 2 | Store adapter mock factory | Per service's test-utils |
| 3 | Context factory | Per service's test-utils |
| 4 | Input factory | Per service's test-utils |

### Trade-offs

Mock factories add ~30 lines of test infrastructure per service file. They eliminate ~10 lines of mock setup per test case — the investment pays off at 3+ test cases per service.

### Industry Best Practice

**Default mocks with override support** — Stripe's test SDK, Prisma's mock pattern, and MSW (Mock Service Worker) all follow this pattern: provide sensible defaults, let tests override specific behaviors.

### Recommendation

**Every service file > 50 lines must provide a `service.test-utils.ts` file** with `createMockContext()` and relevant input factories.

---

## 37. Documentation Strategy

### Purpose

Define how services are documented for other developers, including JSDoc conventions, use case documentation, and generated API references.

### Engineering Rationale

Without documentation, developers must read the full implementation to understand what a service does, what it returns, and what errors it can produce. This slows onboarding and increases bug rates from misunderstood contracts.

### Recommended Option

**JSDoc for every exported service function:**

```typescript
/**
 * Creates a new event and triggers associated workflows.
 *
 * @category EventService
 * @useCase "As an admin, I want to create a new event so alumni can RSVP"
 *
 * @param input - Event creation data (validated against CreateEventSchema)
 * @param context - Service dependencies
 *
 * @returns ServiceResult<EventVM> — the created event with computed fields
 *
 * @throws Never (returns ServiceResult with error code)
 *
 * @errors
 * - VALIDATION_ERROR: input fails schema validation
 * - AUTHORIZATION_ERROR: user lacks permission
 * - CONFLICT: event with same slug already exists
 *
 * @workflow
 * 1. Validate input
 * 2. Authorize user (admin role required)
 * 3. Create event via repository
 * 4. Invalidate events list cache
 * 5. Emit `events:created` event
 * 6. Return created event
 *
 * @example
 * const result = await createEvent(input, context);
 * if (result.success) { showSuccess(result.data); }
 */
```

### Documentation Requirements

| Element | Required For | Format |
|---------|-------------|--------|
| Description | All exported functions | Plain English, 1-3 sentences |
| `@category` | All services | Matches service classification |
| `@useCase` | Mutations + composite workflows | Use case template reference |
| `@param` | All parameters | Type + brief description |
| `@returns` | All functions | Type + user-facing description |
| `@throws` | All functions | "Never" or list of error codes |
| `@errors` | All functions | Every possible `ServiceError.code` |
| `@workflow` | Mutations + composite workflows | Numbered step list |
| `@example` | Complex or non-obvious functions | TypeScript code block |

### Trade-offs

JSDoc adds ~15-25 lines per function. For simple CRUD services (getById, list), the documentation can feel redundant. However, consistent documentation catches contract misunderstandings before they reach production.

### Industry Best Practice

**TSDoc standard** — the TypeScript documentation standard used by Microsoft, Vercel, and the TypeScript team. JSDoc with TSDoc-compatible tags ensures compatibility with documentation generators (TypeDoc, api-extractor).

### Recommendation

**All exported service functions have JSDoc.** Simple getters may omit `@workflow` and `@example`. Mutations and composites must include all sections. Enforce via ESLint `require-jsdoc` rule for service files.

---

## 38. Governance Strategy

### Purpose

Define the review, quality, and enforcement mechanisms that keep the service layer healthy over time.

### Engineering Rationale

Without governance, the service layer accumulates violations: feature services importing other features, services growing past 250 lines, missing error handling, missing tests. Governance is the immune system that prevents architectural decay.

### Recommended Option

**Four layers of governance:**

| Layer | Mechanism | Enforced By |
|-------|-----------|-------------|
| 1 — Lint | ESLint rules | Pre-commit hook |
| 2 — Review | Code review checklist | Pull request |
| 3 — Metrics | Service health dashboard | CI pipeline |
| 4 — Audit | Quarterly architecture review | Team lead |

### ESLint Rules for Services

| Rule | Purpose |
|------|---------|
| `no-feature-to-feature-service-import` | Prevents direct feature service coupling |
| `no-service-import-from-hook` | Prevents hooks from bypassing services |
| `no-repository-import-from-component` | Prevents UI from using repositories directly |
| `service-function-must-return-service-result` | Ensures consistent return types |
| `service-file-max-lines` (250) | Prevents god services |
| `service-must-have-test-file` | Ensures test coverage |
| `service-function-must-have-jsdoc` | Ensures documentation |
| `no-service-mutable-state` | Prevents module-level state |

### Code Review Checklist

Every service PR is reviewed against:

- [ ] Does every function return `ServiceResult<T>`?
- [ ] Are all error codes documented and tested?
- [ ] Is authorization checked before mutations?
- [ ] Are cache tags invalidated after mutations?
- [ ] Are events emitted for cross-feature notifications?
- [ ] Are there unit tests for success and all error paths?
- [ ] Is the function under 250 lines?
- [ ] Does the function avoid importing from other features?

### Trade-offs

Governance adds friction to development. Too little governance causes architecture decay. Too much causes developer frustration. The four layers above balance enforcement with speed: lint is automatic, review is human-only for complex decisions.

### Industry Best Practice

**Google's Code Health** model — automated checks catch 90% of issues, code review catches the remaining 10%. The automated checks run in CI and block merging. The review checklist is in the PR template.

### Recommendation

**Start with lint rules and code review checklist. Add metrics and audit when the team grows beyond 3 developers.** The lint rules are the most impactful governance mechanism with the lowest friction.

---

## 39. Versioning Strategy

### Purpose

Define how service contracts evolve without breaking existing consumers.

### Engineering Rationale

Service functions are consumed by hooks, composite services, and occasionally pages. Changing a service's input type, return type, or error codes breaks all consumers. A versioning strategy prevents unexpected breakage.

### Recommended Option

**Semantic versioning at the service function level, communicated through TypeScript types:**

| Change Type | Example | Version Impact | Consumer Action |
|-------------|---------|---------------|----------------|
| **Patch** | New optional parameter, new optional field in return type | Minor version bump | None (backward-compatible) |
| **Minor** | New required parameter (with default), new error code | Minor version bump | Update call sites if using new feature |
| **Major** | Removed parameter, changed return type shape | Major version bump | Update all call sites |

### Deprecation Policy

```
// Old function — marked as deprecated
/** @deprecated Use `createEventV2` instead. Will be removed in v2. */
export async function createEvent(input, context): ServiceResult<EventVM>;

// New function
export async function createEventV2(input, context): ServiceResult<EventDetailVM>;
```

| Phase | Action |
|-------|--------|
| 1 — Deprecate | Add `@deprecated` JSDoc tag. Old function continues to work. |
| 2 — Warn | Add runtime warning (console.warn) for all old function calls. |
| 3 — Remove | Delete old function. Break build for remaining consumers. |

### Versioning Rules

1. **Never remove or rename an exported service function** without a deprecation period of at least one sprint.
2. **Never change the type of an existing parameter** — add a new optional parameter instead.
3. **Never remove an error code** that consumers may be checking — add a new error code and keep the old one.
4. **Never mutate the context object** — always create a new context with additional fields.

### Trade-offs

Versioning adds process overhead. For a small team (< 5 developers), "just update all call sites" is faster. For larger teams or when services are consumed by external feature teams, versioning is essential.

### Industry Best Practice

**Stripe's API versioning** — every API change is backward-compatible within the same version. Breaking changes trigger a new API version with a migration window. The same principle applies at the service function level.

### Recommendation

**Feature services used by multiple features MUST follow the deprecation policy.** Feature services used by only their parent feature may skip versioning (update call sites directly).

---

## 40. Scalability Strategy

### Purpose

Define how the service architecture scales as the application grows in features, developers, and data volume.

### Engineering Rationale

A service architecture that works for 5 features with 2 developers will break at 15 features with 8 developers. Scalability in the service layer means: clear ownership, parallel development, independent deployability, and predictable performance under load.

### Recommended Option

**Horizontal scaling of the service layer through feature isolation:**

| Dimension | How the Architecture Scales |
|-----------|---------------------------|
| **Features** | Each feature is a self-contained service directory. Adding a feature does not touch existing services. |
| **Developers** | Feature teams own their services. No merge conflicts on service files. |
| **Data volume** | The service layer is agnostic to data volume — pagination, filtering, and sorting are delegated to repositories. |
| **API changes** | Service-to-repository abstraction isolates business logic from API contract changes. |
| **Backend migration** | Services depend on repository interfaces, not concrete API implementations. Swapping backends requires repository changes only. |

### Preventing Bloat

| Anti-pattern | Prevention |
|-------------|-----------|
| God services (500+ lines) | 250-line limit; extract or split |
| Service importing everything | Max 3 repository dependencies; max 5 dependencies total |
| Cross-feature coupling | Event bus for communication; lint rules for prevention |
| Logic leaking into hooks | Service-first rule: any logic beyond basic formatting goes in a service |

### Performance Under Load

| Scenario | Service Behavior |
|----------|-----------------|
| Rapid user actions | Debounce in hook layer; idempotency in service layer |
| Large result sets | Pagination handled by repository; service never loads all data |
| Many concurrent users | Stateless services scale horizontally; stateful services are per-user |
| Slow API responses | Stale cache serves reads; optimistic updates mask mutation latency |

### Trade-offs

Scalable architectures trade simplicity for structure. The 250-line limit, the 3-repository limit, and the event bus all add indirection. The indirection is invisible to users and pays off as the team grows.

### Industry Best Practice

**Amazon's "Two-Pizza Team" rule** — teams of 6-8 people own a set of services. No team needs to coordinate with another team to deploy. This is enabled by strict service boundaries and event-driven communication.

### Recommendation

**The architecture is designed for 15 features and 10 developers without structural changes.** Beyond that, consider: splitting into micro-frontends, introducing a BFF layer, or moving to a monorepo with independent build pipelines.

---

## 41. Maintainability

### Purpose

Define the practices that keep service code readable, predictable, and easy to modify over years of development.

### Engineering Rationale

Code is read 10x more than it is written. Service functions that are hard to understand are hard to modify safely. Maintainability practices ensure that a service file written today is still understandable a year from now.

### Recommended Option

**Ten maintainability practices for service functions:**

| # | Practice | Rule |
|---|----------|------|
| 1 | **One level of abstraction** | A function should not mix high-level orchestration with low-level data transformation. Extract helpers. |
| 2 | **Flat over nested** | Avoid nested conditionals. Use early returns guard clauses. Max 2 levels of nesting. |
| 3 | **Small functions** | No function exceeds 50 lines. Extract named helpers for each workflow step. |
| 4 | **Descriptive names** | `validateEventDates` not `checkDates`. `authorizeEventCreation` not `checkAuth`. |
| 5 | **No magic values** | Business rules as named constants, not inline strings/numbers. |
| 6 | **Explicit over clever** | Avoid ternary chains, double-negatives, and `!!` coercion. Readability first. |
| 7 | **Deterministic** | Same input + same context = same result. No dependency on module state, time, or random values. |
| 8 | **Structured over sequential** | Extract named steps in the workflow pipeline. Don't write line-by-line within a function. |
| 9 | **Tests as documentation** | Test names describe behavior: `"returns VALIDATION_ERROR when event date is in the past"`. |
| 10 | **Co-located** | Service, types, tests, and test-utils in the same directory. No hunting for dependencies. |

### Complexity Budget

| Metric | Threshold | Action |
|--------|-----------|--------|
| Cyclomatic complexity | > 10 per function | Extract helper functions |
| Lines per function | > 50 | Refactor into multiple functions |
| Parameters per function | > 4 | Use input type instead |
| Dependencies per service | > 7 | Split service |
| Nested callbacks | > 2 levels | Extract to named functions |

### Trade-offs

The complexity budget adds refactoring overhead. A function with 55 lines and 12 complexity may still be "simple enough." The budget provides guidance, not hard enforcement. Use discretion.

### Industry Best Practice

**NASA's power of ten rules** — the strictest code quality standard in production use. The ten rules above are an adapted subset appropriate for frontend applications.

### Recommendation

**Code review enforces the maintainability practices. The complexity budget is reviewed monthly** to identify services that need refactoring before they become problematic.

---

## 42. Enterprise Best Practices

### Purpose

Consolidate the enterprise-grade practices that distinguish this service layer from ad hoc business logic.

### Engineering Rationale

Enterprise applications have requirements that smaller applications do not: audit trails, compliance, team scalability, vendor independence, and long-term maintainability. The practices below ensure the service layer meets enterprise standards.

### Consolidated Best Practices

| # | Practice | Section | Enterprise Value |
|---|----------|---------|-----------------|
| 1 | **Explicit context injection** | §24 | Testable without DI framework |
| 2 | **ServiceResult discriminated union** | §16 | Every call site must handle success and failure |
| 3 | **Workflow pipeline** | §7 | Consistent error handling, authorization, and side effects |
| 4 | **Store adapter pattern** | §11 | State library independence |
| 5 | **Event-driven cross-feature communication** | §27 | No circular dependencies |
| 6 | **Optimistic with rollback** | §20 | Perceived performance without data loss |
| 7 | **Three-tier service topology** | §2 | Clear dependency hierarchy |
| 8 | **250-line service limit** | §9 | Prevents god objects |
| 9 | **100% error path test coverage** | §35 | Reliable error handling |
| 10 | **Structured logging with correlation ID** | §29 | Debuggable production issues |
| 11 | **API-agnostic repository dependency** | §12 | Backend migration possible |
| 12 | **Authorization at service layer** | §15 | Security defense-in-depth |

### Architecture Decision Records

All deviations from this specification must be documented in a new ADR. Common ADRs that may supplement this specification:

- "Adding a new service class for [specific domain]"
- "Waiving the 250-line limit for [specific service]"
- "Temporarily allowing feature-to-feature service import for [specific migration]"

### Enterprise Readiness Checklist

Before marking a feature's service layer as complete:

- [ ] Every service function returns `ServiceResult<T>`
- [ ] Every mutation has a workflow pipeline with validate → authorize → persist → invalidate → emit
- [ ] Every error code has a corresponding test case
- [ ] Every cross-feature side effect goes through the event bus
- [ ] Every service function has JSDoc
- [ ] Service file is under 250 lines
- [ ] No direct imports from other feature directories
- [ ] Optimistic updates have rollback logic
- [ ] Offline reads fall back to cache
- [ ] Sensitive data is not logged

### Future Expansion Recommendations

| Timeline | Recommended Action | Rationale |
|----------|-------------------|-----------|
| **Near-term** (Stage 17+) | Implement auth, events, and profile services as pilots | Validate the specification with real features |
| **Mid-term** (Stage 19+) | Add ESLint rules for service governance | Automate the review checklist |
| **Mid-term** (Stage 20+) | Implement the offline mutation queue | Enable core features offline |
| **Long-term** | Evaluate BFF layer for API aggregation | Only if composite services become complex |
| **Long-term** | Evaluate service worker-based sync | Only if offline usage is high |

---

## Engineering Review

### Architecture Analysis

The specification establishes a **hexagonal architecture** at the service layer: services are ports (business use case interfaces), and repositories/stores/event buses are adapters. The context injection pattern makes dependency direction explicit: services depend on abstractions (interfaces in the context type), not concretions (specific repository implementations).

The three-tier topology (infrastructure → shared → feature) mirrors the existing three-tier topology of the utility, hook, and state layers, creating a consistent architectural rhythm across all layers.

### Business Workflow Analysis

The workflow pipeline (`withWorkflow`) addresses the most common source of bugs in frontend business logic: missing or inconsistent error handling across multi-step operations. By standardizing the validate → authorize → optimize → persist → invalidate → emit → notify sequence, every mutation follows the same pattern, reducing the chance of missed steps.

The optimistic update + rollback pattern handles the most common user-facing failure: the "saved successfully" toast followed by data reversion. By capturing a snapshot before mutation and restoring on failure, the user always sees accurate state.

### Dependency Analysis

The strict dependency rules prevent the most common architectural violation: feature services importing other feature services. The event bus provides a decoupled communication channel that makes cross-feature workflows explicit and traceable.

The context injection pattern eliminates implicit dependencies. Every dependency of a service function is visible in its type signature. This makes it impossible for a service to silently depend on a global singleton.

### Performance Analysis

The performance budgets (500ms for mutations, 200ms for reads) are achievable with the optimistic update pattern. The caching coordination (stale-while-revalidate) ensures that reads are sub-5ms for cached data.

The main performance risk is service composition: a composite service that calls 6 feature services sequentially could take 1200ms. Mitigation: parallelize independent calls with `Promise.allSettled` and lazy-load secondary data.

### Testing Considerations

The context injection pattern makes services trivially testable: every dependency can be mocked through the context parameter. No module mocking, no DI container setup, no global state to reset.

The 100% error path coverage requirement ensures that every `ServiceError` code is tested. This is the most common gap in service testing — developers test the happy path and one error path, leaving rare errors untested.

### Maintainability Analysis

The 250-line service limit, 50-line function limit, and 10 cyclomatic complexity threshold prevent services from becoming unmaintainable. The JSDoc requirements ensure that every function's contract is documented before it can be modified.

The co-location pattern (service + types + tests + test-utils in one directory) means that a developer working on a service never needs to navigate away from the service directory.

### Scalability Analysis

The architecture is designed for linear scalability: adding a feature means adding a `_services/` directory without modifying any existing service. The prohibition on cross-feature imports means that feature teams can work independently.

The main scalability bottleneck is the composite service pattern for dashboards. At 15+ features, a single dashboard composite service may need to call 10+ feature services. Mitigation: implement a page-specific composite service (e.g., `adminDashboardService.ts`) rather than a single shared `dashboardService`.

### Future Expansion Recommendations

1. **Service worker integration** — expose the workflow pipeline's retry mechanism to service workers for background sync and push notification handling.
2. **Feature flags in services** — integrate the feature flags store (Stage 15) as a service context dependency so services can branch on feature flags without importing stores directly.
3. **Metric aggregation** — implement a metric collector in the infrastructure layer that aggregates service-level metrics (call count, duration, error rate) for dashboard visualization.
4. **Declarative service contracts** — generate OpenAPI-like documentation from service function JSDoc using TypeDoc or a custom extractor.
5. **Cross-service tracing** — propagate correlation IDs through the event bus so that a user action triggering 3 service calls across 2 features produces a single trace.
