<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Key Next.js 16 changes:

- Turbopack is DEFAULT (no `--turbopack` flag needed)
- `middleware.ts` → `proxy.ts`
- All request APIs (`cookies`, `headers`, `params`, `searchParams`) are ASYNC only
- ESLint flat config is the format (`eslint.config.mjs`)
- `next lint` command is REMOVED — use `npx eslint .` directly
- `images.domains` → `images.remotePatterns`

<!-- END:nextjs-agent-rules -->

# JJCET Alumni Website — Environment Layer (Stage 1)

**Status:** Frozen

## Project Structure

```
client/
├── src/
│   ├── app/           # Stage 2: Routing Layer
│   ├── features/      # Stage 5: Feature Layer
│   ├── components/    # Stage 9: Shared Component Layer
│   ├── sections/      # Stage 6: Section Layer
│   ├── lib/           # Stage 12: Utility Layer + Stage 13: Data/API Layer
│   ├── stores/        # Stage 15: State Layer
│   ├── hooks/         # Stage 14: Hook Layer
│   ├── types/         # Stage 10: Type Layer
│   ├── constants/     # Stage 11: Constants Layer
│   └── config/        # Environment configuration
├── e2e/               # Playwright E2E tests
├── tests/             # Vitest setup
├── messages/          # next-intl translation files
├── stories/           # Storybook stories
├── docs/adr/          # Architecture Decision Records
├── public/            # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
└── [config files]     # Root configuration
```

## Build Order (Remaining Stages)

1. ✅ **Stage 0** — Project Foundation (frozen)
2. ✅ **Stage 1** — Environment Layer (current, frozen)
3. ⏳ **Stage 2** — Routing Layer (next: App Router, route groups, page.tsx stubs)
4. 🔲 **Stage 3** — Layout Layer (root, public, auth, dashboard, admin layouts)
5. 🔲 **Stage 4** — Page Layer (page.tsx files with composed sections)
6. 🔲 **Stage 5** — Feature Layer (auth, alumni, events, admin features)
7. 🔲 **Stage 6** — Section Layer (Hero, Features, Testimonials, etc.)
8. ✅ **Stage 7** — Feature Component Layer
9. ✅ **Stage 8** — Styling Layer (semantic tokens in globals.css, 6 components refactored)
10. ✅ **Stage 9** — Shared Component Layer (ADR spec, lifecycle tags, ESLint boundaries, registry)
11. ✅ **Stage 10** — Type Layer (ADR spec, @types/ structure with Zod, branded IDs, type pipeline)
12. ✅ **Stage 11** — Constants Layer
13. ✅ **Stage 12** — Utility Layer (ADR spec, barrel, 29 shared utility files, 16 feature _utils directories)
14. ✅ **Stage 13** — Data / API Layer (ADR spec, 67 sections, fully implemented)
15. ✅ **Stage 14** — Hook Layer (ADR spec, barrel, 11 high-priority hooks, 16 feature _hooks/)
16. ✅ **Stage 15** — State Layer (ADR spec, global stores, event bus, store factory, store hydrator)
17. ✅ **Stage 16** — Service Layer (ADR spec, infra services, shared services, auth/events/directory feature services)
18. ✅ **Stage 17** — Security Layer (ADR spec, 50 sections, ~100 KB)
19. 🔲 **Stage 18** — Performance Layer (next)
18. 🔲 **Stage 17** — Performance Layer
19. 🔲 **Stage 18** — Accessibility Layer
20. 🔲 **Stage 19** — Testing Layer
21. 🔲 **Stage 20** — Deployment Layer
22. 🔲 **Stage 21** — Monitoring & Observability

## Conventions

- **Directories:** `kebab-case`
- **React components:** `PascalCase.tsx`
- **Hooks:** `camelCase.ts`
- **Utilities:** `camelCase.ts`
- **Types:** `PascalCase.ts`
- **Constants (file):** `SCREAMING_SNAKE_CASE.ts`
- **Test files:** `*.test.tsx` or `*.spec.ts`

## Key Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run lint:biome   # Biome check
npm run format       # Prettier
npm run typecheck    # TypeScript check
npm test             # Unit tests
npm run test:e2e     # E2E tests
npm run storybook    # Storybook
```
