package com.alumniweb.alumniweb.dto.announcement;

import java.util.List;

public record CreateAnnouncementRequest(
        String title,
        String body,
        boolean featured,
        List<String> tags
) {
}
