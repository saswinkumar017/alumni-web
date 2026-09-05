package com.alumniweb.alumniweb.dto.developer;

import com.alumniweb.alumniweb.model.enums.TargetAudience;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

public record FeatureFlagRequest(
    @NotBlank String name,
    @NotBlank String code,
    String description,
    boolean isEnabled,
    @Min(0) @Max(100) int rolloutPercentage,
    @NotNull TargetAudience targetAudience,
    String configJson
) {}
