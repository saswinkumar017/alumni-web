package com.alumniweb.alumniweb.service.impl;

import com.alumniweb.alumniweb.dto.developer.FeatureFlagRequest;
import com.alumniweb.alumniweb.dto.developer.FeatureFlagResponse;
import com.alumniweb.alumniweb.model.AuditLog;
import com.alumniweb.alumniweb.model.FeatureFlag;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.enums.AuditCategory;
import com.alumniweb.alumniweb.model.enums.AuditLogLevel;
import com.alumniweb.alumniweb.model.repository.FeatureFlagRepository;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.security.SecurityUtils;
import com.alumniweb.alumniweb.service.AuditEventPublisher;
import com.alumniweb.alumniweb.service.DeveloperFeatureFlagService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeveloperFeatureFlagServiceImpl implements DeveloperFeatureFlagService {

    private final FeatureFlagRepository featureFlagRepository;
    private final UserRepository userRepository;
    private final AuditEventPublisher auditEventPublisher;

    @Override
    public List<FeatureFlagResponse> listAll() {
        return featureFlagRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public FeatureFlagResponse getById(Long id) {
        FeatureFlag flag = featureFlagRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Feature flag not found with id: " + id));
        return toResponse(flag);
    }

    @Override
    @Transactional
    public FeatureFlagResponse create(FeatureFlagRequest request) {
        if (featureFlagRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Feature flag already exists with code: " + request.code());
        }

        User currentUser = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));

        FeatureFlag flag = FeatureFlag.builder()
                .name(request.name())
                .code(request.code())
                .description(request.description())
                .isEnabled(request.isEnabled())
                .rolloutPercentage(request.rolloutPercentage())
                .targetAudience(request.targetAudience())
                .configJson(request.configJson())
                .createdBy(currentUser)
                .build();

        FeatureFlag saved = featureFlagRepository.save(flag);

        auditEventPublisher.publish(AuditLog.builder()
                .user(currentUser)
                .action("CREATE_FEATURE_FLAG")
                .category(AuditCategory.USER_ACTION)
                .logLevel(AuditLogLevel.INFO)
                .entityType("FeatureFlag")
                .entityId(saved.getId())
                .newValues("{\"code\":\"" + request.code() + "\",\"name\":\"" + request.name() + "\"}")
                .build());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public FeatureFlagResponse update(Long id, FeatureFlagRequest request) {
        FeatureFlag flag = featureFlagRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Feature flag not found with id: " + id));

        User currentUser = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));

        String oldValues = "{\"enabled\":" + flag.isEnabled() + "}";
        flag.setName(request.name());
        flag.setCode(request.code());
        flag.setDescription(request.description());
        flag.setEnabled(request.isEnabled());
        flag.setRolloutPercentage(request.rolloutPercentage());
        flag.setTargetAudience(request.targetAudience());
        flag.setConfigJson(request.configJson());

        FeatureFlag saved = featureFlagRepository.save(flag);

        auditEventPublisher.publish(AuditLog.builder()
                .user(currentUser)
                .action("UPDATE_FEATURE_FLAG")
                .category(AuditCategory.USER_ACTION)
                .logLevel(AuditLogLevel.INFO)
                .entityType("FeatureFlag")
                .entityId(id)
                .oldValues(oldValues)
                .newValues("{\"enabled\":" + request.isEnabled() + "}")
                .build());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!featureFlagRepository.existsById(id)) {
            throw new NoSuchElementException("Feature flag not found with id: " + id);
        }

        User currentUser = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));

        featureFlagRepository.deleteById(id);

        auditEventPublisher.publish(AuditLog.builder()
                .user(currentUser)
                .action("DELETE_FEATURE_FLAG")
                .category(AuditCategory.USER_ACTION)
                .logLevel(AuditLogLevel.INFO)
                .entityType("FeatureFlag")
                .entityId(id)
                .build());
    }

    @Override
    @Transactional
    public FeatureFlagResponse toggle(Long id, boolean enabled) {
        FeatureFlag flag = featureFlagRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Feature flag not found with id: " + id));

        User currentUser = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));

        String oldValues = "{\"enabled\":" + flag.isEnabled() + "}";
        flag.setEnabled(enabled);
        FeatureFlag saved = featureFlagRepository.save(flag);

        auditEventPublisher.publish(AuditLog.builder()
                .user(currentUser)
                .action("TOGGLE_FEATURE_FLAG")
                .category(AuditCategory.USER_ACTION)
                .logLevel(AuditLogLevel.INFO)
                .entityType("FeatureFlag")
                .entityId(id)
                .oldValues(oldValues)
                .newValues("{\"enabled\":" + enabled + "}")
                .build());

        return toResponse(saved);
    }

    private FeatureFlagResponse toResponse(FeatureFlag flag) {
        return new FeatureFlagResponse(
                flag.getId(),
                flag.getName(),
                flag.getCode(),
                flag.getDescription(),
                flag.isEnabled(),
                flag.getRolloutPercentage(),
                flag.getTargetAudience(),
                flag.getConfigJson(),
                flag.getCreatedAt(),
                flag.getUpdatedAt()
        );
    }
}
