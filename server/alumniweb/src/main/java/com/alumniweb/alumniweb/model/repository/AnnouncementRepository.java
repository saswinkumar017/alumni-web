package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findByIsActiveTrueOrderByCreatedAtDesc();

    List<Announcement> findByIsActiveTrueAndFeaturedTrueOrderByCreatedAtDesc();

    List<Announcement> findAllByOrderByCreatedAtDesc();

    long countByIsActiveTrue();
}
