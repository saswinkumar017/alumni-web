# Stage 5 — Feature Layer Specification

**Status:** Implemented  
**Dependencies:** Stage 4 (Page Layer)  
**Next:** Stage 6 (Section Layer)

---

## 1. Feature Philosophy

### Purpose

Define the fundamental nature of a Feature and how it differs from other architectural constructs.

### Engineering Rationale

Without a clear philosophy, features devolve into arbitrary folder groupings. A Feature is not a page, a component, or a UI screen — it is a **bounded business capability**. Treating it as such enforces encapsulation, prevents cross-feature coupling, and enables independent development.

### Recommended Option

**Feature as Bounded Business Capability.** Every feature corresponds to exactly one domain concern from the business model:

- Authentication (verifying identity)
- Profile (managing user representation)
- Directory (discovering people)
- Events (managing gatherings)
- Jobs (managing opportunities)
- Networking (facilitating connections)
- Messages (enabling communication)
- Notifications (delivering alerts)
- Gallery (curating media)
- Content (managing pages)
- Reports (generating insight)
- Settings (configuring preferences)
- Announcements (broadcasting information)

Each of these could be built, tested, and deployed independently without knowledge of the others. If two putative features cannot be developed independently, they are one feature.

### Trade-offs

- _Fine-grained features_ (one per domain concept) maximise isolation but increase coordination overhead for cross-cutting workflows.
- _Coarse-grained features_ (e.g., "Alumni" as a single feature) simplify cross-cutting workflows but create monoliths that resist independent development.

### Industry Best Practice

Domain-Driven Design's Bounded Context and Feature-Oriented Architecture both advocate one feature per business capability. Amazon's two-pizza team model and micro-frontend architectures follow the same principle.

### Recommendation

Model features on business capabilities, not UI surfaces. A feature must be describable in one sentence using the pattern: "The feature is responsible for [business capability]." If the sentence needs "and," split the feature.

---

## 2. Feature Architecture

### Purpose

Define the internal structure of a Feature module and how it relates to the rest of the application.

### Engineering Rationale

Every feature needs a consistent internal structure so developers can navigate any feature without learning a custom layout. The architecture must separate public interface from internal implementation.

### Recommended Option

**Public Interface + Private Implementation.** Each feature module exposes only a barrel file (`index.ts`) that defines the public API. Everything else is private.

```
@/features/<name>/
  index.ts              — Public API barrel (exports only what external consumers need)
  feature.tsx           — Primary feature component (the orchestrator)
  _sections/            — Section components (private, composed by the feature)
  _components/          — Sub-components (private)
  _hooks/               — Feature-specific hooks
  _services/            — Business logic, data transformation, API calls
  _types/               — Feature-specific types
  _constants/           — Feature-specific constants
  _utils/               — Feature-specific utilities
  _errors/              — Feature-specific error types and handlers
  _validation/          — Validation schemas
  _state/               — Feature-specific state (Zustand store slices)
```

Underscore-prefixed directories signal privacy. No external module imports from them.

### Trade-offs

- _Deep directory structure_ is verbose for simple features (e.g., a two-line `redirect` feature). Simple features may omit unused directories.
- _Flat internal structure_ is simpler but loses the separation of concerns as the feature grows.

### Industry Best Practice

Barrel-file public APIs and underscore-private directories are standard in feature-oriented TypeScript codebases. This mirrors Node.js package design and clean architecture.

### Recommendation

Every feature follows the canonical structure above. Features with trivial implementation (redirect-only) may omit unused directories. Enforcement happens in code review.

---

## 3. Feature Responsibilities

### Purpose

Define exactly what a Feature module owns and what it delegates.

### Engineering Rationale

Responsibility boundaries prevent logic leakage. If a feature owns everything for its domain, there is no ambiguity about where a change should be made.

### Recommended Option

**The Feature owns ten responsibilities:**

1. **Business rules** — Domain-specific rules (e.g., "a profile must have at least one batch"). Rules live in `_services/`.
2. **Business workflow** — Multi-step processes (e.g., "register → verify → create profile"). Workflows live in `_services/`.
3. **Feature components** — The feature's public and private components. Public components live in `feature.tsx`; private ones in `_components/`.
4. **Feature sections** — Section compositions that combine sub-components. Live in `_sections/`.
5. **Feature hooks** — `use*` functions that encapsulate feature-specific client logic. Live in `_hooks/`.
6. **Feature types** — Interfaces, enums, and type aliases specific to the domain. Live in `_types/`.
7. **Feature constants** — Domain-specific constants (labels, limits, config keys). Live in `_constants/`.
8. **Feature validation** — Schemas for domain entities. Live in `_validation/`.
9. **Feature errors** — Custom error classes and error handling strategies. Live in `_errors/`.
10. **Feature state** — State management for the feature's domain (Zustand slices). Live in `_state/`.

### Trade-offs

- _Ten responsibilities_ is comprehensive but can feel heavy for simple features. The rule: own them all, implement only what is needed.
- _Partial implementation_ is acceptable — an empty directory signals "not yet needed" rather than "leaked elsewhere."

### Industry Best Practice

Clean architecture's use-case separation and DDD's aggregate design both assign clear responsibility boundaries. Feature-oriented architecture formalises this at the module level.

### Recommendation

Apply the ten-responsibility model to every feature. Empty directories are acceptable and informative. Leaked responsibilities are a code-review block.

---

## 4. Feature Characteristics

### Purpose

Define the essential qualities every Feature must exhibit.

### Engineering Rationale

Characteristics serve as architectural acceptance criteria. A feature that does not meet these qualities is not well-architected.

### Recommended Option

**Six essential characteristics:**

| Characteristic      | Definition                                     | Test                                                                          |
| ------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| **Independence**    | Can evolve without changing other features     | Can you add a field to this feature without touching another feature's files? |
| **Composability**   | Provides a clean component interface for pages | Does the feature expose a single `<FeatureName>` component with clear props?  |
| **Encapsulation**   | Hides all internal implementation              | Can an external module access any internal file? (No → good)                  |
| **Testability**     | Can be tested in isolation                     | Can you write a unit test that imports only this feature's barrel?            |
| **Discoverability** | Public API is immediately obvious              | Is everything a page needs visible in `index.ts`?                             |
| **Replaceability**  | Can be rewritten without changing consumers    | Can you replace the feature's internals without changing `index.ts`?          |

### Trade-offs

- _Strict characteristics_ increase development discipline but prevent architectural debt.
- _Relaxed characteristics_ accelerate initial delivery but create coupling that slows future development.

### Industry Best Practice

SOLID principles — particularly Single Responsibility and Open-Closed — map directly to these characteristics. The Open-Closed principle (open for extension, closed for modification) is the most relevant.

### Recommendation

Apply the six-characteristic checklist to every feature. Violations require written justification and a planned remediation.

---

## 5. Feature Classification

### Purpose

Categorise features by their access level, rendering mode, and data criticality.

### Engineering Rationale

Different features have different security, performance, and architectural requirements. Classification makes these explicit and prevents one-size-fits-all design mistakes.

### Recommended Option

**Three-axis classification:**

| Axis                 | Categories                        | Examples                                                                            |
| -------------------- | --------------------------------- | ----------------------------------------------------------------------------------- |
| **Access**           | Public, Authenticated, Admin      | Directory (Public), Profile (Authenticated), Reports (Admin)                        |
| **Rendering**        | Server, Client, Hybrid            | Events (Server), Messages (Client), Directory (Hybrid — list server, detail client) |
| **Data criticality** | Read-only, Read-write, Write-only | Directory (Read-only), Profile (Read-write), Notifications (Write-only for system)  |

Classification is documented as a comment in the feature's `index.ts`:

```ts
// Feature: Events
// Access: Public + Authenticated
// Rendering: Hybrid (list → server, detail → server + client interactivity)
// Data: Read-write
```

### Trade-offs

- _Three-axis classification_ adds documentation overhead but clarifies design decisions for every feature.
- _Implicit classification_ (relying on reading the code) is faster but causes miscommunication across teams.

### Industry Best Practice

Enterprise architecture frameworks (TOGAF, Zachman) use multi-axis classification for capability mapping. The same principle applies at the code-module level.

### Recommendation

Document every feature's classification in its `index.ts` header comment. Use classification during architectural reviews to verify that design decisions match the classification.

---

## 6. Feature Granularity

### Purpose

Determine the right size for a Feature — how to split and when to merge.

### Engineering Rationale

Granularity is the most common architectural mistake. Features that are too large become untestable monoliths. Features that are too small cause import sprawl and coordination overhead.

### Recommended Option

**The Three-Question Test.** A feature has the right granularity if all three answers are "yes":

1. **Single-responsibility test:** Can the feature be described in one sentence without "and"?
2. **Independent-work test:** Could two developers work on this feature and another feature simultaneously without merging conflicts?
3. **Replacement test:** Could you rewrite this feature's internals without changing any other feature?

If the answer to any is "no," split the feature. If splitting creates features incapable of passing the replacement test on their own, merge them.

### Trade-offs

- _Finer granularity_ increases module count and import complexity but improves isolation.
- _Coarser granularity_ reduces module count but creates internal coupling that resists change.

### Industry Best Practice

DDD recommends bounded contexts sized for a single team. Feature-oriented architecture applies the same logic at the code-module level: a feature should be small enough for one developer to hold in working memory.

### Recommendation

Apply the Three-Question Test during feature creation and every major refactor. A feature that needs internal sub-features (a `_features/` directory) is too large and should be split.

---

## 7. Feature Boundaries

### Purpose

Define where each Feature begins and ends — what it includes and what it excludes.

### Engineering Rationale

Boundaries prevent the most common architectural anti-pattern: feature A reaching into feature B's internals. Clear boundaries make the dependency graph explicit and analyzable.

### Recommended Option

**Rigid boundaries enforced by directory convention.**

- Each feature lives in `@/features/<name>/`.
- The only entry point is `@/features/<name>/index.ts`.
- `index.ts` exports only what external consumers may import:
  - Primary feature component(s) (typically one)
  - Feature-level types that external code needs
  - Feature-level constants that external code legitimately needs (rare)
- Everything under `_` prefixed directories is private.
- No module outside the feature imports from `_` prefixed paths.

### Trade-offs

- _Rigid directory-level boundaries_ are enforceable in code review but not by the bundler (TypeScript has no true package boundaries).
- _Runtime package boundaries_ (e.g., publishing features as separate packages) provide true enforcement but at prohibitive complexity for a single application.

### Industry Best Practice

Feature-oriented architecture in React/TypeScript projects uses directory conventions and code review to enforce boundaries. Tools like `@feature-sliced` and ESLint `import/no-restricted-paths` provide automated enforcement.

### Recommendation

Establish the boundary convention in code review. Configure ESLint's `import/no-restricted-paths` to prevent cross-feature internal imports. This catches violations at CI time.

---

## 8. Feature Isolation

### Purpose

Ensure that a Feature can be developed, tested, and reasoned about without knowledge of other Features.

### Engineering Rationale

Isolation is the precondition for independent development. If a developer must understand three other features to work on one, the architecture has failed.

### Recommended Option

**Strict isolation with three rules:**

1. **No direct imports from other features' internal directories.** A feature may only import from another feature's `index.ts`.
2. **No shared mutable state across features.** Features own their state. Cross-feature state synchronization happens through the page (which composes features and passes data as props).
3. **No business logic in shared code.** Shared code (`@/lib/`, `@/components/`) provides infrastructure, not domain knowledge. If logic belongs to a domain, it lives in the feature that owns it.

### Trade-offs

- _Strict isolation_ sometimes requires duplicating small utilities across features. This is acceptable — the duplication cost is lower than the coupling cost.
- _Loose isolation_ allows convenient cross-feature reuse but creates invisible dependencies that break during refactoring.

### Industry Best Practice

Microservices and micro-frontends enforce isolation at the network boundary. Feature-oriented architecture enforces it at the module boundary. The principle is the same: communicate through well-defined interfaces.

### Recommendation

Enforce the three isolation rules as architectural invariants. Use ESLint rules and CI checks. Violations are architectural debt that must be tracked and remediated.

---

## 9. Public API Strategy

### Purpose

Define what each Feature exposes to the rest of the application and how that API is structured.

### Engineering Rationale

The public API is the feature's contract with the outside world. A well-designed API makes the feature easy to use and hard to misuse. A poorly designed API leaks internals and couples consumers to implementation details.

### Recommended Option

**Minimal barrel export.** Each feature's `index.ts` exports:

1. **Primary feature component** — The default export. This is the component pages import and compose.

   ```ts
   // @/features/profile/index.ts
   export { ProfileCard } from "./feature";
   export type { ProfileCardProps } from "./feature";
   ```

2. **Supporting components** (optional, rare) — Named exports for components that pages compose alongside the primary component.

   ```ts
   export { ProfileCard, ProfileEditor } from "./feature";
   ```

3. **Feature-level types** — Types that pages or other features need to interact with the feature.

   ```ts
   export type { ProfileData } from "./_types";
   ```

4. **Feature-level constants** (rare) — Constants that are genuinely needed outside the feature.

The barrel never exports:

- Internal hooks (`_hooks/*`)
- Internal services (`_services/*`)
- Internal utilities (`_utils/*`)
- Internal types used only within the feature
- Internal components (`_components/*`)

### Trade-offs

- _Minimal API_ simplifies consumption but may require API expansion as feature needs evolve.
- _Generous API_ provides flexibility up front but increases the surface area that must remain stable.

### Industry Best Practice

The Interface Segregation Principle (ISP) states that clients should not depend on things they do not use. The barrel export pattern implements ISP at the module level.

### Recommendation

Start with the minimal API (default export only). Expand only when a concrete need arises. Every barrel export beyond the default requires architectural review.

---

## 10. Internal Architecture

### Purpose

Define how the internal directories of a Feature are structured and how they relate to each other.

### Engineering Rationale

The internal architecture transforms the feature's responsibilities into a concrete dependency graph. Each internal directory has a defined role and imports only from specific sources.

### Recommended Option

**Internal dependency flow:**

```
feature.tsx (orchestrator)
    ↓
_sections/ (compose sub-components into meaningful groups)
    ↓
_components/ (pure UI, receive data via props)
    ↓
_hooks/   _services/   _validation/   _constants/   _types/
    ↓
_utils/ (shared by all internal modules)
```

- `feature.tsx` is the orchestrator. It imports sections and wires them together with data from services/hooks.
- `_sections/` compose components into page-like regions within the feature.
- `_components/` are pure UI components receiving data via props.
- `_hooks/` encapsulate client-side logic (state, effects, event handlers).
- `_services/` encapsulate business logic, data transformation, and API calls.
- `_types/` define domain interfaces and types.
- `_constants/` define domain-specific constants.
- `_validation/` define validation schemas for domain entities.
- `_errors/` define custom error types.
- `_state/` define Zustand store slices.
- `_utils/` contain pure helper functions used across internal modules.

No internal module should import from an ancestor's sibling. For example, `_components/Button` must not import from `_sections/ProfileSection`.

### Trade-offs

- _Strict internal layering_ makes the dependency graph predictable but adds indirection for simple features.
- _Flat internal structure_ is simpler but allows circular dependencies and untestable modules.

### Industry Best Practice

Clean Architecture's dependency rule (dependencies point inward) and DDD's layered architecture inform this structure. The key insight: feature components depend on services, never the reverse.

### Recommendation

Enforce the internal dependency flow during code review. A feature with fewer than three components may collapse `_sections/` and `_components/` into a single `_components/` directory.

---

## 11. Feature Composition

### Purpose

Define how Features compose Sections and how Pages compose Features.

### Engineering Rationale

Composition is the mechanism by which the architecture scales. A feature composes sections; a page composes features. Each layer is replaceable because it depends only on the layer below's public API.

### Recommended Option

**Two-tier composition:**

| Composition       | From                | Into          | Mechanism                                                           |
| ----------------- | ------------------- | ------------- | ------------------------------------------------------------------- |
| Feature → Section | `_sections/`        | `feature.tsx` | Import and compose section components with data from services/hooks |
| Page → Feature    | `@/features/<name>` | `page.tsx`    | Import from the feature's `index.ts` barrel, pass data as props     |

A feature's `feature.tsx` follows this pattern:

```
1. Import sections from _sections/
2. Import services/hooks from _services/ and _hooks/
3. Compose sections in the render tree, passing processed data
4. Wrap async sections in Suspense boundaries (if using Server Components)
5. Handle loading, error, and empty states internally
```

### Trade-offs

- _Two-tier composition_ keeps each layer's responsibility clear but requires every feature to implement its own section composition.
- _Flat composition_ (features composing components directly) is simpler but skips a layer that provides meaningful grouping for complex features.

### Industry Best Practice

React's composition model (children, render props, component injection) maps naturally to feature-oriented architecture. The Page → Feature → Section → Component → Primitive hierarchy is a composition chain.

### Recommendation

All features follow the two-tier composition model. Features with trivial display (single component) may skip the `_sections/` layer, documented in a brief comment.

---

## 12. Feature Lifecycle

### Purpose

Define the lifecycle stages of a Feature from the moment a Page invokes it to the moment it is unmounted.

### Engineering Rationale

Understanding the lifecycle helps developers reason about when validation runs, when services are called, when state is initialised, and when cleanup happens.

### Recommended Option

**Six-stage lifecycle for Client Components:**

| Stage                 | What happens                                                             | Who owns it                             |
| --------------------- | ------------------------------------------------------------------------ | --------------------------------------- |
| 1. **Props received** | Page passes validated data and callbacks as props                        | Page                                    |
| 2. **Validation**     | Feature validates inputs (client-side) using schemas from `_validation/` | Feature                                 |
| 3. **Initialisation** | Feature initialises local state and fetches any remaining data           | Feature (`_hooks/`)                     |
| 4. **Render**         | Feature composes sections and renders the component tree                 | Feature (`feature.tsx`)                 |
| 5. **Interaction**    | User interactions trigger hooks → services → state updates               | Feature (`_hooks/` → `_services/`)      |
| 6. **Cleanup**        | Feature cleans up subscriptions, timers, and ephemeral state             | Feature (`_hooks/` → useEffect cleanup) |

For Server Components, the lifecycle is simpler: Props received → Validation → Render. Cleanup does not apply.

### Trade-offs

- _Six-stage lifecycle_ is comprehensive but adds ceremony for simple presentational features.
- _Simplified lifecycle_ (render only) works for static features but misses error handling and interaction patterns.

### Industry Best Practice

React's component lifecycle (mount → render → unmount) and the addition of Server Components create two parallel lifecycles. Feature-oriented architecture must handle both.

### Recommendation

Document the lifecycle stage in each feature's `feature.tsx` as inline comments at stage boundaries. Features using only Server Components document the three-stage lifecycle explicitly.

---

## 13. Feature State Ownership

### Purpose

Define which state belongs to a Feature and how it is managed.

### Engineering Rationale

State ownership is the most common source of coupling between features. Shared state creates implicit dependencies. Feature-local state enables isolation.

### Recommended Option

**Three-tier state ownership:**

| State type                 | Owner         | Mechanism                   | Example                              |
| -------------------------- | ------------- | --------------------------- | ------------------------------------ |
| **Feature-local UI state** | Feature       | `useState` inside `_hooks/` | Dropdown open/closed, selected tab   |
| **Feature domain state**   | Feature       | Zustand slice in `_state/`  | Cached profile data, draft form data |
| **Cross-feature state**    | Page (parent) | Props passed down           | User object, current event           |

Rules:

- A feature never reads another feature's Zustand slice directly.
- Cross-feature state flows through the page as props.
- Feature domain state is initialised by the feature itself, not by the page.
- Feature-local UI state is never exposed outside the feature.

### Trade-offs

- _Feature-owning domain state_ enables isolation but may cause duplicate fetching if two features need the same data. The page should hoist shared data and pass it as props.
- _Global state for everything_ is convenient but creates invisible dependencies and lifecycle management issues.

### Industry Best Practice

The "lifting state up" pattern and "colocation" principle from the React team align with feature-owning its state. Zustand's slice pattern supports modular state ownership.

### Recommendation

Features own their local and domain state. Pages own cross-feature state. Never share Zustand stores across features. Never use React context for cross-feature state.

---

## 14. Feature Data Flow

### Purpose

Define how data enters a Feature, how it flows through internal modules, and how it is rendered.

### Engineering Rationale

A clear data flow makes the feature testable and debuggable. Opaque data flow (e.g., features fetching data directly from stores without the page's knowledge) breaks the orchestration model.

### Recommended Option

**Unidirectional data flow with Page as entry point:**

```
Page (page.tsx)
  │
  │  Props (data + callbacks)
  ▼
Feature (feature.tsx)
  │
  ├── Validate props (_validation/)
  │
  ├── Transform data (_services/)
  │
  ├── Compose sections (_sections/)
  │     │
  │     ├── Pass section-specific props
  │     ▼
  │   Section components
  │     │
  │     ├── Compose sub-components
  │     ▼
  │   Component components
  │
  ├── Handle user interactions (_hooks/ → _services/)
  │
  └── Emit state changes via callbacks to page
```

- Data enters the feature exclusively through props from the page.
- The feature may fetch additional data internally (via hooks/services) but should prefer receiving it from the page.
- User interactions flow upward via callbacks (or through the Zustand slice, which the page may subscribe to if needed).

### Trade-offs

- _Page as data entry point_ makes data dependencies explicit but requires the page to know what data every feature needs.
- _Feature-fetched data_ makes features self-sufficient but creates hidden data dependencies and potential waterfalls.

### Industry Best Practice

React's unidirectional data flow and Next.js's server-centric data fetching model both support page-level data orchestration. Features should fetch only what is truly private to them.

### Recommendation

Prefer page-provided props for data. Feature-level data fetching is reserved for: (a) data that is truly private to the feature, (b) data that loads after the initial page render (deferred/lazy), and (c) user-interaction-driven data (search results, filter changes).

---

## 15. Feature Business Logic

### Purpose

Define where business logic lives within a Feature and how it is structured.

### Engineering Rationale

Business logic is the most valuable and most fragile part of the application. If it is scattered across hooks, components, and utilities, it cannot be tested, audited, or refactored reliably.

### Recommended Option

**Business logic lives in `_services/` as pure functions.**

- `_services/` contains only pure functions.
- Functions take typed inputs and return typed outputs.
- Functions have no side effects (no state mutation, no API calls, no localStorage).
- Functions are unit-testable without React, without Jest mocks, without DOM.
- Functions implement: validation rules, transformation logic, permission checks, calculation logic, formatting logic.
- API calls and side effects live in `_hooks/` or the page layer, not in `_services/`.

```ts
// _services/calculate-profile-completeness.ts
// Pure function — no side effects, testable without React
export function calculateProfileCompleteness(profile: ProfileData): number {
  const fields = [profile.name, profile.batch, profile.department, profile.bio];
  return fields.filter(Boolean).length / fields.length;
}
```

### Trade-offs

- _Pure function services_ are maximally testable but require all dependencies to be passed as parameters.
- _Class-based services_ provide encapsulation of related functions but introduce testability challenges (mocking, instantiation).
- _Service-as-hooks_ is idiomatic React but couples business logic to the React lifecycle.

### Industry Best Practice

Domain-Driven Design places business logic in domain services. Clean Architecture places it in use-case interactors. Feature-oriented architecture places it in feature services. All three agree: business logic must be separated from UI.

### Recommendation

All business logic in a feature lives in `_services/` as pure functions. No business logic in components, hooks, or utilities. This is the most important rule for testability.

---

## 16. Feature Validation

### Purpose

Define how Features validate input data, user input, and internal state.

### Engineering Rationale

Validation is a cross-cutting concern that touches every feature. Inconsistent validation leads to data integrity issues, poor user experience, and security vulnerabilities.

### Recommended Option

**Schema-based validation in `_validation/` using Zod.**

- Every feature that accepts user input defines Zod schemas in `_validation/`.
- Schemas are reused across client-side validation and server-side validation (via the same Zod library or shared types).
- Validation happens at the feature boundary (props validation) and at the service boundary (input validation).
- Invalid inputs produce typed error results, not thrown exceptions.
- Error messages are user-facing, defined in the schema or in `_constants/`.

```ts
// _validation/profile-schema.ts
import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
  batch: z.string().regex(/^\d{4}$/),
});
```

### Trade-offs

- _Zod schemas_ provide runtime validation + TypeScript types in one declaration but add a dependency.
- _TypeScript-only validation_ is simpler but provides no runtime safety (API responses, localStorage data).
- _Custom validation functions_ avoid dependencies but increase boilerplate and inconsistency across features.

### Industry Best Practice

Schema-based validation (Zod, Valibot, Yup) is the standard in TypeScript applications. Zod is preferred for its type inference and composability.

### Recommendation

Every feature that accepts user input or external data uses Zod schemas in `_validation/`. Validation schemas are co-located with the feature, not in shared `@/lib/`.

---

## 17. Feature Services

### Purpose

Define the role of services within a Feature and how they differ from hooks, utilities, and API calls.

### Engineering Rationale

Services are the most misunderstood directory. Without clear definition, every module becomes a "service," losing all architectural meaning.

### Recommended Option

**Services are pure business-logic functions.** They are:

- **Pure** — Same input always produces same output. No side effects.
- **Scoped** — Each service file does one thing.
- **Testable** — Unit tests require no React, no mocks, no DOM.
- **Domain-specific** — Services implement rules that belong to the feature's domain.

Services are NOT:

- API call wrappers (those belong in `_hooks/` or `@/lib/data/`)
- State management (belongs in `_state/` or `_hooks/`)
- UI formatting (should be in the component or a utility)
- Generic utilities (belong in `_utils/`)

Examples of good services:

- `calculate-donation-tier.ts` — determines membership tier based on donation amount
- `filter-events-by-date.ts` — filters and sorts events by date range
- `validate-event-capacity.ts` — checks if an event has available capacity
- `transform-profile-for-display.ts` — transforms API data into display-ready format

### Trade-offs

- _Pure service functions_ are easy to test but require data to be passed in rather than fetched internally.
- _Service classes with injected dependencies_ are more flexible but harder to test and reason about.

### Industry Best Practice

Domain-Driven Design's domain services and Clean Architecture's interactors are the conceptual ancestors. The pure-function approach is the simplest correct implementation.

### Recommendation

All feature services are pure functions, one concern per file. A service file should rarely exceed 30 lines. If a service grows beyond that, split it.

---

## 18. Feature Hooks

### Purpose

Define the role of custom hooks within a Feature and how they differ from services and components.

### Engineering Rationale

Hooks bridge the gap between React's lifecycle and the feature's business logic. Without clear guidelines, hooks accumulate both UI logic and business logic, becoming untestable.

### Recommended Option

**Hooks orchestrate side effects and state, not business logic.**

- Hooks call services (pure functions) for business logic.
- Hooks manage: API calls, debouncing, event subscriptions, localStorage sync, scroll position.
- Hooks return: state, handlers, and computed values (derived via services).
- Hooks never contain business logic directly — they delegate to `_services/`.

```ts
// _hooks/use-profile.ts (illustrative)
// Orchestrates: fetch profile, handle save, manage loading state
// Delegates to: _services/validate-profile.ts for validation
// Delegates to: _services/transform-profile.ts for data transformation
```

### Trade-offs

- _Hooks as orchestrators only_ keeps business logic testable but adds a layer of indirection.
- _Hooks with inline business logic_ is faster initially but creates logic that cannot be unit-tested without React.

### Industry Best Practice

The React community and the hooks documentation recommend extracting logic into helper functions. Feature-oriented architecture formalises this: services for logic, hooks for lifecycle.

### Recommendation

All feature hooks delegate business logic to services. Any hook that contains an `if` statement with domain-specific conditions should instead call a service function.

---

## 19. Feature Types

### Purpose

Define how types are structured within a Feature and what belongs in `_types/` vs `@/types/`.

### Engineering Rationale

Type proliferation is a real problem. Without boundaries, types end up in shared directories, creating coupling between features through a shared type system.

### Recommended Option

**Feature-specific types live in `_types/`. Shared domain types live in `@/types/`.**

| Type location               | What goes there                       | Examples                                                   |
| --------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| `@/features/<name>/_types/` | Types specific to this feature        | `ProfileFormData`, `ProfileCompleteness`, `ProfileSection` |
| `@/types/`                  | Types shared across multiple features | `SessionUser`, `AlumniEvent`, `JobPosting`                 |

Rules:

- If a type is used by only one feature, it lives in that feature's `_types/`.
- If a type is used by two or more features, it lives in `@/types/`.
- If a type is a UI-only construct (e.g., `TabConfig`, `SortOption`), it lives in `_types/` even if used by multiple internal modules.
- Feature `_types/` never exports types that reference another feature's internals.

### Trade-offs

- _Feature-local types_ maximise isolation but cause duplication if two features need the same type (promote to `@/types/`).
- _Shared types only_ reduces duplication but makes every feature depend on `@/types/` changes.

### Industry Best Practice

The "promote when needed" approach aligns with the You Aren't Gonna Need It (YAGNI) principle. Start in the feature; promote to shared when a second consumer exists.

### Recommendation

Default to feature-local types. Promote to `@/types/` only when a second feature needs the same type. Document the promotion in the commit message.

---

## 20. Feature Constants

### Purpose

Define where feature-specific constants live and how they differ from shared configuration.

### Engineering Rationale

Hardcoded strings and magic numbers scattered through feature code are the leading cause of inconsistency and maintenance overhead. Constants centralise these values.

### Recommended Option

**Feature constants in `_constants/`.**

Constants include:

- UI labels and messages (button text, error messages, empty state messages)
- Limits and thresholds (max profile image size, min password length)
- Configuration keys (localStorage keys, event names, query parameter names)
- Enum-like string maps (status labels, category labels, role labels)

Constants do NOT include:

- Environment variables (these come from `@/config/env.ts`)
- Navigation paths (these come from `@/config/navigation.ts`)
- API endpoints (these come from `@/config/env.ts` or services)

```ts
// _constants/profile.ts
export const PROFILE_LIMITS = {
  BIO_MAX_LENGTH: 500,
  AVATAR_MAX_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_SOCIAL_LINKS: 5,
} as const;

export const PROFILE_LABELS = {
  SAVE_BUTTON: "Save Profile",
  CANCEL_BUTTON: "Cancel",
  BIO_PLACEHOLDER: "Tell us about yourself...",
} as const;
```

### Trade-offs

- _Dedicated constants files_ add files but eliminate magic values and make i18n integration straightforward.
- _Inline strings_ are faster to write but create maintenance problems as the application grows.

### Industry Best Practice

Constants-as-config and the "no magic values" rule are standard in enterprise codebases. Feature-level constants follow the same principle at the module level.

### Recommendation

All feature-specific strings, limits, and configuration values live in `_constants/`. Magic values in feature code are a review-blocking violation.

---

## 21. Feature Utilities

### Purpose

Define the role of utility functions within a Feature and distinguish them from services.

### Engineering Rationale

Without clear distinction, utility files become catch-all dumping grounds for miscellaneous functions. Separating utilities from services preserves the testability and clarity of business logic.

### Recommended Option

**Utilities are generic helpers; services are domain-specific logic.**

| Aspect                 | `_utils/`                            | `_services/`                                            |
| ---------------------- | ------------------------------------ | ------------------------------------------------------- |
| Contains               | Generic, reusable helpers            | Domain-specific business logic                          |
| Example                | `formatDate`, `truncateText`, `cn()` | `calculateProfileCompleteness`, `validateEventCapacity` |
| Test value             | Low (typically trivial formatting)   | High (core business rules)                              |
| Shared across features | Yes (promote to `@/lib/`)            | No (stays in feature)                                   |

A utility that is needed by two or more features should be promoted to `@/lib/utils.ts` (Stage 12). The original feature file becomes a re-export until all imports are migrated.

### Trade-offs

- _Strict utility vs. service separation_ requires developer judgment but prevents utility files from accumulating domain logic.
- _Combined utils/services file_ is simpler but defeats the purpose of separating business logic from generic helpers.

### Industry Best Practice

Separation of Concerns applies at every level. Utility functions that format or parse data are fundamentally different from service functions that implement business rules.

### Recommendation

Use `_utils/` for generic helpers only. Anything domain-specific belongs in `_services/`. Promote shared utilities to `@/lib/`.

---

## 22. Feature Error Handling

### Purpose

Define how Features handle errors internally and what they expose to Pages.

### Engineering Rationale

Error handling is often ad-hoc and inconsistent. Features should own their error strategies and expose typed error states to pages.

### Recommended Option

**Typed error states + boundary-based rendering.**

- Each feature defines a union type of possible error states in `_errors/`.
- Services return typed error results (using discriminated unions or a `Result` type) rather than throwing.
- Hooks expose `{ data, isLoading, error }` patterns.
- The feature component renders error states using section-level error UI.
- Critical errors are thrown to trigger the page's `error.tsx`. Non-critical errors are handled inline with retry options.

```ts
// _errors/profile-errors.ts
export type ProfileError =
  | { type: "NOT_FOUND"; message: string }
  | { type: "LOAD_FAILED"; message: string; retry: () => void }
  | { type: "SAVE_FAILED"; message: string; validationErrors?: Record<string, string> };
```

### Trade-offs

- _Typed error unions_ provide exhaustive error handling at the cost of verbosity.
- _Generic error handling_ (catch-all with message display) is simpler but loses the ability to handle specific error types differently.

### Industry Best Practice

Discriminated unions for error states and the Result pattern (Rust, Elm) are proven approaches for typed error handling. Feature-oriented architecture applies them at the module level.

### Recommendation

Every feature that performs data operations defines a typed error union in `_errors/`. Services return typed results. Features handle errors granularly rather than catching broadly.

---

## 23. Feature Loading Strategy

### Purpose

Define how Features communicate loading state during data fetching.

### Engineering Rationale

Loading states must be owned by the feature because only the feature knows what its loading skeleton should look like. Pages provide outer Suspense boundaries; features provide inner loading content.

### Recommended Option

**Skeleton variants co-located in each Feature.**

- Each feature exports a `*Skeleton` component (or a `Skeleton` property on the feature component) in its public API.
- Pages use these skeletons as Suspense fallbacks.
- The skeleton matches the feature's layout (same structure, grey placeholder blocks).
- Features that fetch data internally use `_hooks/` to expose `isLoading` state and render their own skeletons.

```ts
// @/features/profile/index.ts
export { ProfileCard, ProfileCardSkeleton } from "./feature";
```

### Trade-offs

- _Feature-owned skeletons_ provide accurate loading states but require each feature to maintain its skeleton alongside its content.
- _Page-owned skeletons_ (generic spinners) are simpler but do not reflect the feature's layout, causing layout shift when the feature loads.

### Industry Best Practice

Suspense boundaries with skeleton fallbacks are the recommended pattern in Next.js and React 19. Feature-owned skeletons align with the principle that features own their loading experience.

### Recommendation

Every feature exports a skeleton component. Pages use these skeletons as Suspense fallbacks. Features that are always synchronous (no data dependencies) may omit the skeleton.

---

## 24. Feature Empty States

### Purpose

Define how Features render when they have no data to display.

### Engineering Rationale

Empty states are part of the feature's domain — only the feature knows what messaging and call-to-action are appropriate when its data is empty.

### Recommended Option

**Feature-owned empty state components.**

- Each feature defines how it renders when its primary data set is empty.
- Empty state components live in `_components/` or `_sections/`.
- Empty states include: a clear message explaining why the data is empty, an icon or illustration, and a call-to-action (e.g., "Create your first event" with a link).
- Empty states are composed by the feature, not by the page or section.

### Trade-offs

- _Feature-owned empty states_ give each feature full control over its empty experience but may lead to inconsistent styling across features.
- _Shared empty state component_ provides consistency but cannot provide domain-specific messaging and CTAs.

### Industry Best Practice

Empty state design is a recognised UX pattern. Feature ownership of empty states is consistent with the principle that features own their entire user experience.

### Recommendation

Every feature with dynamic data (data from API or user input) implements at least one empty state. Empty states are feature-owned. A shared `@/components/empty-state/` provides the base UI, which features customise for their domain.

---

## 25. Feature Security

### Purpose

Define security responsibilities that belong to the Feature Layer.

### Engineering Rationale

Security is implemented at multiple layers: proxy (Stage 2), page (Stage 4), and feature (Stage 5). The feature layer handles fine-grained permission checks within its domain.

### Recommended Option

**Feature-level permissions via service functions.**

- Each feature defines its own permission checks in `_services/` (e.g., `canEditProfile`, `canDeleteEvent`, `canApproveJob`).
- Permission functions take the current user and the target entity and return a boolean.
- Permission functions are pure — they do not fetch data or call APIs.
- Features call permission functions before rendering action buttons or processing submissions.
- Features that manage multi-role entities (e.g., events with organisers, attendees, admins) define granular permission levels.

```ts
// _services/permissions.ts
export function canEditEvent(user: SessionUser, event: AlumniEvent): boolean {
  return user.role === "admin" || event.organiserId === user.id;
}
```

### Trade-offs

- _Feature-level permission functions_ duplicate some role-checking logic across features but keep permissions close to the domain they govern.
- _Centralised permission service_ avoids duplication but creates a single point of change for all permission logic.

### Industry Best Practice

Domain-Driven Design places authorisation rules within the bounded context. Feature-oriented architecture follows the same principle: the feature knows who can do what within its domain.

### Recommendation

Granular permission functions live in the feature's `_services/`. Coarse role-based checks (admin vs alumni) at the page layer are sufficient for routing, but feature-level permissions are required for entity-specific operations.

---

## 26. Feature Communication

### Purpose

Define how Features communicate with each other without creating tight coupling.

### Engineering Rationale

Features must sometimes coordinate (e.g., creating a profile after registration). Direct feature-to-feature communication creates circular dependencies and tight coupling.

### Recommended Option

**Page-mediated communication only.**

Communication patterns ordered by preference:

| Pattern                          | Mechanism                                              | When to use                                                                      |
| -------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| **Props through Page**           | Page passes data from Feature A to Feature B via props | When Feature B needs data from Feature A at render time                          |
| **Callback from Page**           | Page passes a callback from Feature B to Feature A     | When Feature A triggers an action in Feature B                                   |
| **Shared types from @/types/**   | Both features use the same type definition             | When features reference the same domain entity                                   |
| **URL as communication channel** | One feature writes to searchParams, another reads      | When coordination is about navigation or filter state                            |
| **Event emitter**                | Lightweight pub/sub within the page scope              | When features need to react to each other's events without page re-render (rare) |

**Forbidden:** Feature A directly imports from Feature B's `_services/`, `_hooks/`, `_state/`, or any internal file.

### Trade-offs

- _Page-mediated communication_ is the most explicit and testable but requires the page to understand the communication needs of all features.
- _Direct feature-to-feature communication_ is convenient but creates implicit dependencies that violate the architecture.

### Industry Best Practice

The Mediator pattern (features communicate through a mediator — the page) is a well-established design pattern. It is the architectural equivalent of the principle "talk only to your immediate neighbours."

### Recommendation

All cross-feature communication goes through the page. If the page becomes a mediator with too much coordination logic, it is a signal that a feature is too coarse-grained or that a shared context should be created.

---

## 27. Shared vs Feature Code Rules

### Purpose

Define what belongs in a Feature vs what belongs in shared directories (`@/lib/`, `@/components/`, `@/types/`).

### Engineering Rationale

The tension between "put it in the feature" and "put it in shared" is constant. Rules eliminate decision fatigue and prevent architectural drift.

### Recommended Option

**The Three-Question Test for sharing:**

A piece of code belongs in shared directories (`@/lib/`, `@/components/`, `@/types/`) only if all three answers are "yes":

1. **Multi-consumer test:** Is this code used by two or more features?
2. **Domain-free test:** Does this code contain no feature-specific domain knowledge?
3. **Stable test:** Is this code unlikely to change because of a feature-specific requirement?

If any answer is "no," the code stays in the feature.

Additionally:

| Shared directory | What goes there                               | Does NOT go there                                     |
| ---------------- | --------------------------------------------- | ----------------------------------------------------- |
| `@/lib/`         | Generic utilities, API helpers, configuration | Feature-specific constants, feature-specific services |
| `@/components/`  | UI primitives, generic layout components      | Feature-specific sections or compositions             |
| `@/types/`       | Shared domain types                           | Feature-only types, UI-only types                     |
| `@/hooks/`       | Generic hooks (useDebounce, useMediaQuery)    | Feature-specific hooks with domain logic              |
| `@/config/`      | Application-wide configuration                | Feature-specific limits, labels, or keys              |

### Trade-offs

- _Strict sharing rules_ may cause temporary duplication across features. This is acceptable — duplication is cheaper than incorrect abstraction.
- _Loose sharing rules_ create shared code that is coupled to specific feature requirements, making changes risky.

### Industry Best Practice

The Rule of Three (duplicate code three times before abstracting) and "prefer duplication over the wrong abstraction" are established principles in software engineering.

### Recommendation

Apply the Three-Question Test before moving any code from a feature to a shared directory. Default to feature-local.

---

## 28. Dependency Rules

### Purpose

Define the complete dependency graph for the Feature Layer and enforce it.

### Engineering Rationale

A feature's dependencies determine its coupling to the rest of the system. Explicit rules prevent circular dependencies and architectural erosion.

### Recommended Option

**Allowed import sources for a Feature:**

```
✅ Allowed:
  @/types/               (shared domain types)
  @/lib/                 (generic utilities, data functions)
  @/components/          (UI primitives, generic layout)
  @/config/              (application configuration)
  @/hooks/               (generic hooks)
  @/features/<other>/    (only from public barrel — index.ts)
  React, Next.js, Zod    (framework and utility libraries)

❌ Forbidden:
  @/features/<other>/_*  (any internal file of another feature)
  @/app/                 (pages, layouts — features don't import pages)
  @/sections/            (Stage 6 — sections import from features, not the reverse)
```

### Trade-offs

- _Strict dependency rules_ require discipline and tooling to enforce but guarantee a healthy dependency graph.
- _Permissive dependency approach_ is easier initially but leads to circular dependencies and architectural decay.

### Industry Best Practice

Clean Architecture's dependency rule (dependencies point inward) and the Acyclic Dependencies Principle are directly applicable. The feature dependency graph must be a DAG (Directed Acyclic Graph).

### Recommendation

Configure ESLint `import/no-restricted-paths` to enforce the forbidden imports above. Run `madge` or a similar tool in CI to detect circular dependencies.

---

## 29. Feature Performance Strategy

### Purpose

Define performance best practices specific to the Feature Layer.

### Engineering Rationale

Features are the unit of code splitting, lazy loading, and bundle optimisation. Performance decisions at the feature level have the most impact on the application's overall performance.

### Recommended Option

**Performance checklist per Feature:**

1. **Code splitting** — Each feature is a dynamic import boundary. Pages use `next/dynamic` or React.lazy for features not needed on initial render.
2. **Bundle size budget** — The feature's component JS bundle (excluding shared dependencies) should not exceed 50 KB. Use `@next/bundle-analyzer` to verify.
3. **CSS co-location** — Feature-specific styles use Tailwind utility classes (no separate CSS files). If inline styles are needed, co-locate them in the feature.
4. **Image optimisation** — All images within the feature use `next/image` with explicit dimensions.
5. **Server Component preference** — The feature's public component defaults to a Server Component. Client features are explicitly marked with `"use client"`.
6. **Memoization** — Client-side feature components use `useMemo` and `useCallback` for expensive computations defined in `_services/`.
7. **Lazy loading** — Heavy sub-components within a feature use `React.lazy()` or dynamic imports.

### Trade-offs

- _Strict bundle budgets_ may force developers to split features or defer non-critical functionality.
- _No bundle budgets_ allows feature bloat over time.

### Industry Best Practice

Vercel's Next.js performance recommendations, Core Web Vitals targets, and bundle analysis practices all apply at the feature level.

### Recommendation

Apply the performance checklist to every feature. Measure feature bundle size in CI and fail builds that exceed the 50 KB budget (excluding shared dependencies).

---

## 30. Feature Scalability

### Purpose

Design the Feature Layer to accommodate growth without structural changes.

### Engineering Rationale

The number of features will grow. New business capabilities will be identified. The architecture must scale linearly — adding a feature should not require changing existing features or the orchestration layer.

### Recommended Option

**Zero-impact feature addition.**

Adding a new feature requires:

1. Create `@/features/<name>/` with the canonical structure.
2. Export the public API from `index.ts`.
3. Import and compose in the appropriate page.

No existing feature needs to change. No page needs to change (unless the new feature is added to an existing page). No shared code needs to change.

This is possible because:

- Features are independent by design (Section 4).
- Features communicate only through pages (Section 26).
- Shared code is domain-free (Section 27).
- Pages compose features without knowing their internals (Stage 4).

### Trade-offs

- _Zero-impact addition_ is achievable only with strict adherence to the isolation and dependency rules.
- _Expedient addition_ (modifying shared code or other features to accommodate a new feature) is faster initially but erodes the architecture.

### Industry Best Practice

The Open-Closed Principle states that modules should be open for extension but closed for modification. Feature-oriented architecture with strict boundaries implements this at the module level.

### Recommendation

Test scalability by periodically simulating the addition of a new feature. If any file outside the new feature must change, the architecture has a violation that must be remediated.

---

## 31. Feature Maintainability

### Purpose

Define practices that ensure Features remain maintainable over time.

### Engineering Rationale

Features are long-lived. They will be modified by different developers over months and years. Without maintainability guidelines, features accumulate technical debt.

### Recommended Option

**Maintainability rules:**

1. **File size budget** — No single file in a feature exceeds 80 lines. Extract sections, services, and components freely.
2. **One export per file** — Each file exports exactly one primary thing (component, function, constant). Multiple exports are acceptable for closely related items (e.g., a types file).
3. **No barrel files inside `_` directories** — Internal directories use direct imports. Barrel files exist only at the feature root (`index.ts`).
4. **Feature README** — Every feature with more than 5 internal files includes a brief `readme.md` explaining the feature's purpose, public API, and internal structure.
5. **Deprecation path** — When a feature is replaced, the old feature's `index.ts` re-exports from the new feature with a `@deprecated` JSDoc tag for one cycle before removal.

### Trade-offs

- _80-line file budget_ forces early extraction but prevents unmanageable files.
- _Feature READMEs_ add documentation overhead but provide onboarding value for new team members.

### Industry Best Practice

File size budgets, single-responsibility files, and READMEs for complex modules are standard in maintainable codebases.

### Recommendation

Apply the maintainability rules. Configure ESLint's `max-lines` at 80 for feature files. Require READMEs in code review for features with more than 5 files.

---

## 32. Feature Testing Strategy

### Purpose

Define how Features are tested in isolation and how tests relate to the internal directory structure.

### Engineering Rationale

Feature isolation enables feature-level testing without the rest of the application. Tests are the mechanism that verifies the isolation is real, not just aspirational.

### Recommended Option

**Three-tier testing:**

| Test tier                 | What is tested                            | Location                                      | Dependencies                        |
| ------------------------- | ----------------------------------------- | --------------------------------------------- | ----------------------------------- |
| **Unit (services)**       | Pure functions in `_services/`            | `__tests__/` within the feature or co-located | Jest/Vitest only — no React, no DOM |
| **Unit (hooks)**          | Custom hooks in `_hooks/`                 | `__tests__/` within the feature               | React Testing Library + Vitest      |
| **Integration (feature)** | Feature component rendering with services | `__tests__/` within the feature               | Vitest + testing-library/react      |

Rules:

- Service tests mock nothing (pure functions).
- Hook tests mock only network/API calls.
- Feature integration tests mock only services (using Vitest mocks).
- No test imports from outside the feature except `@/types/`, `@/lib/`, and `@/components/`.

### Trade-offs

- _Three-tier testing_ requires more test files but provides targeted, fast tests.
- _Feature-only integration tests_ (skipping service/hook unit tests) are simpler but make it harder to localise failures.

### Industry Best Practice

The Test Pyramid (unit → integration → e2e) applies. Feature-oriented architecture maps to the pyramid naturally: service tests at the unit level, hook tests at the integration level, feature component tests at the integration level.

### Recommendation

Every feature with business logic in `_services/` has unit tests for those services. Every feature with custom hooks has hook tests. Every feature with significant UI logic has integration tests.

---

## 33. Feature Documentation Strategy

### Purpose

Define how Features are documented for both consumers (pages) and maintainers (developers).

### Engineering Rationale

Documentation is the primary mechanism for knowledge transfer. Without a strategy, knowledge becomes tribal and onboarding slows to a halt.

### Recommended Option

**Two documentation surfaces:**

| Surface             | Audience            | Content                                                          | Location                              |
| ------------------- | ------------------- | ---------------------------------------------------------------- | ------------------------------------- |
| **Public API docs** | Page developers     | What the feature does, what props it accepts, what types it uses | JSDoc in `index.ts` and `feature.tsx` |
| **Internal docs**   | Feature maintainers | Architecture notes, design decisions, state management approach  | `readme.md` in the feature root       |

The `index.ts` JSDoc includes:

````ts
/**
 * Profile Feature
 *
 * Renders an alumni profile card with key details and actions.
 * Access: Authenticated
 * Data: Receives ProfileData from page. Fetches avatar image internally.
 *
 * @example
 * ```tsx
 * <ProfileCard profile={data} onEdit={handleEdit} />
 * ```
 */
````

### Trade-offs

- _JSDoc + README_ provides comprehensive documentation but requires upkeep during refactoring.
- _Code-only documentation_ is always up to date but assumes the reader can infer intent from implementation.

### Industry Best Practice

Documentation-as-code (JSDoc, README, ADRs) is the standard in open-source and enterprise projects. Feature-level documentation follows the same pattern at a smaller scale.

### Recommendation

Every feature has JSDoc on its public exports and a README if it has more than 5 internal files. Documentation is reviewed alongside code.

---

## 34. Future Expansion Strategy

### Purpose

Design the Feature Layer to accommodate future business capabilities without structural changes.

### Engineering Rationale

The Alumni Management System will evolve. New capabilities will be identified (donations, mentorship, chapters, merchandise). The architecture must not require rewrites when new features are added.

### Recommended Option

**Feature discovery path for new capabilities:**

When a new business capability is identified:

1. **Is it a new bounded context?** Apply the Three-Question Test (Section 6). If the capability can be described without "and" and developed independently, it is a new feature.
2. **Create the feature module.** Use the canonical structure. Export the public API.
3. **Register in the configuration.** If the feature has navigation items, add them to `@/config/navigation.ts`.
4. **Wire into the page layer.** Import the feature in the appropriate `page.tsx` and pass the required data.
5. **Test independently.** The feature's service tests should pass before it is wired into any page.

This process requires no changes to:

- Existing features (they are isolated by design)
- The layout layer
- The routing layer
- Shared code (unless the new feature identifies a genuinely reusable utility)

### Trade-offs

- _Structured feature discovery_ formalises the addition process but may feel bureaucratic for trivial features.
- _Ad-hoc feature creation_ is faster but risks creating features that violate the architectural conventions.

### Industry Best Practice

Bounded Context mapping in DDD provides a discovery process for new capabilities. Feature-Oriented Architecture provides the implementation pattern once the capability is identified.

### Recommendation

Document the feature discovery process in the team's contributing guide. Follow the five-step process for every new feature. Do not create exceptions.

---

## 35. Feature Best Practices

### Purpose

Summarise all guidelines into a concise, actionable checklist.

### Engineering Rationale

A single best-practices document is more useful than 34 scattered sections. This checklist serves as the canonical reference for feature development and review.

### Recommended Option

**The Feature Layer checklist:**

- [ ] **Single capability** — Feature represents exactly one bounded business capability (passes the "no and" test).
- [ ] **Canonical structure** — `index.ts`, `feature.tsx`, `_sections/`, `_components/`, `_hooks/`, `_services/`, `_types/`, `_constants/`, `_utils/`, `_errors/`, `_validation/` as needed.
- [ ] **Minimal public API** — `index.ts` exports only the primary component, optional secondary components, and necessary types.
- [ ] **No internal leaks** — No external module imports from `_`-prefixed directories.
- [ ] **No cross-feature imports** — Feature does not import another feature's internal files.
- [ ] **Business logic in services** — All domain logic is in `_services/` as pure functions.
- [ ] **Hooks delegate to services** — Hooks orchestrate; they do not contain business logic.
- [ ] **Schema validation** — User-facing input is validated with Zod schemas in `_validation/`.
- [ ] **Feature-owned loading** — Feature exports a skeleton component or handles loading internally.
- [ ] **Feature-owned empty states** — Feature renders appropriate empty states for no-data conditions.
- [ ] **Feature-owned errors** — Typed error unions and granular error handling.
- [ ] **Permission checks** — Feature-level permission functions for entity-specific operations.
- [ ] **No page imports** — Feature does not import from `@/app/`.
- [ ] **File size budget** — No feature file exceeds 80 lines.
- [ ] **Tests exist** — Service tests for `_services/`, hook tests for `_hooks/`, integration tests for the feature component.
- [ ] **Documentation** — JSDoc on public exports, README for complex features.

### Trade-offs

- _Full checklist_ adds review time but guarantees architectural consistency.
- _Abbreviated checklist_ is faster but misses violations that accumulate into architectural debt.

### Industry Best Practice

Architecture review checklists are standard practice in enterprise engineering organisations. This checklist serves the same role for the Feature Layer.

### Recommendation

Apply the 16-point checklist to every feature during creation and during periodic architectural reviews. Include it in the PR template.

---

## Architecture Summary

```
  Page (page.tsx)
    │
    │  import { FeatureName } from "@/features/<name>"
    │  import type { FeatureData } from "@/features/<name>"
    │
    ▼
  Feature (@/features/<name>/index.ts)
    │
    │  import sections from ./_sections/
    │  import services from ./_services/
    │  import hooks from ./_hooks/
    │
    ▼
  Sections (@/features/<name>/_sections/)
    │
    │  import components from ./_components/
    │
    ▼
  Components (@/features/<name>/_components/)
    │
    │  import types from ./_types/
    │  import constants from ./_constants/
    │  import utils from ./_utils/
    │
    ▼
  Shared (@/types/, @/lib/, @/components/, @/config/)
```

### Dependency flow (allowed imports):

```
Feature → @/types/, @/lib/, @/components/, @/config/
Feature → @/features/<other>/ (public barrel only)
Feature internal → _services/ → _hooks/ → _components/ → feature.tsx
```

### Forbidden imports:

```
Feature → @/app/
Feature → @/features/<other>/_*
Feature → @/sections/
_services/ → _components/
_components/ → _services/
```

### Data flow:

1. Page fetches data (Stage 4) and passes it as props to the feature.
2. Feature validates props using `_validation/` schemas.
3. Feature transforms data using `_services/` pure functions.
4. Feature composes `_sections/` with the transformed data.
5. Sections compose `_components/` with section-specific subsets.
6. User interactions flow through `_hooks/` → `_services/` → callbacks/page.
7. Loading, empty, and error states are owned and rendered by the feature.
