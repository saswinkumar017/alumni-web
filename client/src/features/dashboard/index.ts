/**
 * Dashboard Feature
 *
 * Displays a personalised overview for authenticated users (alumni) and system metrics (admin).
 * Access: Authenticated + Admin
 * Rendering: Server (static welcome content)
 * Data: Read-only (receives user from page)
 *
 * @example
 * ```tsx
 * <AlumniDashboard user={user} />
 * <AdminDashboard user={user} />
 * ```
 */

export type { SessionUser } from "@/types";
export { AdminDashboard, AlumniDashboard } from "./feature";
