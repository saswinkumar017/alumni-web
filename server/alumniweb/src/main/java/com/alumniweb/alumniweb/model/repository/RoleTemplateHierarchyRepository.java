package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.RoleTemplateHierarchy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoleTemplateHierarchyRepository extends JpaRepository<RoleTemplateHierarchy, Long> {

    List<RoleTemplateHierarchy> findByParentRoleId(Long parentRoleId);

    List<RoleTemplateHierarchy> findByChildRoleId(Long childRoleId);

    void deleteByParentRoleIdAndChildRoleId(Long parentRoleId, Long childRoleId);
}
