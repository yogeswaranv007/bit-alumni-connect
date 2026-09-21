package com.bitconnect.backend.modules.notification.repository;

import com.bitconnect.backend.modules.notification.entity.Notification;
import com.bitconnect.backend.modules.notification.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByRecipientId(UUID recipientId, Pageable pageable);

    Page<Notification> findByRecipientIdAndIsRead(UUID recipientId, boolean isRead, Pageable pageable);

    Page<Notification> findByRecipientIdAndType(UUID recipientId, NotificationType type, Pageable pageable);

    List<Notification> findByRecipientIdAndIsReadFalse(UUID recipientId);

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);

    long countByRecipientIdAndIsReadFalse(UUID recipientId);

    Optional<Notification> findByIdAndRecipientId(UUID id, UUID recipientId);
}
