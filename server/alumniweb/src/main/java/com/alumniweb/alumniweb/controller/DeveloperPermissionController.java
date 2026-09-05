package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.common.ApiResponse;
import com.alumniweb.alumniweb.dto.developer.PermissionCategoryRequest;
import com.alumniweb.alumniweb.dto.developer.PermissionCategoryResponse;
import com.alumniweb.alumniweb.dto.developer.PermissionRequest;
import com.alumniweb.alumniweb.dto.developer.PermissionResponse;
import com.alumniweb.alumniweb.security.SecurityConstants;
import com.alumniweb.alumniweb.service.DeveloperPermissionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/developer/permissions")
@PreAuthorize("hasRole('" + SecurityConstants.ROLE_DEVELOPER + "')")
public class DeveloperPermissionController {

    private final DeveloperPermissionService developerPermissionService;

    public DeveloperPermissionController(DeveloperPermissionService developerPermissionService) {
        this.developerPermissionService = developerPermissionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PermissionResponse>>> listAll() {
        return ResponseEntity.ok(ApiResponse.success(developerPermissionService.listAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PermissionResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(developerPermissionService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PermissionResponse>> create(
            @Valid @RequestBody PermissionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Permission created", developerPermissionService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PermissionResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PermissionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Permission updated", developerPermissionService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        developerPermissionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Permission deleted", null));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<PermissionCategoryResponse>>> listCategories() {
        return ResponseEntity.ok(ApiResponse.success(developerPermissionService.listCategories()));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<PermissionCategoryResponse>> createCategory(
            @Valid @RequestBody PermissionCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Category created", developerPermissionService.createCategory(request)));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<PermissionCategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody PermissionCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Category updated", developerPermissionService.updateCategory(id, request)));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        developerPermissionService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted", null));
    }
}
