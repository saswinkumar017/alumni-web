package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.common.ApiResponse;
import com.alumniweb.alumniweb.dto.developer.RoleTemplatePermissionRequest;
import com.alumniweb.alumniweb.dto.developer.RoleTemplateRequest;
import com.alumniweb.alumniweb.dto.developer.RoleTemplateResponse;
import com.alumniweb.alumniweb.security.SecurityConstants;
import com.alumniweb.alumniweb.service.DeveloperRoleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/developer/roles")
@PreAuthorize("hasRole('" + SecurityConstants.ROLE_DEVELOPER + "')")
public class DeveloperRoleController {

    private final DeveloperRoleService developerRoleService;

    public DeveloperRoleController(DeveloperRoleService developerRoleService) {
        this.developerRoleService = developerRoleService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleTemplateResponse>>> listAll() {
        return ResponseEntity.ok(ApiResponse.success(developerRoleService.listAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleTemplateResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(developerRoleService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoleTemplateResponse>> create(
            @Valid @RequestBody RoleTemplateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Role template created", developerRoleService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleTemplateResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody RoleTemplateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Role template updated", developerRoleService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        developerRoleService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Role template deleted", null));
    }

    @PutMapping("/{id}/permissions")
    public ResponseEntity<ApiResponse<RoleTemplateResponse>> managePermissions(
            @PathVariable Long id,
            @Valid @RequestBody RoleTemplatePermissionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Permissions updated", developerRoleService.managePermissions(id, request)));
    }
}
