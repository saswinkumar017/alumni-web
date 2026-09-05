package com.alumniweb.alumniweb.service.impl;

import com.alumniweb.alumniweb.dto.admin.AdminDashboardResponse;
import com.alumniweb.alumniweb.dto.admin.PendingRequestResponse;
import com.alumniweb.alumniweb.dto.admin.RequestApprovalRequest;
import com.alumniweb.alumniweb.dto.admin.RequestApprovalResponse;
import com.alumniweb.alumniweb.dto.request.EmailCorrectionRequest;
import com.alumniweb.alumniweb.dto.request.NewAlumniRequest;
import com.alumniweb.alumniweb.dto.search.AlumniSummaryResponse;
import com.alumniweb.alumniweb.exception.RequestNotFoundException;
import com.alumniweb.alumniweb.model.AuditLog;
import com.alumniweb.alumniweb.model.MasterAlumni;
import com.alumniweb.alumniweb.model.Request;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.enums.AuditCategory;
import com.alumniweb.alumniweb.model.enums.AuditLogLevel;
import com.alumniweb.alumniweb.model.enums.RequestStatus;
import com.alumniweb.alumniweb.model.enums.RequestType;
import com.alumniweb.alumniweb.model.mapper.MasterAlumniMapper;
import com.alumniweb.alumniweb.model.mapper.RequestMapper;
import com.alumniweb.alumniweb.model.repository.AuditLogRepository;
import com.alumniweb.alumniweb.model.repository.MasterAlumniRepository;
import com.alumniweb.alumniweb.model.repository.RequestRepository;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.service.AdminService;
import com.alumniweb.alumniweb.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminServiceImpl implements AdminService {

    private final RequestRepository requestRepository;
    private final MasterAlumniRepository masterAlumniRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final RequestMapper requestMapper;
    private final MasterAlumniMapper masterAlumniMapper;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    @Override
    public AdminDashboardResponse getDashboard() {
        long totalRequests = requestRepository.count();
        long pending = requestRepository.countByStatus(RequestStatus.PENDING);
        long approvedToday = requestRepository.countByResolvedAtAfter(LocalDate.now().atStartOfDay());
        long totalAlumni = masterAlumniRepository.count();

        java.util.List<PendingRequestResponse> recentRequests = requestRepository
            .findTop5ByOrderBySubmittedAtDesc()
            .stream()
            .map(requestMapper::toPendingResponse)
            .toList();

        return new AdminDashboardResponse(
            totalRequests, null,
            pending, null,
            approvedToday, null,
            totalAlumni, null,
            recentRequests
        );
    }

    @Override
    public Page<PendingRequestResponse> getPendingRequests(Pageable pageable) {
        return requestRepository.findByStatus(RequestStatus.PENDING, pageable)
            .map(requestMapper::toPendingResponse);
    }

    @Override
    public Page<PendingRequestResponse> getFilteredRequests(RequestType type, RequestStatus status, String query, Pageable pageable) {
        return requestRepository.findByFilters(type, status, query, pageable)
            .map(requestMapper::toPendingResponse);
    }

    @Override
    public PendingRequestResponse getRequest(Long id) {
        Request req = requestRepository.findById(id)
            .orElseThrow(() -> new RequestNotFoundException(id));
        return requestMapper.toPendingResponse(req);
    }

    @Override
    @Transactional
    public RequestApprovalResponse processRequest(RequestApprovalRequest request) {
        Request req = requestRepository.findById(request.requestId())
            .orElseThrow(() -> new RequestNotFoundException(request.requestId()));

        if (req.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Request is not in PENDING status");
        }

        if (request.decision() == RequestStatus.APPROVED) {
            return approve(req, request.adminNotes());
        } else if (request.decision() == RequestStatus.REJECTED) {
            return reject(req, request.adminNotes());
        } else {
            throw new IllegalArgumentException("Invalid decision: " + request.decision());
        }
    }

    @Override
    public Page<AlumniSummaryResponse> searchAlumni(String query, String department, String batch, Pageable pageable) {
        return masterAlumniRepository.searchByFilters(query, department, batch, pageable)
            .map(masterAlumniMapper::toSummaryResponse);
    }

    private RequestApprovalResponse approve(Request req, String adminNotes) {
        req.setStatus(RequestStatus.APPROVED);
        req.setResolvedAt(LocalDateTime.now());
        req.setAdminNotes(adminNotes);

        if (req.getRequestType() == RequestType.EMAIL_CORRECTION && req.getMasterAlumni() != null) {
            try {
                EmailCorrectionRequest payload = objectMapper.readValue(
                    req.getPayload(), EmailCorrectionRequest.class);
                MasterAlumni master = req.getMasterAlumni();
                master.setEmail(payload.newEmail());
                masterAlumniRepository.save(master);
            } catch (Exception e) {
                throw new RuntimeException("Failed to process email correction payload", e);
            }
        } else if (req.getRequestType() == RequestType.NEW_ALUMNI) {
            try {
                NewAlumniRequest payload = objectMapper.readValue(
                    req.getPayload(), NewAlumniRequest.class);
                MasterAlumni master = MasterAlumni.builder()
                    .registerNumber(payload.registerNumber())
                    .name(payload.name())
                    .department(payload.department())
                    .degree(payload.degree())
                    .batch(payload.batch())
                    .yearOfPassing(payload.yearOfPassing())
                    .email(payload.email())
                    .phone(payload.phone())
                    .dob(payload.dob())
                    .gender(payload.gender())
                    .address(payload.address())
                    .company(payload.company())
                    .designation(payload.designation())
                    .profession(payload.profession())
                    .maritalStatus(payload.maritalStatus())
                    .availability(payload.availability())
                    .currentStatus(payload.currentStatus())
                    .build();
                masterAlumniRepository.save(master);
            } catch (Exception e) {
                throw new RuntimeException("Failed to process new alumni payload", e);
            }
        }

        req = requestRepository.save(req);

        String name = req.getMasterAlumni() != null ? req.getMasterAlumni().getName() : "User";
        emailService.sendApprovalNotification(
            req.getRequesterEmail(),
            name,
            req.getRequestType().name()
        );

        return new RequestApprovalResponse(
            req.getId(),
            req.getStatus(),
            "Request approved successfully",
            req.getResolvedAt()
        );
    }

    private RequestApprovalResponse reject(Request req, String adminNotes) {
        req.setStatus(RequestStatus.REJECTED);
        req.setResolvedAt(LocalDateTime.now());
        req.setAdminNotes(adminNotes);
        req = requestRepository.save(req);

        String name = req.getMasterAlumni() != null ? req.getMasterAlumni().getName() : "User";
        emailService.sendRejectionNotification(
            req.getRequesterEmail(),
            name,
            req.getRequestType().name(),
            adminNotes
        );

        return new RequestApprovalResponse(
            req.getId(),
            req.getStatus(),
            "Request rejected",
            req.getResolvedAt()
        );
    }

    @Override
    public Page<User> listUsers(String query, Pageable pageable) {
        if (query != null && !query.isBlank()) {
            return userRepository.searchByQuery(query, pageable);
        }
        return userRepository.findAll(pageable);
    }

    @Override
    public User getUser(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new java.util.NoSuchElementException("User not found with id: " + id));
    }

    @Override
    @Transactional
    public void suspendUser(Long id, String reason) {
        User user = getUser(id);
        user.setAccountStatus(com.alumniweb.alumniweb.model.enums.AccountStatus.SUSPENDED);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void activateUser(Long id) {
        User user = getUser(id);
        user.setAccountStatus(com.alumniweb.alumniweb.model.enums.AccountStatus.ACTIVE);
        userRepository.save(user);
    }
}
