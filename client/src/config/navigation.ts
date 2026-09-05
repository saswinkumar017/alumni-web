export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  activePattern: string;
  children?: NavItem[];
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const publicNavigation: NavItem[] = [
  { label: "Home", href: "/", activePattern: "^/$" },
  { label: "About", href: "/about", activePattern: "^/about" },
  { label: "Directory", href: "/directory", activePattern: "^/directory" },
  { label: "Events", href: "/events", activePattern: "^/events" },
  { label: "FAQ", href: "/faq", activePattern: "^/faq" },
  { label: "Contact", href: "/contact", activePattern: "^/contact" },
];

export const alumniNavigation: NavGroup[] = [
  {
    group: "Main",
    items: [
      { label: "Dashboard", href: "/alumni/dashboard", activePattern: "^/alumni/dashboard" },
      { label: "Profile", href: "/alumni/profile", activePattern: "^/alumni/profile" },
      { label: "Networking", href: "/alumni/networking", activePattern: "^/alumni/networking" },
      { label: "Community", href: "/alumni/community", activePattern: "^/alumni/community" },
      { label: "Messages", href: "/alumni/messages", activePattern: "^/alumni/messages" },
    ],
  },
  {
    group: "Giving",
    items: [
      { label: "Donations", href: "/alumni/donations", activePattern: "^/alumni/donations" },
    ],
  },
  {
    group: "Account",
    items: [{ label: "Settings", href: "/alumni/settings", activePattern: "^/alumni/settings" }],
  },
];

export const adminNavigation: NavGroup[] = [
  {
    group: "Main",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", activePattern: "^/admin/dashboard" },
      { label: "Alumni", href: "/admin/alumni", activePattern: "^/admin/alumni" },
      { label: "Requests", href: "/admin/requests", activePattern: "^/admin/requests" },
      { label: "Users", href: "/admin/users", activePattern: "^/admin/users" },
    ],
  },
  {
    group: "Communications",
    items: [
      {
        label: "Announcements",
        href: "/admin/announcements",
        activePattern: "^/admin/announcements",
      },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Reports", href: "/admin/reports", activePattern: "^/admin/reports" },
      { label: "Audit Log", href: "/admin/audit-log", activePattern: "^/admin/audit-log" },
    ],
  },
];

export const developerNavigation: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/developer", activePattern: "^/developer$" },
      { label: "Monitoring", href: "/developer/monitoring", activePattern: "^/developer/monitoring" },
    ],
  },
  {
    group: "Platform",
    items: [
      { label: "Configuration", href: "/developer/platform/config", activePattern: "^/developer/platform/config" },
      { label: "Branding", href: "/developer/platform/branding", activePattern: "^/developer/platform/branding" },
      { label: "Feature Flags", href: "/developer/platform/feature-flags", activePattern: "^/developer/platform/feature-flags" },
      { label: "Maintenance", href: "/developer/platform/maintenance", activePattern: "^/developer/platform/maintenance" },
    ],
  },
  {
    group: "Security",
    items: [
      { label: "Auth Policies", href: "/developer/auth/policies", activePattern: "^/developer/auth/policies" },
      { label: "API Keys", href: "/developer/auth/api-keys", activePattern: "^/developer/auth/api-keys" },
      { label: "MFA Settings", href: "/developer/auth/mfa", activePattern: "^/developer/auth/mfa" },
      { label: "OTP Settings", href: "/developer/otp", activePattern: "^/developer/otp" },
      { label: "Email Templates", href: "/developer/email-templates", activePattern: "^/developer/email-templates" },
    ],
  },
  {
    group: "RBAC",
    items: [
      { label: "Roles", href: "/developer/rbac/roles", activePattern: "^/developer/rbac/roles" },
      { label: "Permissions", href: "/developer/rbac/permissions", activePattern: "^/developer/rbac/permissions" },
      { label: "Admin Overrides", href: "/developer/rbac/admin-overrides", activePattern: "^/developer/rbac/admin-overrides" },
    ],
  },
  {
    group: "Users",
    items: [
      { label: "All Users", href: "/developer/users", activePattern: "^/developer/users" },
      { label: "Sessions", href: "/developer/sessions", activePattern: "^/developer/sessions" },
    ],
  },
  {
    group: "Observability",
    items: [
      { label: "Audit Logs", href: "/developer/audit", activePattern: "^/developer/audit" },
    ],
  },
];
