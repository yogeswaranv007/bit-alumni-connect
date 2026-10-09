package com.bitconnect.backend.modules.community.service;

import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.community.dto.CommunityPostCreateRequest;
import com.bitconnect.backend.modules.community.dto.CommunityPostResponse;
import com.bitconnect.backend.modules.community.dto.CommunityPostUpdateRequest;
import com.bitconnect.backend.modules.community.dto.CommunityReplyCreateRequest;
import com.bitconnect.backend.modules.community.dto.CommunityReplyResponse;
import com.bitconnect.backend.modules.community.entity.CommunityContentType;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Community module service contract.
 *
 * <p>All methods that mutate data accept the authenticated {@code actorUserId}
 * obtained from the security context — never from the request body.</p>
 */
public interface CommunityService {

    // ─── Posts ────────────────────────────────────────────────────────────────

    CommunityPostResponse createPost(UUID actorUserId, CommunityPostCreateRequest request);

    CommunityPostResponse getPostById(UUID postId, UUID currentUserId);

    PagedResponse<CommunityPostResponse> getPosts(
            CommunityContentType contentType,
            Integer departmentId,
            String keyword,
            String sortBy,
            UUID currentUserId,
            Pageable pageable
    );

    default PagedResponse<CommunityPostResponse> getPosts(
            CommunityContentType contentType,
            Integer departmentId,
            String keyword,
            UUID currentUserId,
            Pageable pageable
    ) {
        return getPosts(contentType, departmentId, keyword, "LATEST", currentUserId, pageable);
    }

    CommunityPostResponse updatePost(UUID postId, UUID actorUserId, CommunityPostUpdateRequest request);

    void deletePost(UUID postId, UUID actorUserId);

    // ─── Votes on posts ───────────────────────────────────────────────────────

    CommunityPostResponse togglePostUpvote(UUID postId, UUID actorUserId);

    // ─── Replies ──────────────────────────────────────────────────────────────

    CommunityReplyResponse createReply(UUID postId, UUID actorUserId, CommunityReplyCreateRequest request);

    PagedResponse<CommunityReplyResponse> getReplies(UUID postId, UUID currentUserId, Pageable pageable);

    CommunityReplyResponse updateReply(UUID replyId, UUID actorUserId, String newBody);

    void deleteReply(UUID replyId, UUID actorUserId);

    CommunityReplyResponse toggleReplyUpvote(UUID replyId, UUID actorUserId);

    // ─── Question resolution ──────────────────────────────────────────────────

    CommunityPostResponse acceptReply(UUID postId, UUID acceptedReplyId, UUID actorUserId);

    // ─── Admin moderation ─────────────────────────────────────────────────────

    CommunityPostResponse pinPost(UUID postId, UUID adminUserId);

    CommunityPostResponse unpinPost(UUID postId, UUID adminUserId);

    CommunityPostResponse hidePost(UUID postId, UUID adminUserId, String reason);

    CommunityReplyResponse hideReply(UUID replyId, UUID adminUserId, String reason);

    CommunityPostResponse verifyOpportunity(UUID postId, UUID adminUserId);

    CommunityPostResponse unverifyOpportunity(UUID postId, UUID adminUserId);
}
