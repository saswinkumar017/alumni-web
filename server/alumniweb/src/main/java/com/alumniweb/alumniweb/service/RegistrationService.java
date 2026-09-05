package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.auth.RegisterRequest;
import com.alumniweb.alumniweb.dto.auth.RegisterResponse;

public interface RegistrationService {

    RegisterResponse register(RegisterRequest request);

    RegisterResponse verifyEmail(String token);
}
