package com.alumniweb.alumniweb.dto.admin;

import com.alumniweb.alumniweb.model.enums.RequestStatus;

import java.time.LocalDateTime;

public record RequestApprovalResponse(
    Long requestId,
    RequestStatus status,
    String message,
    LocalDateTime resolvedAt
) {
}
