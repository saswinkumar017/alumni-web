package com.alumniweb.alumniweb.dto.developer;

import jakarta.validation.constraints.NotNull;

public record FeatureFlagToggleRequest(
    @NotNull Boolean enabled
) {}
