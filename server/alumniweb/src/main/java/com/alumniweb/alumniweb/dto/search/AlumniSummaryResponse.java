package com.alumniweb.alumniweb.dto.search;

public record AlumniSummaryResponse(
    Long id,
    String registerNumber,
    String name,
    String email,
    String department,
    String batch,
    Integer yearOfPassing
) {
}
