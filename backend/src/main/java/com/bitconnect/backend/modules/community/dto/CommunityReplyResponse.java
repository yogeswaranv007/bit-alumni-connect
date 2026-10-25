package com.bitconnect.backend.modules.community.dto;

import com.bitconnect.backend.modules.community.entity.CommunityContentStatus;
import com.bitconnect.backend.modules.community.entity.CommunityReply;
import com.bitconnect.backend.modules.user.entity.RoleName;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

/**
 * Public response DTO for a community reply.
 *
 * <p>Author identity is masked to "Anonymous" when {@code isAnonymous} is true,
 * except for the author themselves.</p>
 */
public record CommunityReplyResponse(
        UUID id,
        UUID postId,
        CommunityContentStatus status,
        String body,
        boolean isAnonymous,
        boolean isAccepted,

        // Author projection (masked for anonymous unless author)
        UUID authorId,
        String authorName,
        String authorPhotoUrl,
        Set<RoleName> authorRoles,

        // Admin Security Audit projection (only visible to users with ROLE_ADMIN)
        String realAuthorName,
        String realAuthorEmail,
        UUID realAuthorId,

        // Threading
        UUID parentReplyId,

        // Engagement
        int upvoteCount,
        boolean hasUpvoted,

        // Timestamps
        Instant createdAt,
        Instant updatedAt
) {

    public static CommunityReplyResponse from(
            CommunityReply reply,
            boolean hasUpvoted,
            UUID currentUserId,
            String authorPhotoUrl,
            boolean isCallerAdmin) {
        boolean anon = reply.isAnonymous();
        boolean isAuthor = currentUserId != null && reply.getAuthor() != null
                && currentUserId.equals(reply.getAuthor().getId());

        UUID authorId     = (anon && !isAuthor) ? null
                : (reply.getAuthor() != null ? reply.getAuthor().getId() : null);
        String authorName = (anon && !isAuthor) ? "Anonymous"
                : (reply.getAuthor() != null ? reply.getAuthor().getFullName() : null);
        String photoUrl   = (anon && !isAuthor) ? null : authorPhotoUrl;

        // Admin security audit: Admins can see the real sender for anonymous messages
        String realAuthorName  = (anon && isCallerAdmin && reply.getAuthor() != null) ? reply.getAuthor().getFullName() : null;
        String realAuthorEmail = (anon && isCallerAdmin && reply.getAuthor() != null) ? reply.getAuthor().getEmail() : null;
        UUID realAuthorId      = (anon && isCallerAdmin && reply.getAuthor() != null) ? reply.getAuthor().getId() : null;

        Set<RoleName> roles = null;
        if (reply.getAuthor() != null && reply.getAuthor().getRoles() != null) {
            if (!anon || isAuthor || isCallerAdmin) {
                roles = new java.util.HashSet<>();
                for (var role : reply.getAuthor().getRoles()) {
                    roles.add(role.getName());
                }
            }
        }

        return new CommunityReplyResponse(
                reply.getId(),
                reply.getPost() != null ? reply.getPost().getId() : null,
                reply.getStatus(),
                reply.getBody(),
                reply.isAnonymous(),
                reply.isAccepted(),
                authorId,
                authorName,
                photoUrl,
                roles,
                realAuthorName,
                realAuthorEmail,
                realAuthorId,
                reply.getParentReply() != null ? reply.getParentReply().getId() : null,
                reply.getUpvoteCount(),
                hasUpvoted,
                reply.getCreatedAt(),
                reply.getUpdatedAt()
        );
    }

    public static CommunityReplyResponse from(
            CommunityReply reply,
            boolean hasUpvoted,
            UUID currentUserId,
            String authorPhotoUrl) {
        return from(reply, hasUpvoted, currentUserId, authorPhotoUrl, false);
    }

    public static CommunityReplyResponse from(CommunityReply reply, boolean hasUpvoted, UUID currentUserId) {
        return from(reply, hasUpvoted, currentUserId, null, false);
    }
}
