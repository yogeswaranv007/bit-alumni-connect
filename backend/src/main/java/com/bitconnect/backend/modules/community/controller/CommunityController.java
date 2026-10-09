package com.bitconnect.backend.modules.community.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.community.dto.CommunityPostCreateRequest;
import com.bitconnect.backend.modules.community.dto.CommunityPostResponse;
import com.bitconnect.backend.modules.community.dto.CommunityPostUpdateRequest;
import com.bitconnect.backend.modules.community.dto.CommunityReplyCreateRequest;
import com.bitconnect.backend.modules.community.dto.CommunityReplyResponse;
import com.bitconnect.backend.modules.community.entity.CommunityContentType;
import com.bitconnect.backend.modules.community.service.CommunityService;
import com.bitconnect.backend.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for the BIT Connect Community Forum.
 *
 * <p>All authenticated users (ALUMNI, STAFF, ADMIN) may read and post.
 * Moderation endpoints (pin, hide) are restricted to ADMIN only.</p>
 */
@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Community Forum", description = "BIT Connect community posts, replies, and voting")
public class CommunityController {

    private final CommunityService communityService;

    // ─────────────────────────────────────────────────────────────────────────
    // Posts
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/posts")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create a new community post")
    public ResponseEntity<ApiResponse<CommunityPostResponse>> createPost(
            @Valid @RequestBody CommunityPostCreateRequest request) {
        UUID actorId = SecurityUtils.getCurrentUserId();
        CommunityPostResponse response = communityService.createPost(actorId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Post created successfully", response));
    }

    @GetMapping("/posts")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List community posts with optional filtering and sorting")
    public ResponseEntity<ApiResponse<PagedResponse<CommunityPostResponse>>> getPosts(
            @RequestParam(required = false) CommunityContentType contentType,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "LATEST") String sortBy,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();

        Sort sort;
        if ("MOST_UPVOTED".equalsIgnoreCase(sortBy) || "upvoted".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Order.desc("isPinned"), Sort.Order.desc("upvoteCount"), Sort.Order.desc("createdAt"));
        } else if ("UNANSWERED".equalsIgnoreCase(sortBy) || "unanswered".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Order.desc("createdAt"));
        } else {
            sort = Sort.by(Sort.Order.desc("isPinned"), Sort.Order.desc("createdAt"));
        }

        Pageable pageable = PageRequest.of(page, Math.min(size, 50), sort);
        PagedResponse<CommunityPostResponse> response =
                communityService.getPosts(contentType, departmentId, keyword, sortBy, currentUserId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/posts/{postId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get a single post by ID (increments view count)")
    public ResponseEntity<ApiResponse<CommunityPostResponse>> getPostById(
            @PathVariable UUID postId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CommunityPostResponse response = communityService.getPostById(postId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/posts/{postId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update own post (author or admin)")
    public ResponseEntity<ApiResponse<CommunityPostResponse>> updatePost(
            @PathVariable UUID postId,
            @Valid @RequestBody CommunityPostUpdateRequest request) {
        UUID actorId = SecurityUtils.getCurrentUserId();
        CommunityPostResponse response = communityService.updatePost(postId, actorId, request);
        return ResponseEntity.ok(ApiResponse.success("Post updated successfully", response));
    }

    @DeleteMapping("/posts/{postId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Soft-delete own post (author or admin)")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable UUID postId) {
        UUID actorId = SecurityUtils.getCurrentUserId();
        communityService.deletePost(postId, actorId);
        return ResponseEntity.ok(ApiResponse.success("Post deleted successfully"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Votes on posts
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/posts/{postId}/upvote")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Toggle upvote on a post")
    public ResponseEntity<ApiResponse<CommunityPostResponse>> togglePostUpvote(
            @PathVariable UUID postId) {
        UUID actorId = SecurityUtils.getCurrentUserId();
        CommunityPostResponse response = communityService.togglePostUpvote(postId, actorId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Replies
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/posts/{postId}/replies")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Add a reply to a post")
    public ResponseEntity<ApiResponse<CommunityReplyResponse>> createReply(
            @PathVariable UUID postId,
            @Valid @RequestBody CommunityReplyCreateRequest request) {
        UUID actorId = SecurityUtils.getCurrentUserId();
        CommunityReplyResponse response = communityService.createReply(postId, actorId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Reply added successfully", response));
    }

    @GetMapping("/posts/{postId}/replies")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get top-level replies for a post")
    public ResponseEntity<ApiResponse<PagedResponse<CommunityReplyResponse>>> getReplies(
            @PathVariable UUID postId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), Sort.by("createdAt").ascending());
        PagedResponse<CommunityReplyResponse> response = communityService.getReplies(postId, currentUserId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/replies/{replyId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update own reply (author or admin)")
    public ResponseEntity<ApiResponse<CommunityReplyResponse>> updateReply(
            @PathVariable UUID replyId,
            @RequestBody String body) {
        UUID actorId = SecurityUtils.getCurrentUserId();
        CommunityReplyResponse response = communityService.updateReply(replyId, actorId, body);
        return ResponseEntity.ok(ApiResponse.success("Reply updated successfully", response));
    }

    @DeleteMapping("/replies/{replyId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Soft-delete own reply (author or admin)")
    public ResponseEntity<ApiResponse<Void>> deleteReply(@PathVariable UUID replyId) {
        UUID actorId = SecurityUtils.getCurrentUserId();
        communityService.deleteReply(replyId, actorId);
        return ResponseEntity.ok(ApiResponse.success("Reply deleted successfully"));
    }

    @PostMapping("/replies/{replyId}/upvote")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Toggle upvote on a reply")
    public ResponseEntity<ApiResponse<CommunityReplyResponse>> toggleReplyUpvote(
            @PathVariable UUID replyId) {
        UUID actorId = SecurityUtils.getCurrentUserId();
        CommunityReplyResponse response = communityService.toggleReplyUpvote(replyId, actorId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Question resolution
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/posts/{postId}/accept-reply/{replyId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Accept a reply as the best answer (question author only)")
    public ResponseEntity<ApiResponse<CommunityPostResponse>> acceptReply(
            @PathVariable UUID postId,
            @PathVariable UUID replyId) {
        UUID actorId = SecurityUtils.getCurrentUserId();
        CommunityPostResponse response = communityService.acceptReply(postId, replyId, actorId);
        return ResponseEntity.ok(ApiResponse.success("Reply accepted as best answer", response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin moderation
    // ─────────────────────────────────────────────────────────────────────────

    @PatchMapping("/posts/{postId}/pin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Pin a post to the top of the feed")
    public ResponseEntity<ApiResponse<CommunityPostResponse>> pinPost(@PathVariable UUID postId) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Post pinned", communityService.pinPost(postId, adminId)));
    }

    @PatchMapping("/posts/{postId}/unpin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Unpin a post")
    public ResponseEntity<ApiResponse<CommunityPostResponse>> unpinPost(@PathVariable UUID postId) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Post unpinned", communityService.unpinPost(postId, adminId)));
    }

    @PatchMapping("/posts/{postId}/hide")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Hide a post (with optional reason)")
    public ResponseEntity<ApiResponse<CommunityPostResponse>> hidePost(
            @PathVariable UUID postId,
            @RequestParam(required = false) String reason) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Post hidden", communityService.hidePost(postId, adminId, reason)));
    }

    @PatchMapping("/replies/{replyId}/hide")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Hide a reply")
    public ResponseEntity<ApiResponse<CommunityReplyResponse>> hideReply(
            @PathVariable UUID replyId,
            @RequestParam(required = false) String reason) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Reply hidden", communityService.hideReply(replyId, adminId, reason)));
    }

    @PatchMapping("/posts/{postId}/verify-opportunity")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Verify an opportunity post as officially vetted by BIT")
    public ResponseEntity<ApiResponse<CommunityPostResponse>> verifyOpportunity(@PathVariable UUID postId) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Opportunity verified by BIT", communityService.verifyOpportunity(postId, adminId)));
    }

    @PatchMapping("/posts/{postId}/unverify-opportunity")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Unverify an opportunity post back to community status")
    public ResponseEntity<ApiResponse<CommunityPostResponse>> unverifyOpportunity(@PathVariable UUID postId) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Opportunity status set to community posted", communityService.unverifyOpportunity(postId, adminId)));
    }
}
