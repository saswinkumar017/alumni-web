package com.alumniweb.alumniweb.dto.developer;

import java.util.Map;

public record AuditStatsResponse(
    long totalEvents,
    long eventsToday,
    Map<String, Long> eventsByAction,
    Map<String, Long> eventsByEntity,
    long errorCount,
    double avgDurationMs,
    Map<String, Long> eventsByCategory
) {}
