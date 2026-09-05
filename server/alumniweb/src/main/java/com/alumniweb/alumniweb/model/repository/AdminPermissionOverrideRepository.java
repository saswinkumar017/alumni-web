package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.AdminPermissionOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminPermissionOverrideRepository extends JpaRepository<AdminPermissionOverride, Long> {

    List<AdminPermissionOverride> findByUserId(Long userId);

    Optional<AdminPermissionOverride> findByUserIdAndPermissionId(Long userId, Long permissionId);

    List<AdminPermissionOverride> findByUserIdAndGranted(Long userId, boolean granted);

    void deleteByUserIdAndPermissionId(Long userId, Long permissionId);
}
