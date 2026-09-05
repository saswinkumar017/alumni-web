# Stage 6 — Section Layer Specification

**Status:** Implemented  
**Dependencies:** Stage 5 (Feature Layer)  
**Next:** Stage 7 (Feature Component Layer)

---

## 1. Section Philosophy

### Purpose

Define the fundamental nature of a Section and how it differs from a Feature, a Component, and a Page.

### Engineering Rationale

Without a clear philosophy, sections become arbitrary file groupings — either too coarse (swallowing multiple presentation concerns) or too fine (duplicating the component layer). A Section is not a feature, a page, or a reusable component. It is a **cohesive presentation subdivision of a single Feature**. Treating it as such enforces a consistent decomposition pattern across all features, prevents presentation logic from accumulating in `feature.tsx`, and enables parallel development of different parts of the same feature.

### Recommended Option

**Section as Presentation Concern.** Every Section corresponds to exactly one logical presentation region within a Feature:

- **Dashboard Feature:** Statistics Section, Recent Activity Section, Quick Actions Section, Pending Requests Section
- **Profile Feature:** Basic Information Section, Education Section, Employment Section, Social Links Section
- **Events Feature:** Event List Section, Event Filters Section, Event Detail Section, Registration Section
- **Directory Feature:** Search Filters Section, Results Grid Section, Profile Card Section
- **Messages Feature:** Conversation List Section, Message Thread Section, Compose Section

Each Section is a self-contained presentation module that:

- Renders a distinct visual region of the Feature
- Receives a scoped subset of the Feature's data via props
- Composes Components (from `_components/` or `@/components/`) into meaningful groupings
- Owns its layout, spacing, headings, and section-level structure
- Can be developed, tested, and maintained independently of other Sections in the same Feature

A Section must be describable in one sentence using the pattern: "The Section is responsible for presenting [aspect of the Feature]." If the sentence needs "and," split the Section.

### Trade-offs

- _Sectionalised Features_ increase file count within a Feature but prevent `feature.tsx` from exceeding the 80-line budget.
- _Flat Feature structure_ (no sections, all components in `_components/`) is simpler for features with 2–3 display regions but becomes unmanageable beyond that threshold.

### Industry Best Practice

Composite UI patterns and Presentation-Abstraction-Control architectures decompose complex views into named regions. React's composition model makes sections a natural unit: each section is a component that receives a slice of the feature's data.

### Recommendation

Every Feature with more than one visual region decomposes into Sections. Features with a single visual region (e.g., a single form) may omit the `_sections/` layer and compose Components directly.

---

## 2. Section Architecture

### Purpose

Define the structural anatomy of a Section and its relationship to the Feature that owns it.

### Engineering Rationale

Every Section needs a consistent structure so developers can navigate any Feature without learning a custom layout. The architecture must separate the Section's public interface (one component) from its internal implementation.

### Recommended Option

**Single-file Section for simple concerns; subdirectory for complex Sections.**

For simple Sections (fewer than 3 sub-components, no private hooks or types):

```
@/features/<name>/_sections/
  some-section.tsx        — One component, one file
  another-section.tsx     — Another component, one file
```

For complex Sections (private components, hooks, types, or state):

```
@/features/<name>/_sections/
  some-section/
    index.ts              — Public barrel (exports the section component)
    section.tsx           — Primary section component
    _components/          — Section-private sub-components
    _hooks/               — Section-local hooks
    _types/               — Section-local types
    _constants/           — Section-local constants
```

Underscore-prefixed directories within a Section directory signal privacy from other Sections within the same Feature. No Section imports another Section's `_components/`, `_hooks/`, `_types/`, or `_constants/`.

If a Section requires a subdirectory, it must always have an `index.ts` barrel that exports exactly the root Section component.

### Trade-offs

- _Single-file Sections_ reduce nesting for simple presentation concerns but become unwieldy as the Section grows.
- _Subdirectory Sections_ provide clean separation but add directory depth. The rule: start single-file; promote to subdirectory when the file exceeds 80 lines OR when private sub-components are extracted.

### Industry Best Practice

The same barrel-and-underscore pattern used for Features (Stage 5) applies to complex Sections. This creates a consistent hierarchical pattern: Feature → Section → Component.

### Recommendation

Default to single-file sections. Promote to subdirectory only when justified by file size or extraction needs. Document the promotion in a comment at the top of the Section file.

---

## 3. Section Responsibilities

### Purpose

Define exactly what a Section owns and what it delegates to the Feature or to Components.

### Engineering Rationale

Responsibility boundaries prevent logic leakage from the Feature into the Section and from the Section into Components. If every architectural layer knows what it owns, there is no ambiguity about where a concern belongs.

### Recommended Option

**The Section owns eight responsibilities:**

1. **Section layout** — Spacing, padding, alignment of sub-components within the Section's visual region. Layout is expressed via Tailwind classes on the Section wrapper.
2. **Section headings** — Titles, subtitles, and descriptive text that introduce the Section's content.
3. **Section composition** — Importing and composing Components (from `_components/` or `@/components/`) into the Section's visual structure.
4. **Section hooks** — `use*` functions that encapsulate Section-local client logic (scroll position, intersection observers, animation state).
5. **Section types** — Interfaces and type aliases scoped to the Section's props and internal state.
6. **Section constants** — Labels, messages, and configuration values used only within the Section.
7. **Section-local UI state** — `useState` for UI concerns (dropdown open, tab selected, accordion expanded).
8. **Section loading, empty, and error states** — How the Section renders when its data is loading, absent, or in error.

**The Section delegates:**

- **Data fetching** — To the Feature (via props) or to Feature-level hooks/services.
- **Business logic** — To the Feature's `_services/`.
- **Domain validation** — To the Feature's `_validation/`.
- **Persistent state** — To the Feature's `_state/` or the Page.
- **Navigation** — To the Feature or Page (via callbacks).

### Trade-offs

- _Eight responsibilities_ is comprehensive but can feel heavy for a Section that only renders a heading and a list.
- _Partial implementation_ is acceptable — a Section that never loads data has no loading state to own.

### Industry Best Practice

Separation of Presentation from Business Logic is a cornerstone of clean architecture. Sections own presentation; Features own business logic. This mirrors the View-Presenter boundary in MVP and the View-ViewModel boundary in MVVM.

### Recommendation

Apply the eight-responsibility model to every Section. Empty or omitted responsibilities are acceptable and informative. A Section that acquires business logic (validation, data transformation, API calls) is a sign that logic should be lifted to the Feature.

---

## 4. Section Characteristics

### Purpose

Define the essential qualities every Section must exhibit.

### Engineering Rationale

Characteristics serve as architectural acceptance criteria. A Section that does not meet these qualities is not well-architected.

### Recommended Option

**Six essential characteristics:**

| Characteristic      | Definition                                                                                        | Test                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Cohesion**        | The Section addresses exactly one presentation concern                                            | Can you describe the Section without using "and"?                                                 |
| **Composability**   | The Section provides a clean component interface with a single exported component and typed props | Does the Feature use the Section as `<SomeSection data={...} onAction={...} />`?                  |
| **Encapsulation**   | The Section hides all internal implementation details                                             | Can an external module (another Section, the Feature) access the Section's internals? (No → good) |
| **Testability**     | The Section can be tested in isolation by rendering it with props                                 | Can you write a unit test that imports only the Section's public component?                       |
| **Discoverability** | The Section's existence and purpose are obvious from the `_sections/` directory                   | Is the Section file named to clearly indicate its presentation concern?                           |
| **Replaceability**  | The Section can be rewritten entirely without changing its consuming Feature                      | Can you replace the Section's internals without changing its props interface?                     |

### Trade-offs

- _Strict characteristics_ increase development discipline but prevent architectural debt at the Section level.
- _Relaxed characteristics_ accelerate initial delivery of Sections but create coupling that resists refactoring.

### Industry Best Practice

SOLID principles — particularly Single Responsibility and Open-Closed — apply at every architectural layer. The six characteristics translate these principles to the Section Layer.

### Recommendation

Apply the six-characteristic checklist to every Section during creation and during architectural reviews. Violations require written justification.

---

## 5. Section Classification

### Purpose

Categorise Sections by their rendering mode, data dependency, and interaction level.

### Engineering Rationale

Different Sections have different rendering and data requirements. Classification makes these explicit and prevents applying Server Component rules to interactive Sections or vice versa.

### Recommended Option

**Three-axis classification:**

| Axis                | Categories                                                                   | Examples                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Rendering**       | Server, Client, Hybrid                                                       | Statistics Section (Server), Compose Section (Client), Event List Section (Hybrid — initial render server, search client) |
| **Data dependency** | Static (no props), Props-only (receives all data), Lazy (fetches internally) | Section heading (Static), Profile Detail Section (Props-only), Activity Feed Section (Lazy — fetches on mount)            |
| **Interaction**     | Passive (display only), Reactive (user input), Active (pushes changes)       | Statistics Section (Passive), Filter Section (Reactive), Compose Form Section (Active)                                    |

Classification is documented as a comment at the top of the Section file:

```tsx
// Section: EventListSection
// Rendering: Server (initial) / Client (search)
// Data: Props-only (receives events from Feature)
// Interaction: Reactive (filter/sort controls)
```

### Trade-offs

- _Three-axis classification_ adds documentation overhead but clarifies design decisions for every Section.
- _Implicit classification_ (relying on reading the code) is faster but causes miscommunication during refactoring.

### Industry Best Practice

Multi-axis classification is standard in enterprise UI architecture (e.g., IBM Carbon, SAP Fiori). The same principle applies at the Section level within a Feature.

### Recommendation

Document every Section's classification as a header comment. Use classification during architectural reviews to verify that design decisions match the classification.

---

## 6. Section Granularity

### Purpose

Determine the right size for a Section — when to split and when to merge.

### Engineering Rationale

Granularity is the most common architectural mistake at the Section level. Sections that are too large become untestable presentation monoliths. Sections that are too small cause import sprawl within the Feature.

### Recommended Option

**The Three-Question Test for Sections.** A Section has the right granularity if all three answers are "yes":

1. **Single-presentation test:** Can the Section be described as one visual concern without "and"?
2. **Independent-layout test:** Could the Section be moved to a different position in the Feature without changing its internal logic?
3. **Isolated-render test:** Can the Section be rendered in isolation (e.g., in Storybook) with only its props and no parent context?

If the answer to any is "no," split the Section. If splitting creates Sections too small to justify their own props interface (fewer than 2 props), merge them into a parent Section.

### Trade-offs

- _Finer granularity_ increases Section count within a Feature but improves isolation and testability.
- _Coarser granularity_ reduces Section count but creates internal coupling that makes layout changes risky.

### Industry Best Practice

The Single Responsibility Principle applied to presentation: a Section should have one reason to change. If a layout change would affect only part of a Section, the Section should be split.

### Recommendation

Apply the Three-Question Test during Section creation and every major refactor. A Section file exceeding 80 lines is a strong signal that granularity should be reviewed.

---

## 7. Section Boundaries

### Purpose

Define where each Section begins and ends within a Feature.

### Engineering Rationale

Boundaries prevent Sections from reaching into each other's implementation. Clear boundaries make the presentation dependency graph explicit and analyzable.

### Recommended Option

**Rigid boundaries within the Feature's `_sections/` directory.**

- Each Section lives as a file or subdirectory within `@/features/<name>/_sections/`.
- The only public interface from one Section to another is through the Feature's `feature.tsx`, which composes them and passes data.
- Section A never imports from Section B's file directly.
- Section A never imports Section B's internal `_components/`, `_hooks/`, or `_types/`.
- Shared presentation needs between Sections are handled by:
  - Lifting the shared component to `@/components/` (if used across Features)
  - Keeping it in `_components/` at the Feature level (if used within the Feature)
  - Passing shared data through the Feature orchestrator

If two Sections repeatedly reach for the same sub-component or hook, that code belongs in the Feature-level `_components/` or `_hooks/`, not in either Section.

### Trade-offs

- _Rigid boundaries_ prevent Section coupling but may require lifting shared code to the Feature level.
- _Permissive boundaries_ (Sections importing from each other) are convenient short-term but create invisible dependencies.

### Industry Best Practice

Component architecture in design systems (e.g., Brad Frost's Atomic Design) enforces boundaries between levels. Sections are analogous to "organisms" — they compose "molecules" (Components) but never reach into other "organisms."

### Recommendation

Enforce the boundary convention in code review. A Section importing from another Section's directory is a review-blocking violation. The only legitimate cross-Section interaction is through the Feature orchestrator.

---

## 8. Section Isolation

### Purpose

Ensure that a Section can be developed, tested, and reasoned about without knowledge of other Sections in the same Feature.

### Engineering Rationale

Isolation within a Feature is the precondition for parallel development. If a developer must understand three other Sections to work on one, the Feature architecture has failed.

### Recommended Option

**Strict isolation with three rules:**

1. **No cross-Section direct imports.** A Section may only receive data from the Feature orchestrator via props. It never imports another Section's internals.
2. **No shared mutable state between Sections.** Sections own their UI state. Cross-Section state synchronization happens through the Feature orchestrator (lifting state up).
3. **No Feature business logic in Sections.** Sections receive already-processed data. They do not call Feature-level services or validation functions directly.

### Trade-offs

- _Strict isolation_ sometimes requires the Feature orchestrator to mediate between Sections. This is acceptable — the orchestrator's role includes coordination.
- _Loose isolation_ allows Sections to communicate directly but creates implicit dependencies that break during refactoring.

### Industry Best Practice

The Principle of Least Privilege applied to presentation: a Section should have access to only the data it needs, not the Feature's entire data model.

### Recommendation

Enforce the three isolation rules as architectural invariants. A Section that imports from another Section or calls a Feature-level service directly is an architectural violation.

---

## 9. Section Public Interface

### Purpose

Define how each Section exposes itself to the Feature orchestrator.

### Engineering Rationale

The Section's public interface is its contract with the Feature. A well-designed interface makes the Section easy to compose and hard to misuse.

### Recommended Option

**Minimal component export with typed props.**

Each Section file or subdirectory exports exactly one component — the Section root. The component accepts typed props that represent exactly the data and callbacks the Section needs:

```tsx
// _sections/statistics-section.tsx
export interface StatisticsSectionProps {
  totalMembers: number;
  activeMembers: number;
  upcomingEvents: number;
  pendingRequests: number;
}

export function StatisticsSection({
  totalMembers,
  activeMembers,
  upcomingEvents,
  pendingRequests,
}: StatisticsSectionProps) { ... }
```

Rules for props:

- **Flat props over compound objects** — Pass primitive values or simple interfaces rather than the entire Feature data model. This makes prop requirements explicit and avoids over-fetching.
- **Callback props for interactions** — Use `onAction` naming convention: `onSearch`, `onFilterChange`, `onItemSelect`.
- **No optional props without defaults** — If a Section needs a default value, define it inside the Section. Optional props should be genuinely optional (not "we might pass this later").

A Section's barrel `index.ts` (if using subdirectory form) exports only:

```tsx
export { StatisticsSection } from "./section";
export type { StatisticsSectionProps } from "./section";
```

### Trade-offs

- _Flat props_ increase the number of props but make data dependencies explicit.
- _Compound object props_ (passing `featureData.sectionSubset`) reduce prop count but hide data dependencies.

### Industry Best Practice

Explicit typing of component props is standard in TypeScript React. The principle of accepting only what you need (rather than a larger object you partially destructure) follows Interface Segregation.

### Recommendation

Every Section exports a single component with explicitly typed props. Props are as flat as practical. No Section receives the entire Feature's data model as a single prop.

---

## 10. Internal Section Architecture

### Purpose

Define the internal structure of a Section and how its sub-modules relate to each other.

### Engineering Rationale

The internal architecture transforms the Section's responsibilities into a concrete dependency graph. Each internal directory has a defined role and imports only from specific sources.

### Recommended Option

**Internal dependency flow for complex Sections (subdirectory form):**

```
section.tsx (orchestrator — composes sub-components)
    ↓
_components/ (Section-private UI pieces)
    ↓
_hooks/   _types/   _constants/
```

- `section.tsx` is the orchestrator. It composes sub-components with Section-level layout and headings.
- `_components/` are Section-private UI pieces that are too specific to promote to the Feature's `_components/`.
- `_hooks/` encapsulate Section-local client logic.
- `_types/` define props interfaces and internal types.
- `_constants/` define Section-local labels and configuration.

No internal Section module imports from:

- Another Section's internal modules
- The Section's parent Feature's `_services/` directly

### Trade-offs

- _Subdirectory Sections_ provide clean separation but add depth. Most Sections should be single-file.
- _Single-file Sections_ are simpler but may accumulate internal complexity that should be extracted.

### Industry Best Practice

The same layering principle as the Feature layer (Stage 5), applied one level deeper. Components import from types and constants; hooks import from types; no circular dependencies.

### Recommendation

Start with single-file Sections. Extract to subdirectory only when justified. The Section's internal modules never import from another Section.

---

## 11. Section Composition Strategy

### Purpose

Define how Sections compose Components and how Features compose Sections.

### Engineering Rationale

Composition is the mechanism by which the architecture scales. A Section composes Components; a Feature composes Sections. Each layer is replaceable because it depends only on the layer below's public interface.

### Recommended Option

**Two-tier composition within the Feature:**

| Composition         | From                              | Into          | Mechanism                                                                         |
| ------------------- | --------------------------------- | ------------- | --------------------------------------------------------------------------------- |
| Section → Component | `_components/` or `@/components/` | Section file  | Import and compose Components with Section-specific layout and headings           |
| Feature → Section   | `_sections/`                      | `feature.tsx` | Import Section components, pass scoped data, add Section-level Suspense if needed |

The Feature orchestrator (`feature.tsx`) composes Sections following this pattern:

```
1. Process/transform data using Feature-level services (_services/)
2. Import Section components from _sections/
3. Compose Sections, passing each Section its scoped props
4. Wrap async Sections in Suspense with Section-specific skeletons
5. Handle Feature-level error and empty states that span multiple Sections
```

### Trade-offs

- _Two-tier composition_ keeps each layer's responsibility clear but requires every multi-region Feature to implement Section composition.
- _Flat composition_ (Feature composing Components directly) is simpler but skips a layer that provides meaningful grouping for complex Features.

### Industry Best Practice

React's composition model (children, render props, component injection) maps naturally to Section-based architecture. The Feature → Section → Component → Primitive hierarchy is a consistent composition chain.

### Recommendation

All Features with multiple visual regions use the two-tier composition model. A Feature with a single visual region may compose Components directly and skip the `_sections/` layer.

---

## 12. Section Lifecycle

### Purpose

Define the lifecycle stages of a Section from the moment the Feature composes it to the moment it is unmounted.

### Engineering Rationale

Understanding the lifecycle helps developers reason about when props are received, when hooks run, and when cleanup happens within a Section.

### Recommended Option

**Five-stage lifecycle for Client Sections:**

| Stage                 | What happens                                                                  | Who owns it                             |
| --------------------- | ----------------------------------------------------------------------------- | --------------------------------------- |
| 1. **Props received** | Feature passes scoped data and callbacks as props                             | Feature                                 |
| 2. **Mount**          | Section initialises UI state (`useState`), sets up observers or subscriptions | Section (`_hooks/`)                     |
| 3. **Render**         | Section composes sub-components with Section-level layout and headings        | Section (`section.tsx`)                 |
| 4. **Interaction**    | User interactions trigger Section hooks → callbacks to Feature                | Section (`_hooks/` → props.on*)         |
| 5. **Cleanup**        | Section tears down observers, subscriptions, ephemeral state                  | Section (`_hooks/` → useEffect cleanup) |

For Server Sections, the lifecycle is: Props received → Render. No mount, interaction, or cleanup stages apply.

### Trade-offs

- _Five-stage lifecycle_ is comprehensive but adds ceremony for Sections that are purely presentational.
- _Simplified lifecycle_ (render only) works for passive Sections but misses interaction and cleanup patterns.

### Industry Best Practice

React's component lifecycle (mount → render → unmount) and the addition of Server Components create two parallel lifecycles. Section architecture must handle both.

### Recommendation

Document the lifecycle stage in each Section's header comment. Sections using only Server rendering document the two-stage lifecycle explicitly.

---

## 13. Section State Ownership

### Purpose

Define which state belongs to a Section and how it is managed.

### Engineering Rationale

State ownership at the Section level prevents Feature-level state from accumulating unrelated UI concerns. Section-local state enables isolation and independent testability.

### Recommended Option

**Two-tier state ownership within a Feature:**

| State type                 | Owner   | Mechanism                                       | Example                                                                    |
| -------------------------- | ------- | ----------------------------------------------- | -------------------------------------------------------------------------- |
| **Section-local UI state** | Section | `useState` inside the Section                   | Dropdown open/closed, accordion expanded, tab selected, filter input value |
| **Feature-level state**    | Feature | Zustand slice in `_state/` or lifted `useState` | Selected item ID (shared between Sections), form data, fetched results     |

Rules:

- A Section never reads another Section's local state.
- A Section never writes to Feature-level state directly — it calls callbacks passed via props.
- Section-local state is never exposed outside the Section.
- If a Section's local UI state needs to be shared with another Section, lift it to the Feature orchestrator.

### Trade-offs

- _Section-local state_ enables isolation but may cause prop drilling if multiple Sections need the same UI state (lift to Feature).
- _Feature-level state for everything_ is convenient but accumulates UI concerns in the Feature, breaking Section isolation.

### Industry Best Practice

React's "lifting state up" pattern applies at the Section-Feature boundary. Colocation (keeping state where it is used) keeps Sections self-contained. The combination of both principles creates the two-tier model.

### Recommendation

Sections own their UI state. Features own cross-Section state. Never share Section-local state between Sections. Use callbacks for Section-to-Feature communication.

---

## 14. Section Data Flow

### Purpose

Define how data enters a Section, how it flows through internal modules, and how it is rendered.

### Engineering Rationale

A clear data flow makes the Section testable and debuggable. Opaque data flow (e.g., Sections fetching data directly from stores) breaks the orchestration model and creates hidden data dependencies.

### Recommended Option

**Unidirectional data flow with Feature as entry point:**

```
Feature (feature.tsx)
  │
  │  Scoped props (section-specific subset of feature data)
  ▼
Section (section.tsx)
  │
  ├── Validate props (basic runtime checks if needed)
  │
  ├── Render section layout and headings
  │
  ├── Compose sub-components (_components/ or @/components/)
  │     │
  │     ├── Pass component-specific props
  │     ▼
  │   Component instances
  │
  ├── Handle user interactions via Section hooks
  │     │
  │     ├── Transform interaction data
  │     ▼
  │   Callback to Feature (props.onAction)
  │
  └── Render loading, empty, or error state when applicable
```

- Data enters the Section exclusively through props from the Feature.
- The Section may derive display data from props (e.g., formatting, sorting) but never fetches domain data.
- User interactions flow upward via callback props to the Feature orchestrator.
- The Section renders its own loading, empty, and error states based on props or local state.

### Trade-offs

- _Feature as data entry point_ makes data dependencies explicit but requires the Feature to know what data every Section needs.
- _Section-fetched data_ makes Sections self-sufficient but creates hidden data dependencies and potential waterfalls.

### Industry Best Practice

React's unidirectional data flow and the principle of "data flows down, events flow up" are the canonical patterns. Feature → Section → Component follows this exactly.

### Recommendation

All Section data comes from the Feature via props. Sections never fetch domain data. Sections may derive display data from props using local utilities.

---

## 15. Section Business Responsibilities

### Purpose

Define what business logic a Section may contain and what must remain in the Feature.

### Engineering Rationale

Business logic in Sections is the most common architectural violation at this layer. Sections that implement business rules become untestable, unreusable, and tightly coupled to domain concerns.

### Recommended Option

**Sections contain zero business logic.**

Business logic — validation rules, permission checks, data transformation, calculations — lives exclusively in the Feature's `_services/`. Sections receive already-processed, display-ready data.

What a Section may do:

- Format data for display (date formatting, string truncation, number formatting)
- Sort or filter display data for presentation purposes (e.g., alphabetical list ordering)
- Derive UI state from props (e.g., `const isDisabled = items.length === 0`)
- Transform callback arguments for Feature consumption (e.g., `onChange={handleChange}` wraps raw event)

What a Section must NOT do:

- Validate domain entities (e.g., checking if an email is valid)
- Calculate business values (e.g., computing donation tiers)
- Check permissions (e.g., `canEdit`)
- Transform domain data structures

```tsx
// ✅ Section-acceptable: display formatting
function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// ❌ Section-forbidden: business logic
// function canPublish(event: Event): boolean {
//   return event.status === "draft" && user.role === "admin";
// }
```

### Trade-offs

- _Zero business logic_ in Sections maximises testability of business rules (tested at Feature level) but may require the Feature to pass more derived props.
- _Tolerating minor business logic_ (e.g., simple permission checks) is pragmatic short-term but creates a slippery slope toward business logic scattered across the presentation layer.

### Industry Best Practice

Separating Presentation from Business Logic is a universal architectural principle. MVC, MVP, MVVM, and Clean Architecture all enforce this boundary. The Section-Feature boundary is where this separation manifests at the UI layer.

### Recommendation

Zero business logic in Sections. Any Section that needs to call a Feature service, validate a domain entity, or check a permission is violating the architecture. Lift the logic to the Feature and pass the result as a prop.

---

## 16. Section Validation

### Purpose

Define how Sections validate their input props and user interactions within the Section.

### Engineering Rationale

Validation at the Section boundary catches prop mismatches early and provides clear error messages during development. Runtime validation of user interactions within a Section prevents invalid state from propagating to the Feature.

### Recommended Option

**Two-tier validation:**

| Validation type            | What it checks                                                              | Mechanism                                                                                             | Where it runs    |
| -------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------- |
| **Props validation**       | Required props exist, props are correct types                               | TypeScript types (compile-time) + `process.env.NODE_ENV === "development"` console warnings (runtime) | Section boundary |
| **Interaction validation** | User input within the Section is well-formed before calling back to Feature | Simple guard clauses at the top of event handlers                                                     | Section hooks    |

Domain validation (email format, password strength, date ranges) is NOT the Section's responsibility — the Feature's `_validation/` handles that.

```tsx
// ✅ Section-appropriate validation: interaction guard
function handleSubmit(raw: string) {
  if (!raw.trim()) return; // Guard: ignore empty submissions
  onSubmit(raw.trim());
}
```

### Trade-offs

- _Runtime props validation_ provides early warnings during development but adds bundle size for development-only checks.
- _TypeScript-only validation_ is sufficient for props but does not catch runtime edge cases.

### Industry Best Practice

TypeScript provides compile-time validation for props. Runtime validation via console warnings is a development aid. Domain validation belongs in the Feature layer per the architecture.

### Recommendation

Rely on TypeScript for props validation. Use guard clauses for interaction validation within Sections. Domain validation belongs in the Feature's `_validation/`.

---

## 17. Section Hooks

### Purpose

Define the role of custom hooks within a Section and how they differ from Feature-level hooks.

### Engineering Rationale

Hooks in Sections bridge the gap between React's lifecycle and the Section's presentation logic. Without clear guidelines, Section hooks accumulate concerns that should be at the Feature level.

### Recommended Option

**Section hooks encapsulate presentation-only client logic.**

Section hooks manage:

- Animation triggers and timers
- Intersection observers for scroll-based interactions
- Local storage of UI preferences (collapsed sections, tab selection)
- Debounced input handling for search/filter fields
- Media query matching for responsive adjustments within the Section

Section hooks do NOT:

- Fetch or cache domain data
- Call Feature-level services
- Manage Feature-level state
- Subscribe to global stores

```tsx
// ✅ Section hook: tracks scroll position for sticky header
function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return scrollY;
}
```

### Trade-offs

- _Presentation-only hooks_ keep Sections self-contained for UI concerns but may require lifting interactive logic to the Feature when it affects multiple Sections.
- _Feature-level hooks_ reduce duplication across Sections but increase the Feature's complexity.

### Industry Best Practice

Custom hooks are a standard React pattern for extracting reusable logic. Feature-oriented architecture applies this at the Section level for presentation logic, reserving domain logic for Feature-level hooks.

### Recommendation

All Section hooks are presentation-only. Any hook that imports from `_services/`, `_state/`, or the Feature's `_types/` is a violation — lift it to the Feature.

---

## 18. Section Types

### Purpose

Define how types are structured within a Section and what belongs in `_types/` vs the Feature's `_types/`.

### Engineering Rationale

Type proliferation at the Section level can lead to fragmented type definitions. Clear rules prevent this while maintaining Section isolation.

### Recommended Option

**Props types live with the Section component. Internal types live in Section-local `_types/` (subdirectory form only).**

| Type location                         | What goes there                                 | Examples                                          |
| ------------------------------------- | ----------------------------------------------- | ------------------------------------------------- |
| Co-located with Section component     | Props interface for the Section                 | `StatisticsSectionProps`, `EventListSectionProps` |
| Section `_types/` (subdirectory form) | Types used only within the Section              | `SortDirection`, `FilterState`, `TabConfig`       |
| Feature `_types/`                     | Types shared across Sections within the Feature | `EventSummary`, `MemberBrief`, `ActivityItem`     |

Rules:

- If a type is used by only one Section, it lives with that Section (co-located or in `_types/`).
- If a type is used by two or more Sections within the same Feature, it lives in the Feature's `_types/`.
- If a type is used by multiple Features, it lives in `@/types/`.
- Props interfaces are always co-located with the Section component, never in a separate types file.

### Trade-offs

- _Co-located props types_ keep the interface close to its consumer but make it harder to find if you search only the `_types/` directory.
- _Separate props types file_ is more organised but adds indirection for what should be a simple interface.

### Industry Best Practice

Co-location of props interfaces with their component is standard in React TypeScript codebases. The "promote when needed" approach prevents premature abstraction.

### Recommendation

Props interfaces are co-located with the Section component. Internal Section types (subdirectory form) live in `_types/`. Promote to Feature `_types/` when a second Section needs the same type.

---

## 19. Section Constants

### Purpose

Define where Section-specific constants live and how they differ from Feature-level constants.

### Engineering Rationale

Hardcoded strings and magic numbers in Section code are the leading cause of presentation inconsistency. Constants centralise these values.

### Recommended Option

**Section constants are defined at the top of the Section file (or in `_constants/` for subdirectory form).**

Constants include:

- Section heading text and aria-labels
- Limit values for display (max items shown, truncation lengths)
- Animation durations and delay values
- Default sort/filter values

Constants do NOT include:

- Feature-level labels and messages (live in Feature's `_constants/`)
- Feature-level limits and thresholds (live in Feature's `_constants/`)
- Application-wide configuration (lives in `@/config/`)

```tsx
// Top of Section file
const MAX_VISIBLE_ITEMS = 5;
const SECTION_TITLE = "Recent Activity";
const EXPAND_LABEL = "Show all activity";
const COLLAPSE_LABEL = "Show less";
```

### Trade-offs

- _File-level constants_ keep values close to their usage but may be duplicated across Sections if the same value is needed.
- _Feature-level constants_ avoid duplication but require the Section to import from the Feature's `_constants/`.

### Industry Best Practice

Co-location of constants with their primary consumer is standard. Promote to Feature level only when a second Section needs the same value.

### Recommendation

All Section-specific constants live at the top of the Section file or in a Section `_constants/` directory. Feature-level duplication across Sections is a signal to promote to Feature `_constants/`.

---

## 20. Section Utilities

### Purpose

Define the role of utility functions within a Section and distinguish them from Section hooks and Feature services.

### Engineering Rationale

Without clear distinction, utility files become catch-all dumping grounds. Separating utilities from hooks preserves testability and clarity.

### Recommended Option

**Utilities are pure display-helper functions; hooks are lifecycle-bound logic; services are business logic.**

| Aspect           | Section Utilities                            | Section Hooks                            | Feature Services               |
| ---------------- | -------------------------------------------- | ---------------------------------------- | ------------------------------ |
| Contains         | Pure display-helper functions                | Lifecycle-bound presentation logic       | Domain business logic          |
| Example          | `formatCount`, `truncateMiddle`, `pluralize` | `useScrollPosition`, `useDebouncedInput` | `calculateProfileCompleteness` |
| Side effects     | No                                           | Yes (effect cleanup)                     | No                             |
| React dependency | No                                           | Yes                                      | No                             |
| Test value       | Low (trivial formatting)                     | Medium (interaction logic)               | High (business rules)          |

A utility that is needed by two or more Sections within a Feature should be promoted to the Feature's `_utils/`. A utility needed by two or more Features should be promoted to `@/lib/utils.ts`.

### Trade-offs

- _Strict separation_ of utilities, hooks, and services requires developer judgment but prevents each category from accumulating concerns from the others.
- _Combined utility files_ are simpler but defeat the purpose of separating presentation helpers from lifecycle logic.

### Industry Best Practice

Separation of Concerns applies at every level. Pure display helpers are fundamentally different from lifecycle-bound hooks and should be kept separate.

### Recommendation

Use Section-level utilities for pure display formatting only. Promote shared utilities to Feature `_utils/` or `@/lib/` as usage dictates.

---

## 21. Section Error Handling

### Purpose

Define how Sections handle errors internally and what they expose to the Feature.

### Engineering Rationale

Error handling at the Section level must not swallow errors that the Feature or Page needs to handle, nor should it expose internal error details to users.

### Recommended Option

**Two-tier error handling:**

| Error severity      | What happens                                                          | Who handles it                                                                                  |
| ------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Display errors**  | Data is missing, malformed, or empty for this Section only            | Section renders its error state inline                                                          |
| **Critical errors** | The Section cannot function at all; data is fundamentally unavailable | Section calls the Feature's error callback or throws to trigger the Feature/Page error boundary |

Implementation pattern:

```tsx
function StatisticsSection({ stats, onError }: StatisticsSectionProps) {
  if (!stats) {
    return (
      <SectionWrapper>
        <SectionErrorState
          message="Unable to load statistics."
          action={<RetryButton onRetry={onError} />}
        />
      </SectionWrapper>
    );
  }

  return <SectionContent stats={stats} />;
}
```

Rules:

- Sections never use global error boundaries directly — they let errors propagate to the Feature or Page boundary.
- Sections that perform client-side interactions (form-like Sections) define Section-level error states for validation feedback.
- Error messages in Sections are user-facing, defined in Section constants, and follow the application's i18n pattern.

### Trade-offs

- _Section-level error states_ provide granular error recovery but require each Section to implement its own error UI.
- _Feature-level error boundaries_ are simpler but collapse the entire Feature when one Section fails.

### Industry Best Practice

Error boundary placement should match the granularity of independent failure. If a Section can fail independently without affecting other Sections, it should handle its own error state.

### Recommendation

Every Section that receives dynamic data implements a Section-level error state for its specific failure modes. Critical errors propagate to the Feature. Display errors are handled inline.

---

## 22. Section Loading Strategy

### Purpose

Define how Sections communicate loading state during data fetching.

### Engineering Rationale

Loading states at the Section level enable granular Suspense boundaries within a Feature. Feature-level loading states (using the Feature's skeleton) are the default; Section-level loading states are used when Sections load independently.

### Recommended Option

**Two approaches based on loading pattern:**

| Loading pattern                      | Approach                                                                                             | When to use                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Feature loads all data upfront**   | Feature provides data as props; Section receives data or null/undefined and renders its own skeleton | Sections that depend on data the Feature already fetches                       |
| **Section loads data independently** | Section wraps itself in a Suspense boundary or manages its own loading state via `isLoading` prop    | Sections that fetch their own data (e.g., activity feeds, notifications count) |

For the first pattern (Feature loads upfront), the Section renders a Section-specific skeleton when data is not yet available:

```tsx
function StatisticsSection({ stats }: StatisticsSectionProps) {
  if (!stats) return <StatisticsSectionSkeleton />;
  return <SectionContent stats={stats} />;
}
```

For the second pattern (Section loads independently), the Feature wraps the Section in a Suspense boundary with the Section's skeleton as fallback:

```tsx
// In feature.tsx
<Suspense fallback={<ActivityFeedSkeleton />}>
  <ActivityFeedSection userId={user.id} />
</Suspense>
```

### Trade-offs

- _Section-level skeletons_ provide accurate loading states but require each Section to maintain its skeleton alongside its content.
- _Feature-level loading states_ (generic spinners) are simpler but do not reflect the Section's layout, causing layout shift.

### Industry Best Practice

Suspense boundaries with skeleton fallbacks are the recommended pattern in Next.js and React. Section-level skeletons align with the principle that Sections own their loading experience.

### Recommendation

Every Section with dynamic data exports or co-locates a skeleton variant. Features use Section skeletons as Suspense fallbacks for independently loading Sections.

---

## 23. Section Empty State Strategy

### Purpose

Define how Sections render when they have no data to display.

### Engineering Rationale

Empty states are part of the Section's domain — only the Section knows what messaging is appropriate when its specific data set is empty.

### Recommended Option

**Section-owned empty state components.**

Each Section defines how it renders when its primary data set is empty. Empty states include:

- A clear message explaining why the Section is empty ("No upcoming events")
- Context-appropriate call-to-action ("Browse past events" or "Create an event")
- An icon or visual indicator consistent with the Section's purpose
- Empty states that vary by context (e.g., "No results" for search vs "Nothing yet" for an empty list)

```tsx
function EventListSection({ events }: EventListSectionProps) {
  if (events.length === 0) {
    return (
      <SectionWrapper>
        <SectionEmptyState
          icon={<CalendarIcon />}
          title="No upcoming events"
          description="Check back later for new events."
          action={<Link href="/events/past">Browse past events</Link>}
        />
      </SectionWrapper>
    );
  }
  // ...
}
```

Empty state components are composed within the Section, not imported from outside. If multiple Sections share the same empty state pattern, extract a shared `@/components/empty-state/` and customise it per Section.

### Trade-offs

- _Section-owned empty states_ give each Section full control over its empty experience but may lead to inconsistent styling.
- _Shared empty state component_ provides consistency but cannot provide domain-specific messaging and CTAs without props that approach Section-level complexity.

### Industry Best Practice

Empty state design is a recognised UX pattern. Section ownership of empty states is consistent with the principle that Sections own their entire user experience within the Feature.

### Recommendation

Every Section with dynamic data implements at least one empty state. Empty states are Section-owned. A shared `@/components/empty-state/` provides the base UI, which Sections customise for their context.

---

## 24. Section Security

### Purpose

Define security responsibilities that belong to the Section Layer.

### Engineering Rationale

Security at the Section level is about hiding or disabling UI elements based on permissions. Coarse access control (which Feature is shown) is handled by the Page. Granular UI-level security (which Section actions are available) is handled by the Feature and Section.

### Recommended Option

**Visibility control via props, not internal permission checks.**

The Feature determines what a Section can show or hide based on permissions and passes visibility flags as props:

```tsx
// Feature passes visibility flags based on permission checks
<ActionSection
  items={pendingItems}
  canApprove={permissions.canApproveItems}
  canReject={permissions.canRejectItems}
/>
```

Rules:

- Sections never check permissions themselves — they receive boolean flags as props.
- Sections never render hidden data (even if a permission flag is false, the data prop should not contain restricted data).
- Section-level action buttons (Edit, Delete, Approve) are disabled or hidden based on props, never on internal role checks.

### Trade-offs

- _Feature-controlled visibility_ keeps permission logic centralised but requires the Feature to compute visibility flags for every Section.
- _Section-level permission checks_ are convenient but scatter permission logic across the presentation layer.

### Industry Best Practice

The Principle of Least Privilege applies to UI rendering: a Section should receive only the data and capabilities the current user is authorised to see or use.

### Recommendation

All Section-level security decisions are controlled via props from the Feature. Sections never import permission functions or check user roles directly.

---

## 25. Section Accessibility

### Purpose

Define accessibility (a11y) responsibilities that belong to the Section Layer.

### Engineering Rationale

Accessibility is a shared responsibility across all architectural layers. The Section Layer is responsible for Section-level semantic structure, headings hierarchy, and focus management.

### Recommended Option

**Section-level a11y checklist:**

1. **Semantic sectioning** — Each Section uses a semantic wrapper (`<section>`, `<article>`, `<aside>`, `<nav>`) with an `aria-label` or `aria-labelledby` that references the Section heading.
2. **Heading hierarchy** — Section headings use the correct heading level (`<h2>`, `<h3>`, `<h4>`) based on their depth within the Feature and Page. Heading levels are consistent and never skip levels.
3. **Focus management** — Sections that dynamically add or remove content manage focus appropriately (return focus to trigger element, move focus to new content, or announce changes).
4. **Live regions** — Sections that update content asynchronously use `aria-live` regions to announce changes to screen readers.
5. **Keyboard navigation** — Interactive Sections support full keyboard navigation with visible focus indicators.
6. **Colour contrast** — Section-level colour choices (backgrounds, borders, decorative elements) maintain WCAG 2.2 AA contrast ratios against adjacent Section backgrounds.
7. **Reduced motion** — Sections with animations respect `prefers-reduced-motion` and provide non-animated alternatives.

```tsx
// Example Section wrapper with a11y
<section aria-labelledby="statistics-heading">
  <h2 id="statistics-heading" className="sr-only">
    Key Statistics
  </h2>
  {/* Section content */}
</section>
```

### Trade-offs

- _Comprehensive a11y_ at the Section level increases markup but ensures accessibility is built in, not retrofitted.
- _Minimal a11y_ at the Section level (relying on Components to handle a11y) misses Section-level concerns like heading hierarchy and landmark regions.

### Industry Best Practice

WCAG 2.2 AA compliance requires semantic structure, heading hierarchy, and focus management. ARIA Authoring Practices Guide (APG) provides patterns for common Section-level widgets.

### Recommendation

Apply the seven-point accessibility checklist to every Section during development. Section-level a11y violations are review-blocking.

---

## 26. Section Performance Strategy

### Purpose

Define performance best practices specific to the Section Layer.

### Engineering Rationale

Sections are the unit of lazy loading and code splitting within a Feature. Performance decisions at the Section level have direct impact on the Feature's perceived performance.

### Recommended Option

**Performance checklist per Section:**

1. **Code splitting** — Heavy Sections (charts, maps, rich text editors) use dynamic imports with `next/dynamic` or `React.lazy()`. The Feature orchestrates the loading boundary.
2. **Bundle size budget** — A Section's JS bundle (excluding shared dependencies) should not exceed 20 KB. Use bundle analysis to verify.
3. **CSS footprint** — Section-specific styles use Tailwind utility classes. No Section imports its own CSS file.
4. **Image optimisation** — All images within the Section use `next/image` with explicit dimensions and appropriate loading strategy (`lazy` for below-fold, `eager` for above-fold).
5. **Memoisation** — Client Sections use `React.memo` for Section components that receive the same props frequently. Use `useMemo` and `useCallback` for expensive computations within the Section.
6. **Render optimisation** — Sections that render lists use virtualisation (e.g., `@tanstack/react-virtual`) for lists exceeding 50 items.
7. **Server Component preference** — Sections default to Server Components. Client Sections are explicitly marked with `"use client"` and justified by interactivity requirements.

### Trade-offs

- _Strict bundle budgets_ may force Section splitting or deferring non-critical presentation concerns.
- _No bundle budgets_ allows Section bloat over time, increasing the Feature's bundle size.

### Industry Best Practice

Next.js performance recommendations, Core Web Vitals targets, and React's Server Component model all apply at the Section level. Section-level code splitting complements Feature-level code splitting.

### Recommendation

Apply the performance checklist to every Section. Measure Section bundle size during architectural reviews. Heavy Sections (charts, maps, media) are top candidates for dynamic imports.

---

## 27. Section Communication

### Purpose

Define how Sections communicate with the Feature and with each other.

### Engineering Rationale

Sections must sometimes coordinate (e.g., selecting an item in one Section updates details in another). Direct Section-to-Section communication creates tight coupling. A mediated approach preserves Section isolation.

### Recommended Option

**Feature-mediated communication only.**

Communication patterns ordered by preference:

| Pattern                          | Mechanism                                                                                  | When to use                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **Props from Feature**           | Feature passes scoped data to each Section                                                 | When Section B needs data that Section A also uses                                         |
| **Callback to Feature**          | Section A calls `onAction` → Feature updates state → Feature passes new props to Section B | When Section A triggers a change that affects Section B                                    |
| **Lifted state in Feature**      | Feature holds shared state, passes it to both Sections, and provides setter callbacks      | When two Sections read and write the same UI state (e.g., selected item, active filter)    |
| **URL as communication channel** | One Section writes to searchParams, another reads                                          | When coordination is about filter state, sort order, or active tab (survives page refresh) |

**Forbidden patterns:**

- Section A directly imports from Section B's directory
- Section A calls Section B's hooks or modifies Section B's state
- Sections share a Zustand slice directly without Feature mediation

### Trade-offs

- _Feature-mediated communication_ is explicit and testable but requires the Feature to understand coordination needs of all its Sections.
- _Direct Section-to-Section communication_ is convenient but creates implicit dependencies that violate Section isolation.

### Industry Best Practice

The Mediator pattern (Sections communicate through the Feature orchestrator) is a well-established design pattern. It is the architectural equivalent of "props down, events up" applied at the Section-Feature boundary.

### Recommendation

All cross-Section communication goes through the Feature. If multiple Sections within a Feature repeatedly communicate, consider whether they should be a single Section or whether a shared sub-component should be extracted.

---

## 28. Shared vs Section Code Rules

### Purpose

Define what belongs in a Section vs what belongs in the Feature's shared directories or the application's shared directories.

### Engineering Rationale

The tension between "keep it in the Section" and "promote it to the Feature" is constant. Rules eliminate decision fatigue and prevent architectural drift.

### Recommended Option

**The Three-Question Test for Section sharing:**

A piece of code belongs outside the Section (in Feature `_components/`, `_utils/`, `_types/`, etc.) only if all three answers are "yes":

1. **Multi-Section test:** Is this code used by two or more Sections within the Feature?
2. **Feature-scoped test:** Is this code specific to the Feature (not generic enough for `@/components/` or `@/lib/`)?
3. **Stable-surface test:** Is this code's interface unlikely to change because of a single Section's requirements?

If any answer is "no," the code stays in the Section.

Additionally:

| Shared directory       | What goes there                       | Does NOT go there                       |
| ---------------------- | ------------------------------------- | --------------------------------------- |
| Feature `_components/` | Components used by 2+ Sections        | Section-specific sub-components         |
| Feature `_utils/`      | Utilities used by 2+ Sections         | Section-specific display helpers        |
| Feature `_types/`      | Types used by 2+ Sections             | Section-specific props interfaces       |
| Feature `_constants/`  | Constants used by 2+ Sections         | Section-specific labels and limits      |
| `@/components/`        | UI primitives used by 2+ Features     | Feature-specific compositions           |
| `@/lib/`               | Generic utilities used by 2+ Features | Display helpers specific to one Feature |

### Trade-offs

- _Strict sharing rules_ may cause temporary duplication across Sections. This is acceptable — duplication within a Feature is cheaper than incorrect abstraction.
- _Loose sharing rules_ create Feature-level code coupled to specific Section requirements, making changes risky.

### Industry Best Practice

The Rule of Three applies at every level: duplicate within the Section twice, then promote to the Feature. Duplicate within the Feature twice, then promote to the application.

### Recommendation

Apply the Three-Question Test before moving any code from a Section to a Feature-level shared directory. Default to Section-local. Promote only when the second consumer exists.

---

## 29. Dependency Rules

### Purpose

Define the complete dependency graph for the Section Layer and enforce it.

### Engineering Rationale

A Section's dependencies determine its coupling to the rest of the Feature and the application. Explicit rules prevent circular dependencies and architectural erosion at the Section level.

### Recommended Option

**Allowed import sources for a Section:**

```
✅ Allowed:
  Feature _types/            (shared domain types within the Feature)
  Feature _constants/        (shared constants within the Feature)
  Feature _components/       (shared components within the Feature)
  Feature _utils/            (shared utilities within the Feature)
  @/types/                   (shared domain types)
  @/lib/                     (generic utilities, data functions)
  @/components/              (UI primitives, generic layout)
  @/config/                  (application configuration)
  @/hooks/                   (generic hooks)
  React, Next.js, Zod        (framework and utility libraries)

❌ Forbidden:
  Other Sections             (no importing from another Section's file or directory)
  Feature _services/         (Sections do not call business logic directly)
  Feature _state/            (Sections do not access state stores directly)
  Feature _hooks/            (Sections do not use Feature-level hooks)
  Feature _validation/       (Sections do not validate domain entities)
  @/features/<other>        (Sections do not import from other Features)
  @/app/                     (Sections do not import pages or layouts)
```

### Trade-offs

- _Strict dependency rules_ require discipline and review but guarantee a healthy dependency graph within the Feature.
- _Permissive dependencies_ are easier initially but lead to Section coupling that makes the Feature hard to refactor.

### Industry Best Practice

Clean Architecture's dependency rule (dependencies point inward) applies at every architectural layer. The Section dependency graph within a Feature must be a DAG (Directed Acyclic Graph).

### Recommendation

Enforce the dependency rules in code review. Any Section importing from another Section, from Feature services, or from the app layer is an architectural violation.

---

## 30. Section Testing Strategy

### Purpose

Define how Sections are tested in isolation and how tests relate to the Section's internal structure.

### Engineering Rationale

Section isolation enables Section-level testing without the rest of the Feature. Tests are the mechanism that verifies the isolation is real, not just aspirational.

### Recommended Option

**Two-tier Section testing:**

| Test tier             | What is tested                                             | Mechanism                                   | Dependencies                       |
| --------------------- | ---------------------------------------------------------- | ------------------------------------------- | ---------------------------------- |
| **Render tests**      | Section renders correctly with different prop combinations | Vitest + @testing-library/react             | Section component + test props     |
| **Interaction tests** | Section responds correctly to user interactions            | Vitest + @testing-library/react (userEvent) | Section component + callback mocks |

Rules:

- Section render tests verify: component renders, headings appear, data is displayed, empty state renders when no data, error state renders when data is invalid.
- Section interaction tests verify: callbacks fire with correct arguments, UI state changes correctly (open/close, select/deselect).
- Section tests mock nothing except callbacks (which are simple jest.fn()).
- Section tests do NOT require Feature-level services, state stores, or other Sections.
- Section tests do NOT import from `@/app/` or `@/features/`.

```tsx
// Example Section render test
describe("StatisticsSection", () => {
  it("renders statistics values", () => {
    render(
      <StatisticsSection
        totalMembers={150}
        activeMembers={89}
        upcomingEvents={3}
        pendingRequests={12}
      />,
    );
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("89")).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(
      <StatisticsSection
        totalMembers={0}
        activeMembers={0}
        upcomingEvents={0}
        pendingRequests={0}
      />,
    );
    expect(screen.getByText(/no statistics/i)).toBeInTheDocument();
  });
});
```

### Trade-offs

- _Two-tier testing_ requires more test files but provides targeted, fast tests at the Section level.
- _Feature-only integration tests_ (skipping Section tests) are simpler but make it harder to localise failures to specific Sections.

### Industry Best Practice

The Test Pyramid applies at every architectural layer. Section render tests are the base of the pyramid — fast, isolated, and numerous. Section interaction tests are the next level.

### Recommendation

Every Section has render tests for its normal, empty, and error states. Every Section with user interactions has interaction tests. Section tests never import from outside the Section and its allowed dependencies.

---

## 31. Section Documentation Strategy

### Purpose

Define how Sections are documented for both consumers (the Feature) and maintainers (developers).

### Engineering Rationale

Documentation is the primary mechanism for knowledge transfer at the Section level. Without a strategy, Section responsibilities become unclear and the `_sections/` directory accumulates orphans.

### Recommended Option

**Two documentation surfaces:**

| Surface                    | Audience            | Content                                                    | Location                               |
| -------------------------- | ------------------- | ---------------------------------------------------------- | -------------------------------------- |
| **Props JSDoc**            | Feature developers  | What the Section does, what each prop means, usage example | JSDoc on the Section component         |
| **Section header comment** | Section maintainers | Classification, lifecycle, rendering mode, special notes   | Comment at the top of the Section file |

The Section component JSDoc:

````tsx
/**
 * StatisticsSection
 *
 * Displays key metrics for the Dashboard Feature: total members, active members,
 * upcoming events, and pending requests.
 *
 * @example
 * ```tsx
 * <StatisticsSection
 *   totalMembers={150}
 *   activeMembers={89}
 *   upcomingEvents={3}
 *   pendingRequests={12}
 * />
 * ```
 */
````

The Section header comment:

```tsx
// Section: StatisticsSection
// Rendering: Server
// Data: Props-only
// Interaction: Passive
// Parent: DashboardFeature
```

### Trade-offs

- _JSDoc + header comment_ provides comprehensive documentation but requires upkeep during Section refactoring.
- _Code-only documentation_ is always up to date but assumes the reader can infer Section intent from implementation.

### Industry Best Practice

Documentation-as-code (JSDoc, header comments) is standard in open-source and enterprise projects. Section-level documentation follows the same pattern at a smaller scale.

### Recommendation

Every Section has a header comment with classification and a JSDoc on its public component with props documentation. Documentation is reviewed alongside Section code.

---

## 32. Section Maintainability

### Purpose

Define practices that ensure Sections remain maintainable over time.

### Engineering Rationale

Sections are long-lived. They will be modified by different developers over months and years. Without maintainability guidelines, Sections accumulate technical debt faster than Features do.

### Recommended Option

**Maintainability rules for Sections:**

1. **File size budget** — No single Section file exceeds 80 lines. Extract sub-components, hooks, or utilities when approaching this limit.
2. **One Section per file** — Each file in `_sections/` contains exactly one Section component. Multiple Sections in one file violate discoverability.
3. **No barrel files inside `_sections/`** — `_sections/` is a directory of independent files, not a module with a barrel. The `feature.tsx` imports directly from `_sections/<section>.tsx`.
4. **Props interface stability** — Once a Section's props interface is consumed by the Feature, changes to it require Feature-level review. Prefer additive changes (new optional prop) over breaking changes.
5. **Deprecation path** — When a Section is replaced, the old file remains for one cycle with a `@deprecated` JSDoc tag and a comment pointing to the replacement.

### Trade-offs

- _80-line file budget_ forces early extraction for Sections but prevents unmanageable files.
- _Props interface stability_ adds rigour to Section-Feature contracts but may slow down Section evolution.

### Industry Best Practice

File size budgets, single-responsibility files, and interface stability are standard in maintainable codebases. The 80-line budget matches the Feature layer convention (Stage 5).

### Recommendation

Apply the maintainability rules to every Section. Configure ESLint's `max-lines` at 80 for Section files. Props interface changes require Feature-level review.

---

## 33. Section Scalability

### Purpose

Design the Section Layer to accommodate Feature growth without structural changes.

### Engineering Rationale

The complexity of Features will grow. New presentation concerns will be identified within existing Features. The architecture must scale linearly — adding a Section to a Feature should not require changing existing Sections.

### Recommended Option

**Zero-impact Section addition.**

Adding a new Section to an existing Feature requires:

1. Create the Section file in `@/features/<name>/_sections/`.
2. Export a single component with typed props.
3. Import and compose in `feature.tsx`, passing the required props.

No existing Section needs to change. The Feature's props interface may need expansion if the new Section requires data not currently fetched, but this only affects `feature.tsx` and the Page, not other Sections.

This is possible because:

- Sections are isolated by design (Section 8).
- Sections communicate only through the Feature (Section 27).
- Shared code within the Feature is stable (Section 28).
- The Feature orchestrates Sections without knowing their internals.

### Trade-offs

- _Zero-impact addition_ is achievable only with strict adherence to the isolation and dependency rules.
- _Expedient addition_ (modifying existing Sections to accommodate a new Section) is faster initially but erodes the architecture.

### Industry Best Practice

The Open-Closed Principle applies at the Section level: Sections should be open for extension (new Sections added) but closed for modification (existing Sections unchanged).

### Recommendation

Test scalability by periodically simulating the addition of a new Section to a Feature. If any file outside the new Section or the Feature orchestrator must change, the architecture has a violation.

---

## 34. Future Expansion Strategy

### Purpose

Design the Section Layer to accommodate future presentation needs without structural changes.

### Engineering Rationale

The Alumni Management System will evolve. New presentation regions will be identified within existing Features. The architecture must not require Section layer reworks when new presentation concerns emerge.

### Recommended Option

**Section discovery path for new presentation concerns:**

When a new presentation region is identified within a Feature:

1. **Is it a new Section?** Apply the Three-Question Test (Section 6). If the region can be described as one presentation concern and has a distinct visual boundary, it is a new Section.
2. **Create the Section file.** Use single-file form by default. Export one component with typed props.
3. **Wire into the Feature.** Import the Section in `feature.tsx` and pass the required props from existing Feature data or from a new data dependency.
4. **Test independently.** Section render and interaction tests should pass before the Section is wired into the Feature.

This process requires no changes to:

- Existing Sections (they are isolated by design)
- The Feature's internal architecture
- The Page layer (unless the new Section requires data the Page does not currently fetch)
- Other Features

### Trade-offs

- _Structured Section discovery_ formalises the addition process but may feel bureaucratic for trivial Sections.
- _Ad-hoc Section creation_ is faster but risks creating Sections that violate the architectural conventions.

### Industry Best Practice

Incremental architecture (Martin Fowler, Rebecca Parsons) advocates for adding structure as needed rather than over-engineering upfront. Section discovery follows this principle: add Sections when the Feature's composition warrants it.

### Recommendation

Document the Section discovery process. Follow the four-step process for every new Section. Do not create Sections preemptively — add them when the Feature's composition would exceed 80 lines or when clear presentation boundaries emerge.

---

## 35. Section Best Practices

### Purpose

Summarise all guidelines into a concise, actionable checklist.

### Engineering Rationale

A single best-practices document is more useful than 34 scattered sections. This checklist serves as the canonical reference for Section development and review.

### Recommended Option

**The Section Layer checklist:**

- [ ] **Single presentation concern** — Section represents exactly one visual region (passes the "no and" test).
- [ ] **Canonical structure** — Single-file Section or subdirectory with `_components/`, `_hooks/`, `_types/`, `_constants/` as needed.
- [ ] **Minimal public interface** — Section exports exactly one component with explicitly typed props.
- [ ] **No internal leaks** — No external module (another Section, the Feature, another Feature) imports the Section's internals.
- [ ] **No cross-Section imports** — Section does not import from another Section's file or directory.
- [ ] **No business logic** — Section contains zero domain business logic (all logic is in Feature `_services/`).
- [ ] **No Feature service imports** — Section does not import from `_services/`, `_state/`, `_validation/`, or `_hooks/` at the Feature level.
- [ ] **Props-only data** — Section receives all data via props from the Feature orchestrator.
- [ ] **Callback-based interactions** — Section communicates user actions to the Feature via callback props.
- [ ] **Section-owned loading** — Section renders a skeleton when its data is loading.
- [ ] **Section-owned empty states** — Section renders appropriate messaging when its data is empty.
- [ ] **Section-owned error states** — Section handles display errors inline; critical errors propagate to Feature.
- [ ] **Section-owned UI state** — Section manages its own open/closed, selected/unselected, expanded/collapsed state.
- [ ] **A11y compliance** — Section uses semantic wrappers, correct heading hierarchy, focus management, `aria-live` regions.
- [ ] **Performance checklist** — Server Component by default, dynamic imports for heavy sub-components, memoisation where beneficial.
- [ ] **Zero permission checks** — Section receives visibility flags as props; never checks roles internally.
- [ ] **File size budget** — No single Section file exceeds 80 lines.
- [ ] **Documentation** — Header comment with classification, JSDoc on the public component with props documentation.
- [ ] **Tests exist** — Render tests for normal/empty/error states; interaction tests for user interactions.

### Trade-offs

- _Full checklist_ adds review time but guarantees architectural consistency at the Section level.
- _Abbreviated checklist_ is faster but misses violations that accumulate into architectural debt.

### Industry Best Practice

Architecture review checklists are standard practice in enterprise engineering organisations. This checklist serves the same role for the Section Layer as the Feature Layer checklist serves for Features.

### Recommendation

Apply the 19-point checklist to every Section during creation and during periodic architectural reviews. Include it in the PR template alongside the Feature Layer checklist.

---

## Architecture Summary

```
Page (page.tsx)
  │
  │  import { FeatureName } from "@/features/<name>"
  │  import type { FeatureData } from "@/features/<name>"
  │
  ▼
Feature (feature.tsx)
  │
  │  import { SomeSection } from "./_sections/some-section"
  │  import { AnotherSection } from "./_sections/another-section"
  │
  │  // Transform data using Feature _services/
  │  // Compose Sections with scoped props
  │  // Wrap async Sections in Suspense
  │
  ▼
Sections (_sections/)
  │
  │  import components from _components/
  │  import primitives from @/components/
  │
  ▼
Components (_components/ or @/components/)
  │
  │  import types from _types/
  │  import constants from _constants/
  │
  ▼
Primitive UI (Tailwind, @/components/primitives/)
```

### Dependency flow (allowed imports):

```
Section → Feature _components/, _types/, _constants/, _utils/
Section → @/components/, @/types/, @/lib/, @/config/
Section → React, Next.js, utility libraries
```

### Forbidden imports:

```
Section → Another Section's directory
Section → Feature _services/, _state/, _validation/, _hooks/
Section → @/features/<other>/
Section → @/app/
```

### Data flow:

1. Feature fetches or receives data and transforms it using `_services/`.
2. Feature passes scoped data props to each Section.
3. Section validates props (TypeScript), derives display values, and renders.
4. User interactions flow through Section hooks → callback props → Feature.
5. Feature processes the interaction (calling services, updating state) and passes updated props.
6. Loading, empty, and error states are owned and rendered by each Section independently.
