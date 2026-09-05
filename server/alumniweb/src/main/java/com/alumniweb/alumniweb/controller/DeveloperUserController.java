package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.common.ApiResponse;
import com.alumniweb.alumniweb.dto.common.PageResponse;
import com.alumniweb.alumniweb.dto.developer.DeveloperUserResponse;
import com.alumniweb.alumniweb.dto.developer.DeveloperUserUpdateRequest;
import com.alumniweb.alumniweb.dto.developer.DeveloperUserRoleRequest;
import com.alumniweb.alumniweb.model.enums.UserRole;
import com.alumniweb.alumniweb.security.SecurityConstants;
import com.alumniweb.alumniweb.service.DeveloperUserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/developer/users")
@PreAuthorize("hasRole('" + SecurityConstants.ROLE_DEVELOPER + "')")
public class DeveloperUserController {

    private final DeveloperUserService developerUserService;

    public DeveloperUserController(DeveloperUserService developerUserService) {
        this.developerUserService = developerUserService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<DeveloperUserResponse>> listUsers(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<DeveloperUserResponse> resultPage = developerUserService.listUsers(query, PageRequest.of(page, size));
        return ResponseEntity.ok(PageResponse.of(
                resultPage.getContent(),
                resultPage.getNumber(),
                resultPage.getSize(),
                resultPage.getTotalElements()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeveloperUserResponse>> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(developerUserService.getUser(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DeveloperUserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody DeveloperUserUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("User updated", developerUserService.updateUser(id, request)));
    }

    @PostMapping("/{id}/suspend")
    public ResponseEntity<ApiResponse<DeveloperUserResponse>> suspendUser(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(ApiResponse.success("User suspended", developerUserService.suspendUser(id, reason)));
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<DeveloperUserResponse>> activateUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("User activated", developerUserService.activateUser(id)));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<DeveloperUserResponse>> changeRole(
            @PathVariable Long id,
            @Valid @RequestBody DeveloperUserRoleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Role changed", developerUserService.changeRole(id, request.role())));
    }
}
