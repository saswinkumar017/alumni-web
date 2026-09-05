package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.developer.AuditLogDetailResponse;
import com.alumniweb.alumniweb.dto.developer.AuditLogResponse;
import com.alumniweb.alumniweb.dto.developer.AuditStatsResponse;
import com.alumniweb.alumniweb.model.enums.AuditCategory;
import com.alumniweb.alumniweb.model.enums.AuditLogLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface DeveloperAuditService {
    Page<AuditLogResponse> queryLogs(Long userId, String action, String entityType,
                                     AuditCategory category, AuditLogLevel logLevel, String method,
                                     LocalDateTime from, LocalDateTime to, Pageable pageable);
    AuditLogDetailResponse getDetail(Long id);
    AuditStatsResponse getStats();
    byte[] exportLogs(AuditCategory category, String action, LocalDateTime from, LocalDateTime to, String format);
}
