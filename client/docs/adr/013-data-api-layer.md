# Stage 13 — Data & API Architecture Layer Specification

**Status:** Implemented ✦ 2026-07-09
**Dependencies:** Stage 10 (Type System Layer), Stage 11 (Constants Layer), Stage 12 (Utility Layer), Stage 14 (Hook Layer), Stage 15 (State Layer)
**Next:** Stage 16 (Security Layer)

---

## Table of Contents

1. Data Philosophy
2. API Philosophy
3. Layer Position & Responsibilities
4. Data Source Architecture
5. Repository Pattern
6. Repository Responsibilities
7. Repository Ownership Model
8. API Client Architecture
9. HTTP Client Strategy
10. Request Lifecycle
11. Response Lifecycle
12. Request Pipeline
13. Response Pipeline
14. DTO Strategy
15. Domain Mapping Strategy
16. View Model Mapping
17. Serialization Strategy
18. Deserialization Strategy
19. Data Transformation Pipeline
20. Request Builder Strategy
21. Response Parser Strategy
22. Authentication Integration
23. Authorization Integration
24. Token Management
25. Request Headers Strategy
26. HTTP Status Handling
27. Error Classification
28. Error Normalization
29. Retry Strategy
30. Timeout Strategy
31. Request Cancellation
32. Parallel Requests
33. Sequential Requests
34. Batch Requests
35. Optimistic Updates
36. Pessimistic Updates
37. Cache Philosophy
38. Cache Invalidation
39. Cache Refresh Strategy
40. Offline Strategy
41. Synchronization Strategy
42. Pagination Strategy
43. Filtering Strategy
44. Search Strategy
45. Sorting Strategy
46. File Upload Architecture
47. File Download Architecture
48. Image Upload Strategy
49. Realtime Communication Strategy
50. API Versioning
51. Contract Evolution
52. Security Strategy
53. Logging Strategy
54. Monitoring Strategy
55. Dependency Rules
56. Shared Repository Strategy
57. Feature Repository Strategy
58. Testing Strategy
59. Mocking Strategy
60. Documentation Strategy
61. Governance Strategy
62. Performance Considerations
63. Scalability
64. Maintainability
65. Enterprise Best Practices
66. Engineering Review
67. Self-Validation

---

## 1. Data Philosophy

### Purpose
Define the fundamental principles governing data acquisition, transformation, and flow throughout the frontend application.

### Engineering Rationale
A coherent data philosophy prevents architectural drift, ensures every team member makes consistent decisions about data handling, and establishes a shared mental model for how data enters, moves through, and exits the system.

### Principles

**Single Source of Truth.** Every piece of data has exactly one authoritative source. Derived or transformed data is never treated as canonical. The backend is the source of truth for persisted data. The cache is a temporary snapshot, never the authority.

**Immutable Data Flow.** Data moves through the system in one direction only. No layer mutates data received from a layer above or below. Transformations produce new objects; they never modify existing ones.

**Explicit Contracts.** Every API interaction is governed by a typed contract. The shape of requests and responses is declared, validated, and versioned. Implicit or undocumented data shapes are forbidden.

**Fail Explicitly.** Data access failures must be surfaced as typed, predictable errors. Silent failures, undefined branches, and swallowed exceptions are architecture violations.

**Separation of Concerns.** Data acquisition, transformation, storage, and presentation are distinct responsibilities. No single module performs more than one of these roles.

### Trade-offs
- Strict separation adds indirection compared to ad-hoc fetching
- Explicit contracts increase initial implementation effort
- Immutability carries a memory and CPU cost at scale

### Industry Best Practice
Google's Frontend Architecture, Shopify's Polaris Data Layer, and Vercel's SWR/React Query patterns all enforce these same principles through layered data access with typed contracts and unidirectional flow.

### Recommendation
Adopt these five principles as the immutable foundation of the data layer. Reject any architecture proposal that violates them.

## 2. API Philosophy

### Purpose
Establish the principles governing all API communication between the frontend and backend systems.

### Engineering Rationale
Without a consistent API philosophy, each feature team adopts different communication patterns, leading to inconsistent error handling, unpredictable performance, and an unmaintainable integration surface.

### Principles

**Contract-First.** API contracts are designed, documented, and reviewed before any integration code is written. Contracts define shapes, status codes, headers, and error formats.

**Backend for Frontend (BFF).** A dedicated BFF layer mediates between the frontend and backend services. The BFF aggregates, transforms, and reduces data specifically for UI consumption. The frontend never calls microservices directly.

**Idempotency Respect.** Mutating operations are designed assuming the backend supports idempotency keys. The frontend generates and retries with idempotency keys for critical mutations.

**Versioned Negotiation.** API version is negotiated through the Accept header or URL prefix. The frontend declares which version it expects and gracefully degrades when a version is removed.

**Graceful Degradation.** Every API consumer handles unavailable services, degraded responses, and partial data without crashing the UI.

### Trade-offs
- BFF introduces an additional network hop and maintenance surface
- Contract-first slows initial development velocity
- Idempotency requires backend coordination

### Industry Best Practice
Netflix, Spotify, and GitHub all employ BFF patterns. Stripe's API versioning via the Stripe-Version header is the gold standard for contract evolution.

### Recommendation
Adopt a BFF-first architecture with contract-first integration. Never bypass the BFF to call backend services directly.

---

## 3. Layer Position & Responsibilities

### Purpose
Define the Data & API Layer's position in the architecture hierarchy and enumerate its exact responsibilities.

### Engineering Rationale
Clear boundaries prevent the data layer from leaking into UI code, and prevent business logic from leaking into data access code.

### Layer Position

The Data & API Layer sits between the Hooks / State Layer (above) and Backend / External APIs (below). It is the sole intermediary for all data operations.

### Layer Responsibilities

| Responsibility | Description |
|---|---|
| API Communication | Sending requests, receiving responses |
| Repository Abstraction | Encapsulating data sources behind stable interfaces |
| DTO Mapping | Converting wire formats to domain models |
| Error Normalization | Classifying and structuring error information |
| Cache Management | Storing, invalidating, refreshing cached data |
| Request Orchestration | Sequencing, parallelizing, canceling requests |
| Authentication Injection | Attaching credentials to requests |
| Retry Logic | Recovering from transient failures |

### Layer Non-Responsibilities

| Non-Responsibility | Owner |
|---|---|
| UI State | State Layer |
| Business Logic | Feature / Service Layer |
| Component Data | Hooks / Components |
| Routing Logic | Routing Layer |

### Trade-offs
- Strict responsibilities require discipline during code review
- Developers may be tempted to short-circuit the layers

### Industry Best Practice
Clean Architecture (Robert C. Martin) and Domain-Driven Design (Eric Evans) both enforce strict layer boundaries with dependency inversion.

### Recommendation
Document these responsibilities and enforce them through ESLint boundaries and code review.

---

## 4. Data Source Architecture

### Purpose
Design the strategy for abstracting multiple backend and external data sources behind a unified interface.

### Engineering Rationale
Modern frontend applications consume data from REST APIs, GraphQL endpoints, realtime streams, local caches, and browser storage. Without abstraction, every data source type leaks into feature code.

### Data Source Types

| Source | Abstraction | Recommendation |
|---|---|---|
| REST API | Repository + HTTP Client | Primary data source |
| GraphQL API | Repository + GraphQL Client | For complex query patterns |
| Realtime (WebSocket/SSE) | Repository + Event Stream | For live updates |
| Server-Sent Events | Repository + EventSource | For one-way push |
| Browser Cache | Cache Repository | For offline support |
| IndexedDB | Local Repository | For offline persistence |
| Local Storage | Simple Repository | For preferences only |

### Abstraction Mechanism
Every data source is wrapped by a repository. The repository exposes only domain-level methods. Feature code never imports an HTTP client, GraphQL client, or IndexedDB API directly.

### Trade-offs
- Repository abstraction adds indirection for simple CRUD
- Different data sources have different capabilities
- Developers must understand multiple transport mechanisms

### Industry Best Practice
Microsoft's eShopOnContainers and GitHub's Desktop application both use repository patterns to abstract data sources.

### Recommendation
Wrap every data source behind a repository interface. The feature layer never knows whether data came from REST, GraphQL, cache, or WebSocket.

---

## 5. Repository Pattern

### Purpose
Define the repository pattern as the single point of data access for the entire application.

### Engineering Rationale
The repository pattern decouples data acquisition logic from business logic and UI code. It provides a stable interface that survives backend changes, protocol upgrades, and data source migrations.

### Repository Definition
A repository is a module responsible for:
1. Exposing domain-level data access methods
2. Encapsulating the data source (REST, GraphQL, cache, etc.)
3. Performing DTO-to-domain mapping
4. Managing cache interactions
5. Handling error normalization
6. Implementing pagination, filtering, and sorting

### Repository Interface Contract
Every repository method returns a standardized result type:

Result<T> = { success: true; data: T; metadata?: ResponseMetadata } | { success: false; error: NormalizedError }

Repository methods NEVER:
- Return raw T (throws on error)
- Accept or return DTOs
- Accept or return ViewModels
- Access browser APIs directly
- Import from features, components, or hooks

### Repository Types

| Type | Scope | Location |
|---|---|---|
| Shared Repository | Cross-feature data | src/lib/data/repositories/ |
| Feature Repository | Single feature data | src/features/*/_data/repositories/ |
| Cache Repository | Cache-only access | src/lib/data/cache/ |
| Local Repository | Device-local data | src/lib/data/local/ |

### Trade-offs
- Repository pattern adds boilerplate for simple get/put operations
- Over-abstraction can hide performance issues
- Team must be trained on pattern usage

### Industry Best Practice
The repository pattern is standard in enterprise Java (Spring Data), .NET (Entity Framework), and TypeScript (TypeORM, MikroORM).

### Recommendation
Implement the repository pattern as the mandatory data access layer. All data access must go through a repository. Direct HTTP calls from features, hooks, or components are architecture violations.

---

## 6. Repository Responsibilities

### Purpose
Enumerate the exact responsibilities every repository must fulfill.

### Engineering Rationale
When repository responsibilities are ambiguous, repositories become god classes that mix data access, caching, transformation, and business logic.

### Mandatory Responsibilities

| Responsibility | Description |
|---|---|
| Data Source Encapsulation | Hide whether data comes from REST, GraphQL, or cache |
| DTO-to-Domain Mapping | Transform wire format to domain model |
| Error Normalization | Catch and classify all errors |
| Result Wrapping | Return standardized Result<T> |
| Cache Interaction | Check, read, write cache |
| Request Building | Construct API-compatible request objects |

### Prohibited Responsibilities

| Prohibition | Reason |
|---|---|
| Business Logic | Belongs in services/features |
| State Management | Belongs in state layer |
| ViewModel Construction | Belongs in hooks/sections |
| UI Logic | Belongs in components |
| Route Logic | Belongs in routing layer |

### Responsibility Verification
Each repository must answer yes to:
1. Does this method return Result<T>?
2. Does this method accept only domain types?
3. Does this method return only domain types?
4. Does this method handle errors from the data source?
5. Does this method avoid business logic?

### Trade-offs
- Strict responsibility separation increases file count
- Enforcement requires tooling and discipline

### Industry Best Practice
Uncle Bob's Clean Architecture defines repositories as gateways that sit at the boundary between the application and external systems.

### Recommendation
Adopt the mandatory/prohibited responsibility table as a checklist during repository code review.

---

## 7. Repository Ownership Model

### Purpose
Define who owns which repositories and how ownership is determined.

### Engineering Rationale
Unclear ownership leads to duplicate repositories, conflicting implementations, and data access spread across the codebase.

### Ownership Tiers

| Tier | Scope | Owner |
|---|---|---|
| Tier 1 — Shared | Cross-feature domain data | Core platform team |
| Tier 2 — Feature | Single-feature domain data | Feature team |
| Tier 3 — External | Third-party integration | Integration team |
| Tier 4 — Cache | Local-only data | Platform team |

### Ownership Rules
1. A shared repository is created when 2+ features need the same data
2. A feature repository is created when data is private to one feature
3. External repositories wrap third-party APIs behind the same contract
4. Cache repositories are shared infrastructure owned by the platform team

### Promotion Path
When a feature repository is needed by a second feature:
1. The repository is promoted to src/lib/data/repositories/
2. The feature-specific mapping is extracted into the repository
3. The original feature updates its imports

### Trade-offs
- Promotion requires refactoring effort
- Early promotion leads to premature abstraction
- Late promotion leads to duplication

### Industry Best Practice
Stripe's API and GitHub's codebase use ownership models where the team closest to the data owns the integration.

### Recommendation
Start with feature repositories. Promote to shared only when a second consumer emerges. Document ownership in a DATA_OWNERSHIP.md file.

---

## 8. API Client Architecture

### Purpose
Design the API client architecture that all HTTP-based repositories use internally.

### Engineering Rationale
A consistent API client ensures every request follows the same authentication, header construction, error handling, and retry logic.

### Client Architecture
The API client is a low-level transport abstraction. It is NOT a repository. It IS:
- An HTTP transport layer
- A request/response interceptor pipeline
- An authentication token injector
- A response status classifier
- An error normalizer

### Client Interface
The API client exposes get, post, put, patch, and delete methods. Each accepts a path and optional RequestConfig and returns ApiResponse<T>.

RequestConfig includes headers, params, signal, timeout, and retry configuration.

### Client Construction
The API client is provided through dependency injection (constructor injection), not imported directly. This enables testing and client replacement without changing repository code.

### Client Count
The application maintains at minimum:
1. Primary API Client — communicates with the BFF
2. Auth API Client — communicates with the auth provider (if separate)
3. External API Client — communicates with third-party services (if needed)

### Trade-offs
- Dependency injection adds initial complexity
- Multiple clients require careful configuration management
- Interceptor pipeline adds latency to every request

### Industry Best Practice
Angular's HttpClient, Axios interceptors, and Apollo Client's link chain all use a pipeline/interceptor architecture that separates transport concerns from business concerns.

### Recommendation
Build a thin ApiClient abstraction around the native fetch API. Use an interceptor chain for cross-cutting concerns. Inject the client into repositories.

---

## 9. HTTP Client Strategy

### Purpose
Determine whether to use the native fetch API or a third-party HTTP library.

### Engineering Rationale
The HTTP client choice affects bundle size, request cancellation, progress reporting, testing ergonomics, and cross-runtime compatibility.

### Options

| Option | Bundle Size | Cancellation | Interceptors |
|---|---|---|---|
| Native fetch | 0 KB | AbortController | Manual wrapper |
| Axios | ~14 KB gzipped | CancelToken | Built-in |
| ky | ~4 KB gzipped | AbortController | Hooks pattern |
| wretch | ~3 KB gzipped | AbortController | Middleware |

### Recommendation
Use native fetch wrapped in a thin ApiClient abstraction.

Rationale:
1. Zero bundle cost — available in all modern runtimes
2. AbortController is the standard cancellation mechanism
3. Avoids third-party dependency risk for a foundational layer
4. Edge function and service worker compatibility

### If Axios Is Preferred
If the team is significantly more productive with Axios: use a single Axios instance, configure interceptors once, never import Axios directly outside the API client module.

### Trade-offs
- Native fetch requires building an interceptor layer
- fetch does not natively support upload progress
- fetch's error handling requires manual status checking

### Industry Best Practice
Vercel, Cloudflare, and Deno all recommend native fetch for new projects. The web platform has standardized around fetch as the universal HTTP primitive.

### Recommendation
Native fetch wrapped in a createApiClient factory function. Add interceptors for auth, logging, and error handling.

---

## 10. Request Lifecycle

### Purpose
Design the complete lifecycle of every API request from user action to backend delivery.

### Engineering Rationale
Without a documented lifecycle, developers invent inconsistent request patterns. A standard lifecycle ensures every request follows the same path through the architecture.

### Lifecycle Stages
User Action -> Feature/Section -> Hook -> Service/State Action -> Repository -> API Client -> HTTP Transport -> Backend

### Stage Responsibilities

Stage 1 — Feature/Section: Responds to user gesture. Calls a hook with domain parameters. Displays loading, success, or error state.

Stage 2 — Hook: Calls a service, state action, or repository directly. Manages component-level loading/error state. Transforms repository data into ViewModel format. Returns { data, isLoading, error, actions } to the component.

Stage 3 — Service/State Action: Orchestrates multi-repository transactions. Applies business logic before or after data access. Coordinates cache updates. Dispatches state mutations.

Stage 4 — Repository: Builds the request parameters. Calls the API client. Maps the DTO response to a domain model. Handles and normalizes errors. Returns Result<T>.

Stage 5 — API Client: Injects authentication headers. Applies request interceptors. Configures timeout and cancellation. Sends the request via HTTP transport.

Stage 6 — HTTP Transport: Performs the actual network call. Returns raw response to the API client.

Stage 7 — Backend: Processes the request. Returns an HTTP response.

### Lifecycle Rules
1. Every stage is optional except stages 4, 5, and 6
2. No stage may skip the stage below it
3. Repository is the ONLY stage that imports API client
4. Features NEVER call the API client directly
5. Hooks NEVER call the API client directly

### Trade-offs
- Full lifecycle adds latency for simple read operations
- Skipping stages may be necessary for trivial reads
- The lifecycle requires all team members to understand the flow

### Industry Best Practice
The layered request lifecycle mirrors the Onion Architecture and Hexagonal Architecture patterns used by enterprise applications at Amazon, Netflix, and ThoughtWorks.

### Recommendation
Adopt the standard lifecycle with a bypass rule: hooks may call repositories directly when no business logic or state coordination is needed.

---

## 11. Response Lifecycle

### Purpose
Design the complete lifecycle of every API response from backend delivery to UI rendering.

### Engineering Rationale
The response lifecycle defines where transformation occurs, preventing mapping logic from spreading across the codebase.

### Lifecycle Stages
Backend -> HTTP Response -> Response Parser -> DTO -> Mapper -> Domain Model -> View Model Mapper -> View Model -> State -> Hook -> UI

### Stage Responsibilities

Stage 1 — HTTP Response: Raw response from the server (status, headers, body). Untyped, unvalidated.

Stage 2 — Response Parser (API Client): Parses the body as JSON. Checks HTTP status for success/failure. Returns ApiResponse<T>.

Stage 3 — DTO: The parsed JSON typed as a DTO. DTOs match the wire format exactly.

Stage 4 — Mapper (Repository): Transforms DTO to domain model. Validates required fields. Converts date strings to Date objects. Maps enum strings to TypeScript enums.

Stage 5 — Domain Model: Clean domain object with business-relevant shape. No server-specific fields.

Stage 6 — View Model Mapper (Hook/Service): Transforms domain model to UI-ready shape. Combines data from multiple domain models.

Stage 7 — View Model: UI-optimized data shape. May contain display-specific fields.

Stage 8 — State: ViewModel is stored in state management.

Stage 9 — Hook: Reads state, manages loading/error lifecycle.

Stage 10 — UI: Renders the ViewModel. Never transforms data.

### Mapping Location Rules

| Transformation | Location |
|---|---|
| Wire format to Domain | Repository |
| Domain to ViewModel | Hook / Service |
| ViewModel to Domain | Service / State Action |
| Domain to DTO | Repository |

### Trade-offs
- Multiple mapping stages increase file count
- Every transformation is a potential bug source
- Developers may skip domain models for simple data

### Industry Best Practice
Netflix's frontend architecture and Spotify's client architecture both implement multi-stage mapping with clear boundaries between transport formats and presentation formats.

### Recommendation
Enforce mandatory DTO to Domain mapping in repositories. Allow hooks to generate ViewModels. Never store DTOs in state. Never render Domain Models directly.

---

## 12. Request Pipeline

### Purpose
Design the pipeline that every outgoing request passes through before reaching the transport layer.

### Engineering Rationale
A request pipeline provides a single location for cross-cutting concerns (auth, logging, timeout, retry) without duplicating logic in every repository.

### Pipeline Stages
Repository Calls API Client -> Request Interceptor Chain -> Authentication Header Injection -> Request Signing -> Logging -> Timeout Configuration -> AbortSignal Binding -> HTTP Transport -> Backend

### Stage Details

Request Interceptor Chain: Array of interceptors, each receiving the request config. Each interceptor may add headers, modify the body, or reject.

Authentication Header Injection: Reads the current auth token. Injects Authorization: Bearer header. Handles token refresh if expired.

Request Signing: For sensitive operations, signs the request body with a client-side secret.

Logging: Logs method, path, headers (excluding auth header value), and body size. Does NOT log auth tokens, passwords, or personal data.

Timeout Configuration: Applies default timeout. Allows per-request override via RequestConfig.

AbortSignal Binding: Creates or attaches an AbortSignal. Enables request cancellation from hooks or components.

### Pipeline Implementation
The pipeline is implemented as a function composition pattern, not a class hierarchy.

### Trade-offs
- Every interceptor adds latency
- Async interceptors may hold up the pipeline
- Pipeline ordering affects behavior

### Industry Best Practice
Axios interceptors, Apollo Link chains, and Express middleware all use the same pipeline composition pattern.

### Recommendation
Implement a function-composition pipeline with async support. Keep interceptors pure and stateless. Order: auth -> signing -> logging -> timeout -> abort.

---

## 13. Response Pipeline

### Purpose
Design the pipeline that every incoming response passes through before reaching the repository.

### Engineering Rationale
A response pipeline normalizes error handling, logging, and status classification in a single location, keeping repositories focused on mapping.

### Pipeline Stages
HTTP Response -> HTTP Status Classification -> Authentication Error Check -> Error Normalization -> Logging -> Response Unwrapping -> Response Interceptor Chain -> Repository

### Stage Details

HTTP Status Classification: Classifies status codes into success, client error, server error, redirect, network failure.

Authentication Error Check: On 401, triggers token refresh. If refresh fails, triggers logout. Does NOT retry the original request automatically.

Error Normalization: Converts the error response to a NormalizedError structure. Extracts message, code, status, and validation details. Masks sensitive server information.

Logging: Logs status, path, duration, and error code. Does NOT log response bodies for non-error responses.

Response Unwrapping: For 2xx responses, unwraps the response body from any envelope. Strips server-specific metadata.

Response Interceptor Chain: Captures rate limit headers, correlation IDs, etc.

### Response Contract
The pipeline guarantees that the repository always receives: on success, { success: true, data: DomainModel }; on failure, { success: false, error: NormalizedError }.

### Trade-offs
- Pipeline error normalization may lose backend-specific error details
- Async interceptors may delay response delivery
- Response logging may impact performance at high throughput

### Industry Best Practice
Apollo Client's response link chain and Axios's response interceptors implement the same pattern.

### Recommendation
Implement the response pipeline as the mirror of the request pipeline. Normalize errors at this layer. Never let raw HTTP errors reach repositories or hooks.

---

## 14. DTO Strategy

### Purpose
Define the Data Transfer Object (DTO) strategy for representing wire-format data.

### Engineering Rationale
DTOs isolate the application from backend contract changes. When the backend changes its response shape, only the DTO and its mapper change. The rest of the application is unaffected.

### DTO Definition
A DTO is a TypeScript interface that exactly matches the backend's JSON response shape. DTOs use the backend's naming convention (snake_case) and types (strings for dates).

### DTO Rules
1. DTOs live in src/lib/data/dto/ for shared or src/features/*/_data/dto/ for feature-specific
2. DTOs are plain TypeScript interfaces — no classes, no methods
3. DTOs are NEVER exported outside the data layer
4. DTOs are NEVER stored in state
5. DTOs are NEVER used in components, hooks, or services
6. DTOs are ALWAYS mapped to domain models before leaving the repository

### DTO Naming Convention
[Entity]DTO (e.g., AlumniDTO)
[Entity][Action]RequestDTO (e.g., AlumniCreateRequestDTO)
[Entity][Action]ResponseDTO (e.g., AlumniSearchResponseDTO)

### DTO Validation
DTOs may be validated using Zod schemas defined in Stage 10 (Type System Layer). Parse incoming data with the schema before mapping to ensure runtime type safety.

### Trade-offs
- DTOs create a parallel type hierarchy alongside domain models
- Zod validation adds runtime overhead for every response
- Strict DTO separation increases file count

### Industry Best Practice
Stripe's API responses are documented as exact JSON shapes — these are DTOs. NestJS and .NET both use explicit DTO classes with validation decorators.

### Recommendation
Create DTO interfaces for every backend response shape. Use Zod schemas for runtime validation. Never expose DTOs beyond the repository boundary.

---

## 15. Domain Mapping Strategy

### Purpose
Define how DTOs are mapped to domain models and vice versa.

### Engineering Rationale
Mapping transforms raw wire-format data into clean, typed domain objects that the rest of the application can use without knowledge of the backend's data representation.

### Mapping Location
All DTO to Domain mapping lives in the repository implementation. Mapping is NEVER performed in hooks, features, components, or state management.

### Mapping Rules
1. Every field must be explicitly mapped — no spread operators
2. Date strings must be converted to Date objects
3. Enum strings must be converted to TypeScript enums
4. Null fields must be converted to undefined or default values
5. Nested DTOs must be recursively mapped to nested domain models
6. List DTOs must have each element mapped individually

### Reverse Mapping
Write reverse mappers (toDTO) for every entity the application mutates. Read-only entities need only a forward mapper.

### Trade-offs
- Explicit mapping is verbose but safe
- Spread operators are concise but fragile (new fields are missed)
- Auto-mappers reduce boilerplate but hide mapping logic

### Industry Best Practice
Shopify's REST API wrappers and GitHub's Octokit both implement explicit DTO-to-domain mapping. The additional verbosity is accepted in exchange for type safety and contract clarity.

### Recommendation
Write explicit toDomain and toDTO mapper functions in every repository. Use Zod schemas for validation.

---

## 16. View Model Mapping

### Purpose
Define how domain models are transformed into UI-ready ViewModels.

### Engineering Rationale
Domain models represent business entities. ViewModels represent what the UI needs to render. They are rarely the same shape. ViewModel mapping keeps UI-specific concerns out of domain models.

### Mapping Location
ViewModel mapping happens in hooks or services. It is NEVER performed in repositories or components.

### ViewModel Purpose
1. Combination: UI needs data from multiple domain models
2. Formatting: UI needs formatted dates, currency, names
3. Derivation: UI needs computed fields (full name, age, status label)
4. Selection: UI needs transient selection state (isSelected, isExpanded)
5. Localization: UI needs translated strings, formatted numbers

### ViewModel Rules
1. ViewModels are plain objects or interfaces — no classes
2. ViewModels are NOT stored in the data layer
3. ViewModels are derived in hooks and passed to components
4. ViewModels are NOT passed back to repositories
5. ViewModel fields are NEVER sent to the backend

### Trade-offs
- ViewModel mapping creates a third representation (DTO -> Domain -> ViewModel)
- Simple pass-through fields feel redundant
- ViewModels in hooks may be re-derived on every render without memoization

### Industry Best Practice
React Query's select option is a built-in ViewModel mapper. MVVM (Model-View-ViewModel) is a well-established pattern in WPF, Xamarin, and Angular.

### Recommendation
Map ViewModels in hooks using useMemo. For complex ViewModels, extract the mapping function to a standalone utility in the feature's _utils directory.

---

## 17. Serialization Strategy

### Purpose
Define how application data is serialized before being sent to the backend.

### Engineering Rationale
The backend expects data in a specific wire format (snake_case, ISO dates, specific number formats). Consistent serialization ensures all requests use the same transformation.

### Serialization Rules
1. Date serialization: ALL dates are serialized as ISO 8601 strings using toISOString()
2. Enum serialization: TypeScript enums are serialized as their string or numeric values
3. Numeric precision: Decimals are serialized with fixed precision for monetary values
4. Null handling: null is serialized as null (not omitted)
5. Optional fields: undefined fields are OMITTED from the serialized payload
6. Array serialization: Arrays are always serialized as JSON arrays

### Serialization Location
Serialization happens in the repository's toDTO mapper function. It is NEVER performed in hooks, components, API client interceptors, or services.

### Content-Type Negotiation
The API client sets Content-Type: application/json by default. Repositories that send FormData (file uploads) must let the browser set it automatically.

### Trade-offs
- Explicit serialization in every toDTO is repetitive
- Auto-serialization libraries reduce boilerplate but hide the mapping
- Date serialization is a common source of bugs when time zones are involved

### Industry Best Practice
Prisma serializes Date objects as ISO strings automatically. NestJS uses class-transformer decorators. Both approaches work, but explicit serialization in mappers is the most auditable.

### Recommendation
Write explicit serialization in toDTO mapper functions. Never rely on implicit serialization or auto-transform libraries.

---

## 18. Deserialization Strategy

### Purpose
Define how backend responses are deserialized into typed application structures.

### Engineering Rationale
Consistent deserialization prevents runtime errors from unexpected data shapes, ensures date strings become Date objects, and normalizes the data format.

### Deserialization Rules
1. JSON parsing: handled by the API client's response parser
2. Date conversion: ISO 8601 strings are converted to Date objects in the mapper
3. Number parsing: numeric strings are converted to number types
4. Enum resolution: string values are resolved to TypeScript enum members
5. Null coalescing: null values are converted to undefined or defaults
6. Type coercion: NEVER coerce types; if the backend sends a string where a number is expected, fail explicitly
7. Validation: Parsed DTOs are validated against Zod schemas before mapping

### Deserialization Location
Deserialization happens in the repository's toDomain mapper function. It is NEVER performed in the API client, components, hooks, or state management.

### Validation-First Approach
Before mapping, validate the DTO against a Zod schema. This catches backend contract violations at the boundary, preventing corrupted data from propagating.

### Trade-offs
- Zod validation adds runtime overhead per response
- Nested mapping requires recursive handling
- Type coercions from string to number risk silent data loss

### Industry Best Practice
Zod's parse method is the industry standard for TypeScript runtime validation. tRPC, TanStack Query, and Convex all use schema validation at the API boundary.

### Recommendation
Validate every response with a Zod schema before mapping. Fail explicitly on validation errors. Never silently coerce types.

---

## 19. Data Transformation Pipeline

### Purpose
Design the complete pipeline that data passes through from raw API response to UI-ready ViewModel.

### Engineering Rationale
A documented transformation pipeline gives every developer the same mental model for how data is processed. It prevents mapping logic from appearing in unexpected places.

### Pipeline Stages (Forward)
Raw HTTP Response Body -> JSON.parse() (API Client) -> unknown -> Zod parse() (Repository) -> DTO -> toDomain() mapper (Repository) -> Domain Model -> Store/Cache (State Layer) -> Hook selector + useMemo() (Hook) -> ViewModel -> Component render (UI)

### Pipeline Stages (Reverse - Mutations)
User Form Data -> ViewModel (Hook) -> toDomain() reverse mapper (Service/State Action) -> Domain Model -> toDTO() reverse mapper (Repository) -> DTO -> JSON.stringify() (API Client) -> HTTP Request Body (Backend)

### Transformation Rules
1. Each transformation happens in exactly one layer
2. No layer performs transformations that belong to another layer
3. Transformations are pure functions — no side effects
4. Transformation functions are stateless and independently testable

### Trade-offs
- The pipeline requires understanding of all stages
- Debugging requires tracing through multiple files
- Simple CRUD operations still pass through the full pipeline

### Industry Best Practice
ETL (Extract, Transform, Load) pipelines in data engineering follow the same staged transformation pattern. Kafka Streams and Apache Beam both define explicit transformation stages.

### Recommendation
Document the transformation pipeline in every repository's README. Test each transformation function independently.

---

## 20. Request Builder Strategy

### Purpose
Define how API requests are constructed from domain parameters.

### Engineering Rationale
Request builders centralize the construction of API-compatible request objects, preventing URL construction and query parameter encoding from spreading across repositories.

### Request Builder Responsibilities
1. URL Construction: Builds the endpoint path from domain parameters
2. Query Parameter Encoding: Converts domain filter/sort/search objects to URL params
3. Header Construction: Adds Content-Type, Accept, and domain-specific headers
4. Body Serialization: Serializes the domain mutation to a DTO
5. Path Parameter Injection: Fills path parameters (:id, :slug)

### Builder Patterns

Pattern 1 — Dedicated Builder Functions: Separate function that constructs the request config from domain parameters. Used when 5+ parameters, shared across methods, or requires complex encoding.

Pattern 2 — Inline in Repository Methods: For simple requests (1-3 parameters), the repository method builds the config directly.

### Decision Rule
Use Pattern 1 (dedicated builder) when the request has 5+ parameters, is shared across methods, or requires complex encoding. Use Pattern 2 (inline) for simple requests private to a single method.

### Trade-offs
- Dedicated builders increase file count
- Inline construction mixes building and mapping concerns
- Builders may become stale when APIs evolve

### Industry Best Practice
Apollo Client's useQuery with typed variables and React Query's query functions both separate request construction from execution.

### Recommendation
Start with inline construction in repository methods. Extract to dedicated builder functions when complexity warrants it. Never build URLs manually with string concatenation.

---

## 21. Response Parser Strategy

### Purpose
Define how raw HTTP responses are parsed and validated before reaching the repository.

### Engineering Rationale
The response parser is the first line of defense against malformed, unexpected, or malicious responses.

### Parser Responsibilities
1. Body Parsing: Parses JSON, text, blob, or FormData from the response
2. Status Classification: Determines success vs. failure from HTTP status
3. Envelope Unwrapping: Extracts data from API envelopes
4. Header Extraction: Captures rate limit headers, correlation IDs, pagination info
5. Error Detection: Identifies error responses and normalizes them

### Parser Behavior by Content Type
- application/json: response.json()
- multipart/form-data: response.formData()
- text/plain: response.text()
- application/octet-stream: response.blob()
- text/event-stream: No parser (handled by EventSource)

### Parser Output
The parser returns a ParsedResponse containing success flag, data, error, status, headers, and metadata (correlationId, rateLimit, pagination, duration).

### Trade-offs
- Envelope unwrapping adds coupling to the backend's response format
- Header extraction is backend-implementation specific
- Multipart responses require special handling

### Industry Best Practice
GitHub's REST API encloses all results in a canonical envelope. Stripe's API returns data inline. Both patterns work as long as the parser handles them consistently.

### Recommendation
Implement a single parseResponse utility function that handles all content types. Configure it per-API-client for different backend conventions.

---

## 22. Authentication Integration

### Purpose
Design how the data layer integrates with the authentication system.

### Engineering Rationale
Every API request must carry authentication credentials. The data layer must attach these credentials without leaking authentication logic into repositories or features.

### Integration Points
Token Injection: API Client interceptor reads from auth service
Token Refresh: Response interceptor on 401 response
Logout Trigger: Response interceptor on refresh failure

### Authentication Flow
1. API Client begins request
2. Request interceptor reads token from AuthService
3. If token exists, inject Authorization header
4. If token is expired, trigger refresh before sending
5. If no token and endpoint requires auth, fail with AuthError

### Refresh Token Flow
1. Response interceptor receives 401
2. Interceptor triggers AuthService.refresh()
3. If refresh succeeds, retry original request with new token
4. If refresh fails, trigger logout, redirect to login
5. If request is retry (already tried with fresh token), do not retry again

### Auth Service Abstraction
The API client depends on an AuthTokenProvider interface (getToken, refreshToken, onAuthFailure). This enables testing with a mock provider and replacing the auth implementation without changing the API client.

### Trade-offs
- Async token retrieval adds latency to every request
- Automatic token refresh complicates the response pipeline
- Retry-on-401 logic requires careful idempotency handling

### Industry Best Practice
Auth0's SDK and NextAuth.js both provide token providers that integrate with HTTP clients. The interceptor pattern is the recommended approach.

### Recommendation
Implement the AuthTokenProvider interface and inject it into the API client factory. Never import auth code directly in repositories.

---

## 23. Authorization Integration

### Purpose
Design how the data layer integrates with authorization checks.

### Engineering Rationale
The data layer must prevent unauthorized requests before they reach the backend. This reduces server load and improves UX (no round-trip for a denied action).

### Authorization Strategy
Authorization in the data layer is a pre-request check, NOT a security boundary. The backend remains the authoritative enforcer.

### Integration Points
Pre-request check: Repository checks permissions before calling API client (for destructive actions)
Post-response check: Response interceptor handles 403 responses
Feature-level gate: Service/Hook checks before calling repository

### Permission Abstraction
The repository depends on an AuthorizationService interface (can, canAll) rather than importing auth logic directly.

### Trade-offs
- Client-side authorization checks may be out of sync with the backend
- Pre-request checks add latency to every authorized action
- Authorization logic in repositories violates strict separation if overused

### Industry Best Practice
CASL (JavaScript) and CanCan (Ruby) both implement authorization checks before allowing data access. GitHub's frontend checks permissions before displaying action buttons.

### Recommendation
Implement pre-request authorization only for destructive actions (delete, bulk operations). Rely on the backend's 403 response for read operations and simple mutations.

---

## 24. Token Management

### Purpose
Define how authentication tokens are stored, refreshed, and invalidated.

### Engineering Rationale
Tokens are the most sensitive data in the frontend application. Improper token management leads to security vulnerabilities, session errors, and poor user experience.

### Token Storage
- Access Token (short-lived, 15 min): In-memory variable — not persisted, cleared on tab close
- Refresh Token (long-lived, 7 days): httpOnly cookie — not accessible to JavaScript
- localStorage: NOT recommended — XSS vulnerability
- sessionStorage: Use with caution — accessible to JavaScript

### Token Refresh Strategy
1. Access token expires after 15 minutes
2. API client detects 401 response
3. API client calls /auth/refresh with the httpOnly cookie
4. Backend returns a new access token
5. API client retries the original request
6. If refresh fails, user is redirected to login

### Token Refresh Queue
To prevent multiple concurrent refresh requests, implement a token manager that deduplicates concurrent refresh calls. The first call initiates the refresh; subsequent calls await the same promise.

### Trade-offs
- In-memory tokens are lost on tab refresh (access token must be re-fetched)
- httpOnly cookies require the backend to set the cookie
- Refresh queues add complexity for a rare race condition

### Industry Best Practice
Auth0, Clerk, and NextAuth.js all use short-lived access tokens with httpOnly refresh cookies. This is the industry standard for SPA authentication.

### Recommendation
Use in-memory access tokens with httpOnly refresh cookies. Implement the refresh queue pattern to avoid concurrent refresh storms. Never store tokens in localStorage.

---

## 25. Request Headers Strategy

### Purpose
Define the standard set of headers sent with every API request.

### Engineering Rationale
Consistent headers ensure that every request carries the metadata the backend needs for processing, logging, and debugging.

### Standard Headers
Content-Type: application/json
Accept: application/json
X-Request-Id: unique request ID (crypto.randomUUID())
X-Client-Name: alumni-web
X-Client-Version: application version
X-Session-Id: current session ID

### Dynamic Headers
Authorization: Bearer {accessToken} (from auth service)
Accept-Language: {locale} (from i18n)
If-None-Match: {etag} (from cache)
X-Idempotency-Key: {key} (for mutations)

### Header Injection Order
1. Standard headers (always present)
2. Dynamic headers (from interceptors)
3. Repository-specific headers (from RequestConfig)
4. Per-request override headers (from call site)
Later headers override earlier ones with the same key.

### Prohibited Headers
NEVER send Authorization header value in logs, client-side secrets, user passwords or personal data in custom headers, or session tokens in URL query parameters.

### Trade-offs
- Custom headers require backend cooperation
- Header inheritance (override order) can be confusing
- X- headers are technically deprecated but universally used

### Industry Best Practice
Stripe, GitHub, and Twilio all use custom request headers for client identification and idempotency. The X-Request-Id pattern is universal for request tracing.

### Recommendation
Define a standard header set in the API client factory. Inject request ID, client name, and session ID automatically. Let interceptors add authorization and locale headers.

---

## 26. HTTP Status Handling

### Purpose
Define how every HTTP status code is handled in the response pipeline.

### Engineering Rationale
Consistent status handling prevents unhandled status codes from causing silent failures or confusing error messages.

### Status Code Map
200/201: Success — parse body, return data
204: No Content — return null data
304: Not Modified — return cached data
400: Bad Request — normalize validation errors
401: Unauthorized — trigger token refresh
403: Forbidden — return AuthorizationError
404: Not Found — return NotFoundError
409: Conflict — return ConflictError (retry with updated data)
422: Unprocessable — normalize validation errors with field details
429: Rate Limited — return RateLimitError (with retry-after header)
500/502/503/504: Server Error — return ServerError or TimeoutError (retry)

### Catch-All Rule
Any unhandled status code returns an UnexpectedError with the status code included. This ensures no response goes unclassified.

### Handling Implementation
Status handling is implemented in the response parser function, NOT in individual repositories. A classifyResponse function maps status codes to response categories.

### Trade-offs
- Catch-all handling may hide intentional use of non-standard status codes
- Error responses may have different body shapes than success responses
- Legacy backends may send incorrect status codes

### Industry Best Practice
The HTTP Semantics standard (RFC 9110) defines the standard status code meanings. All enterprise API clients implement the same classification logic.

### Recommendation
Implement the status classification function in the API client. Provide a per-client override map for backends that use non-standard codes.

---

## 27. Error Classification

### Purpose
Design a comprehensive error classification system for all API errors.

### Engineering Rationale
A unified error classification system enables consistent error handling across features, standardized error display in the UI, and predictable error recovery.

### Error Taxonomy
TransportError — Network failure, DNS, CORS
TimeoutError — Request exceeded timeout
AuthenticationError — 401, token expired, invalid credentials
AuthorizationError — 403, insufficient permissions
ValidationError — 400, 422, field-level validation
NotFoundError — 404, resource doesn't exist
ConflictError — 409, version conflict, duplicate
RateLimitError — 429, too many requests
ServerError — 5xx, backend failure
OfflineError — No network connection
CancellationError — Request was aborted
UnexpectedError — Unclassified status or unknown error

### Error Structure
Every NormalizedError contains: type (ErrorType enum), code (machine-readable), message (human-readable), status (HTTP status or null), details (field-level validation errors or null), retryable (boolean), correlationId, timestamp.

### Error Classification Rules
1. Every error must have a type from the taxonomy
2. Every error must have a human-readable message
3. Validation errors must include field-level details
4. Retryable errors must be marked as such
5. Non-retryable errors must NOT be retried automatically
6. Cancellation errors must NOT be displayed to the user

### Trade-offs
- A 12-type taxonomy requires judgment calls for ambiguous errors
- Field-level validation errors require backend cooperation
- Retry classification requires understanding of backend idempotency guarantees

### Industry Best Practice
Stripe's error taxonomy is the gold standard: each error has a type, code, and message. GitHub's API follows the same pattern.

### Recommendation
Adopt the full error taxonomy. Implement a normalizeError() function in the response pipeline that maps any error shape to NormalizedError.

---

## 28. Error Normalization

### Purpose
Define the process of converting varying error shapes into a unified NormalizedError structure.

### Engineering Rationale
Backend services, network failures, and browser APIs all produce errors in different formats. Error normalization provides a single, predictable error shape.

### Normalization Sources
HTTP 4xx/5xx: normalizeHttpError
Network failure (TypeError): normalizeNetworkError
AbortController (DOMException): normalizeCancellationError
Timeout (AbortSignal): normalizeTimeoutError
Zod validation (ZodError): normalizeValidationError
Offline detection: normalizeOfflineError
Unknown: normalizeUnexpectedError

### Normalization Function
A single normalizeError dispatcher function delegates to type-specific normalizers based on instanceof checks and duck typing.

### Error Context
Each normalized error carries optional context: endpoint, method, correlationId, feature, timestamp.

### Normalization Location
Error normalization happens in two places:
1. API Client response interceptor — normalizes HTTP errors
2. Repository catch blocks — normalizes unexpected errors from mappers

### Trade-offs
- Multiple normalizers mean multiple code paths
- Type narrowing must account for different environments
- Unknown errors are hard to normalize meaningfully

### Industry Best Practice
Sentry's Event normalization and Apollo Client's ApolloError both normalize varying error shapes into a standard structure.

### Recommendation
Implement a single normalizeError dispatcher that delegates to type-specific normalizers. Test each normalizer independently.

---

## 29. Retry Strategy

### Purpose
Define when and how failed requests are automatically retried.

### Engineering Rationale
Transient failures (network hiccups, rate limits, temporary server errors) are common in distributed systems. A retry strategy improves reliability without requiring manual user intervention.

### Retry Decision Matrix
TransportError: 3 retries, exponential backoff
TimeoutError: 2 retries, linear backoff
AuthenticationError: 0 retries (handled separately by refresh flow)
AuthorizationError: 0 retries
ValidationError: 0 retries (client-side bug)
NotFoundError: 0 retries
ConflictError: 0 retries (needs user action)
RateLimitError: 1 retry, fixed delay (wait for retry-after header)
ServerError: 3 retries, exponential backoff
OfflineError: Infinite retries, exponential backoff (retry until online)
CancellationError: 0 retries (intentional cancel)
UnexpectedError: 0 retries (fail safe)

### Retry Configuration
Each retry config specifies maxRetries, baseDelayMs, maxDelayMs, backoffFactor, jitter (boolean), and retryableErrors list.

### Exponential Backoff with Jitter
delay = min(baseDelay * backoffFactor^attempt, maxDelayMs) * (0.5 + random * 0.5)

### Retry Location
Retry logic lives in the API client, NOT in repositories. The repository calls apiClient.get() and the API client handles retry internally. The repository is unaware that retries occurred.

### Trade-offs
- Retries increase total request time
- Infinite retries for offline mode require careful UX (show offline indicator)
- Retried mutations require idempotency keys to prevent duplicate processing

### Industry Best Practice
AWS SDK's retry strategy, Google's gRPC retry design, and the retry npm package all implement exponential backoff with jitter.

### Recommendation
Implement retry in the API client with configurable RetryConfig. Default: 3 retries, exponential backoff, jitter enabled. Override per-request for special cases.

---

## 30. Timeout Strategy

### Purpose
Define request timeout values and timeout handling.

### Engineering Rationale
Requests that never complete block UI indefinitely. Timeouts ensure that every request eventually either succeeds or fails.

### Default Timeouts
GET (list): 30s
GET (detail): 15s
POST (create): 10s
PUT (update): 10s
DELETE: 10s
File Upload: 120s
File Download: 300s
Search: 30s

### Timeout Implementation
Use AbortController with Promise.race. When the timeout fires, the controller aborts the signal, which cancels the fetch request. A TimeoutError is returned.

### Timeout Error Handling
When a timeout occurs:
1. The request is aborted via AbortController
2. A TimeoutError is returned to the repository
3. The retry strategy may retry (if retryable and under max retries)
4. The UI shows a timeout-specific error message

### Trade-offs
- AbortController.abort() does not cancel server-side processing
- Timeout + retry can lead to multiple server-side executions
- Long timeouts for file uploads block the user for extended periods

### Industry Best Practice
Every major HTTP client (Axios, fetch, ky) supports timeout configuration. Google's API design guide recommends 10s for mutations and 30s for queries.

### Recommendation
Set default timeouts per operation type. Allow per-request override via RequestConfig.timeout. Timeout errors are distinct from network errors and should be displayed differently.

---

## 31. Request Cancellation

### Purpose
Define how in-flight requests are cancelled and how the application handles cancellation.

### Engineering Rationale
Users navigate away from pages, components unmount, and filters change before the previous request completes. Unmanaged in-flight requests waste bandwidth, create race conditions, and cause setState on unmounted component errors.

### Cancellation Mechanism
Use AbortController for all fetch requests. Create a cancellable request wrapper that returns both a promise and a cancel function.

### Automatic Cancellation in Hooks
Hooks that initiate requests should cancel them on unmount by creating an AbortController in useEffect and calling abort() in the cleanup function.

### Cancellation vs. Ignoring
AbortController.abort() frees browser resources and prevents the request from completing.
Ignoring stale responses (via a mounted ref pattern) still consumes resources.

### Cancellation Error Handling
Cancelled requests produce CancellationError. These must NOT be logged as warnings, displayed to the user, or counted as failures in monitoring.

### Trade-offs
- AbortController does not cancel server-side processing
- Multiple signals require AbortSignal.any() (available in modern browsers)
- Chain cancellation requires manual wiring

### Industry Best Practice
React Query's queryClient.cancelQueries(), Axios's CancelToken, and Apollo Client's useAbortRef all implement request cancellation.

### Recommendation
Use AbortController for every request. Cancel on unmount in hooks. Never display cancellation errors to the user. Never retry cancelled requests.

---

## 32. Parallel Requests

### Purpose
Define the strategy for executing multiple independent requests concurrently.

### Engineering Rationale
The application often needs data from multiple endpoints to render a single page. Parallel execution minimizes total wait time.

### Parallel Request Strategy
Use Promise.all for required data (fails fast on first error). Use Promise.allSettled for independent sections (waits for all, reports individually).

### Rules
1. Only parallelize requests that are independent (no shared data dependencies)
2. Use AbortController with parent/child signal binding
3. Set separate timeouts for each parallel request
4. Log partial failures when using allSettled

### Trade-offs
- Parallel requests may overwhelm the browser's connection limit (~6 per domain)
- Promise.all fails fast but may waste completed sibling requests
- Promise.allSettled requires partial failure handling in the UI

### Industry Best Practice
React Query's useQueries hook and Relay's fragment colocation both enable parallel data fetching.

### Recommendation
Use Promise.all for critical data (fail fast), Promise.allSettled for independent sections (graceful degradation). Limit parallel requests to 6 concurrent connections per domain.

---

## 33. Sequential Requests

### Purpose
Define the strategy for executing dependent requests one after another.

### Engineering Rationale
Some operations depend on data from prior requests. Sequential requests enforce the dependency chain.

### Strategy
Use sequential requests only when data dependencies exist. Parallelize sibling requests at each level of the dependency tree. Cancel dependent requests when any ancestor fails.

### Progressive Loading
For sequential requests with independent UI sections, show loading states for each level progressively (e.g., show alumni skeleton, then alumni data + events skeleton, then all data).

### Trade-offs
- Sequential requests increase total page load time
- Deep dependency chains are hard to reason about
- Progressive loading requires complex UI state management

### Industry Best Practice
Relay's dependency graph and React Query's dependent queries pattern solve sequential data fetching declaratively.

### Recommendation
Use sequential requests only when data dependencies are explicit. Prefer declarative dependency patterns over imperative promise chains.

---

## 34. Batch Requests

### Purpose
Define the strategy for grouping multiple operations into a single API call.

### Engineering Rationale
Batch requests reduce network overhead for bulk operations and provide atomicity guarantees.

### When to Batch
Bulk create (100 records): Yes
Bulk update (50 records): Yes
Bulk delete (100 records): Yes
Bulk fetch by IDs: Yes
Mixed operations: No (dedicated endpoints)

### Rules
1. Always handle partial success (some succeed, some fail)
2. Report individual errors per operation
3. Limit batch size to a configurable maximum (e.g., 100 items)
4. Operations in a batch should be independent

### Trade-offs
- Batches introduce partial-failure complexity
- Backend must support atomic or transactional batch processing
- Large batches may time out before all operations complete

### Industry Best Practice
Google's Batch API, Stripe's max_items_per_batch parameter, and GraphQL's mutation batching all solve the same problem.

### Recommendation
Use batch requests for bulk operations only. Handle partial success explicitly. Limit batch size to 100 items.

---

## 35. Optimistic Updates

### Purpose
Define when and how the application updates state before the backend confirms the mutation.

### Engineering Rationale
Every millisecond of perceived latency reduces user satisfaction. Optimistic updates make the UI feel instant.

### Decision Matrix
Create (user-owned): Yes
Create (shared): No (may conflict)
Update (user-owned): Yes
Update (shared): No (may conflict)
Delete (user-owned): Yes
Delete (shared): No
Toggle (like, follow): Yes (low stakes, high frequency)
Payment/Financial: No (must be accurate)

### Flow
1. User performs action -> 2. Update cache/state immediately -> 3. Send mutation -> 4a. On success: confirm with server data -> 4b. On failure: rollback to previous state

### Rollback Strategy
Always preserve the previous state for rollback. Always update the UI with the server response after success. Never use optimistic updates for irreversible operations.

### Rules
1. Always preserve the previous state for rollback
2. Always update the UI with the server response after success
3. Never use optimistic updates for irreversible operations
4. Show a non-blocking error notification on rollback
5. Set a timeout for optimistic confirmations (e.g., 10s)

### Trade-offs
- Rollbacks create visual flicker
- Optimistic updates that conflict with server-side validation are hard to undo
- Shared data may have changed between the optimistic update and server confirmation

### Industry Best Practice
React Query's onMutate + onError rollback pattern and Apollo Client's optimistic response API are the standard implementations.

### Recommendation
Use optimistic updates for user-owned data mutations. Always rollback on failure. Always confirm with server data on success.

---

## 36. Pessimistic Updates

### Purpose
Define when to wait for backend confirmation before updating the UI.

### Engineering Rationale
Optimistic updates are not appropriate for every mutation. Pessimistic updates prioritize data integrity over perceived speed.

### Decision Matrix
Financial transaction: Pessimistic
Shared resource creation: Pessimistic
Role/permission changes: Pessimistic
Multi-step workflows: Pessimistic
Rare operations: Pessimistic

### Flow
1. User performs action -> 2. Show loading state -> 3. Send mutation -> 4a. On success: update state with server response -> 4b. On failure: show error, revert UI

### Rules
1. Always show a clear loading indicator
2. Never disable the UI entirely (allow cancellation if possible)
3. Display server-returned data (not client-generated approximation)
4. Show confirmation feedback after success

### Trade-offs
- Slower perceived performance
- Users may navigate away during the loading state
- Longer loading states may feel unresponsive

### Industry Best Practice
Stripe's checkout flow and GitHub's PR merge flow are both pessimistic. They prioritize correctness over speed.

### Recommendation
Default to pessimistic for all mutations unless the mutation passes the optimistic update test (user-owned, reversible, low stakes).

---

## 37. Cache Philosophy

### Purpose
Define the caching principles that govern all cached data in the application.

### Engineering Rationale
Caching is essential for performance, offline support, and reducing server load. Without a coherent caching philosophy, the cache becomes an inconsistent, stale, and unpredictable data store.

### Caching Principles
Freshness Over Staleness: Prefer stale data over no data.
Explicit Invalidation: Every cached entry must have a defined invalidation strategy.
Cache the Response, Not the Promise: Cache resolved data.
Separation from State: Cache is NOT state. Cache can be cleared at any time.
Cache by Resource, Not by URL: Cache key is the resource identifier, not the URL.

### Cache Levels
Memory (In-App): Current session, tab lifetime, API responses
Browser Cache (HTTP): Cross-session, Cache-Control duration, static assets
Service Worker: Cross-session, install lifetime, offline shell
IndexedDB: Cross-session, until cleared, user preferences

### What NOT to Cache
Authentication tokens (prefer in-memory), user credentials, PII, real-time data, non-idempotent mutation responses.

### Trade-offs
- In-memory cache is lost on tab close
- HTTP cache has limited programmatic control
- IndexedDB has a higher API surface area

### Industry Best Practice
HTTP caching (RFC 9111) defines standard caching semantics. React Query and SWR popularized in-memory caching with stale-while-revalidate.

### Recommendation
Implement a two-tier cache: in-memory for the current session and Cache API/IndexedDB for offline support. Clear in-memory cache on mutations.

---

## 38. Cache Invalidation

### Purpose
Design a predictable cache invalidation strategy.

### Engineering Rationale
Cache invalidation is one of the two hard things in computer science. Without a clear invalidation strategy, the cache quickly becomes stale.

### Invalidation Triggers
Mutation success: Related cache keys, immediately after mutation
User logout: All cache
Token refresh: Auth-related cache
Time-based (TTL): Per cache entry
Manual refresh: Per cache entry (pull-to-refresh)
WebSocket event: Related cache keys (on server push)

### Tag-Based Invalidation
Every cache entry is tagged with resource identifiers. When a mutation occurs, all entries with matching tags are invalidated. Tags follow the pattern entity:id or entity:all.

### Invalidation Rules
1. After CREATE: Invalidate list caches for the same resource type
2. After UPDATE: Invalidate the specific resource AND its list caches
3. After DELETE: Invalidate the specific resource AND its list caches
4. On LOGOUT: Clear ALL cache entries
5. On TTL expiry: Lazy expiration (check on read, not proactive)

### Stale-While-Revalidate
Read from cache -> Cache hit and fresh: return cached data
Cache hit but stale: return cached data, trigger background refresh
Cache miss: fetch from network, cache result, return data

### Trade-offs
- Tag-based invalidation requires discipline in assigning tags
- Stale-while-revalidate may show outdated data
- TTL-based eviction may evict data still in use

### Industry Best Practice
React Query's queryClient.invalidateQueries() with query key prefixes is tag-based invalidation.

### Recommendation
Implement tag-based cache invalidation with lazy TTL expiry. Use stale-while-revalidate for read caches. Invalidate on mutations immediately.

---

## 39. Cache Refresh Strategy

### Purpose
Define how cached data is refreshed to maintain freshness.

### Engineering Rationale
Cached data becomes stale over time. A refresh strategy determines when and how to update cached data without disrupting the user experience.

### Refresh Strategies
Stale-While-Revalidate: Show stale, refresh in background. Default for all reads.
Background Polling: Periodically refresh every N seconds. Dashboard, live data.
Pull-to-Refresh: User-initiated refresh. Lists, feeds.
Mutation-Triggered: Refresh after mutation. After create/update/delete.
Visibility-Triggered: Refresh on tab focus. Data that may change externally.
Network-Triggered: Refresh on reconnect. After offline period.

### Stale-While-Revalidate (Default)
Hook requests data -> Cache returns stale data (UI renders) -> Background refresh starts -> New data arrives (cache updates, UI re-renders) -> Refresh fails (UI keeps stale data, no error shown)

### Rules
1. Never show a loading spinner for background refreshes (silent update)
2. Never show an error for background refresh failures (keep stale data)
3. Always show the latest successful data, even if stale
4. User-initiated refresh MUST show an indicator
5. Mutation-triggered refresh MUST show the new data immediately

### Trade-offs
- Background polling increases server load
- Stale-while-revalidate may show visibly outdated data
- Visibility-triggered refresh may cause request bursts on tab focus

### Industry Best Practice
React Query's staleTime and refetchInterval configuration is the definitive implementation.

### Recommendation
Default to stale-while-revalidate for all queries. Add background polling only for time-sensitive data. Always refresh after mutations.

---

## 40. Offline Strategy

### Purpose
Define how the application behaves when the user has no network connectivity.

### Engineering Rationale
Users access the application from unreliable networks. An offline strategy ensures the application remains functional in a degraded state.

### Offline Detection
Use the useOnlineStatus hook or window online/offline events.

### Offline Behavior by Operation
Read (cached data): Return cached data
Read (uncached data): Show offline error with retry
Create: Queue for later sync
Update: Queue for later sync
Delete: Queue for later sync
Search: Search cached data only

### Offline Queue
Each offline mutation contains id, type (create/update/delete), entity, payload, createdAt, and retryCount.

### Sync on Reconnect
1. Process mutations in FIFO order
2. For each mutation, send the request
3a. On success: update cache, remove from queue
3b. On failure: keep in queue, notify user, retry with backoff

### Offline UI Requirements
1. Show an offline indicator when the connection is lost
2. Show which operations are queued for sync
3. Show sync progress when coming back online

### Trade-offs
- Offline queue adds significant complexity
- Conflict resolution requires user-facing UI
- Mutations processed offline may violate server-side validation

### Industry Best Practice
Google Docs' offline mode, Notion's offline support, and PWAs with Service Workers set the standard for offline-first applications.

### Recommendation
Implement offline support in two phases: Phase 1 — read-only offline (cache-based) with offline indicator; Phase 2 — write offline (mutation queue) with sync progress.

---

## 41. Synchronization Strategy

### Purpose
Define how queued offline mutations are synchronized when the user comes back online.

### Engineering Rationale
Offline mutations must be synchronized in the correct order, with proper conflict resolution, and without data loss.

### Sync Lifecycle
Offline -> Detect Connectivity -> Acquire Sync Lock -> Process Queue (FIFO) -> Success: Update Cache, Remove from Queue -> Conflict: Conflict Resolution -> Validation Error: Notify User, Remove from Queue -> Transient Failure: Retry with Backoff -> Queue Empty: Release Sync Lock, Notify User

### Sync Order
Process mutations in FIFO order: deletes first (to free resources), then updates, then creates last.

### Conflict Resolution
Optimistic (server wins): Accept server state, notify user
Pessimistic (client wins): Re-apply mutation with latest server data
User-decided: Show conflict UI, let user choose
Timestamp-based: Latest timestamp wins

### Sync Lock
Prevent multiple sync processes from running concurrently with a lock mechanism.

### Sync UX Requirements
1. Show sync progress (X of Y mutations synced)
2. Show sync completion confirmation
3. Allow the user to cancel pending syncs
4. Never block the user during sync (async background)

### Trade-offs
- Conflict resolution is inherently complex
- FIFO ordering may not match user intent
- Sync progress requires a mutation tracking system

### Industry Best Practice
Firebase Firestore's offline persistence, PouchDB's sync protocol, and Apollo Client's offline mutation queue are the reference implementations.

### Recommendation
Implement sync as a background process with progress reporting. Use server-wins conflict resolution for Phase 1.

---

## 42. Pagination Strategy

### Purpose
Define how paginated data is requested, cached, and navigated.

### Engineering Rationale
Most list endpoints return paginated results. A consistent pagination strategy ensures all features paginate the same way.

### Pagination Types
Offset-based (page + limit): Simple lists, sorted by date
Cursor-based (cursor + limit): Real-time feeds, infinite scroll
Keyset-based (last_seen_id + limit): Large tables, no offset drift

Recommendation: Cursor-based for user-facing lists. Offset-based for admin tables.

### Paginated Response Shape
Every paginated response contains: data (array), pagination with cursor, limit, total (may be null for performance), and hasMore.

### Repository Methods
Every repository that returns lists provides a list method accepting PaginatedRequest with limit, cursor, sort, and filter.

### Pagination Rules
1. Never fetch more data than the limit
2. Always preserve previously fetched pages in the cache
3. Allow per-feature customization of the default limit (20 is standard)
4. Total count may be omitted for performance with cursor-based pagination
5. Append new pages to the cached list (don't replace)

### Trade-offs
- Cursor-based pagination does not support jump to page N
- Offset-based pagination has performance issues on large datasets
- Caching paginated lists requires appending

### Industry Best Practice
GraphQL's Relay connection specification (cursor-based) and REST's page/limit (offset-based) are the two standards.

### Recommendation
Default to cursor-based pagination for user-facing features. Use offset-based for admin tables. Cache paginated results as append-only lists.

---

## 43. Filtering Strategy

### Purpose
Define how list data is filtered before it reaches the repository.

### Engineering Rationale
Filtering reduces the data sent over the network and improves UI responsiveness. A consistent filtering strategy ensures all features implement filters the same way.

### Filter Types
Simple equality (exact match): Server-side
Range (date, number range): Server-side
Text search: Server-side
Multi-select (tags, categories): Server-side
Compound (multiple combined): Server-side

Recommendation: Server-side filtering for all types. Client-side filtering only for datasets under 100 items.

### Filter Request Shape
Filters are sent as query parameters: field, operator (eq, neq, gt, gte, lt, lte, in, nin, contains, startsWith, endsWith), and value. Filters can be combined with AND or OR logic.

### Rules
1. Complex filter logic belongs in the backend, not the frontend
2. Filters are sent as query parameters, not the request body (for GET)
3. Filter state is managed by the feature hook, not the repository
4. Filter changes trigger a new API request
5. Client-side filtering is limited to cached data only

### Trade-offs
- Server-side filtering requires backend support for every filter field
- Round-trip to server for filter changes adds latency
- Compound filters require complex URL encoding

### Industry Best Practice
Stripe's API supports server-side filtering via query parameters. Shopify's Admin API uses GraphQL arguments for filtering.

### Recommendation
Implement server-side filtering for all filterable fields. Send filters as query parameters. Keep filter state in the hook and re-fetch on filter change.

---

## 44. Search Strategy

### Purpose
Define how search queries are executed across the application.

### Engineering Rationale
Search is distinct from filtering. Search involves full-text matching, relevance scoring, and fuzzy matching.

### Search Types
Server-side full-text: Backend search engine (Elasticsearch, PostgreSQL FTS) — Primary
Debounced search: 300ms debounce before API call — Search-as-you-type
Client-side search: Filter cached data — Small datasets under 100
Hybrid search: Server search with client-side post-filter

Recommendation: Server-side full-text with debounced input.

### Search Request Shape
Query string, optional fields to search, limit, cursor, and post-search filters.

### Debounce Strategy
Apply 300ms debounce to search input. Minimum 2-character query before searching. Cancel previous search when query changes.

### Rules
1. Apply a minimum query length (2-3 characters) before searching
2. Debounce search input by at least 300ms
3. Cancel previous search requests when the query changes
4. Show no results state explicitly (empty vs. not-yet-searched)
5. Highlight matching text in search results (client-side)
6. Cache search results by query string

### Trade-offs
- Server-side search requires a search backend
- Debounce delays the search by 300ms
- Minimum query length requires typing before results appear

### Industry Best Practice
Algolia's search API and Elasticsearch's search template define the server-side standard.

### Recommendation
Implement server-side search with 300ms debounce and minimum 2-character query. Cache search results by query. Cancel in-flight searches on query change.

---

## 45. Sorting Strategy

### Purpose
Define how list data is sorted on the server and client.

### Engineering Rationale
Consistent sorting ensures that lists are displayed in a predictable order regardless of how the user navigates through them.

### Sorting Types
Server-side: Sort parameter in API request. For paginated lists.
Client-side: Sort cached data. For small datasets with all data loaded.

Recommendation: Server-side sorting for all paginated lists.

### Sort Request Shape
Sort config contains field name and direction (asc/desc). Supports multi-field sorting as an array of SortConfig.

### Repository Methods
Every repository that returns lists optionally accepts a sort parameter. Sort changes trigger a new API request.

### Rules
1. Default sort order should be documented per-list
2. Multi-field sort order is backend-dependent
3. Sort state is managed by the hook, not the repository
4. Sort changes trigger a new API request
5. The currently active sort is visually indicated in the UI

### Trade-offs
- Server-side sort requires the backend to support each sort field
- Client-side sort requires all data to be cached
- Multi-field sort is complex to implement in the UI

### Industry Best Practice
GraphQL's orderBy argument and REST's ?sort=field:asc,field:desc are the standard approaches.

### Recommendation
Send sort parameters as query parameters. Default to server-side sorting. Keep sort state in the hook and re-fetch on sort change.

---

## 46. File Upload Architecture

### Purpose
Design the architecture for uploading files to the backend.

### Engineering Rationale
File uploads differ significantly from JSON API calls. They require multipart form data, progress tracking, chunking, and different error handling.

### Upload Flow
1. User selects file(s) -> 2. Client validates file (type, size, dimensions) -> 3. Client sends file metadata to backend (optional preflight) -> 4. Backend returns upload URL or signed URL -> 5. Client uploads file directly -> 6. Backend returns file reference -> 7. Client attaches reference to parent entity

### Upload Methods
Direct to backend: Simpler auth, backend load. For MVP.
Signed URL (S3, GCS): Scalable, direct to CDN, extra round-trip. For production.
Chunked upload: Resume capability, complex. For files over 100MB.
Base64 (JSON body): Simple but inefficient. For files under 1MB.

Recommendation: Signed URL upload for production. Direct to backend for MVP.

### File Validation
Validate client-side before uploading: max size, allowed MIME types, min/max dimensions for images.

### Rules
1. Validate file type and size before upload starts
2. Show upload progress to the user
3. Handle upload cancellation via AbortController
4. Handle upload retry for transient failures
5. Show preview of uploaded files
6. Clean up failed uploads

### Trade-offs
- Signed URL flow adds an extra round-trip
- XHR is required for progress tracking (fetch lacks upload.onprogress)
- Chunked uploads add significant complexity

### Industry Best Practice
Cloudinary, Uploadthing, and AWS S3 signed URLs are the industry standards for file upload.

### Recommendation
Implement file upload as a dedicated feature with validation, progress, cancellation, and retry. Use signed URLs for production scale.

---

## 47. File Download Architecture

### Purpose
Design the architecture for downloading files from the backend.

### Engineering Rationale
File downloads require blob responses, progress tracking, streaming, and triggering browser downloads. A dedicated architecture prevents ad-hoc download implementations.

### Download Flow
1. User triggers download -> 2. Client requests file metadata -> 3. Client fetches file blob -> 4. Client creates download link and triggers browser download -> 5. Client cleans up temporary URL

### Download Methods
Direct URL: Simple. For public files.
API proxy: Auth control, backend load. For protected files.
Signed URL: Scalable, extra round-trip. For CDN-hosted files.
Streaming: Memory efficient, complex. For large files.

### Blob Download
Fetch the file as a blob, create an object URL, create an anchor element, trigger click, revoke the object URL after a timeout.

### Download Progress
For files over 50MB, track download progress via the ReadableStream reader's bytes read vs Content-Length header.

### Rules
1. Always trigger downloads via an anchor element click (not window.open)
2. Always clean up object URLs after download starts
3. Show download progress for files larger than 50MB
4. Handle download cancellation via AbortController
5. Handle download errors with retry

### Trade-offs
- Blob downloads require enough memory for the entire file
- Streaming is complex but memory-efficient
- Browser download behavior varies

### Industry Best Practice
Google Drive, Dropbox, and GitHub all use blob URL downloads for protected files.

### Recommendation
Implement file download as a shared utility with progress tracking. Use blob URLs for all downloads. Stream for files over 500MB.

---

## 48. Image Upload Strategy

### Purpose
Define the specific strategy for uploading images (a common special case of file upload).

### Engineering Rationale
Images have unique requirements: preview generation, dimension validation, EXIF data handling, compression, and responsive image variants.

### Image Upload Flow
1. User selects image -> 2. Client validates type, size, dimensions -> 3. Client generates client-side preview -> 4. Client optionally compresses the image -> 5. Client strips EXIF data -> 6. Client uploads the image file -> 7. Backend returns image URL and thumbnail URL -> 8. Client displays the uploaded image

### Image Validation
Validate max file size, allowed MIME types (JPEG, PNG, WebP), max and min dimensions, and optional aspect ratio.

### Client-Side Image Processing
Load the image onto a canvas, resize to maximum dimensions, strip EXIF by re-encoding without EXIF data, compress to JPEG quality 0.8 (WebP preferred).

### Rules
1. Always validate dimensions client-side before uploading
2. Always generate a client-side preview before upload completes
3. Always strip EXIF data (for privacy)
4. Compress images client-side
5. Resize large images to a maximum dimension (e.g., 2048px)
6. Show upload progress with the preview visible

### Trade-offs
- Client-side image processing is CPU-intensive
- Canvas-based compression may lose quality
- EXIF stripping removes orientation data (rotate images before stripping)

### Industry Best Practice
Cloudinary, imgix, and Next.js Image Optimization all handle server-side image processing.

### Recommendation
Implement client-side validation, preview, compression, and EXIF stripping. Use server-side processing for responsive image variants.

---

## 49. Realtime Communication Strategy

### Purpose
Design the architecture for realtime data updates from the backend.

### Engineering Rationale
Certain features (messaging, notifications, live updates) require realtime data push from the server.

### Options
WebSocket: Bidirectional. For chat, collaboration.
Server-Sent Events: Unidirectional. For notifications, updates.
Long Polling: Bidirectional (emulated). Fallback for legacy.
Socket.IO: Bidirectional with cross-browser compatibility.

Recommendation: SSE for unidirectional updates. WebSocket for bidirectional communication.

### SSE Strategy
Use the native EventSource API. Attach event listeners for message and error events. Clean up on unmount.

### WebSocket Strategy
Use the native WebSocket API. Attach listeners for open, message, close, and error events. Implement reconnection with exponential backoff.

### Reconnection Strategy
1st attempt: 1s, 2nd: 2s, 3rd: 4s, 4th+: 8s (capped). Add jitter.

### Realtime Data Flow
Backend Event -> WebSocket/SSE -> Connection Handler -> Cache Invalidation -> UI Refresh

The event handler does NOT update the UI directly. It invalidates the cache, and the cache refresh triggers the UI update.

### Rules
1. Never update UI state directly from a WebSocket message
2. Always invalidate the cache and let the query layer refresh
3. Always handle reconnection with exponential backoff
4. Always clean up event listeners on component unmount
5. Never expose raw WebSocket connections to components

### Trade-offs
- SSE is unidirectional only (server to client)
- WebSocket requires different backend infrastructure
- Persistent connections consume browser resources

### Industry Best Practice
Socket.IO is the most widely adopted WebSocket library. Firebase Realtime DB abstracts connection management entirely.

### Recommendation
Use SSE for unidirectional updates and WebSocket for bidirectional communication. Always wrap connections in a dedicated service.

---

## 50. API Versioning

### Purpose
Define how API versions are communicated between the frontend and backend.

### Engineering Rationale
APIs evolve over time. Versioning ensures the frontend continues to work when the API changes.

### Versioning Strategies
URL prefix (/v1/alumni, /v2/alumni): Simple, visible. Recommended.
Header-based (Accept: application/vnd.api+json; version=2): Clean URLs.
Query parameter (?api_version=2): Quick, simple.
Content negotiation (Accept: application/vnd.alumni.v2+json): RESTful.

Recommendation: URL prefix versioning for simplicity.

### Migration Strategy
1. Backend introduces v2 alongside v1
2. Frontend remains on v1 (no immediate changes)
3. Frontend migration begins (feature by feature)
4. Each feature updates its repository to use v2
5. v1 is deprecated once all features are migrated

### Rules
1. Never support more than 2 active versions simultaneously
2. Always communicate the supported version range in documentation
3. Always test against both current and next version during migration
4. Never change a version's contract without bumping the version number
5. The frontend declares its version preference, not the backend

### Trade-offs
- URL prefix versioning clutters endpoint paths
- Header-based versioning requires server-side header parsing
- Multiple active versions increase backend maintenance

### Industry Best Practice
Stripe uses header-based versioning. GitHub uses URL-based versioning. Both are battle-tested.

### Recommendation
Use URL prefix versioning (/v1/, /v2/). Configure the version in the API client factory.

---

## 51. Contract Evolution

### Purpose
Define how API contracts evolve over time without breaking the frontend.

### Engineering Rationale
APIs change: fields are added, renamed, deprecated, removed. Contract evolution defines how the frontend handles these changes.

### Evolution Rules
Additive Changes (safe): Adding new fields. No version bump required.
Deprecation (warning): Backend still sends deprecated field. Update frontend to use replacement. Backend sends deprecation warning header.
Breaking Changes (version bump): Removing a field, changing a field type, making optional field required. Both versions run in parallel until migration is complete.

### Deprecation Detection
The response interceptor checks for Deprecation and Sunset headers. When detected, log a warning and track as tech debt.

### Contract Testing
Implement contract tests that verify the frontend's assumptions about the API shape. Tests run in CI and alert on failure. A contract test failure blocks deployment.

### Rules
1. Every API integration must have contract tests
2. Contract tests run in CI and alert on failure
3. A contract test failure blocks deployment
4. Fields the frontend doesn't use are not tested
5. Deprecation warnings are tracked as tech debt

### Trade-offs
- Contract tests must be maintained alongside evolving APIs
- False positives (test bug vs. API change)
- Contract tests require a real or mock backend

### Industry Best Practice
Pact (contract testing), Postman Collections, and OpenAPI specs are the standard tools for contract management.

### Recommendation
Write contract tests for every repository. Run them in CI. Fail the build on contract violations.

---

## 52. Security Strategy

### Purpose
Define the security principles and practices for the data layer.

### Engineering Rationale
The data layer is the boundary between the application and external systems. Security vulnerabilities here compromise the entire application.

### Security Principles
Defense in Depth: Multiple security layers provide independent protection.
Least Privilege: The frontend requests only the data it needs.
Secure by Default: All requests are authenticated unless explicitly configured. All responses are validated. All errors are sanitized.
No Secrets in the Client: API keys and secrets must never be in the frontend bundle.

### Security Measures
HTTPS only: Enforce in API client config
Token injection: Auth interceptor
CSRF protection: CSRF token from cookie
Input sanitization: Zod schemas
Output sanitization: Never trust server HTML
Error sanitization: Strip stack traces
Request signing: HMAC signature
Sensitive data masking: Log filter

### Sensitive Data Handling
Passwords: Never logged, never stored in state
Tokens: In-memory only, never in localStorage
PII: Masked in logs, truncated if displayed
API keys: Never in the client bundle
Payment data: Never touches the frontend

### Rules
1. All API requests must use HTTPS
2. All responses must be validated against a Zod schema
3. All errors must be sanitized before reaching the UI
4. No sensitive data is logged
5. No secrets are bundled with the frontend
6. Authentication tokens are stored in-memory only

### Trade-offs
- Request signing adds latency to every request
- Zod schema validation adds runtime overhead
- In-memory tokens require re-authentication after tab close

### Industry Best Practice
OWASP's Top 10 and ASVS define the industry standards for application security.

### Recommendation
Implement the security measures table as a mandatory checklist. Include security review in the governance process.

---

## 53. Logging Strategy

### Purpose
Define what is logged, when, and how in the data layer.

### Engineering Rationale
Structured logging provides observability into API communication. Without it, debugging requires reproducing problems with developer tools open.

### What to Log
Outgoing request: DEBUG level, method, path, masked headers, body size
Incoming response: DEBUG level, status, path, duration, size
Request error: WARN level, type, code, message, status, path
Retry attempt: INFO level, attempt number, delay, error
Network offline: WARN level
Authentication refresh: INFO level, success/failure
Rate limit hit: WARN level, retry-after value
Unexpected error: ERROR level, type, message, correlationId

### What NOT to Log
Authentication tokens, user passwords, API keys, request/response bodies (unless sanitized), stack traces in user-facing messages.

### Logging Interface
The logger exposes debug, info, warn, and error methods. Each accepts a message and optional metadata object.

### Rules
1. Log levels must correspond to actionability: DEBUG (development), INFO (normal ops), WARN (recoverable issues), ERROR (failures needing attention)
2. Never log sensitive data
3. Include correlation IDs in every log entry
4. Log in production at INFO level minimum
5. DEBUG logs are stripped from production bundles

### Trade-offs
- Excessive logging impacts performance
- Insufficient logging makes debugging difficult
- Log sanitization adds processing overhead

### Industry Best Practice
The Twelve-Factor App principles recommend treating logs as event streams. Structured logging (JSON format) is the standard.

### Recommendation
Implement structured logging with correlation IDs. Log at INFO in production, DEBUG in development. Use a log sanitizer for sensitive data.

---

## 54. Monitoring Strategy

### Purpose
Define how the data layer's health and performance are monitored.

### Engineering Rationale
Without monitoring, data layer failures go undetected until users report them.

### Metrics to Track
Request count (per endpoint), request duration (p50, p95, p99), error rate (percentage), error count by type, retry count, cache hit rate, offline time, rate limit hits, timeout count.

### Metric Collection
Use a MetricsCollector interface with increment, histogram, and gauge methods. The collector is injected into the API client, not called directly by repositories.

### Alert Thresholds
Error rate spike: > 5% errors in 5 minutes -> PagerDuty
p99 latency spike: > 5s for 5 minutes -> Investigate
Cache hit rate drop: < 50% for 10 minutes -> Investigate
Auth failure spike: > 10 failures in 5 minutes -> Security review
Rate limit hits: > 100 hits in 1 hour -> Review retry config

### Rules
1. Track every request (not sampled)
2. Tag metrics by endpoint, method, and status
3. Alert on error rate, not absolute count
4. Dashboard latency in p50/p95/p99 (not average)
5. Log every metric event

### Trade-offs
- Detailed metrics increase data volume and cost
- Alert fatigue reduces team responsiveness
- Client-side metrics may be blocked by ad-blockers

### Industry Best Practice
Datadog APM, New Relic Browser, and Sentry Performance are standard tools. OpenTelemetry is the emerging standard.

### Recommendation
Implement lightweight metrics collection in the API client. Export to OpenTelemetry or a commercial APM.

---

## 55. Dependency Rules

### Purpose
Define the import and dependency rules for the data layer.

### Engineering Rationale
Clear dependency rules prevent architectural erosion. Without them, components import API clients directly, repositories contain business logic, and hooks bypass the data layer.

### Allowed Dependency Flow
Feature -> Hook -> Repository -> API Client -> HTTP

### Forbidden Dependency Flow
Feature -> API Client (bypasses repository)
Component -> Repository (bypasses hook)
Repository -> Hook (repositories don't use hooks)
Repository -> Component (repositories don't know about UI)
Hook -> HTTP Client (hooks don't call HTTP directly)
Service -> API Client (services go through repositories)

### Import Rules
Repository MAY import: ApiClient, DTOs, domain types, error types, utilities
Repository MUST NOT import: hooks, components, features, state

API Client MAY import: types, config, logger
API Client MUST NOT import: repositories, domain types, hooks, components

Service MAY import: repository, domain types, utilities
Service MUST NOT import: API client, hooks, components

Hook MAY import: repository, service, domain types, ViewModel utilities
Hook MUST NOT import: API client, DTO, components

Component MAY import: hook, ViewModel types
Component MUST NOT import: repository, API client, DTO, domain types

### ESLint Enforcement
Use ESLint import/no-restricted-paths or @typescript-eslint/no-restricted-imports to enforce boundaries. Each restriction specifies a target pattern, source pattern, and error message explaining the correct import path.

### Trade-offs
- Strict import rules require configuration and enforcement
- Short-term violations may be pragmatic for simple reads
- Enforcement tooling must be maintained

### Industry Best Practice
Google's internal monorepo enforces strict dependency rules. Nx enforces module boundaries with tags. ESLint enforces import restrictions.

### Recommendation
Enforce import restrictions with ESLint. Allow layer-skipping for prototypes only (documented as tech debt).

---

## 56. Shared Repository Strategy

### Purpose
Define how shared (cross-feature) repositories are organized and managed.

### Engineering Rationale
When two or more features need the same data, a shared repository prevents duplication and ensures consistent data access.

### Location
Shared repositories live in src/lib/data/repositories/. Each repository is a single file with a barrel index.

### Promotion Criteria
A feature repository is promoted to shared when:
1. A second feature needs the same data
2. The data model is a core domain entity (Alumni, Event, User)
3. The data is used in the layout or shell (navigation)

### Shared Repository Contract
Shared repositories follow the same Result<T> contract as feature repositories.

### Ownership
Shared repositories are owned by the platform team. Feature teams request changes via PRs. The platform team reviews for contract stability, performance (N+1, over-fetching), error handling, and testing.

### Trade-offs
- Shared repositories require cross-feature coordination
- Changes to a shared repository affect all consumers
- Premature promotion adds unnecessary abstraction

### Industry Best Practice
Shopify's Polaris and GitHub's @github/* packages organize shared data access in a single namespace with clear ownership.

### Recommendation
Start with feature repositories. Promote to shared only when a second consumer emerges.

---

## 57. Feature Repository Strategy

### Purpose
Define how feature-specific repositories are organized and managed.

### Engineering Rationale
Feature repositories encapsulate data access private to a single feature. They prevent the shared data layer from becoming cluttered.

### Location
Feature repositories live in src/features/*/_data/repositories/. Each repository includes its DTOs and mappers alongside.

### Feature Repository Scope
Appropriate when:
1. The data is used by only one feature
2. The data model is feature-specific (e.g., Donation for reports)
3. The data access pattern is unique to the feature

### Rules
1. Feature repositories MUST NOT import from other features
2. Feature repositories MAY import from shared repositories
3. Feature repositories MUST follow the same error normalization rules
4. Feature repositories MUST return Result<T>
5. Feature repositories MUST have DTO-to-domain mappers

### Trade-offs
- Feature repositories can grow large if not decomposed
- Duplication may occur when two features model the same data independently
- Boundaries must be enforced by ESLint

### Industry Best Practice
Feature-Sliced Design (FSD) organizes data access within feature directories. Nx's library boundaries enforce the same principle.

### Recommendation
Place feature repositories in src/features/*/_data/. Enforce no-cross-feature-imports with ESLint.

---

## 58. Testing Strategy

### Purpose
Define how the data layer is tested.

### Engineering Rationale
The data layer is the most critical layer for correctness. A bug can corrupt state across the entire application.

### Test Types
Unit tests: Individual functions (mappers, parsers). Every PR.
Integration tests: Repository with mocked API client. Every PR.
Contract tests: API response shape validation. Every PR.
E2E tests: Full request/response cycle. Main branch.

### What to Test
Mapper (toDomain): DTO to Domain transformation (date string becomes Date)
Mapper (toDTO): Domain to DTO transformation (camelCase to snake_case)
Error normalizer: Various errors to NormalizedError (network, 404, 500)
Repository method: API client called with correct params
Repository method: Result<T> returned correctly (success and error)
Repository method: Error handling (network failure -> RetryError)
Cache layer: Read/write/invalidate
Retry logic: Retry count and backoff

### What NOT to Test
HTTP client library, backend business logic, network connectivity.

### Mocking Strategy
Mock the API client (not fetch) using Vitest mock functions. Create factory functions for DTO fixtures (not raw JSON objects).

### Rules
1. Every mapper must have unit tests
2. Every repository method must have success and error tests
3. Every error normalizer must have tests for each input type
4. Mock the API client, never the network
5. Use factory functions for DTO fixtures
6. Test edge cases: empty, null, malformed

### Trade-offs
- Exhaustive error testing requires many test cases
- Mock-heavy tests may miss integration issues
- Factory functions require maintenance

### Industry Best Practice
Testing Library's philosophy (test behavior, not implementation) applies: test what the repository returns, not how it constructs the URL.

### Recommendation
Write tests for every mapper and every repository method. Use factory functions. Mock the API client, not the network.

---

## 59. Mocking Strategy

### Purpose
Define how data layer dependencies are mocked for testing and development.

### Engineering Rationale
The data layer depends on external services unavailable or unpredictable during testing and development.

### Mock Layers
API Client: Vitest mock functions. For unit tests.
Repository: In-memory implementation. For feature tests.
Backend: MSW (Mock Service Worker). For integration tests, Storybook.
Full API: Playwright route interception. For E2E tests.

### MSW Strategy
MSW is recommended for API mocking. Handlers define mock responses per endpoint. MSW works in both test and development environments.

### In-Memory Repository
For feature tests, implement an in-memory version of the repository that stores data in a Map. This allows tests to manipulate data without network calls.

### Rules
1. Never mock fetch directly — mock the API client or use MSW
2. Use MSW for integration tests and Storybook
3. Use in-memory repositories for feature tests
4. Use Playwright route interception for E2E tests
5. Provide mock data via factory functions

### Trade-offs
- MSW requires setup in both test and development
- In-memory repositories drift from real implementation
- Multiple mock strategies increase test surface

### Industry Best Practice
MSW is the industry standard for API mocking. Storybook's MSW addon enables UI testing with realistic data.

### Recommendation
Adopt MSW as the primary mocking tool. Use in-memory repositories for feature tests. Use factory functions for mock data.

---

## 60. Documentation Strategy

### Purpose
Define how the data layer's contracts, patterns, and usage are documented.

### Engineering Rationale
Undocumented data access patterns lead to inconsistent usage, duplicated effort, and integration errors.

### Documentation Types
API Contract Docs: Repository interfaces with JSDoc. The contract is self-documenting via TypeScript types.
Architecture README: Layer overview, dependency rules, and lifecycle explanation. In src/lib/data/README.md.
Repository README: Purpose, methods, error behavior, and usage examples. Per repository.
Migration Guide: Version migration steps, breaking changes, and deprecation schedule.

### Documentation Rules
1. Every repository interface must have JSDoc describing each method
2. Every DTO must reference its API contract source
3. Architecture decisions must be documented in ADRs
4. Architecture README must be updated when patterns change
5. Deprecated endpoints must be clearly marked in documentation

### Self-Documenting Code
Prefer type safety over comments. Well-typed interfaces and branded types communicate intent without prose. Use JSDoc only for non-obvious behavior (error handling, side effects, performance characteristics).

### Trade-offs
- Documentation requires ongoing maintenance
- Self-documenting code has limits (cannot explain rationale)
- TypeScript types document shape but not behavior

### Industry Best Practice
Stripe's API reference is generated from OpenAPI specs. GitHub's REST API docs are generated from code annotations. Both approaches prioritize contract-first documentation.

### Recommendation
Write JSDoc for every repository method. Maintain an architecture README. Document error behavior explicitly. Keep docs close to the code.

---

## 61. Governance Strategy

### Purpose
Define the processes and reviews that ensure data layer quality over time.

### Engineering Rationale
Without governance, the data layer degrades as new features are added, shortcuts are taken, and patterns diverge.

### Review Gates
Architecture Review: Required for new data sources, new repository patterns, or significant contract changes. Reviews contract design, error handling, caching strategy, and dependency compliance.

Code Review Checklist:
1. Does the repository return Result<T>?
2. Are DTOs mapped to domain models?
3. Are errors normalized?
4. Are cache invalidation rules followed?
5. Are import restrictions respected?
6. Are there contract tests?
7. Are timeouts configured?
8. Is retry logic appropriate?
9. Is authentication handled by the client, not the repository?
10. Are sensitive data logged? (should NOT be)

### Enforcement Mechanisms
ESLint rules: Import restrictions, naming conventions
TypeScript strict mode: No any, strict null checks
Automated tests: Contract tests, unit tests for mappers
CI pipeline: Lint, typecheck, test, contract test gates

### Deprecation Process
1. Mark endpoint as deprecated in DTO with JSDoc @deprecated
2. Add Deprecation header detection in response pipeline
3. Create migration task in project tracking
4. Notify consuming teams of timeline
5. Remove support after all consumers migrate

### Trade-offs
- Governance processes slow down development
- Overly strict gates lead to frustrated developers
- Governance requires dedicated time from platform team

### Industry Best Practice
Google's Engineering Practices documentation and Shopify's Polaris contribution guidelines define clear governance processes for their internal platforms.

### Recommendation
Implement code review checklist as a PR template. Automate enforcement where possible (ESLint, CI). Keep governance lightweight for feature teams.

---

## 62. Performance Considerations

### Purpose
Define the performance principles and practices for the data layer.

### Engineering Rationale
The data layer is on the critical path for every user interaction. Performance issues here affect the entire application.

### Key Metrics
Time to First Byte (TTFB): Target under 200ms for API client overhead
Request Duration (p95): Target under 2s for list endpoints, under 1s for detail
Cache Hit Rate: Target over 80% for read-heavy features
Payload Size: Target under 100KB per response (larger responses should be paginated)
Memory Usage: Target under 50MB for cache storage

### Performance Principles
Minimize Serialization Overhead: Use JSON.stringify/parse only once per request. Avoid deep clone operations.
Batch Where Possible: Combine multiple requests into one batch call when feasible.
Stream Large Responses: Use ReadableStream for files over 10MB.
Lazy Validation: Validate DTOs only once (at the repository boundary). Do not re-validate domain models.
Request Deduplication: When multiple components request the same data simultaneously, share one request.
Prefer Shallow Objects: Deeply nested DTOs increase parsing and mapping overhead.

### Anti-Patterns
Serializing the same object multiple times
Deep cloning cached data before returning
Validating the same DTO in the repository and the hook
Fetching data that is already in the cache
Mapping ViewModels in render functions (use useMemo)

### Trade-offs
- Caching improves read performance but adds memory pressure
- Request deduplication adds complexity for marginal gains with low concurrency
- Lazy validation risks late error discovery

### Industry Best Practice
Web Vitals (LCP, FCP, INP) define the performance metrics that matter. React's Concurrent Features improve perceived performance.

### Recommendation
Profile before optimizing. Monitor p95 latency and cache hit rate. Optimize the critical path first (dashboard, search, profile).

---

## 63. Scalability

### Purpose
Define how the data layer scales with application growth.

### Engineering Rationale
As the application grows (more features, more users, more data sources), the data layer must handle increased complexity without degrading performance or developer productivity.

### Scaling Dimensions
Feature Count: More features mean more repositories. Feature repositories prevent the shared data layer from becoming a bottleneck.
Data Volume: More data means pagination and filtering are essential. Server-side operations prevent client overload.
API Endpoints: More endpoints require organized client structure. Multiple API clients for different backend services.
Team Size: More developers require stricter governance. ESLint boundaries and code review checklists prevent architectural erosion.
Data Sources: More data sources require stronger abstraction. Repository pattern hides source details.

### Scaling Principles
Stateless Clients: API clients carry no state between requests. Any instance can handle any request.
Vertical Slicing: Features own their data access. No centralized data layer bottleneck.
Horizontal Repository Decomposition: Split large repositories by entity or operation type. Avoid monolithic repository classes.
Lazy Initialization: API clients, cache stores, and auth providers initialize on first use, not at application startup.
Graceful Degradation: When a backend service is unavailable, the affected feature degrades independently. Other features continue to work.

### Scaling Anti-Patterns
Centralized data access class that imports every repository
Singleton cache that stores all data without size limits
Repository that grows beyond 500 lines without decomposition
One API client for every backend service (creates dependency coupling)

### Trade-offs
- Stateless clients require external state management
- Vertical slicing may lead to duplicated DTO definitions
- Lazy initialization delays first request slightly

### Industry Best Practice
Amazon's two-pizza team model and Spotify's squad model both organize around feature ownership, including data access. Each squad owns its data layer slice.

### Recommendation
Design for feature-level autonomy. Each feature's data access should be independently deployable, testable, and scalable. Avoid shared bottlenecks.

---

## 64. Maintainability

### Purpose
Define practices that ensure the data layer remains maintainable over time.

### Engineering Rationale
A data layer that is hard to maintain leads to bugs, slow feature development, and developer frustration.

### Maintainability Practices
Small Files: Each repository file should focus on one entity or operation. Maximum 300 lines per file.
Clear Naming: Repository methods describe what they do (getById, search, listUpcoming). No ambiguous names.
Consistent Structure: Every repository follows the same pattern: constructor with injected client, methods returning Result<T>, private mappers.
Minimal Public API: Each repository exposes only the methods its consumers need. Internal methods are private.
Test Coverage: Every public method has unit tests. Mapper functions have edge case tests.
Documented Assumptions: Backend behavior assumptions are documented (e.g., backend sorts by createdAt descending).

### Maintainability Metrics
File size: Under 300 lines per file
Method complexity: Under 10 lines per method (excluding boilerplate)
Test coverage: Over 90% for mappers, over 80% for repositories
Duplication: Under 5% duplicated code across repositories

### Refactoring Triggers
Repository exceeds 300 lines -> Extract methods or split repository
Same DTO pattern appears in 3+ repositories -> Extract shared DTO
Same mapping logic appears in 2+ repositories -> Extract shared mapper
Repository catches generic Error -> Add specific error handling
Repository imports from another feature -> Promote to shared or refactor

### Trade-offs
- Strict file size limits may lead to premature decomposition
- Test coverage targets may slow initial development
- Refactoring triggers may be too aggressive for simple repositories

### Industry Best Practice
Martin Fowler's Refactoring principles apply to the data layer. Small, focused files with clear names and minimal public APIs are easier to maintain than large, monolithic classes.

### Recommendation
Enforce maintainability metrics in code review. Set up automated complexity checks. Schedule regular refactoring sprints for the data layer.

---

## 65. Enterprise Best Practices

### Purpose
Define the enterprise-grade best practices that the data layer must follow.

### Engineering Rationale
Enterprise applications require higher standards of reliability, security, observability, and maintainability than prototypes or internal tools.

### Best Practices Summary

Contract-First: Design API contracts before writing implementation code. Use TypeScript interfaces and Zod schemas as the contract definition.

Layered Separation: Every layer has clear responsibilities. No layer bypasses another. Enforce with ESLint.

Result Pattern: All data access returns Result<T>. No thrown exceptions from the data layer. Predictable error handling.

Dependency Injection: API clients and services are injected into repositories. Enables testing, swapping implementations, and independent evolution.

Comprehensive Testing: Mappers, repositories, and error handlers have unit tests. Contract tests verify API shape. In-memory repositories enable feature testing.

Observability: Every request is logged, monitored, and traced. Metrics track latency, error rates, and cache hit rates.

Security by Default: HTTPS, token management, input validation, output sanitization, and error sanitization are mandatory. No opt-in.

Graceful Degradation: Every feature handles unavailable backends, partial data, and network failures without crashing.

Semantic Versioning: API versions follow semver. Breaking changes require a major version bump. Deprecation is announced with Sunset headers.

Documentation: Repository interfaces are self-documenting via TypeScript types. Architecture decisions are recorded in ADRs.

### Enterprise Patterns to Follow
BFF (Backend for Frontend) Pattern: Dedicated BFF layer aggregates and transforms data for the frontend.
Repository Pattern: All data access through repositories. No direct HTTP calls.
DTO Pattern: Strict separation between wire formats and domain models.
Cache-Aside Pattern: Cache is checked first, populated on miss, invalidated on mutation.
Circuit Breaker Pattern: For external service calls, fail fast when the service is unhealthy.

### Enterprise Patterns to Avoid
Service Locator: Implicit dependency resolution. Prefer explicit dependency injection.
Anemic Domain Model: Domain objects with no behavior. Prefer rich domain models with invariant enforcement.
Big Ball of Mud: No clear separation between layers. Prefer strict layering.
Golden Hammer: Using the same pattern for every problem. Prefer context-appropriate solutions.

### Trade-offs
- Enterprise patterns increase initial implementation effort
- Strict processes slow development velocity
- Documentation overhead may be disproportionate for simple features

### Industry Best Practice
These practices are derived from patterns used at Google, Microsoft, Amazon, Netflix, Stripe, and GitHub. They represent the consensus of enterprise frontend architecture.

### Recommendation
Adopt all listed best practices as mandatory. Exceptions require architecture review board approval. Reject PRs that violate these practices.

---

## 66. Engineering Review

### Purpose
Provide a comprehensive architecture review of the Data & API Layer specification.

### Engineering Rationale
A systematic review validates that the specification is complete, consistent, and aligned with enterprise architecture principles before implementation begins.

### Architecture Analysis

Strengths:
1. Clear separation of concerns between transport, repository, and mapping layers
2. Repository pattern provides stable interfaces that survive backend changes
3. DTO-to-Domain mapping isolates feature code from wire format changes
4. Pipeline architecture enables cross-cutting concerns (auth, logging, retry) without code duplication
5. Error taxonomy provides predictable, typed error handling across all features
6. Cache philosophy with tag-based invalidation and stale-while-revalidate balances freshness and performance

Weaknesses:
1. 12-type error taxonomy requires discipline to maintain consistently
2. Multiple mapping stages (DTO -> Domain -> ViewModel) increase file count
3. Offline support with mutation queue adds significant complexity
4. Dependency injection infrastructure must be built before repositories can be implemented

### Repository Analysis
The repository pattern is well-suited for this application. The key decision is the Result<T> return type, which forces callers to handle errors explicitly. Feature-first repository organization prevents the shared data layer from becoming a bottleneck. Promotion criteria (shared when 2+ consumers exist) prevents premature abstraction.

### API Analysis
Native fetch wrapped in an ApiClient is the right choice for zero-bundle-cost HTTP. The interceptor pipeline provides the same capabilities as Axios or ky without the dependency cost. BFF-first architecture ensures the frontend never calls microservices directly.

### Security Review
Token management (in-memory access tokens, httpOnly refresh cookies) follows industry best practices. Error sanitization prevents sensitive data leaks. Request validation with Zod prevents malformed data from propagating. No secrets in the client bundle.

### Dependency Analysis
The dependency rules are clear and enforceable with ESLint. The strict layering (Feature -> Hook -> Repository -> API Client -> HTTP) prevents architectural erosion. Feature-level autonomy ensures teams can work independently.

### Performance Analysis
Cache-first with stale-while-revalidate provides optimal perceived performance. Request deduplication prevents redundant network calls. Pagination, filtering, and search are server-side, minimizing data transfer. Retry with exponential backoff and jitter balances reliability and server load.

### Maintainability Analysis
Small, focused files (under 300 lines), minimal public APIs, and consistent structure across all repositories ensure maintainability. Compose-based repository methods (getById, list, search) provide clear patterns that are easy to follow.

### Scalability Analysis
Feature-level autonomy (each feature owns its data access) scales with team size. Stateless API clients scale horizontally. Repository pattern abstracts data source details, allowing backend services to evolve independently. Vertical slicing prevents centralized bottlenecks.

### Testing Considerations
The mocking strategy (mock API client, not network) provides reliable, fast unit tests. MSW enables realistic integration tests without a running backend. In-memory repositories enable feature tests with data manipulation. Factory functions for DTO fixtures keep tests maintainable.

### Future Expansion Recommendations
1. Consider GraphQL for features with complex data requirements (dashboard, reports)
2. Evaluate Service Worker caching for PWA offline support
3. Consider WebSocket for realtime features
4. Evaluate CRDT-based sync for advanced offline support
5. Consider OpenTelemetry for distributed tracing

### Review Conclusion
The Data & API Architecture Layer specification is architecturally sound, enterprise-grade, and aligned with industry best practices. It provides clear separation of concerns, stable interfaces, and comprehensive error handling while remaining maintainable and scalable.

---

## 67. Self-Validation

### Purpose
Verify that the specification meets all design criteria before finalization.

### Engineering Rationale
Self-validation ensures completeness and consistency, preventing gaps or contradictions in the specification.

### Validation Checklist

✓ Data architecture is complete (Sections 1-4, 10-11, 14-19, 37-45)
- Data Philosophy, Source Architecture, Response/Request Lifecycle, DTO Strategy, Mapping, Transformation, Cache, Pagination, Filtering, Search, Sorting

✓ API architecture is complete (Sections 2, 5-9, 12-13, 20-21, 46-51)
- API Philosophy, Repository Pattern, API Client, HTTP Strategy, Request/Response Pipeline, File Upload/Download, Realtime, Versioning, Contract Evolution

✓ Repository responsibilities are clearly defined (Sections 5-7, 56-57)
- Repository Definition, Responsibilities, Ownership, Shared Repository, Feature Repository

✓ Request lifecycle is complete (Section 10)
- User Action -> Feature -> Hook -> Service -> Repository -> API Client -> HTTP -> Backend

✓ Response lifecycle is complete (Section 11)
- Backend -> HTTP Response -> Parser -> DTO -> Mapper -> Domain Model -> ViewModel Mapper -> ViewModel -> State -> Hook -> UI

✓ DTO mapping strategy is defined (Sections 14-18)
- DTO Definition, Domain Mapping, ViewModel Mapping, Serialization, Deserialization

✓ Dependency rules prevent architectural violations (Section 55)
- Clear allowed and forbidden import paths, ESLint enforcement

✓ Security considerations are addressed (Sections 22-25, 52)
- Authentication, Authorization, Token Management, Headers, Security Strategy

✓ Performance considerations are included (Section 62)
- Metrics, Principles, Anti-Patterns, Trade-offs

✓ Scalability is supported (Section 63)
- Stateless Clients, Vertical Slicing, Lazy Initialization, Feature Autonomy

✓ Maintainability is ensured (Section 64)
- Small Files, Clear Naming, Consistent Structure, Minimal Public API, Refactoring Triggers

✓ Recommendations are technically justified (Every Section)
- Each section includes Engineering Rationale, Trade-offs, Industry Best Practice, and Recommendation

### Additional Validation

✓ All 67 sections are present and documented
✓ No implementation code is generated (specification only)
✓ Previous layer boundaries are respected
✓ Multiple backend services are supported via repository abstraction
✓ Future API evolution is handled via versioning and contract evolution
✓ Testing and mocking strategies are defined
✓ Offline capabilities are addressed
✓ Specification remains implementation-independent
✓ Engineering Review is comprehensive
✓ Self-Validation confirms completeness

### Validation Conclusion
All validation criteria are satisfied. The specification is complete and ready for implementation.
