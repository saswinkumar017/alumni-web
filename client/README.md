# JJCET Alumni Website — Development Guide

## Prerequisites

- Node.js 20.9+
- npm 10+

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Script                    | Description               |
| ------------------------- | ------------------------- |
| `npm run dev`             | Start development server  |
| `npm run build`           | Production build          |
| `npm run start`           | Start production server   |
| `npm run lint`            | Run ESLint                |
| `npm run lint:fix`        | Fix ESLint issues         |
| `npm run lint:biome`      | Run Biome check           |
| `npm run format`          | Format code with Prettier |
| `npm run format:check`    | Check formatting          |
| `npm run typecheck`       | TypeScript type check     |
| `npm test`                | Run Vitest unit tests     |
| `npm run test:watch`      | Watch mode                |
| `npm run test:coverage`   | Coverage report           |
| `npm run test:e2e`        | Playwright E2E tests      |
| `npm run storybook`       | Start Storybook           |
| `npm run build-storybook` | Build Storybook           |

## Project Structure

```
src/
├── app/           # App Router (routing, layouts, pages)
├── features/      # Business feature modules
├── components/    # Shared UI components
├── sections/      # Reusable page sections
├── lib/           # Utility functions
├── hooks/         # Shared React hooks
├── stores/        # Global state (Zustand)
├── types/         # Shared TypeScript types
├── constants/     # Application constants
└── config/        # Configuration modules
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values.

Key variables:

- `NEXT_PUBLIC_API_BASE_URL` — Backend API URL
- `NEXT_PUBLIC_APP_URL` — Public application URL
- `SENTRY_DSN` — Sentry error tracking DSN
