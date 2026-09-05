/**
 * Announcements Feature
 *
 * Enables admins to create and broadcast announcements to the alumni network.
 * Access: Admin
 * Rendering: Server
 * Data: Write-only
 *
 * @example
 * ```tsx
 * <AnnouncementsPanel user={user} />
 * ```
 */

export type { SessionUser } from "@/types";
export { AnnouncementsPanel } from "./feature";
