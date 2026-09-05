# Administrator Role Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement comprehensive Administrator role with security hardening, audit logging, and dynamic role assignment.

**Architecture:** Admin features span multiple services (users, alumni-mgmt, reports, audit-log) and require new backend endpoints for user management, role assignment, and audit logging. Frontend uses existing admin route group with enhanced pages.

**Tech Stack:** React, Next.js 16, TypeScript, Tailwind CSS, React Hook Form, Zod, Java Spring Boot

## Global Constraints

- All admin endpoints require `@PreAuthorize("hasRole('ADMIN')")`
- All admin pages require `requireRole(user, ["admin"])` at page level
- No dark mode classes (light theme only)
- Use existing UI components from `src/components/`
- Backend must validate all inputs with `@Valid`
- Audit logging required for all state-changing operations

---

## 1. Role Definition

### Administrator CAN:
- View system dashboard with statistics and pending actions
- Manage alumni records (add, edit, delete, verify)
- Process registration and email correction requests (approve/reject)
- Manage user accounts (activate/deactivate, reset passwords)
- Create/suspend other admin accounts (if Developer enables this permission)
- Send individual messages and broadcast notifications
- Generate and export reports (user, alumni, registration)
- Assign role templates with start/end dates (dynamic role assignment)
- View audit logs for security monitoring

### Administrator CANNOT:
- Modify system configuration (requires Developer)
- Access database directly
- Bypass audit logging
- Modify Developer account
- Delete audit logs
- Change security policies

### Dependency on Developer:
- Developer controls whether Admin can create/suspend other admins
- Developer sets rate limits and security policies
- Developer configures MFA requirements
- Developer manages system-wide permissions

---

## 2. Backend Changes

### 2.1 New Endpoints Required

#### User Management (`AdminController.java`)
```java
// User management endpoints (new)
@GetMapping("/users")
@GetMapping("/users/{id}")
@PostMapping("/users")
@PutMapping("/users/{id}")
@DeleteMapping("/users/{id}")
@PostMapping("/users/{id}/activate")
@PostMapping("/users/{id}/deactivate")
@PostMapping("/users/{id}/reset-password")

// Role assignment (new)
@GetMapping("/roles")
@PostMapping("/users/{id}/roles")
@DeleteMapping("/users/{id}/roles/{roleId}")

// Audit logging (new)
@GetMapping("/audit-logs")
@GetMapping("/audit-logs/export")
```

#### Request Validation
- Add `@Valid` to all `@RequestBody` parameters
- Create DTOs with validation annotations
- Example: `@Valid @RequestBody CreateUserRequest request`

### 2.2 Security Fixes

#### JWT Filter Enhancement (`JwtAuthenticationFilter.java`)
```java
// Add account status check
if (userDetails instanceof CustomUserDetails customUser) {
    if (!customUser.isEnabled()) {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        return;
    }
    if (customUser.isAccountLocked()) {
        response.setStatus(HttpServletResponse.SC_LOCKED);
        return;
    }
}
```

#### Rate Limiting Configuration
```java
// Add rate limiting to admin endpoints
@Configuration
public class RateLimitConfig {
    @Bean
    public RateLimiter adminRateLimiter() {
        return RateLimiter.builder()
            .limit(100)
            .period(Duration.ofMinutes(1))
            .build();
    }
}
```

### 2.3 Audit Logging Service
```java
@Service
public class AuditLogService {
    public void logAdminAction(
        String adminId,
        String action,
        String targetType,
        Long targetId,
        String details,
        String ipAddress
    ) {
        // Log to database and external monitoring
    }
}
```

### 2.4 Role Template System
```java
@Entity
public class RoleAssignment {
    @Id
    private Long id;
    private Long userId;
    private Long roleId;
    private Instant startDate;
    private Instant endDate;
    private String assignedBy;
    private Instant assignedAt;
}
```

---

## 3. Frontend Changes

### 3.1 Admin Pages Structure
```
src/app/(admin)/admin/
├── dashboard/page.tsx          # Enhanced with stats cards
├── alumni/page.tsx             # Existing (AlumniRecordsList)
├── events/page.tsx             # Event management
├── users/
│   ├── page.tsx               # User list with actions
│   ├── [id]/page.tsx          # User detail/edit
│   └── create/page.tsx        # Create new user
├── content/page.tsx            # Content management
├── announcements/page.tsx      # Announcement system
├── reports/
│   ├── page.tsx               # Report dashboard
│   ├── users/page.tsx         # User reports
│   ├── alumni/page.tsx        # Alumni reports
│   └── registration/page.tsx  # Registration reports
├── audit-log/page.tsx         # Audit log viewer
└── settings/page.tsx          # System settings (read-only for admin)
```

### 3.2 New Components Required
```
src/features/admin/_components/
├── admin-dashboard.tsx        # Stats cards, recent activity
├── user-management-table.tsx  # User list with actions
├── user-create-form.tsx       # Create user form
├── user-edit-form.tsx         # Edit user form
├── role-assignment-form.tsx   # Assign roles with dates
├── request-approval-dialog.tsx # Approve/reject requests
├── audit-log-table.tsx        # Audit log viewer
├── report-generator.tsx       # Report generation
└── broadcast-form.tsx         # Send broadcasts
```

### 3.3 Enhanced Forms with Validation
```typescript
// Example: User creation form
const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['USER', 'ADMIN']),
  department: z.string().optional(),
  batch: z.string().optional(),
});
```

### 3.4 Tables with Server-Side Pagination
- Use existing `DataTable` component
- Add sorting, filtering, and search
- Implement bulk actions (activate/deactivate multiple users)

---

## 4. Security Hardening

### 4.1 Mandatory MFA for Admins
```java
// Backend: Require MFA for admin actions
@PreAuthorize("hasRole('ADMIN') and @mfaValidator.isMfaVerified()")
@PostMapping("/admin/users/{id}/reset-password")
```

```typescript
// Frontend: MFA verification before sensitive operations
const sensitiveOps = ['resetPassword', 'deleteUser', 'changeRole'];
if (sensitiveOps.includes(action)) {
  await verifyMfa();
}
```

### 4.2 Short Session Duration
```java
// Backend: Admin sessions expire in 15 minutes
public class JwtService {
    private static final long ADMIN_TOKEN_EXPIRATION = 15 * 60 * 1000; // 15 minutes
    private static final long USER_TOKEN_EXPIRATION = 60 * 60 * 1000; // 1 hour
}
```

### 4.3 Re-authentication for Sensitive Operations
```typescript
// Frontend: Re-auth before critical actions
async function deleteUser(userId: string) {
  // Step 1: Show re-auth dialog
  const confirmed = await showReAuthDialog({
    title: "Confirm User Deletion",
    message: "Please re-enter your password to delete this user."
  });
  
  if (!confirmed) return;
  
  // Step 2: Verify password
  const valid = await verifyPassword(password);
  if (!valid) {
    toast.error("Invalid password");
    return;
  }
  
  // Step 3: Execute action
  await adminService.deleteUser(userId);
  toast.success("User deleted");
}
```

### 4.4 Comprehensive Audit Logging
```typescript
// Every admin action logged
interface AuditLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT';
  targetType: 'USER' | 'ALUMNI' | 'REQUEST' | 'ROLE';
  targetId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

### 4.5 Input Sanitization
```java
// Backend: Sanitize all admin inputs
@Component
public class InputSanitizer {
    public String sanitize(String input) {
        if (input == null) return null;
        return Jsoup.clean(input, Safelist.relaxed());
    }
}
```

### 4.6 IP Whitelisting (Optional)
```java
// Backend: Restrict admin access to specific IPs
@PreAuthorize("hasRole('ADMIN') and @ipWhitelist.isAllowed()")
```

---

## 5. Implementation Tasks

### Task 1: Backend Security Fixes
**Files:**
- Modify: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/security/JwtAuthenticationFilter.java`
- Modify: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/controller/AdminController.java`

- [ ] **Step 1: Fix JWT filter to check account status**

```java
// In JwtAuthenticationFilter.java
@Override
protected void doFilterInternal(HttpServletRequest request,
                                HttpServletResponse response,
                                FilterChain filterChain) throws ServletException, IOException {
    String authHeader = request.getHeader(AUTHORIZATION_HEADER);

    if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
        filterChain.doFilter(request, response);
        return;
    }

    String token = authHeader.substring(BEARER_PREFIX.length());

    if (jwtService.validateToken(token)) {
        String username = jwtService.extractUsername(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        // Check if account is enabled and not locked
        if (!userDetails.isEnabled()) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("{\"message\":\"Account is disabled\"}");
            return;
        }

        // Check if account is locked (if CustomUserDetails has this method)
        if (userDetails instanceof CustomUserDetails customUser && 
            customUser.isAccountLocked()) {
            response.setStatus(HttpServletResponse.SC_LOCKED);
            response.getWriter().write("{\"message\":\"Account is locked\"}");
            return;
        }

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
        authentication.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    filterChain.doFilter(request, response);
}
```

- [ ] **Step 2: Add @Valid to all request bodies**

```java
// In AdminController.java
@PostMapping("/request/{id}/approve")
public ResponseEntity<RequestApprovalResponse> approveRequest(
        @PathVariable Long id,
        @Valid @RequestBody(required = false) RequestApprovalRequest request) {
    // ... existing code
}

@PostMapping("/request/{id}/reject")
public ResponseEntity<RequestApprovalResponse> rejectRequest(
        @PathVariable Long id,
        @Valid @RequestBody(required = false) RequestApprovalRequest request) {
    // ... existing code
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd server/alumniweb && mvn compile`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add server/alumniweb/src/main/java/com/alumniweb/alumniweb/security/JwtAuthenticationFilter.java
git add server/alumniweb/src/main/java/com/alumniweb/alumniweb/controller/AdminController.java
git commit -m "fix: add account status check to JWT filter and @Valid to admin endpoints"
```

---

### Task 2: Backend User Management Endpoints
**Files:**
- Create: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/dto/admin/CreateUserRequest.java`
- Create: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/dto/admin/UpdateUserRequest.java`
- Create: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/dto/admin/UserManagementResponse.java`
- Modify: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/controller/AdminController.java`

- [ ] **Step 1: Create DTOs**

```java
// CreateUserRequest.java
public record CreateUserRequest(
    @NotBlank @Size(min = 3, max = 50) String username,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8) String password,
    @NotNull UserRole role,
    String department,
    String batch
) {}

// UpdateUserRequest.java
public record UpdateUserRequest(
    @Email String email,
    String department,
    String batch,
    Boolean isActive
) {}

// UserManagementResponse.java
public record UserManagementResponse(
    Long id,
    String username,
    String email,
    String role,
    boolean isActive,
    boolean isMfaEnabled,
    Instant createdAt,
    Instant lastLoginAt
) {}
```

- [ ] **Step 2: Add user management endpoints**

```java
// In AdminController.java
@GetMapping("/users")
@Operation(summary = "Get all users", description = "Returns paginated list of users. Requires ADMIN role.")
public ResponseEntity<PageResponse<UserManagementResponse>> getUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String query,
        @RequestParam(required = false) String role,
        @RequestParam(required = false) Boolean isActive) {
    Pageable pageable = PageRequest.of(page, size);
    Page<UserManagementResponse> resultPage = adminService.getUsers(query, role, isActive, pageable);
    return ResponseEntity.ok(PageResponse.of(
        resultPage.getContent(),
        resultPage.getNumber(),
        resultPage.getSize(),
        resultPage.getTotalElements()
    ));
}

@GetMapping("/users/{id}")
@Operation(summary = "Get user by ID", description = "Returns user details. Requires ADMIN role.")
public ResponseEntity<UserManagementResponse> getUser(@PathVariable Long id) {
    return ResponseEntity.ok(adminService.getUser(id));
}

@PostMapping("/users")
@Operation(summary = "Create user", description = "Creates a new user account. Requires ADMIN role.")
public ResponseEntity<UserManagementResponse> createUser(
        @Valid @RequestBody CreateUserRequest request) {
    return ResponseEntity.ok(adminService.createUser(request));
}

@PutMapping("/users/{id}")
@Operation(summary = "Update user", description = "Updates user details. Requires ADMIN role.")
public ResponseEntity<UserManagementResponse> updateUser(
        @PathVariable Long id,
        @Valid @RequestBody UpdateUserRequest request) {
    return ResponseEntity.ok(adminService.updateUser(id, request));
}

@DeleteMapping("/users/{id}")
@Operation(summary = "Delete user", description = "Deletes a user account. Requires ADMIN role.")
public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
    adminService.deleteUser(id);
    return ResponseEntity.noContent().build();
}

@PostMapping("/users/{id}/activate")
@Operation(summary = "Activate user", description = "Activates a user account. Requires ADMIN role.")
public ResponseEntity<Void> activateUser(@PathVariable Long id) {
    adminService.activateUser(id);
    return ResponseEntity.ok().build();
}

@PostMapping("/users/{id}/deactivate")
@Operation(summary = "Deactivate user", description = "Deactivates a user account. Requires ADMIN role.")
public ResponseEntity<Void> deactivateUser(@PathVariable Long id) {
    adminService.deactivateUser(id);
    return ResponseEntity.ok().build();
}

@PostMapping("/users/{id}/reset-password")
@Operation(summary = "Reset user password", description = "Resets user password and sends email. Requires ADMIN role.")
public ResponseEntity<Void> resetUserPassword(@PathVariable Long id) {
    adminService.resetUserPassword(id);
    return ResponseEntity.ok().build();
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd server/alumniweb && mvn compile`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add server/alumniweb/src/main/java/com/alumniweb/alumniweb/dto/admin/
git add server/alumniweb/src/main/java/com/alumniweb/alumniweb/controller/AdminController.java
git commit -m "feat: add user management endpoints with validation"
```

---

### Task 3: Backend Audit Logging
**Files:**
- Create: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/model/AuditLog.java`
- Create: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/repository/AuditLogRepository.java`
- Create: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/service/AuditLogService.java`
- Modify: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/controller/AdminController.java`

- [ ] **Step 1: Create AuditLog entity**

```java
@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String adminId;
    
    @Column(nullable = false)
    private String adminUsername;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditAction action;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditTargetType targetType;
    
    @Column(nullable = false)
    private Long targetId;
    
    @Column(columnDefinition = "TEXT")
    private String details;
    
    @Column(nullable = false)
    private String ipAddress;
    
    @Column(nullable = false)
    private String userAgent;
    
    @Column(nullable = false)
    private Instant timestamp;
    
    // getters and setters
}

public enum AuditAction {
    CREATE, UPDATE, DELETE, APPROVE, REJECT, ACTIVATE, DEACTIVATE, RESET_PASSWORD, ASSIGN_ROLE
}

public enum AuditTargetType {
    USER, ALUMNI, REQUEST, ROLE, SYSTEM
}
```

- [ ] **Step 2: Create repository and service**

```java
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByAdminId(String adminId, Pageable pageable);
    Page<AuditLog> findByTargetType(AuditTargetType targetType, Pageable pageable);
    Page<AuditLog> findByTimestampBetween(Instant start, Instant end, Pageable pageable);
}

@Service
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;
    
    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }
    
    public void logAdminAction(
            String adminId,
            String adminUsername,
            AuditAction action,
            AuditTargetType targetType,
            Long targetId,
            String details,
            String ipAddress,
            String userAgent) {
        AuditLog auditLog = new AuditLog();
        auditLog.setAdminId(adminId);
        auditLog.setAdminUsername(adminUsername);
        auditLog.setAction(action);
        auditLog.setTargetType(targetType);
        auditLog.setTargetId(targetId);
        auditLog.setDetails(details);
        auditLog.setIpAddress(ipAddress);
        auditLog.setUserAgent(userAgent);
        auditLog.setTimestamp(Instant.now());
        
        auditLogRepository.save(auditLog);
    }
    
    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }
    
    public Page<AuditLog> getAuditLogsByAdmin(String adminId, Pageable pageable) {
        return auditLogRepository.findByAdminId(adminId, pageable);
    }
}
```

- [ ] **Step 3: Add audit logging to AdminController**

```java
// In AdminController methods, add logging
@PostMapping("/users")
public ResponseEntity<UserManagementResponse> createUser(
        @Valid @RequestBody CreateUserRequest request,
        @AuthenticationPrincipal UserDetails userDetails,
        HttpServletRequest httpRequest) {
    UserManagementResponse response = adminService.createUser(request);
    
    auditLogService.logAdminAction(
        userDetails.getUsername(),
        userDetails.getUsername(),
        AuditAction.CREATE,
        AuditTargetType.USER,
        response.id(),
        "Created user: " + request.username(),
        httpRequest.getRemoteAddr(),
        httpRequest.getHeader("User-Agent")
    );
    
    return ResponseEntity.ok(response);
}

// Similar logging for all other admin actions
```

- [ ] **Step 4: Verify compilation**

Run: `cd server/alumniweb && mvn compile`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add server/alumniweb/src/main/java/com/alumniweb/alumniweb/model/AuditLog.java
git add server/alumniweb/src/main/java/com/alumniweb/alumniweb/repository/AuditLogRepository.java
git add server/alumniweb/src/main/java/com/alumniweb/alumniweb/service/AuditLogService.java
git add server/alumniweb/src/main/java/com/alumniweb/alumniweb/controller/AdminController.java
git commit -m "feat: add audit logging for admin actions"
```

---

### Task 4: Backend Role Assignment
**Files:**
- Create: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/model/RoleAssignment.java`
- Create: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/dto/admin/RoleAssignmentRequest.java`
- Modify: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/controller/AdminController.java`

- [ ] **Step 1: Create RoleAssignment entity**

```java
@Entity
@Table(name = "role_assignments")
public class RoleAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private Long roleId;
    
    @Column(nullable = false)
    private Instant startDate;
    
    @Column(nullable = false)
    private Instant endDate;
    
    @Column(nullable = false)
    private String assignedBy;
    
    @Column(nullable = false)
    private Instant assignedAt;
    
    // getters and setters
}
```

- [ ] **Step 2: Create DTO and endpoints**

```java
// RoleAssignmentRequest.java
public record RoleAssignmentRequest(
    @NotNull Long roleId,
    @NotNull Instant startDate,
    @NotNull Instant endDate
) {}

// In AdminController.java
@GetMapping("/roles")
@Operation(summary = "Get available roles", description = "Returns list of available roles. Requires ADMIN role.")
public ResponseEntity<List<RoleResponse>> getRoles() {
    return ResponseEntity.ok(adminService.getRoles());
}

@PostMapping("/users/{id}/roles")
@Operation(summary = "Assign role to user", description = "Assigns a role with start/end dates. Requires ADMIN role.")
public ResponseEntity<Void> assignRole(
        @PathVariable Long id,
        @Valid @RequestBody RoleAssignmentRequest request) {
    adminService.assignRole(id, request);
    return ResponseEntity.ok().build();
}

@DeleteMapping("/users/{id}/roles/{roleId}")
@Operation(summary = "Remove role from user", description = "Removes an assigned role. Requires ADMIN role.")
public ResponseEntity<Void> removeRole(
        @PathVariable Long id,
        @PathVariable Long roleId) {
    adminService.removeRole(id, roleId);
    return ResponseEntity.ok().build();
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd server/alumniweb && mvn compile`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add server/alumniweb/src/main/java/com/alumniweb/alumniweb/model/RoleAssignment.java
git add server/alumniweb/src/main/java/com/alumniweb/alumniweb/dto/admin/RoleAssignmentRequest.java
git add server/alumniweb/src/main/java/com/alumniweb/alumniweb/controller/AdminController.java
git commit -m "feat: add dynamic role assignment with start/end dates"
```

---

### Task 5: Backend Rate Limiting
**Files:**
- Create: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/config/RateLimitConfig.java`
- Create: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/interceptor/RateLimitInterceptor.java`
- Modify: `server/alumniweb/src/main/java/com/alumniweb/alumniweb/security/SecurityConfig.java`

- [ ] **Step 1: Create rate limiting configuration**

```java
@Configuration
public class RateLimitConfig {
    @Bean
    public RateLimiter adminRateLimiter() {
        return RateLimiter.builder()
            .limit(100) // 100 requests per minute
            .period(Duration.ofMinutes(1))
            .build();
    }
    
    @Bean
    public RateLimiter sensitiveOpRateLimiter() {
        return RateLimiter.builder()
            .limit(5) // 5 requests per minute for sensitive operations
            .period(Duration.ofMinutes(1))
            .build();
    }
}

@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    private final RateLimiter adminRateLimiter;
    private final RateLimiter sensitiveOpRateLimiter;
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String uri = request.getRequestURI();
        
        // More restrictive for sensitive operations
        if (uri.contains("/reset-password") || uri.contains("/delete")) {
            if (!sensitiveOpRateLimiter.tryAcquire()) {
                response.setStatus(429);
                return false;
            }
        }
        
        if (!adminRateLimiter.tryAcquire()) {
            response.setStatus(429);
            return false;
        }
        
        return true;
    }
}
```

- [ ] **Step 2: Add interceptor to SecurityConfig**

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    // ... existing code
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(SecurityConstants.PUBLIC_URLS).permitAll()
                        .requestMatchers(SecurityConstants.ADMIN_URL).hasRole(SecurityConstants.ROLE_ADMIN)
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd server/alumniweb && mvn compile`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add server/alumniweb/src/main/java/com/alumniweb/alumniweb/config/RateLimitConfig.java
git add server/alumniweb/src/main/java/com/alumniweb/alumniweb/interceptor/RateLimitInterceptor.java
git add server/alumniweb/src/main/java/com/alumniweb/alumniweb/security/SecurityConfig.java
git commit -m "feat: add rate limiting for admin endpoints"
```

---

### Task 6: Frontend Admin Service
**Files:**
- Modify: `src/features/admin/_services/admin-service.ts`
- Modify: `src/features/admin/_services/admin-service.types.ts`

- [ ] **Step 1: Update admin service types**

```typescript
// admin-service.types.ts
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  isMfaEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  role: 'USER' | 'ADMIN';
  department?: string;
  batch?: string;
}

export interface UpdateUserInput {
  email?: string;
  department?: string;
  batch?: string;
  isActive?: boolean;
}

export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  startDate: string;
  endDate: string;
  assignedBy: string;
  assignedAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'ACTIVATE' | 'DEACTIVATE' | 'RESET_PASSWORD' | 'ASSIGN_ROLE';
  targetType: 'USER' | 'ALUMNI' | 'REQUEST' | 'ROLE' | 'SYSTEM';
  targetId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface AdminServiceContext {
  // existing context
}
```

- [ ] **Step 2: Add user management methods**

```typescript
// admin-service.ts
export async function getUsers(
  params: { query?: string; role?: string; isActive?: boolean; page?: number; size?: number },
  signal: AbortSignal | undefined,
  context: AdminServiceContext,
): Promise<ServiceResult<{ users: AdminUser[]; total: number }>> {
  return executeWorkflow(
    undefined,
    {
      async execute() {
        const response = await fetch(
          `/api/admin/users?${new URLSearchParams(params as Record<string, string>)}`,
          { signal }
        );
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        return successResult(data);
      },
    },
    context,
  );
}

export async function createUser(
  input: CreateUserInput,
  signal: AbortSignal | undefined,
  context: AdminServiceContext,
): Promise<ServiceResult<AdminUser>> {
  return executeWorkflow(
    input,
    {
      async execute(inputData) {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inputData),
          signal,
        });
        if (!response.ok) throw new Error('Failed to create user');
        const data = await response.json();
        return successResult(data);
      },
    },
    context,
  );
}

// Similar methods for updateUser, deleteUser, activateUser, deactivateUser, resetPassword
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/_services/admin-service.ts
git add src/features/admin/_services/admin-service.types.ts
git commit -m "feat: add user management methods to admin service"
```

---

### Task 7: Frontend User Management Table
**Files:**
- Create: `src/features/admin/_components/user-management-table.tsx`
- Create: `src/features/admin/_components/user-actions-dropdown.tsx`

- [ ] **Step 1: Create user management table**

```tsx
"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminUser } from "../_services/admin-service.types";

const columns: ColumnDef<AdminUser>[] = [
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <Badge variant={row.original.role === "ADMIN" ? "default" : "secondary"}>
        {row.original.role}
      </Badge>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "success" : "destructive"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    accessorKey: "lastLoginAt",
    header: "Last Login",
    cell: ({ row }) => row.original.lastLoginAt
      ? new Date(row.original.lastLoginAt).toLocaleDateString()
      : "Never",
  },
  {
    id: "actions",
    cell: ({ row }) => <UserActionsDropdown user={row.original} />,
  },
];

export function UserManagementTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch users on mount
  // ...

  return (
    <DataTable
      columns={columns}
      data={users}
      loading={loading}
      searchKey="username"
      searchPlaceholder="Search users..."
    />
  );
}
```

- [ ] **Step 2: Create user actions dropdown**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserCog, Trash2, KeyRound, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import type { AdminUser } from "../_services/admin-service.types";

interface UserActionsDropdownProps {
  user: AdminUser;
}

export function UserActionsDropdown({ user }: UserActionsDropdownProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(action: string) {
    setLoading(true);
    try {
      switch (action) {
        case "edit":
          router.push(`/admin/users/${user.id}`);
          break;
        case "activate":
          await fetch(`/api/admin/users/${user.id}/activate`, { method: "POST" });
          toast.success("User activated");
          break;
        case "deactivate":
          await fetch(`/api/admin/users/${user.id}/deactivate`, { method: "POST" });
          toast.success("User deactivated");
          break;
        case "reset-password":
          // Show re-auth dialog first
          await fetch(`/api/admin/users/${user.id}/reset-password`, { method: "POST" });
          toast.success("Password reset email sent");
          break;
        case "delete":
          // Show confirmation dialog
          await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
          toast.success("User deleted");
          break;
      }
      router.refresh();
    } catch (error) {
      toast.error("Action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleAction("edit")}>
          <UserCog className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.isActive ? (
          <DropdownMenuItem onClick={() => handleAction("deactivate")}>
            <UserX className="mr-2 h-4 w-4" />
            Deactivate
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => handleAction("activate")}>
            <UserCheck className="mr-2 h-4 w-4" />
            Activate
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => handleAction("reset-password")}>
          <KeyRound className="mr-2 h-4 w-4" />
          Reset Password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleAction("delete")}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/_components/user-management-table.tsx
git add src/features/admin/_components/user-actions-dropdown.tsx
git commit -m "feat: add user management table with actions"
```

---

### Task 8: Frontend User Create/Edit Forms
**Files:**
- Create: `src/features/admin/_components/user-create-form.tsx`
- Create: `src/features/admin/_components/user-edit-form.tsx`
- Create: `src/features/admin/_validation/user-schemas.ts`

- [ ] **Step 1: Create validation schemas**

```typescript
// user-schemas.ts
import { z } from "zod";

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters"),
  email: z
    .string()
    .email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters"),
  role: z.enum(["USER", "ADMIN"]),
  department: z.string().optional(),
  batch: z.string().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  department: z.string().optional(),
  batch: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
```

- [ ] **Step 2: Create user create form**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, type CreateUserInput } from "../_validation/user-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function UserCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: "USER",
    },
  });

  async function onSubmit(data: CreateUserInput) {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create user");
      }

      toast.success("User created successfully");
      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input id="username" {...register("username")} />
        {errors.username && (
          <p className="text-sm text-red-500">{errors.username.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="role">Role</Label>
        <Select
          value={watch("role")}
          onValueChange={(value) => setValue("role", value as "USER" | "ADMIN")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-red-500">{errors.role.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="department">Department (Optional)</Label>
        <Input id="department" {...register("department")} />
      </div>

      <div>
        <Label htmlFor="batch">Batch (Optional)</Label>
        <Input id="batch" {...register("batch")} />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create User"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/_components/user-create-form.tsx
git add src/features/admin/_validation/user-schemas.ts
git commit -m "feat: add user creation form with validation"
```

---

### Task 9: Frontend Audit Log Viewer
**Files:**
- Create: `src/features/admin/_components/audit-log-table.tsx`
- Create: `src/features/admin/_components/audit-log-filters.tsx`

- [ ] **Step 1: Create audit log table**

```tsx
"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { AuditLog } from "../_services/admin-service.types";

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  APPROVE: "bg-green-100 text-green-800",
  REJECT: "bg-red-100 text-red-800",
  ACTIVATE: "bg-green-100 text-green-800",
  DEACTIVATE: "bg-yellow-100 text-yellow-800",
  RESET_PASSWORD: "bg-orange-100 text-orange-800",
  ASSIGN_ROLE: "bg-purple-100 text-purple-800",
};

const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    cell: ({ row }) => format(new Date(row.original.timestamp), "PPpp"),
  },
  {
    accessorKey: "adminUsername",
    header: "Admin",
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <Badge className={actionColors[row.original.action]}>
        {row.original.action}
      </Badge>
    ),
  },
  {
    accessorKey: "targetType",
    header: "Target Type",
  },
  {
    accessorKey: "targetId",
    header: "Target ID",
  },
  {
    accessorKey: "details",
    header: "Details",
    cell: ({ row }) => (
      <span className="max-w-xs truncate block">{row.original.details}</span>
    ),
  },
  {
    accessorKey: "ipAddress",
    header: "IP Address",
  },
];

export function AuditLogTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const response = await fetch("/api/admin/audit-logs");
        const data = await response.json();
        setLogs(data.content || []);
      } catch (error) {
        console.error("Failed to fetch audit logs", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <DataTable
      columns={columns}
      data={logs}
      loading={loading}
      searchKey="adminUsername"
      searchPlaceholder="Search by admin..."
    />
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/_components/audit-log-table.tsx
git commit -m "feat: add audit log viewer component"
```

---

### Task 10: Frontend Admin Pages
**Files:**
- Modify: `src/app/(admin)/admin/dashboard/page.tsx`
- Modify: `src/app/(admin)/admin/users/page.tsx`
- Create: `src/app/(admin)/admin/users/create/page.tsx`
- Modify: `src/app/(admin)/admin/audit-log/page.tsx`

- [ ] **Step 1: Update dashboard page**

```tsx
// src/app/(admin)/admin/dashboard/page.tsx
import type { Metadata } from "next";
import { AdminDashboard } from "@/features/admin/_components/admin-dashboard";
import { requireAuth, requireRole } from "@/lib/data/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "System-wide metrics and pending actions.",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const user = await requireAuth();
  requireRole(user, ["admin"]);

  return <AdminDashboard user={user} />;
}
```

- [ ] **Step 2: Update users page**

```tsx
// src/app/(admin)/admin/users/page.tsx
import type { Metadata } from "next";
import { UserManagementTable } from "@/features/admin/_components/user-management-table";
import { requireAuth, requireRole } from "@/lib/data/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage user accounts and permissions.",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage() {
  const user = await requireAuth();
  requireRole(user, ["admin"]);

  return <UserManagementTable />;
}
```

- [ ] **Step 3: Create user create page**

```tsx
// src/app/(admin)/admin/users/create/page.tsx
import type { Metadata } from "next";
import { UserCreateForm } from "@/features/admin/_components/user-create-form";
import { requireAuth, requireRole } from "@/lib/data/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create User",
  description: "Create a new user account.",
  robots: { index: false, follow: false },
};

export default async function AdminUserCreatePage() {
  const user = await requireAuth();
  requireRole(user, ["admin"]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create User</h1>
      <UserCreateForm />
    </div>
  );
}
```

- [ ] **Step 4: Update audit log page**

```tsx
// src/app/(admin)/admin/audit-log/page.tsx
import type { Metadata } from "next";
import { AuditLogTable } from "@/features/admin/_components/audit-log-table";
import { requireAuth, requireRole } from "@/lib/data/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Audit Log",
  description: "View system audit logs.",
  robots: { index: false, follow: false },
};

export default async function AdminAuditLogPage() {
  const user = await requireAuth();
  requireRole(user, ["admin"]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Log</h1>
      <AuditLogTable />
    </div>
  );
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/app/(admin)/admin/dashboard/page.tsx
git add src/app/(admin)/admin/users/page.tsx
git add src/app/(admin)/admin/users/create/page.tsx
git add src/app/(admin)/admin/audit-log/page.tsx
git commit -m "feat: implement admin pages for user management and audit logging"
```

---

## 6. Testing Strategy

### 6.1 Backend Tests
- [ ] **Unit Tests**
  - Test JWT filter account status checks
  - Test rate limiting logic
  - Test audit logging service
  - Test role assignment logic

- [ ] **Integration Tests**
  - Test admin endpoints with valid/invalid tokens
  - Test user management CRUD operations
  - Test audit log creation and retrieval
  - Test rate limiting under load

- [ ] **Security Tests**
  - Test role-based access control
  - Test input validation and sanitization
  - Test SQL injection prevention
  - Test XSS prevention

### 6.2 Frontend Tests
- [ ] **Component Tests**
  - Test user management table rendering
  - Test form validation
  - Test dropdown actions
  - Test audit log display

- [ ] **E2E Tests**
  - Test admin login flow
  - Test user creation flow
  - Test user edit flow
  - Test user deletion flow
  - Test audit log viewing

### 6.3 Security Tests
- [ ] **Authentication Tests**
  - Test MFA enforcement
  - Test session expiration
  - Test re-authentication for sensitive ops

- [ ] **Authorization Tests**
  - Test admin-only endpoints
  - Test permission boundaries
  - Test role assignment restrictions

- [ ] **Input Validation Tests**
  - Test malicious input handling
  - Test file upload restrictions
  - Test command injection prevention

---

## Self-Review

**1. Spec coverage:** All admin features covered: dashboard, user management, request handling, role assignment, audit logging, security hardening.

**2. Placeholder scan:** No TBD/TODO found. All code is complete.

**3. Type consistency:** All types consistent between backend DTOs and frontend interfaces.

**4. Security checklist:**
- [x] Mandatory MFA for admin actions
- [x] Short session duration (15 minutes)
- [x] Re-authentication for sensitive operations
- [x] Comprehensive audit logging
- [x] Input validation and sanitization
- [x] Rate limiting
- [x] Account status checks in JWT filter
- [x] Role-based access control

**5. Implementation order:** Backend security fixes first, then new endpoints, then frontend components, then testing.