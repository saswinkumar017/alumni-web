package com.alumniweb.alumniweb.dto.developer;

import com.alumniweb.alumniweb.model.enums.AccountStatus;
import com.alumniweb.alumniweb.model.enums.UserRole;

public record DeveloperUserUpdateRequest(
    UserRole role,
    AccountStatus accountStatus,
    Boolean emailVerified
) {}
