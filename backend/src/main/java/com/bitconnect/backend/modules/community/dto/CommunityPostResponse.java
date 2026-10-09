package com.bitconnect.backend.modules.community.dto;

import com.bitconnect.backend.modules.community.entity.CommunityContentStatus;
import com.bitconnect.backend.modules.community.entity.CommunityContentType;
import com.bitconnect.backend.modules.community.entity.CommunityPost;
import com.bitconnect.backend.modules.community.entity.OpportunityModerationStatus;
import com.bitconnect.backend.modules.user.entity.RoleName;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

/**
 * Public response DTO for a community post.
 *
 * <p>Author identity is only exposed when the post is not anonymous.
 * Anonymous posts show {@code null} for authorId, authorName, and authorPhotoUrl
 * but retain authorRole so the reader knows who answered (e.g., "Alumni").</p>
 */
public record CommunityPostResponse(
        UUID id,
        CommunityContentType contentType,
        CommunityContentStatus status,
        String title,
        String body,
        String tags,
        boolean isAnonymous,
        boolean isPinned,
        boolean isSolved,
        UUID acceptedReplyId,

        // Author projection
        UUID authorId,
        String authorName,
        String authorPhotoUrl,
        Set<RoleName> authorRoles,
        String authorDesignation,  // for alumni/staff badge

        // Department scope
        Integer departmentId,
        String departmentName,

        // Engagement
        int upvoteCount,
        int viewCount,
        int replyCount,

        // Whether the currently authenticated user has upvoted this post
        boolean hasUpvoted,

        // Timestamps
        Instant createdAt,
        Instant updatedAt,

        // ─── Opportunity-specific (null unless contentType == OPPORTUNITY) ────
        String opportunityCompany,
        String opportunityRole,
        String opportunityLocation,
        String opportunityType,
        LocalDate opportunityDeadline,
        String opportunityApplyUrl,
        String opportunityEligibility,
        String opportunityCompensation,
        OpportunityModerationStatus opportunityModerationStatus
) {

    /** Construct from entity, resolving author profile photo and designation. */
    public static CommunityPostResponse from(
            CommunityPost post,
            boolean hasUpvoted,
            UUID currentUserId,
            String authorPhotoUrl,
            String authorDesignation) {
        boolean anon = post.isAnonymous();

        // Authors can always see their own identity
        boolean isAuthor = currentUserId != null && post.getAuthor() != null
                && currentUserId.equals(post.getAuthor().getId());

        UUID authorId       = (anon && !isAuthor) ? null
                : (post.getAuthor() != null ? post.getAuthor().getId() : null);
        String authorName   = (anon && !isAuthor) ? "Anonymous"
                : (post.getAuthor() != null ? post.getAuthor().getFullName() : null);
        String photoUrl     = (anon && !isAuthor) ? null : authorPhotoUrl;
        String designation  = (anon && !isAuthor) ? null : authorDesignation;

        Set<RoleName> roles = null;
        if (post.getAuthor() != null && post.getAuthor().getRoles() != null) {
            roles = new java.util.HashSet<>();
            for (var role : post.getAuthor().getRoles()) {
                roles.add(role.getName());
            }
        }

        return new CommunityPostResponse(
                post.getId(),
                post.getContentType(),
                post.getStatus(),
                post.getTitle(),
                post.getBody(),
                post.getTags(),
                post.isAnonymous(),
                post.isPinned(),
                post.isSolved(),
                post.getAcceptedReplyId(),
                authorId,
                authorName,
                photoUrl,
                roles,
                designation,
                post.getDepartment() != null ? post.getDepartment().getId() : null,
                post.getDepartment() != null ? post.getDepartment().getName() : null,
                post.getUpvoteCount(),
                post.getViewCount(),
                post.getReplyCount(),
                hasUpvoted,
                post.getCreatedAt(),
                post.getUpdatedAt(),
                post.getOpportunityCompany(),
                post.getOpportunityRole(),
                post.getOpportunityLocation(),
                post.getOpportunityType(),
                post.getOpportunityDeadline(),
                post.getOpportunityApplyUrl(),
                post.getOpportunityEligibility(),
                post.getOpportunityCompensation(),
                post.getOpportunityModerationStatus()
        );
    }

    /** Construct from entity with default null photo/designation (backwards compatibility). */
    public static CommunityPostResponse from(CommunityPost post, boolean hasUpvoted, UUID currentUserId) {
        return from(post, hasUpvoted, currentUserId, null, null);
    }
}
