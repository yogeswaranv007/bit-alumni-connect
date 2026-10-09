package com.bitconnect.backend.modules.community.entity;

import com.bitconnect.backend.modules.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.EntityListeners;
import java.time.Instant;
import java.util.UUID;

/**
 * Tracks upvotes cast by users on posts or replies.
 *
 * <p>One vote record per (user, target post or reply) pair is enforced by a
 * unique constraint. Exactly one of {@code post} or {@code reply} will be
 * non-null per row; both cannot be set simultaneously (enforced in service).</p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(
        name = "community_votes",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_community_votes_user_post",
                        columnNames = {"user_id", "post_id"}
                ),
                @UniqueConstraint(
                        name = "uk_community_votes_user_reply",
                        columnNames = {"user_id", "reply_id"}
                )
        },
        indexes = {
                @Index(name = "idx_community_votes_post",  columnList = "post_id"),
                @Index(name = "idx_community_votes_reply", columnList = "reply_id"),
                @Index(name = "idx_community_votes_user",  columnList = "user_id")
        }
)
public class CommunityVote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_community_votes_user")
    )
    private User user;

    /** Non-null when voting on a post; null when voting on a reply. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "post_id",
            foreignKey = @ForeignKey(name = "fk_community_votes_post")
    )
    private CommunityPost post;

    /** Non-null when voting on a reply; null when voting on a post. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "reply_id",
            foreignKey = @ForeignKey(name = "fk_community_votes_reply")
    )
    private CommunityReply reply;

    @Enumerated(EnumType.STRING)
    @Column(name = "vote_type", length = 20, nullable = false)
    @Builder.Default
    private VoteType voteType = VoteType.UPVOTE;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
