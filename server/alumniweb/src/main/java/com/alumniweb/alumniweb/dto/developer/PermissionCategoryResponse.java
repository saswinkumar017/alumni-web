package com.alumniweb.alumniweb.dto.developer;

import java.time.LocalDateTime;

public record PermissionCategoryResponse(
    Long id,
    String name,
    String code,
    String description,
    int displayOrder,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
