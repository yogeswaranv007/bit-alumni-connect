package com.bitconnect.backend.modules.rfid.dto;

import com.bitconnect.backend.modules.rfid.entity.RfidStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RfidStatusUpdateRequest(
        @NotNull(message = "RFID status is required")
        RfidStatus status,

        @Size(max = 500, message = "Notes cannot exceed 500 characters")
        String notes
) {
}
