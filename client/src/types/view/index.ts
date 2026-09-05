import type { UserId, EventId } from "@/types/domain";

export interface DashboardSummary {
  readonly totalAlumni: number;
  readonly upcomingEvents: number;
  readonly activeJobs: number;
  readonly unreadMessages: number;
}

export interface ActivityFeedVM {
  readonly id: string;
  readonly type: "event" | "job" | "message" | "profile";
  readonly title: string;
  readonly description: string;
  readonly timestamp: string;
  readonly actorName: string;
  readonly actorAvatar: string | null;
}

export interface UserProfileVM {
  readonly id: UserId;
  readonly displayName: string;
  readonly email: string;
  readonly avatar: string | null;
  readonly batch: string | null;
  readonly department: string | null;
  readonly isOnline: boolean;
  readonly initials: string;
}

export interface EventCardVM {
  readonly id: EventId;
  readonly title: string;
  readonly date: string;
  readonly location: string;
  readonly category: "upcoming" | "past";
  readonly isFull: boolean;
  readonly attendeeCount: number;
}
