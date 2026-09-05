package com.alumniweb.alumniweb.dto.profile;

import com.alumniweb.alumniweb.model.enums.Availability;
import com.alumniweb.alumniweb.model.enums.MaritalStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ProfileResponse(
    Long userId,
    String fullName,
    String registerNumber,
    LocalDate dateOfBirth,
    String gender,
    MaritalStatus maritalStatus,
    String department,
    String degree,
    String batch,
    Integer yearOfPassing,
    String company,
    String designation,
    String profession,
    Availability availability,
    String email,
    String phone,
    String address,
    String username,
    String role,
    boolean emailVerified,
    String accountStatus,
    LocalDateTime createdAt,
    LocalDateTime lastLogin,
    String memberSince
) {
}
