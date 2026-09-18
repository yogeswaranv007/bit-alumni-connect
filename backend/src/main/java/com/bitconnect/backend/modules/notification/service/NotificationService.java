package com.bitconnect.backend.modules.notification.service;

import com.bitconnect.backend.modules.notification.dto.NotificationDto;
import com.bitconnect.backend.modules.notification.entity.NotificationType;
import com.bitconnect.backend.modules.user.entity.User;

import java.util.List;
import java.util.UUID;

public interface NotificationService {

    NotificationDto sendNotification(User recipient, NotificationType type, String title, String message, UUID referenceId, String referenceType);

    List<NotificationDto> getUserNotifications(UUID userId);

    void markAsRead(UUID notificationId, UUID userId);

    void markAllAsRead(UUID userId);

    long getUnreadCount(UUID userId);
}
