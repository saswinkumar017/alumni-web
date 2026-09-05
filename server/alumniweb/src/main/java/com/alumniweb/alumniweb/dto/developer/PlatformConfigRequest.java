package com.alumniweb.alumniweb.dto.developer;

import com.alumniweb.alumniweb.model.enums.ConfigCategory;
import com.alumniweb.alumniweb.model.enums.ValueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PlatformConfigRequest(
    @NotBlank String key,
    String value,
    @NotNull ValueType valueType,
    @NotNull ConfigCategory category,
    String description,
    boolean isSensitive,
    boolean isReadonly
) {}
