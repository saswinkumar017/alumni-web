package com.alumniweb.alumniweb.dto.developer;

import jakarta.validation.constraints.NotNull;

public record DeveloperUserStatusRequest(
    @NotNull com.alumniweb.alumniweb.model.enums.AccountStatus status,
    String reason
) {}
