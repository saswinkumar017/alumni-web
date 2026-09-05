package com.alumniweb.alumniweb.service.impl;

import com.alumniweb.alumniweb.dto.developer.PlatformConfigRequest;
import com.alumniweb.alumniweb.dto.developer.PlatformConfigResponse;
import com.alumniweb.alumniweb.model.PlatformConfig;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.repository.PlatformConfigRepository;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.security.SecurityUtils;
import com.alumniweb.alumniweb.service.DeveloperConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeveloperConfigServiceImpl implements DeveloperConfigService {

    private final PlatformConfigRepository platformConfigRepository;
    private final UserRepository userRepository;

    @Override
    public List<PlatformConfigResponse> listAll() {
        return platformConfigRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<PlatformConfigResponse> listPublic() {
        return platformConfigRepository.findByIsSensitive(false).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public PlatformConfigResponse update(String key, PlatformConfigRequest request) {
        PlatformConfig config = platformConfigRepository.findByKey(key)
                .orElseThrow(() -> new NoSuchElementException("Config not found with key: " + key));

        config.setValue(request.value());
        config.setValueType(request.valueType());
        config.setCategory(request.category());
        config.setDescription(request.description());
        config.setSensitive(request.isSensitive());
        config.setReadonly(request.isReadonly());

        PlatformConfig saved = platformConfigRepository.save(config);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public PlatformConfigResponse create(PlatformConfigRequest request) {
        if (platformConfigRepository.existsByKey(request.key())) {
            throw new IllegalArgumentException("Config already exists with key: " + request.key());
        }

        User currentUser = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));

        PlatformConfig config = PlatformConfig.builder()
                .key(request.key())
                .value(request.value())
                .valueType(request.valueType())
                .category(request.category())
                .description(request.description())
                .isSensitive(request.isSensitive())
                .isReadonly(request.isReadonly())
                .createdBy(currentUser)
                .build();

        PlatformConfig saved = platformConfigRepository.save(config);
        return toResponse(saved);
    }

    private PlatformConfigResponse toResponse(PlatformConfig config) {
        return new PlatformConfigResponse(
                config.getId(),
                config.getKey(),
                config.getValue(),
                config.getValueType(),
                config.getCategory(),
                config.getDescription(),
                config.isSensitive(),
                config.isReadonly(),
                config.getCreatedAt(),
                config.getUpdatedAt()
        );
    }
}
