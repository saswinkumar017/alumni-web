package com.alumniweb.alumniweb.config;

import com.alumniweb.alumniweb.model.AuditLog;
import com.alumniweb.alumniweb.model.enums.AuditCategory;
import com.alumniweb.alumniweb.model.enums.AuditLogLevel;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.security.SecurityUtils;
import com.alumniweb.alumniweb.service.AuditEventPublisher;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

/**
 * Records ONLY sensitive operations to avoid audit log bloat:
 * - Auth events (login, register, logout, password changes)
 * - Mutations (POST, PUT, PATCH, DELETE) — any write operation
 * - Error responses (4xx, 5xx)
 * - Security-sensitive endpoints (role changes, user management, config)
 *
 * Skipped: read-only GET requests to non-sensitive endpoints, audit/monitoring reads.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class AuditFilter implements Filter {

    private final AuditEventPublisher auditEventPublisher;
    private final UserRepository userRepository;

    /** Paths to always skip regardless of method */
    private static final Set<String> SKIP_PATHS = Set.of(
            "/_next", "/swagger", "/api/health",
            "/api/developer/audit/stream"
    );

    /** Auth endpoints — always recorded */
    private static final Set<String> AUTH_PATHS = Set.of(
            "/api/login", "/api/register",
            "/api/auth/login", "/api/auth/register", "/api/auth/logout",
            "/api/auth/refresh", "/api/auth/forgot-password",
            "/api/auth/reset-password", "/api/auth/verify"
    );

    /** Sensitive read endpoints — always recorded even for GET */
    private static final Set<String> SENSITIVE_READ_PATHS = Set.of(
            "/api/admin/",
            "/api/developer/users",
            "/api/developer/roles",
            "/api/developer/permissions",
            "/api/developer/mfa",
            "/api/developer/api-keys",
            "/api/developer/admin-overrides",
            "/api/developer/maintenance"
    );

    /** Read-only GET paths to NEVER record (avoid recursive/bloated logs) */
    private static final Set<String> SKIP_READ_PATHS = Set.of(
            "/api/developer/audit",
            "/api/developer/monitoring",
            "/api/developer/config"
    );

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;
        String uri = request.getRequestURI();
        String method = request.getMethod();

        // 1. Always skip static assets, health, SSE stream
        if (shouldSkip(uri)) {
            chain.doFilter(request, servletResponse);
            return;
        }

        // 2. Always record auth events
        boolean isAuth = AUTH_PATHS.contains(uri);

        // 3. Skip read-only GET to audit/monitoring/config (avoid bloat)
        boolean isSkippedRead = "GET".equals(method) && SKIP_READ_PATHS.stream().anyMatch(uri::startsWith);

        // 4. Record mutations (POST/PUT/PATCH/DELETE) and errors
        boolean isMutation = !"GET".equals(method);

        // 5. Record sensitive reads (admin, user mgmt, roles, etc.)
        boolean isSensitiveRead = "GET".equals(method) && SENSITIVE_READ_PATHS.stream().anyMatch(uri::startsWith);

        if (isSkippedRead && !isAuth) {
            chain.doFilter(request, servletResponse);
            return;
        }

        String requestId = UUID.randomUUID().toString();
        long startTime = System.currentTimeMillis();
        request.setAttribute("requestId", requestId);

        try {
            chain.doFilter(servletRequest, servletResponse);
        } finally {
            long durationMs = System.currentTimeMillis() - startTime;
            int statusCode = response.getStatus();
            boolean isError = statusCode >= 400;

            // Record if: auth event, mutation, error, or sensitive read
            if (isAuth || isMutation || isError || isSensitiveRead) {
                AuditCategory category = resolveCategory(uri, isAuth, isMutation);
                AuditLogLevel level = isError
                        ? (statusCode >= 500 ? AuditLogLevel.CRITICAL : AuditLogLevel.WARN)
                        : AuditLogLevel.INFO;

                String clientIp = getClientIp(request);
                String userAgent = request.getHeader("User-Agent");

                Long userId = null;
                try {
                    userId = SecurityUtils.getCurrentUserId();
                } catch (Exception ignored) {
                }

                AuditLog auditLog = AuditLog.builder()
                        .action(method + " " + uri)
                        .category(category)
                        .logLevel(level)
                        .method(method)
                        .endpoint(uri)
                        .statusCode(statusCode)
                        .durationMs(durationMs)
                        .ipAddress(clientIp)
                        .userAgent(userAgent)
                        .requestId(requestId)
                        .entityType("HTTP_REQUEST")
                        .build();

                if (userId != null) {
                    try {
                        var opt = userRepository.findById(userId);
                        opt.ifPresent(auditLog::setUser);
                    } catch (Exception ignored) {
                    }
                }

                auditEventPublisher.publish(auditLog);
            }
        }
    }

    private AuditCategory resolveCategory(String uri, boolean isAuth, boolean isMutation) {
        if (isAuth) return AuditCategory.AUTH;
        if (uri.startsWith("/api/admin")) return AuditCategory.SECURITY;
        if (uri.startsWith("/api/developer/")) return AuditCategory.USER_ACTION;
        if (isMutation) return AuditCategory.DATABASE;
        return AuditCategory.ENDPOINT;
    }

    private boolean shouldSkip(String uri) {
        return SKIP_PATHS.stream().anyMatch(uri::startsWith);
    }

    private String getClientIp(HttpServletRequest request) {
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
}
