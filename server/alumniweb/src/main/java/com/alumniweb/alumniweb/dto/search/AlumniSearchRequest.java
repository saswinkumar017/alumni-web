package com.alumniweb.alumniweb.dto.search;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record AlumniSearchRequest(
    String query,
    String registerNumber,
    String department,
    String batch,
    Integer yearOfPassing,

    @Min(value = 0, message = "Page index must not be negative")
    int page,

    @Min(value = 1, message = "Page size must be at least 1")
    @Max(value = 100, message = "Page size must not exceed 100")
    int size
) {

    public AlumniSearchRequest {
        if (page < 0) page = 0;
        if (size < 1) size = 20;
    }
}
