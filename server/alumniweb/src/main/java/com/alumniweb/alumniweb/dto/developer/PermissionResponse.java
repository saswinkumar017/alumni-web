package com.alumniweb.alumniweb.dto.developer;

import com.alumniweb.alumniweb.model.enums.RiskLevel;
import java.time.LocalDateTime;

public record PermissionResponse(
    Long id,
    Long groupId,
    String groupName,
    String name,
    String code,
    String description,
    String action,
    String resource,
    RiskLevel riskLevel,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
