package com.bitconnect.backend.modules.message.dto;

import com.bitconnect.backend.modules.message.entity.MessageDeliveryStatus;
import java.time.Instant;
import java.util.UUID;

public record EncryptedMessageResponse(
        UUID id,
        UUID conversationId,
        UUID senderId,
        String senderName,
        UUID recipientId,
        String encryptedPayload,
        String iv,
        MessageDeliveryStatus deliveryStatus,
        Instant deliveredAt,
        Instant readAt,
        Instant createdAt
) {
}
