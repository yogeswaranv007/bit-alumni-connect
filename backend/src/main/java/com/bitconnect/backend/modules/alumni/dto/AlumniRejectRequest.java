package com.bitconnect.backend.modules.alumni.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload for admin rejection of an alumni profile submission.
 */
public record AlumniRejectRequest(
        @NotBlank(message = "Rejection reason is required")
        @Size(max = 500, message = "Rejection reason cannot exceed 500 characters")
        String reason
) {
}
