package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    Optional<Permission> findByCode(String code);

    List<Permission> findByGroupId(Long groupId);

    List<Permission> findByActionAndResource(String action, String resource);

    boolean existsByCode(String code);
}
