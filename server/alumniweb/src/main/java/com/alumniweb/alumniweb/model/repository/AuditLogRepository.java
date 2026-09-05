package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.AuditLog;
import com.alumniweb.alumniweb.model.enums.AuditCategory;
import com.alumniweb.alumniweb.model.enums.AuditLogLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    List<AuditLog> findByUserId(Long userId);

    Page<AuditLog> findByUserId(Long userId, Pageable pageable);

    List<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId);

    Page<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId, Pageable pageable);

    List<AuditLog> findByAction(String action);

    Page<AuditLog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    Page<AuditLog> findByCategory(AuditCategory category, Pageable pageable);

    Page<AuditLog> findByLogLevel(AuditLogLevel level, Pageable pageable);

    Page<AuditLog> findByMethod(String method, Pageable pageable);

    long countByCategory(AuditCategory category);

    long countByLogLevel(AuditLogLevel level);

    long countByCreatedAtAfter(LocalDateTime since);

    @Query("SELECT a.action, COUNT(a) FROM AuditLog a GROUP BY a.action ORDER BY COUNT(a) DESC")
    List<Object[]> countByActionGrouped();

    @Query("SELECT a.entityType, COUNT(a) FROM AuditLog a GROUP BY a.entityType ORDER BY COUNT(a) DESC")
    List<Object[]> countByEntityTypeGrouped();

    @Query("SELECT CAST(a.category AS string), COUNT(a) FROM AuditLog a WHERE a.category IS NOT NULL GROUP BY a.category ORDER BY COUNT(a) DESC")
    List<Object[]> countByCategoryGrouped();

    @Query("SELECT COALESCE(AVG(a.durationMs), 0) FROM AuditLog a WHERE a.durationMs IS NOT NULL")
    Double avgDurationMs();
}
