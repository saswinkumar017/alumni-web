package com.alumniweb.alumniweb.service.impl;

import com.alumniweb.alumniweb.dto.developer.AuditLogResponse;
import com.alumniweb.alumniweb.dto.developer.AuditLogDetailResponse;
import com.alumniweb.alumniweb.dto.developer.AuditStatsResponse;
import com.alumniweb.alumniweb.model.AuditLog;
import com.alumniweb.alumniweb.model.enums.AuditCategory;
import com.alumniweb.alumniweb.model.enums.AuditLogLevel;
import com.alumniweb.alumniweb.model.repository.AuditLogRepository;
import com.alumniweb.alumniweb.service.DeveloperAuditService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeveloperAuditServiceImpl implements DeveloperAuditService {

    private final AuditLogRepository auditLogRepository;

    @Override
    public Page<AuditLogResponse> queryLogs(Long userId, String action, String entityType,
                                            AuditCategory category, AuditLogLevel logLevel, String method,
                                            LocalDateTime from, LocalDateTime to, Pageable pageable) {
        Specification<AuditLog> spec = buildSpec(userId, action, entityType, category, logLevel, method, from, to);
        // Ensure newest-first ordering
        Pageable sorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        return auditLogRepository.findAll(spec, sorted).map(this::toResponse);
    }

    private Specification<AuditLog> buildSpec(Long userId, String action, String entityType,
                                              AuditCategory category, AuditLogLevel logLevel, String method,
                                              LocalDateTime from, LocalDateTime to) {
        return (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();

            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (action != null && !action.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("action")), "%" + action.toLowerCase() + "%"));
            }
            if (entityType != null && !entityType.isBlank()) {
                predicates.add(cb.equal(root.get("entityType"), entityType));
            }
            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            if (logLevel != null) {
                predicates.add(cb.equal(root.get("logLevel"), logLevel));
            }
            if (method != null && !method.isBlank()) {
                predicates.add(cb.equal(root.get("method"), method.toUpperCase()));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @Override
    public AuditLogDetailResponse getDetail(Long id) {
        AuditLog log = auditLogRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Audit log not found with id: " + id));
        return toDetailResponse(log);
    }

    @Override
    public AuditStatsResponse getStats() {
        long totalEvents = auditLogRepository.count();

        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = LocalDateTime.now().toLocalDate().atTime(23, 59, 59);
        long eventsToday = auditLogRepository.findByCreatedAtBetween(startOfDay, endOfDay, PageRequest.of(0, 1)).getTotalElements();

        long errorCount = auditLogRepository.countByLogLevel(AuditLogLevel.ERROR)
                + auditLogRepository.countByLogLevel(AuditLogLevel.CRITICAL);

        double avgDurationMs = auditLogRepository.avgDurationMs();

        Map<String, Long> eventsByAction = auditLogRepository.countByActionGrouped().stream()
                .collect(java.util.stream.Collectors.toMap(
                        row -> (String) row[0], row -> (Long) row[1], (a, b) -> a, java.util.LinkedHashMap::new));

        Map<String, Long> eventsByEntity = auditLogRepository.countByEntityTypeGrouped().stream()
                .collect(java.util.stream.Collectors.toMap(
                        row -> (String) row[0], row -> (Long) row[1], (a, b) -> a, java.util.LinkedHashMap::new));

        Map<String, Long> eventsByCategory = auditLogRepository.countByCategoryGrouped().stream()
                .collect(java.util.stream.Collectors.toMap(
                        row -> (String) row[0], row -> (Long) row[1], (a, b) -> a, java.util.LinkedHashMap::new));

        return new AuditStatsResponse(
                totalEvents,
                eventsToday,
                eventsByAction,
                eventsByEntity,
                errorCount,
                avgDurationMs,
                eventsByCategory
        );
    }

    @Override
    public byte[] exportLogs(AuditCategory category, String action, LocalDateTime from, LocalDateTime to, String format) {
        Specification<AuditLog> spec = buildSpec(null, action, null, category, null, null, from, to);
        Pageable unlimited = PageRequest.of(0, 10000);
        Page<AuditLog> logs = auditLogRepository.findAll(spec, unlimited);

        if ("json".equalsIgnoreCase(format)) {
            return exportAsJson(logs.getContent());
        }
        return exportAsCsv(logs.getContent());
    }

    private byte[] exportAsCsv(java.util.List<AuditLog> logs) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8));

        writer.println("id,userId,username,action,entityType,entityId,category,logLevel,method,endpoint,statusCode,durationMs,ipAddress,userAgent,requestId,createdAt");

        for (AuditLog log : logs) {
            writer.println(String.format("%d,%d,%s,%s,%s,%d,%s,%s,%s,%s,%d,%d,%s,%s,%s,%s",
                    log.getId(),
                    log.getUser() != null ? log.getUser().getId() : "",
                    escapeCsv(log.getUser() != null ? log.getUser().getUsername() : ""),
                    escapeCsv(log.getAction()),
                    escapeCsv(log.getEntityType()),
                    log.getEntityId() != null ? log.getEntityId() : "",
                    log.getCategory() != null ? log.getCategory().name() : "",
                    log.getLogLevel() != null ? log.getLogLevel().name() : "",
                    escapeCsv(log.getMethod()),
                    escapeCsv(log.getEndpoint()),
                    log.getStatusCode() != null ? log.getStatusCode() : "",
                    log.getDurationMs() != null ? log.getDurationMs() : "",
                    escapeCsv(log.getIpAddress()),
                    escapeCsv(log.getUserAgent()),
                    escapeCsv(log.getRequestId()),
                    log.getCreatedAt() != null ? log.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : ""
            ));
        }

        writer.flush();
        return baos.toByteArray();
    }

    private byte[] exportAsJson(java.util.List<AuditLog> logs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < logs.size(); i++) {
            AuditLog log = logs.get(i);
            sb.append("{");
            sb.append("\"id\":").append(log.getId()).append(",");
            sb.append("\"userId\":").append(log.getUser() != null ? log.getUser().getId() : "null").append(",");
            sb.append("\"username\":\"").append(escapeJson(log.getUser() != null ? log.getUser().getUsername() : "")).append("\",");
            sb.append("\"action\":\"").append(escapeJson(log.getAction())).append("\",");
            sb.append("\"entityType\":\"").append(escapeJson(log.getEntityType())).append("\",");
            sb.append("\"entityId\":").append(log.getEntityId() != null ? log.getEntityId() : "null").append(",");
            sb.append("\"category\":\"").append(log.getCategory() != null ? log.getCategory().name() : "").append("\",");
            sb.append("\"logLevel\":\"").append(log.getLogLevel() != null ? log.getLogLevel().name() : "").append("\",");
            sb.append("\"method\":\"").append(escapeJson(log.getMethod())).append("\",");
            sb.append("\"endpoint\":\"").append(escapeJson(log.getEndpoint())).append("\",");
            sb.append("\"statusCode\":").append(log.getStatusCode() != null ? log.getStatusCode() : "null").append(",");
            sb.append("\"durationMs\":").append(log.getDurationMs() != null ? log.getDurationMs() : "null").append(",");
            sb.append("\"ipAddress\":\"").append(escapeJson(log.getIpAddress())).append("\",");
            sb.append("\"userAgent\":\"").append(escapeJson(log.getUserAgent())).append("\",");
            sb.append("\"requestId\":\"").append(escapeJson(log.getRequestId())).append("\",");
            sb.append("\"createdAt\":\"").append(log.getCreatedAt() != null ? log.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "").append("\"");
            sb.append("}");
            if (i < logs.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static final String CSV_DANGEROUS_PREFIX = "=";

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.startsWith(CSV_DANGEROUS_PREFIX)
                || value.startsWith("+")
                || value.startsWith("-")
                || value.startsWith("@")
                || value.startsWith("\t")
                || value.startsWith("\r")) {
            value = "'" + value;
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getUser() != null ? log.getUser().getId() : null,
                log.getUser() != null ? log.getUser().getUsername() : null,
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getOldValues(),
                log.getNewValues(),
                log.getIpAddress(),
                log.getUserAgent(),
                log.getCategory(),
                log.getLogLevel(),
                log.getMethod(),
                log.getEndpoint(),
                log.getStatusCode(),
                log.getDurationMs(),
                log.getRequestParams(),
                log.getResponseSummary(),
                log.getCreatedAt()
        );
    }

    private AuditLogDetailResponse toDetailResponse(AuditLog log) {
        return new AuditLogDetailResponse(
                log.getId(),
                log.getUser() != null ? log.getUser().getId() : null,
                log.getUser() != null ? log.getUser().getUsername() : null,
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getOldValues(),
                log.getNewValues(),
                log.getIpAddress(),
                log.getUserAgent(),
                log.getRequestId(),
                log.getCategory(),
                log.getLogLevel(),
                log.getMethod(),
                log.getEndpoint(),
                log.getStatusCode(),
                log.getDurationMs(),
                log.getRequestParams(),
                log.getResponseSummary(),
                log.getCreatedAt()
        );
    }
}
