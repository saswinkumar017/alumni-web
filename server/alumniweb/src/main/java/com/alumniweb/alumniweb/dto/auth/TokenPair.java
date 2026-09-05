package com.alumniweb.alumniweb.dto.auth;

import java.time.Instant;

public record TokenPair(
    String accessToken,
    String refreshToken,
    String tokenType,
    Instant expiresAt
) {
}
