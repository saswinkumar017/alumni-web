package com.alumniweb.alumniweb.dto.developer;

import java.time.LocalDateTime;
import java.util.List;

public record RoleTemplateResponse(
    Long id,
    String name,
    String code,
    String description,
    boolean isSystem,
    boolean isActive,
    List<Long> permissionIds,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
