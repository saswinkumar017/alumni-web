package com.alumniweb.alumniweb.service.impl;

import com.alumniweb.alumniweb.config.JwtProperties;
import com.alumniweb.alumniweb.dto.auth.LoginRequest;
import com.alumniweb.alumniweb.dto.auth.LoginResponse;
import com.alumniweb.alumniweb.dto.auth.TokenPair;
import com.alumniweb.alumniweb.exception.InvalidCredentialsException;
import com.alumniweb.alumniweb.exception.JwtAuthenticationException;
import com.alumniweb.alumniweb.model.AppSession;
import com.alumniweb.alumniweb.model.AuditLog;
import com.alumniweb.alumniweb.model.LoginEvent;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.enums.AccountStatus;
import com.alumniweb.alumniweb.model.enums.AuditCategory;
import com.alumniweb.alumniweb.model.enums.AuditLogLevel;
import com.alumniweb.alumniweb.model.enums.LoginEventStatus;
import com.alumniweb.alumniweb.model.repository.AppSessionRepository;
import com.alumniweb.alumniweb.model.repository.LoginEventRepository;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.security.JwtService;
import com.alumniweb.alumniweb.service.AuditEventPublisher;
import com.alumniweb.alumniweb.service.AuthenticationService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthenticationServiceImpl implements AuthenticationService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int RATE_LIMIT_WINDOW_MINUTES = 15;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginEventRepository loginEventRepository;
    private final AppSessionRepository appSessionRepository;
    private final AuditEventPublisher auditEventPublisher;
    private final JwtProperties jwtProperties;

    @Override
    @Transactional
    public LoginResponse authenticate(LoginRequest request) {
        Optional<User> byUsername = userRepository.findByUsername(request.username());
        if (byUsername.isEmpty()) {
            logRateLimitedLoginEvent(request.username(), LoginEventStatus.FAILED_PASSWORD, "User not found");
            throw new InvalidCredentialsException();
        }
        User user = byUsername.get();

        if (isRateLimited(request.username())) {
            logRateLimitedLoginEvent(request.username(), LoginEventStatus.FAILED_PASSWORD, "Too many attempts");
            throw new InvalidCredentialsException();
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            logLoginEvent(user, request.username(), LoginEventStatus.FAILED_PASSWORD, "Invalid password");

            auditEventPublisher.publish(AuditLog.builder()
                    .user(user)
                    .action("LOGIN_FAILURE")
                    .category(AuditCategory.AUTH)
                    .logLevel(AuditLogLevel.WARN)
                    .entityType("User")
                    .entityId(user.getId())
                    .ipAddress(getClientIp())
                    .userAgent(getUserAgent())
                    .responseSummary("Invalid password")
                    .build());

            throw new InvalidCredentialsException();
        }

        // Reject accounts that are not ACTIVE (suspended, locked, pending verification, inactive)
        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            logLoginEvent(user, request.username(), LoginEventStatus.FAILED_PASSWORD,
                    "Account status: " + user.getAccountStatus());
            auditEventPublisher.publish(AuditLog.builder()
                    .user(user)
                    .action("LOGIN_FAILURE")
                    .category(AuditCategory.AUTH)
                    .logLevel(AuditLogLevel.WARN)
                    .entityType("User")
                    .entityId(user.getId())
                    .ipAddress(getClientIp())
                    .userAgent(getUserAgent())
                    .responseSummary("Account not active")
                    .build());
            throw new InvalidCredentialsException();
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        logLoginEvent(user, request.username(), LoginEventStatus.SUCCESS, null);

        auditEventPublisher.publish(AuditLog.builder()
                .user(user)
                .action("LOGIN_SUCCESS")
                .category(AuditCategory.AUTH)
                .logLevel(AuditLogLevel.INFO)
                .entityType("User")
                .entityId(user.getId())
                .ipAddress(getClientIp())
                .userAgent(getUserAgent())
                .build());

        TokenPair tokenPair = jwtService.generateTokenPair(
                user.getId(), user.getUsername(), user.getRole().name());

        createAppSession(user, tokenPair);

        return new LoginResponse(
                tokenPair.accessToken(),
                tokenPair.refreshToken(),
                tokenPair.tokenType(),
                tokenPair.expiresAt(),
                user.getUsername(),
                user.getRole().name()
        );
    }

    private boolean isRateLimited(String username) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(RATE_LIMIT_WINDOW_MINUTES);
        long recentFailures = loginEventRepository
                .countByEmailUsedAndStatusAndCreatedAtAfter(username, LoginEventStatus.FAILED_PASSWORD, since);
        return recentFailures >= MAX_FAILED_ATTEMPTS;
    }

    private void logRateLimitedLoginEvent(String email, LoginEventStatus status, String failureReason) {
        try {
            LoginEvent event = LoginEvent.builder()
                    .emailUsed(email)
                    .ipAddress(getClientIp())
                    .userAgent(getUserAgent())
                    .status(status)
                    .failureReason(failureReason)
                    .build();
            loginEventRepository.save(event);
        } catch (Exception ignored) {
        }
    }

    private void createAppSession(User user, TokenPair tokenPair) {
        try {
            Claims claims = jwtService.parseToken(tokenPair.refreshToken());
            AppSession session = AppSession.builder()
                    .user(user)
                    .sessionToken(claims.get("tokenId", String.class))
                    .refreshToken(sha256Hex(tokenPair.refreshToken()))
                    .ipAddress(getClientIp())
                    .userAgent(getUserAgent())
                    .expiresAt(LocalDateTime.now()
                            .plus(jwtProperties.getRefreshTokenExpiration(), java.time.temporal.ChronoUnit.MILLIS))
                    .revoked(false)
                    .build();
            appSessionRepository.save(session);
        } catch (Exception ignored) {
        }
    }

    private static String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private void logLoginEvent(User user, String email, LoginEventStatus status, String failureReason) {
        try {
            String ipAddress = getClientIp();
            String userAgent = getUserAgent();

            LoginEvent event = LoginEvent.builder()
                    .user(user)
                    .emailUsed(email)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .status(status)
                    .failureReason(failureReason)
                    .build();

            loginEventRepository.save(event);
        } catch (Exception ignored) {
        }
    }

    private String getClientIp() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) return "unknown";
        HttpServletRequest request = attrs.getRequest();
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        String xri = request.getHeader("X-Real-IP");
        if (xri != null && !xri.isEmpty()) {
            return xri;
        }
        return request.getRemoteAddr();
    }

    private String getUserAgent() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) return "unknown";
        return attrs.getRequest().getHeader("User-Agent");
    }

    @Override
    @Transactional
    public TokenPair refreshAccessToken(String refreshToken) {
        Claims claims;
        try {
            claims = jwtService.parseToken(refreshToken);
        } catch (ExpiredJwtException e) {
            throw new JwtAuthenticationException("Refresh token has expired");
        } catch (JwtException | IllegalArgumentException e) {
            throw new JwtAuthenticationException("Invalid refresh token");
        }

        String tokenId = claims.get("tokenId", String.class);
        if (tokenId == null) {
            throw new JwtAuthenticationException("Invalid refresh token");
        }

        AppSession session = appSessionRepository.findBySessionToken(tokenId)
                .filter(s -> !s.isRevoked())
                .orElseThrow(() -> new JwtAuthenticationException("Session has been revoked"));

        User user = userRepository.findById(session.getUser().getId())
                .filter(u -> u.getAccountStatus() == AccountStatus.ACTIVE)
                .orElseThrow(() -> new JwtAuthenticationException("Account is not active"));

        TokenPair newPair = jwtService.generateTokenPair(
                user.getId(), user.getUsername(), user.getRole().name());

        Claims newClaims = jwtService.parseToken(newPair.refreshToken());
        session.setSessionToken(newClaims.get("tokenId", String.class));
        session.setRefreshToken(sha256Hex(newPair.refreshToken()));
        session.setExpiresAt(LocalDateTime.now().plus(jwtProperties.getRefreshTokenExpiration(), java.time.temporal.ChronoUnit.MILLIS));
        appSessionRepository.save(session);

        return newPair;
    }
}
