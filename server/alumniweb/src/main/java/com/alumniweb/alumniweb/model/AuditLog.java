package com.alumniweb.alumniweb.model;

import com.alumniweb.alumniweb.model.enums.AuditCategory;
import com.alumniweb.alumniweb.model.enums.AuditLogLevel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SourceType;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "audit_log",
       indexes = {
           @Index(name = "idx_audit_user", columnList = "user_id"),
           @Index(name = "idx_audit_entity", columnList = "entity_type, entity_id"),
           @Index(name = "idx_audit_action", columnList = "action"),
           @Index(name = "idx_audit_created", columnList = "created_at"),
           @Index(name = "idx_audit_request", columnList = "request_id"),
           @Index(name = "idx_audit_category", columnList = "category"),
           @Index(name = "idx_audit_log_level", columnList = "log_level"),
           @Index(name = "idx_audit_method", columnList = "method"),
           @Index(name = "idx_audit_status_code", columnList = "status_code")
       })
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @com.fasterxml.jackson.annotation.JsonProperty("userId")
    @jakarta.persistence.Transient
    public Long getUserIdFromUser() {
        return user != null ? user.getId() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("username")
    @jakarta.persistence.Transient
    public String getUsernameFromUser() {
        return user != null ? user.getUsername() : null;
    }

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "old_values", columnDefinition = "JSON")
    private String oldValues;

    @Column(name = "new_values", columnDefinition = "JSON")
    private String newValues;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "request_id", length = 100)
    private String requestId;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 20)
    @Builder.Default
    private AuditCategory category = AuditCategory.SYSTEM;

    @Enumerated(EnumType.STRING)
    @Column(name = "log_level", length = 20)
    @Builder.Default
    private AuditLogLevel logLevel = AuditLogLevel.INFO;

    @Column(name = "method", length = 10)
    private String method;

    @Column(name = "endpoint", length = 500)
    private String endpoint;

    @Column(name = "status_code")
    private Integer statusCode;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "request_params", columnDefinition = "TEXT")
    private String requestParams;

    @Column(name = "response_summary", length = 500)
    private String responseSummary;

    @CreationTimestamp(source = SourceType.DB)
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
