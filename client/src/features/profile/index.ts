/**
 * Profile Feature
 *
 * Enables authenticated alumni to view and manage their personal profile information.
 * Access: Authenticated
 * Rendering: Server
 * Data: Read-write
 *
 * @example
 * ```tsx
 * <ProfileManager user={user} />
 * ```
 */

export type { SessionUser } from "@/types";
export { ProfileManager } from "./feature";
