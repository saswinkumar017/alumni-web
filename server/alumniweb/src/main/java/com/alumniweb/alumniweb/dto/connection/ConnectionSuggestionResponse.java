package com.alumniweb.alumniweb.dto.connection;

public record ConnectionSuggestionResponse(
    Long id,
    String registerNumber,
    String name,
    String department,
    String batch,
    Integer yearOfPassing,
    String company,
    String designation,
    String connectionStatus
) {
}
