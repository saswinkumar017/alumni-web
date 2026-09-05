/**
 * Alumni Management Feature
 *
 * Enables admins to view, search, and manage alumni records.
 * Access: Admin
 * Rendering: Server
 * Data: Read-write
 *
 * @example
 * ```tsx
 * <AlumniRecordsList user={user} />
 * <AlumniRecordDetail id={id} user={user} />
 * ```
 */

export type { SessionUser } from "@/types";
export { AlumniRecordDetail, AlumniRecordsList } from "./feature";
