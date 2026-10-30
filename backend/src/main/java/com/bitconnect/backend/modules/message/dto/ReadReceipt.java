package com.bitconnect.backend.modules.message.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.UUID;

/**
 * Real-time WebSocket delivery receipt dispatched when a participant marks messages as read.
 */
public record ReadReceipt(
        UUID conversationId,
        @JsonProperty("readerId")
        @JsonAlias({"readByUserId", "reader_id"})
        UUID readerId,
        Instant readAt
) {
    public UUID readByUserId() {
        return readerId;
    }
}
