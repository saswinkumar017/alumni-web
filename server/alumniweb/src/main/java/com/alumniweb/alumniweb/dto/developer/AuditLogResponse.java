package com.alumniweb.alumniweb.dto.developer;

import com.alumniweb.alumniweb.model.enums.AuditCategory;
import com.alumniweb.alumniweb.model.enums.AuditLogLevel;

import java.time.LocalDateTime;

public record AuditLogResponse(
    Long id,
    Long userId,
    String username,
    String action,
    String entityType,
    Long entityId,
    String oldValues,
    String newValues,
    String ipAddress,
    String userAgent,
    AuditCategory category,
    AuditLogLevel logLevel,
    String method,
    String endpoint,
    Integer statusCode,
    Long durationMs,
    String requestParams,
    String responseSummary,
    LocalDateTime createdAt
) {}
