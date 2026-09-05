package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.common.ApiResponse;
import com.alumniweb.alumniweb.dto.developer.FeatureFlagRequest;
import com.alumniweb.alumniweb.dto.developer.FeatureFlagResponse;
import com.alumniweb.alumniweb.dto.developer.FeatureFlagToggleRequest;
import com.alumniweb.alumniweb.security.SecurityConstants;
import com.alumniweb.alumniweb.service.DeveloperFeatureFlagService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/developer/feature-flags")
@PreAuthorize("hasRole('" + SecurityConstants.ROLE_DEVELOPER + "')")
public class DeveloperFeatureFlagController {

    private final DeveloperFeatureFlagService developerFeatureFlagService;

    public DeveloperFeatureFlagController(DeveloperFeatureFlagService developerFeatureFlagService) {
        this.developerFeatureFlagService = developerFeatureFlagService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FeatureFlagResponse>>> listAll() {
        return ResponseEntity.ok(ApiResponse.success(developerFeatureFlagService.listAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FeatureFlagResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(developerFeatureFlagService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FeatureFlagResponse>> create(
            @Valid @RequestBody FeatureFlagRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Feature flag created", developerFeatureFlagService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FeatureFlagResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody FeatureFlagRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Feature flag updated", developerFeatureFlagService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        developerFeatureFlagService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Feature flag deleted", null));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<FeatureFlagResponse>> toggle(
            @PathVariable Long id,
            @Valid @RequestBody FeatureFlagToggleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Feature flag toggled", developerFeatureFlagService.toggle(id, request.enabled())));
    }
}
