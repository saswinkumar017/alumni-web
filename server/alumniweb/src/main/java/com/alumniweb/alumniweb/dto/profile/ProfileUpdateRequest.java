package com.alumniweb.alumniweb.dto.profile;

import com.alumniweb.alumniweb.model.enums.Availability;
import com.alumniweb.alumniweb.model.enums.MaritalStatus;

public record ProfileUpdateRequest(
    String phone,
    String address,
    String company,
    String designation,
    String profession,
    Availability availability,
    MaritalStatus maritalStatus,
    String degree,
    String department,
    String batch,
    Integer yearOfPassing
) {
}
