package com.alumniweb.alumniweb.service.impl;

import com.alumniweb.alumniweb.dto.developer.DeveloperUserResponse;
import com.alumniweb.alumniweb.dto.developer.DeveloperUserUpdateRequest;
import com.alumniweb.alumniweb.model.AuditLog;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.enums.AuditCategory;
import com.alumniweb.alumniweb.model.enums.AuditLogLevel;
import com.alumniweb.alumniweb.model.enums.AccountStatus;
import com.alumniweb.alumniweb.model.enums.UserRole;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.security.SecurityUtils;
import com.alumniweb.alumniweb.service.AuditEventPublisher;
import com.alumniweb.alumniweb.service.DeveloperUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeveloperUserServiceImpl implements DeveloperUserService {

    private final UserRepository userRepository;
    private final AuditEventPublisher auditEventPublisher;

    @Override
    public Page<DeveloperUserResponse> listUsers(String query, Pageable pageable) {
        Page<User> users;
        if (query != null && !query.isBlank()) {
            users = userRepository.findByUsernameContaining(query, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }
        return users.map(this::toResponse);
    }

    @Override
    public DeveloperUserResponse getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + id));
        return toResponse(user);
    }

    @Override
    @Transactional
    public DeveloperUserResponse updateUser(Long id, DeveloperUserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + id));

        User currentUser = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));

        String oldValues = "{\"role\":\"" + user.getRole() + "\",\"status\":\"" + user.getAccountStatus() + "\"}";

        if (request.role() != null) {
            user.setRole(request.role());
        }
        if (request.accountStatus() != null) {
            user.setAccountStatus(request.accountStatus());
        }
        if (request.emailVerified() != null) {
            user.setEmailVerified(request.emailVerified());
        }

        User saved = userRepository.save(user);

        auditEventPublisher.publish(AuditLog.builder()
                .user(currentUser)
                .action("UPDATE_USER")
                .category(AuditCategory.USER_ACTION)
                .logLevel(AuditLogLevel.INFO)
                .entityType("User")
                .entityId(id)
                .oldValues(oldValues)
                .newValues("{\"role\":\"" + saved.getRole() + "\",\"status\":\"" + saved.getAccountStatus() + "\"}")
                .build());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public DeveloperUserResponse suspendUser(Long id, String reason) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + id));

        User currentUser = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));

        String oldValues = "{\"status\":\"" + user.getAccountStatus() + "\"}";
        user.setAccountStatus(AccountStatus.SUSPENDED);
        User saved = userRepository.save(user);

        auditEventPublisher.publish(AuditLog.builder()
                .user(currentUser)
                .action("SUSPEND_USER")
                .category(AuditCategory.USER_ACTION)
                .logLevel(AuditLogLevel.WARN)
                .entityType("User")
                .entityId(id)
                .oldValues(oldValues)
                .newValues("{\"status\":\"SUSPENDED\",\"reason\":\"" + (reason != null ? reason : "") + "\"}")
                .build());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public DeveloperUserResponse activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + id));

        User currentUser = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));

        String oldValues = "{\"status\":\"" + user.getAccountStatus() + "\"}";
        user.setAccountStatus(AccountStatus.ACTIVE);
        User saved = userRepository.save(user);

        auditEventPublisher.publish(AuditLog.builder()
                .user(currentUser)
                .action("ACTIVATE_USER")
                .category(AuditCategory.USER_ACTION)
                .logLevel(AuditLogLevel.INFO)
                .entityType("User")
                .entityId(id)
                .oldValues(oldValues)
                .newValues("{\"status\":\"ACTIVE\"}")
                .build());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public DeveloperUserResponse changeRole(Long id, UserRole role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + id));

        User currentUser = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));

        String oldValues = "{\"role\":\"" + user.getRole() + "\"}";
        user.setRole(role);
        User saved = userRepository.save(user);

        auditEventPublisher.publish(AuditLog.builder()
                .user(currentUser)
                .action("CHANGE_USER_ROLE")
                .category(AuditCategory.USER_ACTION)
                .logLevel(AuditLogLevel.WARN)
                .entityType("User")
                .entityId(id)
                .oldValues(oldValues)
                .newValues("{\"role\":\"" + role.name() + "\"}")
                .build());

        return toResponse(saved);
    }

    private DeveloperUserResponse toResponse(User user) {
        return new DeveloperUserResponse(
                user.getId(),
                user.getUsername(),
                user.getMasterAlumni() != null ? user.getMasterAlumni().getEmail() : null,
                user.getMasterAlumni() != null ? user.getMasterAlumni().getName() : null,
                user.getRole(),
                user.getAccountStatus(),
                user.isEmailVerified(),
                user.getLastLogin(),
                user.getCreatedAt()
        );
    }
}
