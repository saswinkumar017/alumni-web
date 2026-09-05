# Stage 9 — Shared Component Layer Specification

**Status:** Implemented
**Dependencies:** Stage 7 (Component Layer), Stage 8 (Styling Layer)
**Next:** Stage 10 (Type Layer) — specification in progress
**Current Shared Component Inventory:** 32 exports across 7 categories (`ui/`, `layout/`, `form/`, `feedback/`, `navigation/`, `data-display/`, `skeletons/`)
**Active Feature-Private Components:** 31 across 8 implemented features

---

## 1. Shared Component Philosophy

### Purpose

Define the fundamental nature of a Shared Component and how it differs from a Feature-private Component, a Section, and a UI Primitive.

### Engineering Rationale

The architecture currently has two tiers (Feature-private in `_components/`, shared in `@/components/<category>/`), but the shared tier lacks formal boundaries. Without a clear philosophy, UI Primitives and Shared Components intermix, business concepts leak into shared abstractions, and the promotion path from Feature-private to shared is undefined.

### Recommended Option

**Shared Component as Domain-Neutral Presentation Unit.**

A Shared Component is a presentation unit that:

- Contains zero business or domain assumptions.
- Uses only generic props (strings, numbers, callbacks, `ReactNode`).
- Composes UI Primitives and other Shared Components.
- Can be dropped into any Feature without modification.
- Has a defined lifecycle from creation through deprecation.

The distinction between layers:

| Layer | Knowledge | Dependencies | Reuse Scope | Example |
|---|---|---|---|---|
| **UI Primitive** | No business, no layout | `@/lib/utils`, `react` | Global | `Button`, `Badge`, `Card` |
| **Shared Component** | No business, knows layout | `@/components/ui/`, `@/lib/utils` | Cross-Feature | `DataTable`, `SearchBar`, `Pagination` |
| **Feature Component** | Knows business domain | Feature `_types/`, `_constants/` | Single Feature | `ProfileCard`, `EventListItem` |

### Trade-offs

- *Strict domain-neutrality* prevents shared components from being too specialized but requires more props to configure them for each Feature.
- *Permissive domain assumptions* in Shared Components reduce prop count but create coupling between unrelated Features.

### Industry Best Practice

Domain-neutral shared component libraries (Radix UI, shadcn/ui, Reach UI) are designed to be framework-agnostic and business-agnostic. The same principle applies to the in-project shared layer.

### Recommendation

A Shared Component must be describable without referencing any business concept: "renders a paginated table of rows" not "renders a paginated table of alumni records." Business concepts belong in Feature-private Components.

---

## 2. Layer Architecture

### Purpose

Define where the Shared Component Layer sits in the architectural stack and how it interacts with adjacent layers.

### Engineering Rationale

Without explicit layer boundaries, Shared Components creep upward (absorbing Feature concerns) or downward (becoming UI Primitives). The layer position determines what each component may import and what may import it.

### Recommended Option

**Fixed position between Feature Components and UI Primitives.**

```
Page
  ↓
Feature (feature.tsx)
  ↓
Section (_sections/)
  ↓
Feature Component (_components/)  →  Shared Component (@/components/<category>/)
                                              ↓
                                        UI Primitive (@/components/ui/)
                                              ↓
                                        HTML Element
```

A Shared Component is composed by Feature Components (or Sections directly) and composes UI Primitives. It never composes Feature Components. It never bypasses UI Primitives to raw HTML (except for structural wrappers like `<div>`, `<section>`).

### Trade-offs

- *Three-tier component hierarchy* (Feature → Shared → UI) adds indirection but clearly separates business, generic, and atomic concerns.
- *Two-tier hierarchy* (Feature + UI) is simpler but forces either business logic into UI Primitives or generic logic into Feature Components.

### Industry Best Practice

Three-tier component architectures match Atomic Design: atoms (UI Primitives), molecules (Shared Components), organisms (Feature Components). Libraries like shadcn/ui occupy the UI Primitive layer; in-project shared libraries occupy the Shared Component layer.

### Recommendation

All Shared Components live in `@/components/<category>/`. Feature Components (in `_components/`) compose Shared Components. Shared Components compose UI Primitives. Neither Shared Components nor UI Primitives may import from Feature directories.

---

## 3. Responsibilities

### Purpose

Define exactly what a Shared Component owns and what it delegates to consumers or to UI Primitives.

### Engineering Rationale

Responsibility boundaries prevent business logic from leaking into Shared Components and prevent Shared Components from becoming underspecified (delegating too much to consumers via overly broad props).

### Recommended Option

**The Shared Component owns nine responsibilities:**

1. **Generic presentation** — Rendering domain-neutral visual output from generic props.
2. **Internal layout** — Spacing, alignment, and arrangement of UI Primitives within its surface.
3. **Props handling** — Receiving typed generic props, providing defaults, deriving display values.
4. **Local UI state** — Managing hover, focus, expanded, selected, pagination page, search query.
5. **Event delegation** — Translating user interactions into typed callback props.
6. **Accessibility** — ARIA attributes, keyboard navigation, focus management, live regions.
7. **Responsive behavior** — Adapting layout across breakpoints via Tailwind responsive variants.
8. **Loading skeletons** — Co-located skeleton variants matching the component's shape.
9. **Empty states** — Contextual empty-state messaging configurable via props.

**The Shared Component delegates:**

| Concern | Delegated To | Mechanism |
|---|---|---|
| Business logic | Feature Component or Section | Not imported; not called |
| Domain types | Consumer | Generic type parameters or flat string/number props |
| Data fetching | Section or Feature | Props only |
| Domain validation | Section or Feature | Not present in file |
| Feature-specific styling | Consumer | `className` prop for overrides |
| Internationalization | Consumer | Formatted strings passed as props |

### Trade-offs

- *Nine responsibilities* is comprehensive but some components implement only a subset (e.g., `Breadcrumb` has no loading state).
- *Delegating i18n to consumers* means every string prop is pre-formatted, which is more verbose but keeps Shared Components locale-agnostic.

### Industry Best Practice

Delegation is the standard pattern for generic library components. Radix UI delegates content, styling, and behavior to consumers; it owns accessibility, state management, and keyboard navigation.

### Recommendation

Apply the nine-responsibility model to every Shared Component. Omitted responsibilities are acceptable. Any Shared Component that acquires a business concept or domain type must be refactored or demoted to a Feature Component.

---

## 4. Characteristics

### Purpose

Define the essential qualities every Shared Component must exhibit.

### Engineering Rationale

Characteristics serve as architectural acceptance criteria for the shared layer. A component that fails these checks is not ready for promotion.

### Recommended Option

**Seven essential characteristics:**

| Characteristic | Definition | Test |
|---|---|---|
| **Domain-Neutral** | Contains zero business or domain concepts | Can the component be described without mentioning any feature? |
| **Composable** | Provides a clean API with typed generic props | Can a consumer use it as `<DataTable columns={...} rows={...} />`? |
| **Encapsulated** | Hides all internal implementation | Can external code access internal state or sub-components? (No → good) |
| **Theme-Agnostic** | Renders correctly in all themes without `dark:` overrides | Does the component use only semantic token utilities? |
| **Testable** | Can be tested in isolation with generic fixtures | Can you write a unit test importing only the public export? |
| **Predictable** | Same props produce same output; no side effects | Does the component render deterministically? |
| **Replaceable** | Can be rewritten without changing consumers | Can you replace internals without changing the props interface? |

### Trade-offs

- *Seven characteristics* raise the bar for promotion but ensure high-quality shared abstractions.
- *Relaxed characteristics* would accelerate shared component creation but degrade quality over time.

### Industry Best Practice

SOLID principles apply at every layer. Domain-Neutrality is the Open-Closed Principle applied to business knowledge. Theme-Agnosticism ensures components render correctly without per-component theme logic.

### Recommendation

Apply the seven-characteristic checklist during promotion reviews. A component that fails any characteristic must be revised before promotion.

---

## 5. Classification

### Purpose

Categorize Shared Components by their visual and behavioral role to determine naming conventions, folder organization, and expected responsibilities.

### Engineering Rationale

Classification makes the purpose of each Shared Component directory explicit. Developers finding a component in `@/components/data-display/` immediately know its role, props pattern, and expected behaviors.

### Recommended Option

**Seven existing categories plus seven new categories:**

#### Existing Categories

| Category | Purpose | Current Count | Example Components |
|---|---|---|---|
| `ui/` | Atomic UI Primitives | 11 | `Button`, `Badge`, `Card`, `TextInput`, `Checkbox` |
| `layout/` | Structural layout shells | 8 | `Shell`, `Topbar`, `SidebarSection`, `Footer` |
| `form/` | Form-specific wrappers | 3 | `FormField`, `FormSelect`, `FormCheckbox` |
| `feedback/` | User feedback and notifications | 3 | `Toast`, `AlertBanner`, `ProgressIndicator` |
| `navigation/` | Navigation and wayfinding | 3 | `Tabs`, `Pagination`, `Breadcrumb` |
| `data-display/` | Data presentation | 3 | `Avatar`, `DateDisplay`, `StatusIndicator` |
| `skeletons/` | Loading skeleton shapes | 1 | `Skeleton`, `SkeletonBlock`, `SkeletonCard` |

#### New Categories

| Category | Purpose | When to Create | Example Components |
|---|---|---|---|
| `dialogs/` | Modal, drawer, popover, tooltip overlays | First dialog reuse across features | `Modal`, `Drawer`, `ConfirmDialog`, `Tooltip` |
| `tables/` | Data tables with sorting, filtering, selection | First table reuse across features | `DataTable`, `TableHeader`, `TableRow`, `TablePagination` |
| `search/` | Search bars, filter bars, autocomplete | First search pattern reuse across features | `SearchBar`, `FilterBar`, `AutocompleteInput` |
| `selection/` | Selection UI: tags, chips, pickers | First selection UI reuse across features | `TagInput`, `Chip`, `MultiSelect`, `DateRangePicker` |
| `upload/` | File upload with progress, preview, drag-drop | First upload reuse across features | `FileUpload`, `DropZone`, `UploadProgress` |
| `timeline/` | Chronological activity feeds | First timeline reuse across features | `ActivityTimeline`, `TimelineItem`, `TimelineDot` |
| `empty-states/` | Contextual empty state illustrations | First empty state reuse across features | `EmptyState`, `EmptySearch`, `EmptyData` |

### Data Components

Data components are categorized under their functional role rather than a monolithic "data" category:

- Tabular data → `tables/`
- List data → Feature-private (domain-specific) or `data-display/` (generic)
- Hierarchical data → `data-display/` (generic tree)

### Display Components

Display components (existing `data-display/` + `skeletons/`) render data for viewing without interaction. They are Server Components by default.

### Navigation Components

Navigation components (existing `navigation/`) handle user wayfinding. They are Client Components due to active state tracking.

### Feedback Components

Feedback components (existing `feedback/`) communicate system state. They span Server (static alerts) and Client (toasts, progress) rendering.

### Layout Helpers

Layout helpers (existing `layout/`) provide structural shells. They are Server Components by default, with Client wrappers for interactive sections.

### Trade-offs

- *14 categories* provides clear organization but requires developers to choose correctly when adding new components.
- *Fewer categories* reduces cognitive load but creates ambiguous homes for some components.

### Industry Best Practice

Component library categorization varies but functional groupings (display, navigation, feedback, layout) are universal. Material UI uses 10+ categories; Radix uses functional groupings.

### Recommendation

Use the 7 existing categories for current components. Create new categories from the 7 proposed only when a second component in that category is created. Never create a category for a single component — use an adjacent category instead.

---

## 6. Ownership Rules

### Purpose

Define who owns Shared Components, who may modify them, and how ownership is transferred.

### Engineering Rationale

Without clear ownership, Shared Components become orphaned — no one feels responsible for maintaining them, but everyone fears changing them. Explicit ownership prevents this.

### Recommended Option

**Code-ownership model:**

| Role | Responsibility | Authority |
|---|---|---|
| **Category Maintainer** (1 per category) | Reviews all changes to components in that category; maintains API stability; updates documentation | Approve/reject PRs affecting the category |
| **Component Author** | Creates the component, defines its initial API, documents it | Propose component; maintain after promotion |
| **Consumer** | Uses the component in Features; files issues for gaps | Request changes; do not modify the component directly |

**Assignment rules:**

- The developer who promotes a component becomes its Component Author.
- The most senior consumer of a category becomes its Category Maintainer (rotating annually).
- A component with no consumers for two release cycles is deprecated.

### Trade-offs

- *Dedicated maintainers* ensure quality but create a bottleneck for changes.
- *No maintainers* removes bottlenecks but leads to inconsistent, decaying components.

### Industry Best Practice

Code ownership with maintainers is the standard model in open-source component libraries (Radix, Material UI, shadcn/ui). The CODEOWNERS file enforces review requirements mechanically.

### Recommendation

Assign Category Maintainers for each `@/components/<category>/` directory. Document ownership in a CODEOWNERS file. Require maintainer approval for all changes to shared components.

---

## 7. Promotion Rules

### Purpose

Define the exact criteria and process for promoting a Feature-private Component to the Shared Component Layer.

### Engineering Rationale

Stage 7 established that components start Feature-private and are promoted when a second Feature needs them. Stage 9 formalizes the promotion criteria and process.

### Recommended Option

**A Feature-private Component may be promoted to Shared ONLY when ALL criteria are met:**

1. **Proven reuse.** A second Feature has imported and used the component. "Will be used soon" is not sufficient.
2. **Zero business logic.** All business-specific code, types, constants, and assumptions have been removed. The component uses only generic types.
3. **Stable API.** The props interface has not changed in the last two sprints. Breaking changes after promotion affect all consumers.
4. **Documented.** Storybook stories exist covering all variants, states (loading, error, empty), and edge cases.
5. **Tested.** Unit tests exist for all states. Accessibility tests pass.
6. **Styled with semantic tokens.** All styling uses the Stage 8 semantic token system — no raw colors, no `dark:` variants needed.
7. **Skeleton exists.** A co-located skeleton component exists for loading states.
8. **Review approved.** The Category Maintainer has approved the promotion.

**Promotion process:**

```
1. Developer identifies reuse across 2+ Features
2. Developer abstracts: remove Feature types, add generic props, add className
3. Developer writes Storybook stories + unit tests
4. Developer submits PR targeting @/components/<category>/
5. Category Maintainer reviews against 8 criteria
6. Approved → component moves; import paths update in both Features
7. Original Feature-private file is deleted (not kept — prevents dual maintenance)
```

**Promotion template (for PR description):**

```
## Promotion: [ComponentName] → @/components/[category]/

### Source Feature: [feature-name]
### Consumers: [FeatureA], [FeatureB]

### Changes made for promotion:
- [ ] Removed Feature-specific types
- [ ] Added generic type parameters where needed
- [ ] Added className prop for consumer overrides
- [ ] Added Storybook stories (n stories)
- [ ] Added unit tests (n tests)
- [ ] Converted to semantic token utilities
- [ ] Added co-located skeleton

### Breaking changes from original:
- [List any API differences from the Feature-private version]
```

### Trade-offs

- *Eight criteria* ensure high-quality shared components but make promotion expensive.
- *Fewer criteria* accelerate promotion but risk promoting immature components.

### Industry Best Practice

The Rule of Three (promote at third use) is standard. This specification uses the Rule of Two (promote at second Feature use) because Feature boundaries in this architecture are coarse enough that two Features provide sufficient signal.

### Recommendation

Enforce all eight criteria during promotion review. Use the promotion template for every promotion PR. Never promote a component that fails any criterion — fix the gap first.

---

## 8. Demotion Rules

### Purpose

Define when and how a Shared Component is demoted back to Feature-private or removed entirely.

### Engineering Rationale

Shared Components accumulate as the codebase evolves. A component that once served two Features may now serve only one (the other Feature was removed or replaced). Keeping unshared components in the shared layer misleads future developers who might expect cross-Feature reuse.

### Recommended Option

**A Shared Component qualifies for demotion when:**

1. **Single consumer remaining.** Only one Feature imports the component for two consecutive release cycles.
2. **Feature-specific requirements emerge.** A Feature needs a change that would make the component domain-specific.
3. **Superior alternative exists.** A new component replaces the old one; the old component can be deprecated.

**Demotion process:**

```
1. Category Maintainer identifies qualifying component during quarterly audit
2. Mark as `@deprecated` with migration path in JSDoc
3. Keep for one release cycle (consumers have time to migrate)
4. After one cycle: move to the consuming Feature's _components/
5. After two cycles: delete if no consumers remain
```

**Demotion does NOT mean deletion.** The component moves to the consuming Feature's `_components/` directory, where it can continue to be used and evolved with Feature-specific concerns.

### Trade-offs

- *Two-cycle deprecation* gives consumers time to migrate but delays cleanup.
- *Immediate demotion* is faster but risks breaking consumers who miss the change.

### Industry Best Practice

Deprecation with a migration window is standard in library versioning (semver). A two-release-cycle window is typical for internal libraries where the consumer set is known.

### Recommendation

Audit shared components quarterly. Demote single-consumer components. Never delete a shared component that still has consumers — demote it first.

---

## 9. Component Lifecycle

### Purpose

Define the complete lifecycle of a Shared Component from creation through deprecation and removal.

### Engineering Rationale

A clear lifecycle ensures that every Shared Component has a known state and that developers understand what actions are permitted in each state.

### Recommended Option

**Six-phase lifecycle:**

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Created  │───→│  Alpha   │───→│  Stable  │───→│Deprecated│───→│  Demoted │───→│ Removed  │
│(Feature) │    │(Shared)  │    │(Shared)  │    │(Shared)  │    │(Feature) │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

| Phase | State | Duration | Permitted Changes | Documentation |
|---|---|---|---|---|
| **Created** | Feature-private `_components/` | Until promotion criteria met (or indefinitely) | Any change; breaking changes expected | JSDoc only |
| **Alpha** | `@/components/<category>/` | 1 release cycle | API refinement; breaking changes allowed with notice | JSDoc + basic stories |
| **Stable** | `@/components/<category>/` | Indefinite (until deprecation) | Additive changes only; no breaking changes | Full stories + usage guide |
| **Deprecated** | `@/components/<category>/` | 1 release cycle | Bug fixes only; no new features | `@deprecated` tag + migration guide |
| **Demoted** | Feature `_components/` | Indefinite (or until deletion) | Any change (now Feature-private) | JSDoc only |
| **Removed** | Deleted | N/A | N/A | Archived in git history |

### Trade-offs

- *Six-phase lifecycle* is comprehensive but requires tracking for every component.
- *Three-phase lifecycle* (create → stable → delete) is simpler but provides no deprecation or demotion path.

### Industry Best Practice

Semantic versioning defines the stable API contract. Deprecation with a migration window is standard. The alpha phase allows API refinement before the stability commitment.

### Recommendation

Tag every Shared Component in its JSDoc with its lifecycle phase. Use `@alpha`, `@stable`, `@deprecated` JSDoc tags. Track lifecycle transitions in the component's directory. Never skip phases — a component must pass through Alpha before reaching Stable.

---

## 10. Public API Design

### Purpose

Define how each Shared Component exposes itself to consumers through its file exports and TypeScript interfaces.

### Engineering Rationale

A predictable public API makes Shared Components easy to discover, import, and use. Inconsistent export patterns force developers to read component source to understand how to import them.

### Recommended Option

**Default export for component, named export for props interface, barrel re-export.**

```tsx
// @/components/<category>/data-table.tsx
export interface DataTableProps { ... }
export default function DataTable(props: DataTableProps) { ... }
```

```tsx
// @/components/<category>/index.ts
export { default as DataTable } from "./data-table";
export type { DataTableProps } from "./data-table";
```

**Rules:**

- The primary component is always the default export.
- The props interface is always a named export matching the file name (minus extension) + `Props`.
- Sub-components (row, cell, header, footer) are named exports with the parent name as prefix: `DataTableRow`, `DataTableCell`.
- Sub-components never use default export — they are not the primary export of that file.
- A Shared Component file exports exactly one default export (the component) and its props interface.
- Sub-components MAY be exported from the same file if under 80 lines; otherwise, extract to `parent-sub.tsx` and re-export.

**Barrel export convention:**

```tsx
// @/components/data-display/index.ts
export { default as Avatar } from "./avatar";
export type { AvatarProps } from "./avatar";
export { default as DateDisplay } from "./date-display";
export type { DateDisplayProps } from "./date-display";
export { default as StatusIndicator } from "./status-indicator";
export type { StatusIndicatorProps } from "./status-indicator";
```

Consumers import from the barrel:

```tsx
import { DataTable } from "@/components/tables";
import type { DataTableProps } from "@/components/tables";
```

### Trade-offs

- *Default export + named props type* is the Stage 7 convention and maintains consistency across all component layers.
- *Named export for everything* is more explicit at the import site but deviates from the established convention.

### Industry Best Practice

Stage 7 (Section 9) established the default export convention for all components. Stage 9 extends this convention to Shared Components unchanged.

### Recommendation

Follow the Stage 7 public interface pattern: default export for component, named export for props interface. Use barrel exports for every Shared Component category directory. Sub-components are named exports, never default exports.

---

## 11. Props Strategy

### Purpose

Define how Shared Component props are structured to balance flexibility with discoverability.

### Engineering Rationale

Shared Components serve multiple consumers with different needs. Their props must be flexible enough to accommodate variation but constrained enough to remain predictable. Overly broad props (e.g., `any`, `Record<string, unknown>`) defeat type checking.

### Recommended Option

**Segregated props with required-generic pattern.**

Each Shared Component's props interface is organized into three segments:

```tsx
export interface DataTableProps<T> {
  // DATA: what to render (required)
  columns: ColumnDef<T>[];
  rows: T[];

  // BEHAVIOR: how it behaves (optional, with defaults)
  sortable?: boolean;
  selectable?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedIds: string[]) => void;

  // PRESENTATION: how it looks (optional)
  variant?: "default" | "compact" | "comfortable";
  className?: string;
  emptyMessage?: string;
}
```

**Segregated props rules:**

| Segment | Purpose | Required/Optional | Examples |
|---|---|---|---|
| **DATA** | What the component renders | Required (except for display-only) | `columns`, `rows`, `items`, `value`, `label` |
| **BEHAVIOR** | How the component behaves | Optional with sensible defaults | `sortable`, `onSelect`, `pageSize`, `variant` |
| **PRESENTATION** | How the component looks | Optional | `className`, `emptyMessage`, `size`, `density` |

**Type parameter rules:**

- A Shared Component that renders a collection of items uses a TypeScript generic `<T>` to represent the item type.
- The generic is constrained minimally: `<T extends Record<string, unknown>>` or `<T extends { id: string }>`.
- The generic appears in both the DATA segment and BEHAVIOR callbacks.
- The generic is inferred from usage — consumers rarely need to specify it explicitly.

### Trade-offs

- *Segregated props* are more structured but require more documentation.
- *Flat props* are simpler but mix concerns (data, behavior, presentation) without clear separation.

### Industry Best Practice

Generic type parameters for collection-based components are standard (React Table, TanStack Table, Material UI Data Grid). Segregated props improve IDE autocompletion by grouping related props.

### Recommendation

Use the three-segment props pattern for all Shared Components that render collections. Use flat, explicit props for simple Shared Components. Always use generic type parameters for collection items.

---

## 12. Event Strategy

### Purpose

Define how Shared Components communicate user interactions to consumers via callbacks.

### Engineering Rationale

Consumers need a predictable event model to handle user interactions. Inconsistent callback naming, parameter shapes, and optionality create confusion and bugs.

### Recommended Option

**Unidirectional callback chain with minimal typed payloads.**

```tsx
export interface DataTableProps<T> {
  // Event callbacks (BEHAVIOR segment)
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  onSort?: (column: keyof T, direction: "asc" | "desc") => void;
  onPageChange?: (page: number) => void;
}
```

**Callback rules:**

| Rule | Explanation | Good | Avoid |
|---|---|---|---|
| **Prefix with `on`** | Every callback starts with `on` | `onSelect` | `handleSelect`, `selectCallback` |
| **Minimal data** | Pass only what the consumer needs | `onSelect(itemId)` | `onSelect(event, item)` |
| **Typed payloads** | Precise TypeScript types for parameters | `onSort(column, dir)` | `onSort(data: any)` |
| **Optional by default** | Callbacks are optional unless component is unusable without them | `onSelect?:` | `onSelect: (required)` |
| **No DOM events** | Never expose raw DOM events to consumers | `onChange(value)` | `onChange(event)` |

**Callback location in props:**

Callbacks are placed in the BEHAVIOR segment alongside their related configuration:

```tsx
// Related config + callback co-located
pageSize?: number;
onPageChange?: (page: number) => void;

// Not separated:
pageSize?: number;
// ... other props ...
onPageChange?: (page: number) => void; // Hard to find
```

### Trade-offs

- *Minimal callback data* requires consumers to maintain context (e.g., looking up the full item by ID).
- *Rich callback data* provides full context but couples consumers to the component's data shape.

### Industry Best Practice

The `on` prefix convention matches React's built-in event system and is universal across component libraries. Minimal typed payloads follow the principle of least privilege.

### Recommendation

All callbacks start with `on`, pass minimal typed data, and are optional unless the component cannot function without them. Co-locate callbacks with their related configuration in the props interface. Never pass raw DOM events upward.

---

## 13. Composition Rules

### Purpose

Define how Shared Components compose UI Primitives, how consumers compose Shared Components, and the boundaries between them.

### Engineering Rationale

Composition is the scaling mechanism for the component architecture. Clear composition rules prevent Shared Components from reaching into Feature layers or bypassing UI Primitives.

### Recommended Option

**Strict composition hierarchy:**

```
Allowed compositions:
  Shared Component → UI Primitive (✅)
  Shared Component → Another Shared Component in same category (✅)
  Shared Component → Shared Component in different category (✅, rare)
  Consumer → Shared Component via props (✅)

Forbidden compositions:
  Shared Component → Feature Component (❌)
  Shared Component → Feature Section (❌)
  Shared Component → Feature (❌)
  Shared Component → Raw HTML without UI Primitive wrapping (❌, except structural)
```

**Cross-category composition rules:**

- A Shared Component in `tables/` may import from `navigation/` for pagination: `import { Pagination } from "@/components/navigation"`.
- A Shared Component in `form/` may import from `feedback/` for inline validation messages.
- Cross-category composition is documented in the component's JSDoc.
- Circular cross-category imports are prohibited (detected via ESLint).

**Structural HTML exception:**

Shared Components may use raw `<div>`, `<section>`, `<header>`, `<footer>` for layout structure. Interactive elements (`<button>`, `<input>`, `<select>`) must use UI Primitives from `@/components/ui/`.

### Trade-offs

- *Cross-category imports* create implicit dependencies between categories but prevent duplicate implementations.
- *Isolated categories* (no cross-category imports) eliminate implicit dependencies but force duplication of pagination, selection, and other cross-cutting patterns.

### Industry Best Practice

Cross-category composition is standard in component libraries: a Data Table often composes Pagination, Checkbox (for selection), and Button (for actions). The key constraint is unidirectional dependency — never upward.

### Recommendation

Allow cross-category composition within the shared layer. Prohibit upward composition (Shared → Feature). Use UI Primitives for all interactive HTML elements. Document cross-category dependencies in JSDoc.

---

## 14. Slot Strategy

### Purpose

Define how Shared Components expose extension points for consumers to inject custom content without modifying the component's internals.

### Engineering Rationale

Shared Components must accommodate Feature-specific content without accepting Feature-specific props. Slots (via `ReactNode` props) are the mechanism. Without a consistent slot strategy, consumers either pass massive configuration objects or fork the component.

### Recommended Option

**Slot-based extensibility for all non-standard content areas.**

```tsx
export interface DataTableProps<T> {
  // Standard DATA props
  columns: ColumnDef<T>[];
  rows: T[];

  // SLOTS: override points for feature-specific content
  actions?: ReactNode;           // Top-right action area
  toolbar?: ReactNode;           // Full toolbar above table
  emptyState?: ReactNode;        // Custom empty state (replaces default)
  loadingOverlay?: ReactNode;    // Custom loading indicator
  rowActions?: (row: T) => ReactNode;  // Per-row actions column
}
```

**Slot naming convention:**

| Pattern | Example | Purpose |
|---|---|---|
| **Named `ReactNode`** | `toolbar`, `actions`, `emptyState` | Simple slot for rendered content |
| **Render function** | `rowActions={(row) => ...}` | Slot that needs access to data |
| **Component injection** | `checkboxComponent: Checkbox` | Slot for replacing a sub-component |

**When to add a slot:**

- A Feature needs content in a specific area of the Shared Component.
- The content is Feature-specific (domain-dependent) and cannot be a prop of the Shared Component.
- The same area is needed by multiple Features (proven reuse).

**When NOT to add a slot:**

- The content is the same for all consumers — make it a prop, not a slot.
- The slot would expose internal implementation details.
- The slot would bypass the component's state management.

### Trade-offs

- *Slots provide maximum flexibility* but increase the component's API surface and testing matrix.
- *No slots* keeps the API minimal but forces consumers to customize via `className` tricks or CSS overrides.

### Industry Best Practice

Slots are the standard extensibility mechanism in component libraries. Radix UI uses slots extensively (`asChild` pattern). shadcn/ui uses `ReactNode` props for customizable content areas.

### Recommendation

Add slots only when a proven consumer need exists. Name slots descriptively. Prefer `ReactNode` slots over render functions unless the slot needs data context. Never expose internal implementation details through slots.

---

## 15. Children Strategy

### Purpose

Define when to use `children` vs named props for content injection in Shared Components.

### Engineering Rationale

`children` is the most flexible content injection mechanism but provides no semantic information about where the content renders. Named props (`toolbar`, `actions`, `footer`) provide layout context but require more props. Choosing the wrong mechanism creates confusing component APIs.

### Recommended Option

**`children` for primary content; named props for secondary content.**

```tsx
// Card (primary content = children, simple)
<Card>
  <p>This is the primary content.</p>
</Card>

// Dialog (primary content = children + named sections)
<Dialog>
  <DialogHeader>
    <DialogTitle>Title</DialogTitle>
  </DialogHeader>
  <p>This is the primary content.</p>
  <DialogFooter>
    <Button>Cancel</Button>
    <Button>Save</Button>
  </DialogFooter>
</Dialog>
```

**Decision table:**

| Pattern | Use Case | Example |
|---|---|---|
| **`children` only** | Component has one content area | `Card`, `Badge`, `AlertBanner` |
| **Named props + `children`** | Component has multiple content areas | `PageHeader` (title, description as props; no children) |
| **Compound components** | Component has multiple named content areas with layout | `DialogHeader` + `DialogContent` + `DialogFooter` |
| **No `children`** | Component renders no external content | `Pagination`, `ProgressIndicator`, `StatusIndicator` |

**Compound component pattern for Shared Components:**

```tsx
// Dialog uses compound components for named sections
import { DialogContent, DialogHeader, DialogFooter } from "@/components/dialogs";

<Dialog>
  <DialogHeader>
    <DialogTitle>Confirm Deletion</DialogTitle>
    <DialogDescription>This action cannot be undone.</DialogDescription>
  </DialogHeader>
  <DialogContent>
    <p>Are you sure you want to delete this item?</p>
  </DialogContent>
  <DialogFooter>
    <Button variant="ghost">Cancel</Button>
    <Button variant="danger">Delete</Button>
  </DialogFooter>
</Dialog>
```

**Compound component rules:**

1. The parent component provides context via React Context to its children.
2. Child components are named exports from the same file (or sibling files).
3. Children are optional — the parent renders a default layout if no children provided.
4. Children may be reordered by the consumer.

### Trade-offs

- *Compound components* provide maximum layout flexibility but increase file count and API surface.
- *Single component with many props* is simpler to implement but creates rigid layouts.

### Industry Best Practice

Compound components are the standard pattern for dialog, menu, dropdown, accordion, and tab components. Radix UI and shadcn/ui use this pattern extensively. The context-based communication keeps parent and children loosely coupled.

### Recommendation

Use `children` for primary content. Use named props for metadata (titles, descriptions, counts). Use compound components for multi-section layouts (dialog, table, accordion). Document which pattern a component uses in its JSDoc.

---

## 16. Variant Strategy

### Purpose

Define a consistent variant system across all Shared Components, extending the Stage 8 six-axis system where applicable.

### Engineering Rationale

Stage 8 defined six variant axes: visual, size, density, interaction, shape, width. Shared Components should implement the axes that are meaningful for their role. Inconsistent variant naming across components creates confusion.

### Recommended Option

**Inherit Stage 8 axes; extend with domain-agnostic component-specific variants.**

```tsx
// Shared Component variant props (inherited from Stage 8)
export interface CardProps {
  variant?: "default" | "interactive" | "highlight" | "compact";  // visual axis
  size?: "sm" | "md" | "lg";                                      // size axis
  density?: "compact" | "default" | "comfortable";                 // density axis
}

// Component-specific extension (DataTable adds density + selection behavior)
export interface DataTableProps<T> {
  variant?: "default" | "striped" | "bordered";  // table-specific visual variants
  size?: "sm" | "md";                             // subset of size axis
  density?: "compact" | "default";                // subset of density axis
  selection?: "single" | "multi" | "none";        // component-specific behavior
}
```

**Variant naming consistency rules:**

| Axis | Values (Shared Components) | Example Components |
|---|---|---|
| Visual | `default`, `primary`, `secondary`, `outline`, `ghost`, `danger` | Button, Badge, Alert |
| Size | `xs`, `sm`, `md`, `lg`, `xl` | Button, Input, Badge |
| Density | `compact`, `default`, `comfortable` | Table, List, Card grid |
| Shape | `square`, `rounded`, `pill`, `circle` | Avatar, Badge, Button |
| Width | `auto`, `full`, `fit` | Button, Input, Card |
| Feedback | `success`, `warning`, `danger`, `info`, `neutral` | Alert, Badge, StatusIndicator |

**Shared Components must:**
- Use the same variant names as Stage 8 for the same variant types.
- Define component-specific variants only when the Stage 8 axes are insufficient.
- Document which axes are supported in the JSDoc.

### Trade-offs

- *Consistent variant names* reduce cognitive load but may not perfectly fit every component.
- *Component-specific variants* are more natural for each component but create naming drift.

### Industry Best Practice

Consistent variant naming across components is a hallmark of well-designed component libraries (Material UI, shadcn/ui). The same `variant="primary"` means the same thing across Button, Badge, and Alert.

### Recommendation

Adopt the Stage 8 variant axes as the universal variant vocabulary. Extend with component-specific variants only when justified. Never use a different name for the same concept (e.g., `kind="main"` instead of `variant="primary"`).

---

## 17. State Ownership

### Purpose

Define which state belongs to a Shared Component and how it is managed internally versus delegated to consumers.

### Engineering Rationale

Shared Components manage generic UI state (pagination page, search query, sort column, selected items, expanded sections). They must not manage Feature-specific state (current user, fetched data, permissions). Clear boundaries prevent state leakage.

### Recommended Option

**Two-tier state ownership with controlled/uncontrolled pattern.**

```tsx
export interface DataTableProps<T> {
  // Controlled props (consumer manages state)
  page?: number;
  onPageChange?: (page: number) => void;
  sortColumn?: keyof T;
  sortDirection?: "asc" | "desc";
  onSort?: (column: keyof T, direction: "asc" | "desc") => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;

  // Uncontrolled props (component manages state)
  defaultPage?: number;
  defaultSortColumn?: keyof T;
  defaultSortDirection?: "asc" | "desc";
}
```

**State ownership table:**

| State Type | Examples | Owner | Mechanism |
|---|---|---|---|
| **Component-local UI** | Hover, focus, expanded | Component | `useState` (internal, never exposed) |
| **Component-managed state** | Pagination, search query, active sort | Component (uncontrolled) or Consumer (controlled) | Controlled/uncontrolled pattern |
| **Consumer state** | Selected items, filters | Consumer (Section or Feature) | Callbacks + controlled props |
| **Feature state** | Current user, permissions, fetched data | Feature state layer | Never enters Shared Component |

**Controlled/uncontrolled decision:**

- Default to uncontrolled (component manages its own state).
- Support controlled via props when consumers need to read or reset state.
- A component with 3+ controlled props should offer an uncontrolled variant with default values.

### Trade-offs

- *Controlled/uncontrolled pattern* is flexible but doubles the props for state-managing components.
- *Controlled-only* is simpler but forces all consumers to manage state even when they don't need to.

### Industry Best Practice

The controlled/uncontrolled pattern is standard in React component libraries (Radix UI, Material UI). It gives consumers maximum flexibility while keeping the component usable out of the box.

### Recommendation

Shared Components manage their own UI state by default. Support controlled props for consumers that need state access. Never accept or manage Feature-specific state. Document the controlled/uncontrolled behavior in JSDoc.

---

## 18. Data Responsibility

### Purpose

Define what data processing a Shared Component may perform and what must remain in the consumer.

### Engineering Rationale

Shared Components receive data from consumers and render it. Data transformation, filtering, sorting, and business logic belong to the consumer (Section or Feature). A Shared Component that processes business data becomes coupled to domain concerns.

### Recommended Option

**Shared Components perform generic data operations only.**

**Permitted data operations:**

- Generic sorting (by column key, direction).
- Generic filtering (by string match, by category).
- Generic pagination (slicing by page size).
- Generic selection (tracking selected IDs).
- Display formatting (date formatting via date-fns, number formatting via `Intl`).

**Forbidden data operations:**

- Business-specific sorting or filtering logic.
- Domain validation of any kind.
- Data fetching or caching.
- Computing derived business values (percentages, totals, aggregates).
- Transforming API response shapes.

```tsx
// ✅ Permitted: generic sorting by column key
function sortRows<T>(rows: T[], column: keyof T, direction: "asc" | "desc"): T[] {
  return [...rows].sort((a, b) => {
    const aVal = a[column];
    const bVal = b[column];
    return direction === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });
}

// ❌ Forbidden: business-specific logic inside a Shared Component
// function filterByRole(rows: User[], role: "admin" | "alumni"): User[] { ... }
```

### Trade-offs

- *Generic operations only* keeps Shared Components reusable but forces consumers to pre-process business-specific filtering.
- *Business operations in Shared Components* would make them more convenient for specific use cases but destroy reusability.

### Industry Best Practice

The principle of separating generic from specific operations is universal in software architecture. Generic operations (sort, paginate, filter by text) belong in shared utilities; specific operations (filter by role, calculate tenure) belong in Feature code.

### Recommendation

Shared Components may implement generic sorting, filtering, pagination, and selection. All business-specific data operations belong in the consumer (Section or Feature). Any Shared Component that imports from a Feature's `_types/` or `_services/` is architecturally违规.

---

## 19. Accessibility

### Purpose

Define the accessibility responsibilities specific to the Shared Component Layer.

### Engineering Rationale

Stage 7 defined a component-level a11y checklist. Shared Components have additional responsibilities because they are used across Features — accessibility issues in a Shared Component affect every Feature.

### Recommended Option

**Extended a11y mandate for Shared Components.**

All Stage 7 accessibility rules apply, plus:

| Requirement | Stage 7 Baseline | Stage 9 Extension |
|---|---|---|
| **ARIA attributes** | Correct roles, states, properties | Live regions for dynamic content; `aria-sort` for sortable columns; `aria-selected` for selection |
| **Keyboard navigation** | Tab, Enter, Space, Arrow, Escape | Full ARIA APG patterns: grid navigation for tables, combobox for search, dialog for modals |
| **Focus management** | Return focus on dismiss | Focus trap for modals; `aria-activedescendant` for combobox; programmatic focus for pagination |
| **Screen reader** | Semantic elements | Announcements for sort changes, selection changes, page changes via `aria-live` |
| **Touch targets** | 44×44px minimum | 44×44px for all interactive elements including pagination buttons, row actions, sort headers |
| **Reduced motion** | Respect `prefers-reduced-motion` | No auto-playing animations; tab pauses for carousels |
| **High contrast** | Not required | Support Windows High Contrast Mode via `forced-colors` media query |

**Shared Component a11y review process:**

1. Automated: Storybook a11y addon (`@storybook/addon-a11y`) runs on every story.
2. Manual: Keyboard navigation test for every interactive element.
3. Manual: Screen reader test (VoiceOver) for complex components (DataTable, Dialog, Combobox).
4. Required: All a11y tests must pass before promotion from Alpha to Stable.

### Trade-offs

- *Extended a11y mandate* adds development and testing overhead but ensures all consumers benefit from accessible components.
- *Baseline a11y only* (Stage 7 level) is simpler but shifts accessibility responsibility to each Feature, increasing duplication.

### Industry Best Practice

WCAG 2.2 AA compliance requires the accessibility features listed above. ARIA APG provides implementation patterns for complex widgets. Storybook a11y addon automates the most common checks.

### Recommendation

Implement the extended a11y mandate for all Shared Components. Automated a11y checks run in CI. Manual keyboard and screen reader tests are required for promotion to Stable. Document a11y features in the component's usage guide.

---

## 20. Responsive Behavior

### Purpose

Define how Shared Components adapt to different viewport sizes and device types.

### Engineering Rationale

Shared Components are used across the entire application — on mobile, tablet, and desktop viewports. Each component must define its responsive behavior explicitly rather than leaving it to consumers to override.

### Recommended Option

**Mobile-first responsive design with component-level breakpoints.**

```tsx
// DataTable responsive behavior
// Mobile (< 768px): horizontal scroll with sticky first column
// Tablet (768-1024px): full table with reduced density
// Desktop (> 1024px): full table with standard density
export interface DataTableProps<T> {
  responsive?: "scroll" | "collapse" | "card";  // Responsive strategy
}
```

**Responsive strategies by component type:**

| Component Type | Mobile (< 768px) | Tablet (768-1024px) | Desktop (> 1024px) |
|---|---|---|---|
| **DataTable** | Horizontal scroll | Full table, compact density | Full table, default density |
| **Dialog** | Full-screen modal | Centered modal (max-w-sm) | Centered modal (max-w-md) |
| **SearchBar** | Full width, icon-only button | Full width, label visible | Fixed width, label visible |
| **Tabs** | Horizontal scroll tab bar | Full tab bar | Full tab bar |
| **Pagination** | Prev/Next + page count | Full page numbers | Full page numbers |
| **Breadcrumb** | Last 2 items + ellipsis | Last 3 items | Full trail |
| **Sidebar** | Overlay drawer | Collapsible sidebar | Fixed sidebar |

**Responsive implementation rules:**

1. Mobile-first: base styles are mobile; responsive variants (`sm:`, `md:`, `lg:`) add override.
2. Shared Components never use `hidden` to hide content on mobile without a visible alternative.
3. Touch targets remain 44×44px at all breakpoints.
4. Horizontal scroll containers have visible scroll indicators (`overflow-x-auto` with custom scrollbar).
5. Responsive behavior is documented in the component's usage guide.

### Trade-offs

- *Component-level responsive behavior* ensures consistency but requires every component to define its own responsive rules.
- *Consumer-level responsive behavior* gives Features control over layout but creates inconsistent experiences.

### Industry Best Practice

Responsive behavior built into components is standard (Material UI's `Grid`, Ant Design's responsive tables). Component-level breakpoints ensure consistent behavior across all consumers.

### Recommendation

Every Shared Component defines its responsive behavior for mobile, tablet, and desktop. Document the responsive strategy in the component's JSDoc. Use Tailwind's responsive variants for implementation. Never rely on consumers to make a Shared Component responsive.

---

## 21. Loading Strategy

### Purpose

Define how Shared Components communicate loading state to users.

### Engineering Rationale

Shared Components receive data asynchronously from consumers. Without consistent loading states, each Feature builds its own loading UI, creating visual inconsistency and duplicated effort.

### Recommended Option

**Two-tier loading with component-co-located skeletons.**

```tsx
export interface DataTableProps<T> {
  // Loading control
  isLoading?: boolean;
  loadingSkeleton?: ReactNode;  // Custom skeleton (defaults to DataTableSkeleton)
}
```

**Loading approach by component type:**

| Component | Loading State | Visual |
|---|---|---|
| **DataTable** | `isLoading=true` | `DataTableSkeleton` — rows of animated placeholders matching column count |
| **Card** | `isLoading=true` | Skeleton block matching card dimensions |
| **Avatar** | `isLoading=true` | Skeleton circle matching avatar size |
| **SearchBar** | `isLoading=true` | Disabled state with subtle pulse |
| **Pagination** | `isLoading=true` | Disabled buttons with skeleton page numbers |
| **ProgressIndicator** | N/A | Always visible (progress IS the loading state) |

**Skeleton naming convention:**

```tsx
// Co-located skeleton (same file or sibling file)
export function DataTableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
```

**Loading state rules:**

1. Every Shared Component that receives async data provides an `isLoading` prop.
2. Every Shared Component with `isLoading` co-locates a skeleton matching its layout.
3. Skeletons use the existing `Skeleton` UI Primitive from `@/components/skeletons/`.
4. Skeletons match the component's dimensions exactly to prevent layout shift.
5. Skeletons respect reduced motion via the global `prefers-reduced-motion` rule.
6. Skeletons never include text content — they are pure shape placeholders.

### Trade-offs

- *Component-level skeletons* provide accurate loading states but require maintenance when the component's layout changes.
- *Generic spinner* requires no maintenance but provides no information about the loading content's structure.

### Industry Best Practice

Skeleton screens are the recommended loading pattern for content-driven UIs. They provide perceived performance benefits by giving users a preview of the page structure.

### Recommendation

Every Shared Component with async data implements `isLoading` + co-located skeleton. Skeletons match the component's layout dimensions. The skeleton is the default; consumers may override via `loadingSkeleton` slot.

---

## 22. Error Handling

### Purpose

Define how Shared Components communicate error states to users and propagate errors to consumers.

### Engineering Rationale

Shared Components receive data that may be invalid, stale, or absent due to errors. Consistent error states prevent each Feature from implementing its own error UI and ensure a uniform user experience.

### Recommended Option

**Two-tier error handling with inline error state and error callback.**

```tsx
export interface DataTableProps<T> {
  // Error control
  hasError?: boolean;
  errorMessage?: string;
  errorAction?: ReactNode;  // "Retry" or alternative action
  onError?: (error: Error) => void;  // Callback for error reporting
}
```

**Error behavior by severity:**

| Severity | Visual | Behavior |
|---|---|---|
| **Data error** (failed to load) | Error banner or inline error state | Shows `errorMessage` + optional retry button; `onError` callback fires |
| **Interaction error** (invalid user action) | Inline validation message | Prevents the action; shows error message near the action point |
| **Render error** (exception in component) | Let error propagate to consumer boundary | Shared Component never catches render errors — let React error boundaries handle them |

**Shared Components must NOT:**

- Swallow errors silently.
- Show generic "Something went wrong" without context.
- Catch errors from consumer callbacks.
- Implement global error boundaries.

```tsx
// ✅ Correct: error state with message and retry
if (hasError) {
  return (
    <Card>
      <CardContent>
        <p className="text-text-muted">{errorMessage ?? "Unable to load data."}</p>
        {errorAction}
      </CardContent>
    </Card>
  );
}

// ❌ Incorrect: catching consumer callback errors
try {
  onSelect?.(item);
} catch (e) {
  // Never catch consumer errors — let them propagate
}
```

### Trade-offs

- *Inline error states* give consumers ready-made error UI but cannot cover every possible error scenario.
- *Error slots* (custom `ReactNode` for error state) provide flexibility but add to the component's API surface.

### Industry Best Practice

Inline error states for data components are standard (Material UI's `DataGrid` has `error` prop). Error boundaries at the Section or Feature level handle unexpected render errors.

### Recommendation

Every Shared Component with async data implements `hasError` prop with inline error state. Error messages are configurable via props. Render errors propagate to consumer error boundaries. Never catch consumer callback errors.

---

## 23. Empty States

### Purpose

Define how Shared Components render when they receive empty data sets.

### Engineering Rationale

Empty states are a UX concern that every data-rendering component must address. Consistent empty states across Shared Components provide a unified experience regardless of which Feature renders them.

### Recommended Option

**Configurable empty state with default messaging.**

```tsx
export interface DataTableProps<T> {
  // Empty state control
  rows: T[];  // Empty array → triggers empty state
  emptyMessage?: string;
  emptyAction?: ReactNode;  // CTA button or link
  emptyIcon?: ReactNode;    // Override default empty icon
}
```

**Empty state defaults by component type:**

| Component | Default `emptyMessage` | Default Visual |
|---|---|---|
| **DataTable** | "No items to display." | Empty illustration + message |
| **SearchBar** | "No results found." | Search icon + message |
| **List (generic)** | "Nothing here yet." | Inbox icon + message |
| **Timeline** | "No activity recorded." | Clock icon + message |
| **FilterBar** | "No items match your filters." | Filter icon + message |

**Empty state rules:**

1. Every Shared Component that receives an array provides a default empty state.
2. Empty messages are configurable via props (consumers provide domain context).
3. Empty states may include a CTA via `emptyAction` slot.
4. Empty states distinguish between "no data yet" (initial state) and "no results" (filtered state) — use different messages.
5. Empty states use the existing `EmptyState` UI Primitive from `@/components/ui/` where applicable.
6. Empty states are never animated — they appear instantly when data is empty.

### Trade-offs

- *Configurable empty states* require props for every message but allow Features to provide domain-appropriate content.
- *Fixed empty states* are simpler but force Features to override with CSS tricks or conditional rendering.

### Industry Best Practice

Empty states are part of the component contract. Material UI's `DataGrid` provides `noRowsLabel` prop. shadcn/ui components expect consumers to handle empty states conditionally.

### Recommendation

Every data-rendering Shared Component implements a configurable empty state. Provide sensible defaults so components work without configuration. Use the `EmptyState` UI Primitive as the base visual.

---

## 24. Performance Strategy

### Purpose

Define performance best practices specific to the Shared Component Layer.

### Engineering Rationale

Shared Components are used across the entire application. A performance issue in a Shared Component affects every consumer. Performance must be built into the component architecture, not retrofitted.

### Recommended Option

**Six performance principles for Shared Components:**

| Principle | Implementation | Applies To |
|---|---|---|
| **Server-first** | No `"use client"` unless interactivity requires it | Display, layout, skeleton components |
| **Stable prop references** | All callback props accept stable references via `useCallback` | All interactive components |
| **Lazy loading** | Wrap large dependencies with `dynamic(() => import(...))` | Charts, rich text, maps |
| **List virtualization** | Render only visible rows when list exceeds 50 items | DataTable, Timeline, ActivityList |
| **Bundle splitting** | Each category directory is an async chunk boundary | Large categories (tables, dialogs) |
| **CSS-only animations** | Use CSS transitions over JS animations | All micro-interactions |

**Performance rules:**

1. Display-only Shared Components (no interactivity) are Server Components — no `"use client"`.
2. Interactive Shared Components minimize client-side JavaScript — only the interactive behavior code.
3. Virtualization is opt-in via a `virtualized` prop: `<DataTable virtualized rows={items} />`.
4. Large third-party libraries (date pickers, rich text editors) are lazy-loaded.
5. Shared Components never import heavy libraries globally — use dynamic imports.

**Virtualization threshold:**

```tsx
export interface DataTableProps<T> {
  // Virtualization is automatic when rows > 50
  rows: T[];
  // Consumer can override
  virtualized?: boolean;  // Default: auto (true when rows > 50)
}
```

### Trade-offs

- *Server-first by default* eliminates client JavaScript for display components but requires the `"use client"` boundary to be explicit at the interactive layer.
- *Automatic virtualization* is convenient but adds complexity to the component implementation.

### Industry Best Practice

React Server Components, lazy loading, and list virtualization are standard performance patterns in modern Next.js applications. TanStack Virtual is the standard virtualization library.

### Recommendation

Make all Shared Components Server Components by default. Add `"use client"` only at the interactive boundary. Virtualize lists exceeding 50 items. Lazy-load heavy third-party dependencies. Profile before optimizing — don't pre-emptively memoize.

---

## 25. Memoization Strategy

### Purpose

Define when and how Shared Components use `React.memo`, `useMemo`, and `useCallback`.

### Engineering Rationale

Incorrect memoization is worse than no memoization — it adds memory overhead and stale closure bugs. A clear memoization strategy prevents both over-memoization and under-memoization.

### Recommended Option

**Profile-first memoization with documented decisions.**

```tsx
// ✅ Correct: memoization justified by re-render profiling
const DataTableRow = memo(function DataTableRow<T>({ row, columns }: DataTableRowProps<T>) {
  return (
    <tr>
      {columns.map((col) => (
        <td key={String(col.accessor)}>{row[col.accessor]}</td>
      ))}
    </tr>
  );
});
```

**Memoization decision table:**

| Scenario | Approach | Rationale |
|---|---|---|
| **Row rendering in DataTable** (many instances) | `React.memo` on row component | Each row re-renders independently; memo prevents full re-render on single row change |
| **Callback props from consumer** | Consumer uses `useCallback`; component does NOT memo the callback | The component cannot control how consumers pass callbacks — stable references are the consumer's responsibility |
| **Derived data in component** (sorted, filtered rows) | `useMemo` for expensive computations (> O(n log n)) | Prevents re-computation of sorted data on every render |
| **Simple display component** (Badge, Avatar) | No memoization | Render cost is negligible; memo adds comparison overhead |
| **Component wrapping heavy children** | No memoization on parent | Memo parent only if profiling confirms benefit |

**Memoization rules for Shared Components:**

1. Never pre-emptively memoize. Profile with React DevTools to confirm re-render benefit.
2. Memo row/item components that render in lists (5+ instances per parent).
3. Document memoization decisions with a comment explaining the profiling evidence.
4. Never memo at the expense of readability — a simple component without memo is preferable to a complex memoized component.
5. Re-export memoized components with the original type:

```tsx
const DataTableRow = memo(function DataTableRow<T>(props: DataTableRowProps<T>) {
  return (/* ... */);
}) as typeof DataTableRow_Unmemo;

// Or simply export and let the consumer decide:
export default DataTable;  // Not memoized — consumers wrap if needed
```

### Trade-offs

- *No pre-emptive memoization* may miss some optimization opportunities but prevents bugs and memory waste from incorrect memoization.
- *Pre-emptive memoization of all list items* provides a safety net but adds unnecessary overhead for small lists.

### Industry Best Practice

React's documentation recommends profiling before memoizing. Dan Abramov's "Before You Memo" post explains the principle. The React DevTools profiler is the standard tool for identifying re-render issues.

### Recommendation

Do not pre-emptively memoize Shared Components. Profile with React DevTools to identify expensive re-renders. Memo row components in virtualized or long lists. Document memoization decisions. Let consumers stabilize their callback references with `useCallback`.

---

## 26. Virtualization Support

### Purpose

Define when and how Shared Components implement virtualization for large data sets.

### Engineering Rationale

Rendering hundreds or thousands of DOM nodes causes performance degradation. Virtualization renders only visible nodes, keeping the DOM size manageable. Shared Components that render collections must support virtualization.

### Recommended Option

**Virtualization as an opt-in feature using `@tanstack/virtual`.**

```tsx
export interface DataTableProps<T> {
  rows: T[];
  virtualized?: boolean;  // Default: auto-enabled when rows > 50
  rowHeight?: number;     // Fixed row height for virtualization (default: 48px)
  overscan?: number;      // Rows rendered above/below viewport (default: 5)
}
```

**Virtualization eligibility:**

| Component Type | Virtualization | Implementation |
|---|---|---|
| **DataTable** | Required for 50+ rows | `@tanstack/react-virtual` with fixed row height |
| **Timeline** | Recommended for 100+ items | Simple virtualization (fixed item height) |
| **List / ActivityList** | Recommended for 100+ items | Same as Timeline |
| **Dropdown / Select options** | Required for 50+ options | Lightweight virtualization or windowing |
| **Search results** | Recommended for 100+ results | Same as DataTable |

**Virtualization rules:**

1. Virtualization is opt-in via the `virtualized` prop (default behavior: auto-enable based on data size).
2. Virtualized components require a fixed row/item height for accurate scroll calculations.
3. Row height is configurable via prop with a sensible default.
4. Overscan (rows rendered above/below viewport) defaults to 5 and is configurable.
5. Virtualized components use `@tanstack/react-virtual` (or alternative if performance needs differ).
6. Virtualized components fall back to non-virtualized rendering when `virtualized=false`.

**Non-virtualized default:**

Even without virtualization, Shared Components implement basic performance guards:

- Limit: Render only first N items if no pagination is configured.
- Warning: Console warning when rendering 500+ items without virtualization enabled.

### Trade-offs

- *Built-in virtualization* provides seamless performance for large data sets but adds implementation complexity.
- *No virtualization (consumer responsibility)* keeps Shared Components simpler but forces every consumer to implement their own virtualization.

### Industry Best Practice

TanStack Virtual is the standard virtualization library for React. Material UI's DataGrid has built-in virtualization. The threshold of 50+ rows for automatic enablement balances performance with simplicity.

### Recommendation

Implement virtualization in collection-based Shared Components (DataTable, Timeline, List). Enable automatically for data sets exceeding 50 rows. Use `@tanstack/react-virtual`. Support a `virtualized` prop for consumer override.

---

## 27. Styling Ownership

### Purpose

Define who owns the styling of Shared Components and how styling is applied.

### Engineering Rationale

Stage 8 established semantic design tokens. Shared Components must consume only semantic tokens and never reference raw colors, raw spacing, or dark-mode-specific overrides.

### Recommended Option

**Semantic token consumption with consumer override via `className`.**

```tsx
// ✅ Correct: only semantic token classes, no dark mode overrides needed
export default function Card({ children, className }: CardProps) {
  return (
    <div className={cn(
      "rounded-lg border border-border-default bg-surface-card p-inset-sm",
      className  // Consumer overrides appended last
    )}>
      {children}
    </div>
  );
}
```

**Styling ownership rules:**

| Concern | Owner | Mechanism |
|---|---|---|
| **Base styling** | Shared Component | Semantic token utility classes in component JSX |
| **Theme adaptation** | Token system (Stage 8) | `--color-surface-card`, `--color-border-default` change value in `.dark` |
| **Consumer overrides** | Consumer via `className` | `cn()` merges consumer classes last; overrides via higher specificity |
| **Responsive variants** | Shared Component | Tailwind responsive prefixes in JSX |
| **Component-level tokens** | Shared Component (rare) | CSS custom properties scoped to component root |

**Dark mode in Shared Components:**

Because all Shared Components use semantic tokens (Stage 8), dark mode is handled automatically. No `dark:` variants are needed in Shared Component code. This is a key difference from Stage 7 Feature Components, which still use `dark:` variants.

**When a Shared Component needs a non-token value:**

1. Define a CSS custom property on the component's root element.
2. Use `style` prop for dynamic runtime values (e.g., progress percentage).
3. Document the exception with a comment explaining why no token exists.

### Trade-offs

- *Semantic-only styling* eliminates dark mode overrides and raw color usage but requires the token system to cover all needed values.
- *Hybrid styling* (tokens + raw where convenient) is more flexible but undermines the token system's authority.

### Industry Best Practice

Semantic design token consumption is the standard approach for component libraries built on design systems (Shopify Polaris, Adobe Spectrum, Vercel). Tailwind v4's `@theme inline` makes this pattern idiomatic.

### Recommendation

Shared Components use only semantic token utilities. No raw colors, no raw spacing, no `dark:` overrides. Accept `className` for consumer overrides. Use inline styles only for runtime-dynamic values.

---

## 28. Theme Integration

### Purpose

Define how Shared Components integrate with the application's theming system (light, dark, future themes).

### Engineering Rationale

Stage 8 established a CSS-variable-based theming system with class activation. Shared Components must be theme-agnostic — they render correctly in all themes without any theme-specific logic.

### Recommended Option

**Theme-agnostic Shared Components.**

Shared Components never:

- Reference theme context directly (`useTheme()`).
- Apply theme-specific styling (`dark:`, `light:` variants).
- Import theme-related utilities.
- Render different content based on active theme.

```tsx
// ✅ Correct: theme-agnostic (styling from tokens)
export default function Card({ children }: CardProps) {
  return (
    <div className="rounded-lg border border-border-default bg-surface-card p-inset-sm">
      {children}
    </div>
  );
}

// ❌ Incorrect: theme-aware (references theme directly)
export default function Card({ children }: CardProps) {
  const { theme } = useTheme();
  return (
    <div className={theme === "dark" ? "bg-gray-900" : "bg-white"}>
      {children}
    </div>
  );
}
```

**Theme integration rules:**

1. Shared Components are theme-agnostic by construction — semantic tokens handle all theme variation.
2. No Shared Component imports `next-themes` or any theme context.
3. No Shared Component applies conditional styling based on theme state.
4. No Shared Component uses `dark:` or other theme-specific CSS variants.
5. A Shared Component that needs theme-aware behavior must use a slot or callback.

**Future theme support:**

When a new theme is added (e.g., high-contrast), no Shared Component changes are needed. The theme system overrides semantic token values in `.high-contrast`, and all Shared Components automatically render with the new theme.

### Trade-offs

- *Theme-agnostic components* are simpler and more maintainable but require complete token coverage for all visual states.
- *Theme-aware components* can handle edge cases the token system misses but couple the component to the theming implementation.

### Industry Best Practice

CSS-variable-based theming with theme-agnostic components is the industry standard (Radix UI, shadcn/ui, Material UI with CSS variables). Components remain unaware of which theme is active.

### Recommendation

All Shared Components are theme-agnostic. Semantic tokens handle all theme variation. No theme context imports, no `dark:` variants, no conditional theme logic. Future themes require zero Shared Component changes.

---

## 29. Design System Integration

### Purpose

Define how Shared Components consume the Stage 8 design system and how they participate in its evolution.

### Engineering Rationale

The Stage 8 design system provides tokens, variants, and patterns. Shared Components are the primary consumers of these design decisions. Without explicit integration rules, components drift from the design system or bypass it entirely.

### Recommended Option

**Four integration points:**

| Integration | Mechanism | Enforcement |
|---|---|---|
| **Tokens** | Shared Components use only `@theme inline` semantic token utilities | Code review; no raw colors or spacing |
| **Variants** | Shared Components use Stage 8 variant axes (visual, size, density, shape) | Props interface review matches Stage 8 naming |
| **Typography** | Shared Components use Tailwind typography utilities (`text-sm`, `font-medium`) only | Code review; no arbitrary font sizes |
| **Spacing** | Shared Components use semantic spacing tokens (`p-inset-sm`, `gap-stack-md`) | Code review; no arbitrary spacing values |

**Design system evolution participation:**

When the design system evolves (new tokens, changed values, new variants):

1. **Token value changes** — No Shared Component changes needed. Token values update in `globals.css`; all consumers automatically receive new values.
2. **New tokens** — Shared Components may adopt new tokens as they are added to `@theme inline`. No migration needed — old and new tokens coexist.
3. **Deprecated tokens** — Shared Components update to new tokens during the deprecation window (one release cycle). No breaking changes.
4. **New variants** — Shared Components add new variant values to their props interface. Old values remain valid. Additive change only.

**Category maintainer responsibility:**

Each Category Maintainer tracks design system changes and updates their category's components to adopt new tokens within one release cycle.

### Trade-offs

- *Tight integration* with the design system ensures visual consistency but creates coupling between component updates and design system evolution.
- *Loose integration* allows components to evolve independently but risks visual drift.

### Industry Best Practice

Design system tokens as CSS variables provide loose coupling between token values and component code. Component updates are limited to adopting new token names when old ones are deprecated.

### Recommendation

Integrate Shared Components with the Stage 8 design system exclusively through semantic tokens. No direct consumption of raw design values. Adopt new tokens within one release cycle of their introduction. Update deprecated tokens before the deprecation window expires.

---

## 30. Dependency Rules

### Purpose

Define the complete dependency graph for the Shared Component Layer, specifying what each component may import.

### Engineering Rationale

Dependency rules prevent architectural violations. A Shared Component that imports from a Feature becomes coupled to that Feature, defeating its purpose. Stage 7 established basic rules; Stage 9 extends them for the shared layer.

### Recommended Option

**Strict import boundaries.**

```
Allowed imports for any Shared Component:

  @/components/ui/            ✅ (UI Primitives)
  @/components/<category>/    ✅ (other Shared Components, same category)
  @/components/<category>/    ✅ (other Shared Components, different category — documented)
  @/lib/utils                 ✅ (cn, formatters, generic utilities)
  @/types                     ✅ (shared types only — DomainEvent, PaginationMeta)
  @/constants                 ✅ (shared constants only)
  @/config                    ✅ (environment configuration)
  react                       ✅
  next/*                      ✅ (next/link, next/image)
  third-party libs             ✅ (date-fns, lucide-react, @tanstack/virtual)
  radix-ui/*                  ✅ (Radix UI primitives)

Forbidden imports for any Shared Component:

  @/features/*                ❌ (any Feature directory)
  @/app/*                     ❌ (Page layer — routes, layouts)
  @/hooks/*                   ❌ (Feature-specific hooks)
  @/stores/*                  ❌ (Feature-specific state)
  @/*/feature.tsx             ❌ (any Feature orchestrator)
  @/sections/*                ❌ (top-level sections — unused, but explicit)
  ../../features/             ❌ (relative import to Feature directory)
```

**Import location rules:**

1. All imports use the `@/` path alias. Relative imports are prohibited for cross-directory imports.
2. Relative imports (`./`, `../`) are permitted only for imports within the same component file (e.g., importing a sub-component from the same directory).
3. No Shared Component imports from outside `@/components/`, `@/lib/`, `@/types/`, `@/constants/`, or `@/config/`.

**Enforcement:**

ESLint's `import/no-restricted-paths` rule enforces these boundaries mechanically:

```jsonc
// eslint.config.mjs (conceptual)
{
  "rules": {
    "import/no-restricted-paths": [{
      "zones": [{
        "target": "./src/components/",
        "from": "./src/features/",
        "message": "Shared Components must not import from Feature directories"
      }]
    }]
  }
}
```

### Trade-offs

- *Strict boundaries* prevent architectural violations but may require duplicating small utilities that exist only in Feature directories.
- *Permissive boundaries* reduce duplication but create invisible coupling.

### Industry Best Practice

Strict import boundaries enforced by ESLint are standard in layered architectures. Nx enforces module boundary rules at the project level. The `import/no-restricted-paths` rule provides file-level enforcement.

### Recommendation

Enforce the dependency rules via ESLint. No Shared Component imports from any `@/features/` path. All imports use the `@/` alias. Relative imports limited to same-directory sub-components.

---

## 31. Folder Organization Principles

### Purpose

Define how Shared Components are organized on disk.

### Engineering Rationale

Consistent folder organization makes Shared Components predictable to find, update, and create. Inconsistent organization forces developers to search for component files.

### Recommended Option

**Categorical subdirectories with flat file structure.**

```
src/components/
├── ui/                    — UI Primitives (atomic, no business, no layout)
│   ├── index.ts
│   ├── button.tsx
│   ├── badge.tsx
│   └── ...
├── data-display/          — Data presentation components
│   ├── index.ts
│   ├── avatar.tsx
│   ├── date-display.tsx
│   ├── status-indicator.tsx
│   └── ...
├── feedback/              — Feedback and notification components
│   ├── index.ts
│   ├── toast.tsx
│   ├── alert-banner.tsx
│   └── ...
├── navigation/            — Navigation components
│   ├── index.ts
│   ├── tabs.tsx
│   ├── pagination.tsx
│   └── ...
├── layout/                — Layout shell components
│   ├── index.ts
│   ├── shell.tsx
│   ├── topbar.tsx
│   └── ...
├── tables/                — Data table components (future)
│   ├── index.ts
│   ├── data-table.tsx
│   └── ...
├── dialogs/               — Dialog/overlay components (future)
│   ├── index.ts
│   ├── dialog.tsx
│   └── ...
├── form/                  — Form helper components
│   ├── index.ts
│   ├── form-field.tsx
│   ├── form-select.tsx
│   └── ...
├── search/                — Search/filter components (future)
└── skeletons/             — Skeleton loading components
    ├── index.ts
    ├── skeleton.tsx
    └── ...
```

**Organization rules:**

1. Each category directory contains only flat files (no subdirectories except for complex components).
2. A component with sub-components MAY have its own subdirectory if it has 3+ sub-component files:

```tsx
// ✅ Simple: flat file
@/components/tables/data-table.tsx

// ✅ Complex: subdirectory for 3+ sub-components
@/components/tables/data-table/
  ├── data-table.tsx
  ├── data-table-header.tsx
  ├── data-table-row.tsx
  ├── data-table-pagination.tsx
  └── data-table-skeleton.tsx
```

3. A component uses a subdirectory when it has 3+ extracted sub-component files or 1+ sub-component file with its own sub-components.
4. A subdirectory component exports its primary component from `index.ts` within the subdirectory.
5. The category `index.ts` re-exports all components (flat and subdirectory-based).

**Barrel export rules:**

```tsx
// @/components/tables/index.ts — re-exports from both flat files and subdirectories
export { default as DataTable } from "./data-table";  // flat file
export type { DataTableProps } from "./data-table";
export { default as DataTable } from "./data-table/data-table";  // subdirectory — same component name
export type { DataTableProps } from "./data-table/data-table";
```

### Trade-offs

- *Flat within categories* is simple for < 10 components per category but becomes hard to navigate beyond 15 files.
- *Subdirectories for complex components* prevents file sprawl but adds nesting depth.

### Industry Best Practice

Component libraries organize by category with flat file structures (shadcn/ui uses flat files per component). Subdirectories are reserved for components with multiple supporting files (hooks, sub-components, types).

### Recommendation

Keep each category directory flat for < 10 components. Extract complex components (3+ sub-component files) into subdirectories. Maintain barrel exports at both levels.

---

## 32. Naming Convention

### Purpose

Define naming conventions for Shared Component files, exports, props, and sub-components.

### Engineering Rationale

Consistent naming makes Shared Components predictable. A developer encountering a new category should immediately understand the naming pattern.

### Recommended Option

**Stage 7 naming conventions extended for Shared Components.**

| Element | Convention | Example |
|---|---|---|
| **File name** | `kebab-case.tsx` | `data-table.tsx`, `date-display.tsx` |
| **Default export** | PascalCase matching file name | `DataTable`, `DateDisplay` |
| **Props interface** | `{ComponentName}Props` | `DataTableProps`, `DateDisplayProps` |
| **Sub-component file** | `parent-name-sub-name.tsx` | `data-table-row.tsx`, `data-table-header.tsx` |
| **Sub-component export** | Named export: `ParentName + SubName` | `DataTableRow`, `DataTableHeader` |
| **Sub-component props** | `{ParentName}{SubName}Props` | `DataTableRowProps`, `DataTableHeaderProps` |
| **Skeleton export** | `{ComponentName}Skeleton` | `DataTableSkeleton` |
| **Props generic parameter** | `<T>` constrained minimally | `<T extends { id: string }>` |
| **Prop grouping** | camelCase | `pageSize`, `onRowClick`, `emptyMessage` |
| **Acronyms** | PascalCase in components, camelCase in props | `CSVExport` (component), `onCSVExport` (prop) |

**Index barrel naming:**

```tsx
// @/components/tables/index.ts
export { default as DataTable } from "./data-table";
export type { DataTableProps } from "./data-table";
```

**File size exception:**

A component file name may use subdirectory organization when it has 3+ sub-components:

```
data-table/          ← directory (kebab-case, plural concept)
  data-table.tsx     ← primary file (kebab-case)
  data-table-row.tsx ← sub-component (parent-name-sub.tsx)
```

### Trade-offs

- *Strict naming* eliminates guesswork but requires discipline during creation.
- *Flexible naming* is faster for initial creation but creates inconsistency over time.

### Industry Best Practice

Kebab-case file names with PascalCase exports are the React community standard. TypeScript's `interface` naming convention (`Props` suffix) is universal. Sub-component naming with parent prefix prevents naming collisions.

### Recommendation

Follow the naming table strictly. Sub-component files are prefixed with the parent component name. Skeleton exports follow `{ComponentName}Skeleton`. Props interfaces are always `{ComponentName}Props`.

---

## 33. Testing Strategy

### Purpose

Define how Shared Components are tested to ensure reliability across all consumers.

### Engineering Rationale

A Shared Component failure affects every Feature that uses it. Testing must cover all states (loading, error, empty, edge cases) and all variants. Incomplete testing of Shared Components creates ripple-effect bugs.

### Recommended Option

**Four-tier testing for Shared Components.**

| Tier | Scope | Tool | Required For | Runs In |
|---|---|---|---|---|
| **Unit tests** | Props rendering, state transitions, callback invocation | Vitest + Testing Library | All Shared Components | CI (every PR) |
| **Accessibility tests** | ARIA attributes, keyboard nav, focus management | Vitest + jest-axe | All Shared Components | CI (every PR) |
| **Visual regression tests** | Visual output across variants and states | Storybook + Chromatic | Stable Shared Components | CI (on promotion) |
| **Integration tests** | Cross-category composition, real data flow | Vitest + Testing Library | Complex Shared Components | CI (daily) |

**Unit test requirements per component:**

```tsx
describe("DataTable", () => {
  describe("Rendering", () => {
    it("renders column headers");         // Required
    it("renders row data");                // Required
    it("renders empty state when rows is empty");  // Required
    it("renders loading skeleton when isLoading");  // Required
    it("renders error state when hasError");   // Required
    it("renders with virtualized rows");       // If virtualized
  });

  describe("Interaction", () => {
    it("calls onRowClick when a row is clicked");     // Required
    it("calls onSort when a sortable header is clicked");  // Required
    it("calls onPageChange when pagination changes");     // Required
    it("calls onSelectionChange when rows are selected"); // If selectable
  });

  describe("Accessibility", () => {
    it("has correct ARIA role");            // Required
    it("supports keyboard navigation");     // Required
    it("announces sort changes via aria-live");  // Required
  });

  describe("Variants", () => {
    it("renders compact density with smaller padding");  // Required
    it("renders default density with standard padding"); // Required
  });
});
```

**Testing rules:**

1. Every Shared Component has tests for render, loading, error, and empty states.
2. Every interactive Shared Component has tests for all callbacks.
3. Every Shared Component has accessibility tests via jest-axe.
4. Test data uses generic fixture factories — never Feature-specific mock data.
5. Visual regression tests use Storybook stories covering all variants.
6. Integration tests verify cross-category composition (e.g., DataTable + Pagination).

### Trade-offs

- *Four-tier testing* provides comprehensive coverage but requires significant test maintenance.
- *Two-tier testing* (unit + a11y only) covers functional correctness but misses visual regressions.

### Industry Best Practice

Component-level testing with Testing Library, jest-axe, and Storybook is the standard approach. Visual regression testing catches style regressions that unit tests miss.

### Recommendation

Implement four-tier testing for all Stable Shared Components. Alpha Shared Components require unit + a11y tests. Visual regression tests are required for promotion to Stable. Use fixture factories for test data.

---

## 34. Documentation Strategy

### Purpose

Define how Shared Components are documented for discoverability and correct usage.

### Engineering Rationale

Shared Components are used by developers across all Features. Poorly documented components are misused, duplicated, or avoided. Comprehensive documentation ensures every developer can use every component correctly.

### Recommended Option

**Three-level documentation for Shared Components.**

| Level | Content | Tool | Required For |
|---|---|---|---|
| **JSDoc** | Description, props, example, `@since`, `@alpha`/`@stable`/`@deprecated` | TypeScript | All Shared Components |
| **Storybook stories** | Interactive examples for every variant and state | Storybook + MDX | Alpha+ Shared Components |
| **Usage guide** | Do/don't patterns, migration guide, accessibility notes | Storybook MDX | Stable Shared Components |

**JSDoc template:**

```tsx
/**
 * DataTable renders a sortable, paginated table of data.
 *
 * Supports selection, sorting, pagination, loading, empty, and error states.
 * Virtualization is enabled automatically for 50+ rows.
 *
 * @alpha Introduced in v0.4.0. API may change.
 * @example
 * ```tsx
 * <DataTable
 *   columns={[
 *     { header: "Name", accessor: "name", sortable: true },
 *     { header: "Email", accessor: "email" },
 *   ]}
 *   rows={items}
 *   onRowClick={(item) => handleSelect(item.id)}
 * />
 * ```
 */
export default function DataTable<T extends { id: string }>({ ... }: DataTableProps<T>) { ... }
```

**Storybook story requirements:**

```tsx
// stories/data-table.stories.tsx
export default { title: "Components/DataTable", component: DataTable };

// Required stories:
export const Default = () => <DataTable columns={columns} rows={sampleRows} />;
export const Empty = () => <DataTable columns={columns} rows={[]} />;
export const Loading = () => <DataTable columns={columns} rows={[]} isLoading />;
export const Error = () => <DataTable columns={columns} rows={[]} hasError errorMessage="Failed to load data." />;
export const Virtualized = () => <DataTable columns={columns} rows={manyRows} virtualized />;
export const Sortable = () => <DataTable columns={sortableColumns} rows={sampleRows} />;
export const Selectable = () => <DataTable columns={columns} rows={sampleRows} selectable />;
export const Compact = () => <DataTable columns={columns} rows={sampleRows} density="compact" />;
```

**Documentation rules:**

1. Every Shared Component has JSDoc with `@example`.
2. Every prop has JSDoc documentation.
3. Every lifecycle phase is documented with `@alpha`, `@stable`, or `@deprecated`.
4. Alpha components document expected API changes.
5. Deprecated components document the migration path and removal timeline.
6. Storybook stories cover all variants and all states (loading, error, empty).

### Trade-offs

- *Comprehensive documentation* requires significant maintenance effort but prevents misuse.
- *Minimal documentation* (props interface only) is faster but forces developers to read source code.

### Industry Best Practice

Storybook is the industry standard for component documentation. JSDoc provides IDE inline documentation. Together they cover both browsing (Storybook) and in-editor (JSDoc) use cases.

### Recommendation

Every Shared Component has JSDoc with example. Every prop has JSDoc. Storybook stories cover all states. Alpha components document API instability. Deprecated components document migration path.

---

## 35. Versioning Strategy

### Purpose

Define how Shared Components are versioned independently of the application.

### Engineering Rationale

Shared Components have multiple consumers. Breaking changes must be communicated and coordinated. Without versioning, a component change can silently break a Feature that depends on the old API.

### Recommended Option

**In-repo semantic versioning via JSDoc lifecycle tags.**

Since Shared Components live in the same repository as their consumers, independent npm-style versioning creates unnecessary overhead. Instead, lifecycle tags communicate stability:

| JSDoc Tag | Meaning | Consumer Action |
|---|---|---|
| `@alpha` | API unstable; may change without notice | Pin to current version if used; expect changes |
| `@stable` | API stable; additive changes only | Update freely within the same release cycle |
| `@deprecated` | Will be removed; migration path provided | Migrate to replacement within one release cycle |

**Breaking change process:**

```
1. Author identifies needed breaking change
2. Author creates new version of the component (e.g., DataTableV2)
3. Old component marked @deprecated with migration guide
4. Consumers migrate to new version over one release cycle
5. Old component demoted or removed after migration window
```

**Breaking vs non-breaking:**

| Change | Type | Example |
|---|---|---|
| Adding a prop | Non-breaking | Adding `sortable` prop to DataTable |
| Making a required prop optional | Non-breaking | `rows` → `rows?` (with empty state) |
| Removing a prop | Breaking | Removing `onSort` |
| Changing a prop type | Breaking | `pageSize: number` → `pageSize: string` |
| Adding a variant value | Non-breaking | `variant: "striped"` added |
| Removing a variant value | Breaking | `variant: "compact"` removed |
| Changing default behavior | Breaking | Pagination default: 10 → 20 |

**Application-level version tracking:**

The lifecycle of each Shared Component is tracked in `docs/shared-component-registry.md`:

```markdown
# Shared Component Registry

## tables/
| Component | Phase | Since | Deprecated | Migration |
|---|---|---|---|---|
| DataTable | stable | v0.4.0 | — | — |
```

### Trade-offs

- *In-repo lifecycle tags* provide clarity without npm versioning overhead but do not pin specific versions.
- *npm-style versioning* for each shared component would allow precise dependency control but adds significant overhead for an in-repo library.

### Industry Best Practice

Monorepo component libraries often use in-repo versioning with changesets or semantic release. For this project's scale, lifecycle tags provide sufficient communication without the overhead of automated versioning.

### Recommendation

Use `@alpha`, `@stable`, `@deprecated` JSDoc tags to communicate component lifecycle. Maintain a component registry document. Breaking changes require creating a new component version (V2) and deprecating the old one. One-release-cycle migration window for breaking changes.

---

## 36. Deprecation Strategy

### Purpose

Define how Shared Components are deprecated and removed.

### Engineering Rationale

Deprecation without process leaves consumers stranded — they continue using a component that has no future, and when it is removed, their Feature breaks. A structured deprecation process prevents this.

### Recommended Option

**Two-release-cycle deprecation process.**

```
Cycle 1 (current):
  - Component marked @deprecated in JSDoc
  - Migration guide published to Storybook
  - All existing consumers notified (via PR comments or team channel)
  - No new features added to deprecated component
  - Bug fixes still accepted

Cycle 2 (next):
  - Component still available (backward compatibility maintained)
  - Consumers should have migrated
  - No new consumers allowed (enforced via code review)
  - Component removed at end of Cycle 2
```

**Deprecation template:**

```tsx
/**
 * LegacyTable renders a data table.
 *
 * @deprecated Use DataTable from @/components/tables instead.
 * Migration guide: https://storybook/legacy-table-to-data-table
 * Removal scheduled for: v0.6.0 (current: v0.4.0)
 */
export default function LegacyTable({ ... }) { ... }
```

**Deprecation rules:**

1. All deprecations are documented with `@deprecated` JSDoc tag including migration target and removal timeline.
2. Deprecated components are flagged in the barrel export comment (not removed from export — consumers need access during migration).
3. No new Features may import a deprecated component (enforced via code review).
4. Bug fixes for deprecated components are accepted but no new features.
5. After two release cycles, the component is removed completely (git history preserves it).
6. Removal is a minor version bump (semver: non-breaking for consumers who migrated; breaking for those who didn't).

**Identifying deprecation candidates:**

During quarterly audits:

- Single-consumer components → demote (move to Feature `_components/`), not deprecate.
- Superseded components → deprecate with migration to replacement.
- Abandoned components (no consumer for 2+ cycles) → deprecate with removal.

### Trade-offs

- *Two-cycle deprecation* gives consumers adequate migration time but delays cleanup.
- *Single-cycle deprecation* is faster but risks breaking consumers on tight release schedules.

### Industry Best Practice

Semantic versioning's deprecation policy: deprecate in one version, remove in the next major. Two-release-cycle windows are standard for internal libraries where the consumer set is well-known.

### Recommendation

Deprecate Shared Components with a two-release-cycle timeline. Provide migration guides. Enforce no-new-consumers during deprecation. Remove at the end of the second cycle.

---

## 37. Migration Strategy

### Purpose

Define how consumers migrate from one version of a Shared Component to another (or to a replacement).

### Engineering Rationale

When a Shared Component is deprecated or superseded, every consumer must migrate. Without a structured migration strategy, consumers delay migration, creating technical debt and increasing the blast radius of removal.

### Recommended Option

**Codemod-first migration with parallel availability.**

```tsx
// Migration: LegacyTable → DataTable

// Before:
<LegacyTable
  data={items}
  columns={["name", "email"]}
  onSelect={(index) => handleSelect(index)}
/>

// After:
<DataTable
  rows={items}
  columns={[
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
  ]}
  onRowClick={(item) => handleSelect(item.id)}
/>
```

**Migration process:**

```
1. Replacement component available (Phase: Alpha or Stable)
2. Old component deprecated (@deprecated + migration guide)
3. Codemod created (or manual migration steps documented)
4. Cycle 1: All current consumers migrate (team effort, tracked in tickets)
5. Cycle 2: No new consumers of old component allowed
6. End: Old component removed
```

**Migration documentation template:**

```md
# Migration Guide: LegacyTable → DataTable

## Why migrate?
DataTable supports sorting, pagination, selection, and virtualization.
LegacyTable is deprecated and will be removed in v0.6.0.

## Step 1: Update imports
Before: import { LegacyTable } from "@/components/tables"
After:  import { DataTable } from "@/components/tables"

## Step 2: Update column definition
Before: columns={["name", "email"]}
After:  columns={[
         { header: "Name", accessor: "name", sortable: true },
         { header: "Email", accessor: "email" },
       ]}

## Step 3: Update data prop
Before: data={items}
After:  rows={items}

## Step 4: Update selection callback
Before: onSelect={(index) => ...}
After:  onRowClick={(item) => ...}
// Note: onRowClick receives the full row object, not the index
```

**Migration rules:**

1. Every deprecated component has a documented migration path to its replacement.
2. Migration guides include before/after code examples.
3. Migration complexity is assessed during deprecation — complex migrations may warrant a codemod.
4. The category maintainer tracks migration progress during the deprecation window.
5. No consumer is left without a migration path — unmaintained components are demoted (not removed).

### Trade-offs

- *Codemod-first* provides automated migration but requires significant effort to create and test.
- *Manual migration guides* are faster to produce but require developers to perform changes manually.

### Industry Best Practice

Codemods are standard for large-scale API migrations in JavaScript/TypeScript (React codemods, Angular update guide). Manual migration guides with clear before/after examples are the minimum standard.

### Recommendation

Document migration paths for every deprecated component. Create codemods for complex migrations. Track migration progress during the deprecation window. Never remove a component without a migration path.

---

## 38. Maintainability

### Purpose

Define practices that keep the Shared Component Layer maintainable as the codebase grows.

### Engineering Rationale

Shared Components are the most-referenced architectural unit. Every Feature imports them. Without maintainability practices, the shared layer accumulates dead code, unused props, and inconsistent patterns.

### Recommended Option

**Six maintainability practices for the shared layer:**

| Practice | Frequency | Action |
|---|---|---|
| **Quarterly audit** | Every 3 months | Review every shared component for: dead code, unused props, single-consumer status, deprecation candidates |
| **Bundle size monitoring** | Every PR | Track bundle size impact of shared component imports; flag components exceeding 10KB gzipped |
| **Code review checklist** | Every PR | Apply the Stage 7 + Stage 9 code review checklist to every shared component change |
| **Test coverage gate** | Every PR | Shared component changes require 90%+ test coverage on changed lines |
| **Storybook maintenance** | Every PR | New variants get new stories; changed components update existing stories |
| **Dependency freshness** | Monthly | Check third-party dependency versions used by shared components; update within one minor version |

**Code review checklist (Stage 9 addition to Stage 7):**

- [ ] Component uses only semantic token utilities (no raw colors, no `dark:` variants)
- [ ] Component imports from no Feature directory
- [ ] Component has co-located skeleton (if data-rendering)
- [ ] Component has loading, error, and empty states (if data-rendering)
- [ ] Component has JSDoc with `@example`
- [ ] Component has Storybook stories for all states
- [ ] Component has unit tests for render, interaction, and a11y
- [ ] Component lifecycle phase is documented (`@alpha`, `@stable`, `@deprecated`)
- [ ] Cross-category imports are documented
- [ ] Virtualization is considered (collection components)

**File verification script:**

A CI script verifies shared component hygiene:

```
Verify:
  ✓ No imports from @/features/ in any @/components/<category>/
  ✓ All @/components/<category>/ have index.ts barrel
  ✓ All index.ts barrel exports have matching component files
  ✓ No .module.css files exist in @/components/
  ✓ No "use client" directive in display-only shared components
```

### Trade-offs

- *Six practices* require ongoing investment but prevent shared layer degradation.
- *No regular maintenance* accelerates initial development but creates accumulating debt.

### Industry Best Practice

Regular audits, bundle size budgets, and code review checklists are standard software engineering practices. Automated verification scripts prevent the most common violations mechanically.

### Recommendation

Implement the six maintainability practices. Run the verification script in CI. Apply the code review checklist to every shared component PR. Schedule quarterly audits.

---

## 39. Scalability

### Purpose

Define how the Shared Component Layer scales as the application grows from 16 Features to 50+ Features.

### Engineering Rationale

The current codebase has 32 shared components across 7 categories. At 50+ Features, this could grow to 100-200 shared components. The architecture must accommodate this growth without degradation.

### Recommended Option

**Four scalability mechanisms:**

| Mechanism | Current State | At 200 Components | Action |
|---|---|---|---|
| **Categorical organization** | 7 categories | 10-14 categories | Split categories when they exceed 20 files |
| **Barrel exports** | Static barrel files | Static barrel files | Automated barrel generation if manual becomes burdensome |
| **Subdirectory extraction** | Not used (flat) | Used for 3+ sub-component files | Extract on threshold |
| **Bundle splitting** | Single bundle | One async chunk per category | `dynamic(() => import("@/components/tables"))` |

**Split thresholds:**

| Metric | Threshold | Action |
|---|---|---|
| Components per category | > 20 | Split into subcategories (e.g., `tables/simple/`, `tables/complex/`) |
| Lines per barrel file | > 50 | Generate barrel automatically or split category |
| Cross-category imports | > 5 per category | Evaluate if cross-category dependencies indicate category boundary issues |
| Single-consumer components | > 30% of shared layer | Audit and demote; shared layer should have broad reuse |

**Scaling constraints:**

The shared layer is designed to scale to approximately 200 components across 10-14 categories without structural changes. Beyond 200:

1. Extract sub-libraries: `@/components/tables/` becomes a standalone internal package.
2. Move to `packages/` in a Turborepo/Nx monorepo structure.
3. Each package has independent versioning, testing, and documentation.

**Micro-frontend readiness:**

Each shared component category is structured as an independent unit with:

- Zero dependencies on other categories (except documented cross-category imports).
- Its own barrel export.
- Independent test suite.
- Independent Storybook stories.

This structure allows any category to be extracted into its own package or micro-frontend without restructuring.

### Trade-offs

- *Four mechanisms* anticipate growth but may be premature for the current 32-component scale.
- *Reactive scaling* (fix problems when they occur) is simpler now but may cause painful restructuring later.

### Industry Best Practice

Monorepo tools (Turborepo, Nx) support package-level extraction. Component library categories as independent packages is the standard approach for large-scale design systems (Shopify Polaris, Atlassian).

### Recommendation

Design for 200 components with the four mechanisms. Split categories at 20-file thresholds. Extract to independent packages when the codebase exceeds 200 shared components or enters a monorepo structure.

---

## 40. Best Practices

### Purpose

Provide a consolidated reference of Shared Component best practices for quick reference during development and code review.

### Engineering Rationale

A single-page checklist is more actionable than searching the full specification. This section consolidates the most critical rules.

### Recommended Option

**Shared Component creation checklist:**

- [ ] Component is domain-neutral (can be described without referencing any Feature)
- [ ] Component uses only semantic token utilities (no raw colors, no `dark:` variants)
- [ ] Component imports from no `@/features/` directory
- [ ] Component props are flat, explicit, and typed (no `any`, no compound model objects)
- [ ] Component has loading state (`isLoading` + skeleton)
- [ ] Component has error state (`hasError` + error message)
- [ ] Component has empty state (configurable `emptyMessage`)
- [ ] Component co-locates its skeleton
- [ ] Component supports controlled/uncontrolled pattern for internal state
- [ ] Component uses generic type parameters for collection items
- [ ] Callbacks are prefixed `on`, pass minimal data, are optional
- [ ] Component is theme-agnostic (no theme context, no `dark:` variants)
- [ ] Component has responsive behavior defined for mobile/tablet/desktop
- [ ] Component is Server Component by default (`"use client"` only for interactivity)
- [ ] Component is under 80 lines (120 soft max, 150 absolute max)
- [ ] Component has JSDoc with `@example`
- [ ] Component has Storybook stories for all variants and states
- [ ] Component has unit tests for render, interaction, and a11y
- [ ] Component lifecycle phase is documented (`@alpha`, `@stable`, `@deprecated`)

**Code review checklist (in addition to Stage 7 checklist):**

- [ ] No imports from `@/features/` directories
- [ ] No raw color or spacing values (semantic tokens only)
- [ ] No `dark:` variants needed (tokens handle theming)
- [ ] Loading, error, and empty states present if data-rendering
- [ ] Skeleton co-located if data-rendering
- [ ] Virtualization considered for 50+ item collections
- [ ] Cross-category imports documented
- [ ] Barrel export updated
- [ ] Lifecycle tag present
- [ ] At least one Storybook story per variant

**Component hygiene checklist (quarterly audit):**

- [ ] All components have current lifecycle tags
- [ ] No single-consumer shared components without deprecation plan
- [ ] No components exceeding 150 lines without decomposition plan
- [ ] No barrel exports pointing to non-existent files
- [ ] Cross-category dependency graph has no cycles
- [ ] All categories under 20-file threshold

---

## Engineering Review Summary

### Architecture Analysis

The Shared Component Layer occupies the critical middle ground between Feature-specific Components and atomic UI Primitives. It provides reusable, domain-neutral presentation units that accelerate Feature development while maintaining architectural boundaries.

**Strengths:**

- Clear three-tier component hierarchy (Feature → Shared → UI Primitive) with strict dependency direction.
- Promotion rules prevent premature abstraction (Rule of Two: promote only when a second Feature proves the need).
- Semantic token consumption eliminates theme-specific code and dark mode boilerplate.
- Lifecycle management (Alpha → Stable → Deprecated → Demoted) provides clarity for consumers.
- Cross-category composition enables complex components while maintaining reusability.

**Risks:**

- Category proliferation — developers may create too many categories, fragmenting the shared layer.
- Promotion inertia — components may remain Feature-private longer than beneficial due to promotion cost.
- Cross-category dependency cycles — must be monitored and prevented.

### Reusability Analysis

The Rule of Two (promote when a second Feature proves need) ensures reusability is earned, not assumed. Generic type parameters allow Shared Components to serve multiple consumers without business coupling. Slots provide escape hatches for Feature-specific content without compromising domain-neutrality.

### Dependency Analysis

Strict dependency rules (no Feature imports, no upward imports, no sibling imports without parent-child extraction) prevent coupling. Cross-category imports are allowed but documented. ESLint `import/no-restricted-paths` enforces boundaries.

### Maintainability Analysis

Quarterly audits, bundle size monitoring, and the code review checklist prevent decay. The six maintainability practices (audit, bundle, review, coverage, stories, freshness) provide ongoing health checks. The verification script automates the most common violation checks.

### Scalability Analysis

Four mechanisms (categorical organization, barrel exports, subdirectory extraction, bundle splitting) support growth to ~200 components across 10-14 categories. Beyond 200, extraction to independent packages is supported by the existing structure. Micro-frontend readiness is built into the category structure.

### Performance Analysis

Server-first default eliminates client JavaScript for display components. Virtualization at 50+ items prevents DOM bloat. Lazy loading isolates heavy third-party dependencies. Memoization is profile-guided, not pre-emptive. Semantic tokens are CSS variables — zero runtime cost.

### Future Expansion Recommendations

1. **ESLint rule package** — Create custom ESLint rules for Shared Component import restrictions (no Feature imports, no raw colors, lifecycle tag required).
2. **Automated barrel generation** — When a category exceeds 15 files, implement automated barrel export generation to prevent drift.
3. **Shared Component catalog** — Build a dedicated catalog page (via Storybook) that lists all Shared Components with their lifecycle phase, consumer count, and bundle size.
4. **Consumer tracking** — Add a script that analyzes import statements to track which Features consume each Shared Component, supporting demotion decisions.
5. **Codemod toolkit** — Establish a codemod pattern for breaking changes, making migration from deprecated components near-automatic.
6. **Component health dashboard** — Extend CI to produce a "Shared Component Health" report showing test coverage, a11y pass rate, bundle size, and consumer count for every component.
