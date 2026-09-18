package com.bitconnect.backend.modules.rfid.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record RfidAssignRequest(
        @NotNull(message = "Alumni Profile ID is required")
        UUID alumniProfileId,

        @NotBlank(message = "RFID UID is required")
        @Size(max = 64, message = "RFID UID cannot exceed 64 characters")
        String rfidUid,

        @Size(max = 50, message = "Card Number cannot exceed 50 characters")
        String cardNumber,

        @Size(max = 500, message = "Notes cannot exceed 500 characters")
        String notes
) {
}
