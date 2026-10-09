package com.bitconnect.backend.modules.community.entity;

import com.bitconnect.backend.common.entity.BaseAuditableEntity;
import com.bitconnect.backend.modules.department.entity.Department;
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

import java.time.LocalDate;

/**
 * Core domain entity representing a post in the BIT Connect Community Forum.
 *
 * <p>A single table covers all four content types (QUESTION, POST, OPPORTUNITY, DISCUSSION).
 * Type-specific optional fields (e.g., opportunity metadata) are stored as nullable columns
 * on the same row. Only {@code author}, {@code contentType}, {@code title}, and {@code body}
 * are universally required.</p>
 *
 * <p>Questions carry an {@code isSolved} flag and link to an {@code acceptedAnswer}.
 * Opportunity posts carry metadata fields (company, role, deadline, etc.), all optional
 * per the product requirement that only title and body are mandatory for opportunities.</p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "community_posts",
        indexes = {
                @Index(name = "idx_community_posts_type",        columnList = "content_type"),
                @Index(name = "idx_community_posts_status",      columnList = "status"),
                @Index(name = "idx_community_posts_author",      columnList = "author_id"),
                @Index(name = "idx_community_posts_dept",        columnList = "department_id"),
                @Index(name = "idx_community_posts_solved",      columnList = "is_solved"),
                @Index(name = "idx_community_posts_pinned",      columnList = "is_pinned"),
                @Index(name = "idx_community_posts_created",     columnList = "created_at")
        }
)
public class CommunityPost extends BaseAuditableEntity {

    // ─────────────────────────────────────────────────────────────────────────
    // Core Required Fields (all content types)
    // ─────────────────────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "author_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_community_posts_author")
    )
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", length = 20, nullable = false)
    private CommunityContentType contentType;

    @Column(name = "title", length = 300, nullable = false)
    private String title;

    @Column(name = "body", columnDefinition = "TEXT", nullable = false)
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private CommunityContentStatus status = CommunityContentStatus.ACTIVE;

    // ─────────────────────────────────────────────────────────────────────────
    // Scoping & Categorisation (all content types, optional)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * When null the post is visible to the entire BIT Connect community.
     * When set, the post is scoped to that department (students + alumni of that department).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "department_id",
            foreignKey = @ForeignKey(name = "fk_community_posts_department")
    )
    private Department department;

    /** Comma-separated tags, e.g. "java,internship,interview". Max 500 chars. */
    @Column(name = "tags", length = 500)
    private String tags;

    // ─────────────────────────────────────────────────────────────────────────
    // Engagement Counters (denormalised for performance; updated transactionally)
    // ─────────────────────────────────────────────────────────────────────────

    @Column(name = "upvote_count", nullable = false)
    @Builder.Default
    private int upvoteCount = 0;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private int viewCount = 0;

    @Column(name = "reply_count", nullable = false)
    @Builder.Default
    private int replyCount = 0;

    // ─────────────────────────────────────────────────────────────────────────
    // Moderation / Admin Controls
    // ─────────────────────────────────────────────────────────────────────────

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private boolean isPinned = false;

    @Column(name = "is_anonymous", nullable = false)
    @Builder.Default
    private boolean isAnonymous = false;

    /** Admin who performed the last moderation action (pin / hide / delete). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "moderated_by_id",
            foreignKey = @ForeignKey(name = "fk_community_posts_moderator")
    )
    private User moderatedBy;

    /** Reason left by a moderator when hiding or deleting the post. */
    @Column(name = "moderation_note", columnDefinition = "TEXT")
    private String moderationNote;

    // ─────────────────────────────────────────────────────────────────────────
    // QUESTION-specific Fields
    // ─────────────────────────────────────────────────────────────────────────

    /** Only meaningful when contentType == QUESTION */
    @Column(name = "is_solved", nullable = false)
    @Builder.Default
    private boolean isSolved = false;

    /**
     * ID of the CommunityReply that the question author accepted as the best answer.
     * Stored as UUID rather than a JPA association to keep this entity self-contained.
     * Only meaningful when contentType == QUESTION and isSolved == true.
     */
    @Column(name = "accepted_reply_id")
    private java.util.UUID acceptedReplyId;

    // ─────────────────────────────────────────────────────────────────────────
    // OPPORTUNITY-specific Fields (ALL optional per product requirement)
    // ─────────────────────────────────────────────────────────────────────────

    /** Company / organisation offering the opportunity */
    @Column(name = "opp_company", length = 150)
    private String opportunityCompany;

    /** Role or position title */
    @Column(name = "opp_role", length = 150)
    private String opportunityRole;

    /** Geographic location or "Remote" */
    @Column(name = "opp_location", length = 150)
    private String opportunityLocation;

    /** Opportunity sub-type: Internship, Full-time, Part-time, Referral, Contest, etc. */
    @Column(name = "opp_type", length = 60)
    private String opportunityType;

    /** Application deadline date */
    @Column(name = "opp_deadline")
    private LocalDate opportunityDeadline;

    /** External application / job-board URL */
    @Column(name = "opp_apply_url", columnDefinition = "TEXT")
    private String opportunityApplyUrl;

    /** Short eligibility notes (batch year, CGPA cutoff, etc.) */
    @Column(name = "opp_eligibility", length = 500)
    private String opportunityEligibility;

    /** Estimated compensation range (free-text) */
    @Column(name = "opp_compensation", length = 120)
    private String opportunityCompensation;

    /** Moderation status specific to opportunity posts */
    @Enumerated(EnumType.STRING)
    @Column(name = "opp_moderation_status", length = 30)
    private OpportunityModerationStatus opportunityModerationStatus;
}
