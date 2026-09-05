package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.Community;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommunityRepository extends JpaRepository<Community, Long> {
    List<Community> findByDeletedFalse();
    List<Community> findByBatchAndDeletedFalse(String batch);
    List<Community> findByDepartmentAndDeletedFalse(String department);
}
