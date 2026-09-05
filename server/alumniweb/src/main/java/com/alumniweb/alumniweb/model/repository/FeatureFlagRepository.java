package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.FeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, Long> {

    Optional<FeatureFlag> findByCode(String code);

    List<FeatureFlag> findByIsEnabled(boolean isEnabled);

    List<FeatureFlag> findByIsEnabledAndTargetAudience(boolean isEnabled, String targetAudience);

    boolean existsByCode(String code);
}
