package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.PermissionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionCategoryRepository extends JpaRepository<PermissionCategory, Long> {

    Optional<PermissionCategory> findByCode(String code);

    List<PermissionCategory> findAllByOrderByDisplayOrderAsc();

    boolean existsByCode(String code);
}
