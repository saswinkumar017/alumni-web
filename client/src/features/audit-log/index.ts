/**
 * Audit Log Feature
 *
 * Provides a chronological trail of administrative actions for compliance and security review.
 * Access: Admin
 * Rendering: Server
 * Data: Read-only
 *
 * @example
 * ```tsx
 * <AuditLogViewer user={user} />
 * ```
 */

export type { SessionUser } from "@/types";
export { AuditLogViewer } from "./feature";
