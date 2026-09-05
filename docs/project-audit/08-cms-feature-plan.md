# CMS Feature — End-to-End Implementation Plan

**Purpose:** Give the Developer role full control over content across three user-facing portals: Public/Guest, Alumni, and Admin. The Developer portal itself is managed directly in code (not through CMS) since it's a single-user tool. One CMS, three portals, zero third-party products.

---

## 1. Problem Statement

Currently, all page content is **hardcoded in React components**. To change the homepage hero text, an About page paragraph, or the alumni events display, a developer must edit source code and redeploy. The CMS replaces this with a **database-driven content system** where the Developer portal becomes the single control plane for every user-facing page in the application.

**What's NOT in scope:** The Developer portal (19 pages) is modified directly in code — it's a single-user admin tool, not a content-driven page. No CMS blocks, no draft/publish workflow needed for it.

---

## 2. Scope — What the CMS Controls

### 2.1 Three Portals, One CMS

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPER CMS CONTROL PANEL                   │
│                 (Code-managed, not CMS-driven)                   │
├────────────────┬────────────────┬────────────────────────────────┤
│   PUBLIC       │    ALUMNI      │    ADMIN                       │
│   (Guest)      │                │                                │
├────────────────┼────────────────┼────────────────────────────────┤
│ Home           │ Dashboard      │ Dashboard                      │
│ About          │ Profile        │ Alumni Management              │
│ Directory      │ Networking     │ Events Management              │
│ Events         │ Events         │ User Management                │
│ FAQ            │ Messages       │ Content Management             │
│ Contact        │ Settings       │ Announcements                  │
│                │                │ Reports                        │
│                │                │ Audit Log                      │
│                │                │ Settings                       │
└────────────────┴────────────────┴────────────────────────────────┘
```

### 2.2 Pages Per Portal

| Portal | Pages | Count | CMS-Managed? |
|--------|-------|-------|-------------|
| **Public/Guest** | Home, About, Directory, Events, FAQ, Contact | 6 | Yes |
| **Alumni** | Dashboard, Profile, Networking, Events, Messages, Settings | 6 | Yes |
| **Admin** | Dashboard, Alumni, Events, Users, Content, Announcements, Reports, Audit Log, Settings | 9 | Yes |
| **Developer** | 19 pages (Config, RBAC, CMS, Audit, etc.) | 19 | **No — code-managed** |
| **TOTAL CMS pages** | | **21 pages** | |

### 2.3 Temp/Role-Based Portals

The CMS supports **role-based content visibility**. Pages can show different content blocks based on the viewer's role:

```
Public page "Home" might have:
├── Hero Block     → visible to ALL (null role_access)
├── Alumni CTA     → visible to guests only (role_access: "public")
├── Admin Banner   → visible to admins only (role_access: "admin")
└── Welcome Msg    → visible to logged-in alumni (role_access: "alumni,alumni_lead")
```

This covers temporary role scenarios without creating separate portals.

---

## 3. Architecture

### 3.1 Core Concept — Content as Data

Every page is composed of **Content Blocks** stored in the database. The Developer CMS controls which blocks appear on which page, in what order, with what content.

```
Page (slug: "home", portal: "public")
 ├── Block 1: HeroBlock        (type: hero, order: 0)
 │    ├── title: "Welcome to JJCET Alumni"
 │    ├── subtitle: "Connecting generations..."
 │    ├── backgroundImage: "/uploads/hero-bg.jpg"
 │    └── ctaText: "Join Now"
 ├── Block 2: StatsBlock       (type: stats, order: 1)
 │    └── items: [{label: "Alumni", value: "5000+"}, ...]
 ├── Block 3: EventsBlock      (type: events, order: 2)
 │    └── config: {maxEvents: 3, showPast: false}
 ├── Block 4: Testimonials     (type: testimonials, order: 3)
 └── Block 5: CTABlock         (type: cta, order: 4)
```

### 3.2 Database Schema (New Tables)

```sql
-- EXTEND existing table
page_layout
  ADD portal ENUM('public', 'alumni', 'admin') NOT NULL DEFAULT 'public';
  ADD is_system BOOLEAN NOT NULL DEFAULT false;

-- NEW: Content blocks per page
cms_block
  id              BIGINT AUTO_INCREMENT PK
  page_id         BIGINT NOT NULL FK → page_layout(id)
  block_type      VARCHAR(50) NOT NULL
  config          JSON
  sort_order      INT NOT NULL DEFAULT 0
  is_visible      BOOLEAN NOT NULL DEFAULT true
  role_access     VARCHAR(200) NULL  -- comma-separated roles, NULL=all
  created_at      DATETIME NOT NULL
  updated_at      DATETIME NOT NULL

-- NEW: Translatable content per block
cms_content
  id              BIGINT AUTO_INCREMENT PK
  block_id        BIGINT NOT NULL FK → cms_block(id)
  locale          VARCHAR(10) NOT NULL DEFAULT 'en'
  content         JSON NOT NULL
  version         INT NOT NULL DEFAULT 1
  status          ENUM('draft','published','archived') NOT NULL DEFAULT 'draft'
  published_at    DATETIME NULL
  published_by    BIGINT NULL FK → user_account(id)
  created_at      DATETIME NOT NULL
  updated_at      DATETIME NOT NULL

-- NEW: Media library
cms_media
  id              BIGINT AUTO_INCREMENT PK
  filename        VARCHAR(255) NOT NULL
  original_name   VARCHAR(255) NOT NULL
  mime_type       VARCHAR(100) NOT NULL
  size_bytes      BIGINT NOT NULL
  path            VARCHAR(500) NOT NULL
  alt_text        VARCHAR(200) NULL
  folder          VARCHAR(100) DEFAULT 'general'
  uploaded_by     BIGINT NULL FK → user_account(id)
  created_at      DATETIME NOT NULL
  deleted_at      DATETIME NULL  -- soft delete

-- NEW: Navigation menus per portal
cms_navigation
  id              BIGINT AUTO_INCREMENT PK
  portal          ENUM('public', 'alumni', 'admin') NOT NULL
  menu_key        VARCHAR(50) NOT NULL  -- main, footer, sidebar, mobile
  items           JSON NOT NULL
  version         INT NOT NULL DEFAULT 1
  created_at      DATETIME NOT NULL
  updated_at      DATETIME NOT NULL

-- NEW: SEO metadata per page
cms_page_seo
  id              BIGINT AUTO_INCREMENT PK
  page_id         BIGINT NOT NULL FK → page_layout(id)
  meta_title      VARCHAR(200) NULL
  meta_description VARCHAR(500) NULL
  og_image        VARCHAR(500) NULL
  canonical_url   VARCHAR(500) NULL
  no_index        BOOLEAN DEFAULT false
  structured_data JSON NULL
  created_at      DATETIME NOT NULL
  updated_at      DATETIME NOT NULL

-- NEW: Version history
cms_revision
  id              BIGINT AUTO_INCREMENT PK
  content_id      BIGINT NOT NULL FK → cms_content(id)
  version         INT NOT NULL
  snapshot        JSON NOT NULL
  changed_by      BIGINT NULL FK → user_account(id)
  changed_at      DATETIME NOT NULL
  change_summary  VARCHAR(200) NULL

-- NEW: Scheduled publish queue
cms_scheduled_publish
  id              BIGINT AUTO_INCREMENT PK
  content_id      BIGINT NOT NULL FK → cms_content(id)
  publish_at      DATETIME NOT NULL
  revert_at       DATETIME NULL
  status          ENUM('pending','executed','cancelled') NOT NULL DEFAULT 'pending'
  created_by      BIGINT NULL FK → user_account(id)
  created_at      DATETIME NOT NULL

-- NEW: Page view analytics
cms_page_view
  id              BIGINT AUTO_INCREMENT PK
  page_id         BIGINT NOT NULL
  visitor_id      VARCHAR(100) NULL
  user_id         BIGINT NULL
  path            VARCHAR(500) NOT NULL
  referrer        VARCHAR(500) NULL
  user_agent      VARCHAR(500) NULL
  ip_address      VARCHAR(45) NULL
  duration_ms     BIGINT NULL
  created_at      DATETIME NOT NULL
```

### 3.3 Block Types

| Block Type | Purpose | Config Fields |
|-----------|---------|---------------|
| `hero` | Banner with title, subtitle, image, CTA | layout, height, overlay, overlayOpacity |
| `stats` | Number counters | animate, columns |
| `events` | Event listing | dataSource, maxItems, showPast, layout, filters |
| `testimonials` | User quotes | maxItems, showAvatar |
| `cta` | Call to action | title, description, buttonText, buttonLink, bgColor |
| `html` | Rich text content | maxWidth |
| `image` | Single image | (src, alt, caption from content) |
| `gallery` | Image grid | columns |
| `faq` | Accordion FAQ | allowSearch, groupByCategory |
| `contact-form` | Contact form | (fields from content) |
| `directory` | Alumni directory | filters, pageSize, showAvatar, layout |
| `announcement` | Banner alert | (priority, expiresAt from content) |
| `table` | Data table | (columns, dataSource from content) |
| `list` | Simple list | (items from content) |
| `divider` | Visual separator | style |
| `spacer` | Empty space | height |

---

## 4. Backend Implementation

### 4.1 New Entities (7 files)

```
server/.../model/
├── CmsBlock.java
├── CmsContent.java
├── CmsMedia.java
├── CmsNavigation.java
├── CmsPageSeo.java
├── CmsRevision.java
└── CmsScheduledPublish.java
```

### 4.2 New Repositories (7 files)

```
server/.../repository/
├── CmsBlockRepository.java
├── CmsContentRepository.java
├── CmsMediaRepository.java
├── CmsNavigationRepository.java
├── CmsPageSeoRepository.java
├── CmsRevisionRepository.java
└── CmsScheduledPublishRepository.java
```

### 4.3 New Services (10 files)

```
server/.../service/
├── CmsPageService.java              → CRUD pages, set portal
├── CmsBlockService.java             → CRUD blocks, reorder
├── CmsContentService.java           → CRUD content, draft/publish
├── CmsMediaService.java             → Upload, serve, delete
├── CmsNavigationService.java        → CRUD navigation per portal
├── CmsSeoService.java               → SEO per page
├── CmsRevisionService.java          → Version history
├── CmsScheduledPublishService.java  → @Scheduled publish/revert
├── CmsRenderingService.java         → Assemble page for rendering
└── CmsAnalyticsService.java         → Page view tracking
```

### 4.4 New Controllers (8 files)

```
server/.../controller/
├── DeveloperCmsPageController.java    → /api/developer/cms/pages (expand)
├── DeveloperCmsBlockController.java   → /api/developer/cms/pages/{id}/blocks
├── DeveloperCmsContentController.java → /api/developer/cms/blocks/{id}/content
├── DeveloperCmsMediaController.java   → /api/developer/cms/media
├── DeveloperCmsNavController.java     → /api/developer/cms/navigation
├── DeveloperCmsSeoController.java     → /api/developer/cms/pages/{id}/seo
├── CmsRenderController.java           → /api/cms/render/{portal}/{slug} (public)
└── CmsAnalyticsController.java        → /api/cms/analytics/{pageId}
```

### 4.5 Flyway Migration

```sql
-- V4__cms_enhancement.sql
ALTER TABLE page_layout ADD COLUMN portal ENUM('public','alumni','admin') NOT NULL DEFAULT 'public';
ALTER TABLE page_layout ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT false;

-- CREATE all new tables (cms_block, cms_content, cms_media, etc.)
-- CREATE indexes
-- SEED: system pages matching existing hardcoded routes
-- SEED: default navigation menus
-- SEED: default block configs for existing pages
```

### 4.6 Rendering Pipeline

```
GET /api/cms/render/public/home
  │
  ├── 1. Load page by slug + portal from page_layout
  ├── 2. Load blocks (sorted by sort_order, is_visible=true)
  ├── 3. For each block:
  │     ├── Load published content (matching locale)
  │     ├── Check role_access (skip if viewer's role not allowed)
  │     └── Resolve dynamic data (events from events table, etc.)
  ├── 4. Load SEO metadata from cms_page_seo
  └── 5. Return JSON:
       {
         page: { name, slug, template },
         blocks: [{ type, config, content }],
         seo: { metaTitle, ogImage, ... },
         navigation: [{ label, href, ... }]
       }
```

### 4.7 Public API (No Auth Required)

```
GET /api/cms/render/{portal}/{slug}  → Full rendered page
GET /api/cms/navigation/{portal}     → Navigation menu
GET /api/cms/media/{id}              → Serve media file
POST /api/cms/analytics/view         → Record page view (optional auth)
```

---

## 5. Frontend Implementation

### 5.1 Developer CMS Pages (Expand Existing)

```
developer/cms/
├── pages/page.tsx                  → Expand with portal filter, block count
├── pages/[id]/blocks/page.tsx      → NEW: Block list, drag-reorder
├── blocks/[id]/content/page.tsx    → NEW: Content editor per block
├── media/page.tsx                  → NEW: Media library
├── navigation/page.tsx             → Expand with portal selector
├── themes/page.tsx                 → Expand with per-portal themes
├── seo/page.tsx                    → NEW: SEO manager
├── revisions/page.tsx              → NEW: Version history
├── schedule/page.tsx               → NEW: Scheduled publish queue
└── analytics/page.tsx              → NEW: Page view analytics
```

### 5.2 Block Editor Components

```
components/cms/
├── BlockEditor.tsx                  → Drag-and-drop block arrangement
├── BlockRenderer.tsx                → Renders block based on type
├── blocks/
│   ├── HeroBlockEditor.tsx
│   ├── StatsBlockEditor.tsx
│   ├── EventsBlockEditor.tsx
│   ├── FaqBlockEditor.tsx
│   ├── HtmlBlockEditor.tsx         → Tiptap rich text
│   ├── ImageBlockEditor.tsx
│   ├── GalleryBlockEditor.tsx
│   ├── CtaBlockEditor.tsx
│   ├── ContactBlockEditor.tsx
│   ├── DirectoryBlockEditor.tsx
│   └── AnnouncementBlockEditor.tsx
├── ContentEditor.tsx                → Locale tabs
├── MediaUploader.tsx                → Drag-and-drop upload
├── MediaBrowser.tsx                 → Browse/search media
├── SeoEditor.tsx                    → Meta tags + Google preview
├── VersionDiff.tsx                  → Side-by-side comparison
├── PublishWorkflow.tsx              → Draft → Publish → Archive
└── PortalSelector.tsx              → Switch public/alumni/admin
```

### 5.3 Public-Facing Renderers

```
components/renderers/
├── PageRenderer.tsx                 → Takes API response, renders blocks
├── HeroRenderer.tsx
├── StatsRenderer.tsx
├── EventsRenderer.tsx
├── TestimonialsRenderer.tsx
├── FaqRenderer.tsx
├── DirectoryRenderer.tsx
├── ContactRenderer.tsx
├── HtmlRenderer.tsx
├── GalleryRenderer.tsx
└── AnnouncementRenderer.tsx
```

### 5.4 Route Integration

```
app/
├── (public)/
│   ├── [slug]/page.tsx             → CMS-driven public pages (catch-all)
│   ├── page.tsx                    → Home (CMS or hardcoded fallback)
│   └── ...
├── (alumni)/alumni/
│   ├── [slug]/page.tsx             → CMS-driven alumni pages
│   └── ...
├── (admin)/admin/
│   ├── [slug]/page.tsx             → CMS-driven admin pages
│   └── ...
│
│   (developer/ is NOT CMS-driven — managed in code)
```

---

## 6. Block Type Details

### 6.1 Hero Block
```json
{
  "block_type": "hero",
  "config": { "layout": "centered", "height": "full", "overlay": true, "overlayOpacity": 0.5 },
  "content": {
    "en": {
      "title": "Welcome to JJCET Alumni",
      "subtitle": "Connecting generations of excellence",
      "backgroundImage": "/uploads/media/hero-bg.jpg",
      "ctaText": "Join Now", "ctaLink": "/register"
    }
  }
}
```

### 6.2 Stats Block
```json
{
  "block_type": "stats",
  "config": { "animate": true, "columns": 4 },
  "content": {
    "en": {
      "items": [
        {"label": "Alumni", "value": "5000+", "icon": "users"},
        {"label": "Events", "value": "200+", "icon": "calendar"}
      ]
    }
  }
}
```

### 6.3 HTML Block (Rich Text — Tiptap)
```json
{
  "block_type": "html",
  "config": { "maxWidth": "prose" },
  "content": {
    "en": { "body": "<h2>About Our College</h2><p>JJCET has been...</p>" }
  }
}
```

### 6.4 Events Block (Dynamic — pulls from events table)
```json
{
  "block_type": "events",
  "config": { "dataSource": "events", "maxItems": 3, "showPast": false, "layout": "grid" }
}
```

### 6.5 FAQ Block
```json
{
  "block_type": "faq",
  "config": { "allowSearch": true, "groupByCategory": true },
  "content": {
    "en": {
      "items": [
        {"question": "How do I register?", "answer": "...", "category": "Getting Started"}
      ]
    }
  }
}
```

### 6.6 Directory Block (Alumni Search)
```json
{
  "block_type": "directory",
  "config": { "filters": ["department", "batch", "role"], "pageSize": 20, "layout": "grid" }
}
```

---

## 7. Media Manager

### 7.1 Storage
```
/public/uploads/media/{year}/{month}/{uuid}_{original_name}
```
Local filesystem — free, simple, fine for <10GB. No cloud dependencies.

### 7.2 Upload Flow
```
1. Frontend: drag-drop file → FormData → POST /api/developer/cms/media
2. Backend: validate type → generate UUID filename → save to disk → create DB record
3. Return: { id, path, filename, mimeType }
4. Frontend: store media ID in block content JSON
```

### 7.3 Supported Types
| Type | Extensions | Max |
|------|-----------|-----|
| Images | jpg, png, gif, webp, svg | 5MB |
| Documents | pdf, doc, docx | 10MB |
| Videos | mp4, webm | 50MB |

---

## 8. Rich Text Editor — Tiptap

### Why Tiptap (Free, MIT)?
- Self-hosted, no cloud dependency
- JSON output (fits our block content model)
- React support via @tiptap/react
- 10+ free extensions (tables, images, links, code blocks)
- Active maintenance, large community

### Extensions Used
```
@tiptap/starter-kit           → bold, italic, headings, lists, code
@tiptap/extension-image       → image embed
@tiptap/extension-link        → hyperlinks
@tiptap/extension-table       → tables
@tiptap/extension-placeholder → placeholder text
@tiptap/extension-text-align  → alignment
@tiptap/extension-color       → text color
@tiptap/extension-highlight   → highlight text
@tiptap/extension-underline   → underline
@tiptap/extension-code-block-lowlight → syntax highlighting
```

---

## 9. Version Control & Publish Workflow

### 9.1 States
```
Draft → Published → Archived
  ↑       ↓
  └───────┘ (revert to draft)
```

### 9.2 Flow
```
1. Editor saves changes → content stored as "draft" (invisible to users)
2. Editor clicks "Publish" → draft becomes published, revision created
3. Published version is visible to users
4. Editor clicks "Revert" → new draft from published snapshot
5. "Archive" → content hidden from all views
```

### 9.3 Revision History
```
Each publish creates a cms_revision record with full JSON snapshot.
Can view, compare (diff), and revert to any previous version.
```

---

## 10. Scheduled Publishing

```
1. Editor sets "Publish at: 2026-08-01 09:00"
2. Record created in cms_scheduled_publish
3. @Scheduled(fixedRate = 60000) checks every minute
4. When publish_at <= now → set content.status = 'published'
5. Optional: revert_at → auto-archive after event ends
```

---

## 11. Role-Based Content Visibility

Each block has `role_access` field:
```json
"role_access": null              // visible to everyone
"role_access": "admin,alumni"    // visible to admin and alumni only
"role_access": "public"          // visible to guests only
```

### Use Cases
- Alumni welcome banner only on alumni dashboard
- Admin maintenance notice visible only to admins
- Guest-only marketing CTA hidden from logged-in users

---

## 12. Navigation Management

Per-portal navigation stored in `cms_navigation`:
```json
{
  "portal": "public",
  "menu_key": "main",
  "items": [
    {"label": "Home", "href": "/", "order": 0, "isVisible": true},
    {"label": "About", "href": "/about", "order": 1, "isVisible": true},
    {"label": "Events", "href": "/events", "order": 2, "isVisible": true}
  ]
}
```

Menu keys: `main`, `footer`, `sidebar`, `mobile`, `breadcrumbs`

---

## 13. SEO Management

Per-page SEO in `cms_page_seo`:
- Meta title, meta description
- OG image (from media library)
- Canonical URL, no-index flag
- Structured data (JSON-LD)
- Google search preview in editor

Auto-generated:
- `sitemap.xml` (all published pages)
- `robots.txt` (configurable per page)

---

## 14. Analytics

### Page View Tracking
```sql
cms_page_view → visitor_id, user_id, path, referrer, duration_ms
```

### Analytics Dashboard
- Total views, unique visitors, avg duration, bounce rate
- Top pages ranked by views
- Views over time chart (last 7/30 days)
- Per-portal breakdown

---

## 15. Implementation Phases

### Phase 1: Database & Core Backend (Week 1)
- [ ] V4 Flyway migration (7 new tables + page_layout alter)
- [ ] 7 new entities + 7 repositories
- [ ] CmsBlockService, CmsContentService (CRUD)
- [ ] DeveloperCmsBlockController, DeveloperCmsContentController
- [ ] Seed system pages (map 21 hardcoded pages)
- [ ] Seed default navigation menus

### Phase 2: Content Editor UI (Week 2)
- [ ] Block editor (add/edit/delete/reorder)
- [ ] 11 block type editors
- [ ] Tiptap integration for HTML blocks
- [ ] Content editor with locale tabs
- [ ] Publish workflow (draft → publish)
- [ ] Portal selector

### Phase 3: Public Rendering (Week 3)
- [ ] CmsRenderController (public API)
- [ ] PageRenderer + 10 block renderers
- [ ] Role-based content filtering
- [ ] Route integration (catch-all [slug])
- [ ] Fallback to hardcoded components

### Phase 4: Media & Navigation (Week 4)
- [ ] CmsMediaService (upload/serve/delete)
- [ ] MediaUploader + MediaBrowser components
- [ ] CmsNavigationService (per-portal menus)
- [ ] Navigation manager UI
- [ ] Dynamic navigation in layouts

### Phase 5: SEO & Revisions (Week 5)
- [ ] CmsPageSeo entity + service + editor
- [ ] CmsRevisionService (version history, diff, revert)
- [ ] CmsScheduledPublishService (@Scheduled job)
- [ ] Scheduled publish UI

### Phase 6: Analytics & Polish (Week 6)
- [ ] CmsAnalyticsService + page view tracking
- [ ] Analytics dashboard in developer portal
- [ ] Sitemap.xml generation
- [ ] Performance optimization (caching)
- [ ] Error handling & edge cases

---

## 16. Free Packages

| Package | Purpose | License |
|---------|---------|---------|
| `@tiptap/react` + extensions | Rich text editor | MIT |
| `@dnd-kit/core` | Drag-and-drop reorder | MIT |
| `next-intl` | i18n (existing) | MIT |
| `zod` | Validation (existing) | MIT |
| `sonner` | Toasts (existing) | MIT |

**Zero paid services. Zero cloud dependencies.**

---

## 17. Backward Compatibility

### Graceful Fallback
If CMS has no data for a page, fall back to hardcoded React components:
```
1. CmsRenderController: page exists + is_active?
2. If NO → frontend renders hardcoded component
3. If YES → load blocks + content → render via PageRenderer
4. During migration: CMS preferred, hardcoded as fallback
```

### Migration Strategy
```
1. V4 migration creates tables + seeds system pages
2. Developer portal shows CMS vs hardcoded status per page
3. One by one: create CMS content → verify → remove hardcoded
4. Both sources work during transition
```

---

## 18. Estimated Effort

| Phase | Duration | Dependencies |
|-------|----------|-------------|
| Phase 1: Database + Backend | 1 week | MySQL, Spring Boot |
| Phase 2: Content Editor UI | 1 week | Phase 1, Tiptap |
| Phase 3: Public Rendering | 1 week | Phase 1 + 2 |
| Phase 4: Media + Navigation | 1 week | Phase 1 |
| Phase 5: SEO + Revisions | 3 days | Phase 1 + 2 |
| Phase 6: Analytics + Polish | 3 days | Phase 3 |
| **Total** | **~5.5 weeks** | |

---

## 19. Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Content storage | JSON in cms_content | Flexible, no schema changes for new block types |
| Block ordering | Integer sort_order | Simple, supports drag-reorder |
| Rich text | Tiptap (MIT) | Free, JSON output, extensible, React support |
| Media storage | Local filesystem | Free, simple, fine for <10GB |
| i18n | locale field on cms_content | One block, multiple language versions |
| Version control | cms_revision with JSON snapshots | Full history, diff, revert |
| Role access | String on block level | Per-block visibility, no extra tables |
| Scheduling | @Scheduled polling table | Simple, no message queue |
| Public API | Separate render controller | Clean separation from admin APIs |
| Fallback | Hardcoded React components | Zero downtime during migration |
| **Developer portal** | **Code-managed (not CMS)** | **Single-user tool, changes require redeploy anyway** |
