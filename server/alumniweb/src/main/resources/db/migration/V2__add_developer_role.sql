-- V2: Add DEVELOPER role and all security/permission/platform tables
-- This migration adds the DEVELOPER value to the role enum and creates
-- MFA, session management, permissions, audit, config, and CMS tables.

-- 1. Modify user_account: add DEVELOPER to role enum
ALTER TABLE user_account MODIFY COLUMN role ENUM('ADMIN','USER','DEVELOPER') NOT NULL;

-- 2. mfa_enrollment
CREATE TABLE mfa_enrollment (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    method ENUM('TOTP','SMS','EMAIL','BACKUP_CODES') NOT NULL,
    secret_encrypted VARCHAR(512) NOT NULL,
    label VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_mfa_user (user_id),
    INDEX idx_mfa_method (method),
    CONSTRAINT fk_mfa_user FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. trusted_device
CREATE TABLE trusted_device (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    device_fingerprint VARCHAR(128) NOT NULL,
    device_name VARCHAR(200) NULL,
    device_type ENUM('DESKTOP','MOBILE','TABLET','OTHER') NOT NULL DEFAULT 'OTHER',
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    trusted BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at DATETIME(6) NOT NULL,
    last_seen_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_trusted_user (user_id),
    INDEX idx_trusted_fingerprint (device_fingerprint),
    INDEX idx_trusted_expires (expires_at),
    CONSTRAINT fk_trusted_user FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. app_session (renamed from session to avoid keyword conflicts)
CREATE TABLE app_session (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    refresh_token VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    device_fingerprint VARCHAR(128) NULL,
    expires_at DATETIME(6) NOT NULL,
    refresh_expires_at DATETIME(6) NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_session_user (user_id),
    UNIQUE INDEX uq_session_token (session_token),
    INDEX idx_session_expires (expires_at),
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. login_event
CREATE TABLE login_event (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NULL,
    email_used VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(500) NULL,
    status ENUM('SUCCESS','FAILED_PASSWORD','FAILED_MFA','LOCKED','SUSPENDED') NOT NULL,
    failure_reason VARCHAR(255) NULL,
    risk_score INT NULL,
    country_code VARCHAR(2) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_login_user (user_id),
    INDEX idx_login_email (email_used),
    INDEX idx_login_status (status),
    INDEX idx_login_created (created_at),
    CONSTRAINT fk_login_user FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. api_key
CREATE TABLE api_key (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(12) NOT NULL,
    scopes VARCHAR(500) NULL,
    rate_limit INT NULL DEFAULT 1000,
    expires_at DATETIME(6) NULL,
    last_used_at DATETIME(6) NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_apikey_user (user_id),
    UNIQUE INDEX uq_apikey_hash (key_hash),
    INDEX idx_apikey_prefix (key_prefix),
    CONSTRAINT fk_apikey_user FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. role_template
CREATE TABLE role_template (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE INDEX uq_role_template_code (code),
    INDEX idx_role_template_active (is_active),
    CONSTRAINT fk_role_template_creator FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. permission_category
CREATE TABLE permission_category (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE INDEX uq_perm_category_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. permission_group
CREATE TABLE permission_group (
    id BIGINT NOT NULL AUTO_INCREMENT,
    category_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE INDEX uq_perm_group_code (code),
    INDEX idx_perm_group_category (category_id),
    CONSTRAINT fk_perm_group_category FOREIGN KEY (category_id) REFERENCES permission_category(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. permission
CREATE TABLE permission (
    id BIGINT NOT NULL AUTO_INCREMENT,
    group_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    risk_level ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW',
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE INDEX uq_permission_code (code),
    INDEX idx_permission_group (group_id),
    INDEX idx_permission_action_resource (action, resource),
    CONSTRAINT fk_permission_group FOREIGN KEY (group_id) REFERENCES permission_group(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. role_template_permission (join table)
CREATE TABLE role_template_permission (
    id BIGINT NOT NULL AUTO_INCREMENT,
    role_template_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT TRUE,
    conditions_json JSON NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE INDEX uq_rtp_role_perm (role_template_id, permission_id),
    INDEX idx_rtp_permission (permission_id),
    CONSTRAINT fk_rtp_role FOREIGN KEY (role_template_id) REFERENCES role_template(id) ON DELETE CASCADE,
    CONSTRAINT fk_rtp_permission FOREIGN KEY (permission_id) REFERENCES permission(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. role_template_hierarchy (join table)
CREATE TABLE role_template_hierarchy (
    id BIGINT NOT NULL AUTO_INCREMENT,
    parent_role_id BIGINT NOT NULL,
    child_role_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE INDEX uq_rth_parent_child (parent_role_id, child_role_id),
    INDEX idx_rth_child (child_role_id),
    CONSTRAINT fk_rth_parent FOREIGN KEY (parent_role_id) REFERENCES role_template(id) ON DELETE CASCADE,
    CONSTRAINT fk_rth_child FOREIGN KEY (child_role_id) REFERENCES role_template(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. admin_permission_override
CREATE TABLE admin_permission_override (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    granted BOOLEAN NOT NULL,
    reason TEXT NULL,
    granted_by BIGINT NULL,
    expires_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE INDEX uq_apo_user_perm (user_id, permission_id),
    INDEX idx_apo_permission (permission_id),
    CONSTRAINT fk_apo_user FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE,
    CONSTRAINT fk_apo_permission FOREIGN KEY (permission_id) REFERENCES permission(id) ON DELETE CASCADE,
    CONSTRAINT fk_apo_granted_by FOREIGN KEY (granted_by) REFERENCES user_account(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. audit_log (append-only with triggers)
CREATE TABLE audit_log (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    request_id VARCHAR(100) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_request (request_id),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Prevent UPDATE and DELETE on audit_log
DELIMITER //
CREATE TRIGGER trg_audit_log_no_update
BEFORE UPDATE ON audit_log
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'audit_log is append-only: UPDATE is not allowed';
END //

CREATE TRIGGER trg_audit_log_no_delete
BEFORE DELETE ON audit_log
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'audit_log is append-only: DELETE is not allowed';
END //
DELIMITER ;

-- 15. platform_config
CREATE TABLE platform_config (
    id BIGINT NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(200) NOT NULL,
    value TEXT NULL,
    value_type ENUM('STRING','INTEGER','BOOLEAN','JSON','ENCRYPTED') NOT NULL DEFAULT 'STRING',
    category ENUM('GENERAL','SECURITY','EMAIL','NOTIFICATION','FEATURE','PERFORMANCE') NOT NULL DEFAULT 'GENERAL',
    description TEXT NULL,
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    is_readonly BOOLEAN NOT NULL DEFAULT FALSE,
    created_by BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE INDEX uq_config_key (`key`),
    INDEX idx_config_category (category),
    CONSTRAINT fk_config_creator FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. feature_flag
CREATE TABLE feature_flag (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    rollout_percentage INT NOT NULL DEFAULT 0,
    target_audience ENUM('ALL','ADMINS','DEVELOPERS','BETA_USERS','CUSTOM') NOT NULL DEFAULT 'ALL',
    config_json JSON NULL,
    created_by BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE INDEX uq_feature_flag_code (code),
    INDEX idx_feature_flag_enabled (is_enabled),
    CONSTRAINT fk_ff_creator FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. page_layout
CREATE TABLE page_layout (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT NULL,
    template VARCHAR(100) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    meta_title VARCHAR(200) NULL,
    meta_description VARCHAR(500) NULL,
    created_by BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE INDEX uq_page_layout_slug (slug),
    INDEX idx_page_layout_active (is_active),
    CONSTRAINT fk_pl_creator FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. page_section
CREATE TABLE page_section (
    id BIGINT NOT NULL AUTO_INCREMENT,
    page_layout_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    section_type VARCHAR(50) NOT NULL,
    content JSON NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    visibility_rules JSON NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_page_section_layout (page_layout_id),
    INDEX idx_page_section_order (page_layout_id, display_order),
    CONSTRAINT fk_ps_layout FOREIGN KEY (page_layout_id) REFERENCES page_layout(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. component_library
CREATE TABLE component_library (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NULL,
    props_schema JSON NULL,
    default_props JSON NULL,
    preview_image_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    created_by BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE INDEX uq_component_slug (slug),
    INDEX idx_component_category (category),
    CONSTRAINT fk_cl_creator FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. navigation_item
CREATE TABLE navigation_item (
    id BIGINT NOT NULL AUTO_INCREMENT,
    parent_id BIGINT NULL,
    label VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    icon VARCHAR(100) NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_external BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    target_role ENUM('ALL','ADMIN','USER','DEVELOPER') NOT NULL DEFAULT 'ALL',
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_nav_parent (parent_id),
    INDEX idx_nav_order (display_order),
    INDEX idx_nav_target_role (target_role),
    CONSTRAINT fk_nav_parent FOREIGN KEY (parent_id) REFERENCES navigation_item(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. theme_config
CREATE TABLE theme_config (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    primary_color VARCHAR(20) NOT NULL,
    secondary_color VARCHAR(20) NOT NULL,
    accent_color VARCHAR(20) NULL,
    background_color VARCHAR(20) NOT NULL,
    text_color VARCHAR(20) NOT NULL,
    font_family VARCHAR(100) NOT NULL,
    font_size_base VARCHAR(10) NOT NULL DEFAULT '16px',
    border_radius VARCHAR(10) NOT NULL DEFAULT '8px',
    custom_css TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_theme_default (is_default),
    INDEX idx_theme_active (is_active),
    CONSTRAINT fk_theme_creator FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. form_builder
CREATE TABLE form_builder (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT NULL,
    fields_json JSON NOT NULL,
    validation_rules JSON NULL,
    submit_action VARCHAR(50) NOT NULL DEFAULT 'NOTIFY',
    submit_endpoint VARCHAR(500) NULL,
    success_message VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_submissions INT NULL,
    created_by BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE INDEX uq_form_slug (slug),
    INDEX idx_form_active (is_active),
    CONSTRAINT fk_form_creator FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. notification_template
CREATE TABLE notification_template (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    channel ENUM('EMAIL','SMS','PUSH','IN_APP') NOT NULL,
    subject VARCHAR(200) NULL,
    body_template TEXT NOT NULL,
    variables JSON NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE INDEX uq_notif_template_code (code),
    INDEX idx_notif_template_channel (channel),
    INDEX idx_notif_template_active (is_active),
    CONSTRAINT fk_notif_template_creator FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
