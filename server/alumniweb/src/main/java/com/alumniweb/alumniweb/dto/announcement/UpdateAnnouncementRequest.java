package com.alumniweb.alumniweb.dto.announcement;

import java.util.List;

public record UpdateAnnouncementRequest(
        String title,
        String body,
        Boolean featured,
        Boolean isActive,
        List<String> tags
) {
}
