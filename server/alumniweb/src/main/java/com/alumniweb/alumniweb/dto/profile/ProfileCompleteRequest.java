package com.alumniweb.alumniweb.dto.profile;

import com.alumniweb.alumniweb.model.enums.Availability;
import jakarta.validation.constraints.NotBlank;

public record ProfileCompleteRequest(
    @NotBlank(message = "Current working company is required")
    String company,

    @NotBlank(message = "Designation is required")
    String designation,

    String phone,
    String address,
    String profession,
    Availability availability
) {
}
