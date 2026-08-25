package com.bitconnect.backend.security;

import com.bitconnect.backend.common.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

/**
 * Utility helper class for accessing current authenticated user details from SecurityContext.
 */
public final class SecurityUtils {

    private SecurityUtils() {
        // Prevent instantiation
    }

    public static Optional<UserPrincipal> getCurrentUserPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return Optional.empty();
        }

        return Optional.of(principal);
    }

    public static UserPrincipal getRequiredCurrentUserPrincipal() {
        return getCurrentUserPrincipal()
                .orElseThrow(() -> new UnauthorizedException("User is not authenticated"));
    }

    public static UUID getCurrentUserId() {
        return getRequiredCurrentUserPrincipal().getId();
    }

    public static String getCurrentUserEmail() {
        return getRequiredCurrentUserPrincipal().getEmail();
    }

    public static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated()
                && (authentication.getPrincipal() instanceof UserPrincipal);
    }
}
