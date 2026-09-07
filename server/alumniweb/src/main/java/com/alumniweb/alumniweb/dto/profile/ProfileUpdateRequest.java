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
    MaritalStatus maritalStatus
    // Academic fields (degree, department, batch, yearOfPassing) are
    // admin-managed on master_alumni; alumni cannot modify them.
) {
}
