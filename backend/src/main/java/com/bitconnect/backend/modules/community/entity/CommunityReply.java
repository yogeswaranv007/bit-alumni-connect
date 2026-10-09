package com.bitconnect.backend.modules.community.entity;

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

/**
 * Represents a reply (answer or comment) to a {@link CommunityPost}.
 *
 * <p>Supports one level of nesting via {@code parentReply}: replies to a post are
 * top-level (parentReply == null); thread replies reference an existing reply.
 * Keeping nesting to a single level avoids recursive query complexity while
 * still enabling threaded discussion UX.</p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "community_replies",
        indexes = {
                @Index(name = "idx_community_replies_post",    columnList = "post_id"),
                @Index(name = "idx_community_replies_author",  columnList = "author_id"),
                @Index(name = "idx_community_replies_parent",  columnList = "parent_reply_id"),
                @Index(name = "idx_community_replies_status",  columnList = "status"),
                @Index(name = "idx_community_replies_created", columnList = "created_at")
        }
)
public class CommunityReply extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "post_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_community_replies_post")
    )
    private CommunityPost post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "author_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_community_replies_author")
    )
    private User author;

    @Column(name = "body", columnDefinition = "TEXT", nullable = false)
    private String body;

    /**
     * Null for top-level replies to the post; set for replies to another reply
     * (one level of nesting only — enforced in service layer).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "parent_reply_id",
            foreignKey = @ForeignKey(name = "fk_community_replies_parent")
    )
    private CommunityReply parentReply;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private CommunityContentStatus status = CommunityContentStatus.ACTIVE;

    @Column(name = "upvote_count", nullable = false)
    @Builder.Default
    private int upvoteCount = 0;

    @Column(name = "is_anonymous", nullable = false)
    @Builder.Default
    private boolean isAnonymous = false;

    /** Populated by the moderator who hid/deleted this reply. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "moderated_by_id",
            foreignKey = @ForeignKey(name = "fk_community_replies_moderator")
    )
    private User moderatedBy;

    @Column(name = "moderation_note", columnDefinition = "TEXT")
    private String moderationNote;
}
