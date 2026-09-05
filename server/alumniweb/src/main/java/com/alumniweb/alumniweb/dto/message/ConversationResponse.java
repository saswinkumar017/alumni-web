package com.alumniweb.alumniweb.dto.message;

import java.time.LocalDateTime;

public record ConversationResponse(
    Long userId,
    String name,
    String registerNumber,
    String lastMessage,
    LocalDateTime lastMessageAt,
    long unreadCount
) {
}
