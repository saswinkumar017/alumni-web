package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.admin.ReportSummaryResponse;
import com.alumniweb.alumniweb.security.SecurityConstants;
import com.alumniweb.alumniweb.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('" + SecurityConstants.ROLE_ADMIN + "')")
@RequiredArgsConstructor
public class AdminReportController {

    private final ReportService reportService;

    @GetMapping("/reports/summary")
    public ResponseEntity<ReportSummaryResponse> getReportSummary() {
        return ResponseEntity.ok(reportService.getReportSummary());
    }
}
