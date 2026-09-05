package com.alumniweb.alumniweb.dto.admin;

import java.util.List;

public record AdminDashboardResponse(
    long totalRequests,
    Integer requestsTrend,
    long pending,
    Integer pendingTrend,
    long approvedToday,
    Integer approvedTrend,
    long totalAlumni,
    Integer alumniTrend,
    List<PendingRequestResponse> requests
) {
}
