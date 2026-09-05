# Stage 8 — Design System & Styling Layer Specification

**Status:** Draft
**Dependencies:** Stage 7 (Component Layer)
**Next:** Stage 9 (Shared Component Layer)

---

## 1. Design Philosophy

### Purpose

Establish the foundational philosophy that governs every styling decision in the system — a set of immutable beliefs about how visual design should be produced, maintained, and evolved.

### Engineering Rationale

Without a governing philosophy, styling decisions become inconsistent over time. One developer uses semantic tokens; another writes ad hoc Tailwind utilities. The philosophy must be opinionated enough to provide clear guidance but abstract enough to last through framework upgrades.

### Recommended Option

**Token-First, Semantic-Only, Composition-Driven Design Philosophy.**

Every visual output in the system is produced through a strict hierarchy:

1. **Token-First** — Every color, spacing, radius, shadow, and font size used anywhere in the application must derive from a design token. Raw values (hex codes, pixel values) are prohibited outside the token definition layer.
2. **Semantic-Only** — Components never reference raw tokens directly (e.g., `color-primary`). They reference semantic aliases (e.g., `color-surface-card`, `color-text-heading`). This decouples visual intent from token values.
3. **Composition-Driven** — Visual output is achieved by composing tokens through utility classes. Custom CSS is written only when utility composition cannot produce the desired result — which should be rare (< 5% of styling).

### Trade-offs

- _Token-First_ adds abstraction overhead during initial component creation but eliminates the accumulation of divergent colors, spacing, and typography over time.
- _Semantic-Only_ requires maintaining a mapping layer (semantic → token) but enables complete visual rebranding by changing only the semantic mapping.
- _Composition-Driven_ can produce verbose class strings in JSX but keeps all styling visible at the component level rather than hidden in CSS files.

### Industry Best Practice

Enterprise design systems (Shopify Polaris, Atlassian Design System, Vercel, Linear) all use a token-first, semantic-only architecture. Tailwind CSS v4's `@theme` directive is designed specifically for this pattern — it maps CSS variables to utility classes, enabling semantic usage at the utility level.

### Recommendation

Adopt Token-First, Semantic-Only, Composition-Driven as the immutable styling philosophy. Document it in the project's design system documentation and enforce it in code review. No raw color values, no raw spacing values, no ad hoc CSS files — every visual decision flows from a token.

---

## 2. Design Language

### Purpose

Define the visual language — the abstract aesthetic principles that give the application its distinct visual character. This is not about specific values but about the character of the visual output.

### Engineering Rationale

A consistent design language makes the application feel cohesive even as it grows across dozens of pages and hundreds of components. It reduces the cognitive load on developers because visual patterns are predictable.

### Recommended Option

**Clarity, Restraint, and Professional Trust.**

- **Clarity:** Every visual element has a clear purpose. Decoration is minimal and intentional. Typography emphasizes readability. Spacing creates clear visual hierarchy.
- **Restraint:** The system uses a limited set of visual tools — one type family, one accent color range, three surface depths, one border radius scale. Restraint creates consistency.
- **Professional Trust:** The design treats the user as competent. Interactive elements are clearly identifiable. Feedback is immediate and informative. The interface does not compete for attention with the content.

This language manifests as:

- Ample whitespace with generous padding
- Subtle surface differentiation (border, shadow, background shift) rather than strong borders
- One accent color (blue-based) with semantic extensions for success, warning, danger
- Monochromatic surface colors with a single accent hue
- Typography-driven hierarchy rather than color-driven hierarchy
- Minimal use of decorative elements (gradients, patterns, illustrations)

### Trade-offs

- _Restraint_ can feel "boring" to designers accustomed to vibrant, decorative interfaces. The trade-off is consistency and professional trust.
- _Typography-driven hierarchy_ requires a well-designed type scale and may not suit content-light applications (dashboards, analytics).

### Industry Best Practice

Linear, Basecamp, GitHub, and Stripe all follow a restrained, clarity-focused design language. The principle is: the interface should be invisible — users should see their work, not the UI.

### Recommendation

Document the design language as part of the project's design system. Use it as the filter for every design decision: "Does this addition serve Clarity, Restraint, or Professional Trust?"

---

## 3. Design Principles

### Purpose

Define the decision-making principles that guide every styling choice. Unlike the philosophy (which is immutable), principles provide context-specific guidance for trade-off decisions.

### Recommended Option

| Principle                           | Statement                                                   | Application                                                                       |
| ----------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Token-First**                     | Every visual value must be a design token                   | No hardcoded colors, spacing, or sizes anywhere                                   |
| **Semantic-Only**                   | Components reference semantic tokens, never raw values      | `bg-surface-card` not `bg-white`                                                  |
| **Accessibility-Before-Aesthetics** | No visual design decision may reduce accessibility          | Color choices verified against contrast ratios                                    |
| **Progressive Enhancement**         | The interface works without JavaScript, then enhances       | Base styles (Server Components) + interaction styles (Client Components)          |
| **Composition Over Customization**  | Compose from tokens and utilities before writing custom CSS | Custom CSS is the exception, not the rule                                         |
| **Consistency Over Perfection**     | A consistent 7/10 experience beats an inconsistent 10/10    | Use existing patterns even if not perfect for the specific case                   |
| **Theme-Neutral**                   | All components render correctly in all themes by default    | No light-theme-only or dark-theme-only visual assumptions                         |
| **Low Specificity**                 | No CSS selector exceeds a specificity of 0-2-0              | Utility classes (0-1-0), component classes (0-1-0), never IDs or nested selectors |

### Trade-offs

- _Accessibility-Before-Aesthetics_ may limit the color palette. This is acceptable — accessible design is a requirement, not a preference.
- _Consistency Over Perfection_ may result in some components feeling slightly suboptimal for their specific context. This prevents the accumulation of one-off patterns.

### Industry Best Practice

Every major design system publishes its principles. Shopify Polaris, Atlassian, and Carbon all emphasize consistency, accessibility, and composability.

### Recommendation

Print these principles in the design system documentation and reference them during every design review. A design decision that violates a principle must be justified in writing.

---

## 4. Design Token Architecture

### Purpose

Define the architecture, naming philosophy, ownership, inheritance, and relationships of all design tokens. This is the foundational layer of the styling system.

### Engineering Rationale

Design tokens are the single source of truth for every visual value. Without a well-designed token architecture, values proliferate — every developer adds their own spacing, color, and typography. Tokens constrain the design space to a manageable set of intentional values.

### Recommended Option

**Three-tier token architecture: Global → Alias → Component.**

```
┌─────────────────────────────────────────────────────────────┐
│                    GLOBAL TOKENS (Raw)                       │
│  --color-blue-500: #3b82f6                                   │
│  --spacing-4: 1rem                                           │
│  --radius-md: 0.5rem                                          │
│  --font-size-base: 0.875rem                                   │
│  Immutable, technology-agnostic, shared across all themes     │
└──────────────────────┬──────────────────────────────────────┘
                       │ maps to
┌──────────────────────▼──────────────────────────────────────┐
│                  ALIAS / SEMANTIC TOKENS                     │
│  --color-surface-card: var(--color-zinc-50)                  │
│  --color-text-primary: var(--color-zinc-950)                  │
│  --spacing-inset-card: var(--spacing-4)                      │
│  --font-family-body: var(--font-geist-sans)                   │
│  Theme-aware, context-specific, maps global → semantic       │
└──────────────────────┬──────────────────────────────────────┘
                       │ consumed by
┌──────────────────────▼──────────────────────────────────────┐
│                 COMPONENT-LEVEL TOKENS                       │
│  --button-bg: var(--color-surface-accent)                    │
│  --card-padding: var(--spacing-inset-card)                   │
│  Component-scoped, inherits from semantic, overridable       │
└─────────────────────────────────────────────────────────────┘
```

### Naming Convention

```
--<category>-<property>[-<modifier>]
--<category>-<property>-<variant>
--<component>-<property>
```

Examples:

- `--color-bg-primary` — Global: color category, background property, primary subtype
- `--color-surface-card` — Semantic: surface role for card components
- `--spacing-inset-card` — Semantic: inset spacing for cards
- `--button-bg-hover` — Component: button component, background property, hover state
- `--font-size-body` — Global: font category, size property, body subtype

### Token Categories

| Category   | Prefix        | Examples                                          | Owner         |
| ---------- | ------------- | ------------------------------------------------- | ------------- |
| Color      | `--color-`    | `--color-bg-primary`, `--color-text-body`         | Design tokens |
| Typography | `--font-`     | `--font-family-body`, `--font-size-lg`            | Design tokens |
| Spacing    | `--spacing-`  | `--spacing-inset-card`, `--spacing-stack-section` | Design tokens |
| Radius     | `--radius-`   | `--radius-sm`, `--radius-card`                    | Design tokens |
| Shadow     | `--shadow-`   | `--shadow-sm`, `--shadow-elevation-card`          | Design tokens |
| Border     | `--border-`   | `--border-width-sm`, `--border-color-input`       | Design tokens |
| Opacity    | `--opacity-`  | `--opacity-disabled`, `--opacity-muted`           | Design tokens |
| Duration   | `--duration-` | `--duration-fast`, `--duration-normal`            | Design tokens |
| Easing     | `--easing-`   | `--easing-in`, `--easing-out`                     | Design tokens |
| Z-index    | `--z-`        | `--z-dropdown`, `--z-modal`                       | Design tokens |
| Size       | `--size-`     | `--size-touch-min`, `--size-icon-sm`              | Design tokens |

### Inheritance Rules

1. Global tokens never reference other tokens — they are raw values.
2. Semantic tokens reference only global tokens.
3. Component tokens reference only semantic tokens.
4. Components never reference global tokens directly.
5. Theme overrides occur only at the semantic token level.
6. Component tokens are defined as `@property` or CSS custom properties scoped to the component's selector.

### Trade-offs

- _Three-tier architecture_ adds indirection but enables single-point theme switching and complete visual rebranding.
- _Two-tier (global + semantic)_ is simpler but requires component-level overrides for theme switching.
- _Flat token architecture_ (no semantic layer) is simplest but couples components to specific token values.

### Industry Best Practice

Three-tier token architecture is the standard across enterprise design systems (Shopify Polaris, Lightning Design System, Adobe Spectrum). Tailwind CSS v4's `@theme` directive naturally supports this pattern by mapping CSS variables to utility classes.

### Recommendation

Implement the three-tier architecture in `globals.css` using CSS custom properties. Define global tokens in `:root`, theme overrides in `.dark`, and component tokens at the component level. Use `@theme inline` in Tailwind v4 to expose semantic tokens as utility classes.

---

## 5. Semantic Token Strategy

### Purpose

Define how semantic tokens map business-facing design needs to underlying design tokens. Semantic tokens are the primary interface between the design system and the components that consume it.

### Engineering Rationale

Semantic tokens decouple visual intent from specific values. A card component should say "I need a surface background" (`--color-surface-card`), not "I need white" (`--color-white`). When the design evolves, the semantic token definition changes, not every component that uses it.

### Recommended Option

**Four semantic token domains:**

#### Surface Tokens

| Token                         | Purpose                          | Maps to                  |
| ----------------------------- | -------------------------------- | ------------------------ |
| `--color-surface-page`        | Page/body background             | `--color-bg-primary`     |
| `--color-surface-card`        | Card and container background    | `--color-bg-secondary`   |
| `--color-surface-elevated`    | Modals, dropdowns, popovers      | `--color-bg-tertiary`    |
| `--color-surface-interactive` | Interactive element backgrounds  | `--color-bg-interactive` |
| `--color-surface-hover`       | Hover state background           | `--color-bg-hover`       |
| `--color-surface-active`      | Active/selected state background | `--color-bg-active`      |

#### Text Tokens

| Token                    | Purpose                          | Maps to                |
| ------------------------ | -------------------------------- | ---------------------- |
| `--color-text-primary`   | Primary body text, headings      | `--color-fg-primary`   |
| `--color-text-secondary` | Secondary/subtitle text          | `--color-fg-secondary` |
| `--color-text-muted`     | Placeholder, disabled, hint text | `--color-fg-muted`     |
| `--color-text-inverse`   | Text on dark/colored surfaces    | `--color-fg-inverse`   |
| `--color-text-link`      | Link text                        | `--color-fg-link`      |
| `--color-text-success`   | Success state text               | `--color-fg-success`   |
| `--color-text-warning`   | Warning state text               | `--color-fg-warning`   |
| `--color-text-danger`    | Error/destructive text           | `--color-fg-danger`    |

#### Border Tokens

| Token                    | Purpose                          | Maps to              |
| ------------------------ | -------------------------------- | -------------------- |
| `--color-border-default` | Default border (cards, dividers) | `--color-bd-primary` |
| `--color-border-input`   | Input field borders              | `--color-bd-input`   |
| `--color-border-hover`   | Hover state borders              | `--color-bd-hover`   |
| `--color-border-focus`   | Focus ring/outline               | `--color-bd-focus`   |
| `--color-border-success` | Success validation border        | `--color-bd-success` |
| `--color-border-warning` | Warning validation border        | `--color-bd-warning` |
| `--color-border-danger`  | Error validation border          | `--color-bd-danger`  |

#### Interactive Tokens

| Token                       | Purpose                   | Maps to                    |
| --------------------------- | ------------------------- | -------------------------- |
| `--color-accent`            | Primary action accent     | `--color-accent-blue`      |
| `--color-accent-hover`      | Hover state of accent     | `--color-accent-blue-dark` |
| `--color-accent-foreground` | Text on accent surface    | `--color-fg-inverse`       |
| `--color-success`           | Success/safe states       | `--color-accent-green`     |
| `--color-warning`           | Warning/caution states    | `--color-accent-amber`     |
| `--color-danger`            | Danger/destructive states | `--color-accent-red`       |

### Theme Override Rule

The light theme defines all semantic tokens. The dark theme overrides only the semantic tokens that differ. This means:

- Global raw tokens are defined once in `:root`
- Light theme semantic tokens are defined in `:root`
- Dark theme overrides only the semantic tokens that change
- A third theme (e.g., high-contrast) overrides only the tokens it needs

```css
:root {
  /* Raw tokens — defined once, never change */
  --color-white: oklch(1 0 0);
  --color-black: oklch(0 0 0);
  /* ... raw palette ... */

  /* Light semantic tokens */
  --color-surface-page: var(--color-white);
  --color-text-primary: var(--color-zinc-950);
  /* ... */
}

.dark {
  /* Only override what differs */
  --color-surface-page: var(--color-zinc-950);
  --color-text-primary: var(--color-white);
  /* ... */
}
```

### Trade-offs

- _Four semantic domains_ cover the majority of use cases but may occasionally require a domain-specific token (e.g., chart colors).
- _Semantic tokens_ add naming overhead. Developers must learn the token vocabulary. The benefit is visual consistency and themability.

### Industry Best Practice

Semantic token systems are used by Shopify Polaris (color/surface/text/interactive), Adobe Spectrum (background/border/text/accent), and Atlassian (background/border/text/accent).

### Recommendation

Implement the four-domain semantic token system. Use Tailwind CSS v4's `@theme inline` to expose these tokens as utility classes (`bg-surface-card`, `text-text-primary`, `border-border-input`). This enables semantic utility usage in JSX.

---

## 6. Global CSS Architecture

### Purpose

Define the structure and organization of global CSS — what belongs in `globals.css`, what belongs in component-level CSS, and what belongs nowhere.

### Engineering Rationale

Without a clear CSS architecture, styles leak across boundaries, specificity escalates, and `!important` becomes a debugging tool. A disciplined architecture prevents these issues.

### Recommended Option

**Single global entry point with layered organization.**

```
src/
  app/
    globals.css              — Single global stylesheet entry point
      Layer 1: Tailwind base (@import "tailwindcss")
      Layer 2: Theme tokens (@theme inline)
      Layer 3: Raw global tokens (:root, .dark)
      Layer 4: Semantic tokens (:root, .dark)
      Layer 5: Global base styles (@layer base)
      Layer 6: Custom utilities (@layer utilities)
      Layer 7: Animation keyframes (@keyframes)
```

### Organizational Rules

1. **No per-page CSS files.** All global styles live in `globals.css`. Page-specific styles are composed through Tailwind utilities in the page's layout or section files.
2. **No per-component CSS files.** Component styles are applied through Tailwind utilities within the component file. Component-scoped CSS custom properties are defined inline or through `@property`.
3. **No CSS modules.** The system uses Tailwind utilities exclusively. CSS modules introduce an additional styling paradigm that competes with the utility approach.
4. **No `@apply` directives.** `@apply` in Tailwind v3 was discouraged; in Tailwind v4, it is deprecated. Compose utilities directly in JSX.
5. **No `@layer` conflicts.** Use Tailwind's built-in `@layer base`, `@layer components`, `@layer utilities` for any custom CSS that cannot be expressed as utilities.

### What Belongs in globals.css

| Category                 | Examples                                            |
| ------------------------ | --------------------------------------------------- |
| Token definitions        | All `@theme`, `:root`, `.dark` variable definitions |
| Base resets              | Box-sizing, font-smoothing, scroll-behavior         |
| Animation keyframes      | Skeleton pulse, fade-in, slide-in, spin             |
| Print styles             | `@media print` overrides                            |
| Accessibility            | `prefers-reduced-motion`, `prefers-contrast-more`   |
| RTL base styles          | `[dir="rtl"]` selector adjustments                  |
| Custom Tailwind variants | `@custom-variant` directives                        |

### What Does NOT Belong in globals.css

| Category                         | Where it belongs                                    |
| -------------------------------- | --------------------------------------------------- |
| Component-specific styles        | In the component file as Tailwind utilities         |
| Page-specific layouts            | In the section file as Tailwind utilities           |
| Third-party overrides            | In the component that wraps the third-party library |
| Feature-specific theme overrides | In the feature's `_components/` or section          |

### Trade-offs

- _Single global CSS file_ is simple and performant but can grow large. With Tailwind's JIT and CSS variables, the actual emitted CSS is small (only used utilities are generated).
- _Per-component CSS files_ provide clear ownership but create a second styling paradigm that competes with Tailwind utilities.

### Industry Best Practice

Tailwind CSS v4 is designed for a single-entry-point CSS architecture. The CSS-first configuration model (`@import "tailwindcss"` + `@theme`) replaces the `tailwind.config.ts` pattern, making `globals.css` the single source of truth for all configuration.

### Recommendation

Maintain a single `globals.css` file as the only CSS entry point. Organize it in clearly commented layers. Never create additional CSS files except for third-party overrides, which should be clearly documented.

---

## 7. CSS Variable Strategy

### Purpose

Define how CSS custom properties are defined, scoped, named, and consumed within the system.

### Engineering Rationale

CSS variables are the runtime mechanism for design tokens. They enable theme switching, component-scoped overrides, and runtime token manipulation. Tailwind CSS v4 exposes CSS variables as utility classes through the `@theme inline` directive.

### Recommended Option

**Three scopes for CSS variables:**

| Scope                | Where Defined                                          | Visibility                     | Mutation Rules               |
| -------------------- | ------------------------------------------------------ | ------------------------------ | ---------------------------- |
| **Global tokens**    | `:root` selector in `globals.css`                      | Document-wide                  | Never mutated at runtime     |
| **Theme tokens**     | `:root` (light) and `.dark` (dark)                     | Document-wide, theme-dependent | Changed only by theme toggle |
| **Component tokens** | Component root element via inline style or `@property` | Component subtree              | Scoped to component instance |

### Naming Rules

1. All CSS variables use `--` prefix (standard CSS custom property syntax).
2. Use kebab-case for multi-word names: `--color-surface-card`.
3. Group by category in the name: `--<category>-<property>-<modifier>`.
4. Component-scoped variables are prefixed with the component name: `--button-bg`, `--card-padding`.

### Integration with Tailwind CSS v4

```css
/* globals.css */
@theme inline {
  --color-surface-card: var(--color-surface-card);
  --color-text-primary: var(--color-text-primary);
  --spacing-card-inset: var(--spacing-card-inset);
  --radius-card: var(--radius-card);
}

:root {
  --color-surface-card: var(--color-white);
  --color-text-primary: var(--color-zinc-950);
  --spacing-card-inset: 1rem;
  --radius-card: 0.5rem;
}
```

This pattern exposes `--color-surface-card` as the Tailwind utility `bg-surface-card`, `text-surface-card`, `border-surface-card`. It also makes the variable available as `bg-[var(--color-surface-card)]` for cases where the taget utility doesn't exist.

### Tailwind v4 Theme Mapping Strategy

For each semantic color token, register it in `@theme inline` with the appropriate utility class prefix:

| Token               | Tailwind Utility Prefix      | Example               |
| ------------------- | ---------------------------- | --------------------- |
| `--color-surface-*` | `bg-*`, `text-*`, `border-*` | `bg-surface-card`     |
| `--color-text-*`    | `text-*`                     | `text-text-primary`   |
| `--color-border-*`  | `border-*`                   | `border-border-input` |
| `--spacing-*`       | `p-*`, `m-*`, `gap-*`        | `p-card-inset`        |
| `--radius-*`        | `rounded-*`                  | `rounded-card`        |
| `--font-*`          | `font-*`                     | `font-body`           |
| `--shadow-*`        | `shadow-*`                   | `shadow-card`         |

### Trade-offs

- _Three-scope variable strategy_ is comprehensive but requires discipline — a component developer must know which scope to use.
- _Single-scope (all variables in `:root`)_ is simpler but does not support component-scoped overrides and creates naming collisions.

### Industry Best Practice

CSS custom properties for design tokens is the standard approach across the industry. Tailwind CSS v4's `@theme` directive formalizes the mapping. The three-scope pattern matches the component architecture's three tiers (global → semantic → component-level).

### Recommendation

Implement the three-scope CSS variable strategy. Use `@theme inline` to expose semantic tokens as Tailwind utilities. Define component-scoped variables within the component's root element using inline styles or `style` prop.

---

## 8. Tailwind CSS v4 Architecture

### Purpose

Define how Tailwind CSS v4 is configured, extended, and consumed within the project.

### Engineering Rationale

Tailwind CSS v4 introduces a CSS-first configuration model that replaces the `tailwind.config.ts` of v3. All customization happens in CSS via `@theme`, `@layer`, and `@custom-variant` directives. This architecture must align with the token system.

### Recommended Option

**CSS-first configuration with externalized theme extensions.**

```
globals.css
  ├── @import "tailwindcss"            — Core Tailwind
  ├── @custom-variant dark (...)       — Dark mode variant
  ├── @theme inline {                  — Semantic token → utility mapping
  │     --color-surface-card: ...;
  │     --color-text-primary: ...;
  │     --spacing-card: ...;
  │     ...
  │   }
  ├── :root { ... }                    — Token definitions
  ├── .dark { ... }                    — Dark theme overrides
  ├── @layer base { ... }              — Base styles
  ├── @layer utilities { ... }         — Custom utilities
  └── @keyframes { ... }              — Animations
```

### Configuration Rules

1. **No `tailwind.config.ts` file.** All configuration is in `globals.css` via Tailwind v4 directives.
2. **Use `@theme inline`** for all token-to-utility mappings. This is the v4 replacement for `extend` in the JS config.
3. **Use `@custom-variant`** for any custom state variants beyond Tailwind's defaults.
4. **Use `@utility`** for compound utility patterns that appear frequently. Use sparingly — prefer composition.
5. **Do not use `@config`** — this imports a JS config file and defeats the CSS-first model.
6. **Do not use `@apply`** — it is deprecated in v4 and defeats the utility-first approach.

### Custom Utility Guidelines

Create a custom `@utility` only when:

1. The pattern appears in 5+ components, AND
2. The pattern cannot be expressed as a simple combination of existing utilities, AND
3. The pattern has a clear semantic meaning that warrants a named utility

Acceptable examples:

- `@utility text-balance { text-wrap: balance; }` — frequently needed, no Tailwind utility exists
- `@utility scrollbar-hide { scrollbar-width: none; }` — frequently needed, multi-browser workaround

### Variant Strategy

Use `@custom-variant` for:

| Variant                                      | Purpose                     |
| -------------------------------------------- | --------------------------- |
| `@custom-variant dark (&:is(.dark *))`       | Dark mode (already defined) |
| `@custom-variant print (&:is(@media print))` | Print styles                |
| `@custom-variant rtl (&:is([dir="rtl"] *))`  | RTL support                 |

Do NOT create custom variants for component-specific states. Those belong in the component file as Tailwind utilities.

### Trade-offs

- _CSS-first configuration_ is simpler (one file, no JS config) but requires learning a new directive syntax for developers familiar with v3's JS config.
- _No `tailwind.config.ts`_ means plugin registration happens through CSS `@import` or npm imports, which may be less familiar.

### Industry Best Practice

Tailwind CSS v4's CSS-first model is the recommended approach from the Tailwind team. All major adopters are migrating from JS config to CSS config. The `@theme` directive is the standard mechanism for design token integration.

### Recommendation

Fully adopt the CSS-first configuration model. Do not create a `tailwind.config.ts`. Use `@theme inline` for all token mappings. Use `@custom-variant` sparsely — only for global variants (dark, print, RTL).

---

## 9. Utility Strategy

### Purpose

Define how Tailwind utilities are used, composed, and organized within components and sections.

### Engineering Rationale

Utility composition is the mechanism by which design tokens manifest as visual output. Without a strategy, utility usage becomes inconsistent — one developer orders classes alphabetically, another by property group, another arbitrarily.

### Recommended Option

**Predictable utility ordering with semantic-first composition.**

### Utility Ordering Convention

Within a `className` (or `cn()`) call, order utilities by the following groups, separated by logical sections:

```tsx
1. Layout/Display — flex, grid, block, hidden, relative, absolute
2. Positioning — top, right, bottom, left, z-index
3. Sizing — w-, h-, min-w-, max-h-
4. Spacing — p-, m-, gap-, space-
5. Typography — text-, font-, leading-, tracking-
6. Visual — bg-, border-, rounded-, shadow-
7. Interactive — cursor-, pointer-events-, select-, resize-
8. State variants — hover:, focus:, active:, disabled:
9. Responsive variants — sm:, md:, lg:
10. Theme variants — dark:
```

Example:

```tsx
className={cn(
  "flex items-center justify-between",     // Layout
  "w-full",                                 // Sizing
  "px-4 py-3",                              // Spacing
  "text-sm font-medium",                    // Typography
  "bg-surface-card border border-border-default rounded-card shadow-sm",  // Visual
  "cursor-pointer",                         // Interactive
  "hover:bg-surface-hover",                 // State
  "dark:bg-surface-card-dark",              // Theme
)}
```

### Utility Usage Rules

1. **Semantic over raw.** Always prefer semantic utilities (`bg-surface-card`) over raw utilities (`bg-white`).
2. **Compose, don't extract.** Do not extract repeated class strings into constants or `@apply` directives. Composition is the pattern.
3. **Use `cn()` for conditional classes.** Always use the `cn()` utility from `@/lib/utils` to merge conditional classes. Never use template literals for class merging.
4. **Minimize inline styles.** Inline styles are permitted only for dynamic values (e.g., `style={{ width: percentage }}`). Static styling uses utilities.
5. **One utility per CSS property.** Do not set the same CSS property twice in the same `className` (the last one wins, which is confusing).

### The `cn()` Utility Pattern

```tsx
// lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}
```

This pattern:

- Accepts conditional classes (strings, objects, arrays)
- Merges Tailwind classes without conflicts (tailwind-merge resolves conflicting utilities)
- Produces a single clean class string

### Trade-offs

- _Semantic-first utility usage_ requires developers to learn semantic token names. The benefit is visual consistency and themability.
- _Predictable ordering_ is a convention that requires discipline. Without enforcement, class order becomes inconsistent.
- _cn() pattern_ adds a small runtime cost (twMerge) but prevents class conflicts and improves maintainability.

### Industry Best Practice

The `cn()` pattern is the standard across shadcn/ui, Radix UI examples, and modern Next.js applications. Semantic utility usage is the direction Tailwind CSS v4 encourages through the `@theme` directive.

### Recommendation

Adopt the predictable ordering convention. Use `cn()` for all conditional class merging. Prefer semantic utilities. Never use `@apply`, never extract class strings into constants, never inline static styles.

---

## 10. Variant Architecture

### Purpose

Define a universal variant system that applies consistently across all components — visual variants, size variants, density variants, and state variants.

### Engineering Rationale

Without a consistent variant architecture, every component defines its own variant system. One component uses `variant="primary"` with `size="large"`; another uses `kind="main"` with `dimension="big"`. A universal variant system makes all components predictable.

### Recommended Option

**Six-axis variant system with consistent naming:**

#### 1. Visual Variants

| Variant     | Purpose                  | Example Components                    |
| ----------- | ------------------------ | ------------------------------------- |
| `primary`   | Primary/default action   | Button, Badge, Alert                  |
| `secondary` | Secondary/alternative    | Button, Badge                         |
| `outline`   | Outlined, low emphasis   | Button, Input                         |
| `ghost`     | Minimal, no background   | Button, MenuItem                      |
| `success`   | Positive/safe states     | Badge, Alert, StatusIndicator         |
| `warning`   | Caution states           | Badge, Alert, StatusIndicator         |
| `danger`    | Destructive/error states | Button, Badge, Alert, StatusIndicator |

#### 2. Size Variants

| Variant | Purpose                  | Example Components          |
| ------- | ------------------------ | --------------------------- |
| `xs`    | Extra small, compact     | Badge, IconButton           |
| `sm`    | Small, reduced footprint | Button, Input, Select       |
| `md`    | Medium, default          | Button, Input, Card, Select |
| `lg`    | Large, emphasis          | Button, Input, HeroSection  |
| `xl`    | Extra large, featured    | HeroTitle, PageHeader       |

#### 3. Density Variants

| Variant       | Purpose                               | Example Components    |
| ------------- | ------------------------------------- | --------------------- |
| `compact`     | Tight spacing, information-dense      | Table, List, DataGrid |
| `default`     | Standard spacing                      | Card, Section, Form   |
| `comfortable` | Generous spacing, readability-focused | Article, ProfileCard  |

Density variants modify internal spacing without changing the component's size or visual appearance.

#### 4. Interaction Variants

| Variant      | Purpose                       | Example Components            |
| ------------ | ----------------------------- | ----------------------------- |
| `default`    | Standard interactive behavior | Button, Link                  |
| `passive`    | Display only, no interaction  | Badge, Label, StatusIndicator |
| `active`     | Initiates action on click     | SubmitButton, ActionButton    |
| `selectable` | Can be selected/toggled       | FilterChip, Toggle            |
| `draggable`  | Can be rearranged             | SortableItem                  |

#### 5. Shape Variants

| Variant   | Purpose                    | Example Components  |
| --------- | -------------------------- | ------------------- |
| `square`  | Sharp corners (0 radius)   | Avatar, Image       |
| `rounded` | Standard rounding          | Button, Card, Input |
| `pill`    | Fully rounded (pill shape) | Badge, Tag, Avatar  |
| `circle`  | Circular shape             | Avatar, IconButton  |

#### 6. Width Variants

| Variant | Purpose                       | Example Components      |
| ------- | ----------------------------- | ----------------------- |
| `auto`  | Content-width                 | Button, Badge           |
| `full`  | 100% width of container       | Input, Select, Textarea |
| `fit`   | Fit to content, max container | Card, Section           |

### Implementation Pattern

Each component that supports variants exposes a consistent props interface:

```tsx
export interface ComponentProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  density?: "compact" | "default" | "comfortable";
  shape?: "square" | "rounded" | "pill" | "circle";
  width?: "auto" | "full" | "fit";
}
```

The component defaults to the most common variant in each axis. Not every component needs every axis — only the axes that meaningfully change the component.

### Variant Documentation

Every component's props interface documents which variant axes it supports:

```tsx
// Supported axes: visual (primary/secondary/outline), size (sm/md/lg)
// Not supported: density, shape, width
```

### Trade-offs

- _Six-axis system_ is comprehensive but verbose. Most components use 2-3 axes (visual, size, and possibly shape).
- _Inconsistent variant systems_ (each component defines its own) are simpler initially but create unpredictability across the codebase.
- _TypeScript union types_ for variant values provide autocomplete and type safety but require updating when a variant value is added.

### Industry Best Practice

Multi-axis variant systems are standard in component libraries. Radix UI uses variant/size/color. shadcn/ui uses variant/size. Material UI uses variant/color/size. The six-axis system extends this pattern with density (for information-dense views) and shape (for display components).

### Recommendation

Each component implements the variant axes that are meaningful for its role. All components that share an axis use identical variant values and naming. Document supported axes in the component's props interface.

---

## 11. Theme Architecture

### Purpose

Define the complete theme system — how themes are defined, how they switch, how they persist, and how they extend.

### Engineering Rationale

The theme system must support multiple themes (light, dark, future themes) without requiring changes to component code. Components must be theme-agnostic — they use semantic tokens that change meaning based on the active theme.

### Recommended Option

**CSS-variable-based theme switching with class-based activation.**

### Theme Definition

Each theme is defined as a CSS class that overrides semantic token values:

```
:root                        →  Light theme (default)
.dark                        →  Dark theme
.high-contrast               →  High-contrast theme (future)
.branding-[client]           →  Client-specific branding (future white-label)
```

Each class overrides only the semantic tokens that differ from the light theme default.

### Theme Activation

Themes are activated by applying the corresponding CSS class name to the `<html>` element:

- **`next-themes`** handles the class toggling via the `attribute="class"` configuration (already configured in Stage 1)
- The default theme is `system` (respects `prefers-color-scheme`)
- The user can override to `light` or `dark`
- Theme preference is persisted in `localStorage` (handled by `next-themes`)

### Theme Switching Flow

```
User toggles theme
  → next-themes updates <html> class
    → CSS variables change value via class selector specificity
      → Components re-render with new token values
        → No component code changes needed
```

### Theme Persistence

| Concern             | Mechanism                               | Details                                      |
| ------------------- | --------------------------------------- | -------------------------------------------- |
| User preference     | `localStorage` via `next-themes`        | Survives page reloads, cleared by user       |
| System preference   | `prefers-color-scheme` media query      | Used when `defaultTheme="system"`            |
| Per-page theme      | Not supported                           | Theme is application-wide, not page-specific |
| Per-component theme | Not supported                           | Theme is application-wide                    |
| Theme transition    | `transition-colors` on `html` or `body` | Smooth color transitions (200ms)             |

### Future Theme Support

To add a new theme (e.g., high-contrast):

1. Add the CSS class and token overrides in `globals.css`:
   ```css
   .high-contrast {
     --color-surface-page: var(--color-white);
     --color-text-primary: var(--color-black);
     --color-border-default: var(--color-zinc-700);
   }
   ```
2. Register the theme in the `next-themes` configuration:
   ```tsx
   <ThemeProvider
     attribute="class"
     defaultTheme="system"
     themes={["light", "dark", "high-contrast"]}
   >
   ```

No component changes are required. The theme system is entirely CSS-based.

### White-Labeling Strategy

For client-specific branding (e.g., a college-specific color scheme):

1. Define a `data-branding` attribute on `<html>`:
   ```css
   [data-branding="college-a"] {
     --color-accent: var(--color-blue-600);
     --color-accent-hover: var(--color-blue-700);
   }
   ```
2. Apply the attribute at the application level based on configuration.
3. No component changes needed — components use `--color-accent` regardless of which brand defines it.

### Trade-offs

- _CSS-variable-based theming_ is the most runtime-efficient approach (no JavaScript-driven style recalculations) but requires all token values to be defined as CSS variables.
- _CSS-in-JS theming_ (ThemeProvider + context) provides runtime flexibility but couples all components to the theme context and adds JavaScript bundle size.
- _Class-based activation_ is simple and well-supported but requires adding/removing a class rather than using the native `prefers-color-scheme` alone (which would prevent user override).

### Industry Best Practice

CSS variable-based theming with class activation is the standard approach across the industry (Tailwind CSS v4, shadcn/ui, Radix UI, Bootstrap 5+). `next-themes` provides the React integration for this pattern.

### Recommendation

Maintain the current `next-themes` + class-based approach. Define all themes in `globals.css` as CSS class overrides. Never hardcode theme-specific values in components. Add future themes by adding CSS classes, not by modifying components.

---

## 12. Color System

### Purpose

Define the color architecture — how colors are named, organized, and used across the system.

### Engineering Rationale

Color is the most commonly misused design element. Without a constrained palette, applications accumulate dozens of unique colors. A constrained, intentional color system prevents this.

### Recommended Option

**OKLCH color space with a constrained monochromatic + single accent palette.**

### Color Architecture

```
Raw Palette (global tokens):
  Zinc scale (50-950)    →  Neutral/surface colors
  Blue scale (50-950)     →  Accent/interactive colors
  Emerald scale (50-950)  →  Success colors
  Amber scale (50-950)    →  Warning colors
  Red scale (50-950)      →  Danger/error colors
  White, Black            →  Extremes
```

### Color Naming

```
--color-{hue}-{weight}
```

Where `{hue}` is the color name (zinc, blue, emerald, amber, red) and `{weight}` is the shade weight (50, 100, 200, ..., 900, 950).

### Palette Constraints

| Role           | Hue            | Weights Used                |
| -------------- | -------------- | --------------------------- |
| Surfaces       | Zinc (neutral) | 50, 100, 200, 800, 900, 950 |
| Accent/Primary | Blue           | 500, 600, 700               |
| Success        | Emerald        | 100, 500, 600, 700          |
| Warning        | Amber          | 100, 500, 600               |
| Danger         | Red            | 100, 500, 600, 700          |
| Text           | Zinc           | 500, 700, 900, 950          |

Only these weights should be referenced. If a weight is not in this table, it should not be used.

### Color Assignment Rules

1. **Semantic tokens use OKLCH values.** Continue the existing pattern in `globals.css`. OKLCH provides better perceptual uniformity than HSL or RGB.
2. **Never reference raw colors in components.** Components use semantic tokens only.
3. **Accent color is blue.** If the brand changes, redefine `--color-accent` to point to the new hue. No component changes needed.
4. **Text colors are monochromatic.** Colored text is reserved for semantic states (success, warning, danger) and links.
5. **Surface colors are monochromatic.** Background colors use the zinc scale exclusively. Accent backgrounds use blue only for interactive elements.

### Trade-offs

- _Constrained palette_ limits creative options but virtually eliminates color inconsistency.
- _OKLCH_ is more modern and perceptually uniform than HSL but has slightly less browser support (though all modern browsers support it).

### Industry Best Practice

OKLCH is the recommended color space for Tailwind CSS v4. The constrained palette approach is used by Linear (monochrome + blue accent), GitHub (monochrome + green/red accents), and Basecamp.

### Recommendation

Continue using OKLCH in `globals.css`. Maintain the constrained palette. Never add a new color without design review. If a new semantic role is needed, it must be mapped to an existing color in the palette.

---

## 13. Typography System

### Purpose

Define the complete typography architecture — font selection, type scale, responsive behavior, and usage rules.

### Engineering Rationale

Typography is the primary medium of communication in the application. A consistent typography system creates clear hierarchy, improves readability, and establishes visual rhythm.

### Recommended Option

**Dual-font system with Geist Sans (body) and Geist Mono (code).**

### Font Selection

| Role           | Font                      | Variable            | Fallback              |
| -------------- | ------------------------- | ------------------- | --------------------- |
| Body text      | Geist Sans                | `--font-geist-sans` | system-ui, sans-serif |
| Code/monospace | Geist Mono                | `--font-geist-mono` | monospace             |
| Headings       | Geist Sans (same as body) | `--font-geist-sans` | system-ui, sans-serif |

Geist is used for both body and headings. A single typeface provides visual consistency without the pairing complexity of a multi-font system. Headings are differentiated by weight and size, not by typeface.

### Type Scale

| Token              | Size            | Line Height    | Weight | Usage                         |
| ------------------ | --------------- | -------------- | ------ | ----------------------------- |
| `--font-size-xs`   | 0.75rem (12px)  | 1rem (16px)    | 400    | Captions, footnotes, metadata |
| `--font-size-sm`   | 0.875rem (14px) | 1.25rem (20px) | 400    | Body small, secondary text    |
| `--font-size-base` | 1rem (16px)     | 1.5rem (24px)  | 400    | Body default, paragraphs      |
| `--font-size-lg`   | 1.125rem (18px) | 1.75rem (28px) | 500    | Large body, intro text        |
| `--font-size-xl`   | 1.25rem (20px)  | 1.75rem (28px) | 600    | Section headings (h2)         |
| `--font-size-2xl`  | 1.5rem (24px)   | 2rem (32px)    | 600    | Section heading (h1)          |
| `--font-size-3xl`  | 1.875rem (30px) | 2.25rem (36px) | 700    | Page title                    |
| `--font-size-4xl`  | 2.25rem (36px)  | 2.5rem (40px)  | 700    | Hero heading                  |
| `--font-size-5xl`  | 3rem (48px)     | 1.1            | 800    | Large hero                    |

### Font Weight Usage

| Weight          | Usage                                          |
| --------------- | ---------------------------------------------- |
| 400 (Regular)   | Body text, descriptions, labels                |
| 500 (Medium)    | Emphasized body, navigation links, button text |
| 600 (Semibold)  | Subheadings, strong emphasis                   |
| 700 (Bold)      | Headings, section titles                       |
| 800 (Extrabold) | Hero headings, display text                    |

### Typography Rules

1. **Maximum line length:** 75 characters per line for readable body text. Use `max-w-prose` (65ch) for article/paragraph containers.
2. **Heading hierarchy:** One `<h1>` per page, hierarchical heading levels (`<h1>` → `<h2>` → `<h3>` → `<h4>`), no skipping levels.
3. **No justified text.** All text is left-aligned (or right-aligned in RTL). Justified text creates uneven spacing.
4. **No text transforms for headings.** Headings use sentence case only. No `uppercase`, `capitalize`, or `lowercase` transforms on heading text.
5. **Link underline on hover only.** Links are distinguished by color. Underline appears only on hover for body links.
6. **Code font for code only.** Geist Mono is used exclusively for code blocks, inline code, and monospaced data (IDs, timestamps).

### Responsive Typography

| Scale | Mobile (< 768px) | Tablet (768-1024px) | Desktop (> 1024px) |
| ----- | ---------------- | ------------------- | ------------------ |
| xs    | 0.75rem          | 0.75rem             | 0.75rem            |
| sm    | 0.875rem         | 0.875rem            | 0.875rem           |
| base  | 0.875rem         | 1rem                | 1rem               |
| lg    | 1rem             | 1.125rem            | 1.125rem           |
| xl    | 1.125rem         | 1.25rem             | 1.25rem            |
| 2xl   | 1.25rem          | 1.5rem              | 1.5rem             |
| 3xl   | 1.5rem           | 1.875rem            | 1.875rem           |
| 4xl   | 1.875rem         | 2.25rem             | 2.25rem            |
| 5xl   | 2.25rem          | 3rem                | 3rem               |

### Trade-offs

- _Single typeface_ (Geist for everything) simplifies the design system but may feel less visually distinctive than a paired system.
- _Dual-font system_ (Geist Sans + Geist Mono) provides distinction between body and code text without adding the complexity of a third typeface.

### Industry Best Practice

Modern design systems increasingly favor single-typeface systems (Inter + JetBrains Mono at Vercel, Geist + Geist Mono at Vercel/Next.js). The reduced cognitive load of a single typeface outweighs the visual variety of multi-font systems for application UIs.

### Recommendation

Maintain the current Geist Sans + Geist Mono configuration. Use Geist Sans for everything except code. The two fonts are already configured in the root layout. Define the type scale in `@theme` and expose it as Tailwind utilities.

---

## 14. Spacing System

### Purpose

Define the spacing architecture — how whitespace is measured, named, and applied across the system.

### Engineering Rationale

Consistent spacing is the most visible indicator of design quality. A constrained spacing scale prevents the accumulation of arbitrary padding and margin values.

### Recommended Option

**4px-base spacing scale with 8px-step increments.**

Tailwind CSS v4's default spacing scale (based on 4px increments using `rem`) provides a comprehensive set of values. The system uses a subset of this scale:

| Step | Value          | Usage                                  |
| ---- | -------------- | -------------------------------------- |
| 0    | 0px            | No spacing                             |
| 0.5  | 0.125rem (2px) | Tight nested spacing, icon inset       |
| 1    | 0.25rem (4px)  | Minimal spacing, compact layouts       |
| 2    | 0.5rem (8px)   | Tight spacing between related elements |
| 3    | 0.75rem (12px) | Default spacing between elements       |
| 4    | 1rem (16px)    | Standard inset/padding                 |
| 5    | 1.25rem (20px) | Comfortable spacing                    |
| 6    | 1.5rem (24px)  | Section spacing, card padding          |
| 8    | 2rem (32px)    | Large section spacing                  |
| 10   | 2.5rem (40px)  | Extra large spacing                    |
| 12   | 3rem (48px)    | Page section margins                   |
| 16   | 4rem (64px)    | Major page sections                    |
| 20   | 5rem (80px)    | Hero section padding                   |
| 24   | 6rem (96px)    | Page-level spacing, max value          |

### Semantic Spacing Tokens

| Token                 | Value   | Usage                            |
| --------------------- | ------- | -------------------------------- |
| `--spacing-inset-xs`  | 0.5rem  | Compact card padding             |
| `--spacing-inset-sm`  | 1rem    | Default card/container padding   |
| `--spacing-inset-md`  | 1.5rem  | Comfortable card padding         |
| `--spacing-inset-lg`  | 2rem    | Page section padding             |
| `--spacing-stack-xs`  | 0.25rem | Between tightly related elements |
| `--spacing-stack-sm`  | 0.5rem  | Between related elements         |
| `--spacing-stack-md`  | 1rem    | Between grouped elements         |
| `--spacing-stack-lg`  | 1.5rem  | Between sections                 |
| `--spacing-stack-xl`  | 2.5rem  | Between major sections           |
| `--spacing-inline-xs` | 0.5rem  | Between inline elements          |
| `--spacing-inline-sm` | 1rem    | Between inline groups            |
| `--spacing-inline-md` | 1.5rem  | Between inline major groups      |
| `--spacing-section`   | 4rem    | Between route sections           |
| `--spacing-page`      | 6rem    | Page-level margins               |

### Spacing Rules

1. **Use semantic spacing tokens** (`p-inset-sm`, `gap-stack-md`) in component JSX rather than raw spacing utilities (`p-4`, `gap-2`).
2. **Stack spacing for vertical rhythm.** Use `space-y-*` or `gap-*` (with flex-col) for vertical spacing between sibling elements.
3. **Inset spacing for container padding.** Container elements define their internal padding using `p-inset-*`.
4. **Section spacing for page layout.** Sections define their vertical separation using `my-section-*` or outer padding.
5. **Never use negative margins.** Negative margins create unpredictable layout behavior. Use grid/flex gap instead.

### Trade-offs

- _Semantic spacing tokens_ add abstraction but ensure that a spacing value change (e.g., increasing card padding across the system) requires only one token change.
- _Raw spacing utilities_ (`p-4`, `gap-2`) are clearer for individual use but make system-wide spacing changes impossible without search-and-replace.

### Industry Best Practice

4px-base spacing scales are the standard across design systems (Material Design uses 8px base, Shopify uses 4px base, Carbon uses 8px base). The 4px base (Tailwind default) provides finer granularity and better aligns with common icon sizes (16px, 24px, 32px).

### Recommendation

Use the Tailwind default spacing scale (4px base). Define semantic spacing tokens in `@theme`. Components use semantic spacing tokens in their class strings. Reserve raw spacing utilities for one-off adjustments that lack a semantic token.

---

## 15. Grid System

### Purpose

Define the grid architecture — how layouts are structured, how columns are defined, and how responsive breakpoints interact with the grid.

### Engineering Rationale

A consistent grid system ensures that layouts are visually coherent across pages. Without a grid, layouts use arbitrary widths and alignments.

### Recommended Option

**CSS Grid with 12-column implicit grid and responsive column overrides.**

### Grid Architecture

| Concept        | Implementation                                       |
| -------------- | ---------------------------------------------------- |
| Column count   | 12 columns (implicit, not explicitly defined in CSS) |
| Grid container | `grid grid-cols-1 md:grid-cols-12`                   |
| Column spans   | `col-span-{n}` or `md:col-span-{n}`                  |
| Gutters        | `gap-6` (1.5rem) default                             |
| Max width      | `max-w-7xl` (80rem / 1280px) for page content        |

### Grid Usage Patterns

```tsx
// Page-level grid: 12 columns, collapses to single column on mobile
<div className="grid grid-cols-1 gap-6 md:grid-cols-12">
  <Sidebar className="md:col-span-3" />
  <MainContent className="md:col-span-9" />
</div>

// Card grid: auto-fill responsive columns
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {cards.map(card => <Card key={card.id} />)}
</div>

// Form grid: 2-column on desktop, single on mobile
<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
  <TextInput />
  <TextInput />
</div>
```

### Responsive Breakpoints

| Breakpoint | Min Width | Usage                        |
| ---------- | --------- | ---------------------------- |
| `sm`       | 640px     | Large mobile, compact tablet |
| `md`       | 768px     | Tablet, small desktop        |
| `lg`       | 1024px    | Desktop standard             |
| `xl`       | 1280px    | Large desktop                |
| `2xl`      | 1536px    | Extra large screens          |

### Grid Rules

1. **One grid per section.** A section should have one grid container. Nested grids are acceptable but rare.
2. **Grid for layout, flex for components.** Use CSS Grid for page/section-level layouts. Use Flexbox for component-level layouts (row/column alignment within a component).
3. **Collapse to single column on mobile.** Every layout must work in a single-column view at the smallest breakpoint.
4. **No fixed-width columns.** Column spans use fraction-based values (`col-span-4`, `col-span-8`), never `w-[400px]` or similar fixed widths.
5. **Consistent gutter.** Use `gap-6` universally for grid gutters. Deviations require design review.

### Trade-offs

- _12-column grid_ provides maximum flexibility for layout composition but can be overkill for simple layouts (2-3 column pages).
- _Implicit grid_ (no CSS grid-template-columns definition) is simpler but does not enforce column counts at the CSS level.

### Industry Best Practice

12-column grids are the industry standard (Bootstrap, Tailwind, Material Design). The responsive collapse pattern (single column on mobile → multi-column on desktop) is universal.

### Recommendation

Use Tailwind's grid utilities with 12-column implicit grids for page-level layouts. Use flexbox for component-level layouts. Always collapse to single column on mobile. Maintain consistent `gap-6` gutters.

---

## 16. Container Strategy

### Purpose

Define how content containers are sized, centered, and constrained.

### Recommended Option

**Max-width containers with responsive padding.**

```css
@theme inline {
  --container-content: 72rem; /* 1152px — main content */
  --container-narrow: 48rem; /* 768px — reading/article content */
  --container-wide: 90rem; /* 1440px — full-width dashboards */
  --container-page-padding: 1rem; /* mobile */
  --container-page-padding-md: 2rem; /* tablet+ */
}
```

| Container       | Max Width | Usage                          |
| --------------- | --------- | ------------------------------ |
| `max-w-content` | 72rem     | Default page content           |
| `max-w-narrow`  | 48rem     | Articles, forms, reading views |
| `max-w-wide`    | 90rem     | Admin dashboards, data tables  |
| `max-w-7xl`     | 80rem     | Tailwind default, legacy pages |

### Container Rules

1. **Centered with auto margins.** Every container uses `mx-auto` to center horizontally.
2. **Responsive padding.** Containers have `px-4 md:px-8` for consistent edge spacing.
3. **Nested containers are prohibited.** A container within a container defeats the purpose of the outer container.
4. **Container-query-aware components.** Avoid assuming container widths equate to viewport widths.

### Trade-offs

- _Multiple container widths_ provide flexibility for different content types but can lead to inconsistent alignment between sections.
- _Single container width_ ensures consistent alignment but may constrain dashboard-style layouts that benefit from wider content areas.

### Industry Best Practice

Multiple container widths are standard (Vercel uses `--width-content` and `--width-wide`, GitHub uses different widths for different page types). The key constraint is that each page uses exactly one container width.

### Recommendation

Define three container widths in `@theme`. Each page uses exactly one container width consistently. The page layout determines which width applies, not individual sections.

---

## 17. Shadow and Elevation System

### Purpose

Define how depth is communicated through shadows — how elevation levels are named, valued, and assigned.

### Recommended Option

**Five-level elevation system.**

| Level | Token           | Usage                       |
| ----- | --------------- | --------------------------- |
| 0     | `--shadow-none` | No elevation — page surface |
| 1     | `--shadow-sm`   | Card surface, subtle depth  |
| 2     | `--shadow-md`   | Elevated cards, dropdowns   |
| 3     | `--shadow-lg`   | Modals, dialogs, drawers    |
| 4     | `--shadow-xl`   | Toasts, tooltips, popovers  |

```
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

Dark theme shadows are reduced (lower opacity) to avoid harsh contrast on dark surfaces:

```css
.dark {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  /* etc */
}
```

### Elevation Assignment

| Element        | Elevation |
| -------------- | --------- |
| Page surface   | 0 (none)  |
| Card (default) | 1 (sm)    |
| Card (hover)   | 2 (md)    |
| Dropdown menu  | 2 (md)    |
| Select popover | 2 (md)    |
| Dialog/modal   | 3 (lg)    |
| Drawer         | 3 (lg)    |
| Toast          | 4 (xl)    |
| Tooltip        | 4 (xl)    |
| Popover        | 4 (xl)    |

### Elevation Rules

1. **Do not stack elevations.** An element at elevation 3 should not contain an element at elevation 4. If necessary, the inner element should be at most elevation 1.
2. **Dark theme reduces shadow opacity.** All shadows in dark mode use higher opacity values to maintain visibility without creating harsh contrast.
3. **No colored shadows.** All shadows use black (`rgb(0 0 0)`) with opacity. Colored shadows (e.g., blue tint for accent) are unnecessary visual noise.
4. **Hover elevation increase.** Interactive surfaces (cards, menu items) elevate by 1 level on hover to signal interactivity.

### Trade-offs

- _Five-level system_ covers the full range of UI depth needs but requires developers to memorize elevation assignments.
- _Three-level system_ (low/medium/high) is simpler but may not distinguish between, for example, a modal and a toast.
- _Fixed shadow values_ (not CSS variables) are simpler but prevent dark theme shadow adjustments.

### Industry Best Practice

Elevation systems with 3-5 levels are standard (Material Design uses 24 levels but recommends 5; Shopify uses 3; Carbon uses 8). The Tailwind default provides 4 shadow levels, which this system extends to 5 by adding "none."

### Recommendation

Implement the five-level elevation system. Define shadow tokens in `@theme` with dark theme overrides. Assign each UI pattern to a specific elevation level. Cards elevate on hover by one level.

---

## 18. Border and Border Radius System

### Purpose

Define the border and border radius architecture — how lines and corners are used to define shapes and surfaces.

### Recommended Option

**Minimal border system with intentional radius usage.**

### Border Width

| Token                 | Value | Usage                                 |
| --------------------- | ----- | ------------------------------------- |
| `--border-width-none` | 0px   | No border                             |
| `--border-width-sm`   | 1px   | Default border width for all elements |

The system uses exactly one border width (1px). If an element needs a border, it uses 1px. Variance is achieved through color, not width.

### Border Radius

| Token           | Value    | Usage                                  |
| --------------- | -------- | -------------------------------------- |
| `--radius-none` | 0px      | Images, banners, full-width elements   |
| `--radius-sm`   | 0.25rem  | Buttons (sm), inputs, compact elements |
| `--radius-md`   | 0.375rem | Default card, container, button (md)   |
| `--radius-lg`   | 0.5rem   | Cards, modals, dialogs                 |
| `--radius-xl`   | 0.75rem  | Large containers, hero sections        |
| `--radius-full` | 9999px   | Pills, badges, avatars                 |

### Radius Assignment

| Element                 | Radius          |
| ----------------------- | --------------- |
| Button (sm)             | `sm`            |
| Button (md, lg)         | `md`            |
| Card                    | `lg`            |
| Input, Select, Textarea | `sm`            |
| Badge                   | `full` (pill)   |
| Avatar                  | `full` (circle) |
| Dialog/Modal            | `lg`            |
| Dropdown                | `md`            |
| Toast                   | `md`            |
| Tooltip                 | `sm`            |

### Border Rules

1. **Borders are for structure, not decoration.** Every border serves a structural purpose (separating elements, defining input boundaries, indicating interactive areas).
2. **Use background differentiation before borders.** Prefer `bg-surface-card` over `border` to distinguish a card from the page background. Use borders only when background alone is insufficient.
3. **Focus rings use `ring` utilities, not `border`.** Focus indicators use Tailwind's ring utilities (`ring-2 ring-ringColor`) to avoid layout shift and ensure consistent focus appearance.
4. **Border colors are always semantic.** Use `border-border-default` rather than `border-zinc-200`.

### Trade-offs

- _Single border width_ is restrictive but eliminates inconsistency. Some designs may benefit from 2px borders for emphasis (use shadow or background color instead).
- _Focus rings over borders_ adds a CSS property but ensures focus indicators don't cause layout shifts.

### Industry Best Practice

Modern design systems increasingly favor single border widths (Linear, Stripe, GitHub all use 1px borders consistently). Focus rings are the WCAG-recommended focus indicator.

### Recommendation

Use exactly one border width (1px). Use focus rings for focus states. Assign each UI element a radius from the radius scale. Prefer background color over borders for surface differentiation.

---

## 19. Motion System

### Purpose

Define the animation and motion philosophy — how transitions, animations, and micro-interactions are designed and implemented.

### Engineering Rationale

Motion serves three purposes in a UI: feedback (confirming user action), orientation (guiding the user's attention), and delight (making the experience pleasant). Every animation must serve at least one of these purposes.

### Recommended Option

**Restrained, purposeful motion with consistent timing and easing.**

### Duration Tokens

| Token                | Value | Usage                                             |
| -------------------- | ----- | ------------------------------------------------- |
| `--duration-instant` | 0ms   | Instant changes, no animation                     |
| `--duration-fast`    | 100ms | Micro-interactions, hover states, toggle switches |
| `--duration-normal`  | 200ms | Default transitions, button feedback, form focus  |
| `--duration-slow`    | 300ms | Panel transitions, drawer open/close              |
| `--duration-slide`   | 400ms | Page transitions, route changes                   |

### Easing Tokens

| Token             | Curve         | Usage                               |
| ----------------- | ------------- | ----------------------------------- |
| `--easing-linear` | `linear`      | Color transitions, opacity          |
| `--easing-in`     | `ease-in`     | Elements leaving the screen         |
| `--easing-out`    | `ease-out`    | Elements entering the screen        |
| `--easing-in-out` | `ease-in-out` | Elements changing within the screen |

### Animation Rules

1. **Hover transitions: 100ms, ease-out.** Button hover, link hover, card hover elevation change.
2. **Focus transitions: 100ms, ease-out.** Focus ring appearance.
3. **Enter animations: 200ms, ease-out.** Elements appearing (dropdowns, tooltips, modals).
4. **Exit animations: 150ms, ease-in.** Elements disappearing.
5. **Page transitions: 300ms, ease-in-out.** Route transition animations.
6. **No looping animations except loading indicators.** Spinners and skeleton pulses loop. Everything else animates once.
7. **No staggered animations for content lists.** Avoid fade-in-stagger for lists — it adds perceived latency and violates the "professional trust" design language.

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This is already implemented in `globals.css`. It must be maintained and never removed.

### Micro-interaction Guidelines

| Interaction    | Animation                 | Duration | Easing      |
| -------------- | ------------------------- | -------- | ----------- |
| Button hover   | Background color          | 100ms    | ease-out    |
| Button active  | Scale 0.97                | 100ms    | ease-out    |
| Link hover     | Text color                | 100ms    | ease-out    |
| Card hover     | Shadow elevation +1       | 200ms    | ease-out    |
| Input focus    | Ring appearance           | 100ms    | ease-out    |
| Toggle switch  | Knob slide + bg color     | 200ms    | ease-out    |
| Dropdown open  | Fade + scale (origin top) | 150ms    | ease-out    |
| Dropdown close | Fade                      | 100ms    | ease-in     |
| Modal open     | Fade + scale              | 200ms    | ease-out    |
| Modal close    | Fade                      | 150ms    | ease-in     |
| Toast enter    | Slide in (from right)     | 200ms    | ease-out    |
| Toast exit     | Fade + slide out          | 150ms    | ease-in     |
| Drawer open    | Slide from edge           | 300ms    | ease-out    |
| Skeleton       | Opacity pulse             | 2000ms   | ease-in-out |

### Trade-offs

- _Restrained motion_ may feel less "delightful" to users who enjoy animated interfaces. The system prioritizes professional trust over entertainment.
- _Reduced motion support_ requires checking every animation against the `prefers-reduced-motion` media query. This is a WCAG requirement.
- _Consistent 200ms default_ may feel sluggish for some interactions (hover should be 100ms) and too fast for others (page transitions should be 300ms).

### Industry Best Practice

Restrained, purposeful motion is the standard for professional applications (Linear, GitHub, Slack). Consistent timing and easing create a predictable motion language. WCAG requires reduced motion support.

### Recommendation

Implement the motion system using CSS transitions (preferred) and CSS animations (for keyframe-based animations). Use the duration and easing tokens in component CSS. Maintain the existing reduced motion override in `globals.css`.

---

## 20. Iconography System

### Purpose

Define how icons are selected, sized, colored, and used within the system.

### Recommended Option

**Lucide React as the sole icon library with a constrained sizing system.**

### Icon Library

| Concern               | Decision                                                              |
| --------------------- | --------------------------------------------------------------------- |
| Library               | `lucide-react` (already installed)                                    |
| Alternative libraries | None — all icons from lucide-react                                    |
| Custom icons          | SVG components in `@/components/icons/` for brand-specific icons only |
| Icon count            | Use the minimum set — avoid decorative icons                          |

### Icon Sizing

| Token             | Value | Usage                                    |
| ----------------- | ----- | ---------------------------------------- |
| `--size-icon-sm`  | 14px  | Inline with small text, badges           |
| `--size-icon-md`  | 16px  | Default icon size, inline with body text |
| `--size-icon-lg`  | 20px  | Standalone icons, button icons           |
| `--size-icon-xl`  | 24px  | Hero icons, feature graphics             |
| `--size-icon-2xl` | 32px  | Empty state illustrations                |

### Icon Usage Rules

1. **Icons support, not replace, text.** Icons are never the sole indicator of meaning (with exceptions for universally recognized icons like the close X and hamburger menu).
2. **Icons inherit text color.** Icons use `currentColor` to inherit their parent's text color. No explicit icon color unless it differs from the surrounding text.
3. **No decorative icons.** Every icon serves a functional purpose (indicating an action, highlighting a status, guiding navigation).
4. **Consistent stroke width.** Lucide's default 2px stroke is used for all icons. No overridden stroke widths.
5. **Left of text for actions, right of text for indicators.** Action icons (edit, delete, add) go to the left of the label. Status/indicator icons (external link, chevron) go to the right.
6. **Custom icons must match Lucide's style.** Custom SVG icons must follow Lucide's design conventions: 24×24 viewBox, 2px stroke width, rounded caps and joins.

### Trade-offs

- _Single icon library_ prevents icon inconsistency but may require importing a full icon when only one from a set is needed. Tree-shaking in lucide-react handles this.
- _No decorative icons_ reduces visual noise but may make the UI feel spartan. The "professional trust" design language embraces this.

### Industry Best Practice

Single-icon-library systems are standard (Shopify uses Polaris icons, GitHub uses octicons, Vercel uses lucide-react). SVG-based icon systems with `currentColor` inheritance are the recommended approach.

### Recommendation

Use `lucide-react` exclusively. Import individual icons by name (tree-shaking eliminates unused icons). Use the defined icon sizing tokens. Create custom SVG icons only for brand-specific needs, matching Lucide's design conventions.

---

## 21. Surface and Card Design System

### Purpose

Define how surfaces (cards, containers, panels) are visually structured — their hierarchy, depth, and relationship to the page background.

### Engineering Rationale

Cards are the most common structural element in the application. A consistent card design system prevents visual fragmentation across the dozens of card-like components.

### Recommended Option

**Three surface levels with consistent card anatomy.**

### Surface Levels

| Level        | Background                 | Border                       | Shadow        | Usage              |
| ------------ | -------------------------- | ---------------------------- | ------------- | ------------------ |
| **Page**     | `--color-surface-page`     | None                         | None          | Body background    |
| **Card**     | `--color-surface-card`     | 1px `--color-border-default` | `--shadow-sm` | Default containers |
| **Elevated** | `--color-surface-elevated` | 1px `--color-border-default` | `--shadow-lg` | Modals, dropdowns  |

### Card Anatomy

```
┌──────────────────────────────────┐
│ Card Header (optional)           │
│   Title (text-primary)           │
│   Description (text-secondary)   │
├──────────────────────────────────┤
│ Card Body                        │
│   Content area                   │
├──────────────────────────────────┤
│ Card Footer (optional)           │
│   Actions, metadata              │
└──────────────────────────────────┘
```

| Part           | Padding                           | Border                      | Background             |
| -------------- | --------------------------------- | --------------------------- | ---------------------- |
| Card container | `--spacing-inset-md` (1.5rem)     | Full outer border           | `--color-surface-card` |
| Card header    | Bottom padding, no extra inset    | Bottom separator (optional) | Inherited from card    |
| Card body      | No extra padding beyond container | None                        | Inherited              |
| Card footer    | Top padding, no extra inset       | Top separator (optional)    | Inherited              |

### Card Variants

| Variant       | Visual Difference                       | Usage                    |
| ------------- | --------------------------------------- | ------------------------ |
| `default`     | Standard card                           | Most cards               |
| `interactive` | Hover: elevation +1, cursor pointer     | Clickable cards          |
| `selected`    | Ring or border color change             | Selected state           |
| `highlight`   | Left border accent color                | Featured/important cards |
| `compact`     | Padding reduced to `--spacing-inset-sm` | Dense card lists         |

### Card Composition in JSX

Rather than creating a monolithic Card component with header/body/footer props, cards are composed from the base `Card` and utility components:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

This composition pattern is already established with the `Card` component in `@/components/ui/card.tsx`. `CardHeader`, `CardContent`, and `CardFooter` are utility sub-components that apply consistent spacing.

### Surface Rules

1. **Three levels maximum.** Do not introduce a fourth surface level. If a fourth depth is needed, use shadow rather than background color.
2. **Card backgrounds are monochromatic.** Card backgrounds use the zinc scale (light) or zinc scale (dark). No colored card backgrounds except for semantic states (success/warning/danger cards).
3. **No nested elevated surfaces.** An elevated surface (modal) must not contain another elevated surface. A card may contain a lower-elevation card, but not an elevated surface.
4. **Cards have consistent corner radius.** All cards use `--radius-lg` unless the card is edge-to-edge within its container.

### Trade-offs

- _Three surface levels_ is restrictive but ensures visual hierarchy is predictable and unambiguous.
- _Composition pattern_ (CardHeader/CardContent/CardFooter) is more verbose than a single Card component with section props but provides maximum flexibility.

### Industry Best Practice

Three-level surface systems are standard (GitHub uses page/card/overlay, Linear uses page/card/dialog, Stripe uses page/panel/modal). Composition-based card anatomy is the Radix UI and shadcn/ui recommended pattern.

### Recommendation

Maintain the three-level surface system. Use composition (`Card` + sub-components) for card anatomy. Never add a fourth surface level. Document surface levels as part of the design system.

---

## 22. Form Styling Strategy

### Purpose

Define how forms and their elements (inputs, selects, textareas, checkboxes, radios, labels, validation messages) are styled consistently.

### Engineering Rationale

Forms are the most interaction-dense elements in the application. Inconsistent form styling creates a fragmented user experience that undermines trust.

### Recommended Option

**Consistent input anatomy with defined states.**

### Input Anatomy

```
┌─────────────────────────────────────┐
│ Label (text-sm, font-medium)        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Icon   Input text     Trailing  │ │
│ │        cursor          element  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Helper text / Validation message    │
└─────────────────────────────────────┘
```

| Part            | Styling                                                 |
| --------------- | ------------------------------------------------------- |
| Label           | `text-sm font-medium text-text-primary`                 |
| Input container | `rounded-sm border border-border-input bg-surface-card` |
| Input text      | `text-sm text-text-primary placeholder:text-text-muted` |
| Focus state     | `ring-2 ring-ring ring-offset-2`                        |
| Error state     | `border-border-danger` + red text for message           |
| Disabled state  | `opacity-50 cursor-not-allowed bg-surface-hover`        |
| Helper text     | `text-xs text-text-secondary`                           |
| Error message   | `text-xs text-text-danger`                              |

### Input States

| State          | Border                 | Background             | Text   | Ring               |
| -------------- | ---------------------- | ---------------------- | ------ | ------------------ |
| Default        | `border-border-input`  | `bg-surface-card`      | Normal | None               |
| Hover          | `border-border-hover`  | `bg-surface-card`      | Normal | None               |
| Focus          | `border-border-focus`  | `bg-surface-card`      | Normal | `ring-2 ring-ring` |
| Filled (valid) | `border-border-input`  | `bg-surface-card`      | Normal | None               |
| Error          | `border-border-danger` | `bg-surface-danger-bg` | Normal | None               |
| Disabled       | `border-border-input`  | `bg-surface-hover`     | Muted  | None               |
| Read-only      | `border-border-input`  | `bg-surface-hover`     | Normal | None               |

### Input Sizing

| Size | Height        | Padding       | Font        |
| ---- | ------------- | ------------- | ----------- |
| `sm` | 2rem (32px)   | `px-3 py-1.5` | `text-sm`   |
| `md` | 2.5rem (40px) | `px-3 py-2`   | `text-sm`   |
| `lg` | 3rem (48px)   | `px-4 py-2.5` | `text-base` |

### Form Layout Rules

1. **Single column by default.** Forms stack fields vertically for readability. Multi-column forms use CSS Grid with consistent gutters.
2. **Label above input.** Labels are positioned above their input (not placeholder-only, not inline). This is the most accessible form layout.
3. **Error messages below input.** Validation errors appear below the input field (not as a tooltip, not inline in the label).
4. **Required indicator is `*` after label.** Required fields have an asterisk after the label text, colored `text-text-danger`.
5. **Help text between label and input.** Help text that explains what to enter appears between the label and the input.
6. **Submit button left-aligned.** Submit buttons are left-aligned with the input fields, not centered.

### Accessibility for Forms

1. Every input has an associated `<label>` element (not placeholder as label).
2. Error messages are associated with the input via `aria-describedby`.
3. Required fields use `aria-required="true"`.
4. Focus order follows visual order (top-to-bottom, left-to-right).
5. Form submission is prevented on Enter for single-field forms (to prevent accidental submission).

### Trade-offs

- _Label-above-input_ requires more vertical space than inline labels but is the most readable and accessible pattern.
- _Consistent input anatomy_ across all form elements constrains creativity but ensures predictability.
- _Focus ring on all inputs_ is a WCAG requirement (2.4.7 Focus Visible) and should not be considered optional.

### Industry Best Practice

Label-above-input is the WCAG-recommended form layout. Consistent input anatomy is standard across design systems (Material Design, Shopify Polaris, Carbon). Focus rings on all interactive elements are a WCAG requirement.

### Recommendation

Implement the defined input anatomy and state system. Use the same pattern for all form elements (input, select, textarea, checkbox, radio). Maintain the focus ring on all interactive form elements.

---

## 23. Table Styling Strategy

### Purpose

Define how data tables are styled — their structure, states, density variants, and responsive behavior.

### Recommended Option

**Minimal table styling with border-separated rows.**

### Table Anatomy

```
┌──────────────────────────────────────────────────┐
│ Header Row                                       │
│ ┌─────────┬──────────┬──────────┬──────────────┐ │
│ │ Header  │  Header  │  Header  │   Header     │ │
│ ├─────────┼──────────┼──────────┼──────────────┤ │
│ │ Data    │  Data    │  Data    │   Data       │ │
│ ├─────────┼──────────┼──────────┼──────────────┤ │
│ │ Data    │  Data    │  Data    │   Data       │ │
│ ├─────────┼──────────┼──────────┼──────────────┤ │
│ │ Data    │  Data    │  Data    │   Data       │ │
│ └─────────┴──────────┴──────────┴──────────────┘ │
│ Footer (optional)                                 │
└──────────────────────────────────────────────────┘
```

### Table Styling

| Part            | Styling                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Table container | `w-full overflow-x-auto rounded-lg border border-border-default`                                        |
| Header cell     | `px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider bg-surface-hover` |
| Data cell       | `px-4 py-3 text-sm text-text-primary`                                                                   |
| Row (default)   | `border-b border-border-default last:border-b-0`                                                        |
| Row (hover)     | `hover:bg-surface-hover`                                                                                |
| Row (selected)  | `bg-accent/5`                                                                                           |
| Footer          | `px-4 py-3 text-sm text-text-secondary border-t border-border-default`                                  |

### Density Variants

| Variant       | Cell Padding | Font Size | Usage                        |
| ------------- | ------------ | --------- | ---------------------------- |
| `compact`     | `px-3 py-2`  | `text-xs` | Dense data, admin tables     |
| `default`     | `px-4 py-3`  | `text-sm` | Standard tables              |
| `comfortable` | `px-6 py-4`  | `text-sm` | Readable tables, user-facing |

### Table Rules

1. **No horizontal cell borders.** Only row separators (bottom border). Horizontal cell borders create visual noise.
2. **Sortable headers have hover state + sort icon.** Sortable columns show a sort chevron on hover and the active sort direction.
3. **Responsive: horizontal scroll on overflow.** Tables do not wrap or collapse cell content on small screens. Instead, the table container scrolls horizontally.
4. **No fixed column widths.** Columns distribute width based on content. Use `w-[n]` only when a column has a known content width (e.g., actions column).
5. **Left-align text, right-align numbers.** Text columns are left-aligned. Numeric columns are right-aligned.
6. **Sticky header on scroll.** The table header row is sticky (`sticky top-0`) when the table body scrolls within a fixed-height container.

### Trade-offs

- _Horizontal scroll on mobile_ is less mobile-friendly than responsive card layouts but preserves the tabular data structure.
- _Border-separated rows_ (horizontal borders only) is the cleanest table style but requires the table to "breathe" with adequate padding.

### Industry Best Practice

Border-separated rows with horizontal scroll on overflow is the standard data table pattern (Linear, GitHub, Vercel). Sticky headers and sortable columns are expected table features.

### Recommendation

Implement the defined table anatomy. Use density variants for different table contexts. Use horizontal scroll for mobile responsiveness. Always provide sticky headers for tables with scrollable bodies.

---

## 24. Navigation Styling

### Purpose

Define how navigation elements (sidebar, topbar, tabs, breadcrumbs, pagination) are styled.

### Recommended Option

**Hierarchical navigation styling with consistent interaction patterns.**

### Sidebar Styling

| Part               | Styling                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| Sidebar container  | `w-64 bg-surface-card border-r border-border-default`                                             |
| Nav item (default) | `px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary rounded-md` |
| Nav item (active)  | `bg-accent/10 text-accent font-medium`                                                            |
| Nav section label  | `px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider`                          |
| Nav item icon      | `w-4 h-4 mr-3 text-current`                                                                       |
| Nav item badge     | `ml-auto` (pushed to right edge)                                                                  |

### Topbar Styling

| Part              | Styling                                                            |
| ----------------- | ------------------------------------------------------------------ |
| Topbar container  | `h-14 bg-surface-card border-b border-border-default px-4 md:px-6` |
| Page title        | `text-lg font-semibold text-text-primary`                          |
| Actions area      | `flex items-center gap-2 ml-auto` (pushed to right)                |
| Search input      | Standard input styling, `w-64` or `w-full` on mobile               |
| User menu trigger | Avatar + name, no background                                       |

### Tab Styling

| Part           | Styling                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------- |
| Tab bar        | `flex border-b border-border-default`                                                         |
| Tab (default)  | `px-4 py-2 text-sm text-text-secondary hover:text-text-primary border-b-2 border-transparent` |
| Tab (active)   | `text-accent font-medium border-b-2 border-accent`                                            |
| Tab (disabled) | `opacity-50 cursor-not-allowed text-text-muted`                                               |

### Breadcrumb Styling

| Part                 | Styling                                               |
| -------------------- | ----------------------------------------------------- |
| Breadcrumb container | `flex items-center gap-1 text-sm text-text-secondary` |
| Breadcrumb item      | `hover:text-text-primary`                             |
| Active item (last)   | `text-text-primary font-medium`                       |
| Separator            | `text-text-muted mx-1` (forward slash or chevron)     |

### Pagination Styling

| Part                   | Styling                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| Pagination container   | `flex items-center justify-center gap-1`                                |
| Page button            | `w-8 h-8 text-sm rounded-md text-text-secondary hover:bg-surface-hover` |
| Page button (active)   | `bg-accent text-white font-medium`                                      |
| Page button (disabled) | `opacity-30 cursor-not-allowed`                                         |
| Navigation arrow       | Icon only, same dimensions as page button                               |

### Navigation Rules

1. **Active state is accent-colored.** The active navigation item uses the accent color for its text or indicator.
2. **Hover state is surface hover.** All interactive navigation items have a visible hover state.
3. **Icon + text for primary navigation.** Sidebar and topbar navigation items include both an icon and text label. Icon-only navigation is reserved for mobile compact views.
4. **Active indicator is consistent.** Use bottom border for tabs, background highlight for sidebar, text color for breadcrumbs.
5. **No dropdown for primary navigation.** Sidebar items do not expand into sub-menus. If sub-navigation is needed, it appears as indented items below the parent.

### Trade-offs

- _No sidebar sub-menus_ keeps navigation simple but may require additional pages for hierarchical content.
- _Icon + text in sidebar_ takes more space than icon-only but provides clear labels for all nav items.

### Industry Best Practice

The sidebar + topbar pattern is standard for admin applications. Active indicators vary by context (background for sidebar, underline for tabs). Icon + text is the recommended pattern for primary navigation.

### Recommendation

Implement the defined navigation styling for sidebar, topbar, tabs, breadcrumbs, and pagination. Maintain consistent active, hover, and disabled states across all navigation elements.

---

## 25. Interactive State Strategy (Hover, Active, Focus, Disabled)

### Purpose

Define consistent interactive states across all interactive elements — how each state looks, feels, and behaves.

### Recommended Option

**Four-state interactive system with consistent token usage.**

### State Definitions

| State        | Trigger                               | Duration | Visual Change                                    |
| ------------ | ------------------------------------- | -------- | ------------------------------------------------ |
| **Hover**    | Mouse pointer enters element boundary | 100ms    | Background color, border color, or shadow change |
| **Active**   | Mouse pointer pressed on element      | 100ms    | Scale (0.97), darker background                  |
| **Focus**    | Element receives keyboard focus       | 100ms    | Focus ring (ring-2 ring-ring ring-offset-2)      |
| **Disabled** | Element is not interactive            | N/A      | Opacity 50%, cursor not-allowed                  |

### State Tokens

| Token      | Hover                   | Active                   | Focus                  | Disabled               |
| ---------- | ----------------------- | ------------------------ | ---------------------- | ---------------------- |
| Background | `--color-surface-hover` | `--color-surface-active` | Inherited              | Inherited              |
| Border     | `--color-border-hover`  | `--color-border-active`  | `--color-border-focus` | `--color-border-input` |
| Ring       | None                    | None                     | `--color-ring`         | None                   |
| Opacity    | 100%                    | 100%                     | 100%                   | 50%                    |
| Cursor     | `pointer`               | `pointer`                | `pointer`              | `not-allowed`          |
| Transform  | None                    | `scale(0.97)`            | None                   | None                   |

### Implementation Pattern

Each interactive component applies these states consistently:

```tsx
<button
  className={cn(
    "transition-colors duration-100 ease-out", // Base transition
    "hover:bg-surface-hover", // Hover state
    "active:scale-97", // Active state
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", // Focus
    "disabled:opacity-50 disabled:cursor-not-allowed", // Disabled
    className,
  )}
/>
```

### State Rules

1. **Use `focus-visible` for focus rings, not `focus`.** `focus-visible` applies the ring only when the element receives focus via keyboard, not via mouse click. This prevents the focus ring from appearing on every click.
2. **All interactive elements have all four states.** Every clickable, focusable, or interactive element must implement hover, active, focus, and disabled states.
3. **Disabled elements are not focusable.** Disabled elements use `aria-disabled="true"` (not the HTML `disabled` attribute) when they need to remain focusable for screen readers. Use `disabled` HTML attribute when the element should not receive focus at all.
4. **Hover transitions use 100ms ease-out.** All hover transitions share the same timing for consistency.
5. **Touch targets meet 44×44px minimum.** WCAG 2.5.8 requires minimum touch targets. All interactive elements meet this requirement.

### Focus Ring Specification

| Element   | Ring Width | Ring Color     | Ring Offset | Radius                |
| --------- | ---------- | -------------- | ----------- | --------------------- |
| Button    | 2px        | `--color-ring` | 2px         | Inherited from button |
| Input     | 2px        | `--color-ring` | 2px         | `rounded-sm`          |
| Link      | 2px        | `--color-ring` | 2px         | None                  |
| Select    | 2px        | `--color-ring` | 2px         | `rounded-sm`          |
| Checkbox  | 2px        | `--color-ring` | 2px         | `rounded`             |
| Radio     | 2px        | `--color-ring` | 2px         | `rounded-full`        |
| Menu item | 2px        | `--color-ring` | 2px         | `rounded-md`          |

### Trade-offs

- _`focus-visible` over `focus`_ prevents focus rings on mouse click but may confuse users who expect focus rings on click. WCAG 2.4.7 does not require focus rings on click.
- _Disabled opacity_ (50%) is the simplest disabled indicator but may not meet contrast requirements for some background colors. The 50% opacity provides sufficient differentiation.

### Industry Best Practice

`focus-visible` is the recommended approach for focus rings across modern web applications. Four-state interactive systems are universal. Shadcn/ui, Radix UI, and Tailwind UI all follow this pattern.

### Recommendation

Implement the four-state interactive system across all interactive components. Use `focus-visible` for focus rings. Maintain consistent timing (100ms ease-out) for all hover transitions. Enforce 44×44px minimum touch targets.

---

## 26. Feedback and State Styling

### Purpose

Define how feedback elements (toasts, alerts, notifications, empty states, loading states, error states) are styled consistently.

### Recommended Option

**Five-category feedback system with consistent visual language.**

### Feedback Categories

| Category    | Background            | Border                  | Icon          | Purpose                            |
| ----------- | --------------------- | ----------------------- | ------------- | ---------------------------------- |
| **Success** | `bg-success/10`       | `border-success`        | CheckCircle   | Positive outcome, completed action |
| **Warning** | `bg-warning/10`       | `border-warning`        | AlertTriangle | Caution, attention needed          |
| **Danger**  | `bg-danger/10`        | `border-danger`         | XCircle       | Error, destructive outcome         |
| **Info**    | `bg-accent/10`        | `border-accent`         | Info          | General information, update        |
| **Neutral** | `bg-surface-elevated` | `border-border-default` | None          | Non-semantic toast/message         |

### Toast/Sonner Styling

The project uses `sonner` (already installed) for toast notifications. Sonner provides built-in styling that integrates with the design system:

- **Success:** Green accent
- **Error:** Red accent
- **Info:** Blue accent
- **Loading:** Blue accent with spinner
- **Rich:** Custom-styled with action buttons

Sonner's `richColors` prop (already enabled in the root layout) provides semantic coloring. Custom toast content uses the feedback category styling.

### Alert Styling

| Part              | Styling                                             |
| ----------------- | --------------------------------------------------- |
| Alert container   | `rounded-lg border p-4`                             |
| Alert (default)   | Semantic border + background per category           |
| Alert title       | `text-sm font-semibold text-text-primary`           |
| Alert description | `text-sm text-text-secondary mt-1`                  |
| Alert icon        | `w-4 h-4 mr-3 flex-shrink-0` (colored per category) |
| Alert action      | Standard button, minimal variant                    |

### Empty State Styling

| Part        | Styling                                                 |
| ----------- | ------------------------------------------------------- |
| Container   | `flex flex-col items-center justify-center py-16 px-4`  |
| Icon        | `w-12 h-12 text-text-muted mb-4`                        |
| Title       | `text-lg font-semibold text-text-primary mb-2`          |
| Description | `text-sm text-text-secondary text-center max-w-sm mb-6` |
| Action      | Standard button                                         |

### Loading State Styling

| Pattern          | Implementation                                | When to Use                        |
| ---------------- | --------------------------------------------- | ---------------------------------- |
| **Skeleton**     | Animated placeholder matching component shape | Component-specific loading         |
| **Spinner**      | Rotating circle indicator                     | Button loading, form submission    |
| **Progress bar** | Horizontal progress indicator                 | Multi-step processes, file uploads |
| **Overlay**      | Semi-transparent overlay with spinner         | Full-section loading               |

### Skeleton Animation

```css
/* Already defined in globals.css */
@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.skeleton {
  @apply animate-skeleton rounded-md bg-surface-hover;
}
```

### Feedback Rules

1. **One feedback type per surface.** A toast notification should not contain an alert. An alert should not contain a toast.
2. **Feedback is dismissible.** All feedback that appears on top of content (toasts, notifications, banners) must be dismissible by the user.
3. **Inline feedback for form validation.** Form validation errors appear inline (below the input), not in toasts or alerts.
4. **System-level feedback in toasts.** Server-side success/error messages (e.g., "Profile updated successfully") appear as toasts, not inline.
5. **Critical feedback in alerts.** Destructive actions, warnings, and information that requires user action appear as alerts (inline or dialog), not toasts.

### Trade-offs

- _Five-category feedback system_ covers all common scenarios but adds complexity for neutral/non-semantic notifications.
- _Sonner for toasts_ provides a consistent toast experience with minimal configuration but has limited customization. The trade-off (less customizability for less code) is acceptable.

### Industry Best Practice

Category-based feedback systems with consistent visual language are standard (Material Design uses success/warning/error/info, Shopify uses success/warning/critical/info). Toast libraries (sonner, react-hot-toast) provide performant, accessible toast experiences.

### Recommendation

Implement the five-category feedback system. Use Sonner for toasts (already configured). Use inline alerts for form and page-level feedback. Use semantic category tokens for colored backgrounds, borders, and icons.

---

## 27. Accessibility Styling

### Purpose

Define the complete accessibility styling strategy — WCAG compliance, focus visibility, color contrast, reduced motion, screen reader considerations, and touch targets.

### Engineering Rationale

Accessibility is not a feature — it is a fundamental requirement. Every styling decision must be validated against WCAG 2.2 AA standards. The styling layer must bake accessibility into every component rather than treating it as an afterthought.

### Recommended Option

**Accessibility-by-default with automated enforcement.**

### WCAG 2.2 Compliance Targets

| Criterion                    | Level | Styling Impact                                         |
| ---------------------------- | ----- | ------------------------------------------------------ |
| 1.4.1 Use of Color           | AA    | Color is never the sole means of conveying information |
| 1.4.3 Contrast (Normal Text) | AA    | 4.5:1 minimum contrast ratio                           |
| 1.4.3 Contrast (Large Text)  | AA    | 3:1 minimum contrast ratio                             |
| 1.4.11 Non-text Contrast     | AA    | 3:1 minimum for UI components and graphical objects    |
| 1.4.12 Text Spacing          | AA    | No loss of content when text spacing is overridden     |
| 2.4.7 Focus Visible          | AA    | All interactive elements have visible focus indicators |
| 2.5.8 Target Size            | AA    | Minimum 44×44px touch targets                          |
| 2.5.3 Label in Name          | AA    | Accessible name matches visible label                  |
| 3.2.1 On Focus               | AA    | No unexpected context change on focus                  |
| 3.3.2 Labels or Instructions | AA    | Labels are provided for all inputs                     |

### Color Contrast Rules

1. **All text meets 4.5:1 contrast ratio.** This applies to body text, labels, placeholders — every text element.
2. **Large text (18px+ or 14px+ bold) meets 3:1 contrast ratio.** Section headings, large labels, emphasized text.
3. **Interactive element borders meet 3:1 contrast ratio.** Input borders, focus rings, button outlines.
4. **Decorative elements (non-interactive, non-informative) have no contrast requirement.** Background patterns, non-essential icons.
5. **Disabled text meets 3:1 contrast ratio.** Disabled elements must still be legible.

### Contrast Validation

| Tool                              | Usage                          | Frequency                 |
| --------------------------------- | ------------------------------ | ------------------------- |
| **Axe DevTools**                  | Automated accessibility audit  | Every PR                  |
| **Lighthouse**                    | Accessibility score validation | Every build               |
| **Manual color contrast checker** | New color combinations         | When new colors are added |
| **Storybook a11y addon**          | Component-level accessibility  | Every component story     |

The Storybook a11y addon (`@storybook/addon-a11y`, already installed) provides component-level contrast checking within Storybook.

### Focus Visibility Rules

1. **All interactive elements have a visible focus indicator.** Buttons, links, inputs, selects, checkboxes, radios, menu items, tabs — every focusable element.
2. **Focus indicator is a 2px ring with 2px offset.** `ring-2 ring-ring ring-offset-2` is the standard focus indicator.
3. **Focus indicator has 3:1 contrast against the background.** The `--ring` color must pass this contrast ratio.
4. **Use `focus-visible` for mouse users.** Focus rings appear only for keyboard focus (`:focus-visible`), not mouse clicks (`:focus`).
5. **Custom focus indicators for non-standard elements.** Elements that cannot use the ring pattern (e.g., custom select options) implement custom focus indicators that meet the same visibility standard.

### Screen Reader Styling

| Pattern                | Implementation                                     | When to Use                                                  |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| **`sr-only`**          | `position: absolute; width: 1px; height: 1px; ...` | Visually hidden but screen-reader-accessible content         |
| **`aria-label`**       | HTML attribute                                     | Elements without visible labels (icon-only buttons)          |
| **`aria-describedby`** | HTML attribute                                     | Additional description for an element (e.g., error messages) |
| **`aria-live`**        | HTML attribute                                     | Dynamic content updates that should be announced             |
| **`role`**             | HTML attribute                                     | Non-semantic elements that need a semantic role              |

### Reduced Motion

Already implemented in `globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This rule must never be removed or modified without accessibility review.

### Additional Reduced Motion Rules

1. **No auto-playing animations.** Carousels, sliders, and auto-advancing content must not animate automatically.
2. **Parallax effects require reduced motion check.** Any scroll-based animation must check `prefers-reduced-motion` and disable itself.
3. **Motion design is layered, not essential.** No information is conveyed exclusively through motion.
4. **Skeleton animations respect reduced motion.** The skeleton pulse animation is disabled in reduced motion mode (already handled by the global rule).

### High Contrast Support

1. **`prefers-contrast: more` media query.** The system should define high-contrast overrides for users who prefer increased contrast.
2. **High-contrast overrides increase border widths and strengthen color differences.** For example, `--border-width-default` becomes 2px, and muted text becomes more opaque.
3. **`forced-colors: active` media query.** Windows High Contrast Mode is supported through the `forced-colors` media query. The system ensures that no information is conveyed through color alone.

### Touch Target Rules

1. **All interactive elements have a minimum touch target of 44×44px** (WCAG 2.5.8).
2. **Smaller visual elements (icon buttons, close buttons) use invisible touch extension.** `p-2` or `m-2` on the container expands the touch area without changing visual size.
3. **Touch targets are consistent across breakpoints.** A button that is 44px on desktop remains 44px on mobile.

### Accessibility Testing

| Test                 | Tool                                        | Frequency             |
| -------------------- | ------------------------------------------- | --------------------- |
| Automated a11y audit | Axe DevTools + `@storybook/addon-a11y`      | Every component story |
| Color contrast check | Axe / manual                                | Every new color token |
| Keyboard navigation  | Manual testing                              | Every route           |
| Screen reader test   | VoiceOver (macOS) / NVDA (Windows)          | Every feature         |
| Reduced motion test  | Browser DevTools → Reduced Motion emulation | Every animation       |

### Trade-offs

- _`focus-visible` over `focus`_ prevents focus rings on mouse click, which some users appreciate for visual feedback. The WCAG standard only requires focus rings for keyboard focus.
- _Touch target expansion_ may increase spacing between elements, reducing information density. This is acceptable — accessibility takes precedence over density.
- _High contrast support_ adds CSS complexity for a small percentage of users. The trade-off is necessary for WCAG compliance and inclusive design.

### Industry Best Practice

WCAG 2.2 AA is the industry-standard accessibility target. The `focus-visible` pattern, touch target minimums, and reduced motion support are all WCAG requirements. Automated accessibility testing is standard in CI pipelines.

### Recommendation

Implement every rule in this section. Accessibility is non-negotiable. Use the Storybook a11y addon for automated component-level testing. Ensure all interactive elements meet touch target minimums, focus visibility requirements, and contrast ratios.

---

## 28. Print Styling Strategy

### Purpose

Define how the application renders for printing — what is hidden, what is adjusted, and how the layout changes.

### Engineering Rationale

Users print pages for record-keeping, offline reading, and sharing. A well-designed print layout ensures the printed version is useful, readable, and professional.

### Recommended Option

**Minimal print override that hides interactive elements and preserves content.**

### Print Style Rules

```css
@media print {
  /* Hide non-essential elements */
  nav,
  .sidebar,
  .topbar,
  footer,
  button,
  .btn,
  [role="button"],
  .toast,
  .dropdown,
  .modal,
  .tooltip,
  .popover,
  iframe,
  video,
  audio {
    display: none !important;
  }

  /* Expand content for readability */
  body {
    font-size: 12pt;
    line-height: 1.5;
    color: #000;
    background: #fff;
  }

  /* Ensure links show their URL */
  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: #666;
  }

  /* Adjust page breaks */
  h1,
  h2,
  h3,
  h4 {
    page-break-after: avoid;
  }

  p,
  li {
    orphans: 3;
    widows: 3;
  }
}
```

### What is Printed

| Element       | Print Behavior                       |
| ------------- | ------------------------------------ |
| Page content  | All visible text content             |
| Data tables   | Full tables with all rows            |
| Cards         | Content preserved, border visible    |
| Images        | Included (unless decorative)         |
| Links         | HREF shown in parentheses after text |
| Charts/Graphs | Included as rendered (static)        |

### What is Not Printed

| Element                                 | Reason                               |
| --------------------------------------- | ------------------------------------ |
| Navigation (sidebar, topbar)            | Not useful in print                  |
| Interactive elements (buttons, toggles) | Not functional in print              |
| Toasts, notifications                   | Ephemeral, not content               |
| Modals, popovers                        | Overlay content not part of the page |
| Videos, audio players                   | Not printable                        |
| Scrollable containers                   | Expand rather than clip              |

### Print Rules

1. **Black text on white background.** Remove all theme colors. Print renders in grayscale.
2. **Full width content.** Remove `max-width` constraints to use the full page width.
3. **Visible link URLs.** Every link shows its destination URL in parentheses.
4. **No background colors or images.** Backgrounds are set to `transparent` or `white` to save printer ink.
5. **URLs for page information.** Include the page title, URL, and print date in a print-only header or footer.

### Trade-offs

- _Full print override_ adds CSS complexity but ensures the printed version is useful.
- _Minimal print styles_ are simpler but may produce print output with non-functional interactive elements, hidden scrollable content, and broken layouts.

### Industry Best Practice

Print stylesheets are standard for content-heavy applications. The pattern of hiding interactive elements and showing link URLs is universal.

### Recommendation

Implement the print stylesheet as a `@media print` block in `globals.css`. Hide all non-functional elements. Show link URLs. Use black text on white background. Test print output for all primary page types.

---

## 29. RTL and Internationalization Styling

### Purpose

Define how the styling system supports right-to-left (RTL) languages and internationalization.

### Engineering Rationale

The application uses `next-intl` for internationalization. While the current language is English (India) — LTR — the styling system must be RTL-ready to support future languages like Arabic or Urdu.

### Recommended Option

**Logical CSS properties with `dir="rtl"` support.**

### RTL Strategy

The system uses logical CSS properties that automatically flip based on the document direction:

| Physical Property   | Logical Property       | RTL Behavior           |
| ------------------- | ---------------------- | ---------------------- |
| `left`              | `inset-inline-start`   | Flips to right         |
| `right`             | `inset-inline-end`     | Flips to left          |
| `margin-left`       | `margin-inline-start`  | Flips to margin-right  |
| `margin-right`      | `margin-inline-end`    | Flips to margin-left   |
| `padding-left`      | `padding-inline-start` | Flips to padding-right |
| `padding-right`     | `padding-inline-end`   | Flips to padding-left  |
| `border-left`       | `border-inline-start`  | Flips to border-right  |
| `border-right`      | `border-inline-end`    | Flips to border-left   |
| `text-align: left`  | `text-align: start`    | Flips to right         |
| `text-align: right` | `text-align: end`      | Flips to left          |

### Tailwind RTL Support

Tailwind CSS v4 provides RTL variants:

```tsx
// LTR: margin-right-2, RTL: margin-left-2
<div className="mr-2 rtl:ml-2" />

// Or using logical properties (preferred):
<div className="ms-2" />
```

Tailwind's logical property utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) automatically handle RTL.

### RTL Rules

1. **Use logical properties wherever possible.** `margin-inline-start` over `margin-left`, `padding-inline-end` over `padding-right`.
2. **Use Tailwind's logical utility variants.** `ms-2` (margin-inline-start) over `ml-2`.
3. **Text alignment uses `text-start` and `text-end`** rather than `text-left` and `text-right`.
4. **Flexbox and Grid handle RTL naturally.** `flex-row` and grid columns automatically reverse in RTL.
5. **Icons do not flip.** Directional icons (arrows, chevrons) are not mirrored in RTL. Only the layout direction changes.
6. **`dir` attribute on `<html>`** is set by `next-intl` based on the current locale.

### RTL Testing

| Test             | Method                                        |
| ---------------- | --------------------------------------------- |
| Layout direction | Set `dir="rtl"` on `<html>` and verify layout |
| Text alignment   | Verify `text-start` and `text-end` behavior   |
| Icon position    | Verify icons remain in correct position       |
| Form layout      | Verify inputs, labels, and validation in RTL  |
| Nav order        | Verify sidebar and navigation in RTL          |
| Margin/padding   | Verify spacing utilities flip correctly       |

### Trade-offs

- _Logical properties_ are more verbose and less familiar to developers but provide automatic RTL support.
- _Physical properties + `rtl:` variant_ is more explicit and familiar but requires every RTL-affected property to have an `rtl:` override.
- _Hybrid approach_ (logical where natural, physical + rtl: variant where needed) balances readability with RTL support.

### Industry Best Practice

Logical CSS properties are the W3C-recommended approach for internationalization. Tailwind's logical utility classes (`ms-*`, `me-*`, `ps-*`, `pe-*`) provide ergonomic access to logical properties.

### Recommendation

Use Tailwind's logical property utilities in new components. For existing components, add `rtl:` variants as needed. Verify RTL rendering with a test locale before adding RTL language support.

---

## 30. Styling Performance

### Purpose

Define performance considerations for the styling system — bundle size, critical CSS, rendering performance, and optimization strategies.

### Engineering Rationale

CSS bundle size, style recalculation costs, and animation performance directly impact user experience. An well-designed styling system considers performance from the architecture level.

### Recommended Option

**Tailwind CSS v4 JIT with minimal custom CSS.**

### Bundle Size Optimization

| Strategy                                         | Impact                                                           |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| **Tailwind JIT** generates only used CSS classes | Eliminates unused utility CSS                                    |
| **No custom CSS files**                          | Only Tailwind-generated CSS + token definitions in `globals.css` |
| **Semantic tokens as CSS variables**             | Minimal bytes per variable, shared across all components         |
| **No CSS-in-JS runtime**                         | Zero runtime JavaScript for styling                              |
| **Minimal `@layer` custom CSS**                  | Reduces custom CSS to < 5% of total stylesheet                   |

### Critical CSS Strategy

For initial page load:

1. **Tailwind's JIT generates CSS for all discovered classes at build time.** Since this is an application (not a content site), critical CSS extraction is less impactful — most components are already used on initial routes.
2. **Inline critical CSS for above-the-fold content.** If needed, extract critical CSS for the first-load viewport and inline it in `<head>`.
3. **Preload the font CSS** (Geist variables) as a `<link rel="preload">` to avoid FOIT (Flash of Invisible Text).

### Rendering Performance

| Concern                   | Mitigation                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Style recalculation**   | Minimize deep selector nesting (avoid)                                                                     |
| **Layout thrashing**      | Avoid JavaScript-triggered style reads after writes                                                        |
| **Animation performance** | Use `transform` and `opacity` for animations (GPU-composited)                                              |
| **Paint complexity**      | Avoid box-shadows on elements that animate (use `filter: drop-shadow()` instead)                           |
| **CSS variable access**   | CSS variable access (`var(--token)`) does not cause recalculations — it is resolved at computed value time |

### Performance Rules

1. **No CSS-in-JS runtime.** Styled-components, Emotion, and other runtime CSS-in-JS libraries add JavaScript bundle size and runtime cost. The system uses Tailwind utilities (zero runtime) exclusively.
2. **No `@apply` directives.** `@apply` in Tailwind v3 duplicated styles; in v4 it is deprecated. Use utility composition instead.
3. **No deep selector nesting.** CSS selector specificity should never exceed 0-2-0. Deep nesting in preprocessors causes unnecessary specificity.
4. **Animations on `transform` and `opacity` only.** Layout-triggering properties (`width`, `height`, `top`, `left`, `margin`, `padding`) are never animated.
5. **Prefer CSS transitions over JavaScript animation libraries.** CSS transitions are GPU-accelerated and have no JavaScript overhead.

### Performance Budgets

| Metric                         | Target                    |
| ------------------------------ | ------------------------- |
| CSS bundle size (uncompressed) | < 100KB for initial route |
| CSS bundle size (gzipped)      | < 15KB for initial route  |
| Style recalculation time       | < 5ms per interaction     |
| Animation frame rate           | 60fps for all animations  |
| First Contentful Paint         | < 1.5s                    |
| Lighthouse Performance score   | > 90                      |

### Trade-offs

- _No CSS-in-JS_ means no runtime dynamic styling. Dynamic styling must use CSS variables or inline `style` props. This is a minor ergonomic cost for significant performance benefit.
- _Tailwind JIT_ generates CSS at build time, which means newly added utility classes (from a new component) require a rebuild. In development, JIT generates on-demand with no delay.

### Industry Best Practice

Tailwind CSS v4's JIT compilation is the current best practice for CSS performance. Zero-runtime styling (Tailwind, vanilla CSS, CSS modules) outperforms runtime CSS-in-JS in all performance metrics. Animations on `transform` and `opacity` only is the standard GPU-composited animation pattern.

### Recommendation

Stay with Tailwind JIT (zero runtime CSS). Do not introduce CSS-in-JS. Animate only `transform` and `opacity`. Maintain the performance budget targets. Use Lighthouse performance scores as a CI gate.

---

## 31. Styling Governance

### Purpose

Define the governance model for the styling system — who owns it, how changes are reviewed, how consistency is enforced, and how the system evolves.

### Engineering Rationale

A design system without governance will degrade over time. Developers add new colors, new spacing values, new component variants — and the system fragments. Governance prevents this degradation.

### Recommended Option

**Centralized ownership with distributed contribution.**

### Ownership Model

| Role                                  | Responsibility                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Design System Owner** (1 person)    | Owns `globals.css`, token definitions, theme system, and design system documentation. Reviews all changes to the styling layer. |
| **Design System Contributors** (team) | Propose new tokens, variants, and patterns. Contribute component styling within their feature.                                  |
| **All Developers**                    | Use the design system. File issues for gaps and inconsistencies.                                                                |

### Styling Review Checklist

Every PR that includes styling changes must pass this checklist:

1. **Token compliance:** Does the styling use existing tokens? Are any new raw values introduced?
2. **Semantic usage:** Are semantic tokens used instead of raw tokens?
3. **No new CSS files:** Is all styling applied through Tailwind utilities in JSX?
4. **Theme support:** Does the styling work in both light and dark themes?
5. **Accessibility:** Do colors pass 4.5:1 contrast? Are focus indicators present? Is reduced motion respected?
6. **Responsive:** Does the styling work at all breakpoints?
7. **Consistency:** Does the styling match existing patterns for similar components?
8. **Performance:** Are animations on `transform`/`opacity` only? Is there any CSS-in-JS runtime?
9. **No `@apply`:** Is `@apply` avoided in favor of utility composition?
10. **No raw values:** Are all colors, spacing, typography values drawn from tokens?

### Consistency Enforcement

| Mechanism                       | Enforcement                                                                               |
| ------------------------------- | ----------------------------------------------------------------------------------------- |
| **ESLint plugin**               | `eslint-plugin-tailwindcss` enforces consistent class ordering and detects unused classes |
| **Biome check**                 | `biome check --write` ensures formatting consistency                                      |
| **Prettier**                    | Automatic formatting prevents class string formatting drift                               |
| **Code review**                 | The styling review checklist is applied in every PR                                       |
| **Design system documentation** | Documented patterns provide reference for consistent implementation                       |

### Deprecation Strategy

When a token or pattern becomes obsolete:

1. **Deprecate:** Mark the token as deprecated in the design system documentation with a migration path.
2. **Keep:** Keep the token in `globals.css` for one release cycle (no breaking changes).
3. **Remove:** Remove the token after two release cycles. Update all consumers.

```css
/* Deprecated token with comment */
--color-surface-old: var(
  --color-zinc-100
); /* DEPRECATED: Use --color-surface-card instead. Remove in v0.3.0 */
```

### Versioning Strategy

| Change Type                                                                 | Version Bump | Example                                                      |
| --------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------ |
| **Breaking** (token removal, value change that affects existing components) | Major        | Removing a token, changing a token value consumers depend on |
| **Non-breaking** (new token, new variant, new component)                    | Minor        | Adding a new semantic token                                  |
| **Patch** (documentation, bug fix)                                          | Patch        | Fixing a typo in the design system docs                      |

The design system version is tracked separately from the application version.

### Migration Strategy

When a token value changes:

1. Bump the token's version in the deprecation annotation.
2. Update the `globals.css` definition.
3. All components that consume the token automatically receive the new value (no code changes needed).
4. If the token is renamed, keep the old token as a deprecated alias for one release cycle.

### Contribution Guidelines

To propose a new token:

1. Document the use case and frequency of the proposed token.
2. Show examples of how it would be used across 3+ components.
3. Map it to an existing raw palette value (no new raw values without design review).
4. Submit the proposal as an ADR or design system issue.
5. The Design System Owner approves or rejects within one sprint.

To propose a new component variant:

1. Show that the variant cannot be achieved through compositing existing tokens.
2. Show that the variant is needed in 3+ contexts.
3. Submit the proposal with before/after examples.

### Trade-offs

- _Centralized ownership_ ensures consistency but creates a bottleneck for styling changes. The bottleneck is acceptable — styling changes should be the exception, not the norm.
- _Stringent deprecation process_ (two release cycles) slows down cleanup but prevents breaking changes for consumers who update infrequently.

### Industry Best Practice

Centralized design system ownership with distributed contribution is the standard model (Shopify, Atlassian, GitHub all follow this pattern). Two-release-cycle deprecation is standard for enterprise design systems.

### Recommendation

Implement the governance model described above. Appoint a Design System Owner. Enforce the styling review checklist in every PR. Use deprecation annotations for obsolete tokens. Track design system versions independently from application versions.

---

## Engineering Review Summary

### Architecture Analysis

The design system architecture follows a strict layered approach: global raw tokens → semantic alias tokens → component-scoped tokens. This three-tier architecture provides maximum flexibility for theme switching, white-labeling, and future evolution while maintaining a single source of truth for all visual values.

**Strengths:**

- Clear ownership boundaries between global, semantic, and component tokens
- Theme switching requires no component code changes
- White-labeling requires only semantic token overrides
- Tailwind CSS v4 `@theme inline` provides native token-to-utility mapping

**Risks:**

- Three-tier token architecture requires team training and discipline
- Without governance, tokens will proliferate beyond the constrained palette
- Migration from hardcoded utility classes to semantic utilities requires coordinated refactoring

### Design System Maturity Assessment

| Dimension          | Current State (Stage 7)             | Target State (Stage 8)                     |
| ------------------ | ----------------------------------- | ------------------------------------------ |
| Token architecture | Raw tokens in `:root` + `.dark`     | Three-tier (global → semantic → component) |
| Semantic tokens    | None — components use raw utilities | Full semantic token system                 |
| Theme support      | Light/dark                          | Light/dark + extensible for future         |
| Variant system     | Ad hoc (each component defines own) | Six-axis universal variant system          |
| Component styling  | Hardcoded Tailwind classes          | Semantic token utilities                   |
| Accessibility      | Reduced motion only                 | Full WCAG 2.2 AA compliance                |
| Governance         | None                                | Centralized ownership + review checklist   |

### Accessibility Review

| Area                | Status                                                | Action Required                                              |
| ------------------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| Color contrast      | Partially met (existing token colors need validation) | Audit all semantic token pairs for 4.5:1 contrast            |
| Focus indicators    | Not implemented in most components                    | Add `focus-visible:ring-2` to all interactive components     |
| Reduced motion      | Implemented in `globals.css`                          | Maintain and never remove                                    |
| Touch targets       | Not validated                                         | Audit all interactive elements for 44×44px minimum           |
| Screen reader       | Not validated                                         | Add `aria-label`, `aria-describedby`, `sr-only` where needed |
| Keyboard navigation | Not validated                                         | Ensure all interactive elements are keyboard-accessible      |

### Scalability Analysis

The system is designed for scale:

- **3-tier tokens** support unlimited component growth without token proliferation
- **6-axis variant system** is extensible (new values can be added to any axis without breaking changes)
- **CSS variable theming** supports unlimited themes with zero component changes
- **Tailwind JIT** generates only used CSS regardless of codebase size
- **Centralized governance** prevents the accumulation of visual debt at scale

The primary scalability risk is token governance — without active oversight, the palette will grow beyond the constrained set.

### Maintainability Analysis

| Factor               | Assessment                                                             |
| -------------------- | ---------------------------------------------------------------------- |
| Global CSS file size | Stays small — token definitions only                                   |
| Component styling    | Visible in JSX as Tailwind classes — no separate CSS files to maintain |
| Token changes        | One change in `globals.css` affects all consumers                      |
| New components       | Follow existing patterns — no new styling decisions needed             |
| New themes           | Add a CSS class with token overrides — no component changes            |
| Deprecation          | Tokens with deprecation annotations provide clear migration paths      |

### Performance Considerations

| Metric                | Current State          | Optimization                          |
| --------------------- | ---------------------- | ------------------------------------- |
| CSS bundle            | Tailwind JIT (minimal) | Maintain zero-runtime CSS             |
| Style recalculation   | Not measured           | Minimize with shallow selectors       |
| Animation performance | Not validated          | Use `transform`/`opacity` only        |
| Critical CSS          | Not implemented        | Preload Geist fonts                   |
| Layout shifts         | Not measured           | Ensure consistent skeleton dimensions |

### Future Expansion Recommendations

1. **High-contrast theme** — Add a `.high-contrast` theme class with strengthened color differences and increased border widths.
2. **Container query support** — When container queries reach broader production use, refactor component styling to use container-relative units.
3. **Design token export** — Generate JSON token exports for design tool integration (Figma tokens plugin).
4. **Component styling tokens** — As the component library grows, extract component-level styling tokens into a separate CSS file (`components.css`) for better organization, while maintaining the single-entry-point principle.
5. **Automated token validation** — Implement a CI step that validates all CSS variables used in the codebase exist as tokens, preventing token drift.
6. **Typography system expansion** — If content types diversify (long-form articles, documentation), add a prose/typography scale for rich text content.

---

This specification completes Stage 8 — Design System & Styling Layer. It is implementation-independent and provides a complete visual language architecture for the application. The next stage (Stage 9 — Shared Component Layer) will implement the UI primitives that realize this design system as code.
