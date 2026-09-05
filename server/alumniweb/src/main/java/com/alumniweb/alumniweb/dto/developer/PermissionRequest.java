package com.alumniweb.alumniweb.dto.developer;

import com.alumniweb.alumniweb.model.enums.RiskLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PermissionRequest(
    @NotBlank String name,
    @NotBlank String code,
    String description,
    @NotNull Long groupId,
    @NotBlank String action,
    @NotBlank String resource,
    @NotNull RiskLevel riskLevel
) {}
