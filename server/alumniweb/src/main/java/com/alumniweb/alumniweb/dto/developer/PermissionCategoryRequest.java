package com.alumniweb.alumniweb.dto.developer;

import jakarta.validation.constraints.NotBlank;

public record PermissionCategoryRequest(
    @NotBlank String name,
    @NotBlank String code,
    String description,
    int displayOrder
) {}
