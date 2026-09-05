package com.alumniweb.alumniweb.dto.common;

import java.time.LocalDateTime;
import java.util.List;

public record ValidationErrorResponse(
    int status,
    String error,
    String message,
    String path,
    LocalDateTime timestamp,
    List<FieldError> fieldErrors
) {

    public record FieldError(
        String field,
        Object rejectedValue,
        String message
    ) {
    }
}
