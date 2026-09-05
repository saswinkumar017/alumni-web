package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.exception.JwtAuthenticationException;
import com.alumniweb.alumniweb.model.VerificationToken;
import com.alumniweb.alumniweb.model.repository.VerificationTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class OtpService {

    private static final Set<String> ALLOWED_PURPOSES =
            Set.of("LOGIN_OTP", "REGISTRATION", "EMAIL_VERIFICATION", "PASSWORD_RESET");
    private static final int MAX_ATTEMPTS = 5;

    private final VerificationTokenRepository verificationTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public OtpService(VerificationTokenRepository verificationTokenRepository) {
        this.verificationTokenRepository = verificationTokenRepository;
    }

    @Transactional
    public String generateOtp(Long userId, String email, String purpose) {
        validatePurpose(purpose);

        // Invalidate previous OTPs for this user/purpose
        List<VerificationToken> existing =
                verificationTokenRepository.findByUserIdAndPurposeAndUsedFalse(userId, purpose);
        existing.forEach(t -> t.setUsed(true));
        verificationTokenRepository.saveAll(existing);

        // Generate 6-digit OTP using a cryptographically secure random source
        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));

        VerificationToken vt = VerificationToken.builder()
                .token(otp)
                .userId(userId)
                .email(email)
                .purpose(purpose)
                .issuedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .attempts(0)
                .build();

        verificationTokenRepository.save(vt);
        return otp;
    }

    public boolean verifyOtp(Long userId, String otp, String purpose) {
        validatePurpose(purpose);
        List<VerificationToken> tokens = verificationTokenRepository
                .findByUserIdAndPurposeAndUsedFalse(userId, purpose);

        return verifyAndConsume(tokens, otp);
    }

    public String generateOtpForLogin(String username) {
        return generateOtp(0L, username, "LOGIN_OTP");
    }

    @Transactional
    public boolean verifyLoginOtp(String username, String otp) {
        List<VerificationToken> tokens = verificationTokenRepository
                .findByPurposeAndUsedFalse("LOGIN_OTP");
        return tokens.stream()
                .filter(t -> t.getEmail().equals(username))
                .findFirst()
                .map(t -> verifyToken(t, otp))
                .orElse(false);
    }

    @Transactional
    public boolean verifyByPurpose(String username, String otp, String purpose) {
        validatePurpose(purpose);
        List<VerificationToken> tokens = verificationTokenRepository
                .findByPurposeAndUsedFalse(purpose);
        return tokens.stream()
                .filter(t -> t.getEmail().equals(username))
                .findFirst()
                .map(t -> verifyToken(t, otp))
                .orElse(false);
    }

    private void validatePurpose(String purpose) {
        if (purpose == null || !ALLOWED_PURPOSES.contains(purpose)) {
            throw new IllegalArgumentException("Unsupported OTP purpose");
        }
    }

    private boolean verifyAndConsume(List<VerificationToken> tokens, String otp) {
        return tokens.stream()
                .filter(t -> !isLocked(t))
                .map(t -> verifyToken(t, otp))
                .findFirst()
                .orElseGet(() -> {
                    // Count against every outstanding token so brute force is bounded
                    tokens.stream().filter(t -> !isLocked(t)).forEach(this::incrementAttempts);
                    return false;
                });
    }

    private boolean verifyToken(VerificationToken token, String otp) {
        if (isLocked(token)) {
            return false;
        }
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            token.setUsed(true);
            verificationTokenRepository.save(token);
            return false;
        }
        if (!token.getToken().equals(otp)) {
            incrementAttempts(token);
            return false;
        }
        token.setUsed(true);
        verificationTokenRepository.save(token);
        return true;
    }

    private void incrementAttempts(VerificationToken token) {
        token.setAttempts(token.getAttempts() + 1);
        verificationTokenRepository.save(token);
    }

    private boolean isLocked(VerificationToken token) {
        return token.getAttempts() >= MAX_ATTEMPTS;
    }
}
