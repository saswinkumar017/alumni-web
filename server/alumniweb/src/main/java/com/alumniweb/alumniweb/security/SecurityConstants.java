package com.alumniweb.alumniweb.security;

public final class SecurityConstants {

    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_USER = "USER";
    public static final String ROLE_DEVELOPER = "DEVELOPER";

    public static final String AUTHORITY_ADMIN = "ROLE_ADMIN";
    public static final String AUTHORITY_USER = "ROLE_USER";
    public static final String AUTHORITY_DEVELOPER = "ROLE_DEVELOPER";

    public static final String[] PUBLIC_URLS = {
            "/api/register/**",
            "/api/login/**",
            "/api/auth/**",
            "/api/search/**",
            "/api/alumni/**",
            "/api/request/**",
            "/api/otp/**",
            "/api/events/**",
            "/api/announcements/**",
            "/api/health"
    };

    public static final String ADMIN_URL = "/api/admin/**";
    public static final String DEVELOPER_URL = "/api/developer/**";

    private SecurityConstants() {
    }
}
