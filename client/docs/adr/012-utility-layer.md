# Stage 12 — Utility Architecture Layer Specification

**Status:** Implemented
**Dependencies:** Stage 10 (Type System Layer), Stage 11 (Constants & Configuration Layer)
**Next:** Stage 13 (Data / API Layer)

---

## Table of Contents

1. Utility Philosophy
2. Utility Architecture
3. Utility Classification
4. Utility Characteristics
5. Utility Ownership
6. Utility Lifecycle
7. Utility Boundaries
8. Dependency Rules
9. Promotion Rules
10. Demotion Rules
11. Naming Convention
12. Folder Organization Principles
13. Generic Utility Strategy
14. Shared Utility Strategy
15. Feature Utility Strategy
16. Pure Function Strategy
17. Side Effect Rules
18. Immutability Guidelines
19. Data Transformation Utilities
20. Formatting Utilities
21. Parsing Utilities
22. Serialization Utilities
23. Deserialization Utilities
24. Date & Time Utilities
25. String Utilities
26. Number Utilities
27. Array Utilities
28. Object Utilities
29. Collection Utilities
30. URL Utilities
31. Query Parameter Utilities
32. Search Utilities
33. Filter Utilities
34. Sorting Utilities
35. Pagination Utilities
36. Validation Helpers
37. Comparison Utilities
38. Equality Utilities
39. Normalization Utilities
40. Mapping Utilities
41. Conversion Utilities
42. Generator Utilities
43. Randomization Utilities
44. Identifier Utilities
45. File Utilities
46. Clipboard Utilities
47. Browser Utilities
48. Storage Utilities
49. Performance Utilities
50. Memoization Helpers
51. Async Utilities
52. Promise Utilities
53. Retry Helpers
54. Debounce & Throttle Strategy
55. Error Utilities
56. Logging Helpers
57. Security Helpers
58. Accessibility Helpers
59. Internationalization Helpers
60. Feature-specific Utilities
61. Shared Utilities
62. Testing Utilities
63. Mock Utilities
64. Documentation Strategy
65. Governance Strategy
66. Deprecation Strategy
67. Versioning Strategy
68. Performance Considerations
69. Maintainability
70. Scalability
71. Best Practices
72. Engineering Review


---

## 1. Utility Philosophy

### Purpose

Define the fundamental nature of a Utility in the application � what it is, what it is not, and how it differs from Business Logic, Services, Hooks, and Components.

### Engineering Rationale

The current codebase has no formal utility layer. Logic is scattered across:

- src/lib/utils.ts � contains only cn() (CSS class merging).
- src/lib/route-protection.ts � a mix of route classification logic + authorization logic (business concern).
- src/lib/data/ � data access functions that are more API layer than utility.
- Inline in components: date formatting, permission checks, URL construction, string manipulation.
- Feature _components/: sorting, filtering, search logic embedded inside JSX.

This scattering creates:

- **Duplication** � date formatting is written 6+ ways across features.
- **Low testability** � logic embedded in components cannot be unit-tested independently.
- **High coupling** � changing a format string requires touching every file that formats that value.
- **No discovery** � developers cannot find whether a utility already exists.

### Recommended Option

**A Utility is a stateless, deterministic, side-effect-free function that operates on input and returns output without knowledge of the application domain.**

The litmus test for a Utility:

`
Is this function independently testable without mocking, without setup, without React, and without a server?
|
+- Yes ? It is a Utility candidate.
+- No, because it depends on React hooks ? It is a Hook.
+- No, because it depends on application state ? It is State Logic.
+- No, because it depends on API calls ? It is a Service / Data Access function.
+- No, because it encodes business rules ? It is Business Logic (Feature-level).
`

### Trade-offs

- *Rigid purity* � enforcing strict statelessness prevents utilities from using caches, memoization stores, or lazy initialization. Acceptable exceptions are documented in section 17.
- *Pragmatic impurity* � allowing side effects in utilities (logging, localStorage access, analytics) erodes the guarantee of testability but reduces indirection.

### Industry Best Practice

Lodash, Ramda, date-fns, and TypeScript's built-in utilities represent the industry standard for utility design: pure functions, immutable operations, composable interfaces. Google's Style Guide and the Vercel codebase both maintain @/lib/ as a pure-function directory with explicit side-effect boundaries.

### Recommendation

Treat Utilities as the **pure leaf layer** of the application. No utility may import a React module, access the DOM, read from localStorage, or call an API. Every utility must be testable by calling it with arguments and asserting on its return value.

---

## 2. Utility Architecture

### Purpose

Define where the Utility Layer sits in the architectural stack and how it interacts with all other layers.

### Engineering Rationale

Without explicit architectural positioning, utilities creep into every layer � feature components define inline utility functions, data functions grow formatting logic, hooks contain duplicated helper code. This violates separation of concerns and makes the utility layer undiscoverable.

### Recommended Option

**Utility Layer is a horizontal infrastructure layer.** Every layer above it may depend on it. It depends on nothing above it.

`
Pages / Layouts / Sections
         |
   Feature Layer
         |
   Shared Components
         |
     UI Primitives
         |
+---------------------+
|   Utility Layer     |  <- You are here
|  (stateless, pure)  |
+---------------------+
         |
   Constants Layer
         |
    Type System
`

The Utility Layer sits between UI/Feature layers and the Constants/Type layers. It imports from Constants and Types but never from Features, Components, Hooks, State, or Data layers.

### Trade-offs

- *Horizontal positioning* � utilities are globally available, which increases reuse but requires discipline to prevent feature-specific logic from leaking into shared utilities.
- *Vertical positioning* � feature-specific utilities (in _utils/) provide isolation but sacrifice discoverability and cross-feature reuse.

### Industry Best Practice

Stripe's frontend monolith organizes utilities as a @lib module with strict no-import-above rules enforced by ESLint. Shopify's Polaris separates utilities (pure) from services (impure) at the directory level.

### Recommendation

Two utility tiers:

1. **Shared Utilities** � src/lib/utils/<category>.ts � available to all features, zero domain knowledge.
2. **Feature Utilities** � src/features/<feature>/_utils/<utility>.ts � available to a single feature, may contain domain-aware transforms.

Shared utilities must pass the "could this exist in a different application?" test.

---

## 3. Utility Classification

### Purpose

Define the taxonomy of utility types � what categories exist, what each contains, and when each is appropriate.

### Engineering Rationale

Without classification, any function can land in any file. utils.ts becomes a dumping ground. Developers cannot predict where a utility lives.

### Recommended Option

**Twelve utility categories, each with a clear purpose and boundary.**

| Category | Purpose | Side Effects | Example |
|---|---|---|---|
| **Pure** | Stateless transformation of input to output | Never | capitalize(str), clamp(num, min, max) |
| **Formatting** | Convert internal representation to display string | Never | ormatDate(date, locale), ormatCurrency(n, currency) |
| **Transformation** | Convert data between shapes (map, filter, group) | Never | groupBy(arr, key), omit(obj, keys) |
| **Validation** | Check constraints and return boolean or errors | Never | isEmail(str), alidatePhone(str) |
| **Mathematical** | Numerical calculations, rounding, statistics | Never | oundTo(n, decimals), percentile(arr, p) |
| **Collection** | Array, Object, Map, Set operations | Never | uniqBy(arr, fn), sortBy(arr, key) |
| **Date** | Date arithmetic, comparison, range, formatting | Never | ddDays(d, n), isBetween(d, start, end) |
| **String** | Manipulation, parsing, encoding, sanitization | Never | 	runcate(str, len), slugify(str) |
| **Browser** | DOM, navigator, window, clipboard, storage | Required | copyToClipboard(text), getCookie(name) |
| **Security** | Sanitization, encoding, token helpers | Never | sanitizeHtml(str), ase64Encode(str) |
| **Testing** | Test doubles, factories, assertions | Never | createMockUser(overrides), ange(start, end) |
| **Performance** | Memoization, debounce, throttle, batching | Required* | memoize(fn), debounce(fn, ms) |

### Trade-offs

- *More categories* � increases discoverability but creates more files and import paths.
- *Fewer categories* � reduces ceremony but invites dumping-ground files.

### Industry Best Practice

date-fns has 200+ function modules (one function per file). Lodash groups by collection type. Ramda groups by arity. The industry leans toward **domain-grouped modules** (one file per concern) rather than one-function-per-file or one-giant-file.

### Recommendation

Group utilities into domain modules (string.ts, date.ts, collection.ts, etc.) with **at most 80 lines per file**. If a module exceeds 80 lines, split by subdomain (date/format.ts, date/parse.ts, date/arithmetic.ts).

---

## 4. Utility Characteristics

### Purpose

Define the invariant properties that every utility function must satisfy.

### Engineering Rationale

Without a shared understanding of "what makes a good utility," developers write utilities with hidden state, implicit dependencies, or mutable inputs. These violate the contract of the layer and create subtle bugs.

### Recommended Option

**Seven invariant characteristics of every utility:**

1. **Stateless** � No internal mutable state between calls. No module-level variables modified during execution. No class instances with state.

2. **Deterministic** � Given the same input, always returns the same output. No randomness (unless randomness is the explicit purpose � see andomization.ts).

3. **Side-effect-free** � Does not mutate its arguments. Does not write to disk, localStorage, cookies, or the DOM. Does not log (except in debug utilities). Does not make network requests.

4. **Generic where possible** � Operates on types, not business concepts. Accepts T rather than User. Uses type parameters rather than concrete domain types.

5. **Composable** � Output of one utility can be input to another. Uses consistent parameter ordering (data-first for collection operations, data-last for transformations).

6. **Small and focused** � One responsibility per function. A utility that does two things should be two utilities.

7. **Well-typed** � Full TypeScript type annotations with explicit return types. No ny, no s casts (except in type guards or branded type constructors).

### Trade-offs

- *Pure determinism* � prevents utilities from using Date.now(), crypto.randomUUID(), or performance.now(). These must be injected or wrapped in impure adapters.
- *Pure genericity* � prevents domain-aware formatting like ormatUserName(user: User). This belongs in the feature _utils/ tier where domain types are known.

### Industry Best Practice

Lodash and Ramda exemplify all seven characteristics. date-fns violates determinism only where necessary (like ormatDistanceToNow which takes a reference date as a parameter). The pattern is: **inject impure dependencies** rather than hiding them.

### Recommendation

Every shared utility function must satisfy all seven characteristics. Feature utilities may relax genericity (they know their domain) but must remain stateless, deterministic, and side-effect-free.

---

## 5. Utility Ownership

### Purpose

Define who owns each utility, where it lives, and how ownership is documented.

### Engineering Rationale

Without ownership, utilities become orphaned. No one maintains them. No one knows if they are still used. Dead utilities accumulate. Feature teams write duplicates because they don't know existing utilities exist � or don't trust them.

### Recommended Option

**Four-tier ownership model:**

| Tier | Location | Owner | Review Required | Documentation |
|---|---|---|---|---|
| **Global** | src/lib/utils/ | Architecture Team | 2 peer reviews | JSDoc + unit tests |
| **Shared** | src/lib/utils/ | Architecture Team | 2 peer reviews | JSDoc + unit tests |
| **Feature** | src/features/<feature>/_utils/ | Feature Team | 1 peer review | JSDoc + unit tests |
| **Component** | Inline in .tsx file | Author | Self-review | None |

**Ownership rules:**

- **Global utilities** � imported by all features. Must be framework-agnostic. Examples: cn(), isEmail(), slugify().
- **Shared utilities** � cross-feature patterns that are not generic enough for global. Examples: ormatDateForDisplay(), 	runcateWithEllipsis().
- **Feature utilities** � single-feature transforms. Examples: ormatAlumniName(user), calculateEventStatus(event).
- **Component utilities** � single-component logic too small to extract. These must not exceed 10 lines. If they reach 11 lines, extract to feature _utils/.

### Trade-offs

- *Four tiers* � clear ownership but requires more files and import paths.
- *Two tiers (global + inline)* � simpler but feature teams duplicate or hoist everything to global.

### Industry Best Practice

Nx monorepos use project-level utils/ with explicit project.json tags for ownership. Google's monorepo uses OWNERS files per directory. The pattern is: **nearest-owner principle** � the team closest to the utility owns it.

### Recommendation

Ownership is encoded in the directory. src/lib/utils/ is owned by architecture review. _utils/ inside a feature is owned by the feature team. The architecture team may veto any shared utility that duplicates an existing one.

---

## 6. Utility Lifecycle

### Purpose

Define the stages a utility passes through from creation to removal.

### Engineering Rationale

Utilities are created, used, superseded, and abandoned. Without lifecycle management, the codebase accumulates:

- "I think this is used somewhere" utilities that nobody removes.
- Three versions of the same utility (one per developer who didn't know the others existed).
- Utilities that were experimental but never cleaned up.

### Recommended Option

**Five-stage lifecycle:**

`
Proposal -> Active -> Deprecated -> Sunset -> Removed
`

| Stage | Meaning | Requirement | Duration |
|---|---|---|---|
| **Proposal** | Candidate utility, not yet approved | Issue + justification | N/A |
| **Active** | Approved, documented, tested | JSDoc + unit tests + usage in >=2 files | Until deprecated |
| **Deprecated** | Replaced or obsolete, still works | @deprecated JSDoc tag + migration guide | 2 release cycles (sprint-based) |
| **Sunset** | Still present, prints console warning | Console warning on import (dev only) | 1 release cycle |
| **Removed** | Deleted from codebase | Remove all imports first | Permanent |

**Trigger conditions for each stage:**

- **Proposal -> Active:** Function passes code review + has >=1 consumer.
- **Active -> Deprecated:** A better utility exists OR the use case is no longer valid.
- **Deprecated -> Sunset:** Two release cycles elapsed.
- **Sunset -> Removed:** One release cycle elapsed + no remaining imports.

### Trade-offs

- *Formal lifecycle* � adds process overhead for utility management but prevents dead code accumulation.
- *Informal lifecycle* � simpler but relies on developer discipline to clean up.

### Industry Best Practice

React's deprecation policy (warnings in one major version, removal in the next) and Lodash's gradual removal strategy (deprecate -> warn -> remove) both follow this pattern. ESLint's 
o-restricted-imports rule enables enforcement.

### Recommendation

Use @deprecated JSDoc tags with migration instructions. Configure ESLint 
o-restricted-imports to warn on deprecated utility imports after two release cycles. Remove the file after one more cycle with zero imports.

---

## 7. Utility Boundaries

### Purpose

Define the architectural boundary: what may enter a utility file, what may not, and how to prevent boundary violations.

### Engineering Rationale

The most common architectural violation in utility layers is importing business logic � a ormatUserDisplayName() utility that imports User from @/types/domain/user is acceptable in a feature _utils/ but not in shared src/lib/utils/. A utility that imports React, 
ext/navigation, or a data store is always a violation.

### Recommended Option

**Explicit import whitelist for shared utilities:**

Shared utilities in src/lib/utils/ may import ONLY from:

| Source | Allowed? | Notes |
|---|---|---|
| 	ypescript built-ins | Yes | string, 
umber, Record<K,V>, etc. |
| src/lib/utils/ | Yes | Sibling utilities (composition) |
| src/types/ | Yes | Type-only imports � no runtime dependency |
| src/constants/ | Yes | Constants are pure values |
| date-fns | Yes | Pure date library |
| lodash-es / amda | Yes | Pure collection libraries |
| clsx, 	ailwind-merge | Yes | Pure CSS utilities |
| eact | No | Creates framework coupling |
| 
ext/* | No | App Router coupling |
| src/hooks/ | No | Hook layer depends on React |
| src/stores/ | No | State layer has side effects |
| src/features/ | No | Feature layer has business logic |
| src/lib/data/ | No | Data layer has side effects |
| src/lib/mappers/ | No | Mappers import domain types |
| src/components/ | No | Component layer imports React |
| src/app/ | No | App layer is the entry point |

**Import whitelist for feature utilities:**

Feature utilities in src/features/<feature>/_utils/ may additionally import:

| Source | Allowed? | Notes |
|---|---|---|
| src/features/<feature>/_types/ | Yes | Feature's own types |
| src/features/<feature>/_constants/ | Yes | Feature's own constants |
| Other feature _utils/ | No | Cross-feature coupling |
| Other feature _types/ | No | Cross-feature type coupling |

### Trade-offs

- *Strict boundaries* � prevents architectural decay but requires discipline and tooling (ESLint boundaries plugin) to enforce.
- *Permissive boundaries* � faster development in the short term but guarantees architectural drift over time.

### Industry Best Practice

Nx's @nrwl/nx/enforce-module-boundaries ESLint rule enforces tag-based import restrictions. Shopify's eslint-plugin-boundaries enables directory-level rules. Both use the same principle: **explicit allowlists at directory boundaries**.

### Recommendation

Configure eslint-plugin-boundaries (or Nx module boundaries) to enforce two rules:

1. src/lib/utils/ may NOT import from src/features/, src/hooks/, src/stores/, src/lib/data/, eact, or 
ext/*.
2. src/features/*/_utils/ may NOT import from another feature's directory.

---

## 8. Dependency Rules

### Purpose

Define the complete dependency graph for the Utility Layer � what may depend on utilities and what utilities may depend on.

### Engineering Rationale

The utility layer sits in the middle of the architecture. Without explicit dependency rules, bidirectional dependencies form: utilities import from hooks (to get current user), hooks import from utilities (to format data), creating circular dependencies that are impossible to untangle.

### Recommended Option

**Strict unidirectional dependency graph:**

`
Application Code (pages, features, sections, components, hooks, stores, services)
                                    |
                    Shared Utilities (src/lib/utils/)
                                    |
                   Feature Utilities (src/features/*/_utils/)
                                    |
                     Constants (src/constants/)
                                    |
                       Types (src/types/)
`

**Rules:**

1. **Application -> Utilities.** Any application code may import any shared utility. Feature code may import its own feature utility.

2. **Shared -> Feature.** A shared utility may never import a feature utility. If a shared utility needs logic that exists only in a feature, the logic must be promoted (moved) to shared.

3. **Utilities -> React.** A utility may never import React. If it needs React (hooks, JSX, context), it is not a utility � it is a Hook or Component.

4. **Utilities -> State.** A utility may never import stores, contexts, or state. State must be passed as arguments.

5. **Utilities -> Data.** A utility may never import data access functions. Data must be passed as arguments.

6. **Feature Utility -> Other Feature.** A feature utility may never import from another feature's _utils/, _types/, or _constants/. If shared logic is needed, promote to src/lib/utils/.

7. **Circular dependency:** Zero tolerance across the utility layer. If A imports from B and B imports from A, one must be restructured.

**Enforcement mechanism:**

`
ESLint rule: "no-circular-imports" � error
ESLint rule: boundaries/no-import-from � shared utils may not match pattern "src/features/**"
ESLint rule: boundaries/no-import-from � feature utils may not match pattern "src/features/(?!current)/**"
`

### Trade-offs

- *Strict separation* � requires data to be threaded through arguments rather than accessed internally. More parameters but more testable.
- *Loose separation* � utilities can internally access context, state, or data. Less ceremony but untestable in isolation.

### Industry Best Practice

Google's internal style guide prohibits imports from "higher" layers in any direction. Clean Architecture enforces the dependency rule: dependencies point inward. Hexagonal Architecture isolates pure logic (domain) from impure infrastructure.

### Recommendation

Enforce all seven dependency rules with ESLint. No exceptions. A utility that needs data must accept it as a parameter. This is the single most important architectural constraint for maintaining testability.

---

## 9. Promotion Rules

### Purpose

Define when and how feature-level logic is promoted to shared utilities.

### Engineering Rationale

Utility promotion is the mechanism by which the application discovers shared patterns. Without explicit promotion rules, two outcomes occur:

- **Under-promotion:** The same logic is duplicated in 5+ features because no one extracts it.
- **Over-promotion:** Feature-specific logic is hoisted to shared utilities because it "might be useful" to others, creating coupling between unrelated features.

### Recommended Option

**Three-signal promotion rule:**

A feature utility is eligible for promotion to src/lib/utils/ when it satisfies ALL three signals:

| Signal | Condition | Evidence |
|---|---|---|
| **Replication** | The same logic exists in >=3 feature _utils/ directories | grep shows 3+ copies |
| **Domain-Neutrality** | The function can be described without referencing a business concept | Name contains no feature-specific terms |
| **Generic Typing** | The function uses type parameters rather than domain types | Signature uses <T> not Alumni |

**Promotion process:**

1. Create the shared version in src/lib/utils/<category>.ts.
2. Add @deprecated tag to all 3+ feature copies with migration note.
3. Update all callers inside the feature to import from the shared location.
4. After 2 release cycles, remove the deprecated feature-level copies.
5. If the feature-level copy has custom logic the shared version cannot support, keep it and note the difference in JSDoc.

**Promotion is NOT required for:**

- Functions used in only 1�2 features (stay in feature _utils/).
- Functions that reference domain-specific types or constants.
- Functions that would require multiple arguments to become generic (the feature needs the convenience overload).

### Trade-offs

- *Aggressive promotion (>=2 uses)* � maximizes reuse but risks premature abstraction.
- *Conservative promotion (>=5 uses)* � minimizes wrong abstractions but allows more duplication.

### Industry Best Practice

The **Rule of Three** from Refactoring (Fowler) and **Duplication is cheaper than the wrong abstraction** (Sandi Metz) establish the industry consensus: wait for 3 occurrences before extracting. This avoids the "extract too early -> wrong abstraction -> never fix it" trap.

### Recommendation

Promote at 3+ occurrences. Document each promotion as a 1-line entry in src/lib/utils/PROMOTIONS.md with the date, original location, and shared location for audit trail.

---

## 10. Demotion Rules

### Purpose

Define when and how shared utilities are demoted back to feature-level or removed.

### Engineering Rationale

Shared utilities can become too specific over time. A generic ormatDate acquires feature-specific format strings. A ilterCollection acquires business rules. When a shared utility accumulates feature-specific overloads, it has been co-opted and should be demoted.

### Recommended Option

**Three demotion signals:**

| Signal | Condition | Action |
|---|---|---|
| **Feature-Specific Overloads** | A shared utility has >=2 overloads that accept feature-specific types | Move those overloads to the feature _utils/ |
| **Business Logic Leak** | A shared utility's implementation references a business concept | Rewrite to accept the business value as a parameter, or demote |
| **Orphaned Utility** | A shared utility has 0 callers across the entire codebase | Deprecate -> remove |

**Demotion process:**

1. Identify the feature-specific overloads or business logic references.
2. Copy the feature-specific variants into the feature _utils/ (or each feature that needs it).
3. Remove the feature-specific overloads from the shared utility.
4. Mark the original shared utility with @deprecated if nothing remains, or keep the generic version if callers still use the generic signature.
5. After 2 release cycles, remove deprecated overloads.

**Demotion is NOT required when:**

- 1�2 features use a shared utility with the same arguments (it's still shared).
- The feature-specific overload is an optimization wrapper over the shared version (e.g., ormatAlumniDate = (d) => formatDate(d, 'PP')).
- The business logic is injected as a callback parameter (the utility stays generic by accepting a predicate/transformer).

### Trade-offs

- *Formal demotion* � keeps shared utilities clean but adds process friction.
- *Informal demotion* � shared utilities accumulate cruft until someone refactors them.

### Industry Best Practice

Lodash's decision to remain generic and never add business-specific overloads is the gold standard. When users need business-specific logic, they wrap Lodash in their own utilities rather than modifying Lodash.

### Recommendation

Prefer injection over demotion. If a shared utility needs feature-specific behavior, accept a callback parameter rather than a feature-specific type. Demote only when injection would make the API worse than the duplication.

---

## 11. Naming Convention

### Purpose

Define the naming rules for utility files, functions, directories, and test files.

### Engineering Rationale

Without naming conventions, utilities are named by developer preference � some use verbs (ormatDate), some use nouns (dateFormatter), some use abbreviations (mtDt). This makes discovery impossible and imports inconsistent.

### Recommended Option

| Element | Convention | Pattern | Examples |
|---|---|---|---|
| **Directory** | kebab-case | lib/utils/ | date/, string/ |
| **File** | camelCase.ts | lib/utils/<name>.ts | date.ts, string.ts |
| **Function** | camelCase | Verb or verb+noun | ormatDate, groupBy, isEmail |
| **Constant within utility** | SCREAMING_SNAKE_CASE | Exported const | DEFAULT_LOCALE, EMAIL_REGEX |
| **Type within utility** | PascalCase | Exported type | DateFormatOptions, Comparator<T> |
| **Test file** | <name>.test.ts | Colocated | date.test.ts, groupBy.test.ts |
| **Deprecated utility file** | _<name>.ts | Leading underscore | _sortBy.ts, _paginate.ts |

**Function naming rules:**

- **Predicates** � prefix with is, has, can: isValidEmail, hasProperty, canViewEvent.
- **Transformers** � verb prefix: ormatDate, 
ormalizeText, capitalize.
- **Accessors** � noun or get prefix: getNestedValue, urlParams.
- **Comparators** � suffix with Comparator: dateComparator, lphabeticalComparator.
- **Generators** � suffix with Generator or prefix with generate: idGenerator, generateSlug.

**File naming rules:**

- One domain per file: date.ts contains all date-related utilities.
- If a file exceeds 80 lines, split into subdirectory: date/format.ts, date/parse.ts, date/arithmetic.ts.
- Barrel index: each directory must have index.ts re-exporting all public functions.

### Trade-offs

- *Verb-first naming* (ormatDate) � searchable and predictable; all date utilities start with ormat, parse, is, get.
- *Noun-first naming* (dateFormatter) � objects-style but less grep-friendly.

### Industry Best Practice

date-fns uses verb-first naming (ormat, parse, ddDays, isValid). Lodash uses noun-first with dot notation (_.groupBy, _.mapKeys). TypeScript built-ins use verb-first (Array.map, String.trim). The industry trend is **verb-first with camelCase**.

### Recommendation

Adopt verb-first camelCase for all utility functions. A developer should be able to guess ormatDate exists by searching "format" in the date utility file.

---

## 12. Folder Organization Principles

### Purpose

Define the physical directory structure for utilities.

### Engineering Rationale

Without explicit folder organization, utilities land in whatever file is open. utils.ts grows to 500+ lines. Feature utilities mix with shared utilities. Test files are scattered.

### Recommended Option

**Three-zone directory structure:**

`
src/lib/utils/                    # Shared utilities (zone 1)
+-- index.ts                      # Barrel: re-exports all public APIs
+-- string.ts                     # String manipulation
+-- number.ts                     # Number math and formatting
+-- date/                         # Date utilities (subdirectory due to size)
|   +-- index.ts
|   +-- format.ts                 # Date formatting
|   +-- parse.ts                  # Date parsing
|   +-- arithmetic.ts             # Date arithmetic
+-- collection.ts                 # Array and object operations
+-- validation.ts                 # Validation helpers (non-Zod)
+-- browser.ts                    # Browser/DOM utilities
+-- url.ts                        # URL and query parameter utilities
+-- performance.ts                # Memoize, debounce, throttle
+-- security.ts                   # Sanitization, encoding
+-- testing.ts                    # Test factories, mock data generators
+-- cn.ts                         # Tailwind className utility

src/features/<feature>/           # Feature utilities (zone 2)
+-- _utils/
    +-- index.ts                  # Barrel
    +-- format.ts                 # Feature-specific formatting
    +-- helpers.ts                # Feature-specific helpers

src/lib/                          # Adjacent but NOT utilities (zone 3)
+-- data/                         # Data access layer (services)
+-- mappers/                      # Type mappers (domain <-> view)
+-- route-params.ts               # Route parameter parsing
+-- route-protection.ts           # Route authorization (business logic)
`

**Key principles:**

1. **Flat is better than nested.** src/lib/utils/ has one level of nesting max. Subdirectories only when a domain exceeds 80 lines.
2. **No random files.** Every .ts file in src/lib/utils/ must be registered in index.ts.
3. **No files outside zones.** Utilities must live in src/lib/utils/ or src/features/*/_utils/. No src/lib/helpers/, src/lib/utilities/, or similar.
4. **Test files are colocated.** date/format.test.ts lives next to date/format.ts.

### Trade-offs

- *One-level nesting* � reduces cognitive load but means date utilities (which span format/parse/arithmetic) need a subdirectory.
- *Deep nesting* � more precise categorization but harder to navigate.

### Industry Best Practice

date-fns uses one-function-per-file in a flat namespace. Lodash uses one-file-per-category. The project's previous ADRs (Stage 8, 9, 10) established < 80 lines per file, subdirectory if exceeded as the convention.

### Recommendation

Adopt the flat-first, subdirectory-second approach. Start with single files per domain. Split to subdirectories when a file exceeds 80 lines.

---

## 13. Generic Utility Strategy

### Purpose

Define how and when utilities should use generic type parameters.

### Engineering Rationale

Non-generic utilities are tied to specific types, which limits reuse. A sortAlumniByDate utility can only sort alumni � a sortBy<T> utility can sort anything. However, excessive generality (accepting ny) defeats type safety.

### Recommended Option

**Three levels of genericity:**

| Level | Description | When to Use | Example |
|---|---|---|---|
| **Concrete** | No type parameters | Utility is innately tied to a primitive | cn(...inputs: ClassValue[]) |
| **Generic** | Type parameter(s) | Utility operates on any data shape | sortBy<T>(arr: T[], key: keyof T): T[] |
| **Constrained** | extends constraint | Utility requires a specific capability | pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> |

**Rules:**

1. **Default to generic** when the utility operates on arbitrary data. A groupBy should accept T, not Alumni.
2. **Use constrained generics** when the utility requires properties (keyof T, extends HasId).
3. **Avoid ny** in type signatures. Use unknown and narrow internally.
4. **Avoid overloaded signatures** where generics would suffice. One generic function is better than three overloaded concrete ones.
5. **Prefer function generics** over module-level generics. Each function declares its own type parameters.

### Trade-offs

- *Generic by default* � maximum reuse, maximum type safety. But complex generic signatures (especially conditional types) reduce readability.
- *Concrete by default* � simpler signatures but creates duplication when the same pattern is repeated for different types.

### Industry Best Practice

Lodash is entirely generic (sortBy<T>, groupBy<T, K>). Ramda is generics-heavy with curried signatures. TypeScript's Array methods (map<T, U>, ilter<T>) are the reference standard for well-typed generics.

### Recommendation

"Generic by default, concrete by necessity." If a utility function can be written with type parameters, it should be. This is the single highest-leverage decision for reuse.

---

## 14. Shared Utility Strategy

### Purpose

Define what makes a utility "shared," when to create one, and how to structure it.

### Engineering Rationale

Shared utilities are the most commonly misused tier. Developers create them too early (before patterns emerge) or too late (after 7 copies exist). They also tend to accumulate feature-specific overloads.

### Recommended Option

**Shared utility creation rules:**

A utility qualifies as "shared" when it:

1. Is used by >=3 features OR is a foundational primitive (cn, isEmail, slugify).
2. Has no dependency on any feature's types, constants, or logic.
3. Can be described without referencing any business domain.
4. Is independently testable with no setup or mocking.

**Every shared utility file must have:**

- File-level JSDoc: describes the domain, conventions, and any shared configurations.
- Per-function JSDoc: @param, @returns, @example.
- 100% test coverage for all branches.
- An entry in the barrel index.ts.

### Trade-offs

- *Strict shared criteria* � prevents premature sharing but may miss obvious early candidates.
- *Permissive shared criteria* � more utilities are shared earlier but the shared layer accumulates clutter.

### Industry Best Practice

date-fns and Lodash both maintain a clean separation between their generic lib and user-land wrappers. The pattern is: **shared lib is generic, user-land wrappers are specific.**

### Recommendation

If you cannot give a shared utility a generic name (no domain terms), it does not belong in shared. Create it as a feature utility instead.

---

## 15. Feature Utility Strategy

### Purpose

Define how feature-specific utilities differ from shared utilities and when to create them.

### Engineering Rationale

Feature utilities fill the gap between generic shared utilities (which know nothing about the domain) and inline component logic (which is untestable). Without this tier, feature teams either make shared utilities less generic or embed logic in components.

### Recommended Option

**Feature utilities are domain-aware, feature-scoped, stateless functions.**

They differ from shared utilities in three ways:

| Dimension | Shared Utility | Feature Utility |
|---|---|---|
| **Domain knowledge** | None | Knows feature's domain model |
| **Types used** | Generic (T, string, 
umber) | Feature types (Alumni, EventStatus) |
| **Consumer scope** | All features | Single feature only |
| **Test dependency** | None | Feature types only |

**When to create a feature utility:**

1. The logic references feature-specific types or constants.
2. The logic wraps a shared utility with feature-specific defaults (ormatEventDate = (d) => formatDate(d, 'PP')).
3. The logic extracts data from a feature-specific structure (getEventStatusColor(event)).
4. The logic duplicates code that exists in >=2 files within the same feature.

**When NOT to create a feature utility:**

1. The logic is used by >=3 features -> promote to shared.
2. The logic is a one-liner that is clearer inline.
3. The logic requires React hooks, state, or side effects -> use a Hook or Service.

### Trade-offs

- *Feature _utils/* � clear ownership, easy to find, easy to promote. But requires one more directory per feature.
- *Shared overloads* � fewer files, but shared utilities become coupled to feature types.

### Industry Best Practice

Feature-based architectures (NX, feature-sliced design) all use feature-scoped utility directories. The pattern is consistent: **the feature owns its helpers, the application owns shared helpers.**

### Recommendation

Every feature should have a _utils/ directory. Not every feature needs to use it immediately. The directory signals: "this feature has extracted logic here."

---

## 16. Pure Function Strategy

### Purpose

Define the rules for writing pure functions in the utility layer and acceptable exceptions.

### Engineering Rationale

Pure functions are the foundation of testability, predictability, and composability. Every impurity reduces these properties. However, some utility categories (browser, performance) inherently require side effects. A strategy that handles both cases is needed.

### Recommended Option

**Pure function rules (applied to all shared utilities, recommended for feature utilities):**

| Rule | Description | Enforcement |
|---|---|---|
| **Deterministic** | Same inputs -> same outputs always | Manual review |
| **No mutation** | Arguments are never modified | ESLint 
o-param-reassign |
| **No I/O** | No network, file system, storage | ESLint boundary rules |
| **No globals** | No window, document, localStorage | Lint + review |
| **No Date.now()** | Unless injected as parameter | Manual review |
| **No Math.random()** | Unless in randomization utility | Manual review |
| **No closures over mutable state** | Module-level variables must be const | ESLint 
o-let in utils |

**Acceptable exceptions (documented and segregated):**

| Exception | Category | Mitigation |
|---|---|---|
| Date.now() | date/now.ts | Wrap in getNow() that can be stubbed in tests |
| crypto.randomUUID() | identifier.ts | Wrap in generateId() |
| Math.random() | andomization.ts | Accept seed parameter for deterministic tests |
| 
avigator.clipboard | rowser.ts | Returns Promise, error handled |
| localStorage.getItem | rowser.ts | Graceful fallback if unavailable |
| console.warn | debug.ts | Only in dev-mode, never in prod |

**Rule for impure utilities:** Every impure utility file must have "SIDE EFFECTS" in its file-level JSDoc comment. This makes the impurity visible at import time without reading the function body.

### Trade-offs

- *Strict purity* � maximum testability but requires injection for Date, random, and crypto.
- *Accepting impurity* � simpler code but tests must mock global state.

### Industry Best Practice

date-fns accepts Date objects as parameters rather than calling 
ew Date() internally. This means all date utilities are pure when given a Date argument. Lodash is entirely pure. Ramda is entirely pure.

### Recommendation

"Pure by default, impure only when necessary, documented always." Every impurity must be justified in a comment and segregated in its own file.

---

## 17. Side Effect Rules

### Purpose

Define the specific rules for side effects in utilities � when they are allowed, how they are documented, and how they are tested.

### Engineering Rationale

Side effects are the primary source of untestability. A utility that writes to localStorage cannot be tested without mocking storage. A utility that calls console.log pollutes test output. However, some utilities inherently require side effects (clipboard, cookies, storage).

### Recommended Option

**Side effect classification:**

| Class | Example | Allowed in | Test Strategy |
|---|---|---|---|
| **None** | ormatDate, groupBy | All utilities | Pure assertion |
| **Read-only** | getCookie, getItem | Browser utilities only | Mock the read source |
| **Write** | setCookie, setItem | Browser utilities only | Spy + verify call |
| **Navigation** | edirect, pushState | NOT allowed in utilities | Must be a Hook or Service |
| **Logging** | console.warn | Debug utilities only (dev) | Spy on console |
| **Networking** | etch, xios | NOT allowed in utilities | Must be in Data layer |

**Rules:**

1. **Side-effectful files must include SIDE EFFECTS in their JSDoc** at the file level.
2. **Side-effectful functions must handle SSR** (	ypeof document === "undefined" guards).
3. **Side-effectful functions must fail gracefully** � no throw on missing cookie or unavailable storage.
4. **Side-effectful functions must not be called during render** � document this in JSDoc.
5. **Every side-effectful function must have tests** that mock the external dependency.

### Trade-offs

- *Segregating side effects* � pure and impure utilities are clearly separated. Safe to import pure utilities anywhere. Requires awareness of which files have side effects.
- *Mixing side effects* � fewer files but creates invisible dependencies.

### Industry Best Practice

Lodash is entirely side-effect-free. date-fns requires passing Date objects (no implicit side effects). The browser API wrappers (like @react-hookz/web) isolate side effects into dedicated hooks.

### Recommendation

All side-effectful utilities belong in exactly one file: src/lib/utils/browser.ts. If a utility needs a side effect that is not browser-related, it is not a utility.

---

## 18. Immutability Guidelines

### Purpose

Define how utilities handle data immutability � what operations are allowed on input values.

### Engineering Rationale

The most common utility bug is **mutating the input**. A sortCollection utility that calls Array.sort() in-place mutates the original array. An ddProperty utility that sets obj.newProp = value mutates the caller's object. These bugs are subtle because they appear to work during development but cause state corruption in production.

### Recommended Option

**Zero mutation � utilities must never mutate their inputs.**

| Operation | Do NOT | DO |
|---|---|---|
| Array sort | rr.sort() | [...arr].sort() |
| Array push | rr.push(x) | [...arr, x] |
| Object assign | obj.key = value | { ...obj, key: value } |
| Array splice | rr.splice(i, 1) | rr.filter((_, idx) => idx !== i) |
| Array reverse | rr.reverse() | [...arr].reverse() |
| Map set | map.set(k, v) | 
ew Map(map).set(k, v) |
| Set delete | set.delete(v) | 
ew Set([...set].filter(x => x !== v)) |

**Enforcement:**

- ESLint 
o-param-reassign: error � prevents modifying parameters.
- ESLint prefer-spread: error � enforces [...arr] over Array.from(arr).
- ESLint prefer-object-spread: error � enforces {...obj} over Object.assign.
- Code review: watch for array mutation methods (sort, everse, splice, push, pop, shift, unshift).

### Trade-offs

- *Strict immutability* � eliminates mutation bugs but creates garbage collection pressure (new array on every operation).
- *Permissive immutability* � better performance for large collections but higher bug risk.

### Industry Best Practice

Lodash and Ramda never mutate inputs. Immer provides a different model (produce mutable draft -> immutable result). The Redux team's recommendation: "Use immutable operations by default, opt into Immer for complex nested state."

### Recommendation

Strict immutability for all shared utilities. Feature utilities handling large datasets (1000+ items) may use 	oSorted(), 	oReversed(), 	oSpliced() (ES2023 array methods that return copies) for performance.

---

## 19. Data Transformation Utilities

### Purpose

Define the architectural role of data transformation utilities � how they differ from mappers and when to use each.

### Engineering Rationale

Data transformation appears in every layer: components transform API responses to view models, sections transform data for tables, features transform form values to API payloads. Without separation, transformation logic is duplicated and mappers (which are domain-aware) mix with utilities (which are domain-neutral).

### Recommended Option

**Data Transformation Utilities are domain-neutral shape changers.**

They operate on generic data shapes (objects, arrays, primitives) without knowing what the data represents.

| Utility | Input | Output | Domain Knowledge |
|---|---|---|---|
| pick(obj, keys) | Record<K,T> | Pick<Record<K,T>, K> | None |
| omit(obj, keys) | Record<K,T> | Omit<Record<K,T>, K> | None |
| enameKey(obj, from, to) | Record<string,T> | Record<string,T> | None |
| mapKeys(obj, fn) | Record<K,T> | Record<U,T> | None |
| mapValues(obj, fn) | Record<K,T> | Record<K,U> | None |
| groupBy(arr, fn) | T[] | Map<string, T[]> | None |

**When to use utilities vs mappers:**

| Concern | Tool | Location |
|---|---|---|
| Generic shape transformation (pick, omit, rename) | Utility | src/lib/utils/collection.ts |
| Domain-specific transformation (DTO -> Domain) | Mapper | src/lib/mappers/domain/ |
| Display-oriented transformation (Domain -> ViewModel) | Mapper | src/lib/mappers/view/ |
| Generic value formatting (date, currency, number) | Utility | src/lib/utils/date.ts, 
umber.ts |

**Rule:** If a transformation references a domain type (Alumni, Event, User), it belongs in src/lib/mappers/, not src/lib/utils/.

### Trade-offs

- *Utility-first transformation* � generic, reusable, testable. But every domain transformation requires a mapper layer.
- *Mapper-only transformation* � simpler mental model but duplicates generic patterns (pick, omit, groupBy) in every mapper.

### Industry Best Practice

Lodash provides all generic transformations. date-fns provides all date transformations. Mappers at the application layer compose these utilities with domain-specific logic.

### Recommendation

All generic data transformations live in collection.ts or object.ts. Any transformation that uses a domain type goes in src/lib/mappers/. Mappers should compose utilities, not duplicate them.

---

## 20. Formatting Utilities

### Purpose

Define the architecture for display-oriented formatting � dates, numbers, currency, percentages, names, addresses, phone numbers.

### Engineering Rationale

Formatting is the most duplicated logic in frontend applications. Every feature formats dates, currencies, and names. Without centralized formatting, each feature defines its own format strings, creating inconsistencies: one feature shows "Jan 15, 2024", another shows "01/15/2024".

### Recommended Option

**Formatting utilities convert internal representations to display strings.**

They are:

- **Pure** � accept a value, return a string.
- **Locale-aware** � accept an optional locale parameter for i18n.
- **Fallback-safe** � handle 
ull, undefined, or invalid input gracefully (return - or "").

| Utility | Input | Default Output | Configurable |
|---|---|---|---|
| ormatDate | Date | string | number | "Jan 15, 2024" | Intl.DateTimeFormat options |
| ormatTime | Date | string | number | "3:45 PM" | hour, minute options |
| ormatDateTime | Date | string | number | "Jan 15, 2024, 3:45 PM" | Combined options |
| ormatRelativeTime | Date | string | number | "2 days ago" | Intl.RelativeTimeFormat options |
| ormatCurrency | 
umber | ",234.56" | Currency code, locale |
| ormatPercent | 
umber | "12.34%" | Decimal places |
| ormatNumber | 
umber | "1,234.56" | Intl.NumberFormat options |
| ormatPhone | string | "(555) 123-4567" | Country code |
| 	runcate | string | "Hello..." | Max length, ellipsis |

**Rules:**

1. All formatting utilities use Intl APIs (not manual string concatenation) for locale-aware output.
2. Each formatting utility has a sensible default that matches the application's primary locale.
3. Empty/null/undefined inputs return a placeholder (- or "").
4. Formatting utilities never throw on invalid input � they return a best-effort result.

**Date formatting specifically:**

- Use date-fns for relative formatting and simple date math.
- Use Intl.DateTimeFormat for locale-aware display formatting.
- Provide convenience wrappers: ormatDateShort, ormatDateLong, ormatDateRelative.
- Never format dates with manual getFullYear() / getMonth() / getDate() concatenation.

### Trade-offs

- *Intl-based* � correct locale handling, built-in, no extra dependency. But Intl.DateTimeFormat is verbose to configure.
- *date-fns format* � simpler API, well-known. But date-fns format strings are locale-unaware by default.

### Industry Best Practice

date-fns provides ormat with Unicode format tokens. Intl.DateTimeFormat provides locale-aware formatting. The industry best practice is: **use Intl.DateTimeFormat for display, date-fns for arithmetic and relative formatting.**

### Recommendation

Use Intl.DateTimeFormat for all date display formatting. Create convenience wrappers for common formats (date-only, time-only, full). Use date-fns only for relative formatting (ormatDistanceToNow) and date arithmetic.

---

## 21. Parsing Utilities

### Purpose

Define how utilities parse strings and values � converting display formats or serialized formats back to internal representations.

### Engineering Rationale

Parsing is the inverse of formatting. Every format utility needs a corresponding parse utility. Without pairing, data that comes from user input (date strings, phone numbers) is parsed ad-hoc in multiple locations with inconsistent results.

### Recommended Option

**Parsing utilities convert strings to typed values.**

They are:

- **Lenient** � accept multiple input formats, not just the canonical one.
- **Fail-safe** � return 
ull or a default on unparseable input, never throw.
- **Pure** � same input always produces same output (or null).

| Utility | Input | Output | Notes |
|---|---|---|---|
| parseDate | string | Date | null | Accepts ISO 8601, common date formats |
| parseNumber | string | 
umber | null | Removes locale-specific separators |
| parsePhone | string | string | null | Extracts digits only |
| parseSearchParams | string | Record<string, string> | URLSearchParams wrapper |

**Rules:**

1. Parse utilities must document the input formats they accept.
2. Parse utilities must return structured results (use discriminated union for error details if needed).
3. Every parse utility should have a corresponding format utility (and vice versa).
4. Parse utilities must not have side effects � no logging, no storage.

**Exception for specialized parsing:**

- Form submission parsing belongs in feature _utils/ or form-specific code (it knows which fields exist).
- Search/filter parsing belongs in feature _utils/ (it knows which filters are valid).

### Trade-offs

- *Paired format/parse* � ensures symmetry but requires two utilities per domain.
- *Unpaired* � less code but format and parse can drift apart.

### Industry Best Practice

date-fns provides both ormat and parse with the same format token system. Lodash has no parse utilities (not its domain). Intl has no parse utilities (parsing is locale-ambiguous by design).

### Recommendation

Every format utility at the shared level should have a corresponding parse utility. Document accepted format as a JSDoc @example. For ambiguous formats (is "01/02" January 2nd or February 1st?), document which convention the parser uses.

---

## 22. Serialization Utilities

### Purpose

Define how utilities convert complex data structures to serializable formats.

### Engineering Rationale

Serialization is needed for URL parameters, local storage, cookies, form data, and API payloads. Without standardized serialization, each feature implements its own JSON.stringify variations, resulting in inconsistent formats and missed edge cases (circular references, Date serialization, undefined values).

### Recommended Option

**Serialization utilities convert data structures to string representations.**

They handle:

- **Date -> string** � ISO 8601 by default.
- **Map -> JSON** � Array of [key, value] pairs.
- **Set -> JSON** � Array.
- **undefined -> omitted** � Serialization should drop undefined keys (or provide a configurable option).
- **BigInt -> string** � Explicit conversion with marker.

**Rules:**

1. Default serialization is JSON.stringify with a standardized replacer function.
2. The serialization utility must handle all primitive types used in the application.
3. Serialization utilities must not throw on valid data structures.
4. Serialization must be paired with a corresponding deserialization utility.

**When to use shared vs feature serialization:**

- Generic (any data): src/lib/utils/serialization.ts � serialize, deserialize.
- Feature-specific shape: src/features/<feature>/_utils/ � serializeFilterState, deserializeFilterState.

### Trade-offs

- *Shared serializer* � consistent, tested once. But every feature's serialization needs are slightly different, requiring configuration options.
- *Per-feature serializer* � perfectly tailored but duplicated serializer logic.

### Industry Best Practice

superjson (used by tRPC) handles Date, Map, Set, and BigInt serialization. The pattern: **a single serializer with a replacer/reviver pair** for the whole application, extended as new types are added.

### Recommendation

One shared serializer/deserializer pair in src/lib/utils/serialization.ts. Feature-specific serializers in feature _utils/ that compose the shared serializer with domain-specific logic.

---

## 23. Deserialization Utilities

### Purpose

Define how utilities reconstruct typed values from serialized strings.

### Engineering Rationale

Deserialization without validation produces type-unsafe values. JSON.parse returns ny. If a serialized Date becomes a string on the other side, every consumer must handle both Date and string � or risk runtime crashes.

### Recommended Option

**Deserialization utilities parse strings back to typed values, with Zod validation.**

`
// Concept (not implementation):
// deserialize(input: string, schema: ZodType<T>): Result<T, DeserializationError>
`

**Rules:**

1. Every deserialization must validate against a Zod schema. No "parse and trust."
2. Deserialization must handle malformed input gracefully (return default or error).
3. Deserialization must reconstruct complex types (Date from ISO string, Map from [k,v] pairs).
4. Deserialization utilities must be paired with their serialization counterpart.

**The shared deserialization utility provides:**

- safeDeserialize<T>(str, schema) -> { success: true, data: T } | { success: false, error: string }
- deserializeOr<T>(str, schema, fallback) -> T (never throws)

### Trade-offs

- *Zod-validated deserialization* � full type safety at the cost of schema verbosity.
- *Typed deserialization* (JSON.parse + s T) � simpler but unsound � s T lies if the format changes.

### Industry Best Practice

tRPC and Zod's integration is the industry standard for serialization round-trips. TanStack Table uses URL search params with explicit serialization/deserialization. The pattern: **always validate on the way in, even if you serialized on the way out.**

### Recommendation

Provide safeDeserialize and deserializeOr in src/lib/utils/serialization.ts. Feature utilities use these for their specific schemas. Never use bare JSON.parse with a type assertion.

---

## 24. Date and Time Utilities

### Purpose

Define the complete strategy for date and time handling across the application.

### Engineering Rationale

Date handling is the source of the most frequent and subtle bugs in frontend applications: timezone mismatches, invalid date strings, inconsistent formats, locale-dependent displays, and relative time drift. Without a centralized strategy, every feature reinvents date handling with different assumptions.

### Recommended Option

**Centralized date-time strategy with explicit timezone handling.**

**Tier 1 � Constants (already defined in Stage 11):**

`
// src/constants/date-time.ts
DATE_FORMAT_DISPLAY = "PP";
DATE_FORMAT_SHORT = "P";
DATE_FORMAT_ISO = "yyyy-MM-dd";
TIME_FORMAT = "p";
DATETIME_FORMAT = "PPp";
DATETIME_FORMAT_SHORT = "Pp";
`

**Tier 2 � Utilities (this stage):**

src/lib/utils/date/format.ts � date display formatting
src/lib/utils/date/parse.ts � date string parsing
src/lib/utils/date/arithmetic.ts � date math

| Utility | Purpose | date-fns Equivalent |
|---|---|---|
| ormatDate(d, style, locale?) | Date-only display | ormat(d, DATE_FORMAT_DISPLAY) |
| ormatDateTime(d, style, locale?) | Date+time display | ormat(d, DATETIME_FORMAT) |
| ormatRelative(d, base?, locale?) | "2 days ago" | ormatDistanceToNow(d) |
| isDateBetween(d, start, end) | Range check | isWithinInterval |
| isDateValid(d) | Validity check | isValid |
| ddDays(d, n) | Date arithmetic | ddDays |
| startOfDay(d) | Normalize to midnight | startOfDay |
| 	oISOString(d) | API-ready string | 	oISOString (handles null) |

**Timezone rules:**

1. All dates received from the API are treated as UTC and converted to local for display.
2. All dates sent to the API are converted to UTC.
3. Display formatting always shows in the user's local timezone.
4. Never use Date constructor with date strings (ambiguous parsing). Use date-fns parse or manual construction with Date.UTC.
5. Use Intl.DateTimeFormat for timezone-aware display (not manual offset calculation).

### Trade-offs

- *date-fns* � well-known, well-tested, composable, tree-shakeable. But adds a dependency and requires wrapping for consistent timezone behavior.
- *Manual Date* � no dependency, but 10x more bug-prone.
- *Temporal API* � the future standard, but not yet stable enough for production.

### Industry Best Practice

date-fns is the industry standard for frontend date handling. It is tree-shakeable (only import what you use), immutable, and function-based. Use date-fns for arithmetic and relative formatting. Use Intl.DateTimeFormat for locale-aware display (more control than date-fns ormat).

### Recommendation

Use date-fns for all date arithmetic and relative formatting. Create thin wrapper utilities in src/lib/utils/date/ that apply application-level defaults (locale, timezone, format strings from constants). Never import date-fns directly outside of src/lib/utils/date/.

---

## 25. String Utilities

### Purpose

Define the set of string manipulation utilities the application provides.

### Engineering Rationale

String manipulation is required in every feature: truncating long text, capitalizing names, generating slugs, sanitizing input, normalizing for comparison. Without centralized string utilities, each feature defines its own 	runcate, capitalize, and slugify with subtle behavioral differences.

### Recommended Option

| Utility | Input | Output | Purpose |
|---|---|---|---|
| capitalize(str) | string | string | Capitalize first letter |
| capitalizeWords(str) | string | string | Capitalize each word |
| 	runcate(str, maxLen, ellipsis?) | string | string | Truncate with ellipsis |
| slugify(str) | string | string | URL-safe slug |
| 
ormalizeSpaces(str) | string | string | Collapse whitespace |
| 	rimToNull(str) | string | string|null | Trim whitespace, return null if empty |
| escapeHtml(str) | string | string | HTML entity encoding |
| unescapeHtml(str) | string | string | HTML entity decoding |
| stripHtml(str) | string | string | Remove HTML tags |
| isBlank(str) | string | boolean | Null, undefined, empty, or whitespace-only |
| isNotBlank(str) | string | boolean | Inverse of isBlank |
| levenshtein(a, b) | string, string | number | Edit distance (for search/scoring) |

**Rules:**

1. All string utilities are pure and locale-aware where applicable (capitalize uses 	oLocaleUpperCase).
2. isBlank / isNotBlank are the canonical null/empty checks (preferred over !str or str.length === 0).
3. String utilities never mutate input (strings are immutable, but the rule stands).
4. slugify must handle Unicode characters (use String.prototype.normalize).

### Trade-offs

- *Comprehensive string utils* � covers all common cases, reduces duplication. But some utilities may only be used in one feature.
- *Minimal string utils* � fewer files, but features define their own variations.

### Industry Best Practice

Lodash provides capitalize, 	runcate, escape, unescape. date-fns has no string utils (out of scope). The industry pattern is: **provide the 10�15 most common string operations; feature teams build specialized ones on top.**

### Recommendation

Provide the 12 listed string utilities in src/lib/utils/string.ts. Feature-specific string logic (like ormatAlumniName) belongs in feature _utils/.

---

## 26. Number Utilities

### Purpose

Define the set of number formatting and mathematical utilities.

### Engineering Rationale

Number handling in frontend applications involves formatting (currency, percentages, decimals), clamping (min/max constraints), rounding (floor, ceil, to precision), and comparison (with tolerance for floating-point). Without centralized utilities, each feature uses 	oFixed(), Math.round(), or Intl.NumberFormat directly with inconsistent parameters.

### Recommended Option

| Utility | Input | Output | Purpose |
|---|---|---|---|
| clamp(n, min, max) | number | number | Constrain within range |
| oundTo(n, decimals) | number | number | Round to N decimal places |
| loorTo(n, decimals) | number | number | Floor to N decimal places |
| ceilTo(n, decimals) | number | number | Ceil to N decimal places |
| inRange(n, min, max) | number | boolean | Check if within range (inclusive) |
| isInteger(n) | number | boolean | Check if integer |
| 	oDecimal(n, decimals) | number | number | Truncate to N decimals |
| uzzyEquals(a, b, epsilon?) | number, number | boolean | Floating-point safe equality |

**Formatting utilities (display-oriented):**

| Utility | Purpose | Intl API |
|---|---|---|
| ormatNumber(n, locale?) | Thousand-separated display | Intl.NumberFormat |
| ormatCurrency(n, currency, locale?) | Currency display | Intl.NumberFormat |
| ormatPercent(n, decimals, locale?) | Percentage display | Intl.NumberFormat |

**Rules:**

1. All number utilities handle NaN, Infinity, and -Infinity gracefully.
2. Formatting utilities use Intl.NumberFormat (not manual comma-separation).
3. clamp is preferred over manual Math.min(Math.max(...)) for readability.
4. uzzyEquals is preferred over === for float comparisons.

### Trade-offs

- *Intl.NumberFormat* � correct locale handling, built-in. But verbose to configure per call.
- *Manual formatting* � simple but wrong for non-US locales (commas vs periods).

### Industry Best Practice

Lodash provides clamp, inRange, ound, loor, ceil. Intl.NumberFormat is the standard for display. The pattern: **use utilities for computation, Intl for display.**

### Recommendation

Provide computational utilities in src/lib/utils/number.ts. Provide formatting utilities in the same file that wrap Intl.NumberFormat with application defaults.

---

## 27. Array Utilities

### Purpose

Define the set of array manipulation utilities beyond what TypeScript/ES2024 provides natively.

### Engineering Rationale

Modern JavaScript (ES2023+) provides 	oSorted, 	oReversed, 	oSpliced, and with for immutable array operations. However, common operations like groupBy, partition, chunk, uniqBy, and intersection are not built-in. Without utilities, these are implemented inline with educe or ilter, making code less readable.

### Recommended Option

| Utility | Purpose | Native Equivalent |
|---|---|---|
| chunk<T>(arr, size) | Split into sub-arrays | None |
| groupBy<T>(arr, fn) | Group by key extractor | Map.groupBy (ES2024) |
| uniqBy<T>(arr, fn) | Unique by key extractor | None |
| partition<T>(arr, fn) | Split by predicate | None |
| intersection<T>(a, b) | Common elements | None |
| difference<T>(a, b) | Elements in a not in b | None |
| shuffle<T>(arr) | Random order | None |
| ange(start, end, step?) | Generate number array | None |
| 	oggleItem<T>(arr, item) | Add/remove item | None |
| moveItem<T>(arr, from, to) | Reorder | None |
| eplaceItem<T>(arr, index, item) | Immutable replace | with (ES2023) |
| updateItem<T>(arr, index, fn) | Immutable update via fn | None |

**Rules:**

1. Use native 	oSorted, 	oReversed, 	oSpliced over utility versions (ES2023).
2. All utilities are immutable � they return new arrays.
3. Utilities return empty arrays on null/undefined input (never throw).
4. Use ReadonlyArray<T> in parameter types (the utility does not mutate).

### Trade-offs

- *Utility coverage* � complete coverage eliminates inline educe/ilter but adds surface area.
- *Use native first* � less code, but Native Map.groupBy has different typing than Lodash's.

### Industry Best Practice

ES2023 provides 	oSorted, 	oReversed, 	oSpliced, with. ES2024 provides Map.groupBy. Lodash provides everything else. The industry trend: **use native when available, utility when not.**

### Recommendation

Provide utilities for operations without native equivalents. For operations that now have native methods (toSorted, groupBy), provide thin wrappers that apply the project's typing conventions and handle null/undefined inputs.

---

## 28. Object Utilities

### Purpose

Define the set of object manipulation utilities.

### Engineering Rationale

Object manipulation (pick, omit, rename keys, deep merge) is required in mappers, form submissions, API payload construction, and state management. Without utilities, code uses delete obj.key, {...rest} spread patterns, or inline loops � each with subtle differences.

### Recommended Option

| Utility | Purpose | Example |
|---|---|---|
| pick<T, K>(obj, keys) | Select specific keys | pick(user, ["id", "name"]) |
| omit<T, K>(obj, keys) | Remove specific keys | omit(user, ["password"]) |
| enameKey(obj, from, to) | Rename a key | enameKey(data, "userId", "id") |
| mapKeys(obj, fn) | Transform all keys | mapKeys(data, (k) => k.toUpperCase()) |
| mapValues(obj, fn) | Transform all values | mapValues(data, (v) => v.toString()) |
| deepMerge<T, U>(a, b) | Deep object merge | deepMerge(defaults, overrides) |
| isPlainObject(val) | Check if plain object | isPlainObject({}) // true |
| isEmptyObject(val) | Check if {} | isEmptyObject({}) // true |
| hasKey(obj, key) | Type-safe key check | hasKey(obj, "name") |
| getNested(obj, path, fallback?) | Safe deep access | getNested(obj, "a.b.c", null) |
| setNested(obj, path, value) | Immutable deep set | setNested(obj, "a.b", 5) |

**Rules:**

1. All operations are shallow by default. Deep operations (deepMerge, getNested, setNested) are explicitly named.
2. pick and omit accept arrays of string keys (well-typed with keyof T).
3. deepMerge handles arrays (concatenation or replacement, documented in JSDoc).
4. getNested returns the fallback for any undefined path segment (no throw).

### Trade-offs

- *Shallow by default* � better performance, simpler types, but requires explicit deep variants.
- *Deep by default* � handles nested objects but is slower and has complex generic types.

### Industry Best Practice

Lodash provides pick, omit, merge, get, set, has. TypeScript provides Pick<T,K> and Omit<T,K> at the type level but lacks runtime equivalents. The pattern: **provide runtime equivalents of TypeScript's type utilities.**

### Recommendation

Provide the 11 listed object utilities in src/lib/utils/collection.ts (or a dedicated object.ts if lines exceed 80).

---

## 29. Collection Utilities

### Purpose

Define utilities that operate on collections (arrays, maps, sets, objects) as a unified concept.

### Engineering Rationale

Frontend applications frequently need to convert between collection types � Map to Object, Set to Array, Array to Record. Without utilities, .reduce is used everywhere for simple conversions.

### Recommended Option

| Utility | Purpose |
|---|---|
| 	oRecord<T>(arr, keyFn) | Array -> Record (keyed by function) |
| 	oMap<T>(arr, keyFn) | Array -> Map |
| 	oArray<T>(collection) | Iterable -> Array |
| romEntries<K,V>(entries) | Type-safe Object.fromEntries |
| isEmpty(collection) | Check if array/object/map/set is empty |
| size(collection) | Get length/size of any collection |

**Rules:**

1. 	oRecord is the most-used utility in this list � every feature needs it for O(1) lookups.
2. All utilities accept ReadonlyArray<T> parameters (they do not mutate).
3. Collection utilities are generic and work with any type.

### Trade-offs

- *Generic collection utils* � one utility for all collection types. But TypeScript cannot infer 	oRecord's key type without explicit parameters.
- *Overloaded collection utils* � better type inference but more code.

### Industry Best Practice

Lodash provides keyBy (Array -> Object), groupBy (Array -> Object of arrays), countBy (Array -> Object). Ramda provides similar. The pattern: **arrow function key extractor is the standard API.**

### Recommendation

Provide 	oRecord(arr, keyFn) as the primary collection utility. Use 
oop for empty operations. Document that 	oRecord overwrites duplicate keys (last wins).

---

## 30. URL Utilities

### Purpose

Define utilities for URL construction, parsing, and manipulation.

### Engineering Rationale

URL construction is scattered across the codebase: navigation links, API endpoints, image URLs, redirect URLs. Without centralized utilities, URL construction uses string concatenation (error-prone), hard-coded base URLs (brittle), or inline URL constructor calls (inconsistent).

### Recommended Option

| Utility | Purpose |
|---|---|
| uildUrl(base, path, params?) | Construct URL with path and query params |
| getQueryParam(key, search?) | Get single query param from search string |
| getQueryParams(search?) | Get all query params as record |
| setQueryParam(search, key, value) | Add/update query param |
| emoveQueryParam(search, key) | Remove query param |
| isExternalUrl(url) | Check if URL points to external domain |
| isSameOrigin(url, origin?) | Check if URL matches origin |

**Rules:**

1. All URL utilities use the URL constructor (not string concatenation).
2. Query parameter utilities set window.location.search as the default search argument (for convenience) but accept any search string for testability.
3. URL utilities must handle SSR (no window access).
4. isExternalUrl compares against window.location.origin or an explicit origin parameter.

### Trade-offs

- *URL constructor* � correct encoding, handles edge cases. But the URL API is slightly more verbose than string building.
- *String concatenation* � simpler for trivial cases but fails on special characters and missing slashes.

### Industry Best Practice

Next.js provides usePathname, useSearchParams, and useRouter for navigation. TanStack Router provides URL utilities. The industry pattern: **use URL constructor for building, use framework hooks for reading.**

### Recommendation

Provide URL construction and manipulation utilities in src/lib/utils/url.ts. These are pure functions that work in any context (not hooks). Use them in feature code, mappers, and data access functions that build URLs.

---

## 31. Query Parameter Utilities

### Purpose

Define utilities for URL query parameter serialization, deserialization, and manipulation.

### Engineering Rationale

Query parameters carry filter state, pagination state, search queries, and sort preferences. Without centralized utilities, each feature parses URLSearchParams manually, leading to:

- Inconsistent parameter naming (page, p, pageNumber).
- Missing edge cases (arrays, special characters, empty values).
- Duplicated serialization/deserialization logic.

### Recommended Option

**Query parameter utilities are serialization/deserialization pairs for common parameter types.**

| Utility | Purpose |
|---|---|
| parseIntParam(value, fallback) | Parse single integer param |
| parseStringParam(value, fallback) | Parse single string param |
| parseArrayParam(value, fallback) | Parse comma-separated array |
| parseSortParam(value, fallback) | Parse "field:direction" sort |
| serializeInt(value) | Integer -> query value |
| serializeArray(values) | Array -> comma-separated string |
| serializeSort(field, direction) | Sort -> "field:direction" string |

**Rules:**

1. Parse utilities return the fallback for invalid or missing values (never throw).
2. Serialize utilities skip null/undefined values (do not include them in the URL).
3. Array parameters are comma-separated strings (?tags=a,b,c).
4. Sort parameters are colon-separated (?sort=name:asc).

### Trade-offs

- *Typed parse/serialize* � ensures consistent parameter format across features. But each feature needs its own parameter schema.
- *Generic param utils* � simpler but allows feature-specific parameter formats to drift.

### Industry Best Practice

TanStack Table uses URL search params with explicit serialization/deserialization. The pattern: **each feature declares its URL schema; shared utilities handle the primitive types.**

### Recommendation

Provide primitive query parameter utilities in src/lib/utils/url.ts. Feature-specific parameter handling (which params exist) in feature _utils/.

---

## 32. Search Utilities

### Purpose

Define utilities for client-side search and filtering logic.

### Engineering Rationale

Client-side search is used by the directory, events, jobs, and messages features. Without centralized utilities, each feature implements its own ilter() + includes() or ilter() + regex pattern, with different casing and matching behaviors.

### Recommended Option

| Utility | Purpose |
|---|---|
| uzzySearch(text, query) | Case-insensitive substring match |
| scoreSearch(text, query) | Relevance score (0�1) for ranking |
| ilterBySearch<T>(items, query, keyFn) | Filter array by search query |
| highlightMatch(text, query) | Return segments for UI highlighting |

**Rules:**

1. Search utilities are case-insensitive and locale-aware (use 	oLocaleLowerCase()).
2. uzzySearch matches partial terms ("ali" matches "Alumni" and "Ali").
3. scoreSearch returns a float; higher scores indicate stronger matches.
4. Search utilities are pure � they accept data and return results; they do not read from stores or React state.

**When to use client-side vs server-side search:**

| Criteria | Client-side | Server-side |
|---|---|---|
| Dataset size | < 500 items | >= 500 items |
| Data source | Already loaded | Needs API call |
| Latency requirement | Instant | Accepts network delay |
| Ranking complexity | Simple substring | Full-text index |

### Trade-offs

- *Client-side* � instant, offline-capable. But doesn't scale to large datasets.
- *Server-side* � scales, uses database indexes. But requires API calls and loading states.

### Industry Best Practice

Fuse.js is the most popular client-side fuzzy search library. The industry pattern: **client-side search for small datasets (< 500 items), server-side search for large datasets. Use a feature flag to switch.**

### Recommendation

Provide basic search utilities in src/lib/utils/search.ts. For complex fuzzy matching, feature teams may use Fuse.js as a feature dependency (not a shared one), encapsulated in the feature _utils/.

---

## 33. Filter Utilities

### Purpose

Define utilities for applying filter logic to collections.

### Engineering Rationale

Filtering is pervasive: events by date range, jobs by type, directory by graduation year, messages by read status. Without centralized utilities, each feature writes rr.filter(item => item.status === status) with scattered logic.

### Recommended Option

| Utility | Purpose |
|---|---|
| yStatus<T>(items, status, keyFn?) | Filter by status |
| yDateRange<T>(items, start, end, keyFn) | Filter by date range |
| yTextSearch<T>(items, query, keyFn) | Filter by text match (composes search) |
| yTags<T>(items, tags, keyFn) | Filter by tag inclusion |
| composeFilters<T>(...filters) | Combine multiple filters (AND logic) |

**Rules:**

1. Filter utilities accept a keyFn to extract the value being filtered (keeps utilities generic).
2. composeFilters enables combining any number of filter predicates.
3. All filters return the input array unchanged if the filter value is null/undefined (no-op semantics).
4. Filters are pure � they do not read from stores or React state.

### Trade-offs

- *Utility-based filters* � reusable, testable, composable. But require key extractors for each type.
- *Inline filters* � simple, direct. But duplicated across features.

### Industry Best Practice

TanStack Table provides composable filter functions. Lodash provides ilter with predicate. The pattern: **make filters composable so they can be combined.**

### Recommendation

Provide filter utilities in src/lib/utils/filter.ts. Feature-specific filters (which fields are filterable, what values are valid) in feature _utils/. composeFilters is the foundation � it enables combining date range + status + search without complex nested logic.

---

## 34. Sorting Utilities

### Purpose

Define utilities for client-side sorting of collections.

### Engineering Rationale

Sorting is required in directories, events, jobs, messages, and tables. Without centralized utilities, each feature uses Array.sort() with inline comparators, potentially mutating the original array.

### Recommended Option

| Utility | Purpose |
|---|---|
| sortBy<T>(items, key) | Sort by single key (ascending) |
| sortByDesc<T>(items, key) | Sort by single key (descending) |
| sortByMultiple<T>(items, sorters) | Sort by multiple keys |
| sortByDate<T>(items, keyFn) | Sort by date field |
| sortByString<T>(items, keyFn) | Locale-aware string sort |
| sortByNumber<T>(items, keyFn) | Number sort |
| createSorter(direction, comparator) | Factory for custom sorters |

**Rules:**

1. All sort utilities return a new array (immutable). Use 	oSorted internally (ES2023).
2. Sort utilities are pure � same items + same key -> same order.
3. String sorting uses localeCompare with { sensitivity: "base" } for case-insensitive behavior.
4. sortByMultiple accepts an array of { key, direction } objects for multi-column sorting.

**Performance note:** Client-side sorting is appropriate for <= 1000 items. Beyond that, sorting should be server-side.

### Trade-offs

- *Utility-based sorting* � immutable, consistent, locale-aware. But requires key extractors.
- *Inline toSorted* � available natively (ES2023), but each call has different comparator logic.

### Industry Best Practice

TanStack Table provides sortBy with multi-column support. Lodash provides sortBy and orderBy. The pattern: **key extractor functions keep sorting generic and reusable.**

### Recommendation

Provide sorting utilities in src/lib/utils/sort.ts that use 	oSorted internally and provide locale-aware string comparison. Feature-specific sort configurations in feature _utils/.

---

## 35. Pagination Utilities

### Purpose

Define utilities for client-side pagination logic and page metadata calculation.

### Engineering Rationale

Pagination is used in 8+ features. Without centralized utilities, each feature calculates startIndex, endIndex, 	otalPages, and hasNextPage inline, with inconsistent edge case handling (empty datasets, single page, last page with fewer items).

### Recommended Option

| Utility | Purpose |
|---|---|
| paginate<T>(items, page, pageSize) | Slice items to current page subset |
| getPageMeta(totalItems, page, pageSize) | Calculate page metadata |
| getPageRange(currentPage, totalPages, siblingCount?) | Generate visible page numbers |
| canGoNext(page, totalPages) | Has next page? |
| canGoPrev(page) | Has previous page? (page > 1) |

**Page metadata shape (returned by getPageMeta):**

`
{
  page: number;          // Current page (1-indexed)
  pageSize: number;      // Items per page
  totalItems: number;    // Total items in collection
  totalPages: number;    // Total pages
  hasNext: boolean;      // More pages available?
  hasPrev: boolean;      // Previous pages available?
  startIndex: number;    // 1-based start position
  endIndex: number;      // 1-based end position
}
`

**Rules:**

1. Page numbers are 1-indexed (page 1 is the first page).
2. paginate returns an empty array for invalid page numbers (not throws).
3. getPageRange returns the page numbers for the pagination component (with "..." gaps).
4. Pagination utilities are pure � they do not read from URL or state.

### Trade-offs

- *Client-side pagination* � instant, no API call. But only works with fully loaded datasets.
- *Server-side pagination* � scalable but requires API calls and loading states.

### Industry Best Practice

TanStack Table provides both client and server pagination modes. shadcn/ui pagination uses page range calculations. The pattern: **use the same page meta interface for both client and server pagination so components are interchangeable.**

### Recommendation

Provide pagination utilities in src/lib/utils/pagination.ts. Every feature that displays paginated data should use these, whether paginating client-side or server-side (the page meta shape is the same).

---

## 36. Validation Helpers

### Purpose

Define validation utilities that complement (but do not replace) Zod schemas.

### Engineering Rationale

Zod handles runtime validation of API responses, form submissions, and configuration. But there are validation use cases that are better served by simple boolean checks: checking if a value looks like an email, testing if a string is a valid URL, verifying a phone number format. These are quicker to read as isEmail(value) than emailSchema.safeParse(value).

### Recommended Option

| Utility | Purpose | Zod Equivalent |
|---|---|---|
| isEmail(value) | Basic email format check | z.string().email() |
| isUrl(value) | Basic URL check | z.string().url() |
| isPhone(value) | Basic phone format check | Custom Zod |
| isPostalCode(value, country) | Postal code format | Custom Zod |
| isAlphanumeric(value) | Only letters and digits | z.string().alphanumeric() |
| isNumeric(value) | Only digits | z.string().regex(/^\d+$/) |
| isUuid(value) | UUID v4 format | z.string().uuid() |
| isHexColor(value) | #RRGGBB or #RGB | Custom Zod |
| isInLength(value, min, max) | String length check | z.string().min().max() |
| matches(value, pattern) | Typed regex test | z.string().regex() |

**Rules:**

1. Validation helpers return oolean � they are predicates, not parsers. They answer "does this look valid?" not "what is the validated value?"
2. For production validation (must be correct), use Zod schemas. For display decisions (show error hint, enable button), use validation helpers.
3. Validation helpers are pure and accept only primitive values.

**When to use helper vs Zod:**

| Scenario | Use |
|---|---|
| "Disable submit button if email is invalid" | isEmail(value) |
| "Parse and validate API email response" | emailSchema.parse(value) |
| "Show inline validation error" | isEmail(value) -> "Invalid email" |
| "Ensure email is properly typed for database" | emailSchema.parse(value) |

### Trade-offs

- *Boolean validators* � quick, readable, no error messages. But lose the "why" of failure.
- *Zod schemas* � complete error information. But heavier for simple boolean checks.

### Industry Best Practice

validator.js provides 80+ string validation functions. Zod provides schema-based validation. The industry pattern: **predicate validators for quick checks, Zod for authoritative validation.**

### Recommendation

Provide boolean validation helpers in src/lib/utils/validation.ts. These call the corresponding Zod schema internally (single source of truth) but return oolean. The Zod schemas remain in src/constants/validation.ts (as defined in Stage 11).

---

## 37. Comparison Utilities

### Purpose

Define typed comparison functions for sorting, filtering, and equality checks.

### Engineering Rationale

Every feature needs comparators � for sort, for filter, for deduplication, for change detection. Without typed comparators, each feature writes (a, b) => a.localeCompare(b) with different sensitivity options.

### Recommended Option

| Utility | Purpose |
|---|---|
| stringComparator(a, b, direction?) | Locale-aware string comparison |
| 
umberComparator(a, b, direction?) | Numeric comparison |
| dateComparator(a, b, direction?) | Date comparison |
| ooleanComparator(a, b, direction?) | Boolean (false first / true first) |
| 
ullSafeComparator(inner) | Wrap comparator, nulls last |

**Rules:**

1. All comparators return -1 | 0 | 1 (standard comparator contract for Array.sort).
2. direction parameter: "asc" | "desc" (default "asc").
3. 
ullSafeComparator treats 
ull/undefined as always greater than values (nulls last).
4. Comparison utilities compose: sortBy(items, (item) => item.name, stringComparator).

### Trade-offs

- *Typed comparators* � consistent, null-safe, locale-aware. But require importing specific comparators.
- *Inline arrow functions* � simpler but locale-unaware and not null-safe by default.

### Industry Best Practice

Lodash provides compareAscending (internal). TanStack Table provides sorting with custom comparator functions. The pattern: **provide typed comparators that handle null and locale correctly.**

### Recommendation

Provide comparison utilities in src/lib/utils/compare.ts that handle null values, locale-aware string comparison, and both ascending/descending directions.

---

## 38. Equality Utilities

### Purpose

Define deep and shallow equality check utilities.

### Engineering Rationale

Equality checks are used for change detection (should this component re-render?), memoization (has the input changed?), form dirty detection (has the form changed from initial values?), and test assertions. Without centralized equality, each file implements JSON.stringify(a) === JSON.stringify(b) (order-dependent, ignores Map/Set) or manual deep comparison.

### Recommended Option

| Utility | Purpose | Performance |
|---|---|---|
| shallowEqual(a, b) | Shallow comparison of object keys | O(n) keys |
| deepEqual(a, b) | Recursive value comparison | O(n) total nodes |
| isChanged(a, b) | Negation of deepEqual | Same as deepEqual |
| isDistinct(value, index, array) | For rr.filter(isDistinct) | O(n^2) in filter |

**Rules:**

1. shallowEqual compares own enumerable properties using Object.is.
2. deepEqual handles Date, RegExp, Map, Set, Array, and plain objects.
3. Equality utilities do not handle circular references (throw on detection).
4. isDistinct is a shorthand for rr.filter((v, i, a) => a.indexOf(v) === i).

**Performance guidelines:**

- Use shallowEqual for React memo comparison (it is the default rePropsEqual contract).
- Use deepEqual only for change detection in tests or serialization.
- Use Object.is (or ===) for primitive comparison � do not call deepEqual on primitives.

### Trade-offs

- *Custom deepEqual* � full control, no dependency. But edge cases (circular, prototypes) must be handled manually.
- *Lodash isEqual* � battle-tested, handles all edge cases. But adds a 5KB dependency (most of Lodash's size).

### Industry Best Practice

Lodash isEqual is the most widely used deep equality check. React uses Object.is for shallow comparison. The pattern: **shallow equal for performance-sensitive code, deep equal for tests and change detection.**

### Recommendation

Provide shallowEqual and deepEqual in src/lib/utils/equal.ts. Use Object.is for shallow comparison. Implement deepEqual manually (it is not complicated enough to warrant a Lodash dependency for this single function).

---

## 39. Normalization Utilities

### Purpose

Define utilities that normalize data � standardizing formats, removing noise, ensuring consistent representation.

### Engineering Rationale

Data from different sources arrives in different formats: user input (messy), API responses (structured but varying), URL parameters (strings). Normalization brings everything to a canonical form before processing.

### Recommended Option

| Utility | Purpose |
|---|---|
| 
ormalizeEmail(email) | Trim, lowercase, validate format |
| 
ormalizePhone(phone) | Strip non-digits, standardize format |
| 
ormalizeUrl(url) | Ensure protocol prefix, lowercase host |
| 
ormalizeWhitespace(text) | Collapse multiple spaces, trim |
| 
ormalizeCase(text, style?) | Convert to lowercase, uppercase, or title case |
| 
ormalizeKeywords(query) | Tokenize, lowercase, remove stop words |

**Rules:**

1. Normalization is idempotent � calling it twice produces the same result as calling it once.
2. Normalization does not validate � it standardizes. Use validation helpers separately.
3. Normalization returns the input unchanged if it cannot be normalized (graceful fallback).
4. Feature-specific normalization (like 
ormalizeAlumniName) belongs in feature _utils/.

### Trade-offs

- *Aggressive normalization* � more consistent data but may change user's intended input.
- *Minimal normalization* � preserves user intent but requires consumers to handle variations.

### Industry Best Practice

validator.js provides 
ormalizeEmail. Lodash does not provide normalization (out of scope). The pattern: **normalize when storing/transmitting, preserve original when displaying.**

### Recommendation

Provide normalization utilities in src/lib/utils/normalize.ts. Feature-specific normalization in feature _utils/. Normalization is always applied to user input and API responses before processing.

---

## 40. Mapping Utilities

### Purpose

Define the architectural relationship between Mapping and Utilities � what mapping utilities look like vs what belongs in the Mapper layer.

### Engineering Rationale

The project has a dedicated src/lib/mappers/ directory with domain/ and iew/ subdirectories. Mappers convert between type layers (DTO -> Domain, Domain -> ViewModel). Utilities that assist mapping (generic transformations) must be distinguished from mappers themselves.

### Recommended Option

**Mapping utilities are the generic building blocks that mappers compose.**

| Utility | Purpose | Used By |
|---|---|---|
| mapTo<T, U>(items, fn) | Array map with null filtering | All mappers |
| mapKeys(obj, fn) | Key transformation | Field rename mappers |
| mapValues(obj, fn) | Value transformation | Field format mappers |
| mapNullable<T, U>(value, fn) | Safe mapping of nullable values | Null-handling mappers |

**Boundary rules:**

- A utility in src/lib/utils/mapping.ts operates on generic types and has no domain knowledge.
- A mapper in src/lib/mappers/domain/alumni.ts knows about Alumni DTO to Alumni Domain.
- A mapper composes utilities: mapTo(users, (dto) => toDomain(dto)) rather than duplicating the loop.

### Trade-offs

- *Utility + Mapper separation* � clear SRP. Utilities provide generic building blocks. Mappers provide domain-specific orchestration.
- *Single mapping layer* � simpler structure but mappers contain both generic loops and domain-specific transformations.

### Industry Best Practice

AutoMapper (C#) and MapStruct (Java) use the same pattern: generic mapping utilities + domain-specific mapping profiles. The pattern: **separate the "how to map" (utility) from "what to map" (mapper).**

### Recommendation

Provide mapping utilities in src/lib/utils/mapping.ts. Keep them generic (no domain types). All domain mapping lives in src/lib/mappers/ and composes these utilities.

---

## 41. Conversion Utilities

### Purpose

Define utilities that convert between primitive types (bytes to KB, milliseconds to seconds, Celsius to Fahrenheit).

### Engineering Rationale

Unit conversion is needed throughout the application: file sizes (bytes to KB/MB/GB), durations (ms to minutes/hours), coordinates, temperatures. Without centralized utilities, each feature writes alue / 1024 or alue / 1000 with inconsistent rounding and labels.

### Recommended Option

| Utility | Purpose |
|---|---|
| ytesToSize(bytes, decimals?) | Bytes to human-readable size |
| msToDuration(ms) | Milliseconds to structured duration |
| msToSeconds(ms) | Milliseconds to seconds |
| secondsToMs(s) | Seconds to milliseconds |
| minutesToMs(m) | Minutes to milliseconds |
| hoursToMs(h) | Hours to milliseconds |
| daysToMs(d) | Days to milliseconds |
| pixelsToRem(px, base?) | Pixels to rem (CSS) |
| emToPixels(rem, base?) | Rem to pixels |

**Rules:**

1. Conversion utilities are pure and deterministic.
2. ytesToSize uses base-2 (KiB, MiB, GiB) unless otherwise specified.
3. Time conversion utilities use the constant values from src/constants/date-time.ts (MS_PER_SECOND, MS_PER_MINUTE, etc.).
4. Conversion utilities return numbers (not formatted strings). Use formatting utilities for display.

### Trade-offs

- *Conversion utilities* � centralize the math, prevent off-by-factor errors. But add surface area for trivial * 1000 operations.
- *Inline conversion* � "simpler" but alue * 1000 appears 25 times with no consistency.

### Industry Best Practice

date-fns provides duration utilities. Lodash has no conversion utilities (out of scope). The pattern: **provide conversions for domain-specific units (bytes, time); inline trivial conversions (percentages).**

### Recommendation

Provide conversion utilities in src/lib/utils/conversion.ts. Prioritize the most-used conversions: bytes, time durations, and CSS units.

---

## 42. Generator Utilities

### Purpose

Define utilities that generate values � IDs, slugs, colors, test data.

### Engineering Rationale

Generation is needed for: test data factories, unique IDs for list keys, slug generation for URLs, color assignment for avatars and charts. Without centralized generators, each feature implements Math.random().toString(36) or Date.now().toString(36) for ID generation.

### Recommended Option

| Utility | Purpose | Deterministic? |
|---|---|---|
| generateId() | Unique ID (crypto-random) | No |
| generateSlug(text) | URL-safe slug from text | Yes |
| generateColor(str) | Deterministic color from string | Yes |
| generateInitials(name) | "John Doe" to "JD" | Yes |
| ange(start, end, step?) | Number sequence | Yes |
| 	imes<T>(n, fn) | Execute fn n times, collect results | Depends on fn |

**Rules:**

1. generateId uses crypto.randomUUID() for uniqueness (not Math.random).
2. generateColor uses a hash function for deterministic color assignment (same name -> same color).
3. generateSlug normalizes text (lowercase, remove special chars, replace spaces with hyphens).
4. Pure generators (generateSlug, generateColor, generateInitials, ange, 	imes) are deterministic.

### Trade-offs

- *Crypto-random IDs* � truly unique, suitable for database keys. But not sortable (unlike timestamps).
- *Timestamp IDs* � sortable, but can collide under high concurrency.

### Industry Best Practice

crypto.randomUUID() is the modern standard for client-side ID generation (supported in all modern browsers and Node 19+). NanoID provides shorter IDs for URL-friendly use. The pattern: **use crypto.randomUUID for unique IDs, use NanoID for short URL-friendly IDs.**

### Recommendation

Provide generator utilities in src/lib/utils/generate.ts. Use crypto.randomUUID() for IDs. Use String.prototype.normalize + manual slug function for slug generation (no extra dependency needed).

---

## 43. Randomization Utilities

### Purpose

Define utilities for controlled randomness � shuffle, pick, sample, weighted selection.

### Engineering Rationale

Randomized operations are needed for: shuffle (display items in random order), pick (random testimonial), sample (random subset for preview), and A/B test assignment. Without centralized utilities, each feature implements rr[Math.floor(Math.random() * arr.length)] with no seed support for deterministic testing.

### Recommended Option

| Utility | Purpose | Seedable? |
|---|---|---|
| andomInt(min, max) | Random integer in range | No |
| andomFloat(min, max) | Random float in range | No |
| pickRandom<T>(arr) | Pick single random element | No |
| sampleRandom<T>(arr, n) | Pick n random elements (no repeat) | No |
| shuffle<T>(arr) | Fisher-Yates shuffle | No |
| seededShuffle<T>(arr, seed) | Seedable shuffle (deterministic) | Yes |
| weightedPick<T>(items, weights) | Weighted random selection | No |

**Rules:**

1. Non-seeded utilities use Math.random() internally.
2. seededShuffle uses a simple seeded PRNG (not Math.random).
3. Shuffle returns a new array (immutable).
4. pickRandom returns undefined for empty arrays (never throws).

### Trade-offs

- *Seeded randomness* � enables deterministic tests and reproducible results. But seeded PRNGs are slower than Math.random.
- *Pure randomness* � simpler, faster. But tests cannot reproduce specific sequences.

### Industry Best Practice

Lodash provides shuffle, sample, sampleSize, andom. d3-random provides seedable PRNGs. The pattern: **provide seedable variants for testing and non-seeded for production.**

### Recommendation

Provide randomization utilities in src/lib/utils/random.ts. Include seededShuffle for deterministic testing. Do not add a PRNG dependency � a simple mulberry32 or xoshiro128 implementation is sufficient.

---

## 44. Identifier Utilities

### Purpose

Define utilities for working with branded IDs, type-safe IDs, and ID validation.

### Engineering Rationale

Stage 10 defined branded IDs (BrandedId<T> pattern) for type safety. Utilities are needed to construct, validate, and compare these IDs.

### Recommended Option

| Utility | Purpose |
|---|---|
| createId<T>(value) | Create branded ID from string |
| isValidId(value) | Basic UUID format check |
| idEquals<T>(a, b) | Type-safe branded ID comparison |
| idToString<T>(id) | Extract string from branded ID |
| idsToArray<T>(...ids) | Varargs ID to string array |

**Rules:**

1. createId creates a branded ID from a UUID string.
2. idEquals uses Object.is underneath but with branded type safety.
3. isValidId checks UUID v4 format.
4. Identifier utilities are pure and simple wrappers � they exist for type safety, not complex logic.

### Trade-offs

- *Branded ID utilities* � full type safety with minimal runtime cost. But requires importing type-specific utilities.
- *Raw string IDs* � simpler but no type safety � accidentally passing eventId where userId is expected compiles fine.

### Industry Best Practice

The branded ID pattern is used by Effect.ts, Newtype.ts, and TypeScript utility libraries. The pattern: **branded ID utilities make the type system work for you.**

### Recommendation

Provide identifier utilities in src/lib/utils/id.ts. These are thin wrappers that make branded IDs ergonomic to use across the application.

---

## 45. File Utilities

### Purpose

Define utilities for file handling � validation, size formatting, extension extraction, download triggers.

### Engineering Rationale

File handling is needed for image uploads, document downloads, CSV exports, and avatar management. Without centralized utilities, each feature validates file types, extracts extensions, and triggers downloads with different approaches.

### Recommended Option

| Utility | Purpose |
|---|---|
| getFileExtension(filename) | Extract extension from filename |
| getFileNameWithoutExtension(filename) | Strip extension |
| isAllowedFileType(filename, allowedTypes) | Check against allowed types |
| ormatFileSize(bytes) | Bytes to human-readable size |
| 	riggerDownload(url, filename?) | Programmatic download |
| eadFileAsDataUrl(file) | File to base64 data URL |
| eadFileAsText(file) | File to text content |

**Rules:**

1. isAllowedFileType compares MIME types or extensions (configurable).
2. 	riggerDownload creates a temporary anchor element and clicks it (no library dependency).
3. ormatFileSize uses ytesToSize from conversion utilities.
4. File utilities handle SSR gracefully (	ypeof document === "undefined" guard for 	riggerDownload).

### Trade-offs

- *Utility-based file handling* � consistent validation and download patterns.
- *Inline file handling* � each feature handles file validation differently.

### Industry Best Practice

File validation is typically handled at the form level (Zod + upload component). Download triggers are simple enough for a utility. The pattern: **utility for download and size formatting; form-level validation for file types.**

### Recommendation

Provide 	riggerDownload and file parsing helpers in src/lib/utils/file.ts. File type validation is best handled by feature _utils/ (since allowed types are feature-specific) or by the upload component.

---

## 46. Clipboard Utilities

### Purpose

Define utilities for clipboard read/write operations.

### Engineering Rationale

Copy-to-clipboard is used across features: share links, copy event details, copy alumni contact info, copy error messages for support. Without a centralized utility, each feature implements 
avigator.clipboard.writeText() with different error handling and fallback strategies.

### Recommended Option

| Utility | Purpose |
|---|---|
| copyToClipboard(text) | Copy text to clipboard |
| copySuccessMessage(entity) | "Copied to clipboard" feedback |
| isClipboardSupported() | Check clipboard API availability |

**Rules:**

1. copyToClipboard uses the modern 
avigator.clipboard.writeText() API.
2. Falls back to document.execCommand('copy') for older browsers.
3. Returns Promise<boolean> indicating success/failure.
4. Handles SSR gracefully (returns alse if 
avigator is undefined).
5. Does NOT show toast notifications � returns success/failure for the caller to handle.

### Trade-offs

- *Utility-based clipboard* � consistent behavior, error handling, SSR safety.
- *Inline clipboard* � every feature implements the same pattern differently.

### Industry Best Practice


avigator.clipboard.writeText is the modern standard. The fallback (execCommand) is needed for older browsers but is deprecated. The pattern: **modern API with graceful fallback, returned as a promise.**

### Recommendation

Provide copyToClipboard in src/lib/utils/browser.ts (since it has side effects � see section 17). Features call it and handle success/failure feedback themselves.

---

## 47. Browser Utilities

### Purpose

Define utilities that interact with browser APIs � window, navigator, document, cookies, storage.

### Engineering Rationale

Browser interactions (reading cookies, checking device type, detecting online status, triggering fullscreen) are needed across features. Without centralized utilities, each feature checks 	ypeof window !== "undefined" with different patterns.

### Recommended Option

| Utility | Purpose |
|---|---|
| isBrowser() | Check if running in browser |
| isOnline() | Check network status |
| isTouchDevice() | Check touch support |
| isReducedMotion() | Check prefers-reduced-motion |
| isDarkMode() | Check prefers-color-scheme |
| getViewport() | Get viewport dimensions |
| scrollToTop() | Smooth scroll to top |
| openUrl(url, target?) | Open URL in tab |
| eloadPage() | Reload current page |

**Rules:**

1. All browser utilities have SSR guards (	ypeof window === "undefined" -> return 
ull or alse).
2. Browser utilities return values (they do not set up event listeners � that is a Hook's job).
3. isReducedMotion and isDarkMode read from window.matchMedia (snapshot, not reactive).
4. Browser utilities belong in src/lib/utils/browser.ts (all side effects in one file).

### Trade-offs

- *Utility-based browser checks* � SSR-safe, consistent, testable with mock. But snapshot values (like viewport) can be stale.
- *Hook-based browser checks* � reactive, always current. But can only be used in React components.

### Industry Best Practice

@react-hookz/web provides hooks for browser APIs (reactive). The project's browser utilities provide snapshot values. The pattern: **utility for one-time checks, hook for reactive subscriptions.**

### Recommendation

Provide snapshot browser utilities in src/lib/utils/browser.ts. For reactive browser state (viewport changes, online/offline events, media query changes), create hooks in src/hooks/ that compose these utilities.

---

## 48. Storage Utilities

### Purpose

Define utilities for browser storage (localStorage, sessionStorage, cookies).

### Engineering Rationale

Storage access is needed for auth tokens, user preferences, cached data, and feature flags. Without centralized utilities, each feature calls localStorage.getItem() directly with different error handling, serialization, and SSR guards.

### Recommended Option

| Utility | Purpose |
|---|---|
| getLocalItem<T>(key, fallback?) | Type-safe localStorage read |
| setLocalItem<T>(key, value) | Type-safe localStorage write |
| emoveLocalItem(key) | localStorage remove |
| getSessionItem<T>(key, fallback?) | Type-safe sessionStorage read |
| setSessionItem<T>(key, value) | Type-safe sessionStorage write |
| emoveSessionItem(key) | sessionStorage remove |
| getCookie(name) | Cookie read |
| setCookie(name, value, options?) | Cookie write |
| emoveCookie(name) | Cookie remove |

**Rules:**

1. All storage utilities use SSR guards (	ypeof window / 	ypeof document checks).
2. All storage utilities handle localStorage being unavailable (private browsing, storage disabled) gracefully � return fallback, never throw.
3. getLocalItem and getSessionItem deserialize with safeDeserialize (see section 23).
4. setLocalItem and setSessionItem serialize with the application's serializer (see section 22).
5. Storage utilities are side-effectful � they belong in src/lib/utils/browser.ts.

### Trade-offs

- *Utility-based storage* � type-safe, SSR-safe, consistent error handling. But adds a thin layer over native APIs.
- *Native localStorage* � simpler but every consumer must handle serialization, SSR, and errors.

### Industry Best Practice

The useLocalStorage hook pattern (from @react-hookz/web, usehooks-ts) provides reactive storage access. The utility pattern provides imperative storage access. The project needs both: **utilities for non-React code, hooks for React components.**

### Recommendation

Provide imperative storage utilities in src/lib/utils/browser.ts. Provide reactive storage hooks in src/hooks/ that compose these utilities.

---

## 49. Performance Utilities

### Purpose

Define utilities that improve application performance through caching, memoization, and lazy evaluation.

### Engineering Rationale

Performance is a cross-cutting concern. Without centralized performance utilities, each feature implements its own memoization with Map closures, its own debounce with setTimeout/clearTimeout, and its own throttling with timestamp comparison � each with different behaviors.

### Recommended Option

| Utility | Purpose |
|---|---|
| memoize<T>(fn) | Simple argument memoization (one arg) |
| memoizeDeep<T>(fn) | Deep-comparison memoization |
| debounce<T>(fn, ms) | Debounce � calls after delay |
| 	hrottle<T>(fn, ms) | Throttle � calls at most once per interval |
| once<T>(fn) | Execute only once |
| 
oop(...args) | No-operation (placeholder callback) |
| doNothing() | Explicit no-op (readability alias) |

**Rules:**

1. memoize uses a Map with the argument as key (single-argument memoization is the most common pattern).
2. memoizeDeep uses the deepEqual utility (section 38) for composite keys.
3. debounce and 	hrottle return cancelable functions (return { cancel, flush } or a cancel method).
4. once is stateless in the caller's view � the caller cannot detect that execution was cached.
5. Performance utilities are the **only** utilities that maintain internal state (the cache/debounce state is encapsulated in the closure, not exposed).

### Trade-offs

- *Utility-based memoize* � generic, reusable. But single-argument limitation means composite keys require memoizeDeep.
- *Library-based memoize* (Lodash memoize) � supports resolver functions for composite keys. But adds a dependency.

### Industry Best Practice

React's useMemo and useCallback cover component-level memoization. Lodash's memoize, debounce, and 	hrottle cover function-level. The pattern: **React memo for components, utility memo for pure functions.**

### Recommendation

Provide memoize, debounce, 	hrottle, and once in src/lib/utils/performance.ts. Implement them without external dependencies � they are small enough to maintain internally and removing Lodash as a dependency is worth the effort.

---

## 50. Memoization Helpers

### Purpose

Define memoization strategies specifically for React component optimization.

### Engineering Rationale

While memoize (section 49) covers function memoization, React components need prop comparison memoization (React.memo with custom comparator). Without helper utilities, each component defines its own rePropsEqual inline.

### Recommended Option

| Utility | Purpose | Equivalent |
|---|---|---|
| rePropsShallowEqual(prev, next) | React.memo comparator | React.memo(Comp, shallowEqual) |
| rePropsDeepEqual(prev, next) | Deep React.memo comparator | React.memo(Comp, deepEqual) |
| reDepsEqual(a, b) | For useMemo/useCallback deps | Custom comparator |

**Rules:**

1. rePropsShallowEqual is the default React.memo comparator � no need to pass it explicitly.
2. rePropsDeepEqual is for components with complex props (nested objects) that rarely change.
3. reDepsEqual is for useMemo/useCallback when the default Object.is comparison is insufficient.

### Trade-offs

- *Deep prop comparison* � prevents unnecessary re-renders for deeply-nested props. But deep comparison is O(n) and can be slower than re-rendering for simple components.
- *Shallow comparison (default)* � fast, correct for flat props. But causes re-renders for deeply-nested immutable updates.

### Industry Best Practice

React's default memo uses shallow comparison. Libraries like eact-fast-compare provide deep comparison for specific use cases. The pattern: **shallow by default, deep only when measured to be necessary.**

### Recommendation

Provide memoization helpers in src/lib/utils/performance.ts. Use shallow equality as the default. Document that deep equality should be used only when profiling shows a benefit.

---

## 51. Async Utilities

### Purpose

Define utilities for asynchronous operations � sequential execution, concurrent execution with limits, timeout wrapping, polling.

### Engineering Rationale

Async operations are everywhere: data fetching, file uploads, debounced search, polling for updates. Without centralized utilities, each feature implements Promise.all (no error isolation), manual retry logic, or custom timeout wrappers.

### Recommended Option

| Utility | Purpose |
|---|---|
| sleep(ms) | Return promise that resolves after ms |
| 	imeout<T>(promise, ms, error?) | Wraps promise with timeout |
| withRetry<T>(fn, options) | Retry with backoff (see section 53) |
| concurrentPool<T, R>(items, fn, concurrency) | Run async fn with concurrency limit |
| sequential<T, R>(items, fn) | Run async fn sequentially |
| defer<T>() | Create deferred promise (resolve/reject externally) |

**Rules:**

1. sleep is the smallest possible implementation (
ew Promise(r => setTimeout(r, ms))).
2. 	imeout rejects with a TimeoutError if the promise does not settle within ms.
3. concurrentPool processes items in batches � it does not create N promises simultaneously.
4. sequential is equivalent to concurrentPool(items, fn, 1).
5. Async utilities are implemented as pure-promise functions (no Observable, no callback, no EventEmitter).

### Trade-offs

- *Utility-based async helpers* � consistent timeout and concurrency behavior. But simple patterns (like Promise.all) are sufficient for many use cases.
- *Inline async code* � simpler for trivial cases but duplicates concurrency control and timeout logic.

### Industry Best Practice

p-limit provides concurrency-limited promise execution. p-retry provides retry with backoff. The pattern: **small, focused async utilities that compose naturally.**

### Recommendation

Provide async utilities in src/lib/utils/async.ts. Implement sleep, 	imeout, withRetry, and concurrentPool without external dependencies.

---

## 52. Promise Utilities

### Purpose
Define utilities for Promise composition and transformation.

### Engineering Rationale

Promise utilities go beyond basic async helpers � they handle Promise lifecycle (is the promise still pending?), safe handling (catch and return default), and composite operations (race with cleanup).

### Recommended Option

| Utility | Purpose |
|---|---|
| isPromise(value) | Type guard for Promise |
| safePromise<T>(promise) | Catch -> [error, null] | [null, T] |
| promiseFromEvent<T>(target, event) | Promise that resolves on event |
| 
ever() | Promise that never settles (for timeout defaults) |
| immediate<T>(value) | Promise that resolves synchronously |

**Rules:**

1. safePromise returns a tuple [Error | null, T | null] � the go pattern for error handling.
2. promiseFromEvent accepts an EventTarget and event name.
3. immediate uses Promise.resolve(value) for synchronous resolution.
4. Promise utilities are themselves async utilities and belong in the same file.

### Trade-offs

- *Go-style error handling* (safePromise) � explicit, no try/catch needed. But changes the calling convention from idiomatic Promise.
- *Try/catch error handling* � idiomatic JavaScript. But easy to forget try/catch around await.

### Industry Best Practice

Go's (result, error) pattern and Rust's Result<T, E> have inspired safePromise in TypeScript libraries. The pattern: **use safePromise in critical paths where unhandled rejections must be avoided.**

### Recommendation

Provide safePromise and isPromise in src/lib/utils/async.ts. Use safePromise in data access functions and event handlers where error handling is mandatory.

---

## 53. Retry Helpers

### Purpose
Define retry logic with backoff strategies for transient failures.

### Engineering Rationale

Retry logic is needed for: API calls (network flakiness, rate limiting), file uploads (connection drops), optimistic updates (conflict resolution). Without centralized retry logic, each feature implements exponential backoff with different max attempts and jitter strategies.

### Recommended Option

| Utility | Purpose |
|---|---|
| withRetry<T>(fn, options?) | Retry with configurable backoff |
| withExponentialBackoff<T>(fn, options?) | Exponential backoff (base delay doubles) |
| withLinearBackoff<T>(fn, options?) | Linear backoff (constant delay between retries) |
| calculateBackoff(attempt, baseMs, strategy?) | Calculate delay for given attempt |
| jitter(delay) | Add randomness to delay |

**Rules:**

1. All retry helpers are built on the same core withRetry function.
2. Default: 3 attempts, 1s base delay, exponential backoff, no jitter.
3. etryIf allows selective retry (e.g., only retry on network errors, not 4xx responses).
4. onRetry allows logging or metrics collection without coupling to the logging utility.
5. Retry helpers are pure in the sense that they compose async functions � they do not call APIs directly.

### Trade-offs

- *Utility-based retry* � consistent backoff strategy, configurable per use case. But adds complexity for operations that should not retry.
- *Promise.catch with retry* � simple, but duplicates backoff logic.

### Industry Best Practice

p-retry is the most popular retry library for promises. AWS SDK uses exponential backoff with jitter. The pattern: **exponential backoff with full jitter** is the industry standard for network retry.

### Recommendation

Provide retry helpers in src/lib/utils/async.ts. Use exponential backoff with full jitter as the default. Feature-specific retry policies (which errors to retry, how many times) in feature _utils/.

---

## 54. Debounce and Throttle Strategy

### Purpose
Define when to use debounce vs throttle and the specific implementation strategy.

### Engineering Rationale

Debounce and throttle are commonly confused. Developers use one when they should use the other, or implement both with different timing behaviors. A clear strategy prevents these errors.

### Recommended Option

**When to use each:**

| Pattern | Behavior | Use Case |
|---|---|---|
| **Debounce** | Wait for pause, then execute | Search-as-you-type (wait for user to stop typing) |
| **Throttle** | Execute at most once per interval | Scroll/resize handlers, progress updates |
| **Debounce (leading)** | Execute immediately, then debounce | Submit buttons (prevent double-click) |
| **Throttle (trailing)** | Throttle, but execute trailing edge | Auto-save (save periodically AND on pause) |

**Decision tree:**

`
Is the function called in response to a user action?
+-- Yes -> Can the user perform the action multiple times quickly?
|   +-- Yes (typing, clicking) -> Debounce
|   +-- No (scrolling, resizing) -> Throttle
+-- No (system event, timer) -> Neither, or throttle
`

**Rules:**

1. Debounce defaults to trailing edge (execute after pause).
2. Throttle defaults to leading edge (execute immediately, then block).
3. Both return a cancelable wrapper function.
4. Both accept an optional AbortSignal for cancellation.
5. Debounce and throttle are side-effectful � clearly documented in JSDoc.

### Trade-offs

- *Trailing debounce* � waits for pause, then executes. Natural for search but introduces delay before action.
- *Leading debounce* � executes immediately, then debounces. Good for submit buttons but delays the trailing execution.

### Industry Best Practice

Lodash's debounce and 	hrottle are the reference implementations. The pattern: **trailing debounce for input, leading throttle for events, leading debounce for actions.**

### Recommendation

Implement debounce and throttle in src/lib/utils/performance.ts with the same interface as Lodash (but without the Lodash dependency). Document the usage decision tree in JSDoc.

---

## 55. Error Utilities

### Purpose
Define utilities for error handling � error creation, classification, formatting, and safe execution.

### Engineering Rationale

Error handling in frontend applications is inconsistent: some errors are strings, some are Error instances, some have codes, some don't. Without centralized error utilities, error handling is a mix of if (error) checks, instanceof tests, and string matching.

### Recommended Option

| Utility | Purpose |
|---|---|
| getErrorMessage(error) | Extract message from any error shape |
| getErrorCode(error) | Extract code from typed error |
| isAppError(error) | Type guard for application errors |
| isNetworkError(error) | Type guard for fetch/network errors |
| isAuthError(error) | Type guard for auth errors |
| isRateLimitError(error) | Type guard for rate limit errors |
| createAppError(code, message, details?) | Create typed application error |
| safeExecute<T>(fn) | Try/catch wrapper -> Result<T> |
| 	hrowIfNull<T>(value, message) | Assert non-null or throw |

**Rules:**

1. getErrorMessage handles Error, string, { message: string }, unknown � always returns a string.
2. safeExecute returns { success: true, data: T } | { success: false, error: AppError }.
3. Error utilities are pure (they process error objects but never throw themselves in the utility).
4. All error utilities handle 
ull and undefined inputs gracefully.

### Trade-offs

- *Typed error utilities* � consistent error handling, type guard discrimination. But requires all errors to conform to the application error shape.
- *Raw error handling* � simpler, but every consumer must handle different error shapes.

### Industry Best Practice

Stripe's SDK uses typed errors with codes. Apollo Client uses GraphQLError with typed extensions. The pattern: **typed errors with codes, standard message extraction utility, Result type for safe execution.**

### Recommendation

Provide error utilities in src/lib/utils/error.ts. Integrate with the error types defined in Stage 10. Use safeExecute as the primary pattern for async operations that can fail.

---

## 56. Logging Helpers

### Purpose
Define utilities for structured logging in the frontend application.

### Rationale

Frontend logging is either nonexistent (errors swallowed) or inconsistent (some console.log, some console.error, some console.warn). Without a logging utility, developers cannot control log levels, filter logs in production, or send logs to monitoring services.

### Recommended Option

| Utility | Purpose |
|---|---|
| logger.debug(message, data?) | Development-only debug log |
| logger.info(message, data?) | Informational log |
| logger.warn(message, data?) | Warning log |
| logger.error(message, data?) | Error log |
| setLogLevel(level) | Dynamically set minimum log level |

**Log levels:** DEBUG (0) -> INFO (1) -> WARN (2) -> ERROR (3) -> NONE (4)

**Rules:**

1. logger is a singleton object with level-gated methods.
2. debug logs are stripped in production builds (tree-shaken).
3. warn and error logs are always visible (in dev and prod).
4. logger.error also sends to the configured monitoring service (Sentry, etc.) in production.
5. The logger is imported as import { logger } from "@/lib/utils/logger".

### Trade-offs

- *Singleton logger* � globally configurable, consistent format. But cannot be tree-shaken per-feature.
- *console.* � no abstraction, no configuration. But always available and requires no imports.

### Industry Best Practice

Consola, pino/browser, and Sentry's capture methods are the industry standards. The pattern: **a thin logger wrapper that delegates to console in dev and to monitoring in prod.**

### Recommendation

Provide a logger utility in src/lib/utils/logger.ts. It wraps console in development and delegates to the monitoring service (Sentry) in production.

---

## 57. Security Helpers

### Purpose
Define utilities for client-side security � sanitization, encoding, CSP helpers.

### Engineering Rationale

Client-side security is often overlooked: user-generated content rendered as HTML (XSS risk), sensitive data in URLs (leak via referrer), insecure token storage. Without centralized security helpers, each feature may inadvertently introduce vulnerabilities.

### Recommended Option

| Utility | Purpose |
|---|---|
| sanitizeHtml(str) | Strip HTML tags (prevent XSS) |
| sanitizeUrl(url) | Block javascript: URLs and XSS in href |
| escapeHtml(str) | Encode HTML entities |
| ase64Encode(str) | Base64 encode |
| ase64Decode(str) | Base64 decode |
| isSecureContext() | Check HTTPS + secure context |
| stripCredentials(url) | Remove credentials from URL for logging |

**Rules:**

1. sanitizeHtml strips all HTML tags (not a rich-text sanitizer) � used for plain-text display of user content.
2. sanitizeUrl blocks javascript:, data:, bscript: protocols in href/src attributes.
3. sanitizeUrl allows only http:, https:, mailto:, 	el: protocols.
4. Security helpers are pure and never connect to external services.

### Trade-offs

- *Client-side sanitization* � defense-in-depth, prevents accidental XSS. But cannot replace server-side sanitization (client can be bypassed).
- *Server-side-only sanitization* � correct approach, but client may render untrusted data before server validation.

### Industry Best Practice

DOMPurify is the standard for client-side HTML sanitization. The pattern: **strip HTML for plain-text display, use DOMPurify for rich-text rendering, always sanitize on the server.**

### Recommendation

Provide security helpers in src/lib/utils/security.ts. For HTML stripping (no rich text), implement a simple tag stripper. For rich-text rendering, use DOMPurify as a feature dependency. Never render user-generated HTML without sanitization.

---

## 58. Accessibility Helpers

### Purpose
Define utilities for accessibility � ARIA attribute helpers, focus management, keyboard navigation support.

### Engineering Rationale

Accessibility is a cross-cutting concern. Without centralized helpers, accessibility attributes are applied inconsistently � some components have ria-label, some don't; keyboard navigation works in one feature but not another; focus management is ad-hoc.

### Recommended Option

| Utility | Purpose |
|---|---|
| generateAriaId(prefix) | Generate unique ARIA ID |
| mergeAriaProps(base, overrides) | Merge ARIA props safely |
| getFocusableElements(container) | Query focusable children |
| 	rapFocus(container, options?) | Trap focus within container |
| nnounceToScreenReader(message, priority?) | Live region announcement |
| isKeyboardEvent(event) | Check if event was keyboard-triggered |

**Rules:**

1. Accessibility helpers are SSR-safe (no DOM access in generateAriaId, guard DOM access in others).
2. nnounceToScreenReader uses a live region element (creates one if not exists).
3. 	rapFocus handles Tab and Shift+Tab cycling, Escape to close.
4. Accessibility helpers are pure or have managed side effects (documented).

### Trade-offs

- *Utility-based a11y* � consistent focus management and ARIA patterns. But DOM-traversal utilities are harder to test than pure functions.
- *Component-based a11y* � Radix UI provides accessible primitives. But the project's shared components may not use Radix for everything.

### Industry Best Practice

Radix UI and Reach UI provide accessible primitives with built-in focus management and ARIA attributes. The pattern: **use accessible component libraries for complex patterns (dialog, menu, tabs), use utilities for simple patterns (focus trap, aria IDs).**

### Recommendation

Provide accessibility utilities in src/lib/utils/a11y.ts. Focus management is the primary use case that cannot be delegated entirely to component libraries.

---

## 59. Internationalization Helpers

### Purpose
Define utilities that support i18n workflows � locale detection, pluralization, number formatting.

### Engineering Rationale

The project uses 
ext-intl for translation. However, 
ext-intl handles message translation, not the supporting utilities: detecting the user's locale, formatting numbers/currencies per locale, pluralization rules, and date formatting with locale awareness.

### Recommended Option

| Utility | Purpose |
|---|---|
| getBrowserLocale() | Detect locale from browser/navigator |
| getPreferredLocale(userPref, browserLocale, default) | Locale resolution chain |
| ormatList(items, locale, style?) | Locale-aware list formatting |
| ormatNumberWithLocale(n, locale, options?) | Locale-aware number |
| ormatRelativeTime(n, unit, locale) | "2 days ago" with locale |
| pluralRules(count, locale) | Get plural category for locale |

**Rules:**

1. All i18n helpers use Intl APIs (not manual implementations).
2. getBrowserLocale reads from 
avigator.language or 
avigator.languages.
3. Locale resolution chain: user preference -> browser locale -> default locale (from constants).
4. I18n helpers are pure (except getBrowserLocale which reads 
avigator).

### Trade-offs

- *Intl-based i18n helpers* � correct, built-in, no extra dependencies. But older browsers may not support all Intl features.
- *Library-based i18n helpers* (Luxon, globalize) � comprehensive but add dependencies.

### Industry Best Practice

All modern browsers support Intl fully. The pattern: **use Intl APIs for formatting, use next-intl for message translation.**

### Recommendation

Provide i18n helpers in src/lib/utils/i18n.ts that wrap Intl APIs. These utilities are imported by formatting utilities (date, number, currency) and by feature components for locale-aware display.

---

## 60. Feature-Specific Utilities

### Purpose
Define the guidelines for utilities that are specific to a single feature.

### Engineering Rationale

Feature utilities represent the boundary between shared generic logic and domain-specific logic. Without clear guidelines, feature teams either put domain logic in shared utilities (polluting the shared layer) or inline domain logic in components (making it untestable).

### Recommended Option

**Feature utilities live in src/features/<feature>/_utils/ and are the default location for any utility that references feature types or constants.**

**What belongs in feature utilities:**

1. Formatting with feature types: ormatAlumniName(alumni: Alumni): string
2. Status calculations: getEventStatus(event: Event): EventStatus
3. Permission checks: canEditProfile(user: SessionUser, profile: Profile): boolean
4. Feature-specific validators: isValidGraduationYear(year: number): boolean
5. Feature-specific transformers: lumniToTableRow(alumni: Alumni): TableRow
6. Wrappers around shared utilities: ormatEventDate = (d: Date) => formatDate(d, 'PP')

**What does NOT belong in feature utilities:**

1. Business logic that involves multiple features (needs cross-feature coordination -> Service).
2. API calls (Data layer).
3. React hooks (Hook layer).
4. State management (Store layer).

### Trade-offs

- *Feature _utils/* � clear ownership, easy promotion. But adds a directory per feature.
- *Shared utils with feature overloads* � fewer files, but shared utils accumulate domain knowledge.

### Industry Best Practice

Feature-sliced design and NX monorepos both recommend feature-scoped utility directories. The pattern: **shared for generic, feature for domain-specific, never mix.**

### Recommendation

Every feature must have a _utils/ directory. The directory signals that the feature has extracted logic. When 3+ features have the same utility, promote to shared.

---

## 61. Shared Utilities

### Purpose
Define the approach for utilities used by multiple features.

### Engineering Rationale

Shared utilities are the most visible part of the utility layer. They must be well-documented, well-tested, and stable. Their API surface must be designed for long-term use.

### Recommended Option

**Shared utilities are created through promotion (section 9) or by architecture team mandate.**

**Characteristics:**

- Zero domain knowledge.
- Fully generic with type parameters.
- 100% test coverage, including edge cases.
- JSDoc with @param, @returns, @example.
- Stable API � breaking changes go through deprecation lifecycle.

**Explicit list of planned shared utility files:**

| File | Content | Priority |
|---|---|---|
| cn.ts | className utility (exists: cn()) | Existing |
| string.ts | 12 string manipulation utilities | High |
| 
umber.ts | 8 computation + 3 formatting utilities | High |
| date/format.ts | 4 date display utilities | High |
| date/parse.ts | 2 date parsing utilities | High |
| date/arithmetic.ts | 5 date math utilities | Medium |
| collection.ts | Objet + array utilities (pick, omit, groupBy, etc.) | High |
| sort.ts | 7 sorting utilities | Medium |
| ilter.ts | 5 filter utilities with composeFilters | Medium |
| pagination.ts | 5 pagination utilities | Medium |
| url.ts | 7 URL utilities | High |
| alidation.ts | 10 validation helper predicates | Medium |
| compare.ts | 5 comparator factories | Low |
| equal.ts | 2 equality check utilities | High |
| 
ormalize.ts | 6 normalization utilities | Low |
| mapping.ts | 4 mapping helper utilities | Medium |
| conversion.ts | 9 conversion utilities | Low |
| generate.ts | 5 generator utilities | Low |
| andom.ts | 7 randomization utilities | Low |
| id.ts | 5 identifier utilities | Medium |
| ile.ts | 6 file utilities | Low |
| rowser.ts | 9 browser + storage + clipboard utilities | Medium |
| performance.ts | 7 performance utilities (memoize, debounce, throttle) | High |
| sync.ts | 6 async + promise utilities | High |
| error.ts | 9 error utilities | High |
| logger.ts | logger singleton | High |
| security.ts | 7 security utilities | Medium |
| 11y.ts | 6 accessibility utilities | Low |
| i18n.ts | 6 internationalization helpers | Low |
| 	esting.ts | Test factories and mock generators | Medium |
| serialization.ts | serialize/deserialize pair | Low |

### Trade-offs

- *Comprehensive shared library* � covers all common needs, single import source. But requires significant initial implementation effort.
- *Incremental shared library* � add utilities as needed. But lacks coherence and may miss obvious shared patterns.

### Recommendation

Implement the high-priority utilities first (12 files). Add medium-priority as features require them. Low-priority utilities are created on demand.

---

## 62. Testing Utilities

### Purpose
Define utilities specifically for testing � factories, generators, assertions.

### Engineering Rationale

Testing utilities reduce boilerplate in test files. Without them, every test file duplicates const mockUser = { id: '...', name: '...' } with different field sets. This creates brittle tests that break when domain types change.

### Recommended Option

| Utility | Purpose |
|---|---|
| createMockUser(overrides?) | Create mock User with defaults |
| createMockAlumni(overrides?) | Create mock Alumni with defaults |
| createMockEvent(overrides?) | Create mock Event with defaults |
| createMockJob(overrides?) | Create mock Job with defaults |
| mockPageMeta(overrides?) | Create mock pagination metadata |
| mockApiResponse<T>(data, overrides?) | Create mock API response wrapper |
| ange(start, end) | Generate array of sequential numbers |
| epeat<T>(value, n) | Generate array of repeated value |

**Rules:**

1. Test utilities are exported from src/lib/utils/testing.ts.
2. Mock factories use Partial<T> overrides with spread defaults (Object.assign pattern but immutable).
3. Test utilities never import from i or jest � they remain framework-agnostic.
4. Mock factories produce **valid domain types** that pass Zod validation.

### Trade-offs

- *Centralized test utilities* � single source of truth for mock data. When a domain type changes, one file updates all tests. But may encourage overuse of default mocks that hide test intent.
- *Inline mock data* � each test defines what it needs. More explicit but more brittle to type changes.

### Industry Best Practice

The Factory pattern (from test-data-bot, Fishery) is the industry standard for test data generation. The pattern: **factory functions with sensible defaults and partial overrides.**

### Recommendation

Provide mock factories in src/lib/utils/testing.ts. Use the Partial override pattern. Update factories when domain types change � this single update cascade-fixes all tests that use the factory.

---

## 63. Mock Utilities

### Purpose
Define how to mock external dependencies in tests � API responses, browser APIs, third-party libraries.

### Engineering Rationale

Every test file that involves API calls, browser APIs, or third-party libraries needs mocking. Without standardized mock utilities, each test file duplicates i.spyOn(global, 'fetch') or window.localStorage setup/teardown.

### Recommended Option

| Utility | Purpose |
|---|---|
| mockFetch(response) | Mock global.fetch with typed response |
| mockFetchError(status, message) | Mock failed fetch response |
| mockLocalStorage(storage) | Mock localStorage with initial state |
| mockMatchMedia(query, matches) | Mock window.matchMedia result |
| mockIntersectionObserver() | Mock IntersectionObserver |
| mockRouter(url?) | Mock Next.js router |
| mockDate(isoDate) | Mock system date for deterministic tests |

**Rules:**

1. Mock utilities handle setup AND teardown (return unmock() function).
2. Mock utilities are framework-agnostic � they work with Vitest, Jest, or any test runner.
3. Mock utilities belong in src/lib/utils/testing.ts.

### Trade-offs

- *Centralized mocks* � consistent fetch/router mocking. But mocking the same thing differently in different tests is not possible.
- *Inline mock setup* � complete flexibility. But duplicates setup code and risks inconsistent mocking.

### Industry Best Practice

MSW (Mock Service Worker) is the modern standard for API mocking. For browser APIs, i.stubGlobal provides the pattern. The recommendation: **MSW for API mocking, utility functions for browser API mocking.**

### Recommendation

Provide mock utilities for browser APIs in src/lib/utils/testing.ts. Use MSW for API mocking at the test setup level (not utility level).

---

## 64. Documentation Strategy

### Purpose
Define how utilities are documented for discoverability and correct usage.

### Engineering Rationale

Without documentation, developers cannot discover utilities, understand their contracts, or know when to use which variant. The result: duplicated utilities and inconsistent usage patterns.

### Recommended Option

**Three tiers of documentation:**

| Tier | What | Format | Location |
|---|---|---|---|
| **API docs** | Per-function contract | JSDoc (@param, @returns, @example) | Inline above each function |
| **Module docs** | Domain overview, conventions, edge cases | File-level JSDoc | Top of each .ts file |
| **Index docs** | Directory listing with one-line descriptions | README or index.ts barrel | src/lib/utils/README.md or index.ts |


**JSDoc requirements for every shared utility:**

`	ypescript
/**
 * Truncates a string to the specified length, appending an ellipsis.
 *
 * @param str - The string to truncate.
 * @param maxLength - Maximum character count (default: 100).
 * @param ellipsis - Truncation suffix (default: "...").
 * @returns The truncated string, or the original if shorter than maxLength.
 *
 * @example
 * truncate("Hello World", 5) // => "Hello..."
 * truncate("Hi", 10) // => "Hi"
 */
`

**Rules:**

1. Every shared utility must have full JSDoc.
2. Feature utilities should have at minimum a one-line description.
3. Deprecated utilities must have @deprecated with migration path.
4. Side-effectful files must have SIDE EFFECTS in the file-level JSDoc.
5. @example is required for any utility where the usage is not obvious from the signature.

### Trade-offs

- *Full JSDoc* � complete documentation, IDE integration, typedoc support. But high effort to maintain.
- *Minimal JSDoc* � easier to write, but developers must read the implementation to understand behavior.

### Industry Best Practice

TypeScript's own standard library JSDoc, Lodash's documentation, and date-fns's documentation are the reference standards. All three include @param, @returns, and @example.

### Recommendation

Full JSDoc for all shared utilities. One-line JSDoc for feature utilities. The @example tag is mandatory � it serves as the primary documentation for most developers.

---

## 65. Governance Strategy

### Purpose
Define the governance process for utility creation, modification, and removal.

### Engineering Rationale

Without governance, the utility layer becomes a dumping ground. Anyone can add any function, duplicates proliferate, and the layer loses coherence. Governance ensures the utility layer remains clean, discoverable, and maintainable.

### Recommended Option

**Governance rules:**

| Action | Shared Utility | Feature Utility |
|---|---|---|
| **Create** | Architecture review + issue | Feature team, self-review |
| **Modify** | Architecture review + PR | Feature team, peer review |
| **Deprecate** | Issue + PR with @deprecated | Feature team, PR |
| **Remove** | Issue + no remaining imports | Feature team, PR |

**Automated governance (ESLint):**

| Rule | Target | Behavior |
|---|---|---|
| 
o-restricted-imports | Deprecated utility paths | Warn |
| oundaries/module-boundaries | Shared utils importing features | Error |
| oundaries/module-boundaries | Feature utils importing other features | Error |
| 
o-param-reassign | All utility files | Error |
| prefer-spread | All utility files | Error |
| prefer-object-spread | All utility files | Error |
| 
o-let (configurable) | Shared utility files | Error (if configured) |

**Manual governance checklist for PRs:**

1. Does this utility duplicate an existing one? (run grep)
2. Does this utility belong in shared or feature? (promotion signals)
3. Is this utility pure? (if not, is the impurity documented?)
4. Does this utility have tests? (100% coverage for shared, 80% for feature)
5. Does this utility have JSDoc? (full for shared, one-line for feature)
6. Is this utility generic where possible? (type parameters vs concrete types)
7. Does this utility follow the naming convention? (verb-first camelCase)

### Trade-offs

- *Strict governance* � maintains layer quality but slows down utility creation.
- *Loose governance* � faster, but quality degrades over time.

### Industry Best Practice

Google's monorepo uses automated code review bots (like Tricorder) that check utility-specific rules. Nx uses module boundary enforcement. The pattern: **automate what you can, review what you must.**

### Recommendation

Automate all checks that can be automated (ESLint rules). Require architecture review for shared utilities. Feature utilities are self-governed by feature teams.

---

## 66. Deprecation Strategy

### Purpose
Define the process for deprecating utilities that are no longer needed or have been superseded.

### Engineering Rationale

Utilities accumulate. Dead utilities create confusion: developers are uncertain whether to use the deprecated one or the replacement. A clear deprecation strategy removes this uncertainty.

### Recommended Option

**Two-release deprecation cycle (consistent with Stage 11):**

`
Release N:  Add @deprecated tag, create replacement, update callers
Release N+1: Add console.warn in dev mode (sunset phase)
Release N+2: Remove utility (must verify zero imports)
`

**Deprecation JSDoc format:**

`	ypescript
/**
 * @deprecated Use ormatDate with the PP option instead.
 * This utility will be removed in v2.1.0.
 * Migration: ormatEventDate(event.date) -> ormatDate(event.date, "PP")
 */
export function formatEventDate(date: Date): string {
  return formatDate(date, "PP");
}
`

**Rules:**

1. Every deprecated utility must specify the replacement and migration path.
2. Internal migration: update all callers within the same release cycle (not spread across releases).
3. External callers (other features): give 2 release cycles of the deprecation period.
4. ESLint 
o-restricted-imports warns on deprecated imports after 1 release cycle, errors after 2.

### Recommendation

Use the same 2-release cycle established in Stage 11. Integrate with ESLint to enforce the deprecation window.

---

## 67. Versioning Strategy

### Purpose
Define how utility API changes are versioned and communicated.

### Engineering Rationale

The utility layer is consumed by every feature. Breaking changes ripple everywhere. Without a versioning strategy, developers are surprised when their build breaks after a utility change.

### Recommended Option

**Semantic versioning within the mono-repo, communicated via changelog:**

| Change Type | How Communicated | Migration Required? |
|---|---|---|
| **Add** (new utility) | PROMOTIONS.md entry | No |
| **Deprecate** | @deprecated JSDoc + PROMOTIONS.md | Yes (eventually) |
| **Modify** (new parameter, wider types) | Usually backward-compatible | No (unless it breaks the contract) |
| **Breaking** (remove, rename, change signature) | Must go through deprecation cycle | Yes |

**Backward compatibility guarantees:**

1. Adding an optional parameter is NOT breaking (callers with 1 arg still work).
2. Adding an overload is NOT breaking (existing calls resolve to the old signature).
3. Changing a parameter type (widening: string -> string | null) is NOT breaking (existing strings pass).
4. Changing a return type (narrowing) IS breaking (callers may use removed properties).
5. Renaming IS breaking (must go through deprecation cycle).
6. Removing IS breaking (must go through deprecation cycle).

### Recommendation

Follow the backward compatibility rules. Breaking changes go through the full deprecation lifecycle. All changes are recorded in PROMOTIONS.md or the project CHANGELOG.


---

## 72. Engineering Review

### Purpose

Provide a comprehensive architectural review of the Utility Layer specification.

### Architecture Analysis

**Strengths:**

1. **Clear utility philosophy.** The litmus test (React-independent, state-independent, API-independent) provides an unambiguous decision framework.
2. **Two-tier structure.** Shared utilities (domain-neutral) and feature utilities (domain-aware) prevent business logic leaks.
3. **12-category classification.** Covers all utility types needed without overlapping categories.
4. **Promotion/demotion lifecycle.** The 3-signal promotion rule and demotion rule prevent both premature abstraction and cruft.
5. **Side-effect segregation.** All side-effectful utilities in `browser.ts` makes the purity boundary explicit.

**Risks:**

1. **Governance overhead.** Shared utility creation requires architecture review, a potential bottleneck as the team grows.
2. **File count.** 30+ shared utility files plus feature _utils/ directories creates file system surface area.
3. **Discipline dependency.** The architecture relies on developers following rules � no tool can enforce all seven characteristics.

### Dependency Analysis

**Clean:** Shared utilities import only from types (compile-time) and constants (pure values). Never from features, hooks, stores, or data layers.

**Unidirectional:** Feature utilities -> Shared utilities -> Constants -> Types. No circular dependencies.

### Reusability Analysis

**High reusability:** Generic type parameters ensure maximum reuse. Every shared utility works for any feature.

**Moderate reusability in practice:** The 3-occurrence promotion rule means some duplication before promotion. This is the intended trade-off against premature abstraction.

### Maintainability Analysis

**Low coupling:** Each utility file is independent. Utilities compose naturally through function calls.

**High cohesion:** Utilities grouped by domain. Each file has a single responsibility.

**80-line limit:** Hard limit prevents the dumping ground problem.

**Test compatibility:** Pure functions are the easiest code to test � no mocking, no setup, no teardown.

### Performance Considerations

The utility layer introduces negligible overhead. All performance-critical considerations:

- **Bundle size:** Named exports are tree-shaken. Unused utilities have zero cost.
- **Execution speed:** Native methods used where possible.
- **Memoization:** Expensive transforms cache results.
- **Garbage collection:** Immutable operations create new objects. For hot paths, ES2023 mutative alternatives are documented.

### Scalability Analysis

Scales to 50+ features: shared utility files grow sub-linearly, feature _utils/ scales 1:1, flat directory structure, barrel index, pattern-based ESLint rules.

**Potential bottleneck:** Architecture review for shared utilities at scale. Mitigation: trivial additions may skip review.

### Testing Considerations

- Shared utilities: 100% coverage target.
- Feature utilities: 80% coverage target.
- No mocking required for pure utilities.
- Mock utilities provided for browser/storage/async functions.

### Future Expansion Recommendations

1. **Utility explorer.** Generated documentation page with search, examples, and usage statistics.
2. **Usage tracking.** Script to detect 0-caller utilities for deprecation.
3. **Automated promotion detection.** Script scanning feature _utils/ for 3+ identical copies.
4. **Bundle size budget.** CI check warning at 20KB gzipped for src/lib/utils/.
5. **TypeDoc integration.** Generate API documentation from JSDoc.
6. **Smoke tests.** Script importing every utility to catch broken exports.

---

## Self-Validation

| Check | Status |
|---|---|
| Utility boundaries clearly defined | Yes |
| Business logic excluded from utilities | Yes |
| Dependency rules prevent architectural violations | Yes |
| Pure function principles established | Yes |
| Promotion rules defined | Yes |
| Governance strategy complete | Yes |
| Performance considerations addressed | Yes |
| Scalability supported | Yes |
| Maintainability ensured | Yes |
| Recommendations technically justified | Yes |

