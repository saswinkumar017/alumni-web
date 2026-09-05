package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.common.ApiResponse;
import com.alumniweb.alumniweb.dto.common.ErrorResponse;
import com.alumniweb.alumniweb.dto.profile.ProfileResponse;
import com.alumniweb.alumniweb.dto.profile.ProfileUpdateRequest;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.security.SecurityUtils;
import com.alumniweb.alumniweb.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@Tag(name = "Profile", description = "Endpoints for user profile management")
@SecurityRequirement(name = "bearerAuth")
public class ProfileController {

    private final ProfileService profileService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileController(ProfileService profileService, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.profileService = profileService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    @Operation(summary = "Get profile", description = "Returns the profile of the currently authenticated user.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile data returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ProfileResponse> getProfile() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(profileService.getProfile(userId));
    }

    @PutMapping
    @Operation(summary = "Update profile", description = "Updates editable fields of the current user's profile.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile updated successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ProfileResponse> updateProfile(@RequestBody ProfileUpdateRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(profileService.updateProfile(userId, request));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password", description = "Changes the current user's password.")
    public ResponseEntity<Map<String, String>> changePassword(@RequestBody Map<String, String> body) {
        Long userId = SecurityUtils.getCurrentUserId();
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        if (currentPassword == null || newPassword == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Both passwords required"));
        User user = userRepository.findById(userId).orElseThrow();
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash()))
            return ResponseEntity.badRequest().body(Map.of("error", "Current password is incorrect"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
