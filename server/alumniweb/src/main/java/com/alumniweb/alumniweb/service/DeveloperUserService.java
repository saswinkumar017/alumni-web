package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.developer.DeveloperUserResponse;
import com.alumniweb.alumniweb.dto.developer.DeveloperUserUpdateRequest;
import com.alumniweb.alumniweb.model.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DeveloperUserService {
    Page<DeveloperUserResponse> listUsers(String query, Pageable pageable);
    DeveloperUserResponse getUser(Long id);
    DeveloperUserResponse updateUser(Long id, DeveloperUserUpdateRequest request);
    DeveloperUserResponse suspendUser(Long id, String reason);
    DeveloperUserResponse activateUser(Long id);
    DeveloperUserResponse changeRole(Long id, UserRole role);
}
