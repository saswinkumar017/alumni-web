package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.common.PageResponse;
import com.alumniweb.alumniweb.dto.common.ValidationErrorResponse;
import com.alumniweb.alumniweb.dto.search.AlumniSearchRequest;
import com.alumniweb.alumniweb.dto.search.AlumniSearchResponse;
import com.alumniweb.alumniweb.service.AlumniSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
@Tag(name = "Search", description = "Endpoints for searching alumni records")
public class AlumniSearchController {

    private final AlumniSearchService alumniSearchService;

    public AlumniSearchController(AlumniSearchService alumniSearchService) {
        this.alumniSearchService = alumniSearchService;
    }

    @GetMapping
    @Operation(summary = "Search alumni", description = "Searches and filters alumni records with pagination. " +
            "Supports search by name, department, batch, register number, and year of passing.",
            security = {})
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paginated search results returned"),
            @ApiResponse(responseCode = "400", description = "Invalid search parameters",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class)))
    })
    public ResponseEntity<PageResponse<AlumniSearchResponse>> search(
            @Valid AlumniSearchRequest request) {
        Page<AlumniSearchResponse> page = alumniSearchService.search(request);
        PageResponse<AlumniSearchResponse> response = PageResponse.of(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements()
        );
        return ResponseEntity.ok(response);
    }
}
