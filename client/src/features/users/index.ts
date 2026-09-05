/**
 * Users Feature
 *
 * Enables admins to manage system users, roles, and permissions.
 * Access: Admin
 * Rendering: Server
 * Data: Read-write
 *
 * @example
 * ```tsx
 * <UserList user={user} />
 * <UserDetail id={id} user={user} />
 * ```
 */

export type { SessionUser } from "@/types";
export { UserDetail, UserList } from "./feature";
