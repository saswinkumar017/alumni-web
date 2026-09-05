package com.alumniweb.alumniweb.dto.admin;

import com.alumniweb.alumniweb.dto.search.AlumniSummaryResponse;
import com.alumniweb.alumniweb.model.enums.RequestStatus;
import com.alumniweb.alumniweb.model.enums.RequestType;

import java.time.LocalDateTime;

public record PendingRequestResponse(
    Long requestId,
    RequestType requestType,
    RequestStatus status,
    LocalDateTime submittedAt,
    String requesterEmail,
    String payload,
    AlumniSummaryResponse alumni
) {
}
