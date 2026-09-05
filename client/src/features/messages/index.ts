/**
 * Messages Feature
 *
 * Enables private messaging and conversations between alumni.
 * Access: Authenticated
 * Rendering: Client (real-time chat)
 * Data: Read-write
 *
 * @example
 * ```tsx
 * <MessagesInbox user={user} />
 * ```
 */

export type { SessionUser } from "@/types";
export { MessagesInbox } from "./feature";
export * from "./_services";
