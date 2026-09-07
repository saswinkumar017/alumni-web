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
        java.util.Map<String, Object> customFields,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    private static final com.fasterxml.jackson.databind.ObjectMapper MAPPER = new com.fasterxml.jackson.databind.ObjectMapper();

    @SuppressWarnings("unchecked")
    static java.util.Map<String, Object> parseCustom(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return MAPPER.readValue(raw, java.util.Map.class);
        } catch (Exception e) {
            return null;
        }
    }

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
                parseCustom(event.getCustomFields()),
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }
}
