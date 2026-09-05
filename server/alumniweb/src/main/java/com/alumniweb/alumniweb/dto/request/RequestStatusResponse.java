package com.alumniweb.alumniweb.dto.request;

import com.alumniweb.alumniweb.model.enums.RequestStatus;
import com.alumniweb.alumniweb.model.enums.RequestType;

import java.time.LocalDateTime;

public record RequestStatusResponse(
    Long requestId,
    RequestType requestType,
    RequestStatus status,
    LocalDateTime submittedAt,
    LocalDateTime resolvedAt,
    String adminNotes
) {
}
