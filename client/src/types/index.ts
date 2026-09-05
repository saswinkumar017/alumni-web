// ============================================================
// @/types/ — Backward-compatible barrel for the Type System Layer
//
// Legacy consumers can continue importing from @/types while
// migrating to specific submodule imports.
//
// New consumers should import from specific submodules:
//   @/types/api      — API DTOs + Zod schemas
//   @/types/domain   — Domain models + branded IDs
//   @/types/auth     — Permission types
//   @/types/errors   — Error types
//   @/types/state    — Async state types
//   @/types/events   — Application event types
//   @/types/view     — Presentation models
//   @/types/utils    — Utility types
//   @/types/shared   — Shared generic types
// ============================================================

// Domain models (direct exports from domain structure)
// Legacy backward-compatible names:
export type { AlumniProfile } from "@/types/domain/profile";
export type { SessionUser, UserRole } from "@/types/domain/session";
export type { Event as AlumniEvent } from "@/types/domain/event";
export type { Job as JobPosting } from "@/types/domain/job";

export type { Event, EventCategory } from "@/types/domain/event";
export type { Job, JobType } from "@/types/domain/job";
export type { Message, Conversation } from "@/types/domain/message";
export type { User } from "@/types/domain/user";
export type { Education, Employment } from "@/types/domain/profile";
export type { UserId, EventId, JobId, MessageId, ConversationId } from "@/types/domain/branded";
export type { Announcement } from "@/types/domain/announcement";
export type { GalleryAlbum } from "@/types/domain/gallery";
export type { Report } from "@/types/domain/report";
export type { UserSettings } from "@/types/domain/settings";
export type { Timestamped, SoftDeletable, Authored } from "@/types/domain/metadata";
export type { Community, CommunityMember, CommunityMessage, CreateCommunityRequest, PostCommunityMessageRequest } from "@/types/domain/community";
export type { Connection, ConnectionRequest } from "@/types/domain/connection";
export type { Donation, DonationStats, CreateDonationRequest } from "@/types/domain/donation";
export type { Notification, UnreadCountResponse } from "@/types/domain/notification";

// Zod schemas (for runtime validation)
export { UserSchema } from "@/types/domain/user";
export { AlumniProfileSchema } from "@/types/domain/profile";
export { EventSchema } from "@/types/domain/event";
export { JobSchema } from "@/types/domain/job";
export { MessageSchema } from "@/types/domain/message";
export { SessionUserSchema } from "@/types/domain/session";

// API types
export type { UserDto, CreateUserRequest, UpdateUserRequest } from "@/types/api/user";
export type { EventDto, CreateEventRequest, UpdateEventRequest } from "@/types/api/event";
export type { JobDto, CreateJobRequest, UpdateJobRequest } from "@/types/api/job";
export type { MessageDto, SendMessageRequest } from "@/types/api/message";
export type { LoginRequest, RegisterRequest, AuthResponse } from "@/types/api/auth";

// Shared types
export type { EntityId, PaginatedResponse, SortDirection, SortConfig, SearchQuery, FilterConfig, FilterOperator, ApiResponse, PaginationParams } from "@/types/shared";
export type { AsyncState, IdleState, LoadingState, SuccessState, ErrorState } from "@/types/state";

// Error types
export type { AppError, ApiError, ValidationError, ValidationErrors } from "@/types/errors";

// Auth types
export type { Permission, PermissionAction, PermissionResource, PermissionScope } from "@/types/auth/permissions";

// Event types
export type { AppEvent } from "@/types/events/index";

// View models
export type { DashboardSummary, ActivityFeedVM, UserProfileVM, EventCardVM } from "@/types/view";
