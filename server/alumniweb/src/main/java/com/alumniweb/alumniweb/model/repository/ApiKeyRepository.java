package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {

    List<ApiKey> findByUserId(Long userId);

    Optional<ApiKey> findByKeyHash(String keyHash);

    Optional<ApiKey> findByKeyPrefix(String keyPrefix);

    List<ApiKey> findByUserIdAndRevoked(Long userId, boolean revoked);
}
