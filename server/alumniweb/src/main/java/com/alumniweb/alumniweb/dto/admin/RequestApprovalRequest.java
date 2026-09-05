package com.alumniweb.alumniweb.dto.admin;

import com.alumniweb.alumniweb.model.enums.RequestStatus;
import jakarta.validation.constraints.NotNull;

public record RequestApprovalRequest(
    @NotNull(message = "Request ID is required")
    Long requestId,

    @NotNull(message = "Decision is required")
    RequestStatus decision,

    String adminNotes
) {
}
