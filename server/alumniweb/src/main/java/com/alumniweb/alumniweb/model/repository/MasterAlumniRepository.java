package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.MasterAlumni;
import com.alumniweb.alumniweb.model.enums.CurrentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MasterAlumniRepository extends JpaRepository<MasterAlumni, Long> {

    Optional<MasterAlumni> findByRegisterNumber(String registerNumber);

    boolean existsByRegisterNumber(String registerNumber);

    boolean existsByEmail(String email);

    List<MasterAlumni> findByEmail(String email);

    Page<MasterAlumni> findByEmail(String email, Pageable pageable);

    List<MasterAlumni> findByName(String name);

    Page<MasterAlumni> findByName(String name, Pageable pageable);

    List<MasterAlumni> findByNameContainingIgnoreCase(String name);

    Page<MasterAlumni> findByNameContainingIgnoreCase(String name, Pageable pageable);

    List<MasterAlumni> findByDepartment(String department);

    Page<MasterAlumni> findByDepartment(String department, Pageable pageable);

    List<MasterAlumni> findByBatch(String batch);

    Page<MasterAlumni> findByBatch(String batch, Pageable pageable);

    List<MasterAlumni> findByYearOfPassing(Integer yearOfPassing);

    Page<MasterAlumni> findByYearOfPassing(Integer yearOfPassing, Pageable pageable);

    List<MasterAlumni> findByCurrentStatus(CurrentStatus currentStatus);

    Page<MasterAlumni> findByCurrentStatus(CurrentStatus currentStatus, Pageable pageable);

    @Query("""
            SELECT m FROM MasterAlumni m WHERE
            (:query IS NULL OR LOWER(m.name) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(m.email) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(m.registerNumber) LIKE LOWER(CONCAT('%', :query, '%')))
            AND (:department IS NULL OR m.department = :department)
            AND (:batch IS NULL OR m.batch = :batch)
            """)
    Page<MasterAlumni> searchByFilters(@Param("query") String query,
                                       @Param("department") String department,
                                       @Param("batch") String batch,
                                       Pageable pageable);
}
