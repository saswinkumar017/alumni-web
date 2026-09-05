package com.alumniweb.alumniweb.dto.community;

import java.time.LocalDateTime;

public record CommunityMessageResponse(
    Long id,
    Long communityId,
    Long senderId,
    String senderName,
    String senderAvatar,
    String body,
    LocalDateTime createdAt
) {
}
