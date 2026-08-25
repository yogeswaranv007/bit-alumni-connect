package com.bitconnect.backend.modules.auth.dto;

/**
 * Authentication response payload containing JWT access token and user metadata.
 */
public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserSummaryResponse user
) {
}
