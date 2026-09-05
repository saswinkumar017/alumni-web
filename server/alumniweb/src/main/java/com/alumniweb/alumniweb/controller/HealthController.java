package com.alumniweb.alumniweb.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Health", description = "Health check endpoint")
public class HealthController {

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Returns the service status.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Service is healthy")
    })
    public ResponseEntity<com.alumniweb.alumniweb.dto.common.ApiResponse<String>> health() {
        return ResponseEntity.ok(com.alumniweb.alumniweb.dto.common.ApiResponse.success("healthy"));
    }
}
