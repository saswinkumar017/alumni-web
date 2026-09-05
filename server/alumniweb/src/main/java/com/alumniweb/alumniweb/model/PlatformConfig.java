package com.alumniweb.alumniweb.model;

import com.alumniweb.alumniweb.model.enums.ConfigCategory;
import com.alumniweb.alumniweb.model.enums.ValueType;
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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SourceType;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "platform_config",
       uniqueConstraints = {
           @UniqueConstraint(name = "uq_config_key", columnNames = "`key`")
       },
       indexes = {
           @Index(name = "idx_config_category", columnList = "category")
       })
public class PlatformConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "`key`", nullable = false, unique = true, length = 200)
    private String key;

    @Column(name = "value", columnDefinition = "TEXT")
    private String value;

    @Enumerated(EnumType.STRING)
    @Column(name = "value_type", nullable = false, length = 10)
    @Builder.Default
    private ValueType valueType = ValueType.STRING;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 15)
    @Builder.Default
    private ConfigCategory category = ConfigCategory.GENERAL;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @Column(name = "is_sensitive", nullable = false)
    private boolean isSensitive = false;

    @Builder.Default
    @Column(name = "is_readonly", nullable = false)
    private boolean isReadonly = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp(source = SourceType.DB)
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp(source = SourceType.DB)
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
