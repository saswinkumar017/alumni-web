package com.alumniweb.alumniweb.dto.admin;

public record ReportSummaryResponse(
        long totalAlumni,
        long totalRequests,
        long pendingRequests,
        long upcomingEvents,
        long activeAnnouncements
) {
}
