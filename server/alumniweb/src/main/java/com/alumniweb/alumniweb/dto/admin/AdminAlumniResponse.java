package com.alumniweb.alumniweb.dto.admin;

public record AdminAlumniResponse(
        Long id,
        String registerNumber,
        String name,
        String email,
        String department,
        String batch,
        Integer yearOfPassing,
        boolean hasAccount,
        Boolean emailVerified,
        String accountStatus,
        String username
) {
}
