# Project Overview — JJCET Alumni Web

## What Is This Project?

A full-stack web application connecting alumni of JJCET (a college). It has **4 user roles**, each with its own portal:

| Role | Portal | Purpose |
|------|--------|---------|
| **Developer** | `/developer` | Platform owner — manages everything: config, users, RBAC, CMS, audit |
| **Admin** | `/admin` | College admin — manages alumni, events, content |
| **Alumni Lead** | `/alumni` | Senior alumni — manages events, announcements |
| **Alumni** | `/alumni` | Regular alumni — views content, connects with peers |

## Tech Stack

### Frontend (Client)
```
Next.js 16       → App Router, Server Components, Turbopack
React 19         → Latest with hooks, concurrent features
TypeScript       → Strict mode, branded types, Zod validation
Tailwind CSS 4   → Utility-first, light-only theme
Zustand          → Global state management (auth store)
Axios            → HTTP client with caching/retry layer
Sonner           → Toast notifications
React Hook Form  → Form handling with Zod resolver
Playwright       → E2E testing
Storybook        → Component documentation
```

### Backend (Server)
```
Spring Boot 3.5  → Java 21, embedded Tomcat
Spring Security  → JWT auth, RBAC, @PreAuthorize
Spring Data JPA  → Hibernate, JPA Specifications
Flyway           → Database migrations (V1-V3)
MySQL 8.0        → Primary database
BCrypt (12)      → Password hashing
HS512            → JWT signing
```

### Infrastructure
```
Dev: localhost:3000 (client) + localhost:8080 (server)
DB: localhost:3306/alumniweb (user: root, password: mysql21)
```

## Project Structure

```
alumni-web/
├── client/              → Next.js frontend
│   ├── src/
│   │   ├── app/         → Route-based pages (App Router)
│   │   ├── features/    → Feature modules (auth, developer, alumni, admin)
│   │   ├── components/  → Shared UI components
│   │   ├── stores/      → Zustand stores
│   │   ├── lib/         → Utilities, API client, security
│   │   ├── types/       → TypeScript types (branded, Zod schemas)
│   │   └── config/      → Environment, navigation, routes
│   └── tests/           → Vitest + Playwright
│
├── server/              → Spring Boot backend
│   └── alumniweb/
│       └── src/main/java/com/alumniweb/alumniweb/
│           ├── controller/  → REST endpoints
│           ├── service/     → Business logic
│           ├── model/       → JPA entities
│           ├── dto/         → Request/Response records
│           ├── security/    → JWT, RBAC, filters
│           └── config/      → CORS, audit filter
│
└── docs/                → ADRs, this audit
```

## Key Commands

```bash
# Client
npm run dev           # Dev server at :3000
npm run build         # Production build
npm run typecheck     # TypeScript check
npm run lint          # ESLint

# Server
mvnw spring-boot:run   # Start server at :8080
mvnw compile           # Compile only

# Database
mysql -u root -pmysql21 alumniweb   # Connect to DB
```
