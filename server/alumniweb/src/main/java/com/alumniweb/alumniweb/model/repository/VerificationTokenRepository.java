package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {

    Optional<VerificationToken> findByToken(String token);

    List<VerificationToken> findByUserIdAndPurposeAndUsedFalse(Long userId, String purpose);

    List<VerificationToken> findByPurposeAndUsedFalse(String purpose);
}
