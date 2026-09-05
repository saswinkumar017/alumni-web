package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.developer.PlatformConfigRequest;
import com.alumniweb.alumniweb.dto.developer.PlatformConfigResponse;

import java.util.List;

public interface DeveloperConfigService {
    List<PlatformConfigResponse> listAll();
    List<PlatformConfigResponse> listPublic();
    PlatformConfigResponse update(String key, PlatformConfigRequest request);
    PlatformConfigResponse create(PlatformConfigRequest request);
}
