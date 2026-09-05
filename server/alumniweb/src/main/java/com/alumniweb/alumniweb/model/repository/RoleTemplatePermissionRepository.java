package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.RoleTemplatePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoleTemplatePermissionRepository extends JpaRepository<RoleTemplatePermission, Long> {

    List<RoleTemplatePermission> findByRoleTemplateId(Long roleTemplateId);

    List<RoleTemplatePermission> findByPermissionId(Long permissionId);

    List<RoleTemplatePermission> findByRoleTemplateIdAndGranted(Long roleTemplateId, boolean granted);

    void deleteByRoleTemplateIdAndPermissionId(Long roleTemplateId, Long permissionId);
}
