package com.bitconnect.backend.modules.auth.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Public-safe summary of an authenticated user's account identity.
 */
public record UserSummaryResponse(
        UUID id,
        String email,
        String fullName,
        boolean isActive,
        List<String> roles,
        Instant createdAt
) {
}
