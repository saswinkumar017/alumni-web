package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.common.ApiResponse;
import com.alumniweb.alumniweb.dto.developer.PlatformConfigRequest;
import com.alumniweb.alumniweb.dto.developer.PlatformConfigResponse;
import com.alumniweb.alumniweb.security.SecurityConstants;
import com.alumniweb.alumniweb.service.DeveloperConfigService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/developer/config")
@PreAuthorize("hasRole('" + SecurityConstants.ROLE_DEVELOPER + "')")
public class DeveloperConfigController {

    private final DeveloperConfigService developerConfigService;

    public DeveloperConfigController(DeveloperConfigService developerConfigService) {
        this.developerConfigService = developerConfigService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PlatformConfigResponse>>> listAll() {
        return ResponseEntity.ok(ApiResponse.success(developerConfigService.listAll()));
    }

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<List<PlatformConfigResponse>>> listPublic() {
        return ResponseEntity.ok(ApiResponse.success(developerConfigService.listPublic()));
    }

    @PutMapping("/{key}")
    public ResponseEntity<ApiResponse<PlatformConfigResponse>> update(
            @PathVariable String key,
            @Valid @RequestBody PlatformConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Config updated", developerConfigService.update(key, request)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PlatformConfigResponse>> create(
            @Valid @RequestBody PlatformConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Config created", developerConfigService.create(request)));
    }
}
