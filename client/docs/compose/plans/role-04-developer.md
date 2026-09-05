# Developer (Platform Owner) Role — Implementation Plan

**Role ID:** `DEVELOPER`
**Status:** Planning
**Priority:** P0 (Platform Foundation)
**Estimated Effort:** 12–16 weeks across 6 phases

---

## 1. Role Definition

### 1.1 What is the Developer Role

The Developer role (Platform Owner) is a **singleton superuser role** with unrestricted god-mode access to every aspect of the JJCET Alumni platform. Unlike ADMIN or USER, the Developer:

- Is the **single most privileged entity** in the system
- **Cannot be created, modified, or deleted** by any admin or user — only via database seed or migration
- Is **hardcoded** in the `UserRole` enum as `DEVELOPER` (server) and `"developer"` (client)
- Has a **dedicated, isolated portal** (`/developer/`) completely separate from public, alumni, and admin routes
- Requires **mandatory MFA** — cannot operate without TOTP or WebAuthn enrollment
- Every action is **fully audited** — no exceptions, no bypass

### 1.2 Immutability Guarantees

```java
// Server: UserRole enum
public enum UserRole {
    DEVELOPER,  // Singleton — seeded at migration, protected from CRUD
    ADMIN,
    USER
}
```

- The server `AdminController` will have **explicit guard methods** that prevent any API call from:
  - Creating a user with `role=DEVELOPER`
  - Changing any user's role to/from `DEVELOPER`
  - Deleting the `DEVELOPER` account
  - Updating the `DEVELOPER` user's role field
- The client RBAC system will add `developer: 4` to `ROLE_HIERARCHY`
- The `DEVELOPER` role is **not assignable** through any admin UI — only via SQL migration

### 1.3 Login Flow

The Developer logs in via the **same `/auth/login` endpoint** but the server returns `role: "developer"` in the JWT. The client detects this and redirects to `/developer/` instead of `/admin/` or `/alumni/`. The Developer portal has its own layout shell, sidebar, and routing.

---

## 2. New Entities

### 2.1 Core RBAC Entities

#### `role_template`
Dynamic role templates that admins can create/manage. The Developer can define the role system itself.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | VARCHAR(100) | Unique, e.g. "Alumni Lead", "Event Coordinator" |
| `slug` | VARCHAR(100) | URL-safe, unique |
| `description` | TEXT | Human-readable description |
| `hierarchy_level` | INT | Ordering (1=highest admin, lower=more privileged) |
| `is_system` | BOOLEAN | true for built-in roles (ADMIN, USER), false for custom |
| `is_active` | BOOLEAN | Soft-disable without deletion |
| `clone_source_id` | UUID FK | If cloned from another template |
| `created_by` | UUID FK | user_account.id |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| `deleted_at` | TIMESTAMP | Soft delete |

#### `permission`
Individual atomic permissions.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `key` | VARCHAR(150) | Unique, e.g. `event:create:own`, `user:impersonate` |
| `name` | VARCHAR(200) | Display name |
| `description` | TEXT | What this permission grants |
| `category_id` | UUID FK | permission_category.id |
| `group_id` | UUID FK | permission_group.id (optional) |
| `is_dangerous` | BOOLEAN | Flag for destructive permissions (show extra confirmation) |
| `requires_mfa` | BOOLEAN | Whether using this permission requires active MFA session |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### `permission_category`
Groups permissions by functional area.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `key` | VARCHAR(100) | Unique, e.g. `user-management`, `content-management` |
| `name` | VARCHAR(200) | Display name |
| `description` | TEXT | |
| `icon` | VARCHAR(100) | Icon identifier for UI |
| `sort_order` | INT | Display ordering |
| `created_at` | TIMESTAMP | |

#### `permission_group`
Sub-categories within a category for fine-grained grouping.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `category_id` | UUID FK | permission_category.id |
| `name` | VARCHAR(200) | Display name |
| `sort_order` | INT | |
| `created_at` | TIMESTAMP | |

#### `role_template_permission` (join table)
Maps permissions to role templates.

| Column | Type | Notes |
|---|---|---|
| `role_template_id` | UUID FK | |
| `permission_id` | UUID FK | |
| `granted` | BOOLEAN | false = explicitly denied (overrides inherited) |
| `created_at` | TIMESTAMP | |
| UNIQUE | `(role_template_id, permission_id)` | |

#### `role_template_hierarchy` (join table)
Parent-child relationships between role templates.

| Column | Type | Notes |
|---|---|---|
| `parent_role_template_id` | UUID FK | Higher privilege |
| `child_role_template_id` | UUID FK | Lower privilege (inherits) |
| PRIMARY KEY | `(parent_role_template_id, child_role_template_id)` | |

### 2.2 Administrator Permission Management

#### `admin_permission_override`
Per-admin overrides that grant or revoke specific permissions beyond their role template.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID FK | The admin user |
| `permission_id` | UUID FK | The permission to override |
| `granted` | BOOLEAN | true = extra grant, false = explicit revoke |
| `reason` | TEXT | Why this override exists |
| `expires_at` | TIMESTAMP | Optional: auto-revoke after this time |
| `created_by` | UUID FK | user_account.id (the Developer) |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| UNIQUE | `(user_id, permission_id)` | One override per permission per admin |

### 2.3 Security Entities

#### `mfa_enrollment`
Tracks MFA device enrollment per user.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID FK | |
| `method` | ENUM(`TOTP`, `WEBAUTHN`, `SMS`) | |
| `label` | VARCHAR(100) | Human-friendly name, e.g. "iPhone Authenticator" |
| `secret` | VARCHAR(255) | Encrypted TOTP secret (or WebAuthn credential ID) |
| `public_key` | TEXT | WebAuthn public key (nullable) |
| `is_primary` | BOOLEAN | Primary device for MFA challenges |
| `is_active` | BOOLEAN | Soft-disable |
| `last_used_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |
| `enrollment_ip` | VARCHAR(45) | IPv4/IPv6 |
| `enrollment_user_agent` | TEXT | Device fingerprint |

#### `trusted_device`
Devices that have been marked as "trusted" to skip MFA on subsequent logins.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID FK | |
| `device_fingerprint` | VARCHAR(255) | Hashed device identifier |
| `device_name` | VARCHAR(200) | User-provided label |
| `ip_address` | VARCHAR(45) | IP at time of trust |
| `user_agent` | TEXT | Browser/device info |
| `trusted_at` | TIMESTAMP | |
| `expires_at` | TIMESTAMP | Auto-expire (default: 90 days) |
| `revoked_at` | TIMESTAMP | Manual revocation |
| `created_at` | TIMESTAMP | |

#### `session`
Active user sessions for monitoring and management.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID FK | |
| `token_jti` | VARCHAR(255) | JWT ID for token tracking |
| `ip_address` | VARCHAR(45) | |
| `user_agent` | TEXT | |
| `device_type` | ENUM(`DESKTOP`, `MOBILE`, `TABLET`, `UNKNOWN`) | Parsed from UA |
| `location` | VARCHAR(200) | Geo-lookup (optional) |
| `is_active` | BOOLEAN | false = revoked/expired |
| `last_activity_at` | TIMESTAMP | Updated on each API call |
| `created_at` | TIMESTAMP | |
| `expires_at` | TIMESTAMP | |

#### `api_key`
API keys for programmatic access (future external integrations).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID FK | Owner |
| `name` | VARCHAR(200) | Description |
| `key_prefix` | VARCHAR(10) | First 10 chars for identification |
| `key_hash` | VARCHAR(255) | SHA-256 of full key |
| `permissions` | JSON | Array of permission keys this key grants |
| `rate_limit` | INT | Requests per minute (0 = unlimited) |
| `is_active` | BOOLEAN | |
| `last_used_at` | TIMESTAMP | |
| `expires_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |

#### `login_event`
Every login attempt (success and failure) for security monitoring.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID FK | nullable for failed logins with unknown user |
| `username_attempted` | VARCHAR(100) | The username that was tried |
| `status` | ENUM(`SUCCESS`, `FAILED_PASSWORD`, `FAILED_MFA`, `FAILED_LOCKED`, `FAILED_DISABLED`) | |
| `ip_address` | VARCHAR(45) | |
| `user_agent` | TEXT | |
| `location` | VARCHAR(200) | Geo-lookup |
| `mfa_method` | VARCHAR(50) | Which MFA method was used (nullable) |
| `failure_reason` | TEXT | Detailed failure info |
| `created_at` | TIMESTAMP | |

### 2.4 Platform Configuration Entities

#### `platform_config`
Key-value store for all platform settings.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `key` | VARCHAR(200) | Unique, namespaced: `auth.session.timeout`, `branding.logo_url` |
| `value` | TEXT | JSON-serialized value |
| `value_type` | ENUM(`STRING`, `NUMBER`, `BOOLEAN`, `JSON`, `COLOR`) | For validation |
| `category` | VARCHAR(100) | Grouping: `auth`, `branding`, `navigation`, `security`, `general` |
| `description` | TEXT | |
| `is_public` | BOOLEAN | Whether this config is readable by non-developers |
| `validation_rule` | TEXT | JSON Schema or regex for validation |
| `default_value` | TEXT | Factory default |
| `updated_by` | UUID FK | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### `feature_flag`
Feature flags for gradual rollout and maintenance.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `key` | VARCHAR(150) | Unique, e.g. `enable-alumni-networking`, `maintenance-mode` |
| `name` | VARCHAR(200) | Display name |
| `description` | TEXT | |
| `is_enabled` | BOOLEAN | Global on/off |
| `rollout_percentage` | INT | 0–100 (gradual rollout) |
| `allowed_roles` | JSON | Array of role strings; empty = all roles |
| `allowed_user_ids` | JSON | Specific user IDs for beta testing |
| `target_audience` | ENUM(`ALL`, `ADMINS_ONLY`, `SPECIFIC_USERS`, `PERCENTAGE`) | |
| `created_by` | UUID FK | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

### 2.5 CMS Entities

#### `page_layout`
Homepage and custom page layouts.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `slug` | VARCHAR(200) | Unique URL slug |
| `title` | VARCHAR(300) | |
| `layout_config` | JSON | Full page layout definition (sections, ordering, props) |
| `is_published` | BOOLEAN | |
| `published_at` | TIMESTAMP | |
| `created_by` | UUID FK | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| `deleted_at` | TIMESTAMP | |

#### `page_section`
Individual sections within a page layout.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `page_layout_id` | UUID FK | |
| `component_key` | VARCHAR(200) | Reference to component library entry |
| `title` | VARCHAR(300) | Section title |
| `props` | JSON | Component-specific properties |
| `sort_order` | INT | |
| `is_visible` | BOOLEAN | Show/hide without deleting |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### `component_library`
Reusable component definitions.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `key` | VARCHAR(200) | Unique, e.g. `hero-banner`, `event-card-grid` |
| `name` | VARCHAR(200) | Display name |
| `description` | TEXT | |
| `category` | VARCHAR(100) | `hero`, `content`, `form`, `navigation`, etc. |
| `schema` | JSON | JSON Schema for the component's props |
| `default_props` | JSON | Default values |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMP | |

#### `navigation_builder`
Configurable navigation menu items.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `menu_key` | VARCHAR(100) | Which menu: `public`, `alumni`, `admin`, `developer` |
| `parent_id` | UUID FK | Self-referential for nested menus |
| `label` | VARCHAR(200) | Display text |
| `url` | VARCHAR(500) | Target URL or route |
| `icon` | VARCHAR(100) | Icon identifier |
| `sort_order` | INT | |
| `is_visible` | BOOLEAN | |
| `required_role` | VARCHAR(50) | Minimum role to see this item |
| `permissions_required` | JSON | Array of permission keys needed |
| `open_in_new_tab` | BOOLEAN | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### `theme_config`
Theme and branding settings.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | VARCHAR(100) | Theme name |
| `colors` | JSON | Primary, secondary, accent, background, text, etc. |
| `typography` | JSON | Font families, sizes, weights |
| `spacing` | JSON | Custom spacing scale |
| `border_radius` | JSON | |
| `is_active` | BOOLEAN | Currently applied theme |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### `form_builder`
Dynamic form definitions.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `key` | VARCHAR(150) | Unique identifier |
| `name` | VARCHAR(200) | Display name |
| `fields` | JSON | Array of field definitions (type, validation, options) |
| `submit_action` | JSON | What happens on submit (API endpoint, email, webhook) |
| `validation_rules` | JSON | Form-level validation |
| `is_active` | BOOLEAN | |
| `created_by` | UUID FK | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### `notification_template`
Reusable notification templates.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `key` | VARCHAR(150) | Unique, e.g. `welcome-email`, `event-reminder` |
| `name` | VARCHAR(200) | |
| `channel` | ENUM(`EMAIL`, `IN_APP`, `SMS`, `PUSH`) | |
| `subject` | VARCHAR(500) | For email |
| `body_template` | TEXT | Mustache/Handlebars template |
| `variables` | JSON | Available template variables |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

### 2.6 Audit Entities

#### `audit_log`
Immutable append-only audit trail.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `timestamp` | TIMESTAMP | When the event occurred |
| `user_id` | UUID FK | Who did it (nullable for system events) |
| `user_role` | VARCHAR(50) | Role at time of action |
| `action` | VARCHAR(100) | e.g. `user.login`, `role.create`, `config.update` |
| `resource_type` | VARCHAR(100) | e.g. `user`, `role_template`, `platform_config` |
| `resource_id` | VARCHAR(255) | ID of affected resource |
| `old_value` | JSON | Previous state (for updates) |
| `new_value` | JSON | New state (for creates/updates) |
| `ip_address` | VARCHAR(45) | |
| `user_agent` | TEXT | |
| `session_id` | UUID FK | session.id |
| `request_id` | VARCHAR(100) | Correlation ID |
| `risk_level` | ENUM(`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) | |
| `created_at` | TIMESTAMP | |

**Indexes:** `(user_id, timestamp)`, `(action, timestamp)`, `(resource_type, resource_id)`, `(risk_level, timestamp)`

**Table properties:** No UPDATE or DELETE allowed (enforced by DB trigger and application layer). Partitioned by month for performance.

---

## 3. New API Endpoints

### 3.1 Authentication (Enhanced)

```
POST   /api/auth/mfa/enroll              — Start MFA enrollment (returns secret/QR)
POST   /api/auth/mfa/verify-enrollment   — Verify first TOTP code to complete enrollment
POST   /api/auth/mfa/challenge           — Request MFA challenge during login
POST   /api/auth/mfa/verify              — Submit MFA code during login
DELETE /api/auth/mfa/:deviceId           — Remove MFA device
GET    /api/auth/mfa/devices             — List enrolled MFA devices
POST   /api/auth/trusted-device          — Mark current device as trusted
DELETE /api/auth/trusted-device/:id      — Remove trusted device
GET    /api/auth/trusted-devices         — List trusted devices
POST   /api/auth/re-authenticate         — Re-authenticate for sensitive operations
GET    /api/auth/sessions                — List active sessions
DELETE /api/auth/sessions/:id            — Revoke a specific session
DELETE /api/auth/sessions/all            — Revoke all sessions except current
POST   /api/auth/login/notify            — Send login notification (new device/location)
```

### 3.2 Developer Portal — Platform Config

```
GET    /api/developer/config              — List all platform configs
PUT    /api/developer/config/:key         — Update a config value
POST   /api/developer/config              — Create new config key
DELETE /api/developer/config/:key         — Delete a config key
GET    /api/developer/config/public       — Public configs (cached, for client bootstrap)
POST   /api/developer/config/bulk         — Bulk update configs
```

### 3.3 Developer Portal — Feature Flags

```
GET    /api/developer/feature-flags       — List all feature flags
POST   /api/developer/feature-flags       — Create feature flag
PUT    /api/developer/feature-flags/:id   — Update feature flag
DELETE /api/developer/feature-flags/:id   — Delete feature flag
POST   /api/developer/feature-flags/:id/toggle — Toggle flag on/off
GET    /api/developer/feature-flags/active — Active flags for current user (public endpoint)
```

### 3.4 Developer Portal — Role Templates (RBAC Management)

```
GET    /api/developer/roles                    — List all role templates
POST   /api/developer/roles                    — Create new role template
GET    /api/developer/roles/:id                — Get role template details
PUT    /api/developer/roles/:id                — Update role template
DELETE /api/developer/roles/:id                — Delete (only non-system, non-assigned roles)
POST   /api/developer/roles/:id/clone          — Clone a role template
POST   /api/developer/roles/:id/archive        — Archive a role template
POST   /api/developer/roles/:id/restore        — Restore archived role
GET    /api/developer/roles/hierarchy          — Get full role hierarchy tree
PUT    /api/developer/roles/hierarchy          — Update role hierarchy relationships
```

### 3.5 Developer Portal — Permissions

```
GET    /api/developer/permissions               — List all permissions
POST   /api/developer/permissions               — Create permission
PUT    /api/developer/permissions/:id           — Update permission
DELETE /api/developer/permissions/:id           — Delete permission
GET    /api/developer/permissions/categories    — List permission categories
POST   /api/developer/permissions/categories    — Create category
PUT    /api/developer/permissions/categories/:id — Update category
DELETE /api/developer/permissions/categories/:id — Delete category
GET    /api/developer/permissions/groups        — List permission groups
POST   /api/developer/permissions/groups        — Create group
PUT    /api/developer/permissions/groups/:id    — Update group
DELETE /api/developer/permissions/groups/:id    — Delete group
GET    /api/developer/roles/:id/permissions     — Get permissions for a role
PUT    /api/developer/roles/:id/permissions     — Set permissions for a role (replace all)
POST   /api/developer/roles/:id/permissions/grant  — Grant specific permission
POST   /api/developer/roles/:id/permissions/revoke — Revoke specific permission
```

### 3.6 Developer Portal — Admin Permission Management

```
GET    /api/developer/admins/:userId/permissions       — Get admin's effective permissions
PUT    /api/developer/admins/:userId/permissions       — Set admin overrides (replace all)
POST   /api/developer/admins/:userId/permissions/grant  — Grant extra permission
POST   /api/developer/admins/:userId/permissions/revoke — Revoke permission
DELETE /api/developer/admins/:userId/permissions/:permId — Remove override
GET    /api/developer/admins/:userId/permissions/effective — Computed permissions (role + overrides)
```

### 3.7 Developer Portal — User Management

```
GET    /api/developer/users                     — List all users (paginated, filterable)
GET    /api/developer/users/:id                 — Get user details
PUT    /api/developer/users/:id                 — Update user (role, status, etc.)
DELETE /api/developer/users/:id                 — Soft-delete user
POST   /api/developer/users/:id/impersonate     — Start impersonation (returns temp token)
POST   /api/developer/users/:id/suspend         — Suspend user account
POST   /api/developer/users/:id/activate        — Reactivate user
PUT    /api/developer/users/:id/role            — Change user role
GET    /api/developer/users/:id/sessions        — View user's active sessions
DELETE /api/developer/users/:id/sessions        — Revoke all user sessions
POST   /api/developer/users/:id/reset-password  — Force password reset
GET    /api/developer/users/stats               — User statistics (counts, growth)
```

### 3.8 Developer Portal — Platform Monitoring

```
GET    /api/developer/monitoring/online         — Currently online users
GET    /api/developer/monitoring/sessions       — All active sessions
GET    /api/developer/monitoring/sessions/stats — Session statistics
GET    /api/developer/monitoring/infrastructure — System health (DB, cache, disk, memory)
GET    /api/developer/monitoring/api-metrics    — API response times, error rates
GET    /api/developer/monitoring/login-events   — Login event stream (recent)
GET    /api/developer/monitoring/alerts         — Active alerts/warnings
POST   /api/developer/monitoring/alerts/:id/ack — Acknowledge alert
```

### 3.9 Developer Portal — CMS

```
# Pages
GET    /api/developer/cms/pages                — List page layouts
POST   /api/developer/cms/pages                — Create page
GET    /api/developer/cms/pages/:id            — Get page details
PUT    /api/developer/cms/pages/:id            — Update page
DELETE /api/developer/cms/pages/:id            — Delete page
POST   /api/developer/cms/pages/:id/publish    — Publish page
POST   /api/developer/cms/pages/:id/unpublish  — Unpublish page

# Sections
GET    /api/developer/cms/pages/:pageId/sections      — List sections
POST   /api/developer/cms/pages/:pageId/sections       — Add section
PUT    /api/developer/cms/pages/:pageId/sections/:id   — Update section
DELETE /api/developer/cms/pages/:pageId/sections/:id   — Remove section
PUT    /api/developer/cms/pages/:pageId/sections/reorder — Reorder sections

# Component Library
GET    /api/developer/cms/components            — List components
POST   /api/developer/cms/components            — Register component
GET    /api/developer/cms/components/:id        — Get component schema
PUT    /api/developer/cms/components/:id        — Update component
DELETE /api/developer/cms/components/:id        — Remove component

# Navigation
GET    /api/developer/cms/navigation            — Get all navigation menus
PUT    /api/developer/cms/navigation/:menuKey   — Update menu items
POST   /api/developer/cms/navigation/:menuKey/items — Add menu item
PUT    /api/developer/cms/navigation/:menuKey/items/:id — Update item
DELETE /api/developer/cms/navigation/:menuKey/items/:id — Remove item
PUT    /api/developer/cms/navigation/:menuKey/reorder — Reorder items

# Theme
GET    /api/developer/cms/themes                — List themes
POST   /api/developer/cms/themes                — Create theme
PUT    /api/developer/cms/themes/:id            — Update theme
POST   /api/developer/cms/themes/:id/activate   — Set as active theme
DELETE /api/developer/cms/themes/:id            — Delete theme

# Forms
GET    /api/developer/cms/forms                 — List forms
POST   /api/developer/cms/forms                 — Create form
GET    /api/developer/cms/forms/:id             — Get form definition
PUT    /api/developer/cms/forms/:id             — Update form
DELETE /api/developer/cms/forms/:id             — Delete form
GET    /api/developer/cms/forms/:id/submissions — View submissions

# Notifications
GET    /api/developer/cms/notifications         — List templates
POST   /api/developer/cms/notifications         — Create template
GET    /api/developer/cms/notifications/:id     — Get template
PUT    /api/developer/cms/notifications/:id     — Update template
DELETE /api/developer/cms/notifications/:id     — Delete template
POST   /api/developer/cms/notifications/:id/preview — Preview rendered template
POST   /api/developer/cms/notifications/:id/test   — Send test notification

# Workflow Builder
GET    /api/developer/cms/workflows             — List workflows
POST   /api/developer/cms/workflows             — Create workflow
PUT    /api/developer/cms/workflows/:id         — Update workflow
DELETE /api/developer/cms/workflows/:id         — Delete workflow
POST   /api/developer/cms/workflows/:id/activate — Activate workflow
POST   /api/developer/cms/workflows/:id/test    — Test workflow with sample data
```

### 3.10 Developer Portal — Audit Logs

```
GET    /api/developer/audit-logs                — Query audit logs (paginated, filterable)
GET    /api/developer/audit-logs/:id            — Get audit log detail
GET    /api/developer/audit-logs/stats          — Audit statistics (events per day, top actions)
GET    /api/developer/audit-logs/export         — Export audit logs (CSV/JSON)
GET    /api/developer/audit-logs/user/:userId   — Audit trail for specific user
GET    /api/developer/audit-logs/resource/:type/:id — Audit trail for specific resource
POST   /api/developer/audit-logs/search         — Advanced search with full-text
```

### 3.11 Public Endpoints (Feature Flags for Client Bootstrap)

```
GET    /api/config/public                       — Public platform configs
GET    /api/feature-flags                       — Active feature flags (role-aware)
```

---

## 4. New Frontend Pages (Developer Portal)

### 4.1 Route Structure

```
src/app/(developer)/
├── layout.tsx                          — Developer portal shell (dark sidebar, top bar)
├── page.tsx                            — Dashboard overview
├── platform/
│   ├── page.tsx                        — Platform overview
│   ├── config/
│   │   └── page.tsx                    — Platform configuration editor
│   ├── branding/
│   │   └── page.tsx                    — Logo, colors, favicon, meta tags
│   ├── navigation/
│   │   └── page.tsx                    — Navigation builder (drag-and-drop)
│   ├── feature-flags/
│   │   ├── page.tsx                    — Feature flags list
│   │   └── [id]/
│   │       └── page.tsx                — Edit feature flag
│   └── maintenance/
│       └── page.tsx                    — Maintenance mode toggle
├── auth/
│   ├── providers/
│   │   └── page.tsx                    — Auth provider configuration
│   ├── policies/
│   │   ├── page.tsx                    — Auth policies overview
│   │   └── [policyId]/
│   │       └── page.tsx                — Edit specific policy
│   ├── api-keys/
│   │   ├── page.tsx                    — API key management
│   │   └── [id]/
│   │       └── page.tsx                — View/revoke API key
│   └── security/
│       ├── page.tsx                    — Security policies dashboard
│       └── mfa/
│           └── page.tsx                — MFA enforcement settings
├── rbac/
│   ├── page.tsx                        — RBAC overview (role hierarchy visualization)
│   ├── roles/
│   │   ├── page.tsx                    — Role templates list
│   │   ├── create/
│   │   │   └── page.tsx                — Create new role template
│   │   └── [id]/
│   │       ├── page.tsx                — View/edit role template
│   │       └── permissions/
│   │           └── page.tsx            — Manage role permissions
│   ├── permissions/
│   │   ├── page.tsx                    — Permissions list (grouped by category)
│   │   ├── create/
│   │   │   └── page.tsx                — Create new permission
│   │   └── [id]/
│   │       └── page.tsx                — Edit permission
│   ├── categories/
│   │   ├── page.tsx                    — Permission categories
│   │   └── [id]/
│   │       └── page.tsx                — Edit category + its permissions
│   └── hierarchy/
│       └── page.tsx                    — Visual role hierarchy editor (tree/drag)
├── admins/
│   ├── page.tsx                        — Admins list with permission summary
│   └── [userId]/
│       └── permissions/
│           └── page.tsx                — Per-admin permission overrides
├── users/
│   ├── page.tsx                        — User management (search, filter, paginate)
│   ├── [id]/
│   │   ├── page.tsx                    — User detail
│   │   ├── sessions/
│   │   │   └── page.tsx                — User's active sessions
│   │   └── impersonate/
│   │       └── page.tsx                — Impersonation confirmation + start
│   └── stats/
│       └── page.tsx                    — User statistics dashboard
├── monitoring/
│   ├── page.tsx                        — Monitoring overview (live dashboard)
│   ├── online/
│   │   └── page.tsx                    — Real-time online users
│   ├── sessions/
│   │   └── page.tsx                    — All active sessions
│   ├── infrastructure/
│   │   └── page.tsx                    — System health
│   ├── api/
│   │   └── page.tsx                    — API metrics
│   └── alerts/
│       └── page.tsx                    — Alert management
├── cms/
│   ├── page.tsx                        — CMS overview
│   ├── pages/
│   │   ├── page.tsx                    — Page layouts list
│   │   ├── create/
│   │   │   └── page.tsx                — Create page
│   │   └── [id]/
│   │       └── page.tsx                — Visual page editor (section builder)
│   ├── components/
│   │   ├── page.tsx                    — Component library
│   │   └── [id]/
│   │       └── page.tsx                — Component schema editor
│   ├── navigation/
│   │   └── page.tsx                    — Navigation manager (per menu)
│   ├── themes/
│   │   ├── page.tsx                    — Theme manager
│   │   ├── create/
│   │   │   └── page.tsx                — Create theme (color picker, font selector)
│   │   └── [id]/
│   │       └── page.tsx                — Edit theme
│   ├── forms/
│   │   ├── page.tsx                    — Form builder list
│   │   ├── create/
│   │   │   └── page.tsx                — Visual form builder
│   │   └── [id]/
│   │       ├── page.tsx                — Edit form
│   │       └── submissions/
│   │           └── page.tsx            — View submissions
│   ├── notifications/
│   │   ├── page.tsx                    — Notification templates list
│   │   ├── create/
│   │   │   └── page.tsx                — Create template
│   │   └── [id]/
│   │       └── page.tsx                — Edit/preview template
│   └── workflows/
│       ├── page.tsx                    — Workflow list
│       ├── create/
│       │   └── page.tsx                — Visual workflow builder
│       └── [id]/
│           └── page.tsx                — Edit workflow
└── audit/
    ├── page.tsx                        — Audit log viewer (search, filter, export)
    └── [id]/
        └── page.tsx                    — Audit log detail
```

### 4.2 Client-Side Features Directory

```
src/features/developer/
├── _components/                        — Shared developer portal components
│   ├── DeveloperShell.tsx              — Main portal layout wrapper
│   ├── DeveloperSidebar.tsx            — Sidebar navigation
│   ├── DeveloperHeader.tsx             — Top bar (user info, notifications, quick actions)
│   ├── AuditBadge.tsx                  — Shows audit logging indicator
│   ├── MfaPrompt.tsx                   — MFA challenge modal
│   ├── ReAuthModal.tsx                 — Re-authentication modal
│   ├── ImpersonationBanner.tsx         — Yellow banner when impersonating
│   ├── LiveMonitor.tsx                 — Real-time monitoring widget
│   └── SecurityScoreCard.tsx           — Platform security score widget
├── _sections/                          — Page sections
│   ├── PlatformOverviewSection.tsx
│   ├── RbacHierarchySection.tsx
│   ├── UserStatsSection.tsx
│   ├── MonitoringDashboardSection.tsx
│   ├── CmsOverviewSection.tsx
│   └── AuditSummarySection.tsx
├── _services/                          — API service layer
│   ├── platform-config-service.ts
│   ├── feature-flag-service.ts
│   ├── role-template-service.ts
│   ├── permission-service.ts
│   ├── admin-permission-service.ts
│   ├── developer-user-service.ts
│   ├── monitoring-service.ts
│   ├── cms-service.ts
│   ├── audit-log-service.ts
│   └── security-service.ts
├── _hooks/                             — Custom hooks
│   ├── use-platform-config.ts
│   ├── use-feature-flags.ts
│   ├── use-role-templates.ts
│   ├── use-permissions.ts
│   ├── use-admin-permissions.ts
│   ├── use-monitoring.ts
│   ├── use-audit-logs.ts
│   ├── use-impersonation.ts
│   ├── use-re-auth.ts
│   └── use-live-users.ts
├── _types/                             — TypeScript types
│   ├── platform-config.ts
│   ├── feature-flag.ts
│   ├── role-template.ts
│   ├── permission.ts
│   ├── admin-permission.ts
│   ├── session.ts
│   ├── api-key.ts
│   ├── audit-log.ts
│   ├── cms.ts
│   ├── monitoring.ts
│   └── security.ts
├── _validation/                        — Zod schemas
│   ├── platform-config-schema.ts
│   ├── feature-flag-schema.ts
│   ├── role-template-schema.ts
│   ├── permission-schema.ts
│   └── form-builder-schema.ts
├── _utils/                             — Utility functions
│   ├── permission-computation.ts       — Compute effective permissions
│   ├── audit-formatter.ts              — Format audit log entries
│   └── monitoring-parsers.ts           — Parse monitoring data
├── feature.tsx                         — Feature boundary
└── index.ts                            — Barrel export
```

### 4.3 Navigation Structure

```typescript
// developerNavigation in config/navigation.ts
export const developerNavigation: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", url: "/developer", icon: "LayoutDashboard" },
      { label: "Platform Health", url: "/developer/monitoring", icon: "Activity" },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Configuration", url: "/developer/platform/config", icon: "Settings" },
      { label: "Branding", url: "/developer/platform/branding", icon: "Palette" },
      { label: "Navigation", url: "/developer/platform/navigation", icon: "Menu" },
      { label: "Feature Flags", url: "/developer/platform/feature-flags", icon: "Flag" },
      { label: "Maintenance", url: "/developer/platform/maintenance", icon: "Wrench" },
    ],
  },
  {
    label: "Security & Auth",
    items: [
      { label: "Auth Providers", url: "/developer/auth/providers", icon: "Key" },
      { label: "Policies", url: "/developer/auth/policies", icon: "Shield" },
      { label: "API Keys", url: "/developer/auth/api-keys", icon: "Terminal" },
      { label: "MFA Settings", url: "/developer/auth/security/mfa", icon: "Smartphone" },
    ],
  },
  {
    label: "RBAC",
    items: [
      { label: "Overview", url: "/developer/rbac", icon: "GitBranch" },
      { label: "Roles", url: "/developer/rbac/roles", icon: "Users" },
      { label: "Permissions", url: "/developer/rbac/permissions", icon: "Lock" },
      { label: "Hierarchy", url: "/developer/rbac/hierarchy", icon: "Network" },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Admin Permissions", url: "/developer/admins", icon: "UserCheck" },
      { label: "User Management", url: "/developer/users", icon: "Users" },
      { label: "User Statistics", url: "/developer/users/stats", icon: "BarChart3" },
    ],
  },
  {
    label: "CMS",
    items: [
      { label: "Pages", url: "/developer/cms/pages", icon: "FileText" },
      { label: "Components", url: "/developer/cms/components", icon: "Puzzle" },
      { label: "Navigation", url: "/developer/cms/navigation", icon: "Compass" },
      { label: "Themes", url: "/developer/cms/themes", icon: "Paintbrush" },
      { label: "Forms", url: "/developer/cms/forms", icon: "FormInput" },
      { label: "Notifications", url: "/developer/cms/notifications", icon: "Bell" },
      { label: "Workflows", url: "/developer/cms/workflows", icon: "Workflow" },
    ],
  },
  {
    label: "Observability",
    items: [
      { label: "Audit Logs", url: "/developer/audit", icon: "ScrollText" },
      { label: "Online Users", url: "/developer/monitoring/online", icon: "Radio" },
      { label: "Sessions", url: "/developer/monitoring/sessions", icon: "Monitor" },
      { label: "Infrastructure", url: "/developer/monitoring/infrastructure", icon: "Server" },
      { label: "API Metrics", url: "/developer/monitoring/api", icon: "LineChart" },
      { label: "Alerts", url: "/developer/monitoring/alerts", icon: "AlertTriangle" },
    ],
  },
];
```

---

## 5. Security

### 5.1 Authentication Requirements

The Developer role has the **strictest authentication requirements** of any role:

| Requirement | Detail |
|---|---|
| **Mandatory MFA** | Cannot log in without at least one MFA device enrolled. Server rejects login if `mfa_enrollment` table has no active entry for the user |
| **MFA Methods** | TOTP (Google Authenticator, etc.) and WebAuthn (hardware keys). SMS is NOT allowed for Developer |
| **Trusted Device** | Optional but recommended. Trusted devices still require MFA every 7 days |
| **Session Timeout** | Access token: 15 minutes. Refresh token: 4 hours (vs. 7 days for regular users) |
| **Re-authentication** | Required before: role changes, permission modifications, user deletion, security setting changes. Requires password + MFA |
| **Login Notifications** | Always sends email notification on new device/IP login |
| **Password Policy** | Minimum 16 characters, uppercase, lowercase, number, special. Must change every 90 days |
| **Account Lockout** | 5 failed attempts → 30-minute lockout (vs. 10 attempts for regular users) |

### 5.2 Impersonation Security

When the Developer impersonates another user:

1. The Developer's original session is preserved (not destroyed)
2. A **temporary impersonation token** is created with 30-minute max lifetime
3. All actions during impersonation are logged with BOTH the impersonator's ID AND the target user's ID
4. A persistent **yellow banner** is shown in the UI: "You are impersonating [username]. [End Session]"
5. Sensitive actions (delete, role change) are BLOCKED during impersonation
6. The impersonation event is logged at `CRITICAL` risk level

### 5.3 API Key Security

- API keys are shown **only once** at creation (full key)
- Stored as SHA-256 hashes in the database
- Rate-limited per key (configurable)
- Can be scoped to specific permissions
- Can have expiration dates
- All API key usage is audit-logged

### 5.4 Audit Logging Requirements

Every action by the Developer (and by all users) is audit-logged with:

- **Who:** user ID, role at time of action
- **What:** action type, resource type, resource ID
- **When:** timestamp (UTC)
- **Where:** IP address, user agent, location
- **Before/After:** old value and new value for mutations
- **Context:** session ID, request ID, risk level

The audit log table is **append-only**:
- No UPDATE or DELETE is allowed (enforced by MySQL trigger)
- The Developer can VIEW and EXPORT but not modify audit entries
- Audit logs are retained for a minimum of 2 years

### 5.5 Route Protection

```typescript
// Client-side route protection
PROTECTED_DEVELOPER: {
  pattern: /^\/developer/,
  requiredRole: "developer",
  requireMfa: true,
  requireRecentReAuth: true, // For sensitive pages
}
```

The Developer portal layout will:
1. Check for `role === "developer"` in the auth store
2. Redirect to `/auth/login` if not authenticated
3. Redirect to `/admin` if authenticated but not developer
4. Show MFA enrollment prompt if no MFA devices enrolled
5. Show re-authentication modal for sensitive operations

### 5.6 Server-Side Security

```java
// SecurityConstants.java additions
public static final String ROLE_DEVELOPER = "DEVELOPER";

// URL patterns
public static final String[] DEVELOPER_URLS = {"/api/developer/**"};

// SecurityConfig
.requestMatchers(DEVELOPER_URLS).hasRole("DEVELOPER")
```

---

## 6. Implementation Tasks (Phased)

### Phase 1: Foundation & Security Infrastructure (Weeks 1–3)

**Goal:** Establish the Developer role in the system with full security infrastructure.

#### Task 1.1: Database Schema — Role & Security Entities
- **Files:** Server JPA entities, Flyway migration
- **Work:**
  1. Add `DEVELOPER` to `UserRole` enum
  2. Create `mfa_enrollment` entity + repository
  3. Create `trusted_device` entity + repository
  4. Create `session` entity + repository
  5. Create `login_event` entity + repository
  6. Create `api_key` entity + repository
  7. Create the initial Flyway migration to add all new tables
  8. Add database indexes for all tables
  9. Add append-only trigger for `audit_log` (create table too)
- **Tests:** Entity mapping tests, migration test

#### Task 1.2: MFA System
- **Files:** MfaController, MfaService, TOTP utility, client MFA components
- **Work:**
  1. Server: TOTP secret generation (using `dev.samstevens.totp` or equivalent)
  2. Server: QR code data URI generation for enrollment
  3. Server: TOTP verification logic
  4. Server: MFA enrollment flow (enroll → verify → confirm)
  5. Server: MFA challenge flow during login
  6. Server: Enforce MFA requirement for DEVELOPER role in login flow
  7. Client: MFA enrollment page with QR code display
  8. Client: MFA verification input component
  9. Client: MFA device management page
  10. Client: MFA challenge modal during login
- **Tests:** TOTP generation/verification, enrollment flow, login with MFA

#### Task 1.3: Enhanced Login Flow
- **Files:** AuthenticationController, JwtService, login page
- **Work:**
  1. Modify login response to include `mfa_required` flag
  2. Add `mfa_required` → `mfa_verify` state in auth store
  3. Implement re-authentication endpoint
  4. Add login event logging (success/failure)
  5. Implement login notification email for new devices
  6. Implement account lockout with configurable thresholds
  7. Modify JWT claims to include `mfa_verified: true/false`
  8. Add MFA verification middleware for protected endpoints
- **Tests:** Full login flow with MFA, lockout behavior, notification sending

#### Task 1.4: Session Management
- **Files:** SessionService, session tracking middleware
- **Work:**
  1. Create session on login (store in DB)
  2. Track session activity (update `last_activity_at` on each request)
  3. Session listing endpoint
  4. Session revocation (single + all)
  5. Session expiry cleanup job
  6. Client: Session list in settings/security page
- **Tests:** Session lifecycle, concurrent sessions, revocation

#### Task 1.5: Trusted Device System
- **Files:** TrustedDeviceService, trusted device endpoints
- **Work:**
  1. Device fingerprint generation (browser-based)
  2. Trust/untrust device endpoints
  3. Trusted device check during MFA flow
  4. Device listing and revocation
  5. Auto-expiration (configurable, default 90 days)
- **Tests:** Trust flow, MFA bypass for trusted devices, expiration

#### Task 1.6: Client Role Update
- **Files:** `types/domain/session.ts`, `types/domain/user.ts`, `constants/security/roles.ts`, `constants/security/permissions.ts`
- **Work:**
  1. Add `"developer"` to client-side `UserRole` type
  2. Update `ROLE_HIERARCHY`: `{ developer: 4, admin: 3, alumni_lead: 2, alumni: 1 }`
  3. Add developer-specific permissions to permission constants
  4. Update `route-protection.ts` to add `PROTECTED_DEVELOPER` route classification
  5. Update `authorization-guard.ts` for developer role
- **Tests:** Type compilation, role hierarchy correctness

#### Task 1.7: Developer Portal Shell
- **Files:** `(developer)/layout.tsx`, sidebar, header, route protection
- **Work:**
  1. Create `(developer)` route group
  2. Create `DeveloperShell` layout component
  3. Create `DeveloperSidebar` with navigation from Section 4.3
  4. Create `DeveloperHeader` with user info, notification bell, quick actions
  5. Implement MFA check in layout — redirect to MFA enrollment if no devices
  6. Implement role check — redirect to `/admin` if not developer
  7. Add developer navigation to `config/navigation.ts`
  8. Create basic dashboard page (`/developer`)
- **Tests:** Layout renders, role guard works, MFA gate works

---

### Phase 2: RBAC Engine (Weeks 4–6)

**Goal:** Full dynamic RBAC system — roles, permissions, categories, hierarchy.

#### Task 2.1: Permission & Role Template Entities
- **Files:** JPA entities, repositories, Flyway migration
- **Work:**
  1. Create `permission` entity
  2. Create `permission_category` entity
  3. Create `permission_group` entity
  4. Create `role_template` entity
  5. Create `role_template_permission` join entity
  6. Create `role_template_hierarchy` join entity
  7. Create `admin_permission_override` entity
  8. Create database migration
  9. Seed default permissions (migrate existing 24 permissions + new ones)
  10. Seed default permission categories
  11. Seed default role templates (ADMIN, USER, ALUMNI_LEAD)
  12. Seed default role-permission mappings
- **Tests:** Entity tests, seed data correctness

#### Task 2.2: Permission Computation Service
- **Files:** PermissionService, PermissionComputation
- **Work:**
  1. Compute effective permissions for a user:
     - Get user's role template
     - Get all permissions from role template (direct)
     - Get all permissions from parent role templates (inherited)
     - Apply admin_permission_override (grant/deny)
     - Merge: inherited + direct + overrides (deny wins)
  2. Cache computed permissions in Redis/in-memory with invalidation on change
  3. Permission check utility: `hasPermission(userId, permissionKey)`
  4. Bulk permission check: `hasAnyPermission(userId, permissionKeys[])`
- **Tests:** Inheritance, override, deny-wins, cache invalidation

#### Task 2.3: Role Template CRUD API
- **Files:** RoleTemplateController, RoleTemplateService
- **Work:**
  1. List, get, create, update, delete role templates
  2. Clone role template (deep copy permissions + hierarchy)
  3. Archive/restore role templates
  4. Validate: cannot delete system roles (ADMIN, USER)
  5. Validate: cannot delete roles assigned to users
  6. Validate: hierarchy prevents circular references
  7. Update hierarchy relationships
- **Tests:** CRUD operations, clone, archive, validation rules

#### Task 2.4: Permission CRUD API
- **Files:** PermissionController, PermissionService, CategoryController, GroupController
- **Work:**
  1. Permission CRUD (create, read, update, delete)
  2. Permission category CRUD
  3. Permission group CRUD
  4. Assign/revoke permissions to role templates
  5. List permissions for a role template
  6. Validate: cannot delete permissions assigned to active roles
  7. Permission key uniqueness validation
- **Tests:** Full CRUD, assignment, validation

#### Task 2.5: Admin Permission Override API
- **Files:** AdminPermissionController, AdminPermissionService
- **Work:**
  1. Get admin's effective permissions (computed)
  2. Set overrides (replace all)
  3. Grant/revoke individual overrides
  4. Optional: expiration-based auto-revocation
  5. Validate: cannot override DEVELOPER role
  6. Validate: cannot grant permissions the granter doesn't have
- **Tests:** Override computation, expiration, validation

#### Task 2.6: Client RBAC Pages
- **Files:** Developer portal RBAC pages (see Section 4.1)
- **Work:**
  1. RBAC overview page with hierarchy visualization
  2. Role templates list page (table with actions)
  3. Create/edit role template page
  4. Permission assignment page (checkbox grid: categories × permissions)
  5. Permissions list page (grouped by category)
  6. Create/edit permission page
  7. Permission categories management page
  8. Visual hierarchy editor (tree component with drag-and-drop)
  9. Admin permission overrides page (per-admin)
- **Tests:** Page rendering, form validation, API integration

---

### Phase 3: Platform Configuration & Feature Flags (Weeks 7–8)

**Goal:** Full platform configuration management and feature flag system.

#### Task 3.1: Platform Config API
- **Files:** PlatformConfigController, PlatformConfigService
- **Work:**
  1. CRUD for platform config entries
  2. Bulk update endpoint
  3. Public config endpoint (cached, no auth required)
  4. Config validation based on `value_type` and `validation_rule`
  5. Config change audit logging
  6. Redis/in-memory cache with invalidation
  7. Seed default configs (app name, logo, theme, etc.)
- **Tests:** CRUD, validation, caching, public endpoint

#### Task 3.2: Feature Flag API
- **Files:** FeatureFlagController, FeatureFlagService
- **Work:**
  1. CRUD for feature flags
  2. Toggle endpoint
  3. Role-aware active flags endpoint (for client bootstrap)
  4. Gradual rollout logic (percentage-based)
  5. User-specific flag overrides
  6. Feature flag audit logging
  7. Cache with short TTL (30 seconds for active flags)
- **Tests:** CRUD, toggle, role filtering, percentage rollout

#### Task 3.3: Client Platform Config Pages
- **Files:** Developer portal platform pages
- **Work:**
  1. Platform overview page
  2. Configuration editor (categorized, with type-aware inputs)
  3. Branding page (logo upload, colors, favicon, meta tags)
  4. Navigation builder page (visual drag-and-drop menu editor)
  5. Feature flags list page
  6. Feature flag edit page
  7. Maintenance mode page (global toggle + custom message)
- **Tests:** Page rendering, form inputs, real-time preview

---

### Phase 4: User Management & Monitoring (Weeks 9–10)

**Goal:** Full user management with impersonation and live monitoring.

#### Task 4.1: Developer User Management API
- **Files:** DeveloperUserController, DeveloperUserService
- **Work:**
  1. List users with search, filter, pagination
  2. Get user details (including sessions, permissions)
  3. Update user (role, status, profile)
  4. Soft-delete user
  5. Suspend/activate user
  6. Change user role (with validation)
  7. Force password reset
  8. View user's active sessions
  9. Revoke user sessions
  10. Impersonation: generate temp token, track impersonation session
  11. User statistics endpoint
- **Tests:** All CRUD, impersonation flow, statistics

#### Task 4.2: Monitoring Service
- **Files:** MonitoringController, MonitoringService
- **Work:**
  1. Online users endpoint (query active sessions)
  2. Session statistics (total, active, by device, by role)
  3. Infrastructure health (DB connection pool, disk space, memory, CPU)
  4. API metrics (response times, error rates, endpoint popularity)
  5. Login event stream (recent 1000 events)
  6. Alert system (configurable thresholds)
  7. Real-time updates via SSE or polling
- **Tests:** Metrics accuracy, health checks, alerting

#### Task 4.3: Client User Management & Monitoring Pages
- **Files:** Developer portal user and monitoring pages
- **Work:**
  1. User management list page (searchable table with bulk actions)
  2. User detail page (info, sessions, permissions, activity)
  3. Impersonation flow (confirmation modal → banner → end button)
  4. User statistics dashboard (charts: growth, distribution, activity)
  5. Live monitoring dashboard (online users, active sessions)
  6. Infrastructure health page
  7. API metrics page
  8. Alert management page
- **Tests:** Page rendering, real-time updates, impersonation banner

---

### Phase 5: CMS & Content Management (Weeks 11–13)

**Goal:** Full CMS with visual page builder, component library, navigation, themes, forms, workflows.

#### Task 5.1: CMS Entities & API
- **Files:** CMS entities, CMS controllers, CMS services
- **Work:**
  1. Page layout CRUD
  2. Page section CRUD (add, update, reorder, delete)
  3. Component library CRUD
  4. Navigation builder CRUD
  5. Theme manager CRUD + activate
  6. Form builder CRUD + submissions
  7. Notification template CRUD + preview + test send
  8. Workflow builder CRUD + test run
  9. Page publish/unpublish
  10. Seed default component library
  11. Seed default navigation menus
  12. Seed default theme
- **Tests:** All CRUD, publish workflow, form submissions

#### Task 5.2: Client CMS Pages
- **Files:** Developer portal CMS pages
- **Work:**
  1. CMS overview page (quick stats, recent changes)
  2. Page layouts list + visual page editor (drag sections, configure props)
  3. Component library browser + schema editor
  4. Navigation manager (per-menu, drag-and-drop)
  5. Theme manager (color picker, font selector, live preview)
  6. Form builder (visual drag-and-drop field placement)
  7. Form submissions viewer
  8. Notification template editor (with variable autocomplete and preview)
  9. Workflow builder (visual node-based editor)
- **Tests:** Visual editors, drag-and-drop, preview functionality

---

### Phase 6: Audit System & Final Integration (Weeks 14–16)

**Goal:** Complete audit logging, export, and final integration testing.

#### Task 6.1: Audit Log API
- **Files:** AuditLogController, AuditLogService
- **Work:**
  1. Audit log query endpoint (paginated, filterable by user, action, resource, date range, risk level)
  2. Audit log detail endpoint
  3. Audit statistics endpoint (events per day, top actions, top users)
  4. Export endpoint (CSV, JSON)
  5. User-specific audit trail
  6. Resource-specific audit trail
  7. Advanced search (full-text on action, resource, values)
  8. Audit log retention policy enforcement (archive after 2 years)
- **Tests:** Query filters, export, statistics, retention

#### Task 6.2: Audit Instrumentation
- **Files:** AuditAspect (AOP), AuditService, interceptor
- **Work:**
  1. Create `@Auditable` annotation for methods
  2. AOP aspect that intercepts `@Auditable` methods and logs before/after
  3. Manual audit logging service for cases where AOP isn't suitable
  4. Audit context propagation (user, session, request ID)
  5. Batch audit log writes for performance (async queue)
  6. Audit log integrity check (hash chain)
- **Tests:** Annotation processing, async writes, integrity

#### Task 6.3: Client Audit Log Pages
- **Files:** Developer portal audit pages
- **Work:**
  1. Audit log viewer (filterable table with date range picker, action filter, user filter, risk level filter)
  2. Audit log detail page (full event breakdown)
  3. Audit statistics dashboard (charts: events over time, top actions, top users, risk distribution)
  4. Export functionality (CSV/JSON download)
  5. User audit trail page
  6. Resource audit trail page
- **Tests:** Filters, export, statistics display

#### Task 6.4: Integration Testing
- **Work:**
  1. End-to-end login flow with MFA
  2. Impersonation flow with audit trail
  3. Role template creation → permission assignment → admin override → verify effective permissions
  4. Feature flag toggle → verify client-side behavior
  5. CMS page creation → publish → verify public rendering
  6. Platform config change → verify cached public config updates
  7. User suspension → verify all sessions revoked
  8. API key creation → use key → verify audit log
  9. Full audit trail verification for every operation
- **Tests:** Comprehensive E2E test suite

#### Task 6.5: Security Hardening
- **Work:**
  1. Rate limiting on developer portal endpoints (stricter than public)
  2. Request validation on all endpoints (input sanitization)
  3. CSRF protection for developer portal
  4. Content Security Policy headers
  5. Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
  6. Penetration testing checklist
  7. Dependency vulnerability audit
- **Tests:** Security scan, dependency audit

---

## 7. Database Schema Changes

### 7.1 Migration Strategy

Since the project uses **Hibernate `ddl-auto=update`** with no existing migration tool, we have two options:

**Recommended: Introduce Flyway**

1. Add Flyway dependency to `pom.xml`
2. Set `spring.jpa.hibernate.ddl-auto=validate` (stop auto-creating)
3. Create `V1__baseline.sql` from current schema (export existing tables)
4. Create `V2__add_developer_role.sql` for all new tables

### 7.2 Complete Schema Addition

```sql
-- V2__add_developer_role.sql

-- 1. Add DEVELOPER to user_role enum
ALTER TABLE user_account MODIFY COLUMN role ENUM('DEVELOPER', 'ADMIN', 'USER') NOT NULL;

-- 2. MFA enrollment
CREATE TABLE mfa_enrollment (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    user_id UUID NOT NULL,
    method ENUM('TOTP', 'WEBAUTHN', 'SMS') NOT NULL,
    label VARCHAR(100) NOT NULL,
    secret VARCHAR(255) NOT NULL,
    public_key TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP NULL,
    enrollment_ip VARCHAR(45),
    enrollment_user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE,
    INDEX idx_mfa_user (user_id)
);

-- 3. Trusted devices
CREATE TABLE trusted_device (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    user_id UUID NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(200),
    ip_address VARCHAR(45),
    user_agent TEXT,
    trusted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE,
    INDEX idx_trusted_device_user (user_id),
    INDEX idx_trusted_device_fingerprint (device_fingerprint)
);

-- 4. Sessions
CREATE TABLE developer_session (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    user_id UUID NOT NULL,
    token_jti VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type ENUM('DESKTOP', 'MOBILE', 'TABLET', 'UNKNOWN') DEFAULT 'UNKNOWN',
    location VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE,
    INDEX idx_session_user (user_id),
    INDEX idx_session_jti (token_jti),
    INDEX idx_session_active (is_active, last_activity_at)
);

-- 5. Login events
CREATE TABLE login_event (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    user_id UUID NULL,
    username_attempted VARCHAR(100),
    status ENUM('SUCCESS', 'FAILED_PASSWORD', 'FAILED_MFA', 'FAILED_LOCKED', 'FAILED_DISABLED') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    location VARCHAR(200),
    mfa_method VARCHAR(50),
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE SET NULL,
    INDEX idx_login_event_user (user_id),
    INDEX idx_login_event_status (status),
    INDEX idx_login_event_time (created_at)
);

-- 6. API keys
CREATE TABLE api_key (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    user_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    key_prefix VARCHAR(10) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    permissions JSON,
    rate_limit INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE,
    INDEX idx_api_key_user (user_id),
    INDEX idx_api_key_prefix (key_prefix),
    INDEX idx_api_key_hash (key_hash)
);

-- 7. Role templates
CREATE TABLE role_template (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    hierarchy_level INT NOT NULL DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    clone_source_id UUID NULL,
    created_by UUID NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE KEY uk_role_template_slug (slug),
    FOREIGN KEY (clone_source_id) REFERENCES role_template(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL
);

-- 8. Permission categories
CREATE TABLE permission_category (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    key VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_perm_category_key (key)
);

-- 9. Permission groups
CREATE TABLE permission_group (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    category_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES permission_category(id) ON DELETE CASCADE
);

-- 10. Permissions
CREATE TABLE permission (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    key VARCHAR(150) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID NOT NULL,
    group_id UUID NULL,
    is_dangerous BOOLEAN DEFAULT FALSE,
    requires_mfa BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_permission_key (key),
    FOREIGN KEY (category_id) REFERENCES permission_category(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES permission_group(id) ON DELETE SET NULL
);

-- 11. Role template ↔ Permission mapping
CREATE TABLE role_template_permission (
    role_template_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    granted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_template_id, permission_id),
    FOREIGN KEY (role_template_id) REFERENCES role_template(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permission(id) ON DELETE CASCADE
);

-- 12. Role hierarchy
CREATE TABLE role_template_hierarchy (
    parent_role_template_id UUID NOT NULL,
    child_role_template_id UUID NOT NULL,
    PRIMARY KEY (parent_role_template_id, child_role_template_id),
    FOREIGN KEY (parent_role_template_id) REFERENCES role_template(id) ON DELETE CASCADE,
    FOREIGN KEY (child_role_template_id) REFERENCES role_template(id) ON DELETE CASCADE
);

-- 13. Admin permission overrides
CREATE TABLE admin_permission_override (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    user_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    granted BOOLEAN NOT NULL,
    reason TEXT,
    expires_at TIMESTAMP NULL,
    created_by UUID NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_admin_override (user_id, permission_id),
    FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permission(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL
);

-- 14. Audit log (append-only)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id UUID NULL,
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id UUID NULL,
    request_id VARCHAR(100),
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'LOW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE SET NULL,
    INDEX idx_audit_user_time (user_id, timestamp),
    INDEX idx_audit_action_time (action, timestamp),
    INDEX idx_audit_resource (resource_type, resource_id),
    INDEX idx_audit_risk (risk_level, timestamp),
    INDEX idx_audit_time (timestamp)
);

-- Prevent updates and deletes on audit_log
DELIMITER //
CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON audit_log
FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Audit log records cannot be updated';
END //
CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON audit_log
FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Audit log records cannot be deleted';
END //
DELIMITER ;

-- 15. Platform config
CREATE TABLE platform_config (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    config_key VARCHAR(200) NOT NULL,
    value TEXT,
    value_type ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'COLOR') DEFAULT 'STRING',
    category VARCHAR(100),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    validation_rule TEXT,
    default_value TEXT,
    updated_by UUID NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_config_key (config_key),
    FOREIGN KEY (updated_by) REFERENCES user_account(id) ON DELETE SET NULL,
    INDEX idx_config_category (category),
    INDEX idx_config_public (is_public)
);

-- 16. Feature flags
CREATE TABLE feature_flag (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    flag_key VARCHAR(150) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INT DEFAULT 0,
    allowed_roles JSON,
    allowed_user_ids JSON,
    target_audience ENUM('ALL', 'ADMINS_ONLY', 'SPECIFIC_USERS', 'PERCENTAGE') DEFAULT 'ALL',
    created_by UUID NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_feature_flag_key (flag_key),
    FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL
);

-- 17. Page layouts (CMS)
CREATE TABLE page_layout (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    slug VARCHAR(200) NOT NULL,
    title VARCHAR(300) NOT NULL,
    layout_config JSON,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP NULL,
    created_by UUID NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE KEY uk_page_slug (slug),
    FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL
);

-- 18. Page sections
CREATE TABLE page_section (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    page_layout_id UUID NOT NULL,
    component_key VARCHAR(200),
    title VARCHAR(300),
    props JSON,
    sort_order INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (page_layout_id) REFERENCES page_layout(id) ON DELETE CASCADE,
    INDEX idx_section_page (page_layout_id)
);

-- 19. Component library
CREATE TABLE component_library (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    component_key VARCHAR(200) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    schema JSON,
    default_props JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_component_key (component_key)
);

-- 20. Navigation builder
CREATE TABLE navigation_item (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    menu_key VARCHAR(100) NOT NULL,
    parent_id UUID NULL,
    label VARCHAR(200) NOT NULL,
    url VARCHAR(500),
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    required_role VARCHAR(50),
    permissions_required JSON,
    open_in_new_tab BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES navigation_item(id) ON DELETE CASCADE,
    INDEX idx_nav_menu (menu_key),
    INDEX idx_nav_parent (parent_id)
);

-- 21. Theme config
CREATE TABLE theme_config (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    colors JSON,
    typography JSON,
    spacing JSON,
    border_radius JSON,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 22. Form builder
CREATE TABLE form_builder (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    form_key VARCHAR(150) NOT NULL,
    name VARCHAR(200) NOT NULL,
    fields JSON,
    submit_action JSON,
    validation_rules JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_form_key (form_key),
    FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL
);

-- 23. Notification templates
CREATE TABLE notification_template (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    template_key VARCHAR(150) NOT NULL,
    name VARCHAR(200) NOT NULL,
    channel ENUM('EMAIL', 'IN_APP', 'SMS', 'PUSH') NOT NULL,
    subject VARCHAR(500),
    body_template TEXT NOT NULL,
    variables JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_notification_key (template_key)
);

-- 24. Seed DEVELOPER user
-- Replace 'dev@jjcet.edu' with actual developer email
INSERT INTO user_account (id, username, password_hash, role, email_verified, account_status, created_at, updated_at)
VALUES (UUID(), 'developer', '$2a$12$...placeholder...', 'DEVELOPER', TRUE, 'ACTIVE', NOW(), NOW());

-- 25. Seed permission categories
INSERT INTO permission_category (id, `key`, name, description, sort_order) VALUES
(UUID(), 'user-management', 'User Management', 'Manage user accounts and roles', 1),
(UUID(), 'content-management', 'Content Management', 'Manage pages, sections, and content', 2),
(UUID(), 'event-management', 'Event Management', 'Create and manage events', 3),
(UUID(), 'security', 'Security', 'Security policies and authentication', 4),
(UUID(), 'platform', 'Platform', 'Platform configuration and settings', 5),
(UUID(), 'audit', 'Audit', 'Audit log access and management', 6),
(UUID(), 'monitoring', 'Monitoring', 'System monitoring and health', 7),
(UUID(), 'cms', 'CMS', 'Content management system operations', 8),
(UUID(), 'communication', 'Communication', 'Messaging and notifications', 9),
(UUID(), 'reports', 'Reports', 'Analytics and reporting', 10);
```

---

## 8. Migration Strategy

### 8.1 Introducing Flyway

1. Add Flyway dependency to `server/alumniweb/pom.xml`:
   ```xml
   <dependency>
       <groupId>org.flywaydb</groupId>
       <artifactId>flyway-core</artifactId>
   </dependency>
   <dependency>
       <groupId>org.flywaydb</groupId>
       <artifactId>flyway-mysql</artifactId>
   </dependency>
   ```

2. Configure in `application.properties`:
   ```properties
   spring.flyway.enabled=true
   spring.flyway.locations=classpath:db/migration
   spring.flyway.baseline-on-migrate=true
   spring.jpa.hibernate.ddl-auto=validate
   ```

3. Export current schema as baseline:
   ```bash
   mysqldump --no-data --routines --triggers alumniweb > V1__baseline.sql
   ```

4. Create `V2__add_developer_role.sql` with all new tables (from Section 7.2)

### 8.2 Seed Data

Create `V3__seed_developer_role.sql`:

1. Insert DEVELOLER user account (password: set via env variable, hash in migration)
2. Seed permission categories (10 categories)
3. Seed permission groups
4. Seed permissions (all ~80+ permissions across categories)
5. Seed role templates (DEVELOPER immutable, ADMIN, USER, ALUMNI_LEAD)
6. Seed role-template-permission mappings
7. Seed default platform configs
8. Seed default feature flags (all disabled)
9. Seed default navigation menus
10. Seed default theme
11. Seed default component library entries

### 8.3 Rollback Plan

Each Flyway migration should include a `Undo` script:
- `V2__add_developer_role.sql` → `U2__remove_developer_role.sql` (drops all new tables, removes DEVELOPER from enum)
- `V3__seed_developer_role.sql` → `U3__unseed_developer_role.sql` (deletes seed data)

### 8.4 Zero-Downtime Migration

1. The migration is additive only (new tables, no modifications to existing tables except enum extension)
2. Existing `ADMIN` and `USER` accounts are unaffected
3. The `DEVELOPER` enum value is backward-compatible with existing queries
4. New API endpoints are behind `/api/developer/**` — no existing endpoints are affected
5. The developer portal is a new route group — no existing routes are affected
6. Deploy in order: Server migration → Server code → Client code

### 8.5 Testing Checklist

Before deployment:
- [ ] All Flyway migrations run cleanly on fresh database
- [ ] All Flyway migrations run cleanly on existing database (upgrade path)
- [ ] DEVELOPER user can log in with MFA
- [ ] DEVELOPER portal is inaccessible to non-developer users
- [ ] Admin users cannot create/modify/delete DEVELOPER accounts
- [ ] Audit log is append-only (UPDATE and DELETE are blocked)
- [ ] Role template deletion is blocked for system roles
- [ ] Permission inheritance computes correctly
- [ ] Admin permission overrides work as expected
- [ ] Feature flags respect role-based targeting
- [ ] All new endpoints return 403 for non-developer users
- [ ] Session management works (list, revoke, expiry)
- [ ] Impersonation creates proper audit trail
- [ ] Public config endpoint returns only public configs
- [ ] No existing functionality is broken

---

## Appendix A: Permission Catalog

### Category: User Management
| Key | Name | Dangerous | Requires MFA |
|---|---|---|---|
| `user:read` | View users | | |
| `user:create` | Create users | | |
| `user:update` | Edit users | | |
| `user:delete` | Delete users | Yes | Yes |
| `user:impersonate` | Impersonate users | Yes | Yes |
| `user:manage-roles` | Change user roles | Yes | Yes |
| `user:suspend` | Suspend users | Yes | |
| `user:activate` | Activate users | | |
| `user:view-sessions` | View user sessions | | |
| `user:revoke-sessions` | Revoke user sessions | Yes | |
| `user:reset-password` | Force password reset | Yes | Yes |
| `user:view-stats` | View user statistics | | |

### Category: Role & Permission Management
| Key | Name | Dangerous | Requires MFA |
|---|---|---|---|
| `role:read` | View role templates | | |
| `role:create` | Create role templates | | |
| `role:update` | Edit role templates | | |
| `role:delete` | Delete role templates | Yes | Yes |
| `role:clone` | Clone role templates | | |
| `role:archive` | Archive role templates | | |
| `role:manage-hierarchy` | Edit role hierarchy | Yes | Yes |
| `permission:read` | View permissions | | |
| `permission:create` | Create permissions | | |
| `permission:update` | Edit permissions | | |
| `permission:delete` | Delete permissions | Yes | |
| `admin-override:manage` | Manage admin overrides | Yes | Yes |

### Category: Platform Configuration
| Key | Name | Dangerous | Requires MFA |
|---|---|---|---|
| `config:read` | View platform config | | |
| `config:update` | Update platform config | | |
| `config:delete` | Delete config keys | Yes | |
| `feature-flag:read` | View feature flags | | |
| `feature-flag:create` | Create feature flags | | |
| `feature-flag:update` | Edit feature flags | | |
| `feature-flag:delete` | Delete feature flags | | |
| `feature-flag:toggle` | Toggle feature flags | | |
| `branding:update` | Update branding | | |
| `navigation:update` | Update navigation | | |
| `maintenance:toggle` | Toggle maintenance mode | Yes | Yes |

### Category: CMS
| Key | Name | Dangerous | Requires MFA |
|---|---|---|---|
| `page:read` | View pages | | |
| `page:create` | Create pages | | |
| `page:update` | Edit pages | | |
| `page:delete` | Delete pages | Yes | |
| `page:publish` | Publish/unpublish pages | | |
| `component:read` | View components | | |
| `component:manage` | Manage components | | |
| `form:read` | View forms | | |
| `form:create` | Create forms | | |
| `form:update` | Edit forms | | |
| `form:delete` | Delete forms | | |
| `form:view-submissions` | View form submissions | | |
| `notification:manage` | Manage notification templates | | |
| `notification:send-test` | Send test notifications | | |
| `workflow:manage` | Manage workflows | | |
| `theme:manage` | Manage themes | | |

### Category: Security
| Key | Name | Dangerous | Requires MFA |
|---|---|---|---|
| `auth:manage-providers` | Manage auth providers | Yes | Yes |
| `auth:manage-policies` | Manage auth policies | Yes | Yes |
| `auth:manage-mfa` | Manage MFA settings | Yes | Yes |
| `api-key:read` | View API keys | | |
| `api-key:create` | Create API keys | | |
| `api-key:revoke` | Revoke API keys | Yes | |
| `security:manage` | Manage security policies | Yes | Yes |

### Category: Monitoring & Audit
| Key | Name | Dangerous | Requires MFA |
|---|---|---|---|
| `audit:read` | View audit logs | | |
| `audit:export` | Export audit logs | | |
| `audit:search` | Advanced audit search | | |
| `monitoring:view` | View monitoring dashboard | | |
| `monitoring:sessions` | View all sessions | | |
| `monitoring:infrastructure` | View infrastructure health | | |
| `monitoring:api-metrics` | View API metrics | | |
| `monitoring:alerts` | Manage alerts | | |

### Category: Communication
| Key | Name | Dangerous | Requires MFA |
|---|---|---|---|
| `announcement:create` | Create announcements | | |
| `announcement:update` | Edit announcements | | |
| `announcement:delete` | Delete announcements | | |
| `message:read:any` | Read any user's messages | Yes | Yes |
| `email:send-bulk` | Send bulk emails | Yes | |

### Category: Reports
| Key | Name | Dangerous | Requires MFA |
|---|---|---|---|
| `report:view` | View reports | | |
| `report:export` | Export reports | | |
| `report:advanced` | Advanced analytics | | |
