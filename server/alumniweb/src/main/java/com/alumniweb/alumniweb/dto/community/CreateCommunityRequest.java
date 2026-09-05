package com.alumniweb.alumniweb.dto.community;

public record CreateCommunityRequest(
    String name,
    String description,
    String batch,
    String department,
    Boolean isPublic
) {
}
