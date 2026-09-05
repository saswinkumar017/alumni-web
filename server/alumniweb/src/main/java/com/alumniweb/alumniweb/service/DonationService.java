package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.model.Donation;
import com.alumniweb.alumniweb.model.repository.DonationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class DonationService {
    private final DonationRepository donationRepository;

    public List<Donation> getDonations(Long userId) {
        return donationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Donation getDonation(Long id, Long userId) {
        return donationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Donation not found"));
    }

    @Transactional
    public Donation createDonation(Long userId, BigDecimal amount, String purpose, String notes) {
        Donation donation = Donation.builder()
                .userId(userId).amount(amount).purpose(purpose).notes(notes).status("COMPLETED").build();
        return donationRepository.save(donation);
    }

    public Map<String, Object> getDonationStats(Long userId) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAmount", donationRepository.sumCompletedByUserId(userId));
        stats.put("totalDonations", donationRepository.countByUserIdAndStatus(userId, "COMPLETED"));
        return stats;
    }
}
