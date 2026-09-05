package com.alumniweb.alumniweb.service.impl;

import com.alumniweb.alumniweb.dto.profile.ProfileResponse;
import com.alumniweb.alumniweb.dto.profile.ProfileUpdateRequest;
import com.alumniweb.alumniweb.exception.UserNotFoundException;
import com.alumniweb.alumniweb.model.MasterAlumni;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;

    @Override
    public ProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));

        MasterAlumni alumni = user.getMasterAlumni();
        String memberSince = user.getCreatedAt() != null
            ? user.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM yyyy"))
            : null;

        return new ProfileResponse(
            user.getId(),
            alumni.getName(),
            alumni.getRegisterNumber(),
            alumni.getDob(),
            alumni.getGender() != null ? alumni.getGender().name() : null,
            alumni.getMaritalStatus(),
            alumni.getDepartment(),
            alumni.getDegree(),
            alumni.getBatch(),
            alumni.getYearOfPassing(),
            alumni.getCompany(),
            alumni.getDesignation(),
            alumni.getProfession(),
            alumni.getAvailability(),
            alumni.getEmail(),
            alumni.getPhone(),
            alumni.getAddress(),
            user.getUsername(),
            user.getRole().name(),
            user.isEmailVerified(),
            user.getAccountStatus().name().toLowerCase(),
            user.getCreatedAt(),
            user.getLastLogin(),
            memberSince
        );
    }

    @Override
    @Transactional
    public ProfileResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));

        MasterAlumni alumni = user.getMasterAlumni();

        if (request.phone() != null) alumni.setPhone(request.phone());
        if (request.address() != null) alumni.setAddress(request.address());
        if (request.company() != null) alumni.setCompany(request.company());
        if (request.designation() != null) alumni.setDesignation(request.designation());
        if (request.profession() != null) alumni.setProfession(request.profession());
        if (request.availability() != null) alumni.setAvailability(request.availability());
        if (request.maritalStatus() != null) alumni.setMaritalStatus(request.maritalStatus());
        if (request.degree() != null) alumni.setDegree(request.degree());
        if (request.department() != null) alumni.setDepartment(request.department());
        if (request.batch() != null) alumni.setBatch(request.batch());
        if (request.yearOfPassing() != null) alumni.setYearOfPassing(request.yearOfPassing());

        userRepository.save(user);

        return getProfile(userId);
    }
}
