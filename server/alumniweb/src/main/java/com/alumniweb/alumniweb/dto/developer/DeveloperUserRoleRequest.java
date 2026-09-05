package com.alumniweb.alumniweb.dto.developer;

import com.alumniweb.alumniweb.model.enums.UserRole;
import jakarta.validation.constraints.NotNull;

public record DeveloperUserRoleRequest(
    @NotNull UserRole role
) {}
