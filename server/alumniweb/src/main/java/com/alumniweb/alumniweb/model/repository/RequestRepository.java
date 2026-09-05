package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.MasterAlumni;
import com.alumniweb.alumniweb.model.Request;
import com.alumniweb.alumniweb.model.enums.RequestStatus;
import com.alumniweb.alumniweb.model.enums.RequestType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RequestRepository extends JpaRepository<Request, Long> {

    List<Request> findByRequestType(RequestType requestType);

    Page<Request> findByRequestType(RequestType requestType, Pageable pageable);

    List<Request> findByStatus(RequestStatus status);

    Page<Request> findByStatus(RequestStatus status, Pageable pageable);

    List<Request> findByMasterAlumni(MasterAlumni masterAlumni);

    Page<Request> findByMasterAlumni(MasterAlumni masterAlumni, Pageable pageable);

    long countByStatus(RequestStatus status);

    long countByResolvedAtAfter(LocalDateTime dateTime);

    List<Request> findTop5ByOrderBySubmittedAtDesc();

    Page<Request> findByRequestTypeAndStatus(RequestType requestType, RequestStatus status, Pageable pageable);

    @Query("""
            SELECT r FROM Request r WHERE
            (:type IS NULL OR r.requestType = :type) AND
            (:status IS NULL OR r.status = :status) AND
            (:query IS NULL OR LOWER(r.requesterEmail) LIKE LOWER(CONCAT('%', :query, '%')))
            """)
    Page<Request> findByFilters(@Param("type") RequestType type,
                                @Param("status") RequestStatus status,
                                @Param("query") String query,
                                Pageable pageable);
}
