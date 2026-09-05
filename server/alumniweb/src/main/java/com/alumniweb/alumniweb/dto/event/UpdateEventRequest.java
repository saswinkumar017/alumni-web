package com.alumniweb.alumniweb.dto.event;

import com.alumniweb.alumniweb.model.enums.EventStatus;

import java.time.LocalDateTime;

public record UpdateEventRequest(
        String slug,
        String title,
        String description,
        String venue,
        LocalDateTime eventDate,
        String coverImageUrl,
        EventStatus status,
        Integer maxAttendees
) {
}
