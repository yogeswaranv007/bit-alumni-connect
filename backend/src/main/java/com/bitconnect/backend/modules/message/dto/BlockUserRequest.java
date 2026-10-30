package com.bitconnect.backend.modules.message.dto;

import jakarta.validation.constraints.Size;

public record BlockUserRequest(
        @Size(max = 255, message = "reason must not exceed 255 characters")
        String reason
) {
}
