# Stage 7 — Component Layer Specification

**Status:** Implemented  
**Dependencies:** Stage 6 (Section Layer)  
**Next:** Stage 8 (Styling Layer)
**Implemented:** 2026-07-09
**Validator:** opencode (deepseek-v4-flash-free)

---

## 1. Component Philosophy

### Purpose

Define the fundamental nature of a Component and how it differs from a Section, a Feature, and a UI Primitive.

### Engineering Rationale

Without a clear philosophy, components become either too coarse (absorbing Section-level orchestration) or too fine (duplicating UI Primitives). A Component is not a Section, a Feature, or a low-level `<button>`. It is a **reusable presentation unit** that implements exactly one UI responsibility. Treating it as such enforces a consistent decomposition pattern across all Sections, prevents presentation logic from accumulating in Section files, and enables independent testing and reuse.

### Recommended Option

**Component as Single-Responsibility Presentation Unit.** Every Component corresponds to exactly one visual or interactive concern:

- **Card Components:** `StatCard`, `ProfileCard`, `EventCard`, `JobCard`
- **List Components:** `EventListItem`, `ConversationListItem`, `ActivityItem`
- **Form Components:** `FormField`, `FormSelect`, `FormTextarea`, `FormCheckbox`
- **Feedback Components:** `Badge`, `Toast`, `AlertBanner`, `ProgressIndicator`
- **Navigation Components:** `TabBar`, `Breadcrumb`, `PaginationControls`
- **Display Components:** `Avatar`, `DateDisplay`, `RichTextRenderer`, `StatusIndicator`

Each Component is a self-contained presentation unit that:

- Accepts data and callbacks via a typed props interface
- Composes UI Primitives (from `@/components/ui/`) into meaningful groupings
- Owns its internal layout, styling, and accessibility attributes
- Manages its own UI state (hover, focus, expanded) internally
- Can be developed, tested, and reused independently of any Section

A Component must be describable in one sentence using the pattern: "The Component is responsible for rendering [a single UI concern]." If the sentence needs "and," split the Component.

### Trade-offs

- _Fine-grained Components_ maximise reusability but increase the number of files a Section must compose.
- _Coarse-grained Components_ reduce import count within a Section but create internal coupling that makes partial reuse impossible.

### Industry Best Practice

Atomic Design's "molecules" (Brad Frost), React's composition model, and the Single Responsibility Principle all converge on Components as single-concern units. Enterprise design systems (Material UI, Radix, Reach UI) follow this pattern.

### Recommendation

Every Component implements exactly one UI responsibility. A Component that renders a card, handles its own hover animation, and manages its own selected state is correct. A Component that renders a card, validates an email field, and fetches user data is violating the architecture.

---

## 2. Component Architecture

### Purpose

Define the structural organisation of Components within the codebase and how they relate to Features and the shared layer.

### Engineering Rationale

Every Component needs a predictable home so developers can find, update, or reuse any Component without searching the entire codebase. The architecture must distinguish between Feature-private Components and shared Components.

### Recommended Option

**Two-tier Component storage with a promotion path.**

```
Feature-private Components:
  @/features/<name>/_components/
    feature-select.tsx
    feature-table.tsx
    feature-card.tsx

Shared Components:
  @/components/
    ui/                          — Generic UI Primitives (no business logic)
      button.tsx
      input.tsx
      card.tsx
      badge.tsx
    data-display/                — Data-presentation Components
      avatar.tsx
      date-display.tsx
      status-indicator.tsx
    feedback/                    — Feedback and notification Components
      toast.tsx
      alert-banner.tsx
      progress-indicator.tsx
    form/                        — Form-related Components
      form-field.tsx
      form-select.tsx
      form-checkbox.tsx
    navigation/                  — Navigation-related Components
      tabs.tsx
      breadcrumb.tsx
      pagination.tsx
    layout/                      — Layout Components (Stage 3)
      shell.tsx
      topbar.tsx
      footer.tsx
    skeletons/                   — Skeleton Components (Stage 3)
      skeleton.tsx
```

Rules:

- A Component starts life in the Feature that creates it (`_components/`).
- A Component is promoted to `@/components/` only when a second Feature needs it.
- Shared Components are organised by category subdirectory under `@/components/`.
- Each shared Component subdirectory contains an `index.ts` barrel export.

### Trade-offs

- _Two-tier storage_ provides clear ownership boundaries but requires discipline to avoid premature promotion.
- _Flat shared Component directory_ is simpler to navigate for small projects but becomes unmanageable beyond 20–30 Components.

### Industry Best Practice

Component libraries and design systems (shadcn/ui, Radix, MUI) organise Components by category. Feature-oriented architectures place Feature-private Components inside the Feature directory.

### Recommendation

Create all new Components in their Feature's `_components/`. Promote to `@/components/<category>/` only when reuse is proven. Document the promotion rationale.

---

## 3. Component Responsibilities

### Purpose

Define exactly what a Component owns and what it delegates to its parent Section or to UI Primitives.

### Engineering Rationale

Responsibility boundaries prevent logic leakage from the Section into the Component and from the Component into UI Primitives. If every architectural layer knows what it owns, there is no ambiguity about where a concern belongs.

### Recommended Option

**The Component owns eight responsibilities:**

1. **Presentation rendering** — Translating props into visual output via composition of UI Primitives.
2. **Internal layout** — Spacing, alignment, and arrangement of UI Primitives within the Component's surface area.
3. **Props handling** — Receiving typed props, providing default values, and deriving display values.
4. **Local UI state** — Managing hover, focus, expanded, selected, and animation state using `useState`.
5. **Local event handling** — Handling native DOM events (click, keydown, change) and translating them to callback props.
6. **Accessibility** — Applying ARIA attributes, roles, labels, focus management, and keyboard navigation within the Component.
7. **Styling** — Applying design tokens and Tailwind classes to achieve the intended visual output.
8. **Animation** — Managing entry, exit, transition, and micro-interaction animations.

**The Component delegates:**

- **Data fetching** — To the Section or Feature (via props).
- **Business logic** — To the Feature's `_services/` or backend.
- **Domain validation** — To the Feature's `_validation/`.
- **Feature orchestration** — To the Section or Feature.
- **Persistent state** — To the Feature's `_state/` or global stores.
- **Layout composition** — To the Section (the Section owns Section-level layout).

### Trade-offs

- _Eight responsibilities_ is comprehensive but can feel heavy for a Component that only renders a styled label.
- _Partial implementation_ is acceptable — a purely display Component has no local event handling or animation.

### Industry Best Practice

Separation of Presentation from Logic is a cornerstone of clean architecture. Components own presentation; Sections own orchestration. This mirrors the View boundary in MVP and MVVM patterns.

### Recommendation

Apply the eight-responsibility model to every Component. Empty or omitted responsibilities are acceptable and informative. A Component that acquires data fetching or business logic is a sign those concerns should be lifted to the Section or Feature.

---

## 4. Component Characteristics

### Purpose

Define the essential qualities every Component must exhibit.

### Engineering Rationale

Characteristics serve as architectural acceptance criteria. A Component that does not meet these qualities is not well-architected and should be refactored.

### Recommended Option

**Six essential characteristics:**

| Characteristic     | Definition                                                                 | Test                                                                                        |
| ------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Cohesion**       | The Component addresses exactly one UI concern                             | Can you describe the Component without using "and"?                                         |
| **Composability**  | The Component provides a clean component interface with typed props        | Does the Section use the Component as `<StatCard value={...} label={...} />`?               |
| **Encapsulation**  | The Component hides all internal implementation details                    | Can an external module access the Component's internal state or sub-components? (No → good) |
| **Testability**    | The Component can be tested in isolation by rendering it with props        | Can you write a unit test that imports only the Component's public export?                  |
| **Predictability** | The Component renders the same output for the same props (no side effects) | Does the Component render deterministically given the same props?                           |
| **Replaceability** | The Component can be rewritten entirely without changing its consumers     | Can you replace the Component's internals without changing its props interface?             |

### Trade-offs

- _Strict characteristics_ increase development discipline but prevent architectural debt at the Component level.
- _Relaxed characteristics_ accelerate initial delivery of Components but create coupling that resists refactoring.

### Industry Best Practice

SOLID principles — particularly Single Responsibility and Open-Closed — apply at every architectural layer. The six characteristics translate these principles to the Component Layer.

### Recommendation

Apply the six-characteristic checklist to every Component during creation and during architectural reviews. Violations require written justification.

---

## 5. Component Classification

### Purpose

Categorise Components by their rendering mode, data dependency, and interaction level.

### Engineering Rationale

Different Components have different rendering and data requirements. Classification makes these explicit and prevents applying Server Component rules to interactive Components or vice versa.

### Recommended Option

**Three-axis classification:**

| Axis                | Categories                                                                                               | Examples                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Rendering**       | Server (no `"use client"`), Client (`"use client"`), Hybrid (static shell + client interactivity)        | `DateDisplay` (Server), `FormField` (Client), `PaginationControls` (Hybrid — initial render server, pagination client) |
| **Data dependency** | Static (hardcoded content), Props-only (receives all data), Context-dependent (reads from React context) | `Badge` (Props-only), `StatCard` (Props-only), `ThemeToggle` (Context-dependent)                                       |
| **Interaction**     | Passive (display only), Reactive (responds to user input), Active (initiates actions)                    | `StatusIndicator` (Passive), `FormSelect` (Reactive), `SubmitButton` (Active)                                          |

Classification is documented as a comment at the top of the Component file:

```tsx
// Component: StatCard
// Rendering: Server
// Data: Props-only
// Interaction: Passive
```

### Trade-offs

- _Three-axis classification_ adds documentation overhead but clarifies design decisions for every Component.
- _Implicit classification_ (relying on reading the code) is faster but causes miscommunication during refactoring.

### Industry Best Practice

Multi-axis classification is standard in enterprise UI architecture (e.g., IBM Carbon, SAP Fiori). The same principle applies at the Component level within the architecture stack.

### Recommendation

Document every Component's classification as a header comment. Use classification during architectural reviews to verify that design decisions match the classification.

---

## 6. Component Granularity

### Purpose

Determine the right size for a Component — when to split and when to merge.

### Engineering Rationale

Granularity is the most common architectural mistake at the Component level. Components that are too large become untestable presentation monoliths. Components that are too small cause import sprawl within the Section.

### Recommended Option

**The Three-Question Test for Components.** A Component has the right granularity if all three answers are "yes":

1. **Single-concern test:** Can the Component be described as one UI concern without "and"?
2. **Independent-render test:** Can the Component be rendered in isolation (e.g., in Storybook) with only its props?
3. **Replaceable-unit test:** Could the Component be replaced with a different implementation without changing the Section that uses it?

If the answer to any is "no," split the Component. If splitting creates Components too small to justify their own props interface (fewer than 2 meaningful props), merge them into a parent Component.

### Additional guideline: The 80-line budget

A Component file should not exceed 80 lines of meaningful code (excluding imports, types, and constants). When a Component exceeds this budget, extract sub-Components into the same `_components/` directory.

```tsx
// Before (violation): 120-line StatCard with embedded metric chart
// After (compliant): StatCard (40 lines) composes StatMetricChart (35 lines)
```

Exceptions:

- Form Components with many fields may reach 120 lines before extraction.
- Table Components with complex column rendering may reach 150 lines.
- Any Component exceeding 150 lines MUST be decomposed regardless of type.

### Trade-offs

- _Finer granularity_ increases Component count within a Feature but improves isolation and testability.
- _Coarser granularity_ reduces Component count but creates internal coupling that makes visual changes risky.

### Industry Best Practice

The Single Responsibility Principle applied to presentation: a Component should have one reason to change. If a style change would affect only part of a Component, the Component should be split.

### Recommendation

Apply the Three-Question Test during Component creation and every major refactor. Enforce the 80-line budget as a soft limit (120-line hard limit for complex Components, 150-line absolute maximum).

---

## 7. Component Boundaries

### Purpose

Define where each Component begins and ends within a Feature's `_components/` directory.

### Engineering Rationale

Boundaries prevent Components from reaching into each other's implementation. Clear boundaries make the presentation dependency graph explicit and analyzable.

### Recommended Option

**Rigid boundaries within the Feature's `_components/` directory.**

- Each Component lives as a file within `@/features/<name>/_components/`.
- The only public interface from one Component to another within the same Feature is through the Section that composes them.
- Component A never imports Component B's file directly if Component B is a sibling in the same `_components/` directory — both should be composed by the Section.
- Component A may import Component B only if Component B is a sub-Component explicitly extracted from Component A (prefixed with the parent Component name, e.g., `stat-card-chart.tsx` is a sub-Component of `stat-card.tsx`).

Sub-Components extracted from a parent Component follow a strict naming convention:

```
_component/
  stat-card.tsx            — Public: imported by Sections
  stat-card-chart.tsx      — Private: imported only by stat-card.tsx
  stat-card-trend.tsx      — Private: imported only by stat-card.tsx
```

A sub-Component filename is prefixed with the parent Component name followed by a hyphen. No Component outside the parent may import a sub-Component. This convention makes the ownership hierarchy visible in the file system.

### Trade-offs

- _Rigid boundaries_ prevent Component coupling but may require extracting shared code to the Feature's shared `_components/` level.
- _Permissive boundaries_ (Components importing from each other freely) are convenient short-term but create invisible dependencies.

### Industry Best Practice

Component architecture in design systems enforces boundaries between levels. Components are analogous to Atomic Design's "molecules" — they compose "atoms" (UI Primitives) but never reach into other "molecules" except through explicit parent-child extraction.

### Recommendation

Enforce the boundary convention in code review. A Component importing from another sibling Component (without the parent-child prefix convention) is a review-blocking violation. The only legitimate cross-Component interaction is through the Section orchestrator or through explicit sub-Component extraction.

---

## 8. Component Isolation

### Purpose

Ensure that a Component can be developed, tested, and reasoned about without knowledge of other Components in the same Feature or Section.

### Engineering Rationale

Isolation is the precondition for parallel development and independent testing. If a developer must understand three other Components to work on one, the Component architecture has failed.

### Recommended Option

**Strict isolation with three rules:**

1. **No cross-Component direct imports (except parent-child extraction).** A Component may only receive data from the Section via props. It never imports another sibling Component's file.
2. **No shared mutable state between Components.** Components own their UI state internally. Cross-Component state synchronization happens through the Section (lifting state up).
3. **No business logic in Components.** Components receive already-processed, display-ready data. They do not call Feature services, validation functions, or data-fetching functions.

### Trade-offs

- _Strict isolation_ sometimes requires the Section to mediate between Components. This is acceptable — the Section's role includes coordination.
- _Loose isolation_ allows Components to communicate directly but creates implicit dependencies that break during refactoring.

### Industry Best Practice

The Principle of Least Privilege applied to presentation: a Component should have access to only the data it needs, not the Section's entire data model or the Feature's services.

### Recommendation

Enforce the three isolation rules as architectural invariants. A Component that imports from another sibling Component (outside the parent-child extraction pattern) or calls a Feature service directly is an architectural violation.

---

## 9. Component Public Interface

### Purpose

Define how each Component exposes itself to the Section that composes it.

### Engineering Rationale

The Component's public interface is its contract with the Section. A well-designed interface makes the Component easy to compose and hard to misuse.

### Recommended Option

**Default export of the primary Component with a named props interface.**

Each Component file exports exactly one primary Component as the default export and its props interface as a named export:

```tsx
// _components/stat-card.tsx
export interface StatCardProps {
  label: string;
  value: number | string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, trend, icon }: StatCardProps) { ... }
```

The Section imports the Component using a default import for the Component and a named import for the type:

```tsx
// _sections/quick-stats-section.tsx
import StatCard from "../_components/stat-card";
import type { StatCardProps } from "../_components/stat-card";
```

Rules for the public interface:

- **Default export for Component, named export for type.** This makes the primary export unmistakable while keeping the type accessible.
- **Props interface is always co-located.** Never define a Component's props in a separate types file — the props interface lives at the top of the Component file.
- **No additional exports from a Component file.** A Component file exports exactly one Component (default) and its props interface (named). Utility functions, constants, and sub-Components used internally are never exported.

### Trade-offs

- _Default export for Component_ makes renaming at import site easy but creates inconsistency if the codebase mixes default and named exports.
- _Named export for Component_ is more explicit for refactoring tools but requires consumers to know the exact export name.

### Industry Best Practice

React documentation recommends default exports for page-level components and named exports for reusable components. This specification adopts default exports for Components (which are composed, not routed to) to distinguish them from Page and Section exports.

### Recommendation

Every Component file uses a default export for the Component and a named export for its props interface. No other exports from a Component file.

---

## 10. Props Contract Strategy

### Purpose

Define how Component props are structured, typed, and documented to create predictable, self-documenting interfaces.

### Engineering Rationale

Props are the contract between the Section and the Component. A well-designed props contract prevents misuse, makes the Component's requirements explicit, and serves as living documentation.

### Recommended Option

**Flat, explicitly typed props with no compound model objects.**

| Principle                      | Guideline                                      | Example                                                              |
| ------------------------------ | ---------------------------------------------- | -------------------------------------------------------------------- |
| **Flat over nested**           | Pass primitive values rather than deep objects | `value`, `label`, `trend` instead of `data: { value, label, trend }` |
| **Explicit over destructured** | Define each prop explicitly in the interface   | `{ items: Item[]; onSelect: (id: string) => void }`                  |
| **Required over optional**     | Make props required unless genuinely optional  | `trend?: "up"                                                        | "down"` (optional default = "neutral") |
| **Primitive over complex**     | Use primitive types where possible             | `string` over `{ toString(): string }`                               |
| **Callback naming**            | Prefix callbacks with `on`                     | `onClick`, `onSelect`, `onChange`, `onSubmit`                        |
| **Boolean naming**             | Use `is` or `has` prefix for booleans          | `isDisabled`, `isLoading`, `hasError`                                |

```tsx
// Good: flat, explicit, typed
export interface StatCardProps {
  label: string;
  value: number;
  trend?: "up" | "down" | "neutral";
  isDisabled?: boolean;
  onSelect?: (value: number) => void;
}

// Avoid: compound model object
export interface StatCardProps {
  data: { label: string; value: number; trend: string }; // hides dependencies
}
```

**Rule for compound objects:** A Component may accept a compound object only if it destructures and uses every property of that object. If any property is unused, the object is too large and should be flattened.

### Trade-offs

- _Flat props_ increase the number of props but make data dependencies explicit and props type-checking precise.
- _Compound object props_ reduce prop count but hide data dependencies and make testing harder (must construct the full object even when testing a single behaviour).

### Industry Best Practice

TypeScript's type system makes flat props interfaces easy to define and maintain. Interface Segregation Principle (ISP) states that no consumer should depend on methods it does not use — flat props apply ISP to Component interfaces.

### Recommendation

Every Component defines flat, explicitly typed props. Compound model objects are prohibited. Each prop has a clear purpose visible from its type and name.

---

## 11. Event Communication Strategy

### Purpose

Define how Components communicate user interactions upward to Sections and Features.

### Engineering Rationale

Event communication is the mechanism by which user interactions flow from the Component (where they happen) to the Section or Feature (where they are handled). A consistent strategy prevents callback sprawl and makes data flow analyzable.

### Recommended Option

**Unidirectional callback chain: Component → Section → Feature.**

```
User interaction
    ↓
  Component calls props.onAction(data)
    ↓
  Section receives callback, enriches if needed
    ↓
  Section calls Feature-level callback
    ↓
  Feature handles business logic
```

Rules for callbacks:

1. **Prefix with `on`.** Every callback prop is prefixed with `on`: `onSelect`, `onChange`, `onDelete`.
2. **Pass minimal data.** Callbacks pass only the data the parent needs: `onSelect(itemId: string)` not `onSelect(event: React.MouseEvent)`.
3. **Type precisely.** Define callback signatures as part of the props interface.
4. **Keep optional.** Callbacks are optional unless the Component cannot function without them.
5. **No callback transformation in the Component.** The Component calls the callback with raw data. The Section or Feature transforms if needed.

```tsx
// Good: minimal, typed, optional
export interface ItemListProps {
  items: Item[];
  onSelect?: (itemId: string) => void;
}

// Avoid: raw DOM event passed up
export interface ItemListProps {
  items: Item[];
  onSelect?: (event: React.MouseEvent, item: Item) => void;
}
```

### Trade-offs

- _Minimal callback data_ keeps interfaces clean but may require the Section to reconstruct context (e.g., looking up the full item by ID).
- _Rich callback data_ provides full context to the Section but couples the callback signature to the Component's internal data shape.

### Industry Best Practice

React's "data flows down, events flow up" pattern is the canonical model. Callbacks as props are the standard mechanism. Lifting state up and passing callbacks down is the recommended React pattern.

### Recommendation

All Component-to-parent communication uses callback props prefixed with `on`. Callbacks pass the minimum data the parent needs. Never pass raw DOM events unless the parent explicitly needs event metadata.

---

## 12. Component Composition

### Purpose

Define how Components compose UI Primitives and how Sections compose Components.

### Engineering Rationale

Composition is the mechanism by which the architecture scales. A Component composes UI Primitives; a Section composes Components. Each layer is replaceable because it depends only on the layer below's public interface.

### Recommended Option

**Two-tier composition within the Section:**

| Composition              | From                                      | Into           | Mechanism                                                                   |
| ------------------------ | ----------------------------------------- | -------------- | --------------------------------------------------------------------------- |
| Component → UI Primitive | `@/components/ui/`                        | Component file | Import and compose UI Primitives with Component-specific layout and styling |
| Section → Component      | Feature `_components/` or `@/components/` | Section file   | Import Component, pass props, add Section-level layout                      |

The Section composes Components following this pattern:

```tsx
// Section composes Components with Section-level data and layout
<section>
  <ComponentOne items={data.items} onSelect={handleSelect} />
  <ComponentTwo value={data.total} label="Total" />
</section>
```

A Component composes UI Primitives following this pattern:

```tsx
// Component composes UI Primitives with Component-specific layout
function StatCard({ label, value }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Text variant="label">{label}</Text>
        <Text variant="value">{value}</Text>
      </CardContent>
    </Card>
  );
}
```

**Composition rules:**

- A Component never composes another Feature's Component directly. Cross-Feature reuse must go through the shared `@/components/` layer.
- A Component never composes a Section. Sections are higher in the hierarchy.
- A Component never composes a Feature's `feature.tsx`. Features are higher in the hierarchy.

### Trade-offs

- _Two-tier composition_ keeps each layer's responsibility clear but requires every Component to use UI Primitives rather than native HTML elements directly.
- _Direct HTML in Components_ is faster for simple Components but bypasses the design system and creates inconsistency.

### Industry Best Practice

React's composition model (children, render props, component injection) maps naturally to Component-based architecture. The Section → Component → UI Primitive hierarchy is a consistent composition chain.

### Recommendation

All Components compose UI Primitives for rendering. Direct use of bare HTML elements (e.g., raw `<div>`, `<button>`, `<input>`) is permitted only for Components that wrap those elements into styled Primitives. Components at the presentation layer always use `@/components/ui/` Primitives.

---

## 13. Smart vs Presentational Components

### Purpose

Define the distinction between Components that manage behaviour and Components that only render data.

### Engineering Rationale

The Smart vs Presentational distinction helps developers decide where to put state logic, event handling, and side effects. Mixing both concerns in a single Component makes it harder to test and reuse.

### Recommended Option

**Prefer Presentational Components by default. Extract Smart wrappers only when necessary.**

| Aspect          | Presentational Component            | Smart Component                      |
| --------------- | ----------------------------------- | ------------------------------------ |
| **Purpose**     | Render data via props               | Manage behaviour and state           |
| **State**       | None or minimal UI state            | Local UI state, form state           |
| **Data**        | Receives all data via props         | May fetch or derive data locally     |
| **Logic**       | Display formatting only             | Event handling, animation control    |
| **Reusability** | High — no assumptions about context | Lower — tied to specific behaviour   |
| **Testing**     | Trivial — render with props         | Requires mocking state and callbacks |
| **Example**     | `StatCard`, `Badge`, `Avatar`       | `AutocompleteInput`, `SortableTable` |

A Presentational Component is the default form. A Smart Component is created only when:

- The Component manages complex local state (multi-step input, drag-and-drop).
- The Component uses lifecycle effects (intersection observer, animation frame).
- The Component wraps a third-party library that requires state management.

When a Component transitions from Presentational to Smart, extract the state logic into a custom hook:

```tsx
// Smart Component delegates state to a hook
function AutocompleteInput({ items, onSelect }: AutocompleteInputProps) {
  const { query, results, handleChange } = useAutocomplete(items);
  return (
    <div>
      <Input value={query} onChange={handleChange} />
      <ResultsList items={results} onSelect={onSelect} />
    </div>
  );
}
```

### Trade-offs

- _Presentational-only_ maximises reusability but may require the Section to manage state that logically belongs in the Component.
- _Smart Components_ encapsulate behaviour but are harder to reuse in different contexts.

### Industry Best Practice

Dan Abramov's original Presentational/Container pattern has evolved into Hooks-based architecture. Modern React favours Presentational Components with Hooks extracting behaviour, keeping Components themselves stateless where possible.

### Recommendation

Default to Presentational Components. Extract behaviour into custom hooks when state complexity warrants it. A Component that exceeds three `useState` calls or one `useEffect` is a candidate for hook extraction.

---

## 14. Component State Ownership

### Purpose

Define which state belongs to a Component and how it is managed.

### Engineering Rationale

State ownership at the Component level prevents Section and Feature state from accumulating unrelated UI concerns. Component-local state enables isolation and independent testability.

### Recommended Option

**Two-tier state ownership with clear boundaries:**

| State type                   | Owner     | Mechanism                                 | Example                                               |
| ---------------------------- | --------- | ----------------------------------------- | ----------------------------------------------------- |
| **Component-local UI state** | Component | `useState` inside the Component           | Hover, focus, expanded, selected, input value         |
| **Section-level state**      | Section   | `useState` or `useReducer` in the Section | Selected item (shared between Components), active tab |
| **Feature-level state**      | Feature   | Zustand slice in `_state/`                | Current user preferences, fetched data, form state    |

Rules:

- A Component never reads another Component's local state.
- A Component never writes to Section or Feature state directly — it calls callbacks passed via props.
- Component-local state is never exposed outside the Component.
- If a Component's local UI state needs to be shared with another Component, lift it to the Section.

**State initialisation pattern:**

```tsx
export interface ExpandableCardProps {
  isExpanded?: boolean; // Optional: Section can control expansion
  title: string;
  children: React.ReactNode;
}

export default function ExpandableCard({
  isExpanded: controlled,
  title,
  children,
}: ExpandableCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = controlled ?? internalExpanded; // Controlled vs uncontrolled

  return (
    <Card onClick={() => setInternalExpanded(!expanded)}>
      <CardTitle>{title}</CardTitle>
      {expanded && <CardContent>{children}</CardContent>}
    </Card>
  );
}
```

This pattern supports both controlled (Section manages state) and uncontrolled (Component manages state) usage without breaking the isolation model.

### Trade-offs

- _Component-local state_ enables isolation but may cause prop drilling if multiple Components need the same UI state (lift to Section).
- _Section-level state for everything_ is convenient but accumulates UI concerns in the Section, breaking Component isolation.

### Industry Best Practice

React's "lifting state up" pattern applies at every layer. Colocation (keeping state where it is used) keeps Components self-contained. The combination of both principles creates the two-tier model.

### Recommendation

Components own their UI state. Sections own cross-Component state. Never share Component-local state between Components. Use callbacks for Component-to-Section communication. Support both controlled and uncontrolled patterns where appropriate.

---

## 15. Component Data Responsibilities

### Purpose

Define what data processing a Component may perform and what must remain in the Section or Feature.

### Engineering Rationale

Data processing in Components is the most common architectural violation at this layer. Components that transform, sort, filter, or compute data become untestable, unreusable, and tightly coupled to domain concerns.

### Recommended Option

**Components perform display formatting only.**

What a Component may do:

- Format data for display (date formatting, number formatting, string truncation, pluralisation).
- Derive UI state from props (e.g., `const isDisabled = items.length === 0`).
- Transform callback arguments minimally (e.g., `onChange={handleChange}` wraps raw event to extract value).

What a Component must NOT do:

- Sort or filter data arrays (the Section passes the already-filtered array).
- Compute business values (e.g., calculating percentages, totals, averages).
- Transform domain data structures (e.g., mapping API responses to display model).
- Validate domain entities (e.g., checking email format, password strength).
- Fetch or cache data from APIs.

```tsx
// ✅ Component-acceptable: display formatting
function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// ✅ Component-acceptable: UI state derivation
const isListEmpty = items.length === 0;

// ❌ Component-forbidden: data transformation
// const sortedItems = items.sort((a, b) => b.priority - a.priority);

// ❌ Component-forbidden: domain validation
// function isValidEmail(email: string): boolean { ... }
```

### Trade-offs

- _Zero data processing_ in Components maximises testability (tested at Section/Feature level) but may require the Section to pass more derived props.
- _Tolerating minor data processing_ (e.g., simple sorting) is pragmatic short-term but creates a slippery slope toward data logic scattered across the presentation layer.

### Industry Best Practice

Separating Presentation from Data Logic is a universal architectural principle. MVC, MVP, MVVM, and Clean Architecture all enforce this boundary. The Component-Section boundary is where this separation manifests at the UI layer.

### Recommendation

Zero domain data processing in Components. Any Component that sorts, filters, transforms, or validates domain data is violating the architecture. Lift the logic to the Section and pass the result as a prop.

---

## 16. Component Validation

### Purpose

Define how Components validate their inputs and user interactions.

### Engineering Rationale

Validation at the Component boundary catches prop mismatches early and provides clear error messages during development. Runtime validation of user interactions within a Component prevents invalid state from propagating.

### Recommended Option

**Two forms of Component-level validation:**

| Validation type            | What it checks                                                     | Mechanism                                                               | When it runs         |
| -------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- | -------------------- |
| **Props validation**       | Required props exist, props have correct types                     | TypeScript (compile-time) + default values for optional props (runtime) | Component definition |
| **Interaction validation** | User input within the Component is well-formed before calling back | Guard clauses in event handlers                                         | User interaction     |

```tsx
// ✅ Interaction guard: prevents empty submission
function handleSubmit(raw: string) {
  if (!raw.trim()) return;
  onSubmit(raw.trim());
}

// ✅ Props default: provides fallback for optional prop
const MAX_VISIBLE = 5;
function ItemList({ items, maxVisible = MAX_VISIBLE }: ItemListProps) { ... }
```

Domain validation (email format, password strength, date ranges) is NOT the Component's responsibility — the Section or Feature handles that.

**Validation rules:**

- Use TypeScript for compile-time props validation. Do not write runtime prop-type checks in production Components.
- Use default values for optional props instead of runtime null checks.
- Use guard clauses for interaction validation (prevent callback with invalid data).
- Never validate domain entities inside a Component.

### Trade-offs

- _Runtime props validation_ (e.g., `console.warn` in development) provides early warnings but adds noise and bundle size.
- _TypeScript-only validation_ is sufficient for most Components but does not catch runtime edge cases like `undefined` props from dynamic data.

### Industry Best Practice

TypeScript provides comprehensive compile-time validation for props. Default values handle the most common runtime case (optional prop not provided). Guard clauses handle the interaction case.

### Recommendation

Rely on TypeScript for props validation. Use default values for optional props. Use guard clauses for interaction validation. Domain validation belongs in the Section or Feature.

---

## 17. Component Loading Strategy

### Purpose

Define how Components communicate loading state when they receive data that may be delayed.

### Engineering Rationale

Loading states at the Component level enable granular skeleton rendering within a Section. Section-level loading states are the default; Component-level loading states are used when Components have independent visual structures.

### Recommended Option

**Two approaches based on loading pattern:**

| Loading pattern                        | Approach                                                                                           | When to use                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Section loads all data upfront**     | Section passes data as props; Component receives data or `null`/`undefined` and renders a skeleton | Components whose data is fetched by the parent Section                      |
| **Component loads data independently** | Component manages its own loading state via an `isLoading` prop                                    | Components that fetch their own data (rare — prefer Section-level fetching) |

For the first pattern (Section passes data), the Component renders a skeleton when data is not available:

```tsx
export interface StatCardProps {
  value?: number; // undefined while loading
  label: string;
}

export default function StatCard({ value, label }: StatCardProps) {
  if (value === undefined) return <StatCardSkeleton />;
  return (
    <Card>
      <CardContent>
        <Text>{label}</Text>
        <Text variant="value">{value}</Text>
      </CardContent>
    </Card>
  );
}
```

**Skeleton co-location rule:** Every Component that supports loading state co-locates its skeleton as a named export or a sibling file:

```tsx
// Co-located skeleton
export function StatCardSkeleton() {
  return <div className="animate-skeleton rounded-lg h-24 w-full" />;
}
```

Sub-Component skeletons follow the same naming convention: `stat-card-skeleton.tsx` for the skeleton of `stat-card.tsx`.

### Trade-offs

- _Component-level skeletons_ provide accurate loading states but require each Component to maintain its skeleton.
- _Section-level spinners_ are simpler but do not reflect the Component's layout, causing layout shift.

### Industry Best Practice

Skeleton screens are the recommended pattern for loading states in modern UI. Component-level skeletons align with the principle that Components own their loading experience.

### Recommendation

Every Component that accepts optional or async data co-locates a skeleton variant. Sections use Component skeletons as Suspense fallbacks for independently loading regions.

---

## 18. Component Error Handling

### Purpose

Define how Components handle errors internally and what they expose to the Section.

### Engineering Rationale

Error handling at the Component level must not swallow errors that the Section or Feature needs to handle, nor should it expose internal error details to users.

### Recommended Option

**Two-tier error handling:**

| Error severity      | What happens                                                        | Who handles it                                         |
| ------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| **Display errors**  | Data is missing, malformed, or invalid for this Component's concern | Component renders its error state inline               |
| **Critical errors** | The Component cannot render at all; fundamental data is unavailable | Component renders nothing or an error boundary trigger |

```tsx
export interface StatCardProps {
  value?: number;
  label: string;
  hasError?: boolean;
}

export default function StatCard({ value, label, hasError }: StatCardProps) {
  if (hasError) {
    return (
      <Card>
        <CardContent>
          <Text variant="error">Unable to load {label.toLowerCase()}.</Text>
        </CardContent>
      </Card>
    );
  }

  if (value === undefined) return <StatCardSkeleton />;

  return (
    <Card>
      <CardContent>
        <Text>{label}</Text>
        <Text variant="value">{formatCount(value)}</Text>
      </CardContent>
    </Card>
  );
}
```

**Error handling rules:**

- Components never use global error boundaries directly — they let errors propagate to the Section or Feature boundary.
- A Component that receives `hasError: true` renders its own error state with a user-friendly message.
- Error messages in Components are defined as Component constants, not hardcoded in JSX.
- A Component never catches errors from callback props. If a callback throws, it propagates to the Section.

### Trade-offs

- _Component-level error states_ provide granular error recovery but require each Component to implement its own error UI.
- _Section-level error boundaries_ are simpler but collapse the entire Section when one Component fails.

### Industry Best Practice

Error boundary placement should match the granularity of independent failure. If a Component can fail independently without affecting other Components, it should handle its own error state.

### Recommendation

Every Component that receives dynamic data implements a component-level error state for its specific failure modes. Critical errors propagate to the Section. Display errors are handled inline.

---

## 19. Component Empty States

### Purpose

Define how Components render when they receive an empty data set.

### Engineering Rationale

Empty states are part of the Component's domain — only the Component knows what messaging is appropriate when its specific data is empty. Generic empty messages create a poor user experience.

### Recommended Option

**Component-owned empty state with contextual messaging.**

Each Component defines how it renders when its primary data set is empty:

```tsx
export interface ItemListProps {
  items: Item[];
  emptyMessage?: string;
  onEmptyAction?: () => void;
}

export default function ItemList({ items, emptyMessage, onEmptyAction }: ItemListProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent>
          <Text>{emptyMessage ?? "No items to display."}</Text>
          {onEmptyAction && <Button onClick={onEmptyAction}>Add Item</Button>}
        </CardContent>
      </Card>
    );
  }

  return (
    <ul>
      {items.map((item) => (
        <ItemListItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
```

**Empty state rules:**

- Empty states include a clear message explaining what would appear here.
- Empty states may include a context-appropriate call-to-action.
- Empty state messages are configurable via props (the Section provides domain-specific messaging).
- Empty state visual indicators are consistent with the Component's purpose.
- Empty states distinguish between "no data yet" (empty initial state) and "no results" (after filtering/search).

### Trade-offs

- _Component-owned empty states_ give each Component full control over its empty experience but may lead to inconsistent styling across Components.
- _Shared empty state component_ provides consistency but cannot provide domain-specific messaging without excessive props.

### Industry Best Practice

Empty state design is a recognised UX pattern. Component ownership of empty states is consistent with the principle that Components own their entire user experience within the Section.

### Recommendation

Every Component that renders a dynamic data set implements at least one empty state. Empty messages are configurable via props. A shared `@/components/ui/empty-state/` provides the base UI, which Components customise for their context.

---

## 20. Component Accessibility

### Purpose

Define accessibility responsibilities that belong to the Component Layer.

### Engineering Rationale

Accessibility is a shared responsibility across all architectural layers. The Component Layer is responsible for the most granular accessibility concerns: semantic elements, ARIA attributes, keyboard interaction, focus management, and colour contrast.

### Recommended Option

**Component-level a11y checklist:**

1. **Semantic elements** — Every Component uses the most appropriate HTML element (`<button>`, `<nav>`, `<ul>`, `<li>`, `<article>`) rather than generic `<div>` with roles added.
2. **ARIA attributes** — Components that cannot use native semantic elements apply appropriate ARIA roles, states, and properties (`aria-expanded`, `aria-selected`, `aria-current`, `aria-label`, `aria-describedby`).
3. **Keyboard navigation** — All interactive Components support full keyboard navigation: Tab to focus, Enter/Space to activate, Arrow keys for directional navigation, Escape to dismiss.
4. **Focus management** — Components that dynamically show/hide content manage focus appropriately: return focus to the trigger element after dismiss, move focus to new content after expand.
5. **Live regions** — Components that update content asynchronously (notifications, status updates) use `aria-live` regions to announce changes to screen readers.
6. **Colour contrast** — All Component-level colour choices maintain WCAG 2.2 AA contrast ratios (4.5:1 for normal text, 3:1 for large text).
7. **Reduced motion** — Components with animations respect `prefers-reduced-motion` media query and provide non-animated alternatives.
8. **Touch targets** — Interactive Components have minimum touch targets of 44×44px (WCAG 2.5.8).

```tsx
// Example: accessible expandable card
export default function ExpandableCard({
  title,
  children,
  isExpanded,
  onToggle,
}: ExpandableCardProps) {
  return (
    <Card>
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls="card-content"
        className="w-full text-left"
      >
        {title}
      </button>
      {isExpanded && (
        <div id="card-content" role="region">
          {children}
        </div>
      )}
    </Card>
  );
}
```

### Trade-offs

- _Comprehensive a11y_ at the Component level increases markup and complexity but ensures accessibility is built in, not retrofitted.
- _Minimal a11y_ at the Component level (relying on UI Primitives for a11y) misses Component-specific concerns like keyboard navigation patterns and focus management.

### Industry Best Practice

WCAG 2.2 AA compliance requires semantic structure, keyboard support, focus management, and colour contrast. ARIA Authoring Practices Guide (APG) provides patterns for common Component-level widgets.

### Recommendation

Apply the eight-point accessibility checklist to every Component during development. Component-level a11y violations are review-blocking. Interactive Components must pass keyboard navigation tests before acceptance.

---

## 21. Component Performance Strategy

### Purpose

Define performance best practices specific to the Component Layer.

### Engineering Rationale

Performance optimisation at the Component level prevents unnecessary re-renders, reduces bundle size, and ensures smooth interactions. Premature optimisation is harmful, but architectural performance patterns should be built in from the start.

### Recommended Option

**Six performance guidelines for Components:**

1. **Stable props references.** Define callback props using `useCallback` in the parent Section so that child Components do not re-render unnecessarily.
2. **Memoisation as last resort.** Wrap a Component in `React.memo` only when profiling confirms it re-renders with identical props. Never pre-emptively memoise all Components.
3. **Lazy loading.** Large Components (charts, rich text editors, maps) use `next/dynamic` with `ssr: false` to defer loading to the client.
4. **Bundle size awareness.** Components that import large libraries (date pickers, markdown renderers) are split into separate bundles via dynamic imports.
5. **List virtualisation.** Components rendering long lists (50+ items) use virtualisation (e.g., `@tanstack/virtual`) to render only visible items.
6. **Server-first rendering.** Components that are Passive (no interactivity) are Server Components by default. Only add `"use client"` when interactivity is required.

```tsx
// Lazy-loaded Component example
const RichTextEditor = dynamic(() => import("./rich-text-editor"), {
  ssr: false,
  loading: () => <RichTextEditorSkeleton />,
});
```

### Trade-offs

- _Performance-first_ from the start may over-engineer Components that never hit performance bottlenecks.
- _Performance-later_ risks accumulating performance debt that is expensive to refactor.

### Industry Best Practice

React's Server Components eliminate client-side JavaScript for non-interactive Components. React.memo, useMemo, and useCallback are standard tools for preventing unnecessary re-renders. Dynamic imports reduce initial bundle size.

### Recommendation

Make all Components Server Components by default. Add `"use client"` only for interactive Components. Use dynamic imports for large dependency Components. Profile before memoising. Virtualise long lists from the start.

---

## 22. Component Styling Strategy

### Purpose

Define how Components receive and apply styling in a consistent, maintainable way.

### Engineering Rationale

Inconsistent styling across Components leads to visual debt and maintenance overhead. A consistent styling strategy ensures every Component looks cohesive, responds correctly to theme changes, and can be updated predictably.

### Recommended Option

**Tailwind CSS v4 for all Component styling.**

- All Components use Tailwind utility classes directly in JSX.
- Shared design tokens (colours, spacing, typography, shadows) are defined in `tailwind.config.ts` and referenced via Tailwind classes.
- Component-specific values that do not map to design tokens use arbitrary values sparingly (e.g., `w-[18px]` for a one-off icon size).
- Dark mode is handled via Tailwind's `dark:` variant consistently across all Components.
- Responsive design uses Tailwind's breakpoint prefixes (`sm:`, `md:`, `lg:`, `xl:`).

**Styling rules:**

| Rule                                    | Explanation                                                      | Example                                                               |
| --------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| Utility-first                           | Use Tailwind classes over custom CSS                             | `className="text-sm font-semibold"` instead of custom `.caption-bold` |
| No CSS modules                          | All styling lives in JSX via className                           | Avoid `.module.css` files for Components                              |
| No styled-components                    | Runtime CSS-in-JS is prohibited                                  | Tailwind is the only styling system                                   |
| Shared patterns extracted to Primitives | Repeated class combinations become `@/components/ui/` Primitives | Extract `Card`, `Badge`, `Button` as Primitives                       |
| Dark mode everywhere                    | Every Component supports dark mode                               | Every colour class has a `dark:` counterpart                          |
| Responsive by default                   | Components are mobile-first                                      | Base styles are mobile; `sm:` and above add breakpoints               |

### Trade-offs

- _Tailwind utility classes_ provide consistency and rapid development but create verbose className strings for complex Components.
- _CSS modules_ provide better separation of styles from logic but add file overhead and break the colocation principle.

### Industry Best Practice

Tailwind CSS is the industry standard for utility-first styling in React applications. shadcn/ui and Vercel's design system both use Tailwind. The utility-first approach aligns with Component-level granularity.

### Recommendation

All Component styling uses Tailwind CSS v4 utility classes. No CSS modules, no styled-components, no CSS-in-JS libraries. Extract repeated class patterns into UI Primitives.

---

## 23. Component Theming

### Purpose

Define how Components respond to application-wide theming and dark mode.

### Engineering Rationale

Theming at the Component level affects every visual element. A consistent theming strategy ensures that every Component respects the current theme without requiring per-Component theme logic.

### Recommended Option

**Tailwind dark variant for all theme-aware styling.**

- Dark mode is handled exclusively through Tailwind's `dark:` variant on every colour-related class.
- No runtime theme detection inside Components — the `dark` class is applied at the `html` element level.
- Components never import theme context or theme hooks directly.
- Theme-aware Component styling is a convention enforced in code review: every colour className (text, background, border, shadow) must have a `dark:` counterpart.

```tsx
// Correct: every colour class has dark variant
className = "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50";

// Incorrect: missing dark variant
className = "bg-white text-zinc-900";
```

**Exceptions for theme-independent Components:**

- Icons and decorative elements that use the current colour inherit via `currentColor`.
- Skeleton components use theme-adaptive colours.
- Border and divider colours always use theme-adapting variants.

### Trade-offs

- _Dark variant on every colour class_ is verbose but guarantees every Component respects the theme without runtime overhead.
- _CSS variables for theming_ would be less verbose but break the colocation principle (styles in CSS, not in JSX).

### Industry Best Practice

Tailwind's dark mode strategy using class-based toggling is the industry standard approach. It is used by shadcn/ui, Vercel, and most production Next.js applications.

### Recommendation

Every colour className in every Component includes a `dark:` variant. No runtime theme logic inside Components. The dark class is managed at the HTML root level by the Layout Layer.

---

## 24. Component Reusability Rules

### Purpose

Define when a Component should be reusable, when it should remain Feature-private, and the promotion path between them.

### Engineering Rationale

Reusability is the primary benefit of the Component Layer, but premature sharing creates unused abstractions and maintenance overhead. Clear rules prevent both over-abstraction and under-abstraction.

### Recommended Option

**Default to Feature-private; promote to shared only on proven need.**

| Scope                      | Location                                                                                 | When to use                                              | Promotion criteria                      |
| -------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------- |
| **Feature-private**        | `@/features/<name>/_components/`                                                         | Component is specific to one Feature's domain            | Default — all Components start here     |
| **Feature-shared**         | `@/features/<name>/_components/` (imported by multiple Sections within the same Feature) | Component is used by 2+ Sections within the same Feature | Section reuses Component within Feature |
| **Shared (cross-Feature)** | `@/components/<category>/`                                                               | Component is used by 2+ Features                         | Second Feature needs the same Component |
| **Shared (cross-project)** | Published npm package                                                                    | Component is generic enough for multiple projects        | Proven cross-project usage              |

**Promotion rules:**

1. **Proven reuse required.** A Component is promoted to `@/components/` only when a second Feature actually imports it. "Might be useful someday" is not a valid reason.
2. **Business logic zero.** A promoted Component must contain zero Feature-specific business logic. All Feature-specific concerns must be removed or made configurable via props.
3. **API stability.** A promoted Component's props interface must be stable. Breaking changes to shared Components affect all consumers.
4. **Documentation required.** Promoted Components must have JSDoc documentation, Storybook stories, and usage examples.

### Trade-offs

- _Default to Feature-private_ prevents premature abstraction but may lead to duplicated code when two Features independently create similar Components.
- _Default to shared_ reduces duplication but creates coupling between Features and maintenance burden for shared abstractions.

### Industry Best Practice

The Rule of Three is a well-known software engineering principle: a component should be abstracted for reuse only when it is used in three places. This specification uses the Rule of Two (two Features) to trigger promotion, balancing pragmatism with architectural discipline.

### Recommendation

All Components start as Feature-private. Promote to shared only when a second Feature proves the need. Document every promotion. Never pre-emptively create shared Components.

---

## 25. Shared vs Feature Component Rules

### Purpose

Define the exact criteria for where a Component lives and the rules for maintaining Components in each location.

### Engineering Rationale

Without clear boundaries between Feature and shared Components, the shared Components directory becomes a dumping ground for unrelated abstractions, and Feature Components accumulate duplicated logic that should be shared.

### Recommended Option

**Feature Components (`_components/`) are domain-specific; Shared Components (`@/components/`) are domain-agnostic.**

| Aspect               | Feature Component                                             | Shared Component                                            |
| -------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| **Domain knowledge** | Has domain knowledge (assumes Feature context)                | Domain-agnostic (no Feature assumptions)                    |
| **Props types**      | May use Feature-specific types (`AlumniProfile`, `EventData`) | Uses only generic types (`Item`, `Option`, `string`)        |
| **Dependencies**     | May import from Feature `_types/`, `_constants/`              | Imports only from `@/components/`, `@/lib/utils`, `@/types` |
| **Styling**          | Feature-specific styling via Tailwind                         | Generic styling; accepts `className` for overrides          |
| **Tests**            | Tests use Feature mock data                                   | Tests use generic fixture data                              |
| **Documentation**    | Brief JSDoc describing Feature-specific behaviour             | Full documentation with Storybook stories                   |

```tsx
// Feature-private Component (domain-specific)
import type { AlumniProfile } from "@/types";
export interface ProfileCardProps {
  profile: AlumniProfile;
  onSelect?: (profileId: string) => void;
}

// Shared Component (domain-agnostic)
export interface CardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}
```

**When a Feature Component becomes shared, it must:**

1. Remove all Feature-specific type dependencies.
2. Accept domain-agnostic props (strings, callbacks, generics).
3. Accept `className` for consumer styling overrides.
4. Add Storybook stories and JSDoc.
5. Move to `@/components/<category>/` and add a barrel export.

### Trade-offs

- _Feature Components with Feature types_ are faster to build but cannot be reused outside their Feature.
- _Shared Components with generic types_ require more abstraction upfront but provide cross-Feature reusability.

### Industry Best Practice

Domain-Driven Design distinguishes between domain-specific and generic subdomains. Components follow the same pattern: Feature Components handle domain-specific display; Shared Components handle generic UI concerns.

### Recommendation

Build Feature Components with Feature-specific types by default. Promote and abstract to generic types only when a second Feature proves the need. Never build shared Components speculatively.

---

## 26. Dependency Rules

### Purpose

Define the complete dependency graph for the Component Layer, specifying what each Component may import and what must remain inaccessible.

### Engineering Rationale

Explicit dependency rules prevent architectural degradation. A Component that imports from the wrong layer creates coupling that resists refactoring and makes testing difficult.

### Recommended Option

**Strict dependency hierarchy:**

```
Allowed:
  Component (_components/ or @/components/)
    ↓
  UI Primitive (@/components/ui/)
    ↓
  Shared utility (@/lib/utils)
    ↓
  Shared type (@/types)
    ↓
  React / Next.js

Forbidden:
  Component → Another Feature's _components/
  Component → Feature _services/
  Component → Feature _state/
  Component → Feature _validation/
  Component → Feature _sections/
  Component → Feature feature.tsx
  Component → Page (src/app/)
  Component → Layout Component
```

**Feature Components (in `_components/`) may additionally import from their owning Feature's internal modules:**

```
Feature Component
  ↓
  Own Feature _types/     ✅ (allowed)
  Own Feature _constants/ ✅ (allowed)
  Own Feature _utils/     ✅ (allowed)
```

**Shared Components (in `@/components/`) may NOT import from any Feature module:**

```
Shared Component
  ↓
  @/components/ui/         ✅ (allowed)
  @/lib/utils              ✅ (allowed)
  @/types                  ✅ (allowed)
  @/constants              ✅ (allowed)
  @/config                 ✅ (allowed)
  Any Feature module       ❌ (forbidden)
```

### Trade-offs

- _Strict dependency rules_ prevent coupling but may require duplication when a shared Component needs Feature-specific data.
- _Permissive dependency rules_ reduce duplication but create invisible coupling between shared Components and Features.

### Industry Best Practice

Layered architecture defines strict dependency direction: higher layers depend on lower layers, never the reverse. The Component Layer is below the Section Layer and above the UI Primitive Layer. Dependencies must flow downward only.

### Recommendation

Enforce dependency rules in code review and via ESLint import restrictions. A Component importing from a Feature's `_services/` or another Feature's `_components/` is a review-blocking violation.

---

## 27. Component Testing Strategy

### Purpose

Define the testing approach for Components, covering what to test, how to test, and what not to test.

### Engineering Rationale

Components are the most testable units in the architecture because they receive all data via props and produce deterministic output. A clear testing strategy ensures Components are tested effectively without testing implementation details.

### Recommended Option

**Three-tier Component testing:**

| Test level                  | What it covers                                                                             | Framework                | Who writes it     |
| --------------------------- | ------------------------------------------------------------------------------------------ | ------------------------ | ----------------- |
| **Unit tests**              | Component renders correctly with various prop combinations; event callbacks fire correctly | Vitest + Testing Library | Feature developer |
| **Accessibility tests**     | Component passes automated a11y checks; ARIA attributes correct; keyboard navigation works | Vitest + jest-axe        | Feature developer |
| **Visual regression tests** | Component renders consistently across prop variations                                      | Storybook + Chromatic    | UI engineer       |

**What to test in Component unit tests:**

```tsx
// 1. Render with required props
render(<StatCard label="Members" value={1500} />);

// 2. Render with optional props
render(<StatCard label="Members" value={1500} trend="up" />);

// 3. Render loading state
const { container } = render(<StatCard label="Members" value={undefined} />);
expect(container.querySelector(".animate-skeleton")).toBeInTheDocument();

// 4. Render error state
render(<StatCard label="Members" hasError />);

// 5. Render empty state
render(<ItemList items={[]} />);

// 6. Callback fires correctly
const onSelect = vi.fn();
render(<StatCard label="Members" value={1500} onSelect={onSelect} />);
fireEvent.click(screen.getByRole("button"));
expect(onSelect).toHaveBeenCalledWith(1500);
```

**What NOT to test:**

- Internal state values (test behaviour, not state).
- Implementation details (class names, element structure).
- Parent Component behaviour (that belongs to Section tests).
- Styling (covered by visual regression tests).

### Trade-offs

- _Comprehensive unit tests_ catch regressions early but increase test suite maintenance effort.
- _Minimal unit tests_ combined with E2E tests reduce unit test maintenance but provide slower feedback on Component-specific regressions.

### Industry Best Practice

Testing Library's guiding principle is to test behaviour, not implementation. Component tests should simulate user interactions and verify rendered output, not inspect internal state or DOM structure.

### Recommendation

Write unit tests for every Component that cover: render with props, loading state, error state, empty state, and callback interaction. Use Storybook stories for visual documentation and regression testing. Do not test implementation details.

---

## 28. Component Documentation Strategy

### Purpose

Define how Components are documented to ensure discoverability, correct usage, and maintainability.

### Engineering Rationale

Well-documented Components reduce onboarding time, prevent misuse, and make the architecture self-explanatory. Inconsistent documentation creates confusion and leads to incorrect Component usage.

### Recommended Option

**Four-level Component documentation:**

| Level                 | What it includes                               | Where it lives                 | Required for                          |
| --------------------- | ---------------------------------------------- | ------------------------------ | ------------------------------------- |
| **JSDoc**             | Description, props, usage example              | Top of Component file          | All Components                        |
| **Props interface**   | Type annotations with JSDoc on each prop       | Co-located with Component file | All Components                        |
| **Storybook stories** | Interactive examples for each prop combination | `stories/`                     | Shared Components                     |
| **Usage guide**       | Code examples, do/don't patterns               | `.mdx` in Storybook            | Complex or critical shared Components |

**JSDoc template for every Component:**

```tsx
/**
 * StatCard displays a single metric with an optional trend indicator.
 *
 * @example
 * <StatCard label="Total Members" value={1500} trend="up" />
 */
export default function StatCard({ label, value, trend }: StatCardProps) {
```

**Props JSDoc template:**

```tsx
export interface StatCardProps {
  /** The label displayed above the value. */
  label: string;
  /** The numeric or string value to display. */
  value: number | string;
  /** Optional trend direction. Renders an arrow indicator. */
  trend?: "up" | "down" | "neutral";
  /** Optional icon rendered before the label. */
  icon?: React.ReactNode;
  /** Callback fired when the card is clicked. */
  onClick?: (value: number) => void;
}
```

### Trade-offs

- _Comprehensive documentation_ improves developer experience but requires ongoing maintenance effort.
- _Minimal documentation_ (TypeScript types only) is faster to write but forces developers to read Component code to understand usage.

### Industry Best Practice

Storybook is the industry standard for Component documentation and visual testing. JSDoc for TypeScript provides IDE inline documentation. Both together give developers immediate context without leaving their editor.

### Recommendation

Every Component has JSDoc with a description and usage example. Every props interface has JSDoc on each prop. Shared Components have Storybook stories. Complex Components have usage guides with do/don't examples.

---

## 29. Component Maintainability

### Purpose

Define practices that ensure Components remain maintainable over time as the codebase grows.

### Engineering Rationale

Components are the most numerous architectural unit. Without maintainability practices, Component files accumulate technical debt, inconsistent patterns, and dead code.

### Recommended Option

**Five maintainability practices:**

1. **File structure consistency.** Every Component file follows the same internal order: classification comment → imports → constants → props interface → Component → sub-Components → skeleton → utility functions.
2. **80-line budget enforcement.** Component files that exceed 80 lines of meaningful code are split. Sub-Components are extracted into separate files following the naming convention.
3. **Dead code removal.** A Component that is no longer imported by any Section is flagged for deletion. Unused props are removed. Unused sub-Components are deleted.
4. **Prop immutability.** Components never mutate their props. All props are treated as read-only.
5. **Stable file naming.** Component filenames match their export name in kebab-case: `stat-card.tsx` exports `StatCard`, `event-list-item.tsx` exports `EventListItem`.

**Code review checklist for Component maintainability:**

- Does the Component have a single responsibility?
- Does the Component stay within the 80-line budget?
- Are all props used and typed correctly?
- Are there no unused imports?
- Does the Component follow the file structure convention?
- Does the filename match the export name?
- Does the Component have JSDoc documentation?

### Trade-offs

- _Strict maintainability practices_ increase development time for each Component but reduce long-term maintenance costs.
- _Relaxed maintainability practices_ accelerate initial development but accumulate technical debt that slows future development.

### Industry Best Practice

Code review checklists, linting rules, and automated formatting are standard practices for maintaining code quality at scale. The 80-line budget and file structure conventions are specific to this architecture but follow general principles of small files and consistent organisation.

### Recommendation

Apply the five maintainability practices to every Component. Use the code review checklist during Component reviews. Automate what can be automated (formatting, linting, unused import detection).

---

## 30. Component Scalability

### Purpose

Define how the Component Layer scales as the application grows from 16 Features to 50+ Features.

### Engineering Rationale

The current codebase has 16 Features with empty `_components/` directories. As the application grows, the number of Components will grow proportionally (estimated 3-5 Components per Feature = 50-250 Components total). Without scalable organisation, the Component Layer becomes unmanageable.

### Recommended Option

**Four scalability mechanisms:**

1. **Feature-private by default.** Each Feature's `_components/` directory grows independently. No single directory exceeds the number of Components within one Feature.
2. **Shared Component subdirectories by category.** As the shared `@/components/` directory grows, Components are organised into subdirectories (`ui/`, `data-display/`, `feedback/`, `form/`, `navigation/`). No subdirectory should exceed 30 files.
3. **Index barrel files.** Every `_components/` directory and every shared category directory has an `index.ts` barrel that re-exports all Components. Sections import from the barrel, not individual files.
4. **Deprecation path.** When a Component is superseded, it is marked `@deprecated` in JSDoc, kept for one release cycle, then removed. The barrel export warns on usage.

**Index barrel example:**

```tsx
// @/features/dashboard/_components/index.ts
export { default as StatCard } from "./stat-card";
export type { StatCardProps } from "./stat-card";
export { default as ActivityItem } from "./activity-item";
export type { ActivityItemProps } from "./activity-item";
```

### Trade-offs

- _Index barrel files_ provide clean import paths but require maintenance as Components are added or removed.
- _Direct file imports_ avoid barrel maintenance but expose file paths to consumers and make refactoring harder.

### Industry Best Practice

Barrel exports are standard in TypeScript libraries and large codebases. They provide a stable public API surface while allowing internal file reorganisation.

### Recommendation

Every `_components/` directory has an `index.ts` barrel export. Sections import from the barrel, never from individual Component files. Monitor shared category directories and split when they exceed 30 files.

---

## 31. Future Expansion Strategy

### Purpose

Define how the Component Layer can evolve to accommodate future architectural needs without breaking existing Features.

### Engineering Rationale

The Component Layer must support future expansion in three dimensions: new Features (horizontal), deeper Components within existing Features (vertical), and new shared Component categories (diagonal). The architecture must accommodate all three without restructuring.

### Recommended Option

**Three expansion vectors:**

| Vector         | What it means                            | How the architecture supports it                                                                    |
| -------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Horizontal** | New Features added                       | Each Feature creates its own `_components/`. No shared directory changes needed.                    |
| **Vertical**   | More Components within existing Features | Components are added to the Feature's `_components/`. Section orchestrators import new Components.  |
| **Diagonal**   | Component promoted to shared             | Component moves from `_components/` to `@/components/<category>/`. Import paths update in Sections. |

**Future expansion scenarios:**

1. **Micro-frontend extraction.** If a Feature becomes a standalone micro-frontend, its `_components/` directory moves with it. No dependency on `@/components/` except via the stable public API.
2. **Design system replacement.** If the UI Primitive library is replaced (e.g., shadcn/ui → custom Primitives), only Components that import from `@/components/ui/` need updating. Feature Components remain unchanged.
3. **New Component categories.** As new Component types emerge (e.g., `data-viz/`, `ai/`), new subdirectories are created under `@/components/`. Existing categories remain unchanged.
4. **Third-party Component integration.** External Components (e.g., charts, maps, calendars) are wrapped in Feature Components that provide a consistent props interface. The wrapper handles the third-party library; the Section never imports the library directly.

### Trade-offs

- _Future-proof architecture_ requires up-front category planning but reduces restructuring costs later.
- _Minimal-upfront architecture_ is faster to build but may require significant reorganisation as the application grows.

### Industry Best Practice

Stable abstractions (the Feature boundary, the Component interface) enable future expansion without breaking changes. The dependency rule (Components never depend on upper layers) ensures Components can be extracted or replaced.

### Recommendation

Build for horizontal and vertical expansion from the start. Design for diagonal expansion as a known, tested process. Plan for micro-frontend extraction by maintaining strong Feature boundaries. Wrap third-party libraries behind Feature Component interfaces.

---

## 32. Component Best Practices

### Purpose

Provide a consolidated checklist of Component best practices as a quick reference for developers.

### Engineering Rationale

A single-page checklist is easier to reference during development and code review than searching the full specification.

### Recommended Option

**Component creation checklist:**

- [ ] Component has a single UI responsibility (no "and" in its description)
- [ ] Component lives in the correct Feature's `_components/` (or `@/components/` if shared)
- [ ] Component uses default export for the Component, named export for props interface
- [ ] Props interface is flat, explicit, and fully typed (no compound model objects)
- [ ] Callback props are prefixed with `on` and pass minimal data
- [ ] State is owned locally (useState) and never shared with sibling Components
- [ ] No business logic: no data fetching, sorting, filtering, or domain validation
- [ ] No Feature service, state, or validation imports
- [ ] Classification comment is present at the top
- [ ] `"use client"` is present only if the Component uses event handlers or hooks
- [ ] Every colour className has a `dark:` counterpart
- [ ] Component is under 80 lines of meaningful code (120-line soft max, 150-line absolute max)
- [ ] JSDoc with description and `@example` is present
- [ ] Each prop has JSDoc documentation
- [ ] Loading state is handled (if data may be delayed)
- [ ] Error state is handled (if data may be invalid)
- [ ] Empty state is handled (if data may be empty)
- [ ] Accessibility checklist passes (semantic elements, ARIA, keyboard nav, focus, colour contrast, reduced motion, touch targets)

**Code review checklist:**

- [ ] Component follows the creation checklist above
- [ ] Component does not import from another Component's sibling file (unless parent-child extraction)
- [ ] Component does not import from upper layers (Section, Feature, Page)
- [ ] Sub-Components follow the naming convention (parent-name-sub-name.tsx)
- [ ] No unused props, imports, or exports
- [ ] Filename matches export name (kebab-case)
- [ ] Dark mode variants present on all colour classes
- [ ] Keyboard navigation verified for interactive Components
- [ ] No premature sharing (Component starts Feature-private; promotion has documented rationale)

---

## Architecture Analysis Summary

### Reusability Analysis

The two-tier Component model (Feature-private + shared) ensures that reusability is earned, not assumed. The Rule of Two (promote when a second Feature proves the need) balances reuse against premature abstraction. Feature-private Components can use domain-specific types without creating coupling; shared Components strip all domain assumptions at promotion time. This ensures that the shared `@/components/` directory contains only stable, well-documented, domain-agnostic Components.

### Performance Analysis

The Server-first default ensures that non-interactive Components contribute zero JavaScript to the client bundle. Lazy loading via `next/dynamic` isolates large-dependency Components. The `React.memo` guideline (profile before memoising) prevents both premature optimisation and unnecessary re-renders. Component-level skeletons prevent layout shift during loading.

### Accessibility Analysis

The eight-point accessibility checklist covers semantic HTML, ARIA attributes, keyboard navigation, focus management, live regions, colour contrast, reduced motion, and touch targets. Each requirement is specified at the Component level where it can be tested in isolation. WCAG 2.2 AA compliance is achievable by applying the checklist consistently.

### Dependency Analysis

The strict dependency hierarchy prevents upward dependencies (Component → Section → Feature → Page). No Component imports from upper layers, from other Features, or from sibling Components without the parent-child extraction pattern. Shared Components strip all Feature dependencies at promotion time. ESLint rules can enforce these boundaries mechanically.

### Maintainability Analysis

The 80-line budget, consistent file structure convention, and JSDoc documentation requirements ensure that Components remain maintainable as the codebase grows. The code review checklist provides a repeatable quality gate. Barrel exports provide stable import paths that insulate consumers from file-level reorganisation.

### Scalability Analysis

Three expansion vectors (horizontal for new Features, vertical for deeper Components, diagonal for shared promotions) are built into the architecture from the start. No architectural restructuring is required for any expansion vector. Micro-frontend extraction, design system replacement, and third-party integration are supported use cases.

### Future Expansion Recommendations

1. **Establish ESLint import restriction rules** to enforce the dependency hierarchy mechanically.
2. **Create Storybook stories for all shared Components** before promoting them.
3. **Add Component-count monitoring** to the CI pipeline to flag directories approaching the 30-file limit.
4. **Schedule quarterly Component audits** to identify dead code, unused props, and promotion candidates.
5. **Document the promotion process** in a runbook so any developer can execute it consistently.
