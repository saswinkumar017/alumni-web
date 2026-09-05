package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.PermissionGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionGroupRepository extends JpaRepository<PermissionGroup, Long> {

    Optional<PermissionGroup> findByCode(String code);

    List<PermissionGroup> findByCategoryId(Long categoryId);

    List<PermissionGroup> findByCategoryIdOrderByDisplayOrderAsc(Long categoryId);

    boolean existsByCode(String code);
}
