package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.admin.AdminDashboardResponse;
import com.alumniweb.alumniweb.dto.admin.PendingRequestResponse;
import com.alumniweb.alumniweb.dto.admin.RequestApprovalRequest;
import com.alumniweb.alumniweb.dto.admin.RequestApprovalResponse;
import com.alumniweb.alumniweb.dto.common.PageResponse;
import com.alumniweb.alumniweb.dto.search.AlumniSummaryResponse;
import com.alumniweb.alumniweb.model.AuditLog;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.enums.AuditCategory;
import com.alumniweb.alumniweb.model.enums.AuditLogLevel;
import com.alumniweb.alumniweb.model.enums.RequestStatus;
import com.alumniweb.alumniweb.model.enums.RequestType;
import com.alumniweb.alumniweb.model.repository.AuditLogRepository;
import com.alumniweb.alumniweb.security.SecurityConstants;
import com.alumniweb.alumniweb.service.AdminService;
import com.alumniweb.alumniweb.service.AuditEventPublisher;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.ArrayList;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('" + SecurityConstants.ROLE_ADMIN + "')")
public class AdminController {

    private final AdminService adminService;
    private final AuditLogRepository auditLogRepository;
    private final AuditEventPublisher auditEventPublisher;

    public AdminController(AdminService adminService, AuditLogRepository auditLogRepository, AuditEventPublisher auditEventPublisher) {
        this.adminService = adminService;
        this.auditLogRepository = auditLogRepository;
        this.auditEventPublisher = auditEventPublisher;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboard());
    }

    @GetMapping("/requests")
    public ResponseEntity<PageResponse<PendingRequestResponse>> getRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) RequestType type,
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(required = false) String query) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PendingRequestResponse> resultPage = (type != null || status != null || query != null)
                ? adminService.getFilteredRequests(type, status, query, pageable)
                : adminService.getPendingRequests(pageable);
        return ResponseEntity.ok(PageResponse.of(
                resultPage.getContent(), resultPage.getNumber(), resultPage.getSize(), resultPage.getTotalElements()));
    }

    @GetMapping("/request/{id}")
    public ResponseEntity<PendingRequestResponse> getRequest(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getRequest(id));
    }

    @PostMapping("/request/{id}/approve")
    public ResponseEntity<RequestApprovalResponse> approveRequest(
            @PathVariable Long id,
            @RequestBody(required = false) RequestApprovalRequest request) {
        String notes = request != null ? request.adminNotes() : null;
        return ResponseEntity.ok(adminService.processRequest(new RequestApprovalRequest(id, RequestStatus.APPROVED, notes)));
    }

    @PostMapping("/request/{id}/reject")
    public ResponseEntity<RequestApprovalResponse> rejectRequest(
            @PathVariable Long id,
            @RequestBody(required = false) RequestApprovalRequest request) {
        String notes = request != null ? request.adminNotes() : null;
        return ResponseEntity.ok(adminService.processRequest(new RequestApprovalRequest(id, RequestStatus.REJECTED, notes)));
    }

    @GetMapping("/alumni")
    public ResponseEntity<PageResponse<AlumniSummaryResponse>> searchAlumni(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String batch,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<AlumniSummaryResponse> resultPage = adminService.searchAlumni(query, department, batch, PageRequest.of(page, size));
        return ResponseEntity.ok(PageResponse.of(
                resultPage.getContent(), resultPage.getNumber(), resultPage.getSize(), resultPage.getTotalElements()));
    }

    // ---- Admin-specific User Management ----

    @GetMapping("/users")
    public ResponseEntity<PageResponse<User>> listUsers(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<User> resultPage = adminService.listUsers(query, PageRequest.of(page, size));
        return ResponseEntity.ok(PageResponse.of(
                resultPage.getContent(), resultPage.getNumber(), resultPage.getSize(), resultPage.getTotalElements()));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUser(id));
    }

    @PostMapping("/users/{id}/suspend")
    public ResponseEntity<Map<String, String>> suspendUser(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "Suspended by admin") : "Suspended by admin";
        adminService.suspendUser(id, reason);
        return ResponseEntity.ok(Map.of("message", "User suspended", "status", "suspended"));
    }

    @PostMapping("/users/{id}/activate")
    public ResponseEntity<Map<String, String>> activateUser(@PathVariable Long id) {
        adminService.activateUser(id);
        return ResponseEntity.ok(Map.of("message", "User activated", "status", "active"));
    }

    // ---- Admin-specific Audit Log ----

    @GetMapping("/audit")
    public ResponseEntity<PageResponse<AuditLog>> queryAuditLogs(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String logLevel,
            @RequestParam(required = false) String method,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Specification<AuditLog> spec = (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();
            if (userId != null) predicates.add(cb.equal(root.get("user").get("id"), userId));
            if (category != null && !category.isBlank())
                predicates.add(cb.equal(root.get("category"), AuditCategory.valueOf(category)));
            if (logLevel != null && !logLevel.isBlank())
                predicates.add(cb.equal(root.get("logLevel"), AuditLogLevel.valueOf(logLevel)));
            if (method != null && !method.isBlank())
                predicates.add(cb.equal(root.get("method"), method.toUpperCase()));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<AuditLog> resultPage = auditLogRepository.findAll(spec, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(PageResponse.of(
                resultPage.getContent(), resultPage.getNumber(), resultPage.getSize(), resultPage.getTotalElements()));
    }

    @GetMapping("/audit/stats")
    public ResponseEntity<Map<String, Object>> getAuditStats() {
        long total = auditLogRepository.count();
        long errors = auditLogRepository.countByLogLevel(AuditLogLevel.ERROR)
                + auditLogRepository.countByLogLevel(AuditLogLevel.CRITICAL);
        return ResponseEntity.ok(Map.of("totalEvents", total, "errorCount", errors));
    }

    // ---- Admin-specific SSE Stream ----

    @GetMapping(value = "/audit/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter auditStream() {
        return auditEventPublisher.subscribe();
    }
}
