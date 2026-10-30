package com.bitconnect.backend.modules.message.entity;

import com.bitconnect.backend.common.entity.BaseAuditableEntity;
import com.bitconnect.backend.modules.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Represents an encrypted message payload sent between two users within a conversation.
 * Plaintext message content is strictly prohibited on the backend.
 * Only the encrypted ciphertext and initialization vector are stored.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "encrypted_messages",
        indexes = {
                @Index(name = "idx_enc_msg_conversation", columnList = "conversation_id"),
                @Index(name = "idx_enc_msg_created_at", columnList = "created_at"),
                @Index(name = "idx_enc_msg_recipient_status", columnList = "recipient_id, delivery_status")
        }
)
public class EncryptedMessage extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "conversation_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_enc_msg_conversation")
    )
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "sender_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_enc_msg_sender")
    )
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "recipient_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_enc_msg_recipient")
    )
    private User recipient;

    /**
     * Base64-encoded ciphertext produced by client-side authenticated encryption (AES-256-GCM).
     */
    @Column(name = "encrypted_payload", nullable = false, columnDefinition = "TEXT")
    private String encryptedPayload;

    /**
     * Base64-encoded Initialization Vector (IV) / Nonce used for AES-GCM encryption.
     */
    @Column(name = "iv", length = 64, nullable = false)
    private String iv;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_status", length = 20, nullable = false)
    @Builder.Default
    private MessageDeliveryStatus deliveryStatus = MessageDeliveryStatus.SENT;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "read_at")
    private Instant readAt;
}
