package com.bitconnect.backend.modules.community.service.impl;

import com.bitconnect.backend.common.exception.BadRequestException;
import com.bitconnect.backend.common.exception.ForbiddenException;
import com.bitconnect.backend.common.exception.ResourceNotFoundException;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.alumni.repository.AlumniProfileRepository;
import com.bitconnect.backend.modules.community.dto.CommunityPostCreateRequest;
import com.bitconnect.backend.modules.community.dto.CommunityPostResponse;
import com.bitconnect.backend.modules.community.dto.CommunityPostUpdateRequest;
import com.bitconnect.backend.modules.community.dto.CommunityReplyCreateRequest;
import com.bitconnect.backend.modules.community.dto.CommunityReplyResponse;
import com.bitconnect.backend.modules.community.entity.CommunityContentStatus;
import com.bitconnect.backend.modules.community.entity.CommunityContentType;
import com.bitconnect.backend.modules.community.entity.CommunityPost;
import com.bitconnect.backend.modules.community.entity.CommunityReply;
import com.bitconnect.backend.modules.community.entity.CommunityVote;
import com.bitconnect.backend.modules.community.entity.OpportunityModerationStatus;
import com.bitconnect.backend.modules.community.repository.CommunityPostRepository;
import com.bitconnect.backend.modules.community.repository.CommunityReplyRepository;
import com.bitconnect.backend.modules.community.repository.CommunityVoteRepository;
import com.bitconnect.backend.modules.community.service.CommunityService;
import com.bitconnect.backend.modules.department.entity.Department;
import com.bitconnect.backend.modules.department.repository.DepartmentRepository;
import com.bitconnect.backend.modules.notification.entity.NotificationType;
import com.bitconnect.backend.modules.notification.service.NotificationService;
import com.bitconnect.backend.modules.staff.entity.StaffProfile;
import com.bitconnect.backend.modules.staff.repository.StaffProfileRepository;
import com.bitconnect.backend.modules.student.entity.StudentProfile;
import com.bitconnect.backend.modules.student.repository.StudentProfileRepository;
import com.bitconnect.backend.modules.user.entity.RoleName;
import com.bitconnect.backend.modules.user.entity.User;
import com.bitconnect.backend.modules.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Production implementation of the BIT Connect Community Forum service.
 *
 * <p>Design constraints enforced here:
 * <ul>
 *   <li>All authoring user IDs come from the caller (SecurityUtils in controller),
 *       never from the request body.</li>
 *   <li>Anonymous posts/replies mask the author identity in the DTO factory.</li>
 *   <li>Upvote counters are updated via @Modifying JPQL for atomicity without
 *       loading the full entity.</li>
 *   <li>Notifications are fired through the existing {@link NotificationService}
 *       and do not introduce any new notification framework.</li>
 *   <li>Nesting is limited to one level: a reply to a reply cannot itself be
 *       replied to (enforced by checking parentReply.parentReply == null).</li>
 * </ul>
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommunityServiceImpl implements CommunityService {

    private final CommunityPostRepository  postRepository;
    private final CommunityReplyRepository replyRepository;
    private final CommunityVoteRepository  voteRepository;
    private final UserRepository           userRepository;
    private final AlumniProfileRepository  alumniProfileRepository;
    private final StaffProfileRepository   staffProfileRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final DepartmentRepository     departmentRepository;
    private final NotificationService      notificationService;

    // ─────────────────────────────────────────────────────────────────────────
    // Posts
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CommunityPostResponse createPost(UUID actorUserId, CommunityPostCreateRequest request) {
        User author = loadUser(actorUserId);

        Department department = null;
        if (request.departmentId() != null) {
            department = departmentRepository.findById(request.departmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.departmentId()));
        }

        CommunityPost.CommunityPostBuilder builder = CommunityPost.builder()
                .author(author)
                .contentType(request.contentType())
                .title(request.title().strip())
                .body(request.body().strip())
                .department(department)
                .tags(request.tags())
                .isAnonymous(request.anonymous())
                .status(CommunityContentStatus.ACTIVE);

        // Opportunity metadata — all optional
        if (request.contentType() == CommunityContentType.OPPORTUNITY) {
            builder
                    .opportunityCompany(request.opportunityCompany())
                    .opportunityRole(request.opportunityRole())
                    .opportunityLocation(request.opportunityLocation())
                    .opportunityType(request.opportunityType())
                    .opportunityDeadline(request.opportunityDeadline())
                    .opportunityApplyUrl(request.opportunityApplyUrl())
                    .opportunityEligibility(request.opportunityEligibility())
                    .opportunityCompensation(request.opportunityCompensation())
                    .opportunityModerationStatus(OpportunityModerationStatus.COMMUNITY_POSTED);
        }

        CommunityPost saved = postRepository.save(builder.build());
        log.info("Community post created: id={}, type={}, author={}", saved.getId(), saved.getContentType(), actorUserId);
        return toPostResponse(saved, actorUserId);
    }

    @Override
    @Transactional
    public CommunityPostResponse getPostById(UUID postId, UUID currentUserId) {
        CommunityPost post = loadPost(postId);
        // Increment view count atomically (fire-and-forget, no need to reload)
        postRepository.incrementViewCount(postId);
        return toPostResponse(post, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<CommunityPostResponse> getPosts(
            CommunityContentType contentType,
            Integer departmentId,
            String keyword,
            String sortBy,
            UUID currentUserId,
            Pageable pageable) {

        boolean isAdmin = isUserAdmin(currentUserId);

        Specification<CommunityPost> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Exclude deleted posts
            predicates.add(cb.notEqual(root.get("status"), CommunityContentStatus.DELETED));

            // 2. Hide HIDDEN posts unless admin or author
            if (!isAdmin) {
                if (currentUserId != null) {
                    Predicate notHidden = cb.notEqual(root.get("status"), CommunityContentStatus.HIDDEN);
                    Predicate isOwnPost = cb.equal(root.get("author").get("id"), currentUserId);
                    predicates.add(cb.or(notHidden, isOwnPost));
                } else {
                    predicates.add(cb.notEqual(root.get("status"), CommunityContentStatus.HIDDEN));
                }
            }

            // 3. Content type / Unanswered filter
            if ("UNANSWERED".equalsIgnoreCase(sortBy) || "unanswered".equalsIgnoreCase(sortBy)) {
                predicates.add(cb.equal(root.get("contentType"), CommunityContentType.QUESTION));
                predicates.add(cb.equal(root.get("replyCount"), 0));
                predicates.add(cb.isFalse(root.get("isSolved")));
            } else if (contentType != null) {
                predicates.add(cb.equal(root.get("contentType"), contentType));
            }

            // 4. Department filter
            if (departmentId != null) {
                predicates.add(cb.equal(root.get("department").get("id"), departmentId));
            }

            // 5. Keyword search in title, body, or tags
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.strip().toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), pattern);
                Predicate bodyLike = cb.like(cb.lower(root.get("body")), pattern);
                Predicate tagsLike = cb.like(cb.lower(root.get("tags")), pattern);
                predicates.add(cb.or(titleLike, bodyLike, tagsLike));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<CommunityPost> page = postRepository.findAll(spec, pageable);
        Page<CommunityPostResponse> mapped = page.map(p -> toPostResponse(p, currentUserId));
        return PagedResponse.from(mapped);
    }

    @Override
    @Transactional
    public CommunityPostResponse updatePost(UUID postId, UUID actorUserId, CommunityPostUpdateRequest request) {
        CommunityPost post = loadPost(postId);
        assertAuthorOrAdmin(post.getAuthor().getId(), actorUserId);

        if (request.title() != null && !request.title().isBlank()) {
            post.setTitle(request.title().strip());
        }
        if (request.body() != null && !request.body().isBlank()) {
            post.setBody(request.body().strip());
        }
        if (request.tags() != null) {
            post.setTags(request.tags());
        }
        // Opportunity field patches
        if (request.opportunityCompany()      != null) post.setOpportunityCompany(request.opportunityCompany());
        if (request.opportunityRole()         != null) post.setOpportunityRole(request.opportunityRole());
        if (request.opportunityLocation()     != null) post.setOpportunityLocation(request.opportunityLocation());
        if (request.opportunityType()         != null) post.setOpportunityType(request.opportunityType());
        if (request.opportunityDeadline()     != null) post.setOpportunityDeadline(request.opportunityDeadline());
        if (request.opportunityApplyUrl()     != null) post.setOpportunityApplyUrl(request.opportunityApplyUrl());
        if (request.opportunityEligibility()  != null) post.setOpportunityEligibility(request.opportunityEligibility());
        if (request.opportunityCompensation() != null) post.setOpportunityCompensation(request.opportunityCompensation());

        post.setStatus(CommunityContentStatus.EDITED);
        CommunityPost saved = postRepository.save(post);
        log.info("Community post updated: id={}, actor={}", postId, actorUserId);
        return toPostResponse(saved, actorUserId);
    }

    @Override
    @Transactional
    public void deletePost(UUID postId, UUID actorUserId) {
        CommunityPost post = loadPost(postId);
        assertAuthorOrAdmin(post.getAuthor().getId(), actorUserId);
        post.setStatus(CommunityContentStatus.DELETED);
        postRepository.save(post);
        log.info("Community post soft-deleted: id={}, actor={}", postId, actorUserId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Post Votes
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CommunityPostResponse togglePostUpvote(UUID postId, UUID actorUserId) {
        CommunityPost post = loadPost(postId);
        User actor = loadUser(actorUserId);

        if (voteRepository.existsByUserIdAndPostId(actorUserId, postId)) {
            // Remove upvote
            voteRepository.deleteByUserIdAndPostId(actorUserId, postId);
            postRepository.decrementUpvoteCount(postId);
            log.debug("Post upvote removed: postId={}, userId={}", postId, actorUserId);
        } else {
            // Add upvote
            voteRepository.save(CommunityVote.builder().user(actor).post(post).build());
            postRepository.incrementUpvoteCount(postId);
            log.debug("Post upvoted: postId={}, userId={}", postId, actorUserId);

            // Notify post author if they are not the upvoter and post is not anonymous
            if (!post.getAuthor().getId().equals(actorUserId) && !post.isAnonymous()) {
                sendCommunityNotification(
                        post.getAuthor(),
                        NotificationType.COMMUNITY_POST_UPVOTED,
                        "Your post was upvoted",
                        actor.getFullName() + " upvoted your post: \"" + truncate(post.getTitle(), 60) + "\"",
                        postId,
                        "COMMUNITY_POST",
                        actor.getFullName()
                );
            }
        }

        // Reload to get updated count
        CommunityPost reloaded = loadPost(postId);
        return toPostResponse(reloaded, actorUserId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Replies
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CommunityReplyResponse createReply(UUID postId, UUID actorUserId, CommunityReplyCreateRequest request) {
        CommunityPost post = loadPost(postId);
        User author = loadUser(actorUserId);

        if (post.getStatus() == CommunityContentStatus.DELETED
                || post.getStatus() == CommunityContentStatus.HIDDEN) {
            throw new BadRequestException("Cannot reply to a hidden or deleted post.");
        }

        CommunityReply.CommunityReplyBuilder builder = CommunityReply.builder()
                .post(post)
                .author(author)
                .body(request.body().strip())
                .isAnonymous(request.anonymous())
                .status(CommunityContentStatus.ACTIVE);

        // Handle threading (one level deep only)
        if (request.parentReplyId() != null) {
            CommunityReply parent = replyRepository.findById(request.parentReplyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Reply", "id", request.parentReplyId()));
            if (!parent.getPost().getId().equals(postId)) {
                throw new BadRequestException("Parent reply does not belong to this post.");
            }
            if (parent.getParentReply() != null) {
                throw new BadRequestException("Replies can only be nested one level deep.");
            }
            builder.parentReply(parent);
        }

        CommunityReply saved = replyRepository.save(builder.build());
        postRepository.incrementReplyCount(postId);

        log.info("Community reply created: id={}, postId={}, actor={}", saved.getId(), postId, actorUserId);

        // Notify post author (unless they replied to their own post)
        if (!post.getAuthor().getId().equals(actorUserId)) {
            String actorLabel = request.anonymous() ? "Someone" : author.getFullName();
            sendCommunityNotification(
                    post.getAuthor(),
                    NotificationType.COMMUNITY_POST_REPLIED,
                    "New reply on your post",
                    actorLabel + " replied to your post: \"" + truncate(post.getTitle(), 60) + "\"",
                    postId,
                    "COMMUNITY_POST",
                    actorLabel
            );
        }

        return toReplyResponse(saved, actorUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<CommunityReplyResponse> getReplies(UUID postId, UUID currentUserId, Pageable pageable) {
        // Verify post exists
        if (!postRepository.existsById(postId)) {
            throw new ResourceNotFoundException("Community post", "id", postId);
        }
        Page<CommunityReply> page = replyRepository
                .findByPostIdAndParentReplyIsNullAndStatusNotOrderByCreatedAtAsc(
                        postId, CommunityContentStatus.DELETED, pageable);
        return PagedResponse.from(page.map(r -> toReplyResponse(r, currentUserId)));
    }

    @Override
    @Transactional
    public CommunityReplyResponse updateReply(UUID replyId, UUID actorUserId, String newBody) {
        CommunityReply reply = loadReply(replyId);
        assertAuthorOrAdmin(reply.getAuthor().getId(), actorUserId);
        if (newBody == null || newBody.isBlank()) {
            throw new BadRequestException("Reply body cannot be empty.");
        }
        reply.setBody(newBody.strip());
        reply.setStatus(CommunityContentStatus.EDITED);
        CommunityReply saved = replyRepository.save(reply);
        return toReplyResponse(saved, actorUserId);
    }

    @Override
    @Transactional
    public void deleteReply(UUID replyId, UUID actorUserId) {
        CommunityReply reply = loadReply(replyId);
        assertAuthorOrAdmin(reply.getAuthor().getId(), actorUserId);
        reply.setStatus(CommunityContentStatus.DELETED);
        replyRepository.save(reply);
        postRepository.decrementReplyCount(reply.getPost().getId());
        log.info("Community reply soft-deleted: id={}, actor={}", replyId, actorUserId);
    }

    @Override
    @Transactional
    public CommunityReplyResponse toggleReplyUpvote(UUID replyId, UUID actorUserId) {
        CommunityReply reply = loadReply(replyId);
        User actor = loadUser(actorUserId);

        if (voteRepository.existsByUserIdAndReplyId(actorUserId, replyId)) {
            voteRepository.deleteByUserIdAndReplyId(actorUserId, replyId);
            replyRepository.decrementUpvoteCount(replyId);
        } else {
            voteRepository.save(CommunityVote.builder().user(actor).reply(reply).build());
            replyRepository.incrementUpvoteCount(replyId);
        }

        CommunityReply updated = loadReply(replyId);
        return toReplyResponse(updated, actorUserId);
    }

    @Override
    @Transactional
    public CommunityPostResponse acceptReply(UUID postId, UUID acceptedReplyId, UUID actorUserId) {
        CommunityPost post = loadPost(postId);

        if (post.getContentType() != CommunityContentType.QUESTION) {
            throw new BadRequestException("Only QUESTION posts can have an accepted reply.");
        }

        boolean isAuthor = post.getAuthor().getId().equals(actorUserId);
        boolean isAdmin = isUserAdmin(actorUserId);
        if (!isAuthor && !isAdmin) {
            throw new ForbiddenException("Only the question author or an administrator can accept an answer.");
        }

        CommunityReply reply = loadReply(acceptedReplyId);
        if (!reply.getPost().getId().equals(postId)) {
            throw new BadRequestException("The specified reply does not belong to this post.");
        }

        // Toggle: if already accepted, unaccept it
        if (post.isSolved() && acceptedReplyId.equals(post.getAcceptedReplyId())) {
            post.setSolved(false);
            post.setAcceptedReplyId(null);
            log.info("Reply unaccepted: postId={}, replyId={}, actor={}", postId, acceptedReplyId, actorUserId);
        } else {
            post.setSolved(true);
            post.setAcceptedReplyId(acceptedReplyId);

            // Notify the reply author (unless accepting own answer)
            if (!reply.getAuthor().getId().equals(actorUserId)) {
                User actor = loadUser(actorUserId);
                sendCommunityNotification(
                        reply.getAuthor(),
                        NotificationType.COMMUNITY_REPLY_ACCEPTED,
                        "Your answer was accepted!",
                        "Your reply on \"" + truncate(post.getTitle(), 60) + "\" was accepted as the best answer.",
                        postId,
                        "COMMUNITY_POST",
                        actor.getFullName()
                );
            }
            log.info("Reply accepted: postId={}, replyId={}, actor={}", postId, acceptedReplyId, actorUserId);
        }

        CommunityPost saved = postRepository.save(post);
        return toPostResponse(saved, actorUserId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin Moderation
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CommunityPostResponse pinPost(UUID postId, UUID adminUserId) {
        User admin = loadUser(adminUserId);
        assertAdmin(admin);
        CommunityPost post = loadPost(postId);
        post.setPinned(true);
        post.setModeratedBy(admin);
        return toPostResponse(postRepository.save(post), adminUserId);
    }

    @Override
    @Transactional
    public CommunityPostResponse unpinPost(UUID postId, UUID adminUserId) {
        User admin = loadUser(adminUserId);
        assertAdmin(admin);
        CommunityPost post = loadPost(postId);
        post.setPinned(false);
        post.setModeratedBy(admin);
        return toPostResponse(postRepository.save(post), adminUserId);
    }

    @Override
    @Transactional
    public CommunityPostResponse hidePost(UUID postId, UUID adminUserId, String reason) {
        User admin = loadUser(adminUserId);
        assertAdmin(admin);
        CommunityPost post = loadPost(postId);
        post.setStatus(CommunityContentStatus.HIDDEN);
        post.setModeratedBy(admin);
        post.setModerationNote(reason);
        postRepository.save(post);

        // Notify post author
        if (!post.getAuthor().getId().equals(adminUserId)) {
            sendCommunityNotification(
                    post.getAuthor(),
                    NotificationType.COMMUNITY_POST_HIDDEN,
                    "Your post has been hidden",
                    "Your post \"" + truncate(post.getTitle(), 60) + "\" was hidden by an administrator."
                            + (reason != null && !reason.isBlank() ? " Reason: " + reason : ""),
                    postId,
                    "COMMUNITY_POST",
                    "BIT Connect Admin"
            );
        }

        log.info("Community post hidden by admin: postId={}, admin={}", postId, adminUserId);
        return toPostResponse(post, adminUserId);
    }

    @Override
    @Transactional
    public CommunityReplyResponse hideReply(UUID replyId, UUID adminUserId, String reason) {
        User admin = loadUser(adminUserId);
        assertAdmin(admin);
        CommunityReply reply = loadReply(replyId);
        reply.setStatus(CommunityContentStatus.HIDDEN);
        reply.setModeratedBy(admin);
        reply.setModerationNote(reason);
        replyRepository.save(reply);
        log.info("Community reply hidden by admin: replyId={}, admin={}", replyId, adminUserId);
        return toReplyResponse(reply, adminUserId);
    }

    @Override
    @Transactional
    public CommunityPostResponse verifyOpportunity(UUID postId, UUID adminUserId) {
        User admin = loadUser(adminUserId);
        assertAdmin(admin);
        CommunityPost post = loadPost(postId);
        if (post.getContentType() != CommunityContentType.OPPORTUNITY) {
            throw new BadRequestException("Only OPPORTUNITY posts can have verification status updated.");
        }
        post.setOpportunityModerationStatus(OpportunityModerationStatus.VERIFIED_BY_BIT);
        post.setModeratedBy(admin);
        CommunityPost saved = postRepository.save(post);
        log.info("Opportunity post verified by admin: postId={}, admin={}", postId, adminUserId);
        return toPostResponse(saved, adminUserId);
    }

    @Override
    @Transactional
    public CommunityPostResponse unverifyOpportunity(UUID postId, UUID adminUserId) {
        User admin = loadUser(adminUserId);
        assertAdmin(admin);
        CommunityPost post = loadPost(postId);
        if (post.getContentType() != CommunityContentType.OPPORTUNITY) {
            throw new BadRequestException("Only OPPORTUNITY posts can have verification status updated.");
        }
        post.setOpportunityModerationStatus(OpportunityModerationStatus.COMMUNITY_POSTED);
        post.setModeratedBy(admin);
        CommunityPost saved = postRepository.save(post);
        log.info("Opportunity post unverified by admin: postId={}, admin={}", postId, adminUserId);
        return toPostResponse(saved, adminUserId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    private User loadUser(UUID userId) {
        return userRepository.findWithRolesById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private CommunityPost loadPost(UUID postId) {
        return postRepository.findByIdWithDetails(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Community post", "id", postId));
    }

    private CommunityReply loadReply(UUID replyId) {
        return replyRepository.findByIdWithDetails(replyId)
                .orElseThrow(() -> new ResourceNotFoundException("Community reply", "id", replyId));
    }

    /** Asserts that actorUserId is either the resource owner or an admin. */
    private void assertAuthorOrAdmin(UUID resourceOwnerId, UUID actorUserId) {
        if (resourceOwnerId.equals(actorUserId)) return;
        User actor = userRepository.findWithRolesById(actorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", actorUserId));
        boolean isAdmin = actor.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ROLE_ADMIN);
        if (!isAdmin) {
            throw new ForbiddenException("You do not have permission to modify this resource.");
        }
    }

    private void assertAdmin(User user) {
        boolean isAdmin = user.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ROLE_ADMIN);
        if (!isAdmin) {
            throw new ForbiddenException("Admin role required for this operation.");
        }
    }

    private boolean isUserAdmin(UUID userId) {
        if (userId == null) return false;
        return userRepository.findWithRolesById(userId)
                .map(u -> u.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_ADMIN))
                .orElse(false);
    }

    private record AuthorProfileMeta(String photoUrl, String designation) {}

    private AuthorProfileMeta resolveAuthorMeta(User author) {
        if (author == null) return new AuthorProfileMeta(null, null);

        // Check if student
        Optional<StudentProfile> studentOpt = studentProfileRepository.findByUserIdWithDetails(author.getId());
        if (studentOpt.isPresent()) {
            StudentProfile sp = studentOpt.get();
            String dept = sp.getDepartment() != null ? sp.getDepartment().getCode() : "";
            String desig = (sp.getDegree() != null ? sp.getDegree() + " " : "") + dept;
            return new AuthorProfileMeta(sp.getProfilePhotoUrl(), desig.isBlank() ? "Student" : desig.strip());
        }

        // Check if alumni
        Optional<AlumniProfile> alumniOpt = alumniProfileRepository.findByUserId(author.getId());
        if (alumniOpt.isPresent()) {
            AlumniProfile ap = alumniOpt.get();
            String desig = ap.getCurrentDesignation();
            if (ap.getCurrentCompany() != null && !ap.getCurrentCompany().isBlank()) {
                desig = (desig != null ? desig + " at " : "") + ap.getCurrentCompany();
            }
            if (desig == null || desig.isBlank()) {
                desig = "Alumni" + (ap.getBatchEndYear() != null ? " • Class of '" + (ap.getBatchEndYear() % 100) : "");
            }
            return new AuthorProfileMeta(ap.getProfilePhotoUrl(), desig);
        }

        // Check if staff
        Optional<StaffProfile> staffOpt = staffProfileRepository.findByUserId(author.getId());
        if (staffOpt.isPresent()) {
            StaffProfile stp = staffOpt.get();
            return new AuthorProfileMeta(null, stp.getDesignation());
        }

        return new AuthorProfileMeta(null, null);
    }

    private CommunityPostResponse toPostResponse(CommunityPost post, UUID currentUserId) {
        boolean hasUpvoted = currentUserId != null
                && voteRepository.existsByUserIdAndPostId(currentUserId, post.getId());
        AuthorProfileMeta meta = resolveAuthorMeta(post.getAuthor());
        return CommunityPostResponse.from(post, hasUpvoted, currentUserId, meta.photoUrl(), meta.designation());
    }

    private CommunityReplyResponse toReplyResponse(CommunityReply reply, UUID currentUserId) {
        boolean hasUpvoted = currentUserId != null
                && voteRepository.existsByUserIdAndReplyId(currentUserId, reply.getId());
        AuthorProfileMeta meta = resolveAuthorMeta(reply.getAuthor());
        return CommunityReplyResponse.from(reply, hasUpvoted, currentUserId, meta.photoUrl());
    }

    private void sendCommunityNotification(
            User recipient,
            NotificationType type,
            String title,
            String message,
            UUID referenceId,
            String referenceType,
            String actorName) {
        try {
            notificationService.sendNotification(recipient, type, title, message, referenceId, referenceType, null, actorName);
        } catch (Exception e) {
            // Notification failures must never break the main business flow
            log.warn("Failed to send community notification type={} to userId={}: {}", type, recipient.getId(), e.getMessage());
        }
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() > max ? s.substring(0, max) + "…" : s;
    }
}
