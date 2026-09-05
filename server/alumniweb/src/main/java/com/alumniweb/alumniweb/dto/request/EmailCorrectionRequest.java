package com.alumniweb.alumniweb.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmailCorrectionRequest(
    @NotBlank(message = "Register number is required")
    String registerNumber,

    @NotBlank(message = "Current email is required")
    @Email(message = "Must be a valid email address")
    String currentEmail,

    @NotBlank(message = "New email is required")
    @Email(message = "Must be a valid email address")
    String newEmail,

    @NotBlank(message = "Reason for correction is required")
    String reason
) {
}
