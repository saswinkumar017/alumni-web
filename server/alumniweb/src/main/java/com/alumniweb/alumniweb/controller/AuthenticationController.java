package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.auth.LoginRequest;
import com.alumniweb.alumniweb.dto.auth.LoginResponse;
import com.alumniweb.alumniweb.dto.auth.RefreshTokenRequest;
import com.alumniweb.alumniweb.dto.auth.RegisterResponse;
import com.alumniweb.alumniweb.dto.auth.TokenPair;
import com.alumniweb.alumniweb.dto.common.ErrorResponse;
import com.alumniweb.alumniweb.dto.common.ValidationErrorResponse;
import com.alumniweb.alumniweb.model.repository.AppSessionRepository;
import com.alumniweb.alumniweb.security.JwtService;
import com.alumniweb.alumniweb.service.AuthenticationService;
import com.alumniweb.alumniweb.service.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Authentication", description = "Endpoints for login, token refresh, and email verification")
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final RegistrationService registrationService;
    private final JwtService jwtService;
    private final AppSessionRepository appSessionRepository;

    public AuthenticationController(AuthenticationService authenticationService,
                                    RegistrationService registrationService,
                                    JwtService jwtService,
                                    AppSessionRepository appSessionRepository) {
        this.authenticationService = authenticationService;
        this.registrationService = registrationService;
        this.jwtService = jwtService;
        this.appSessionRepository = appSessionRepository;
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user", description = "Validates credentials and returns a JWT token pair.",
            security = {})
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login successful, token pair returned"),
            @ApiResponse(responseCode = "400", description = "Invalid request body",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authenticationService.authenticate(request));
    }

    @PostMapping("/auth/refresh")
    @Operation(summary = "Refresh access token", description = "Exchanges a valid refresh token for a new token pair.",
            security = {})
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "New token pair generated"),
            @ApiResponse(responseCode = "400", description = "Invalid request body",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<TokenPair> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authenticationService.refreshAccessToken(request.refreshToken()));
    }

    @GetMapping("/auth/verify")
    @Operation(summary = "Verify email address", description = "Validates a verification token and activates the user account.",
            security = {})
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Email verified, account activated"),
            @ApiResponse(responseCode = "400", description = "Invalid or expired verification token",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<RegisterResponse> verifyEmail(@RequestParam String token) {
        return ResponseEntity.ok(registrationService.verifyEmail(token));
    }

    @PostMapping("/auth/logout")
    @Operation(summary = "Logout and revoke session", description = "Revokes all sessions for the current user.")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String username = jwtService.extractUsername(token);
                var userSessions = appSessionRepository.findByUserId(
                        jwtService.extractUserId(token));
                userSessions.forEach(s -> s.setRevoked(true));
                appSessionRepository.saveAll(userSessions);
            } catch (Exception ignored) {
            }
        }
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
