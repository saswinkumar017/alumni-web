package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.common.ApiResponse;
import com.alumniweb.alumniweb.dto.common.PageResponse;
import com.alumniweb.alumniweb.dto.developer.AuditLogDetailResponse;
import com.alumniweb.alumniweb.dto.developer.AuditLogResponse;
import com.alumniweb.alumniweb.dto.developer.AuditStatsResponse;
import com.alumniweb.alumniweb.model.enums.AuditCategory;
import com.alumniweb.alumniweb.model.enums.AuditLogLevel;
import com.alumniweb.alumniweb.security.SecurityConstants;
import com.alumniweb.alumniweb.service.DeveloperAuditService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/developer/audit")
@PreAuthorize("hasRole('" + SecurityConstants.ROLE_DEVELOPER + "')")
public class DeveloperAuditController {

    private final DeveloperAuditService developerAuditService;

    public DeveloperAuditController(DeveloperAuditService developerAuditService) {
        this.developerAuditService = developerAuditService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<AuditLogResponse>> queryLogs(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) AuditCategory category,
            @RequestParam(required = false) AuditLogLevel logLevel,
            @RequestParam(required = false) String method,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        LocalDateTime fromDate = from != null ? LocalDateTime.parse(from, formatter) : null;
        LocalDateTime toDate = to != null ? LocalDateTime.parse(to, formatter) : null;

        Page<AuditLogResponse> resultPage = developerAuditService.queryLogs(
                userId, action, entityType, category, logLevel, method,
                fromDate, toDate, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(PageResponse.of(
                resultPage.getContent(),
                resultPage.getNumber(),
                resultPage.getSize(),
                resultPage.getTotalElements()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AuditLogDetailResponse>> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(developerAuditService.getDetail(id)));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AuditStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(developerAuditService.getStats()));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportLogs(
            @RequestParam(required = false) AuditCategory category,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "csv") String format) {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        LocalDateTime fromDate = from != null ? LocalDateTime.parse(from, formatter) : null;
        LocalDateTime toDate = to != null ? LocalDateTime.parse(to, formatter) : null;

        byte[] data = developerAuditService.exportLogs(category, action, fromDate, toDate, format);

        String filename = "audit-logs." + ("json".equalsIgnoreCase(format) ? "json" : "csv");
        String contentType = "json".equalsIgnoreCase(format) ? "application/json" : "text/csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(data);
    }
}
