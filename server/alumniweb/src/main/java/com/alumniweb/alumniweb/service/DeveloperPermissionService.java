package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.developer.PermissionCategoryRequest;
import com.alumniweb.alumniweb.dto.developer.PermissionCategoryResponse;
import com.alumniweb.alumniweb.dto.developer.PermissionRequest;
import com.alumniweb.alumniweb.dto.developer.PermissionResponse;

import java.util.List;

public interface DeveloperPermissionService {
    List<PermissionResponse> listAll();
    PermissionResponse getById(Long id);
    PermissionResponse create(PermissionRequest request);
    PermissionResponse update(Long id, PermissionRequest request);
    void delete(Long id);
    List<PermissionCategoryResponse> listCategories();
    PermissionCategoryResponse createCategory(PermissionCategoryRequest request);
    PermissionCategoryResponse updateCategory(Long id, PermissionCategoryRequest request);
    void deleteCategory(Long id);
}
