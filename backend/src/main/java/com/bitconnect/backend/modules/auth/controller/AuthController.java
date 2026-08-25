package com.bitconnect.backend.modules.auth.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.modules.auth.dto.AuthResponse;
import com.bitconnect.backend.modules.auth.dto.LoginRequest;
import com.bitconnect.backend.modules.auth.dto.RegisterRequest;
import com.bitconnect.backend.modules.auth.dto.UserSummaryResponse;
import com.bitconnect.backend.modules.auth.service.AuthService;
import com.bitconnect.backend.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller managing authentication operations: registration, login, and profile introspection.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for user registration, authentication, and session identity")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new alumni user", description = "Creates a new user account with default ROLE_ALUMNI privilege and returns a JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user credentials", description = "Validates email and password, returning a signed JWT access token and user metadata")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get current authenticated user", description = "Returns safe account identity and assigned roles for the bearer token principal")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> getCurrentUser() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        UserSummaryResponse response = authService.getCurrentUser(currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
