package com.alumniweb.alumniweb.dto.auth;

public record RegisterResponse(
    Long userId,
    String username,
    String message
) {
}
