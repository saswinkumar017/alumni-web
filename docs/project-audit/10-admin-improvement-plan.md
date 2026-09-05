# Admin Portal Improvement Plan

**Problem:** Admin portal has 9 pages but 5 are stubs. The audit-log page incorrectly calls developer endpoints. Admin needs its own dedicated backend APIs.

**Fix:** Create admin-specific backend endpoints + build out all 9 admin pages.

## New Backend APIs Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/users` | GET | List all users (paginated) |
| `/api/admin/users/{id}` | GET | User detail |
| `/api/admin/users/{id}/suspend` | POST | Suspend user |
| `/api/admin/users/{id}/activate` | POST | Activate user |
| `/api/admin/audit` | GET | Audit logs (admin view) |
| `/api/admin/audit/stats` | GET | Audit stats |
| `/api/admin/announcements` | GET/POST | List/Create announcements |
| `/api/admin/announcements/{id}` | PUT/DELETE | Update/Delete |
| `/api/admin/reports/overview` | GET | Report data |
| `/api/admin/settings` | GET/PUT | Admin settings |

## Frontend Pages to Build

1. **Dashboard** — Already works (uses `/api/admin/dashboard`)
2. **Alumni** — Already works (uses `/api/admin/alumni`)
3. **Events** — Already works (uses `/api/admin/requests`)
4. **Users** — Build: list users, view detail, suspend/activate
5. **Content** — Build: manage announcements
6. **Announcements** — Build: CRUD announcements
7. **Audit Log** — Fix: use `/api/admin/audit` not `/api/developer/audit`
8. **Reports** — Build: overview stats
9. **Settings** — Build: admin account settings
