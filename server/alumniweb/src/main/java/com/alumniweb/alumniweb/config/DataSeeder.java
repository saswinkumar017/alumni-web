package com.alumniweb.alumniweb.config;

import com.alumniweb.alumniweb.model.*;
import com.alumniweb.alumniweb.model.enums.*;
import com.alumniweb.alumniweb.model.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MasterAlumniRepository masterAlumniRepository;
    private final PasswordEncoder passwordEncoder;
    private final PermissionCategoryRepository permissionCategoryRepository;
    private final PermissionGroupRepository permissionGroupRepository;
    private final PermissionRepository permissionRepository;
    private final RoleTemplateRepository roleTemplateRepository;
    private final RoleTemplatePermissionRepository roleTemplatePermissionRepository;
    private final PlatformConfigRepository platformConfigRepository;
    private final FeatureFlagRepository featureFlagRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting data seeder...");
        seedDeveloperUser();
        seedPermissionCategoriesAndGroups();
        seedPermissions();
        seedRoleTemplates();
        seedRolePermissions();
        seedPlatformConfigs();
        seedFeatureFlags();
        log.info("Data seeding complete.");
    }

    private void seedDeveloperUser() {
        if (userRepository.existsByUsername("developer")) {
            log.info("Developer user already exists, skipping.");
            return;
        }

        User devUser = User.builder()
                .username("developer")
                .passwordHash(passwordEncoder.encode("Dev@123456789!"))
                .role(UserRole.DEVELOPER)
                .emailVerified(true)
                .accountStatus(AccountStatus.ACTIVE)
                .build();
        userRepository.save(devUser);
        log.info("Created DEVELOPER user: developer / Dev@123456789!");
    }

    private void seedPermissionCategoriesAndGroups() {
        if (permissionCategoryRepository.count() > 0) {
            log.info("Permission categories already exist, skipping.");
            return;
        }
        String[][] categories = {
            {"user-mgmt", "User Management"},
            {"role-mgmt", "Role & Permission Management"},
            {"platform", "Platform Configuration"},
            {"security", "Security"},
            {"monitoring", "Monitoring & Audit"},
            {"communication", "Communication"},
            {"reports", "Reports"},
        };
        int order = 1;
        for (String[] cat : categories) {
            PermissionCategory entity = PermissionCategory.builder()
                    .code(cat[0])
                    .name(cat[1])
                    .displayOrder(order++)
                    .build();
            permissionCategoryRepository.save(entity);

            PermissionGroup group = PermissionGroup.builder()
                    .category(entity)
                    .name(cat[1])
                    .code(cat[0] + "-group")
                    .displayOrder(1)
                    .build();
            permissionGroupRepository.save(group);
        }
        log.info("Seeded 7 permission categories with groups.");
    }

    private void seedPermissions() {
        if (permissionRepository.count() > 0) {
            log.info("Permissions already exist, skipping.");
            return;
        }

        PermissionGroup userMgmtGroup = permissionGroupRepository.findAll().stream()
                .filter(g -> g.getCategory().getCode().equals("user-mgmt")).findFirst().orElseThrow();
        PermissionGroup roleMgmtGroup = permissionGroupRepository.findAll().stream()
                .filter(g -> g.getCategory().getCode().equals("role-mgmt")).findFirst().orElseThrow();
        PermissionGroup platformGroup = permissionGroupRepository.findAll().stream()
                .filter(g -> g.getCategory().getCode().equals("platform")).findFirst().orElseThrow();
        PermissionGroup securityGroup = permissionGroupRepository.findAll().stream()
                .filter(g -> g.getCategory().getCode().equals("security")).findFirst().orElseThrow();
        PermissionGroup monitoringGroup = permissionGroupRepository.findAll().stream()
                .filter(g -> g.getCategory().getCode().equals("monitoring")).findFirst().orElseThrow();
        PermissionGroup commGroup = permissionGroupRepository.findAll().stream()
                .filter(g -> g.getCategory().getCode().equals("communication")).findFirst().orElseThrow();
        PermissionGroup reportsGroup = permissionGroupRepository.findAll().stream()
                .filter(g -> g.getCategory().getCode().equals("reports")).findFirst().orElseThrow();

        record PermDef(String code, String name, String action, String resource, PermissionGroup group, RiskLevel risk) {}
        PermDef[] perms = {
            new PermDef("user:read", "View users", "read", "user", userMgmtGroup, RiskLevel.LOW),
            new PermDef("user:create", "Create users", "create", "user", userMgmtGroup, RiskLevel.LOW),
            new PermDef("user:update", "Edit users", "update", "user", userMgmtGroup, RiskLevel.LOW),
            new PermDef("user:delete", "Delete users", "delete", "user", userMgmtGroup, RiskLevel.HIGH),
            new PermDef("user:impersonate", "Impersonate users", "impersonate", "user", userMgmtGroup, RiskLevel.CRITICAL),
            new PermDef("user:manage-roles", "Change user roles", "manage-roles", "user", userMgmtGroup, RiskLevel.HIGH),
            new PermDef("user:suspend", "Suspend users", "suspend", "user", userMgmtGroup, RiskLevel.MEDIUM),
            new PermDef("user:activate", "Activate users", "activate", "user", userMgmtGroup, RiskLevel.LOW),
            new PermDef("user:view-sessions", "View user sessions", "view-sessions", "user", userMgmtGroup, RiskLevel.LOW),
            new PermDef("user:revoke-sessions", "Revoke user sessions", "revoke-sessions", "user", userMgmtGroup, RiskLevel.MEDIUM),
            new PermDef("user:reset-password", "Force password reset", "reset-password", "user", userMgmtGroup, RiskLevel.HIGH),
            new PermDef("user:view-stats", "View user statistics", "view-stats", "user", userMgmtGroup, RiskLevel.LOW),
            new PermDef("role:read", "View roles", "read", "role", roleMgmtGroup, RiskLevel.LOW),
            new PermDef("role:create", "Create roles", "create", "role", roleMgmtGroup, RiskLevel.LOW),
            new PermDef("role:update", "Edit roles", "update", "role", roleMgmtGroup, RiskLevel.LOW),
            new PermDef("role:delete", "Delete roles", "delete", "role", roleMgmtGroup, RiskLevel.HIGH),
            new PermDef("role:clone", "Clone roles", "clone", "role", roleMgmtGroup, RiskLevel.LOW),
            new PermDef("role:archive", "Archive roles", "archive", "role", roleMgmtGroup, RiskLevel.LOW),
            new PermDef("role:manage-hierarchy", "Edit role hierarchy", "manage-hierarchy", "role", roleMgmtGroup, RiskLevel.HIGH),
            new PermDef("permission:read", "View permissions", "read", "permission", roleMgmtGroup, RiskLevel.LOW),
            new PermDef("permission:create", "Create permissions", "create", "permission", roleMgmtGroup, RiskLevel.LOW),
            new PermDef("permission:update", "Edit permissions", "update", "permission", roleMgmtGroup, RiskLevel.LOW),
            new PermDef("permission:delete", "Delete permissions", "delete", "permission", roleMgmtGroup, RiskLevel.MEDIUM),
            new PermDef("admin-override:manage", "Manage admin overrides", "manage", "admin-override", roleMgmtGroup, RiskLevel.HIGH),
            new PermDef("config:read", "View config", "read", "config", platformGroup, RiskLevel.LOW),
            new PermDef("config:update", "Update config", "update", "config", platformGroup, RiskLevel.LOW),
            new PermDef("config:delete", "Delete config", "delete", "config", platformGroup, RiskLevel.MEDIUM),
            new PermDef("feature-flag:read", "View feature flags", "read", "feature-flag", platformGroup, RiskLevel.LOW),
            new PermDef("feature-flag:create", "Create feature flags", "create", "feature-flag", platformGroup, RiskLevel.LOW),
            new PermDef("feature-flag:update", "Edit feature flags", "update", "feature-flag", platformGroup, RiskLevel.LOW),
            new PermDef("feature-flag:delete", "Delete feature flags", "delete", "feature-flag", platformGroup, RiskLevel.LOW),
            new PermDef("feature-flag:toggle", "Toggle feature flags", "toggle", "feature-flag", platformGroup, RiskLevel.LOW),
            new PermDef("branding:update", "Update branding", "update", "branding", platformGroup, RiskLevel.LOW),
            new PermDef("navigation:update", "Update navigation", "update", "navigation", platformGroup, RiskLevel.LOW),
            new PermDef("maintenance:toggle", "Toggle maintenance mode", "toggle", "maintenance", platformGroup, RiskLevel.MEDIUM),
            new PermDef("auth:manage-providers", "Manage auth providers", "manage-providers", "auth", securityGroup, RiskLevel.HIGH),
            new PermDef("auth:manage-policies", "Manage auth policies", "manage-policies", "auth", securityGroup, RiskLevel.HIGH),
            new PermDef("auth:manage-mfa", "Manage MFA settings", "manage-mfa", "auth", securityGroup, RiskLevel.HIGH),
            new PermDef("api-key:read", "View API keys", "read", "api-key", securityGroup, RiskLevel.LOW),
            new PermDef("api-key:create", "Create API keys", "create", "api-key", securityGroup, RiskLevel.LOW),
            new PermDef("api-key:revoke", "Revoke API keys", "revoke", "api-key", securityGroup, RiskLevel.MEDIUM),
            new PermDef("security:manage", "Manage security policies", "manage", "security", securityGroup, RiskLevel.HIGH),
            new PermDef("audit:read", "View audit logs", "read", "audit", monitoringGroup, RiskLevel.LOW),
            new PermDef("audit:export", "Export audit logs", "export", "audit", monitoringGroup, RiskLevel.LOW),
            new PermDef("audit:search", "Advanced audit search", "search", "audit", monitoringGroup, RiskLevel.LOW),
            new PermDef("monitoring:view", "View monitoring", "view", "monitoring", monitoringGroup, RiskLevel.LOW),
            new PermDef("monitoring:sessions", "View all sessions", "sessions", "monitoring", monitoringGroup, RiskLevel.LOW),
            new PermDef("monitoring:infrastructure", "View infrastructure", "infrastructure", "monitoring", monitoringGroup, RiskLevel.LOW),
            new PermDef("monitoring:api-metrics", "View API metrics", "api-metrics", "monitoring", monitoringGroup, RiskLevel.LOW),
            new PermDef("monitoring:alerts", "Manage alerts", "alerts", "monitoring", monitoringGroup, RiskLevel.LOW),
            new PermDef("announcement:create", "Create announcements", "create", "announcement", commGroup, RiskLevel.LOW),
            new PermDef("announcement:update", "Edit announcements", "update", "announcement", commGroup, RiskLevel.LOW),
            new PermDef("announcement:delete", "Delete announcements", "delete", "announcement", commGroup, RiskLevel.LOW),
            new PermDef("message:read:any", "Read any messages", "read-any", "message", commGroup, RiskLevel.HIGH),
            new PermDef("email:send-bulk", "Send bulk emails", "send-bulk", "email", commGroup, RiskLevel.MEDIUM),
            new PermDef("report:view", "View reports", "view", "report", reportsGroup, RiskLevel.LOW),
            new PermDef("report:export", "Export reports", "export", "report", reportsGroup, RiskLevel.LOW),
            new PermDef("report:advanced", "Advanced analytics", "advanced", "report", reportsGroup, RiskLevel.LOW),
        };

        for (PermDef p : perms) {
            Permission perm = Permission.builder()
                    .code(p.code())
                    .name(p.name())
                    .group(p.group())
                    .action(p.action())
                    .resource(p.resource())
                    .riskLevel(p.risk())
                    .build();
            permissionRepository.save(perm);
        }
        log.info("Seeded " + perms.length + " permissions.");
    }

    private void seedRoleTemplates() {
        if (roleTemplateRepository.count() > 0) {
            log.info("Role templates already exist, skipping.");
            return;
        }
        RoleTemplate admin = RoleTemplate.builder()
                .name("Administrator")
                .code("admin")
                .description("Platform administrator")
                .isSystem(true)
                .isActive(true)
                .build();
        roleTemplateRepository.save(admin);

        RoleTemplate alumniLead = RoleTemplate.builder()
                .name("Alumni Lead")
                .code("alumni_lead")
                .description("Alumni community leader")
                .isSystem(false)
                .isActive(true)
                .build();
        roleTemplateRepository.save(alumniLead);

        RoleTemplate alumni = RoleTemplate.builder()
                .name("Alumni")
                .code("alumni")
                .description("Verified alumni member")
                .isSystem(true)
                .isActive(true)
                .build();
        roleTemplateRepository.save(alumni);

        log.info("Seeded 3 role templates.");
    }

    private void seedRolePermissions() {
        if (roleTemplatePermissionRepository.count() > 0) {
            log.info("Role permissions already exist, skipping.");
            return;
        }
        RoleTemplate admin = roleTemplateRepository.findByCode("admin").orElseThrow();
        List<Permission> allPerms = permissionRepository.findAll();
        for (Permission perm : allPerms) {
            RoleTemplatePermission rtp = RoleTemplatePermission.builder()
                    .roleTemplate(admin)
                    .permission(perm)
                    .granted(true)
                    .build();
            roleTemplatePermissionRepository.save(rtp);
        }
        log.info("Mapped all permissions to ADMIN role template.");
    }

    private void seedPlatformConfigs() {
        if (platformConfigRepository.count() > 0) {
            log.info("Platform configs already exist, skipping.");
            return;
        }
        record Cfg(String key, String value, ValueType vt, ConfigCategory cat, String desc) {}
        Cfg[] configs = {
            new Cfg("app.name", "\"JJCET Alumni\"", ValueType.STRING, ConfigCategory.GENERAL, "Application name"),
            new Cfg("app.url", "\"https://alumni.jjcinet.ac.in\"", ValueType.STRING, ConfigCategory.GENERAL, "Application URL"),
            new Cfg("auth.session.timeout", "900000", ValueType.INTEGER, ConfigCategory.GENERAL, "Session timeout in ms"),
            new Cfg("auth.mfa.enabled", "true", ValueType.BOOLEAN, ConfigCategory.SECURITY, "MFA enforcement"),
            new Cfg("platform.maintenance_mode", "false", ValueType.BOOLEAN, ConfigCategory.FEATURE, "Maintenance mode"),
        };
        for (Cfg c : configs) {
            PlatformConfig config = PlatformConfig.builder()
                    .key(c.key())
                    .value(c.value())
                    .valueType(c.vt())
                    .category(c.cat())
                    .description(c.desc())
                    .build();
            platformConfigRepository.save(config);
        }
        log.info("Seeded 5 platform configs.");
    }

    private void seedFeatureFlags() {
        if (featureFlagRepository.count() > 0) {
            log.info("Feature flags already exist, skipping.");
            return;
        }
        record Flag(String code, String name, String desc) {}
        Flag[] flags = {
            new Flag("enable-networking", "Alumni Networking", "Enable alumni networking features"),
            new Flag("enable-community", "Community Features", "Enable batch communities"),
            new Flag("enable-donations", "Donations", "Enable donation features"),
            new Flag("enable-messaging", "Messaging", "Enable messaging system"),
            new Flag("enable-events", "Events", "Enable event management"),
            new Flag("maintenance-mode", "Maintenance Mode", "Put site in maintenance mode"),
        };
        for (Flag f : flags) {
            FeatureFlag flag = FeatureFlag.builder()
                    .code(f.code())
                    .name(f.name())
                    .description(f.desc())
                    .isEnabled(false)
                    .rolloutPercentage(0)
                    .targetAudience(TargetAudience.ALL)
                    .build();
            featureFlagRepository.save(flag);
        }
        log.info("Seeded 6 feature flags.");
    }
}
