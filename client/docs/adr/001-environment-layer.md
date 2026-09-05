# ADR 001: Environment Layer Decisions

**Status:** Accepted

## Context

The project required a complete, production-ready development environment before any code could be written. Key decisions were needed for tooling, configuration, and dependency management.

## Decision

### Package Manager

- **npm** chosen (not pnpm/yarn) per Foundation specification

### Build System

- **Turbopack** used as default (Next.js 16 default). No webpack customization.

### Linting & Formatting

- **ESLint 9** with flat config for JS/TS linting (Next.js + Storybook plugins)
- **Biome** for additional linting rules (complementary to ESLint)
- **Prettier** for formatting (Biome formatter disabled to avoid conflicts)

### Path Aliases

- `@/*` maps to `./src/*` as specified

### Tailwind CSS v4

- Using `@tailwindcss/postcss` plugin for PostCSS integration
- CSS-first configuration (no `tailwind.config.ts`) per v4 conventions
- Design tokens defined as CSS custom properties in `globals.css`

### Internationalization

- `next-intl` v4 with `app/[locale]` routing pattern
- JSON message files in `messages/` directory

### Error Monitoring

- Sentry configured for client, server, and edge runtimes
- Instrumentation hook (`instrumentation.ts`) for server-side init

### Testing

- Vitest for unit/integration tests with jsdom environment
- React Testing Library for component tests
- Playwright for E2E tests
- Storybook test runner via `@storybook/addon-vitest`

## Consequences

- **Positive:** Clean separation of concerns — each tool handles its specific domain
- **Positive:** No webpack lock-in — Turbopack provides future-proof builds
- **Positive:** ESLint + Biome provides defense-in-depth for code quality
- **Positive:** Storybook + Vitest integration reduces test configuration overhead
- **Trade-off:** Maintaining both ESLint and Biome configs adds some overhead
- **Trade-off:** Tailwind v4 CSS-first config differs from v3 JS config — team needs to learn new pattern
