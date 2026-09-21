package com.bitconnect.backend.modules.notification.service.impl;

import com.bitconnect.backend.common.exception.ResourceNotFoundException;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.notification.dto.NotificationDto;
import com.bitconnect.backend.modules.notification.entity.Notification;
import com.bitconnect.backend.modules.notification.entity.NotificationType;
import com.bitconnect.backend.modules.notification.repository.NotificationRepository;
import com.bitconnect.backend.modules.notification.service.NotificationService;
import com.bitconnect.backend.modules.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public NotificationDto sendNotification(
            User recipient,
            NotificationType type,
            String title,
            String message,
            UUID referenceId,
            String referenceType,
            String actionUrl,
            String actorName
    ) {
        if (recipient == null) {
            log.warn("Skipping notification dispatch: recipient is null");
            return null;
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .actionUrl(actionUrl)
                .actorName(actorName)
                .isRead(false)
                .readAt(null)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Dispatched {} notification to user: {} (Notification ID: {})", type, recipient.getEmail(), saved.getId());
        return NotificationDto.from(saved);
    }

    @Override
    @Transactional
    public NotificationDto sendNotification(
            User recipient,
            NotificationType type,
            String title,
            String message,
            UUID referenceId,
            String referenceType,
            String actionUrl
    ) {
        return sendNotification(recipient, type, title, message, referenceId, referenceType, actionUrl, null);
    }

    @Override
    @Transactional
    public NotificationDto sendNotification(
            User recipient,
            NotificationType type,
            String title,
            String message,
            UUID referenceId,
            String referenceType
    ) {
        return sendNotification(recipient, type, title, message, referenceId, referenceType, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<NotificationDto> getNotifications(UUID userId, Boolean isRead, Pageable pageable) {
        // Ensure default sort by createdAt DESC if not specified
        Pageable sortedPageable = pageable;
        if (pageable.getSort().isUnsorted()) {
            sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        Page<Notification> page;
        if (isRead != null) {
            page = notificationRepository.findByRecipientIdAndIsRead(userId, isRead, sortedPageable);
        } else {
            page = notificationRepository.findByRecipientId(userId, sortedPageable);
        }

        return PagedResponse.from(page.map(NotificationDto::from));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto> getRecentNotifications(UUID userId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        Pageable pageable = PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt"));
        return notificationRepository.findByRecipientId(userId, pageable)
                .getContent()
                .stream()
                .map(NotificationDto::from)
                .toList();
    }

    @Override
    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
            notificationRepository.save(notification);
            log.debug("Marked notification {} as read for user {}", notificationId, userId);
        }
    }

    @Override
    @Transactional
    public void markAllAsRead(UUID userId) {
        List<Notification> unread = notificationRepository.findByRecipientIdAndIsReadFalse(userId);
        if (!unread.isEmpty()) {
            Instant now = Instant.now();
            unread.forEach(n -> {
                n.setRead(true);
                n.setReadAt(now);
            });
            notificationRepository.saveAll(unread);
            log.info("Marked {} unread notifications as read for user {}", unread.size(), userId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }
}
