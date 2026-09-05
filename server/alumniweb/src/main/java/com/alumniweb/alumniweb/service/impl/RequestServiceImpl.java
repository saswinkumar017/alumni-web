package com.alumniweb.alumniweb.service.impl;

import com.alumniweb.alumniweb.dto.request.EmailCorrectionRequest;
import com.alumniweb.alumniweb.dto.request.NewAlumniRequest;
import com.alumniweb.alumniweb.dto.request.RequestStatusResponse;
import com.alumniweb.alumniweb.exception.AlumniNotFoundException;
import com.alumniweb.alumniweb.exception.RequestNotFoundException;
import com.alumniweb.alumniweb.model.MasterAlumni;
import com.alumniweb.alumniweb.model.Request;
import com.alumniweb.alumniweb.model.enums.RequestStatus;
import com.alumniweb.alumniweb.model.enums.RequestType;
import com.alumniweb.alumniweb.model.mapper.RequestMapper;
import com.alumniweb.alumniweb.model.repository.MasterAlumniRepository;
import com.alumniweb.alumniweb.model.repository.RequestRepository;
import com.alumniweb.alumniweb.service.RequestService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RequestServiceImpl implements RequestService {

    private final MasterAlumniRepository masterAlumniRepository;
    private final RequestRepository requestRepository;
    private final RequestMapper requestMapper;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public RequestStatusResponse createEmailCorrectionRequest(EmailCorrectionRequest request) {
        MasterAlumni master = masterAlumniRepository.findByRegisterNumber(request.registerNumber())
            .orElseThrow(() -> new AlumniNotFoundException(request.registerNumber()));

        String payload;
        try {
            payload = objectMapper.writeValueAsString(request);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize request payload", e);
        }

        Request req = Request.builder()
            .masterAlumni(master)
            .requestType(RequestType.EMAIL_CORRECTION)
            .status(RequestStatus.PENDING)
            .requesterEmail(request.currentEmail())
            .payload(payload)
            .build();

        req = requestRepository.save(req);
        return requestMapper.toStatusResponse(req);
    }

    @Override
    @Transactional
    public RequestStatusResponse createNewAlumniRequest(NewAlumniRequest request) {
        String payload;
        try {
            payload = objectMapper.writeValueAsString(request);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize request payload", e);
        }

        Request req = Request.builder()
            .requestType(RequestType.NEW_ALUMNI)
            .status(RequestStatus.PENDING)
            .requesterEmail(request.email())
            .payload(payload)
            .build();

        req = requestRepository.save(req);
        return requestMapper.toStatusResponse(req);
    }

    @Override
    public RequestStatusResponse getRequestStatus(Long requestId) {
        Request req = requestRepository.findById(requestId)
            .orElseThrow(() -> new RequestNotFoundException(requestId));
        return requestMapper.toStatusResponse(req);
    }
}
