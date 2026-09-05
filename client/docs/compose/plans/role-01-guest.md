# Role 01: Guest (Public) — Implementation Plan

**Status:** Draft  
**Created:** 2026-07-12  
**Scope:** Public-facing functionality for unauthenticated visitors

---

## 1. Role Definition

**Purpose:** The Guest role represents any unauthenticated visitor to the JJCET Alumni Web platform. Guests can browse public content, search the alumni directory, and submit requests to become verified alumni or correct their information.

**Access Level:** Public — no authentication required. All endpoints and pages are accessible without login.

**Authentication:** None. Guests operate entirely in the unauthenticated state.

**Capabilities:**
- View public website pages (home, about, contact, FAQ, directory, events)
- Search and browse the public alumni directory
- Submit an alumni registration request (become a verified alumni)
- Submit an email correction request (existing alumni correcting email)
- Track request status via a tracking code (no login required)

**Non-capabilities:**
- Cannot access alumni dashboard, profile editing, messaging, or networking features
- Cannot submit events, jobs, or announcements
- Cannot view other alumni's private contact information
- Cannot perform admin actions

---

## 2. Backend Changes Needed

> Note: The backend server already exposes `GET /api/search` (public) and `POST /api/request/email-correction` + `POST /api/request/new-alumni` (public). This plan covers the **client-side** integration and any missing client-side infrastructure. Backend gaps are flagged for coordination.

### 2.1 New DTOs Required

| DTO | File Location | Purpose |
|-----|---------------|---------|
| `NewAlumniRequest` | `src/types/api/request.ts` | Registration request payload: name, registerNumber, batch, department, email, phone, currentCompany, designation, message |
| `EmailCorrectionRequest` | `src/types/api/request.ts` | Email correction payload: alumniId or registerNumber, oldEmail, newEmail, reason, supportingDoc? |
| `RequestTrackingResponse` | `src/types/api/request.ts` | Response with trackingCode, status, createdAt, lastUpdated |
| `RequestStatusEnum` | `src/types/api/request.ts` | `"pending" \| "under_review" \| "approved" \| "rejected"` |

### 2.2 API Endpoints (Expected from Server)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/search` | Public | Search alumni directory (already exists) |
| `GET` | `/api/search/:slug` | Public | View alumni profile (already exists) |
| `POST` | `/api/request/new-alumni` | Public | Submit registration request (already exists) |
| `POST` | `/api/request/email-correction` | Public | Submit email correction (already exists) |
| `GET` | `/api/request/track/:trackingCode` | Public | Track request status **(needs server)** |

### 2.3 Validation Rules

- **NewAlumniRequest:** name (required, 2-100 chars), registerNumber (required, format TBD), batch (required, year range 1990-current), department (required, enum), email (required, valid format), phone (optional, 10 digits), currentCompany (optional), designation (optional), message (optional, max 500 chars)
- **EmailCorrectionRequest:** registerNumber or alumniId (required), oldEmail (required, valid format), newEmail (required, valid format, different from old), reason (required, max 300 chars)
- **TrackingCode:** alphanumeric, 8-12 characters

---

## 3. Frontend Changes Needed

### 3.1 New Pages

| Route | File | Description |
|-------|------|-------------|
| `/register-request` | `src/app/(public)/register-request/page.tsx` | Alumni registration request form |
| `/email-correction` | `src/app/(public)/email-correction/page.tsx` | Email correction request form |
| `/track-request` | `src/app/(public)/track-request/page.tsx` | Request status lookup by tracking code |
| `/track-request/[code]` | `src/app/(public)/track-request/[code]/page.tsx` | Request status detail view |

### 3.2 Existing Pages to Update

| Route | File | Changes |
|-------|------|---------|
| `/contact` | `src/app/(public)/contact/page.tsx` | Replace static stub with functional contact form (general inquiries) |
| `/directory` | `src/app/(public)/directory/page.tsx` | Ensure search is wired up (currently passes `profiles={[]}`) |
| `/` | `src/app/(public)/page.tsx` | Add CTA links to register-request and track-request in hero/CTA sections |

### 3.3 New Feature: `src/features/request/`

Following the established feature structure:

```
src/features/request/
├── feature.tsx              # Export barrel
├── index.ts                 # Re-exports
├── _components/
│   ├── request-form.tsx     # Shared form wrapper with react-hook-form
│   ├── tracking-lookup.tsx  # Tracking code input + result display
│   └── tracking-status.tsx  # Status timeline/stepper component
├── _sections/
│   ├── register-request-section.tsx  # Full registration request page section
│   ├── email-correction-section.tsx  # Full email correction page section
│   └── tracking-section.tsx          # Tracking lookup page section
├── _services/
│   ├── request-service.ts         # API calls: submitRegistrationRequest, submitEmailCorrection, trackRequest
│   └── request-service.types.ts   # Service-specific types
├── _hooks/
│   ├── use-request-submit.ts      # Form submission hook with loading/error states
│   └── use-request-tracking.ts    # Polling/fetch hook for tracking status
├── _validation/
│   ├── register-request-schema.ts # Zod schema for registration form
│   └── email-correction-schema.ts # Zod schema for email correction form
├── _types/
│   └── index.ts                   # Feature-level type re-exports
├── _constants/
│   └── index.ts                   # Department enum, batch year range, status labels
└── _utils/
    └── request-utils.ts           # Tracking code formatting, status step mapping
```

### 3.4 New Shared Components

| Component | File | Purpose |
|-----------|------|---------|
| `RequestSuccessMessage` | `src/components/request/request-success-message.tsx` | Success confirmation with tracking code copy |
| `TrackingTimeline` | `src/components/request/tracking-timeline.tsx` | Visual status stepper (pending → review → approved/rejected) |
| `ContactForm` | `src/components/form/contact-form.tsx` | General inquiry form (name, email, subject, message) |

### 3.5 Navigation Updates

Update `src/config/navigation.ts` to add:
- "Register" link in the public nav (or as a CTA button)
- "Track Request" link in the footer or public nav

---

## 4. Security Considerations

### 4.1 Rate Limiting

- **Client-side:** Implement a 30-second cooldown between duplicate request submissions using a ref or state flag
- **Server-side (flag for backend team):** Rate limit `POST /api/request/*` to 5 requests per IP per hour; `GET /api/request/track/*` to 20 per IP per minute
- Display rate-limit feedback to user via toast: "Please wait before submitting again"

### 4.2 Input Validation

- All form inputs validated client-side via Zod schemas before submission
- Server-side validation is the source of truth — client validation is UX only
- Sanitize all text inputs (trim, strip HTML) before rendering in status pages
- Use `dangerouslySetInnerHTML` never; all user content rendered as text nodes

### 4.3 CSRF Protection

- The existing API client (`src/lib/data/instance.ts`) already handles CSRF tokens via cookies
- New request endpoints must include the CSRF token header (`X-CSRF-Token`) — already handled by the interceptor
- Ensure the CSRF token is refreshed on the root layout (already done via `cookies()` in `src/app/layout.tsx`)

### 4.4 Data Exposure

- Public directory profiles show only: name, batch, department, jobTitle, company, avatar, location — no email, phone, or internal IDs
- Tracking responses must NOT expose other users' data — tracking code must be validated server-side
- Request submission responses return only the tracking code, not the full request payload

### 4.5 Spam Prevention

- Honeypot field (hidden input that bots fill) on all request forms
- CAPTCHA integration flagged as a future enhancement (not blocking MVP)
- Duplicate detection: server should reject if same registerNumber + email already has a pending request

---

## 5. Implementation Tasks

### Phase 1: Type Definitions & Service Layer

**T1.1** Create `src/types/api/request.ts`  
Define `NewAlumniRequest`, `EmailCorrectionRequest`, `RequestTrackingResponse`, `RequestStatusEnum` with Zod schemas. Follow the pattern in `src/types/api/auth.ts`.

**T1.2** Create `src/features/request/_types/index.ts`  
Re-export feature-level types from the api types.

**T1.3** Create `src/features/request/_constants/index.ts`  
Define `DEPARTMENTS` enum, `BATCH_YEAR_RANGE` (1990–currentYear), `REQUEST_STATUS_LABELS` map, `TRACKING_CODE_REGEX`.

**T1.4** Create `src/features/request/_services/request-service.ts`  
Implement three functions using the existing `apiClient` from `src/lib/data/instance.ts`:
- `submitRegistrationRequest(data: NewAlumniRequest)` → `POST /api/request/new-alumni`
- `submitEmailCorrection(data: EmailCorrectionRequest)` → `POST /api/request/email-correction`
- `trackRequest(trackingCode: string)` → `GET /api/request/track/:trackingCode`

Each function returns `Result<T>` using the pattern from `src/lib/services/infra/service-error.ts`.

**T1.5** Create `src/features/request/_services/request-service.types.ts`  
Service-specific response wrapper types.

### Phase 2: Validation Schemas

**T2.1** Create `src/features/request/_validation/register-request-schema.ts`  
Zod schema: name, registerNumber, batch, department, email, phone (optional), currentCompany (optional), designation (optional), message (optional). Follow auth feature pattern from `src/features/auth/_validation/`.

**T2.2** Create `src/features/request/_validation/email-correction-schema.ts`  
Zod schema: registerNumber, oldEmail, newEmail, reason. Include `.refine()` to ensure newEmail !== oldEmail.

### Phase 3: Hooks

**T3.1** Create `src/features/request/_hooks/use-request-submit.ts`  
Custom hook wrapping react-hook-form submission. Returns `{ form, onSubmit, isSubmitting, isSuccess, trackingCode, error }`. Uses `useMutation` pattern or manual state management.

**T3.2** Create `src/features/request/_hooks/use-request-tracking.ts`  
Hook that fetches request status by tracking code. Returns `{ status, request, isLoading, error, refetch }`. Uses `apiClient.get()` directly.

### Phase 4: Components

**T4.1** Create `src/features/request/_components/request-form.tsx`  
Generic form wrapper accepting `schema`, `onSubmit`, `children` (fields), and `submitLabel`. Uses `react-hook-form` + `@hookform/resolvers/zod`. Client component.

**T4.2** Create `src/features/request/_components/tracking-lookup.tsx`  
Input field for tracking code + submit button. On success, renders `TrackingTimeline`.

**T4.3** Create `src/features/request/_components/tracking-status.tsx`  
Visual stepper: Pending → Under Review → Approved/Rejected. Uses existing `Badge` component for status colors.

**T4.4** Create `src/components/request/request-success-message.tsx`  
Success state after form submission. Shows tracking code with copy-to-clipboard (using existing `useClipboard` hook). Links to `/track-request/[code]`.

**T4.5** Create `src/components/request/tracking-timeline.tsx`  
Shared timeline component used by both tracking page and success message.

**T4.6** Create `src/components/form/contact-form.tsx`  
General contact/inquiry form: name, email, subject, message. Uses `FormField`, `TextInput`, `Textarea`, `Button`. Submits to a future `POST /api/contact` endpoint (stub for now).

### Phase 5: Sections (Page Compositions)

**T5.1** Create `src/features/request/_sections/register-request-section.tsx`  
Composes `RequestForm` with registration fields. Includes department dropdown (`FormSelect`), batch year selector, and all text fields.

**T5.2** Create `src/features/request/_sections/email-correction-section.tsx`  
Composes `RequestForm` with email correction fields. Includes register number lookup hint and email fields.

**T5.3** Create `src/features/request/_sections/tracking-section.tsx`  
Composes `TrackingLookup`. If URL has `[code]` param, auto-fetches and shows `TrackingTimeline`.

### Phase 6: Pages

**T6.1** Create `src/app/(public)/register-request/page.tsx`  
Server component rendering `RegisterRequestSection`. Metadata: title "Request Alumni Registration", description.

**T6.2** Create `src/app/(public)/email-correction/page.tsx`  
Server component rendering `EmailCorrectionSection`. Metadata: title "Request Email Correction".

**T6.3** Create `src/app/(public)/track-request/page.tsx`  
Server component rendering `TrackingSection`. Metadata: title "Track Request Status".

**T6.4** Create `src/app/(public)/track-request/[code]/page.tsx`  
Server component with `params.code`. Renders `TrackingSection` with pre-filled code. Dynamic metadata.

### Phase 7: Integration & Polish

**T7.1** Update `src/app/(public)/contact/page.tsx`  
Replace static content with `ContactForm` component. Keep existing page layout/metadata.

**T7.2** Update `src/features/directory/_services/directory-service.ts`  
Wire up `searchAlumni()` to actually call the API (currently the results section receives empty arrays). Ensure guest search works without auth.

**T7.3** Update `src/config/navigation.ts`  
Add "Register" and "Track Request" links to public navigation. Consider placing "Track Request" in the footer nav.

**T7.4** Update `src/app/(public)/page.tsx`  
Add CTA buttons in the hero section and/or the CTA section linking to `/register-request`. Add a "Already registered? Track your request" link.

**T7.5** Create `src/features/request/feature.tsx` and `src/features/request/index.ts`  
Export barrel for the feature. Export all sections, components, and hooks.

---

## 6. Testing Strategy

### 6.1 Unit Tests

| Test File | Coverage |
|-----------|----------|
| `src/features/request/_validation/register-request-schema.test.ts` | All Zod validation rules: required fields, email format, batch range, phone format, message length |
| `src/features/request/_validation/email-correction-schema.test.ts` | Validation rules + `newEmail !== oldEmail` refinement |
| `src/features/request/_utils/request-utils.test.ts` | Tracking code formatting, status step mapping |
| `src/features/request/_services/request-service.test.ts` | Mock `apiClient`, verify correct endpoints called with correct payloads, test error handling |

### 6.2 Component Tests (Vitest + React Testing Library)

| Test File | Coverage |
|-----------|----------|
| `src/features/request/_components/request-form.test.tsx` | Renders fields, shows validation errors, submits with correct data, handles submission errors |
| `src/features/request/_components/tracking-lookup.test.tsx` | Input validation, loading state, error state, success state |
| `src/features/request/_components/tracking-status.test.tsx` | Renders correct step for each status, handles unknown status |
| `src/components/request/request-success-message.test.tsx` | Shows tracking code, copy button works, link to tracking page exists |

### 6.3 Integration Tests

| Test File | Coverage |
|-----------|----------|
| `src/features/request/_hooks/use-request-submit.test.tsx` | Full form submission flow with mocked service |
| `src/features/request/_hooks/use-request-tracking.test.tsx` | Tracking fetch with loading/success/error states |

### 6.4 E2E Tests (Playwright)

| Test File | Coverage |
|-----------|----------|
| `e2e/guest/register-request.spec.ts` | Complete registration request flow: fill form → submit → see success with tracking code |
| `e2e/guest/email-correction.spec.ts` | Complete email correction flow |
| `e2e/guest/track-request.spec.ts` | Enter tracking code → see status; invalid code → error message |
| `e2e/guest/directory-search.spec.ts` | Search alumni by name → see results → click profile |
| `e2e/guest/public-pages.spec.ts` | Navigate all public pages, verify content loads |

### 6.5 Test Fixtures

- Create `tests/fixtures/requests.ts` with mock `NewAlumniRequest`, `EmailCorrectionRequest`, and `RequestTrackingResponse` data
- Create `tests/fixtures/alumni.ts` with mock directory search results

---

## Appendix: File Dependency Graph

```
types/api/request.ts
  └─→ features/request/_validation/*_schema.ts
       └─→ features/request/_hooks/use-request-submit.ts
            └─→ features/request/_components/request-form.tsx
                 └─→ features/request/_sections/*-section.tsx
                      └─→ app/(public)/*/page.tsx

features/request/_services/request-service.ts
  └─→ features/request/_hooks/use-request-submit.ts
  └─→ features/request/_hooks/use-request-tracking.ts
       └─→ features/request/_components/tracking-lookup.tsx
            └─→ features/request/_sections/tracking-section.tsx
                 └─→ app/(public)/track-request/page.tsx
```

Implementation order follows phases: types → validation → hooks → components → sections → pages → integration.
