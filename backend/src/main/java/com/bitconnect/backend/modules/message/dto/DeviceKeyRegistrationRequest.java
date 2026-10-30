package com.bitconnect.backend.modules.message.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeviceKeyRegistrationRequest(
        @NotBlank(message = "deviceId must not be blank")
        @Size(max = 64, message = "deviceId must not exceed 64 characters")
        String deviceId,

        @NotBlank(message = "publicKeyData must not be blank")
        @JsonAlias({"publicKey", "public_key"})
        String publicKeyData,

        @Size(max = 32, message = "algorithm must not exceed 32 characters")
        @JsonAlias({"keyAlgorithm", "key_algorithm"})
        String algorithm
) {
}
