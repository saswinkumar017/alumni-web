# Developer Portal — Complete Fix & Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all broken API integrations, implement missing CRUD operations, add 9 missing pages, and make every developer portal page fully functional with real server data.

**Architecture:** Fix the service layer to match backend endpoints exactly, then rebuild each page with proper data fetching, CRUD forms, and error handling. Backend controllers already exist and compile — only frontend changes needed.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, fetch API, sonner toasts

---

## Current Bug Inventory

| # | Bug | Severity | Pages Affected |
|---|-----|----------|----------------|
| B1 | Monitoring URL `/developer/monitoring/infrastructure` should be `/developer/monitoring` | Critical | Monitoring, Dashboard |
| B2 | Dashboard uses hardcoded `localhost:8080` instead of `env.api.baseUrl` | High | Dashboard |
| B3 | Dashboard calls `/developer/users/stats` which doesn't exist on server | High | Dashboard |
| B4 | Feature flag toggle sends no body — server expects `{ enabled: boolean }` | High | Feature Flags |
| B5 | Users/Audit pages expect `{ data: ... }` wrapper but server returns `PageResponse` directly | Critical | Users, Audit, Sessions |
| B6 | Users search sends `search` param but server expects `query` | High | Users |
| B7 | Audit date filter sends `YYYY-MM-DD` but server expects ISO LocalDateTime | Medium | Audit |
| B8 | Sessions page is just audit log entries, not real sessions | Low | Sessions |

## Missing Pages (9)

Branding, Maintenance, Auth Policies, API Keys, MFA Settings, Admin Overrides, Navigation, Themes, Notifications

---

## Global Constraints

- API base URL: `env.api.baseUrl` (from `@/config/env`) — NEVER hardcode `localhost:8080`
- Auth token: `localStorage.getItem("accessToken")`
- All API responses from `ApiResponse<T>` are wrapped: `{ success, message, data: T }`
- Paginated endpoints (`/users`, `/audit`) return `PageResponse<T>` directly (NO wrapper)
- Toast notifications use `sonner`: `import { toast } from "sonner"`
- UI components from `@/components/ui/` (Button, Card, TextInput, Badge)
- Every page must be `"use client"` for data fetching
- Every page must show loading state and error handling

---

## File Structure

### Files to Modify
- `src/features/developer/_services/developer-service.ts` — Fix all API URLs and return types
- `src/features/developer/_types/index.ts` — Add missing types (UserRole, PermissionCategory, etc.)
- `src/app/(developer)/developer/page.tsx` — Dashboard with real data + refresh button
- `src/app/(developer)/developer/platform/config/page.tsx` — Full CRUD
- `src/app/(developer)/developer/platform/feature-flags/page.tsx` — Full CRUD + toggle fix
- `src/app/(developer)/developer/rbac/roles/page.tsx` — Full CRUD
- `src/app/(developer)/developer/rbac/permissions/page.tsx` — Full CRUD
- `src/app/(developer)/developer/users/page.tsx` — Fix search, fix data wrapper
- `src/app/(developer)/developer/monitoring/page.tsx` — Fix URL, real data
- `src/app/(developer)/developer/audit/page.tsx` — Fix data wrapper, fix date format
- `src/app/(developer)/developer/sessions/page.tsx` — Fix data wrapper

### Files to Create
- `src/app/(developer)/developer/platform/branding/page.tsx`
- `src/app/(developer)/developer/platform/maintenance/page.tsx`
- `src/app/(developer)/developer/auth/policies/page.tsx`
- `src/app/(developer)/developer/auth/api-keys/page.tsx`
- `src/app/(developer)/developer/auth/mfa/page.tsx`
- `src/app/(developer)/developer/rbac/admin-overrides/page.tsx`
- `src/app/(developer)/developer/cms/navigation/page.tsx`
- `src/app/(developer)/developer/cms/themes/page.tsx`
- `src/app/(developer)/developer/cms/notifications/page.tsx`

---

## Task 1: Fix Service Layer — All API URLs and Return Types

**Covers:** B1-B7

**Files:**
- Modify: `src/features/developer/_services/developer-service.ts`

- [ ] **Step 1: Rewrite developer-service.ts with correct URLs and types**

```typescript
import { env } from "@/config/env";
import type {
  PlatformConfig,
  FeatureFlag,
  RoleTemplate,
  Permission,
  User,
  AuditLog,
  MonitoringData,
  CmsPage,
} from "../_types";

const API_BASE = env.api.baseUrl;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}

// ---- Platform Config ----
export function getPlatformConfigs() {
  return apiFetch<{ data: PlatformConfig[] }>("/developer/config");
}
export function updatePlatformConfig(key: string, value: string) {
  return apiFetch<{ data: PlatformConfig }>(`/developer/config/${encodeURIComponent(key)}`, {
    method: "PUT", body: JSON.stringify({ value }),
  });
}

// ---- Feature Flags ----
export function getFeatureFlags() {
  return apiFetch<{ data: FeatureFlag[] }>("/developer/feature-flags");
}
export function createFeatureFlag(data: { code: string; name: string; description?: string }) {
  return apiFetch<{ data: FeatureFlag }>("/developer/feature-flags", {
    method: "POST", body: JSON.stringify(data),
  });
}
export function toggleFeatureFlag(id: number, enabled: boolean) {
  return apiFetch<{ data: FeatureFlag }>(`/developer/feature-flags/${id}/toggle`, {
    method: "PATCH", body: JSON.stringify({ enabled }),
  });
}
export function deleteFeatureFlag(id: number) {
  return apiFetch<{ success: boolean }>(`/developer/feature-flags/${id}`, { method: "DELETE" });
}

// ---- Roles ----
export function getRoleTemplates() {
  return apiFetch<{ data: RoleTemplate[] }>("/developer/roles");
}
export function createRoleTemplate(data: { name: string; code: string; description?: string }) {
  return apiFetch<{ data: RoleTemplate }>("/developer/roles", {
    method: "POST", body: JSON.stringify(data),
  });
}
export function updateRoleTemplate(id: number, data: { name?: string; description?: string }) {
  return apiFetch<{ data: RoleTemplate }>(`/developer/roles/${id}`, {
    method: "PUT", body: JSON.stringify(data),
  });
}
export function deleteRoleTemplate(id: number) {
  return apiFetch<{ success: boolean }>(`/developer/roles/${id}`, { method: "DELETE" });
}

// ---- Permissions ----
export function getPermissions() {
  return apiFetch<{ data: Permission[] }>("/developer/permissions");
}
export function createPermission(data: { name: string; code: string; groupId?: number }) {
  return apiFetch<{ data: Permission }>("/developer/permissions", {
    method: "POST", body: JSON.stringify(data),
  });
}

// ---- Users (returns PageResponse directly, NO ApiResponse wrapper) ----
export function getUsers(page: number = 0, query: string = "") {
  const params = new URLSearchParams({ page: String(page), size: "20" });
  if (query) params.set("query", query);  // Server expects "query" not "search"
  return apiFetch<{ content: User[]; totalElements: number; totalPages: number }>(
    `/developer/users?${params}`
  );
}
export function getUserById(id: number) {
  return apiFetch<{ data: User }>(`/developer/users/${id}`);
}
export function suspendUser(id: number) {
  return apiFetch<{ data: User }>(`/developer/users/${id}/suspend`, { method: "POST" });
}
export function activateUser(id: number) {
  return apiFetch<{ data: User }>(`/developer/users/${id}/activate`, { method: "POST" });
}
export function changeUserRole(id: number, role: string) {
  return apiFetch<{ data: User }>(`/developer/users/${id}/role`, {
    method: "PUT", body: JSON.stringify({ role }),
  });
}

// ---- Audit Logs (returns PageResponse directly, NO ApiResponse wrapper) ----
export function getAuditLogs(filters: {
  page?: number; action?: string; userId?: number;
  from?: string; to?: string; entityType?: string;
} = {}) {
  const params = new URLSearchParams();
  if (filters.page != null) params.set("page", String(filters.page));
  if (filters.action) params.set("action", filters.action);
  if (filters.userId) params.set("userId", String(filters.userId));
  if (filters.entityType) params.set("entityType", filters.entityType);
  // Convert YYYY-MM-DD to ISO LocalDateTime
  if (filters.from) params.set("from", filters.from.includes("T") ? filters.from : `${filters.from}T00:00:00`);
  if (filters.to) params.set("to", filters.to.includes("T") ? filters.to : `${filters.to}T23:59:59`);
  return apiFetch<{ content: AuditLog[]; totalElements: number; totalPages: number }>(
    `/developer/audit?${params}`
  );
}
export function getAuditStats() {
  return apiFetch<{ data: { totalEntries: number } }>("/developer/audit/stats");
}

// ---- Monitoring (single endpoint, returns MonitoringResponse) ----
export function getMonitoringData() {
  return apiFetch<MonitoringData>("/developer/monitoring");
}

// ---- CMS ----
export function getCmsPages() {
  return apiFetch<{ data: CmsPage[] }>("/developer/cms/pages");
}
```

- [ ] **Step 2: Update types to match server DTOs**

In `src/features/developer/_types/index.ts`, ensure these types exist:
```typescript
export interface PlatformConfig { id?: number; key: string; value: string; valueType?: string; category?: string; description?: string; }
export interface FeatureFlag { id: number; code: string; name: string; description?: string; isEnabled: boolean; rolloutPercentage?: number; targetAudience?: string; }
export interface RoleTemplate { id: number; name: string; code: string; description?: string; isSystem?: boolean; isActive?: boolean; }
export type PermissionCategory = string;
export interface Permission { id: number; name: string; code: string; description?: string; category: PermissionCategory; action?: string; resource?: string; }
export interface User { id: number; username: string; email?: string; fullName?: string; role: string; accountStatus?: string; masterAlumni?: { name?: string; department?: string; batch?: string; }; createdAt?: string; lastLogin?: string; }
export interface AuditLog { id: number; userId?: number; action: string; entityType?: string; entityId?: number; ipAddress?: string; userAgent?: string; createdAt: string; }
export interface MonitoringData { totalUsers?: number; activeSessions?: number; memoryUsedMB?: number; memoryMaxMB?: number; uptimeMs?: number; processors?: number; status?: string; }
export interface CmsPage { id: number; slug: string; title: string; isPublished?: boolean; createdAt?: string; updatedAt?: string; }
export interface PaginatedResponse<T> { content: T[]; totalElements: number; totalPages: number; page?: number; size?: number; }
```

- [ ] **Step 3: Run `npx tsc --noEmit` to verify no type errors**

---

## Task 2: Fix Dashboard — Real Data + Refresh Button

**Covers:** B2, B3

**Files:**
- Modify: `src/app/(developer)/developer/page.tsx`

- [ ] **Step 1: Rewrite dashboard to use service layer**

The dashboard should:
- Call `getUsers()` to get total users count
- Call `getFeatureFlags()` to get flag count
- Call `getAuditStats()` to get audit count
- Call `getMonitoringData()` for system health
- Have a **Refresh** button that re-fetches all data
- Use `env.api.baseUrl` (via service layer) instead of hardcoded URLs
- Show loading skeleton while fetching
- Show error state if fetch fails

---

## Task 3: Fix Feature Flags — Toggle + Full CRUD

**Covers:** B4

**Files:**
- Modify: `src/app/(developer)/developer/platform/feature-flags/page.tsx`

- [ ] **Step 1: Fix toggle to send body**

The toggle must send `{ enabled: boolean }` in the request body:
```typescript
const result = await toggleFeatureFlag(flag.id, !flag.isEnabled);
```

- [ ] **Step 2: Add delete functionality**

Add a delete button that calls `deleteFeatureFlag(id)` and refreshes the list.

---

## Task 4: Fix Users Page — Search + Data Wrapper

**Covers:** B5, B6

**Files:**
- Modify: `src/app/(developer)/developer/users/page.tsx`

- [ ] **Step 1: Fix data extraction**

Users endpoint returns `PageResponse` directly (no `.data` wrapper):
```typescript
const result = await getUsers(page, search);
// result = { content: User[], totalElements, totalPages }
setUsers(result.content);
setTotalPages(result.totalPages);
```

- [ ] **Step 2: Fix search parameter**

Service now sends `query` instead of `search`. Verify the search input calls `getUsers(page, searchTerm)`.

---

## Task 5: Fix Audit Page — Data Wrapper + Date Format

**Covers:** B5, B7

**Files:**
- Modify: `src/app/(developer)/developer/audit/page.tsx`

- [ ] **Step 1: Fix data extraction**

Same as Users — audit returns `PageResponse` directly:
```typescript
const result = await getAuditLogs(filters);
setLogs(result.content);
setTotalPages(result.totalPages);
```

- [ ] **Step 2: Fix date format conversion**

Service now converts `YYYY-MM-DD` to `YYYY-MM-DDTHH:MM:SS` automatically. Verify the date inputs work.

---

## Task 6: Fix Monitoring Page — Correct URL

**Covers:** B1

**Files:**
- Modify: `src/app/(developer)/developer/monitoring/page.tsx`

- [ ] **Step 1: Use correct API URL**

Service now calls `/developer/monitoring` (not `/infrastructure`). The `getMonitoringData()` returns `MonitoringData` directly.

---

## Task 7: Fix Sessions Page — Data Wrapper

**Covers:** B5

**Files:**
- Modify: `src/app/(developer)/developer/sessions/page.tsx`

- [ ] **Step 1: Fix data extraction**

Sessions reuses `getAuditLogs({ action: "LOGIN" })` which returns `PageResponse`:
```typescript
const result = await getAuditLogs({ action: "LOGIN", page });
setSessions(result.content);
```

---

## Task 8: Create Missing Page — Branding

**Files:**
- Create: `src/app/(developer)/developer/platform/branding/page.tsx`

- [ ] **Step 1: Create branding page**

Simple form for updating platform branding settings. Uses `getPlatformConfigs()` and `updatePlatformConfig()`. Fields: App Name, Logo URL, Favicon URL, Primary Color, Secondary Color.

---

## Task 9: Create Missing Page — Maintenance

**Files:**
- Create: `src/app/(developer)/developer/platform/maintenance/page.tsx`

- [ ] **Step 1: Create maintenance page**

Toggle for maintenance mode. Shows current status. Uses `getPlatformConfigs()` to read `platform.maintenance_mode` and `updatePlatformConfig()` to toggle.

---

## Task 10: Create Missing Page — Auth Policies

**Files:**
- Create: `src/app/(developer)/developer/auth/policies/page.tsx`

- [ ] **Step 1: Create auth policies page**

Display authentication policy settings. Uses platform configs for auth-related settings (session timeout, MFA enforcement, password policy).

---

## Task 11: Create Missing Page — API Keys

**Files:**
- Create: `src/app/(developer)/developer/auth/api-keys/page.tsx`

- [ ] **Step 1: Create API keys page**

Placeholder page for API key management. Shows list of API keys (from future endpoint). For now, display a "Coming Soon" state.

---

## Task 12: Create Missing Page — MFA Settings

**Files:**
- Create: `src/app/(developer)/developer/auth/mfa/page.tsx`

- [ ] **Step 1: Create MFA settings page**

Display MFA enforcement settings. Uses platform configs for `auth.mfa.enabled`.

---

## Task 13: Create Missing Page — Admin Overrides

**Files:**
- Create: `src/app/(developer)/developer/rbac/admin-overrides/page.tsx`

- [ ] **Step 1: Create admin overrides page**

Display admin permission overrides. For now, show a table with placeholder data and "Coming Soon" note.

---

## Task 14: Create Missing Page — Navigation Manager

**Files:**
- Create: `src/app/(developer)/developer/cms/navigation/page.tsx`

- [ ] **Step 1: Create navigation page**

Display navigation items from the server. For now, show a read-only view of navigation structure.

---

## Task 15: Create Missing Page — Themes

**Files:**
- Create: `src/app/(developer)/developer/cms/themes/page.tsx`

- [ ] **Step 1: Create themes page**

Display theme configurations. For now, show a placeholder with theme name and status.

---

## Task 16: Create Missing Page — Notifications

**Files:**
- Create: `src/app/(developer)/developer/cms/notifications/page.tsx`

- [ ] **Step 1: Create notifications page**

Display notification templates. For now, show a placeholder list.

---

## Task 17: Final Verification

- [ ] **Step 1: Run `npx tsc --noEmit` in client — must pass**
- [ ] **Step 2: Start backend server and verify all API endpoints respond**
- [ ] **Step 3: Test developer login flow end-to-end**
- [ ] **Step 4: Verify each page loads without console errors**
- [ ] **Step 5: Verify CRUD operations work on Feature Flags, Roles, Permissions, Config**
