package com.bitconnect.backend.modules.notification.service;

import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.notification.dto.NotificationDto;
import com.bitconnect.backend.modules.notification.entity.NotificationType;
import com.bitconnect.backend.modules.user.entity.User;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface NotificationService {

    NotificationDto sendNotification(
            User recipient,
            NotificationType type,
            String title,
            String message,
            UUID referenceId,
            String referenceType,
            String actionUrl,
            String actorName
    );

    NotificationDto sendNotification(
            User recipient,
            NotificationType type,
            String title,
            String message,
            UUID referenceId,
            String referenceType,
            String actionUrl
    );

    NotificationDto sendNotification(
            User recipient,
            NotificationType type,
            String title,
            String message,
            UUID referenceId,
            String referenceType
    );

    PagedResponse<NotificationDto> getNotifications(UUID userId, Boolean isRead, Pageable pageable);

    List<NotificationDto> getRecentNotifications(UUID userId, int limit);

    void markAsRead(UUID notificationId, UUID userId);

    void markAllAsRead(UUID userId);

    long getUnreadCount(UUID userId);
}
