export interface PlatformConfig {
  id?: number;
  key: string;
  value: string;
  valueType?: string;
  category?: string;
  description?: string;
  isSensitive?: boolean;
  isReadonly?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeatureFlag {
  id: number;
  code: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  rolloutPercentage?: number;
  targetAudience?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleTemplate {
  id: number;
  name: string;
  code: string;
  description?: string;
  isSystem?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type PermissionCategory = string;

export interface Permission {
  id: number;
  name: string;
  code: string;
  description?: string;
  group?: { id: number; name: string; category?: { id: number; name: string; code: string } };
  action?: string;
  resource?: string;
  riskLevel?: string;
  createdAt?: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  fullName?: string;
  role: string;
  accountStatus?: string;
  emailVerified?: boolean;
  masterAlumni?: {
    name?: string;
    department?: string;
    batch?: string;
    email?: string;
    phone?: string;
  };
  createdAt?: string;
  lastLogin?: string;
}

export interface AuditLog {
  id: number;
  userId?: number;
  username?: string;
  action: string;
  entityType?: string;
  entityId?: number;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  category?: string;
  logLevel?: string;
  method?: string;
  endpoint?: string;
  statusCode?: number;
  durationMs?: number;
  requestParams?: string;
  responseSummary?: string;
  createdAt: string;
}

export interface AuditStats {
  totalEvents: number;
  eventsToday: number;
  errorCount: number;
  avgDurationMs: number;
  eventsByAction: Record<string, number>;
  eventsByEntity: Record<string, number>;
  eventsByCategory: Record<string, number>;
}

export interface MonitoringData {
  status?: string;
  totalUsers?: number;
  memoryUsedMB?: number;
  memoryMaxMB?: number;
  uptimeMs?: number;
  processors?: number;
  activeSessions?: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page?: number;
  size?: number;
  first?: boolean;
  last?: boolean;
}
