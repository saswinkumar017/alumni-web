package com.alumniweb.alumniweb.dto.developer;

import com.alumniweb.alumniweb.model.enums.TargetAudience;
import java.time.LocalDateTime;

public record FeatureFlagResponse(
    Long id,
    String name,
    String code,
    String description,
    boolean isEnabled,
    int rolloutPercentage,
    TargetAudience targetAudience,
    String configJson,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
