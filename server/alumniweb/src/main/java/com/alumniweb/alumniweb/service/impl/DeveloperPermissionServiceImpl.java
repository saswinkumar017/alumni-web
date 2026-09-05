package com.alumniweb.alumniweb.service.impl;

import com.alumniweb.alumniweb.dto.developer.PermissionRequest;
import com.alumniweb.alumniweb.dto.developer.PermissionResponse;
import com.alumniweb.alumniweb.dto.developer.PermissionCategoryRequest;
import com.alumniweb.alumniweb.dto.developer.PermissionCategoryResponse;
import com.alumniweb.alumniweb.model.AuditLog;
import com.alumniweb.alumniweb.model.Permission;
import com.alumniweb.alumniweb.model.PermissionCategory;
import com.alumniweb.alumniweb.model.PermissionGroup;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.enums.AuditCategory;
import com.alumniweb.alumniweb.model.enums.AuditLogLevel;
import com.alumniweb.alumniweb.model.repository.PermissionCategoryRepository;
import com.alumniweb.alumniweb.model.repository.PermissionGroupRepository;
import com.alumniweb.alumniweb.model.repository.PermissionRepository;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.security.SecurityUtils;
import com.alumniweb.alumniweb.service.AuditEventPublisher;
import com.alumniweb.alumniweb.service.DeveloperPermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeveloperPermissionServiceImpl implements DeveloperPermissionService {

    private final PermissionRepository permissionRepository;
    private final PermissionGroupRepository permissionGroupRepository;
    private final PermissionCategoryRepository permissionCategoryRepository;
    private final UserRepository userRepository;
    private final AuditEventPublisher auditEventPublisher;

    @Override
    public List<PermissionResponse> listAll() {
        return permissionRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public PermissionResponse getById(Long id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Permission not found with id: " + id));
        return toResponse(permission);
    }

    @Override
    @Transactional
    public PermissionResponse create(PermissionRequest request) {
        if (permissionRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Permission already exists with code: " + request.code());
        }

        PermissionGroup group = permissionGroupRepository.findById(request.groupId())
                .orElseThrow(() -> new NoSuchElementException("Permission group not found with id: " + request.groupId()));

        User currentUser = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));

        Permission permission = Permission.builder()
                .group(group)
                .name(request.name())
                .code(request.code())
                .description(request.description())
                .action(request.action())
                .resource(request.resource())
                .riskLevel(request.riskLevel())
                .build();

        Permission saved = permissionRepository.save(permission);

        auditEventPublisher.publish(AuditLog.builder()
                .user(currentUser)
                .action("CREATE_PERMISSION")
                .category(AuditCategory.USER_ACTION)
                .logLevel(AuditLogLevel.INFO)
                .entityType("Permission")
                .entityId(saved.getId())
                .newValues("{\"code\":\"" + request.code() + "\",\"name\":\"" + request.name() + "\"}")
                .build());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public PermissionResponse update(Long id, PermissionRequest request) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Permission not found with id: " + id));

        PermissionGroup group = permissionGroupRepository.findById(request.groupId())
                .orElseThrow(() -> new NoSuchElementException("Permission group not found with id: " + request.groupId()));

        User currentUser = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));

        permission.setGroup(group);
        permission.setName(request.name());
        permission.setCode(request.code());
        permission.setDescription(request.description());
        permission.setAction(request.action());
        permission.setResource(request.resource());
        permission.setRiskLevel(request.riskLevel());

        Permission saved = permissionRepository.save(permission);

        auditEventPublisher.publish(AuditLog.builder()
                .user(currentUser)
                .action("UPDATE_PERMISSION")
                .category(AuditCategory.USER_ACTION)
                .logLevel(AuditLogLevel.INFO)
                .entityType("Permission")
                .entityId(id)
                .newValues("{\"code\":\"" + request.code() + "\"}")
                .build());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!permissionRepository.existsById(id)) {
            throw new NoSuchElementException("Permission not found with id: " + id);
        }

        User currentUser = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));

        permissionRepository.deleteById(id);

        auditEventPublisher.publish(AuditLog.builder()
                .user(currentUser)
                .action("DELETE_PERMISSION")
                .category(AuditCategory.USER_ACTION)
                .logLevel(AuditLogLevel.INFO)
                .entityType("Permission")
                .entityId(id)
                .build());
    }

    @Override
    public List<PermissionCategoryResponse> listCategories() {
        return permissionCategoryRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(this::toCategoryResponse)
                .toList();
    }

    @Override
    @Transactional
    public PermissionCategoryResponse createCategory(PermissionCategoryRequest request) {
        if (permissionCategoryRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Permission category already exists with code: " + request.code());
        }

        PermissionCategory category = PermissionCategory.builder()
                .name(request.name())
                .code(request.code())
                .description(request.description())
                .displayOrder(request.displayOrder())
                .build();

        PermissionCategory saved = permissionCategoryRepository.save(category);
        return toCategoryResponse(saved);
    }

    @Override
    @Transactional
    public PermissionCategoryResponse updateCategory(Long id, PermissionCategoryRequest request) {
        PermissionCategory category = permissionCategoryRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Permission category not found with id: " + id));

        category.setName(request.name());
        category.setCode(request.code());
        category.setDescription(request.description());
        category.setDisplayOrder(request.displayOrder());

        PermissionCategory saved = permissionCategoryRepository.save(category);
        return toCategoryResponse(saved);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        if (!permissionCategoryRepository.existsById(id)) {
            throw new NoSuchElementException("Permission category not found with id: " + id);
        }
        permissionCategoryRepository.deleteById(id);
    }

    private PermissionResponse toResponse(Permission permission) {
        return new PermissionResponse(
                permission.getId(),
                permission.getGroup().getId(),
                permission.getGroup().getName(),
                permission.getName(),
                permission.getCode(),
                permission.getDescription(),
                permission.getAction(),
                permission.getResource(),
                permission.getRiskLevel(),
                permission.getCreatedAt(),
                permission.getUpdatedAt()
        );
    }

    private PermissionCategoryResponse toCategoryResponse(PermissionCategory category) {
        return new PermissionCategoryResponse(
                category.getId(),
                category.getName(),
                category.getCode(),
                category.getDescription(),
                category.getDisplayOrder(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
