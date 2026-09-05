/**
 * Settings Feature
 *
 * Enables users and admins to configure their preferences and application settings.
 * Access: Authenticated + Admin
 * Rendering: Server
 * Data: Read-write
 *
 * @example
 * ```tsx
 * <AlumniSettings user={user} />
 * <AdminSettings user={user} />
 * ```
 */

export type { SessionUser } from "@/types";
export { AdminSettings, AlumniSettings } from "./feature";
