package com.alumniweb.alumniweb.dto.connection;

import com.alumniweb.alumniweb.model.Connection;
import java.time.LocalDateTime;

public record ConnectionResponse(
    Long id,
    Long requesterId,
    String requesterName,
    String requesterRegisterNumber,
    Long recipientId,
    String recipientName,
    String recipientRegisterNumber,
    String status,
    String message,
    LocalDateTime createdAt
) {
    public static ConnectionResponse from(
        Connection conn, String requesterName, String requesterRegisterNumber,
        String recipientName, String recipientRegisterNumber
    ) {
        return new ConnectionResponse(
            conn.getId(), conn.getRequesterId(), requesterName, requesterRegisterNumber,
            conn.getRecipientId(), recipientName, recipientRegisterNumber,
            conn.getStatus(), conn.getMessage(), conn.getCreatedAt()
        );
    }
}
