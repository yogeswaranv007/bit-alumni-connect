package com.bitconnect.backend.modules.auth.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.modules.auth.dto.*;
import com.bitconnect.backend.modules.auth.service.AuthService;
import com.bitconnect.backend.modules.user.entity.RoleName;
import com.bitconnect.backend.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller managing authentication:
 * <ul>
 *   <li>{@code POST /auth/register}          — alumni registration (institutional verification required)</li>
 *   <li>{@code POST /auth/register/student}   — student registration (institutional verification required)</li>
 *   <li>{@code POST /auth/login}              — general login (Admin/Watchman/Faculty internal routes)</li>
 *   <li>{@code POST /auth/login/student}      — student portal login (ROLE_STUDENT enforced)</li>
 *   <li>{@code POST /auth/login/alumni}       — alumni portal login (ROLE_ALUMNI enforced)</li>
 *   <li>{@code GET  /auth/me}                 — current user identity</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Registration, login, and session identity endpoints")
public class AuthController {

    private final AuthService authService;

    // ── Registration ──────────────────────────────────────────────────────────

    @PostMapping("/register")
    @Operation(
        summary = "Register a new alumni account",
        description = "Verifies the provided register number + name + DOB against the college alumni " +
                      "master database. Account creation is refused if institutional verification fails.")
    public ResponseEntity<ApiResponse<AuthResponse>> registerAlumni(
            @Valid @RequestBody AlumniRegisterRequest request) {
        AuthResponse response = authService.registerAlumni(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Alumni registration successful. Please complete your profile.", response));
    }

    @PostMapping("/register/student")
    @Operation(
        summary = "Register a new student account",
        description = "Verifies the provided register number + name + DOB against the college student " +
                      "master database. Account creation is refused if institutional verification fails.")
    public ResponseEntity<ApiResponse<AuthResponse>> registerStudent(
            @Valid @RequestBody StudentRegisterRequest request) {
        AuthResponse response = authService.registerStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student registration successful. Please complete your profile.", response));
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @PostMapping("/login")
    @Operation(
        summary = "General login",
        description = "Authenticates any role. Used by Admin, Watchman, Faculty internal routes.")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/login/student")
    @Operation(
        summary = "Student portal login — ROLE_STUDENT only",
        description = "Authenticates credentials AND verifies the account has ROLE_STUDENT. " +
                      "Returns 401 if credentials are valid but the account is not a Student.")
    public ResponseEntity<ApiResponse<AuthResponse>> loginStudent(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.loginWithRoleCheck(request, RoleName.ROLE_STUDENT);
        return ResponseEntity.ok(ApiResponse.success("Student login successful", response));
    }

    @PostMapping("/login/alumni")
    @Operation(
        summary = "Alumni portal login — ROLE_ALUMNI only",
        description = "Authenticates credentials AND verifies the account has ROLE_ALUMNI. " +
                      "Returns 401 if credentials are valid but the account is not an Alumni.")
    public ResponseEntity<ApiResponse<AuthResponse>> loginAlumni(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.loginWithRoleCheck(request, RoleName.ROLE_ALUMNI);
        return ResponseEntity.ok(ApiResponse.success("Alumni login successful", response));
    }

    // ── Current User ─────────────────────────────────────────────────────────

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Get current authenticated user",
        description = "Returns safe account identity and assigned roles for the bearer token principal.")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> getCurrentUser() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        UserSummaryResponse response = authService.getCurrentUser(currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
