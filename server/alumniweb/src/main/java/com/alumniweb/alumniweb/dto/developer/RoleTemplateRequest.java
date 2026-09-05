package com.alumniweb.alumniweb.dto.developer;

import jakarta.validation.constraints.NotBlank;

public record RoleTemplateRequest(
    @NotBlank String name,
    @NotBlank String code,
    String description,
    boolean isSystem,
    boolean isActive
) {}
