/**
 * Events Feature
 *
 * Enables browsing, creating, and managing alumni events — public listing, authenticated details,
 * and admin CRUD.
 * Access: Public + Authenticated + Admin
 * Rendering: Hybrid (list → server, detail → async server)
 * Data: Read-write
 *
 * @example
 * ```tsx
 * <EventsList />
 * <EventDetail slug={slug} />
 * <AlumniEventsList />
 * <AlumniEventDetail id={id} />
 * <AdminEventsList />
 * <AdminEventDetail id={id} />
 * <AdminEventEditor />
 * ```
 */
export {
  AdminEventDetail,
  AdminEventEditor,
  AdminEventsList,
  AlumniEventDetail,
  AlumniEventDetailSkeleton,
  AlumniEventsList,
  EventDetail,
  EventDetailSkeleton,
  EventsList,
} from "./feature";
