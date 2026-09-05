package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.profile.ProfileResponse;
import com.alumniweb.alumniweb.dto.profile.ProfileUpdateRequest;

public interface ProfileService {

    ProfileResponse getProfile(Long userId);

    ProfileResponse updateProfile(Long userId, ProfileUpdateRequest request);
}
