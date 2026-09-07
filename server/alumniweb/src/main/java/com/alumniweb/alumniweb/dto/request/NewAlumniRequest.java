package com.alumniweb.alumniweb.dto.request;

import com.alumniweb.alumniweb.model.enums.Availability;
import com.alumniweb.alumniweb.model.enums.CurrentStatus;
import com.alumniweb.alumniweb.model.enums.Gender;
import com.alumniweb.alumniweb.model.enums.MaritalStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record NewAlumniRequest(
    @NotBlank(message = "Register number is required")
    String registerNumber,

    @NotBlank(message = "Name is required")
    String name,

    String department,
    String degree,
    String batch,
    Integer yearOfPassing,

    @Email(message = "Must be a valid email address")
    String email,

    String phone,
    LocalDate dob,
    Gender gender,
    String address,

    // Required at signup so new alumni are never blank on professional details
    @NotBlank(message = "Current working company is required")
    String company,

    @NotBlank(message = "Designation is required")
    String designation,

    String profession,
    MaritalStatus maritalStatus,
    Availability availability,
    CurrentStatus currentStatus
) {
}
