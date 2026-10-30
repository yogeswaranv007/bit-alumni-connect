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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a private 1-to-1 conversation between two users.
 * To strictly prevent duplicate conversation records between the same pair of participants,
 * user1 and user2 are canonically ordered such that user1.id is lexicographically smaller than user2.id.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "conversations",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_conversations_user1_user2", columnNames = {"user1_id", "user2_id"})
        },
        indexes = {
                @Index(name = "idx_conversations_user1", columnList = "user1_id"),
                @Index(name = "idx_conversations_user2", columnList = "user2_id"),
                @Index(name = "idx_conversations_last_message", columnList = "last_message_at")
        }
)
public class Conversation extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user1_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_conversations_user1")
    )
    private User user1;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user2_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_conversations_user2")
    )
    private User user2;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private ConversationStatus status = ConversationStatus.ACTIVE;

    @Column(name = "blocked_by")
    private UUID blockedBy;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    /**
     * Determines whether the given user ID is a participant in this conversation.
     */
    public boolean isParticipant(UUID userId) {
        if (userId == null) return false;
        return (user1 != null && userId.equals(user1.getId()))
                || (user2 != null && userId.equals(user2.getId()));
    }

    /**
     * Retrieves the counterpart participant given one participant's ID.
     */
    public User getOtherParticipant(UUID currentUserId) {
        if (user1 != null && currentUserId.equals(user1.getId())) {
            return user2;
        }
        return user1;
    }
}
