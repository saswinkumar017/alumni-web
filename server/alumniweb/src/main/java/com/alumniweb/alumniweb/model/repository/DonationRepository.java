package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.Donation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface DonationRepository extends JpaRepository<Donation, Long> {
    List<Donation> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Donation> findByIdAndUserId(Long id, Long userId);
    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Donation d WHERE d.userId = :userId AND d.status = 'COMPLETED'")
    java.math.BigDecimal sumCompletedByUserId(Long userId);
    long countByUserIdAndStatus(Long userId, String status);
}
