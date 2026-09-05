package com.alumniweb.alumniweb.dto.developer;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record RoleTemplatePermissionRequest(
    @NotNull List<Long> permissionIds,
    boolean granted
) {}
