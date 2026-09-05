# Critical + High Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 2 critical security issues and 3 high-severity correctness issues identified in the frontend engineering audit.

**Architecture:** Targeted fixes to existing files — no new modules, no architectural changes. Each task is self-contained and independently verifiable.

**Tech Stack:** Next.js 16 (proxy.ts), React 19, Zustand 5, Tailwind CSS v4

## Global Constraints

- Next.js 16 uses `proxy.ts` (not `middleware.ts`) for request interception
- All request APIs (`cookies`, `headers`, `params`, `searchParams`) are ASYNC only in Next.js 16
- Do NOT modify `AGENTS.md` or stage status
- Keep changes minimal — fix the issue, don't refactor surrounding code

---

### Task 1: Add proxy.ts for route protection

**Covers:** SEC-2 (Critical: No middleware/proxy.ts for route protection), R-1 (Medium: No middleware)

**Files:**
- Create: `proxy.ts` (project root, already exists — update contents)
- Read: `src/lib/route-protection.ts` (reuse existing functions)

**Interfaces:**
- Consumes: `requiresAuth(pathname)`, `requiresAdmin(pathname)`, `hasAccess(user, pathname)` from `src/lib/route-protection.ts`
- Produces: Server-side route protection redirecting unauthenticated users to `/auth/login`

- [ ] **Step 1: Read the existing proxy.ts**

Read `proxy.ts` to understand current contents.

- [ ] **Step 2: Read route-protection.ts for the functions to reuse**

Read `src/lib/route-protection.ts` to confirm function signatures.

- [ ] **Step 3: Write the proxy.ts implementation**

```typescript
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("session_token")?.value;

  // Public routes — no protection needed
  if (!pathname.startsWith("/alumni") && !pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // No session — redirect to login
  if (!sessionToken) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes — check for admin role via cookie or token claim
  // For now, we trust the server-side session validation.
  // The proxy only ensures a session token EXISTS; role validation
  // happens at the API layer and in feature components.
  return NextResponse.next();
}

export const config = {
  matcher: ["/alumni/:path*", "/admin/:path*"],
};
```

- [ ] **Step 4: Verify proxy.ts compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to `proxy.ts`

- [ ] **Step 5: Commit**

```bash
git add proxy.ts
git commit -m "fix: add proxy.ts for server-side route protection on /alumni and /admin routes"
```

---

### Task 2: Fix sign-out to actually call logout()

**Covers:** SEC-3 (High: Sign-out is a navigation link, not a logout action), L-1 (High: Sign-out button)

**Files:**
- Modify: `src/components/layout/authenticated-shell.tsx:43-52`

**Interfaces:**
- Consumes: `useAuthStore` from `@/stores/global/auth-store`
- Produces: Sign-out button that calls `logout()` on the store and navigates to `/auth/login`

- [ ] **Step 1: Read the current authenticated-shell.tsx**

Read the file to confirm current sign-out implementation.

- [ ] **Step 2: Fix the sign-out button**

Replace the sign-out link with a proper logout handler:

```typescript
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/global/auth-store";
import type { NavGroup } from "@/config/navigation";
import { MobileDrawer } from "./mobile-drawer";
import { Shell } from "./shell";
import { SidebarSection } from "./sidebar-section";
import { Topbar } from "./topbar";

interface AuthenticatedShellProps {
  children: React.ReactNode;
  navGroups: NavGroup[];
  title: string;
  branding: string;
  brandingHref: string;
}

export function AuthenticatedShell({
  children,
  navGroups,
  title,
  branding,
  brandingHref,
}: AuthenticatedShellProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const sidebar = (
    <>
      <div className="flex h-16 items-center border-b border-zinc-200 px-6">
        <Link href={brandingHref} className="text-lg font-bold text-zinc-900">
          {branding}
        </Link>
      </div>
      <nav aria-label="Sidebar navigation" className="flex-1 space-y-1 overflow-y-auto p-4">
        {navGroups.map((group) => (
          <SidebarSection key={group.group} heading={group.group} items={group.items} />
        ))}
      </nav>
    </>
  );

  function handleSignOut() {
    logout();
    router.push("/auth/login");
  }

  const topbarActions = (
    <>
      <button
        type="button"
        onClick={handleSignOut}
        className="text-sm text-zinc-600 hover:text-zinc-900"
      >
        Sign out
      </button>
    </>
  );

  return (
    <Shell
      topbar={<Topbar title={title} actions={topbarActions} />}
      sidebar={sidebar}
      mobileDrawer={<MobileDrawer>{sidebar}</MobileDrawer>}
    >
      {children}
    </Shell>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/authenticated-shell.tsx
git commit -m "fix: sign-out button now calls logout() and navigates to login"
```

---

### Task 3: Harden CSP — remove unsafe-eval, keep unsafe-inline only if needed

**Covers:** SEC-1 (Critical: CSP includes unsafe-eval and unsafe-inline)

**Files:**
- Modify: `next.config.ts:37-51` (Content-Security-Policy header)

**Interfaces:**
- Consumes: None
- Produces: Tighter CSP that removes `unsafe-eval` and conditionally handles `unsafe-inline`

- [ ] **Step 1: Read the current CSP configuration**

Read `next.config.ts` to confirm the current CSP values.

- [ ] **Step 2: Update the CSP header**

Replace the CSP value in `next.config.ts`. Remove `unsafe-eval` entirely. Keep `unsafe-inline` for styles only (required by Tailwind/inlined styles), but move `unsafe-eval` out of script-src:

```typescript
{
  key: "Content-Security-Policy",
  value: [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "connect-src 'self' http://localhost:8080 http://localhost:3000 https://*.jjcet-alumni.org",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "report-uri /api/csp-violation",
  ].join("; "),
},
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "fix: remove unsafe-eval from CSP script-src, keep unsafe-inline only for styles"
```

---

### Task 4: Fix CSRF token wiring — make StoreHydrator accept and set token

**Covers:** SEC-5 (High: No CSRF protection actually applied), SEC-4 (High: CSRF token stored in module-level variable)

**Files:**
- Modify: `src/stores/store-hydrator.tsx` (pass CSRF token from root layout)
- Modify: `src/app/layout.tsx` (read cookie and pass to StoreHydrator)

**Interfaces:**
- Consumes: `setCsrfToken()` from `@/lib/security/csrf`
- Produces: CSRF token set from cookie on client hydration

- [ ] **Step 1: Read current StoreHydrator and root layout**

Read both files to confirm current implementation.

- [ ] **Step 2: Update root layout to pass CSRF token from cookie**

In `src/app/layout.tsx`, read the session token from cookies and pass a CSRF token to StoreHydrator. Since this is a Server Component, we read cookies server-side:

```typescript
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { SkipLink } from "@/components/layout/skip-link";
import { StoreHydrator } from "@/stores/store-hydrator";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | JJCET Alumni",
    default: "JJCET Alumni",
  },
  description:
    "JJCET Alumni Association — Connecting alumni, fostering networks, and building community.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "JJCET Alumni",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get("csrf_token")?.value ?? null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-zinc-900 antialiased">
        <StoreHydrator csrfToken={csrfToken}>
          <SkipLink />
          {children}
        </StoreHydrator>
        <Toaster richColors closeButton position="bottom-right" />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/stores/store-hydrator.tsx
git commit -m "fix: pass CSRF token from cookie to StoreHydrator for request signing"
```

---

### Task 5: Fix invalid Tailwind classes and duplicate utilities

**Covers:** R-2 (Low: Invalid Tailwind syntax), U-1 (Medium: Duplicate sanitizeHtml/truncate), ST-3 (Low: Invalid Tailwind classes)

**Files:**
- Modify: `src/app/error.tsx:26` (fix invalid class)
- Modify: `src/app/not-found.tsx:13` (fix invalid class)
- Modify: `src/components/error/secure-error-boundary.tsx:60` (fix invalid class)

**Interfaces:**
- Consumes: None
- Produces: Valid Tailwind classes across error pages

- [ ] **Step 1: Read the three files with invalid classes**

Read `error.tsx`, `not-found.tsx`, `secure-error-boundary.tsx`.

- [ ] **Step 2: Fix invalid Tailwind classes**

The pattern `hover:bg-zinc-700:bg-zinc-200` is invalid. Replace with `hover:bg-zinc-700`:

In `src/app/error.tsx:26`:
```
- className="mt-8 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700:bg-zinc-200"
+ className="mt-8 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
```

In `src/app/not-found.tsx:13`:
```
- className="mt-8 inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700:bg-zinc-200"
+ className="mt-8 inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
```

In `src/components/error/secure-error-boundary.tsx:60`:
```
- className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800:bg-zinc-200"
+ className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/error.tsx src/app/not-found.tsx src/components/error/secure-error-boundary.tsx
git commit -m "fix: remove invalid dual-class Tailwind syntax from error page buttons"
```

---

### Task 6: Deduplicate sanitizeHtml and truncate utilities

**Covers:** U-1 (Medium: Duplicate sanitizeHtml/sanitizeUrl), U-2 (Medium: Duplicate truncate)

**Files:**
- Modify: `src/lib/security/input-validation.ts` (import from utils instead of re-implementing)
- Modify: `src/lib/security/index.ts` (re-export from utils)

**Interfaces:**
- Consumes: `sanitizeHtml`, `sanitizeUrl`, `truncate` from `@/lib/utils/security` and `@/lib/utils/string`
- Produces: Single source of truth for these functions

- [ ] **Step 1: Read both implementations**

Read `src/lib/security/input-validation.ts` and `src/lib/utils/security.ts` to compare.

- [ ] **Step 2: Update input-validation.ts to re-export from utils**

Replace the duplicate implementations with re-exports:

```typescript
export { sanitizeHtml, sanitizeUrl } from "@/lib/utils/security";
export { truncate } from "@/lib/utils/string";

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeHtml(value);
    } else if (Array.isArray(value)) {
      result[key] = value;
    } else if (value !== null && typeof value === "object") {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/security/input-validation.ts
git commit -m "refactor: deduplicate sanitizeHtml, sanitizeUrl, and truncate by re-exporting from utils"
```
