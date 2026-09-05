import type { RouteSegmentLabelResolver } from "@/lib/route-protection";

export interface BreadcrumbSegment {
  label: string;
  href: string;
  isCurrent: boolean;
}

export type SegmentLabelMap = Record<string, string>;

export const publicSegmentLabels: SegmentLabelMap = {
  about: "About",
  contact: "Contact",
  faq: "FAQ",
  directory: "Directory",
  events: "Events",
};

export const alumniSegmentLabels: SegmentLabelMap = {
  dashboard: "Dashboard",
  profile: "Profile",
  networking: "Networking",
  events: "Events",
  jobs: "Jobs",
  gallery: "Gallery",
  messages: "Messages",
  settings: "Settings",
};

export const adminSegmentLabels: SegmentLabelMap = {
  dashboard: "Dashboard",
  alumni: "Alumni",
  events: "Events",
  users: "Users",
  content: "Content",
  announcements: "Announcements",
  reports: "Reports",
  "audit-log": "Audit Log",
  settings: "Settings",
};

export const dynamicSegmentResolvers: Record<string, RouteSegmentLabelResolver> = {
  "[id]": async (id: string) => `Item #${id}`,
  "[slug]": async (slug: string) =>
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
};
