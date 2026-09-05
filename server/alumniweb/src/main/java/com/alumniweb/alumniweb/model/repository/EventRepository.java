package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.Event;
import com.alumniweb.alumniweb.model.enums.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByStatusOrderByEventDateAsc(EventStatus status);

    List<Event> findByStatusOrderByEventDateDesc(EventStatus status);

    List<Event> findByStatusAndEventDateGreaterThanEqualOrderByEventDateAsc(EventStatus status, LocalDateTime date);

    List<Event> findByStatusAndEventDateLessThanOrderByEventDateDesc(EventStatus status, LocalDateTime date);

    Optional<Event> findBySlugAndStatus(String slug, EventStatus status);

    Optional<Event> findBySlug(String slug);

    List<Event> findByStatusAndTitleContainingIgnoreCaseOrderByEventDateDesc(EventStatus status, String title);

    List<Event> findByTitleContainingIgnoreCaseOrderByEventDateDesc(String title);

    boolean existsBySlug(String slug);

    long countByStatus(EventStatus status);
}
