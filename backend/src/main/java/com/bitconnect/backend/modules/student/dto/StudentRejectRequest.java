package com.bitconnect.backend.modules.student.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body when admin rejects a student registration.
 * Reason is mandatory — admin must explain what corrections are needed.
 */
public record StudentRejectRequest(
        @NotBlank(message = "Rejection reason is required")
        String reason
) {
}
