"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getDashboard } from "../_services/dashboard-api";
import type { SessionUser } from "@/types";
import { QuickActionsSection } from "../_sections/quick-actions-section";
import { QuickStatsSection } from "../_sections/quick-stats-section";
import { RecentActivitySection } from "../_sections/recent-activity-section";
import { WelcomeSection } from "../_sections/welcome-section";

export function AlumniDashboardClient({ user }: { user: SessionUser }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getDashboard>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-zinc-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-zinc-100" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data
    ? [
        { label: "Total Alumni", value: data.totalAlumni },
        { label: "Upcoming Events", value: data.upcomingEvents },
        { label: "Connections", value: data.activeConnections },
        { label: "Unread Messages", value: data.unreadMessages },
      ]
    : [];

  const activities = data?.recentActivities ?? [];
  const quickActions = [
    { label: "View Profile", href: "/alumni/profile" },
    { label: "Browse Events", href: "/alumni/events" },
    { label: "Messages", href: "/alumni/messages" },
    { label: "Community", href: "/alumni/community" },
  ];

  return (
    <div>
      <WelcomeSection user={user} heading="Dashboard" />
      <QuickStatsSection stats={stats} />
      <RecentActivitySection activities={activities} />
      <QuickActionsSection actions={quickActions} />
    </div>
  );
}
