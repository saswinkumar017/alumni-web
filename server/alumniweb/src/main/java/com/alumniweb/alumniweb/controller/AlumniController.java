package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.search.AlumniProfileResponse;
import com.alumniweb.alumniweb.service.AlumniSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/alumni")
@Tag(name = "Alumni", description = "Public endpoints for alumni profiles")
public class AlumniController {

    private final AlumniSearchService alumniSearchService;

    public AlumniController(AlumniSearchService alumniSearchService) {
        this.alumniSearchService = alumniSearchService;
    }

    @GetMapping
    @Operation(summary = "List all alumni profiles", description = "Returns all non-deleted alumni profiles.",
            security = {})
    public ResponseEntity<List<AlumniProfileResponse>> getAllAlumniProfiles() {
        return ResponseEntity.ok(alumniSearchService.getAllAlumniProfiles());
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get an alumni profile by register number", description = "Returns a single alumni profile.",
            security = {})
    public ResponseEntity<AlumniProfileResponse> getAlumniProfile(@PathVariable("slug") String slug) {
        return ResponseEntity.ok(alumniSearchService.getAlumniProfile(slug));
    }
}