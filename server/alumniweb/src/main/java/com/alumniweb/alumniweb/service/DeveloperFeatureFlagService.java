package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.developer.FeatureFlagRequest;
import com.alumniweb.alumniweb.dto.developer.FeatureFlagResponse;

import java.util.List;

public interface DeveloperFeatureFlagService {
    List<FeatureFlagResponse> listAll();
    FeatureFlagResponse getById(Long id);
    FeatureFlagResponse create(FeatureFlagRequest request);
    FeatureFlagResponse update(Long id, FeatureFlagRequest request);
    void delete(Long id);
    FeatureFlagResponse toggle(Long id, boolean enabled);
}
