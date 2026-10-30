package com.bitconnect.backend.modules.message.repository;

import com.bitconnect.backend.modules.message.entity.EncryptedMessage;
import com.bitconnect.backend.modules.message.entity.MessageDeliveryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EncryptedMessageRepository extends JpaRepository<EncryptedMessage, UUID> {

    @EntityGraph(attributePaths = {"sender", "recipient"})
    @Query("SELECT m FROM EncryptedMessage m WHERE m.conversation.id = :conversationId ORDER BY m.createdAt ASC")
    Page<EncryptedMessage> findByConversationIdOrderByCreatedAtAsc(@Param("conversationId") UUID conversationId, Pageable pageable);

    @Query("SELECT COUNT(m) FROM EncryptedMessage m WHERE m.conversation.id = :conversationId AND m.recipient.id = :recipientId AND m.deliveryStatus != 'READ'")
    long countUnreadMessages(@Param("conversationId") UUID conversationId, @Param("recipientId") UUID recipientId);

    @EntityGraph(attributePaths = {"sender", "recipient"})
    @Query("SELECT m FROM EncryptedMessage m WHERE m.conversation.id = :conversationId ORDER BY m.createdAt DESC LIMIT 1")
    Optional<EncryptedMessage> findLatestMessageByConversationId(@Param("conversationId") UUID conversationId);

    @Modifying
    @Query("UPDATE EncryptedMessage m SET m.deliveryStatus = 'READ', m.readAt = :now WHERE m.conversation.id = :conversationId AND m.recipient.id = :recipientId AND m.deliveryStatus != 'READ'")
    int markConversationMessagesAsRead(@Param("conversationId") UUID conversationId, @Param("recipientId") UUID recipientId, @Param("now") Instant now);
}
