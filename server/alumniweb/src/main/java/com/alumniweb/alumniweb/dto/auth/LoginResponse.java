package com.alumniweb.alumniweb.dto.auth;

import java.time.Instant;

public record LoginResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    Instant expiresAt,
    String username,
    String role
) {
}
