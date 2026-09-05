package com.alumniweb.alumniweb.dto.dashboard;

import java.util.List;

public record DashboardResponse(
    int totalAlumni,
    int upcomingEvents,
    int activeConnections,
    int unreadMessages,
    List<RecentEvent> recentEvents,
    List<RecentActivity> recentActivities
) {

    public record RecentEvent(
        String id,
        String title,
        String date,
        String location
    ) {
    }

    public record RecentActivity(
        String id,
        String description,
        String timestamp
    ) {
    }
}