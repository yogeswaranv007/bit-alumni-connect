package com.bitconnect.backend.modules.message.dto;

import com.bitconnect.backend.modules.message.entity.ConversationStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.UUID;

public record ConversationResponse(
        UUID id,
        UUID otherUserId,
        String otherUserName,
        String otherUserEmail,
        String otherUserRole,
        String otherUserProfilePhotoUrl,
        ConversationStatus status,
        UUID blockedBy,
        long unreadCount,
        Instant lastMessageAt,
        Instant createdAt
) {
    @JsonProperty("otherUserAvatar")
    public String otherUserAvatar() {
        return otherUserProfilePhotoUrl;
    }
}
