package com.alumniweb.alumniweb.service.impl;

import com.alumniweb.alumniweb.dto.developer.RoleTemplateRequest;
import com.alumniweb.alumniweb.dto.developer.RoleTemplateResponse;
import com.alumniweb.alumniweb.dto.developer.RoleTemplatePermissionRequest;
import com.alumniweb.alumniweb.model.AuditLog;
import com.alumniweb.alumniweb.model.Permission;
import com.alumniweb.alumniweb.model.RoleTemplate;
import com.alumniweb.alumniweb.model.RoleTemplatePermission;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.enums.AuditCategory;
import com.alumniweb.alumniweb.model.enums.AuditLogLevel;
import com.alumniweb.alumniweb.model.repository.PermissionRepository;
import com.alumniweb.alumniweb.model.repository.RoleTemplatePermissionRepository;
import com.alumniweb.alumniweb.model.repository.RoleTemplateRepository;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.security.SecurityUtils;
import com.alumniweb.alumniweb.service.AuditEventPublisher;
import com.alumniweb.alumniweb.service.DeveloperRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeveloperRoleServiceImpl implements DeveloperRoleService {

    private final RoleTemplateRepository roleTemplateRepository;
    private final RoleTemplatePermissionRepository roleTemplatePermissionRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final AuditEventPublisher auditEventPublisher;

    @Override
    public List<RoleTemplateResponse> listAll() {
        return roleTemplateRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public RoleTemplateResponse getById(Long id) {
        RoleTemplate role = roleTemplateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Role template not found with id: " + id));
        return toResponse(role);
    }

    @Override
    @Transactional
    public RoleTemplateResponse create(RoleTemplateRequest request) {
        if (roleTemplateRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Role template already exists with code: " + request.code());
        }

        User currentUser = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));

        RoleTemplate role = RoleTemplate.builder()
                .name(request.name())
                .code(request.code())
                .description(request.description())
                .isSystem(request.isSystem())
                .isActive(request.isActive())
                .createdBy(currentUser)
                .build();

        RoleTemplate saved = roleTemplateRepository.save(role);

        auditEventPublisher.publish(AuditLog.builder()
                .user(currentUser)
                .action("CREATE_ROLE_TEMPLATE")
                .category(AuditCategory.USER_ACTION)
                .logLevel(AuditLogLevel.INFO)
                .entityType("RoleTemplate")
                .entityId(saved.getId())
                .newValues("{\"code\":\"" + request.code() + "\",\"name\":\"" + request.name() + "\"}")
                .build());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public RoleTemplateResponse update(Long id, RoleTemplateRequest request) {
        RoleTemplate role = roleTemplateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Role template not found with id: " + id));

        User currentUser = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));

        String oldValues = "{\"name\":\"" + role.getName() + "\"}";
        role.setName(request.name());
        role.setCode(request.code());
        role.setDescription(request.description());
        role.setSystem(request.isSystem());
        role.setActive(request.isActive());

        RoleTemplate saved = roleTemplateRepository.save(role);

        auditEventPublisher.publish(AuditLog.builder()
                .user(currentUser)
                .action("UPDATE_ROLE_TEMPLATE")
                .category(AuditCategory.USER_ACTION)
                .logLevel(AuditLogLevel.INFO)
                .entityType("RoleTemplate")
                .entityId(id)
                .oldValues(oldValues)
                .newValues("{\"name\":\"" + request.name() + "\"}")
                .build());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!roleTemplateRepository.existsById(id)) {
            throw new NoSuchElementException("Role template not found with id: " + id);
        }

        User currentUser = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));

        roleTemplatePermissionRepository.findByRoleTemplateId(id)
                .forEach(roleTemplatePermissionRepository::delete);
        roleTemplateRepository.deleteById(id);

        auditEventPublisher.publish(AuditLog.builder()
                .user(currentUser)
                .action("DELETE_ROLE_TEMPLATE")
                .category(AuditCategory.USER_ACTION)
                .logLevel(AuditLogLevel.INFO)
                .entityType("RoleTemplate")
                .entityId(id)
                .build());
    }

    @Override
    @Transactional
    public RoleTemplateResponse managePermissions(Long id, RoleTemplatePermissionRequest request) {
        RoleTemplate role = roleTemplateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Role template not found with id: " + id));

        User currentUser = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));

        List<RoleTemplatePermission> existing = roleTemplatePermissionRepository.findByRoleTemplateId(id);
        existing.forEach(roleTemplatePermissionRepository::delete);

        List<RoleTemplatePermission> newPermissions = new ArrayList<>();
        for (Long permissionId : request.permissionIds()) {
            Permission permission = permissionRepository.findById(permissionId)
                    .orElseThrow(() -> new NoSuchElementException("Permission not found with id: " + permissionId));

            RoleTemplatePermission rtp = RoleTemplatePermission.builder()
                    .roleTemplate(role)
                    .permission(permission)
                    .granted(request.granted())
                    .build();
            newPermissions.add(roleTemplatePermissionRepository.save(rtp));
        }

        auditEventPublisher.publish(AuditLog.builder()
                .user(currentUser)
                .action("MANAGE_ROLE_PERMISSIONS")
                .category(AuditCategory.USER_ACTION)
                .logLevel(AuditLogLevel.INFO)
                .entityType("RoleTemplate")
                .entityId(id)
                .newValues("{\"permissionIds\":" + request.permissionIds() + ",\"granted\":" + request.granted() + "}")
                .build());

        return toResponse(role);
    }

    private RoleTemplateResponse toResponse(RoleTemplate role) {
        List<Long> permissionIds = roleTemplatePermissionRepository.findByRoleTemplateId(role.getId()).stream()
                .map(rtp -> rtp.getPermission().getId())
                .toList();

        return new RoleTemplateResponse(
                role.getId(),
                role.getName(),
                role.getCode(),
                role.getDescription(),
                role.isSystem(),
                role.isActive(),
                permissionIds,
                role.getCreatedAt(),
                role.getUpdatedAt()
        );
    }
}
