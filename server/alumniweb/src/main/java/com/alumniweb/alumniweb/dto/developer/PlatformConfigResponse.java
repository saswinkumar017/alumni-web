package com.alumniweb.alumniweb.dto.developer;

import com.alumniweb.alumniweb.model.enums.ConfigCategory;
import com.alumniweb.alumniweb.model.enums.ValueType;
import java.time.LocalDateTime;

public record PlatformConfigResponse(
    Long id,
    String key,
    String value,
    ValueType valueType,
    ConfigCategory category,
    String description,
    boolean isSensitive,
    boolean isReadonly,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
