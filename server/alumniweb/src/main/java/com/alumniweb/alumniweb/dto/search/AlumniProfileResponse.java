package com.alumniweb.alumniweb.dto.search;

public record AlumniProfileResponse(
    String id,
    String slug,
    String name,
    String batch,
    String department,
    String bio,
    String avatar,
    String location,
    String jobTitle,
    String company
) {
}