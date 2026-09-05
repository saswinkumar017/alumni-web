package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.MfaEnrollment;
import com.alumniweb.alumniweb.model.enums.MfaMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MfaEnrollmentRepository extends JpaRepository<MfaEnrollment, Long> {

    List<MfaEnrollment> findByUserId(Long userId);

    List<MfaEnrollment> findByUserIdAndEnabled(Long userId, boolean enabled);

    List<MfaEnrollment> findByUserIdAndMethod(Long userId, MfaMethod method);
}
