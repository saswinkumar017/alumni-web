package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.AppSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppSessionRepository extends JpaRepository<AppSession, Long> {

    Optional<AppSession> findBySessionToken(String sessionToken);

    List<AppSession> findByUserId(Long userId);

    List<AppSession> findByUserIdAndRevoked(Long userId, boolean revoked);

    List<AppSession> findByExpiresAtBeforeAndRevoked(LocalDateTime now, boolean revoked);

    void deleteByExpiresAtBeforeAndRevoked(LocalDateTime now, boolean revoked);
}
