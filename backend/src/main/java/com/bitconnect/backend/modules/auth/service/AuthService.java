package com.bitconnect.backend.modules.auth.service;

import com.bitconnect.backend.modules.auth.dto.*;
import com.bitconnect.backend.modules.user.entity.RoleName;

import java.util.UUID;

/**
 * Service handling user registration, authentication, and session identity queries.
 *
 * <p>Both student and alumni registration now require institutional verification
 * against the college master database before account creation.
 */
public interface AuthService {

    /**
     * Registers a new alumni user.
     * Requires institutional verification against the college alumni master data.
     * An account is NOT created if verification fails.
     */
    AuthResponse registerAlumni(AlumniRegisterRequest request);

    /**
     * Registers a new student user.
     * Requires institutional verification against the college student master data.
     * An account is NOT created if verification fails.
     */
    AuthResponse registerStudent(StudentRegisterRequest request);

    /**
     * General login — authenticates any role.
     * Used by Admin, Watchman, Faculty internal routes.
     */
    AuthResponse login(LoginRequest request);

    /**
     * Role-scoped login — authenticates credentials AND verifies the user has the required role.
     * Used by /student/login (requiresRole=ROLE_STUDENT) and /alumni/login (ROLE_ALUMNI).
     * Returns 401 if credentials are valid but the user does not have the required role.
     */
    AuthResponse loginWithRoleCheck(LoginRequest request, RoleName requiredRole);

    UserSummaryResponse getCurrentUser(UUID userId);
}
