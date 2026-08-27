package com.bitconnect.backend.modules.profilechange.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Payload for admin review decisions (e.g. rejection reason or approval comment).
 */
public record ProfileChangeRequestReviewRequest(
        @NotBlank(message = "Review comment / reason is required")
        String comment
) {
}
