package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.exception.JwtAuthenticationException;
import com.alumniweb.alumniweb.model.VerificationToken;
import com.alumniweb.alumniweb.model.enums.EmailTemplateType;
import com.alumniweb.alumniweb.model.repository.VerificationTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class EmailVerificationTokenService {

    private final VerificationTokenRepository verificationTokenRepository;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    public EmailVerificationTokenService(VerificationTokenRepository verificationTokenRepository) {
        this.verificationTokenRepository = verificationTokenRepository;
    }

    @Transactional
    public String createToken(Long userId, String email, EmailTemplateType purpose) {
        invalidateExistingTokens(userId, purpose.name());

        String token = UUID.randomUUID().toString();
        VerificationToken vt = VerificationToken.builder()
                .token(token)
                .userId(userId)
                .email(email)
                .purpose(purpose.name())
                .issuedAt(LocalDateTime.now())
                .expiresAt(calculateExpiration(purpose))
                .used(false)
                .build();

        verificationTokenRepository.save(vt);
        return token;
    }

    public String buildVerificationUrl(String token) {
        return baseUrl + "/api/auth/verify?token=" + token;
    }

    public VerificationToken validateToken(String token, EmailTemplateType purpose) {
        VerificationToken vt = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new JwtAuthenticationException("Invalid or expired verification token"));

        if (vt.isUsed()) {
            throw new JwtAuthenticationException("Verification token has already been used");
        }

        if (vt.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new JwtAuthenticationException("Verification token has expired");
        }

        if (!vt.getPurpose().equals(purpose.name())) {
            throw new JwtAuthenticationException("Invalid token purpose");
        }

        return vt;
    }

    @Transactional
    public void markAsUsed(VerificationToken vt) {
        vt.setUsed(true);
        verificationTokenRepository.save(vt);
    }

    private LocalDateTime calculateExpiration(EmailTemplateType purpose) {
        return switch (purpose) {
            case PASSWORD_RESET -> LocalDateTime.now().plusMinutes(15);
            default -> LocalDateTime.now().plusHours(24);
        };
    }

    private void invalidateExistingTokens(Long userId, String purpose) {
        List<VerificationToken> existing =
                verificationTokenRepository.findByUserIdAndPurposeAndUsedFalse(userId, purpose);
        existing.forEach(t -> t.setUsed(true));
        verificationTokenRepository.saveAll(existing);
    }
}
