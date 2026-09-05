/**
 * Networking Feature
 *
 * Enables alumni to discover and connect with fellow alumni within the network.
 * Access: Authenticated
 * Rendering: Hybrid (list → server, detail → async server)
 * Data: Read-only
 *
 * @example
 * ```tsx
 * <NetworkingList />
 * <NetworkingProfile id={id} />
 * ```
 */
export { NetworkingList, NetworkingProfile, NetworkingProfileSkeleton } from "./feature";
export * from "./_services";
