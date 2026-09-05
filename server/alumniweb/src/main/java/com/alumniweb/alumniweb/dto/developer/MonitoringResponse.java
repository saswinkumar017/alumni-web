package com.alumniweb.alumniweb.dto.developer;

import java.time.LocalDateTime;
import java.util.Map;

public record MonitoringResponse(
    OnlineUsersInfo onlineUsers,
    SessionsInfo sessions,
    InfrastructureHealthInfo infrastructureHealth
) {
    public record OnlineUsersInfo(long count, long last24h) {}
    public record SessionsInfo(long activeSessions, long totalSessions) {}
    public record InfrastructureHealthInfo(
        String status,
        String databaseStatus,
        LocalDateTime uptime,
        Map<String, String> services
    ) {}
}
