package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.developer.RoleTemplatePermissionRequest;
import com.alumniweb.alumniweb.dto.developer.RoleTemplateRequest;
import com.alumniweb.alumniweb.dto.developer.RoleTemplateResponse;

import java.util.List;

public interface DeveloperRoleService {
    List<RoleTemplateResponse> listAll();
    RoleTemplateResponse getById(Long id);
    RoleTemplateResponse create(RoleTemplateRequest request);
    RoleTemplateResponse update(Long id, RoleTemplateRequest request);
    void delete(Long id);
    RoleTemplateResponse managePermissions(Long id, RoleTemplatePermissionRequest request);
}
