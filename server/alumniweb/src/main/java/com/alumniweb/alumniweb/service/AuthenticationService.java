package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.auth.LoginRequest;
import com.alumniweb.alumniweb.dto.auth.LoginResponse;
import com.alumniweb.alumniweb.dto.auth.TokenPair;

public interface AuthenticationService {

    LoginResponse authenticate(LoginRequest request);

    TokenPair refreshAccessToken(String refreshToken);
}
