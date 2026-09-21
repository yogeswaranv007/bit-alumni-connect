package com.bitconnect.backend.modules.notification.dto;

import com.bitconnect.backend.modules.notification.entity.Notification;
import com.bitconnect.backend.modules.notification.entity.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationDto(
        UUID id,
        NotificationType type,
        String title,
        String message,
        UUID referenceId,
        String referenceType,
        String actionUrl,
        String actorName,
        boolean isRead,
        Instant readAt,
        Instant createdAt
) {
    public static NotificationDto from(Notification n) {
        if (n == null) return null;
        return new NotificationDto(
                n.getId(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.getReferenceId(),
                n.getReferenceType(),
                n.getActionUrl(),
                n.getActorName(),
                n.isRead(),
                n.getReadAt(),
                n.getCreatedAt()
        );
    }
}
