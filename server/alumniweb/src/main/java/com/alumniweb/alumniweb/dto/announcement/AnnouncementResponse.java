package com.alumniweb.alumniweb.dto.announcement;

import com.alumniweb.alumniweb.model.Announcement;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

public record AnnouncementResponse(
        String id,
        String title,
        String body,
        String author,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean featured,
        boolean isActive,
        List<String> tags
) {

    public static AnnouncementResponse from(Announcement announcement) {
        List<String> tags = announcement.getTags() == null || announcement.getTags().isBlank()
                ? List.of()
                : Arrays.stream(announcement.getTags().split(","))
                        .map(String::trim)
                        .filter(t -> !t.isEmpty())
                        .toList();
        return new AnnouncementResponse(
                String.valueOf(announcement.getId()),
                announcement.getTitle(),
                announcement.getBody(),
                announcement.getAuthorName(),
                announcement.getCreatedAt(),
                announcement.getUpdatedAt(),
                announcement.isFeatured(),
                announcement.isActive(),
                tags
        );
    }
}
