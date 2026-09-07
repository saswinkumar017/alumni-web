package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.admin.AdminAlumniResponse;
import com.alumniweb.alumniweb.dto.admin.AdminDashboardResponse;
import com.alumniweb.alumniweb.dto.admin.PendingRequestResponse;
import com.alumniweb.alumniweb.dto.admin.RequestApprovalRequest;
import com.alumniweb.alumniweb.dto.admin.RequestApprovalResponse;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.enums.RequestStatus;
import com.alumniweb.alumniweb.model.enums.RequestType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminService {

    AdminDashboardResponse getDashboard();

    Page<PendingRequestResponse> getPendingRequests(Pageable pageable);

    Page<PendingRequestResponse> getFilteredRequests(RequestType type, RequestStatus status, String query, Pageable pageable);

    PendingRequestResponse getRequest(Long id);

    RequestApprovalResponse processRequest(RequestApprovalRequest request);

    Page<AdminAlumniResponse> searchAlumni(String query, String department, String batch, Boolean hasAccount, Boolean verified, Pageable pageable);

    @Deprecated
    default Page<com.alumniweb.alumniweb.dto.search.AlumniSummaryResponse> searchAlumni(String query, String department, String batch, Pageable pageable) {
        throw new UnsupportedOperationException("Use searchAlumni with hasAccount/verified");
    }

    Page<User> listUsers(String query, Pageable pageable);

    User getUser(Long id);

    void suspendUser(Long id, String reason);

    void activateUser(Long id);
}
