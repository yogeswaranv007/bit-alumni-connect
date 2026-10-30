package com.bitconnect.backend.modules.message.dto;

import java.time.Instant;
import java.util.UUID;

public record DeviceKeyResponse(
        UUID id,
        UUID userId,
        String deviceId,
        String publicKeyData,
        String algorithm,
        Instant createdAt
) {
}
