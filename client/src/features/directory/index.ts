/**
 * Directory Feature
 *
 * Enables discovery of alumni through a searchable directory and individual profile pages.
 * Access: Public
 * Rendering: Hybrid (list → server, detail → async server)
 * Data: Read-only
 *
 * @example
 * ```tsx
 * <DirectoryList />
 * <DirectoryProfile slug={slug} />
 * ```
 */
export { DirectoryList, DirectoryProfile, DirectoryProfileSkeleton } from "./feature";
