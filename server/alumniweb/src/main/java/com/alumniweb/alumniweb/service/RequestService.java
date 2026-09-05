package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.request.EmailCorrectionRequest;
import com.alumniweb.alumniweb.dto.request.NewAlumniRequest;
import com.alumniweb.alumniweb.dto.request.RequestStatusResponse;

public interface RequestService {

    RequestStatusResponse createEmailCorrectionRequest(EmailCorrectionRequest request);

    RequestStatusResponse createNewAlumniRequest(NewAlumniRequest request);

    RequestStatusResponse getRequestStatus(Long requestId);
}
