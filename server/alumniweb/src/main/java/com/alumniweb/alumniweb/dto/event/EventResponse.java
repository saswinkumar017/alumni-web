package com.alumniweb.alumniweb.dto.event;

import com.alumniweb.alumniweb.model.Event;

import java.time.LocalDateTime;

public record EventResponse(
        String id,
        String slug,
        String title,
        String description,
        LocalDateTime date,
        String location,
        String image,
        String category,
        Integer maxAttendees,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static EventResponse from(Event event) {
        String category = event.getEventDate().isBefore(LocalDateTime.now()) ? "past" : "upcoming";
        return new EventResponse(
                String.valueOf(event.getId()),
                event.getSlug(),
                event.getTitle(),
                event.getDescription(),
                event.getEventDate(),
                event.getVenue(),
                event.getCoverImageUrl(),
                category,
                event.getMaxAttendees(),
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }
}
