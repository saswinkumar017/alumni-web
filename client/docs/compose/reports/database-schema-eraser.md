# Database Schema — Eraser.io DSL

Paste this into eraser.io to visualize the complete database schema.

```dsl
# JJCET Alumni Web — Complete Database Schema
# Paste into eraser.io

# ============================================
# EXISTING TABLES
# ============================================

user_account {
  id long pk auto_increment
  version long
  master_alumni_id long fk
  username varchar_100 unique
  password_hash varchar_255
  role enum_ADMIN_USER_DEVELOPER
  email_verified boolean
  account_status enum_ACTIVE_INACTIVE_LOCKED_SUSPENDED_PENDING_VERIFICATION
  last_login timestamp
  deleted boolean
  deleted_at timestamp
  created_at timestamp
  updated_at timestamp
}

master_alumni {
  id long pk auto_increment
  version long
  register_number varchar_50 unique
  name varchar_150
  department varchar_100
  degree varchar_100
  batch varchar_50
  year_of_passing int
  email varchar_255
  phone varchar_20
  dob date
  gender enum_MALE_FEMALE_OTHER
  address varchar_500
  company varchar_200
  designation varchar_200
  profession varchar_200
  marital_status enum
  availability enum
  feedback text
  current_status enum
  deleted boolean
  deleted_at timestamp
  created_at timestamp
  updated_at timestamp
}

alumni_request {
  id long pk auto_increment
  version long
  master_alumni_id long fk
  request_type enum_EMAIL_CORRECTION_NEW_ALUMNI
  status enum_PENDING_APPROVED_REJECTED
  submitted_at timestamp
  resolved_at timestamp
  admin_notes text
  requester_email varchar_255
  payload text
  deleted boolean
  deleted_at timestamp
  updated_at timestamp
}

verification_token {
  id long pk auto_increment
  token varchar_64 unique
  user_id long
  email varchar_255
  purpose varchar_50
  issued_at timestamp
  expires_at timestamp
  used boolean
}

# ============================================
# NEW TABLES (Developer Role)
# ============================================

mfa_enrollment {
  id long pk auto_increment
  user_id long fk
  method enum_TOTP_WEBAUTHN_SMS
  label varchar_100
  secret varchar_255
  public_key text
  is_primary boolean
  is_active boolean
  last_used_at timestamp
  enrollment_ip varchar_45
  enrollment_user_agent text
  created_at timestamp
}

trusted_device {
  id long pk auto_increment
  user_id long fk
  device_fingerprint varchar_255
  device_name varchar_200
  ip_address varchar_45
  user_agent text
  trusted_at timestamp
  expires_at timestamp
  revoked_at timestamp
  created_at timestamp
}

app_session {
  id long pk auto_increment
  user_id long fk
  session_token varchar_255
  refresh_token varchar_255
  ip_address varchar_45
  user_agent text
  device_fingerprint varchar_255
  expires_at timestamp
  refresh_expires_at timestamp
  revoked boolean
  revoked_at timestamp
  created_at timestamp
  updated_at timestamp
}

login_event {
  id long pk auto_increment
  user_id long fk nullable
  username_attempted varchar_100
  status enum_SUCCESS_FAILED_PASSWORD_FAILED_MFA_FAILED_LOCKED_FAILED_DISABLED
  ip_address varchar_45
  user_agent text
  location varchar_200
  mfa_method varchar_50
  failure_reason text
  created_at timestamp
}

api_key {
  id long pk auto_increment
  user_id long fk
  name varchar_200
  key_prefix varchar_10
  key_hash varchar_255
  permissions json
  rate_limit int
  is_active boolean
  last_used_at timestamp
  expires_at timestamp
  created_at timestamp
}

role_template {
  id long pk auto_increment
  name varchar_100
  code varchar_50 unique
  description text
  is_system boolean
  is_active boolean
  created_by long fk nullable
  created_at timestamp
  updated_at timestamp
}

permission_category {
  id long pk auto_increment
  name varchar_100
  code varchar_50 unique
  description text
  display_order int
  created_at timestamp
  updated_at timestamp
}

permission_group {
  id long pk auto_increment
  category_id long fk
  name varchar_200
  display_order int
  created_at timestamp
  updated_at timestamp
}

permission {
  id long pk auto_increment
  group_id long fk
  name varchar_100
  code varchar_100 unique
  description text
  action varchar_50
  resource varchar_100
  risk_level enum_LOW_MEDIUM_HIGH_CRITICAL
  created_at timestamp
  updated_at timestamp
}

role_template_permission {
  role_template_id long fk
  permission_id long fk
  granted boolean
  created_at timestamp
  pk role_template_id permission_id
}

role_template_hierarchy {
  parent_role_template_id long fk
  child_role_template_id long fk
  pk parent_role_template_id child_role_template_id
}

admin_permission_override {
  id long pk auto_increment
  user_id long fk
  permission_id long fk
  granted boolean
  reason text
  expires_at timestamp nullable
  created_by long fk nullable
  created_at timestamp
  updated_at timestamp
}

audit_log {
  id long pk auto_increment
  timestamp timestamp
  user_id long fk nullable
  action varchar_100
  entity_type varchar_100
  entity_id long
  old_values text
  new_values text
  ip_address varchar_45
  user_agent text
  request_id varchar_100
  risk_level enum_LOW_MEDIUM_HIGH_CRITICAL
  created_at timestamp
}

platform_config {
  id long pk auto_increment
  key varchar_200 unique
  value text
  value_type enum_STRING_NUMBER_BOOLEAN_JSON_COLOR
  category enum_GENERAL_SECURITY_EMAIL_NOTIFICATION_FEATURE_PERFORMANCE
  description text
  is_sensitive boolean
  is_readonly boolean
  created_by long fk nullable
  created_at timestamp
  updated_at timestamp
}

feature_flag {
  id long pk auto_increment
  name varchar_100
  code varchar_100 unique
  description text
  is_enabled boolean
  rollout_percentage int
  target_audience enum_ALL_ADMINS_ONLY_SPECIFIC_USERS_PERCENTAGE
  config_json json
  created_by long fk nullable
  created_at timestamp
  updated_at timestamp
}

page_layout {
  id long pk auto_increment
  slug varchar_200 unique
  title varchar_300
  layout_config json
  is_published boolean
  published_at timestamp nullable
  created_by long fk nullable
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp nullable
}

page_section {
  id long pk auto_increment
  page_layout_id long fk
  component_key varchar_200
  title varchar_300
  props json
  sort_order int
  is_visible boolean
  created_at timestamp
  updated_at timestamp
}

component_library {
  id long pk auto_increment
  component_key varchar_200 unique
  name varchar_200
  description text
  category varchar_100
  schema_json json
  default_props json
  is_active boolean
  created_at timestamp
}

navigation_item {
  id long pk auto_increment
  menu_key varchar_100
  parent_id long fk nullable
  label varchar_200
  url varchar_500
  icon varchar_100
  sort_order int
  is_visible boolean
  required_role varchar_50
  permissions_required json
  open_in_new_tab boolean
  created_at timestamp
  updated_at timestamp
}

theme_config {
  id long pk auto_increment
  name varchar_100
  colors json
  typography json
  spacing json
  border_radius json
  is_active boolean
  created_at timestamp
  updated_at timestamp
}

form_builder {
  id long pk auto_increment
  form_key varchar_150 unique
  name varchar_200
  fields json
  submit_action json
  validation_rules json
  is_active boolean
  created_by long fk nullable
  created_at timestamp
  updated_at timestamp
}

notification_template {
  id long pk auto_increment
  template_key varchar_150 unique
  name varchar_200
  channel enum_EMAIL_IN_APP_SMS_PUSH
  subject varchar_500
  body_template text
  variables json
  is_active boolean
  created_at timestamp
  updated_at timestamp
}

# ============================================
# RELATIONSHIPS
# ============================================

user_account ||--o| master_alumni : "has profile"
user_account ||--o{ mfa_enrollment : "has MFA devices"
user_account ||--o{ trusted_device : "has trusted devices"
user_account ||--o{ app_session : "has sessions"
user_account ||--o{ login_event : "login history"
user_account ||--o{ api_key : "owns API keys"
user_account ||--o{ audit_log : "audit trail"
user_account ||--o{ admin_permission_override : "permission overrides"
user_account ||--o| role_template : "created role templates"

permission_category ||--o{ permission_group : "contains groups"
permission_group ||--o{ permission : "contains permissions"
role_template ||--o{ role_template_permission : "has permissions"
permission ||--o{ role_template_permission : "assigned to roles"
role_template ||--o{ role_template_hierarchy : "parent of"
role_template ||--o{ role_template_hierarchy : "child of"

page_layout ||--o{ page_section : "has sections"
navigation_item ||--o{ navigation_item : "parent-child"

master_alumni ||--o{ alumni_request : "has requests"
user_account ||--o{ verification_token : "verification tokens"
```
