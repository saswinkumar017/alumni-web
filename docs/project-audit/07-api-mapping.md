# API Mapping — Frontend ↔ Backend

Every frontend page and what backend endpoint it calls.

## Developer Portal Pages

### Overview Group
| Page | Frontend Function | Backend Endpoint | Method |
|------|------------------|-----------------|--------|
| Dashboard | `getUsers()`, `getFeatureFlags()`, `getAuditStats()`, `getMonitoringData()` | `GET /developer/users`, `GET /developer/feature-flags`, `GET /developer/audit/stats`, `GET /developer/monitoring` | GET |
| Monitoring | `getMonitoringData()` | `GET /developer/monitoring` | GET |

### Platform Group
| Page | Frontend Function | Backend Endpoint | Method |
|------|------------------|-----------------|--------|
| Config | `getPlatformConfigs()`, `updatePlatformConfig()`, `createPlatformConfig()` | `GET /developer/config`, `PUT /developer/config/{key}`, `POST /developer/config` | GET/PUT/POST |
| Branding | Same as Config (uses `brand.*` keys) | Same as Config | Same |
| Feature Flags | `getFeatureFlags()`, `createFeatureFlag()`, `updateFeatureFlag()`, `deleteFeatureFlag()`, `toggleFeatureFlag()` | `GET/POST/PUT/DELETE /developer/feature-flags`, `PATCH /developer/feature-flags/{id}/toggle` | Full CRUD |
| Maintenance | Same as Config (uses `system.*` keys) | Same as Config | Same |

### Security Group
| Page | Frontend Function | Backend Endpoint | Method |
|------|------------------|-----------------|--------|
| Auth Policies | Same as Config (uses `auth.*` keys) | Same as Config | Same |
| API Keys | Same as Config (uses `apikey.*` keys) | Same as Config | Same |
| MFA | Same as Config (uses `mfa.*` keys) | Same as Config | Same |

### RBAC Group
| Page | Frontend Function | Backend Endpoint | Method |
|------|------------------|-----------------|--------|
| Roles | `getRoleTemplates()`, `createRoleTemplate()`, `updateRoleTemplate()`, `deleteRoleTemplate()` | `GET/POST/PUT/DELETE /developer/roles` | Full CRUD |
| Permissions | `getPermissions()`, `createPermission()` | `GET/POST /developer/permissions` | GET/POST |
| Admin Overrides | `getRoleTemplates()`, `updateRoleTemplate()` | `GET /developer/roles`, `PUT /developer/roles/{id}/permissions` | GET/PUT |

### Users Group
| Page | Frontend Function | Backend Endpoint | Method |
|------|------------------|-----------------|--------|
| All Users | `getUsers()`, `suspendUser()`, `activateUser()`, `changeUserRole()` | `GET /developer/users`, `POST /developer/users/{id}/suspend`, `POST /developer/users/{id}/activate`, `PUT /developer/users/{id}/role` | GET/POST/PUT |
| Sessions | `getAuditLogs({action:"LOGIN"})` | `GET /developer/audit?action=LOGIN` | GET (filtered audit) |

### CMS Group
| Page | Frontend Function | Backend Endpoint | Method |
|------|------------------|-----------------|--------|
| Pages | `getCmsPages()`, `createCmsPage()`, `updateCmsPage()`, `deleteCmsPage()`, `publishCmsPage()` | `GET/POST/PUT/DELETE /developer/cms/pages`, `POST /developer/cms/pages/{id}/publish` | Full CRUD |
| Navigation | Same as Config (uses `nav.main` key) | Same as Config | Same |
| Themes | Same as Config (uses `theme.*` keys) | Same as Config | Same |
| Notifications | Same as Config (uses `notification.*` keys) | Same as Config | Same |

### Observability Group
| Page | Frontend Function | Backend Endpoint | Method |
|------|------------------|-----------------|--------|
| Audit Logs | `getAuditLogs()`, `getAuditStats()`, `exportAuditLogs()`, `connectAuditStream()` | `GET /developer/audit`, `GET /developer/audit/stats`, `GET /developer/audit/export`, `GET /developer/audit/stream` | GET + SSE |

## Auth Endpoints (Non-Developer)
| Action | Backend Endpoint | Method |
|--------|-----------------|--------|
| Login | `POST /api/login` | POST |
| Register | `POST /api/register` | POST |
| Verify token | `GET /api/auth/verify` | GET |
| Refresh token | `POST /api/auth/refresh` | POST |
| Profile | `GET /api/profile`, `PUT /api/profile` | GET/PUT |
| Search alumni | `GET /api/search` | GET |
| Health check | `GET /api/health` | GET |

## Config Key Prefixes (platform_config table)

| Prefix | Used By | Purpose |
|--------|---------|---------|
| `brand.*` | Branding page | Site name, colors, logo |
| `auth.*` | Auth Policies page | Password rules, session limits |
| `mfa.*` | MFA Settings page | MFA toggles per role |
| `system.*` | Maintenance page | Maintenance mode + message |
| `theme.*` | Themes page | Fonts, colors, shadows |
| `notification.*` | Notifications page | Channel toggles, SMTP config |
| `nav.*` | Navigation page | Menu items JSON |
| `apikey.*` | API Keys page | API key metadata JSON |

## Response Formats

```
List endpoints:
  Backend returns PageResponse (no wrapper):
  { content: [...], totalElements: N, totalPages: N }
  Frontend: result.content, result.totalElements

Detail endpoints (stats, config):
  Backend returns ApiResponse (wrapped):
  { success: true, message: "...", data: { ... } }
  Frontend: result.data

Mutations (create, update, delete):
  Backend returns ApiResponse (wrapped):
  { success: true, message: "Page created", data: { ... } }
  Frontend: result.data

CMS pages list:
  Backend returns ApiResponse (wrapped):
  { success: true, data: [...] }
  Frontend: result.data
```
