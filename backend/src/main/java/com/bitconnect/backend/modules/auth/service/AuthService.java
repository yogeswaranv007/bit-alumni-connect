package com.bitconnect.backend.modules.auth.service;

import com.bitconnect.backend.modules.auth.dto.AuthResponse;
import com.bitconnect.backend.modules.auth.dto.LoginRequest;
import com.bitconnect.backend.modules.auth.dto.RegisterRequest;
import com.bitconnect.backend.modules.auth.dto.UserSummaryResponse;

import java.util.UUID;

/**
 * Service handling user registration, authentication, and session identity queries.
 */
public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserSummaryResponse getCurrentUser(UUID userId);
}
