# Developer Portal — All 19 Pages Explained

The developer portal is the **platform owner's control panel**. Only the `developer` role can access it. It has 6 groups with 19 pages.

## Navigation Structure

```
Overview
  ├── Dashboard           → Stats overview, quick links
  └── Monitoring          → System health, memory, CPU, uptime

Platform
  ├── Configuration       → Key-value config store
  ├── Branding            → Site name, colors, logo, favicon
  ├── Feature Flags       → Toggle features on/off per audience
  └── Maintenance         → Maintenance mode toggle + message

Security
  ├── Auth Policies       → Password rules, session limits, JWT config
  ├── API Keys            → Generate/revoke API keys for integrations
  └── MFA Settings        → Toggle MFA per role

RBAC
  ├── Roles               → Create/edit/delete role templates
  ├── Permissions         → Manage permission definitions
  └── Admin Overrides     → Force-grant permissions to roles

Users
  ├── All Users           → List, search, suspend, activate, change role
  └── Sessions            → Login history, active sessions

CMS
  ├── Pages               → CRUD page layouts with publish/unpublish
  ├── Navigation          → Edit main navigation menu
  ├── Themes              → Customize fonts, colors, shadows
  └── Notifications       → Email/SMS/push settings + SMTP config

Observability
  └── Audit Logs          → Filterable audit trail with realtime SSE
```

## Page-by-Page Details

### 1. Dashboard (`/developer`)
**Backend API:** `GET /api/developer/feature-flags`, `GET /api/developer/users`, `GET /api/developer/audit/stats`, `GET /api/developer/monitoring`

Shows:
- Total users count
- Feature flags count
- Audit log count
- Active sessions
- Memory usage
- Quick links to all sections

**Why:** One-glance overview of platform health without navigating away.

---

### 2. Monitoring (`/developer/monitoring`)
**Backend API:** `GET /api/developer/monitoring`

Shows: CPU usage, memory (used/max MB), uptime, disk usage, thread count, JVM info.

**Why:** Developer needs to know system resource usage without SSH'ing into the server.

---

### 3. Configuration (`/developer/platform/config`)
**Backend API:** `GET /api/developer/config`, `PUT /api/developer/config/{key}`, `POST /api/developer/config`

Full CRUD on platform_config table. Each config has key, value, type (STRING/INTEGER/BOOLEAN/JSON/ENCRYPTED), category, sensitivity flag.

**Why:** All platform settings stored in DB instead of hardcoded. Change any setting without code deployment.

---

### 4. Branding (`/developer/platform/branding`)
**Backend API:** Same as Configuration (uses platform_config with `brand.*` keys)

Stores: site name, tagline, colors (with live preview), logo URL, favicon, footer text, contact info.

**Why:** Non-technical users can change branding without developer help. Color previews prevent mistakes.

---

### 5. Feature Flags (`/developer/platform/feature-flags`)
**Backend API:** `GET/POST/PUT/DELETE /api/developer/feature-flags`, `PATCH /{id}/toggle`

Full CRUD + toggle. Each flag has code, name, description, enabled boolean, rollout percentage, target audience.

**Why:** Ship features behind flags. Toggle instantly without deployment. A/B test by audience.

---

### 6. Maintenance (`/developer/platform/maintenance`)
**Backend API:** Uses platform_config with `system.maintenance_mode` and `system.maintenance_message` keys.

Toggle maintenance mode ON/OFF. Set custom message users see.

**Why:** Quick maintenance mode without server restart. Custom message informs users what's happening.

---

### 7. Auth Policies (`/developer/auth/policies`)
**Backend API:** Uses platform_config with `auth.*` keys.

11 configurable fields:
- Password min length, require uppercase/number/special
- Max login attempts, lockout duration
- Session timeout, JWT expiry, refresh token expiry
- Email verification requirement, registration toggle

**Why:** Security policies adjustable by platform owner without code changes.

---

### 8. API Keys (`/developer/auth/api-keys`)
**Backend API:** Uses platform_config with `apikey.*` keys.

Generate 32-char random keys. Store metadata (name, created date, active status) as JSON in value field. Revoke by setting active=false.

**Why:** External integrations need API keys. Generate/revoke without database migration.

---

### 9. MFA Settings (`/developer/auth/mfa`)
**Backend API:** Uses platform_config with `mfa.*` keys.

7 toggle options: global MFA, required per role (admin/developer), allowed methods (SMS/authenticator/backup codes), backup code count.

**Why:** MFA requirements vary by threat level. Developer can enforce MFA for admins only during sensitive periods.

---

### 10. Roles (`/developer/rbac/roles`)
**Backend API:** `GET/POST/PUT/DELETE /api/developer/roles`, `PUT /{id}/permissions`

Create/edit/delete role templates. Assign permissions to roles. Role hierarchy: developer > admin > alumni_lead > alumni.

**Why:** Dynamic RBAC — add new business roles without code changes. Assign fine-grained permissions per role.

---

### 11. Permissions (`/developer/rbac/permissions`)
**Backend API:** `GET/POST/PUT/DELETE /api/developer/permissions`, `GET/POST/PUT/DELETE /api/developer/permissions/categories`

Manage individual permissions and their categories. Each permission has name, code, description, category.

**Why:** Permission definitions are first-class entities. Change permissions without touching role code.

---

### 12. Admin Overrides (`/developer/rbac/admin-overrides`)
**Backend API:** `PUT /api/developer/roles/{id}/permissions`

Force-grant specific permissions to roles regardless of standard assignment.

**Why:** Emergency access — grant admin full permissions temporarily without changing role definition.

---

### 13. All Users (`/developer/users`)
**Backend API:** `GET /api/developer/users`, `PUT /{id}`, `POST /{id}/suspend`, `POST /{id}/activate`, `PUT /{id}/role`

List with pagination and search. Suspend/activate users. Change user roles.

**Why:** User management is the most common developer task. One page handles everything.

---

### 14. Sessions (`/developer/sessions`)
**Backend API:** Uses audit logs filtered by LOGIN/LOGOUT actions.

Shows login history: when, where (IP), which device (user agent), success/failure.

**Why:** Security awareness — know who logged in and from where. Detect unauthorized access.

---

### 15. CMS Pages (`/developer/cms/pages`)
**Backend API:** `GET/POST/PUT/DELETE /api/developer/cms/pages`, `POST /{id}/publish`

Full CRUD. Each page has name, slug (auto-generated from name), description, template selector, active toggle, meta title/description for SEO.

**Why:** Non-technical users can create/manage pages. Templates provide consistent layouts.

---

### 16. Navigation (`/developer/cms/navigation`)
**Backend API:** Uses platform_config with `nav.main` key.

Add/remove/reorder nav items. Each item has label, href, order. Save as JSON array.

**Why:** Navigation changes without deployment. Reorder by drag (up/down buttons).

---

### 17. Themes (`/developer/cms/themes`)
**Backend API:** Uses platform_config with `theme.*` keys.

8 customizable fields: body font, heading font, body bg/text colors, sidebar bg/text, border radius, card shadow. Live preview box.

**Why:** Visual customization without CSS expertise. Preview before save.

---

### 18. Notifications (`/developer/cms/notifications`)
**Backend API:** Uses platform_config with `notification.*` keys.

7 channel toggles (email, push, SMS, welcome, event reminders, password reset, activity digest) + 5 SMTP fields.

**Why:** Notification preferences adjustable per channel. SMTP config separate from UI toggles.

---

### 19. Audit Logs (`/developer/audit`)
**Backend API:** `GET /api/developer/audit` (paginated + filtered), `GET /api/developer/audit/stats`, `GET /api/developer/audit/export`, SSE `GET /api/developer/audit/stream`

7 filter fields: category, log level, method, action, user ID, endpoint search, date range. Export CSV/JSON. Realtime SSE toggle.

**Why:** Every sensitive action is traceable. Filters help find specific events. Export for compliance.

## Pattern: Config-Based Pages

Many pages (branding, maintenance, auth policies, MFA, themes, notifications, navigation) store data in the `platform_config` table instead of dedicated tables.

**Why?** 
- One API serves all config pages
- No new DB tables needed for each feature
- Change any setting via API without deployment
- Developer portal pages are just UI over the same config store

**How it works:**
```
Page renders fields → User edits → "Save" calls updatePlatformConfig(key, value)
→ PUT /api/developer/config/{key} → Spring saves to platform_config table
→ Page re-fetches and shows updated values
```
