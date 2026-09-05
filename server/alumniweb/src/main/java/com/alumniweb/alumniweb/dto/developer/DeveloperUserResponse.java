package com.alumniweb.alumniweb.dto.developer;

import com.alumniweb.alumniweb.model.enums.AccountStatus;
import com.alumniweb.alumniweb.model.enums.UserRole;
import java.time.LocalDateTime;

public record DeveloperUserResponse(
    Long id,
    String username,
    String email,
    String alumniName,
    UserRole role,
    AccountStatus accountStatus,
    boolean emailVerified,
    LocalDateTime lastLogin,
    LocalDateTime createdAt
) {}
