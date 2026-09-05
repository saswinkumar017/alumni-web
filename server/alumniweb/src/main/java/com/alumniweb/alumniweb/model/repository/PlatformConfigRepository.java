package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.PlatformConfig;
import com.alumniweb.alumniweb.model.enums.ConfigCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlatformConfigRepository extends JpaRepository<PlatformConfig, Long> {

    Optional<PlatformConfig> findByKey(String key);

    List<PlatformConfig> findByCategory(ConfigCategory category);

    List<PlatformConfig> findByIsSensitive(boolean isSensitive);

    boolean existsByKey(String key);
}
