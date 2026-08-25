package com.bitconnect.backend.modules.virtualid.dto;

import com.bitconnect.backend.modules.virtualid.entity.VirtualIdStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Payload for updating the status of an issued Virtual Alumni ID.
 */
public record VirtualIdStatusUpdateRequest(
        @NotNull(message = "Status is required")
        VirtualIdStatus status
) {
}
