package com.alumniweb.alumniweb.dto.search;

public record AlumniSearchResponse(
    Long id,
    String registerNumber,
    String name,
    String department,
    String degree,
    String batch,
    Integer yearOfPassing
) {
}
