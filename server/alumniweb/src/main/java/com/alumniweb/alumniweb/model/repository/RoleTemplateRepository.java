package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.RoleTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleTemplateRepository extends JpaRepository<RoleTemplate, Long> {

    Optional<RoleTemplate> findByCode(String code);

    List<RoleTemplate> findByIsActive(boolean isActive);

    boolean existsByCode(String code);
}
