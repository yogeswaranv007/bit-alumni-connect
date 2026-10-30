package com.bitconnect.backend.modules.message.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateConversationRequest(
        @NotNull(message = "recipientUserId is required")
        @JsonAlias({"recipientId", "recipient_id"})
        UUID recipientUserId
) {
}
