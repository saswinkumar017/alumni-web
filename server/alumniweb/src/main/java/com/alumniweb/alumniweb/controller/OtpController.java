package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.enums.AccountStatus;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.service.EmailService;
import com.alumniweb.alumniweb.service.OtpService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/otp")
public class OtpController {

    private final OtpService otpService;
    private final UserRepository userRepository;
    private final EmailService emailService;

    private static final java.util.Set<String> ALLOWED_PURPOSES =
            java.util.Set.of("LOGIN_OTP", "REGISTRATION", "EMAIL_VERIFICATION", "PASSWORD_RESET");

    public OtpController(OtpService otpService, UserRepository userRepository, EmailService emailService) {
        this.otpService = otpService;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @PostMapping("/send")
    public ResponseEntity<Map<String, String>> sendOtp(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String purpose = body.getOrDefault("purpose", "LOGIN_OTP");

        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username is required"));
        }
        if (!ALLOWED_PURPOSES.contains(purpose)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unsupported OTP purpose"));
        }

        // Look up user to get their email
        var user = userRepository.findByUsername(username);

        // Return a generic response regardless of whether the account exists so the
        // endpoint cannot be used to enumerate registered usernames.
        if (user.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "If the account exists, an OTP has been sent"));
        }

        var u = user.get();
        String email = u.getMasterAlumni() != null ? u.getMasterAlumni().getEmail() : username;
        String otp = otpService.generateOtp(u.getId(), email, purpose);

        emailService.sendOtpEmail(email, username, otp);

        return ResponseEntity.ok(Map.of(
                "message", "OTP sent to your email",
                "expiresIn", "10 minutes"
        ));
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyOtp(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String otp = body.get("otp");
        String purpose = body.getOrDefault("purpose", "REGISTRATION");

        if (username == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username and OTP are required"));
        }

        // For REGISTRATION, OTP is stored by email (masterAlumni.email), so we need to look it up
        Optional<User> optUser = userRepository.findByUsername(username);
        String email = optUser
                .filter(u -> u.getMasterAlumni() != null)
                .map(u -> u.getMasterAlumni().getEmail())
                .orElse(username);

        boolean verified = otpService.verifyByPurpose(email, otp, purpose);
        if (!verified) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP"));
        }

        if ("REGISTRATION".equals(purpose)) {
            optUser.ifPresent(user -> {
                user.setEmailVerified(true);
                user.setAccountStatus(AccountStatus.ACTIVE);
                userRepository.save(user);
            });
        }

        return ResponseEntity.ok(Map.of("message", "OTP verified successfully"));
    }
}
