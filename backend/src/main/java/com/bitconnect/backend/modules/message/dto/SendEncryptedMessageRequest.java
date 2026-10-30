package com.bitconnect.backend.modules.message.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendEncryptedMessageRequest(
        @NotBlank(message = "encryptedPayload is required")
        String encryptedPayload,

        @NotBlank(message = "iv is required")
        @Size(max = 64, message = "iv must not exceed 64 characters")
        String iv
) {
}
