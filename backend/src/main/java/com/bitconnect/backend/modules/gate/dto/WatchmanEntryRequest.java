package com.bitconnect.backend.modules.gate.dto;

import com.bitconnect.backend.modules.gate.entity.VerificationMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record WatchmanEntryRequest(
        @NotNull(message = "Alumni Profile ID is required")
        UUID alumniProfileId,

        @NotNull(message = "Verification method is required")
        VerificationMethod verificationMethod,

        @Size(max = 80, message = "Gate name cannot exceed 80 characters")
        String gate,

        @Size(max = 1000, message = "Remarks cannot exceed 1000 characters")
        String remarks
) {
}
