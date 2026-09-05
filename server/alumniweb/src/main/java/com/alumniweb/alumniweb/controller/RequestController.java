package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.common.ErrorResponse;
import com.alumniweb.alumniweb.dto.common.ValidationErrorResponse;
import com.alumniweb.alumniweb.dto.request.EmailCorrectionRequest;
import com.alumniweb.alumniweb.dto.request.NewAlumniRequest;
import com.alumniweb.alumniweb.dto.request.RequestStatusResponse;
import com.alumniweb.alumniweb.service.RequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/request")
@Tag(name = "Requests", description = "Endpoints for submitting correction and new alumni requests")
public class RequestController {

    private final RequestService requestService;

    public RequestController(RequestService requestService) {
        this.requestService = requestService;
    }

    @PostMapping("/email-correction")
    @Operation(summary = "Request email correction", description = "Submits a request to correct the email address " +
            "associated with an alumni record.",
            security = {})
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Email correction request submitted"),
            @ApiResponse(responseCode = "400", description = "Invalid request body",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Alumni record not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<RequestStatusResponse> createEmailCorrection(
            @Valid @RequestBody EmailCorrectionRequest request) {
        RequestStatusResponse response = requestService.createEmailCorrectionRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/new-alumni")
    @Operation(summary = "Request new alumni record", description = "Submits a request to create a new alumni record " +
            "for a graduate not yet in the system.",
            security = {})
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "New alumni request submitted"),
            @ApiResponse(responseCode = "400", description = "Invalid request body",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class)))
    })
    public ResponseEntity<RequestStatusResponse> createNewAlumni(
            @Valid @RequestBody NewAlumniRequest request) {
        RequestStatusResponse response = requestService.createNewAlumniRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
