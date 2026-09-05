package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.LoginEvent;
import com.alumniweb.alumniweb.model.enums.LoginEventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoginEventRepository extends JpaRepository<LoginEvent, Long> {

    List<LoginEvent> findByUserId(Long userId);

    Page<LoginEvent> findByUserId(Long userId, Pageable pageable);

    List<LoginEvent> findByEmailUsed(String email);

    List<LoginEvent> findByStatus(LoginEventStatus status);

    List<LoginEvent> findByUserIdAndStatus(Long userId, LoginEventStatus status);

    long countByEmailUsedAndStatusAndCreatedAtAfter(String email, LoginEventStatus status, LocalDateTime since);
}
