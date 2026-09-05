package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.TrustedDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TrustedDeviceRepository extends JpaRepository<TrustedDevice, Long> {

    List<TrustedDevice> findByUserId(Long userId);

    List<TrustedDevice> findByUserIdAndTrusted(Long userId, boolean trusted);

    Optional<TrustedDevice> findByDeviceFingerprint(String deviceFingerprint);

    Optional<TrustedDevice> findByUserIdAndDeviceFingerprint(Long userId, String deviceFingerprint);

    List<TrustedDevice> findByExpiresAtBefore(LocalDateTime now);
}
