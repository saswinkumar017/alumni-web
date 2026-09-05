package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.common.ApiResponse;
import com.alumniweb.alumniweb.dto.developer.MonitoringResponse;
import com.alumniweb.alumniweb.security.SecurityConstants;
import com.alumniweb.alumniweb.service.DeveloperMonitoringService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/developer/monitoring")
@PreAuthorize("hasRole('" + SecurityConstants.ROLE_DEVELOPER + "')")
public class DeveloperMonitoringController {

    private final DeveloperMonitoringService developerMonitoringService;

    public DeveloperMonitoringController(DeveloperMonitoringService developerMonitoringService) {
        this.developerMonitoringService = developerMonitoringService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<MonitoringResponse>> getMonitoringData() {
        return ResponseEntity.ok(ApiResponse.success(developerMonitoringService.getMonitoringData()));
    }
}
