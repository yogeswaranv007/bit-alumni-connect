package com.bitconnect.backend.modules.community.repository;

import com.bitconnect.backend.modules.community.entity.CommunityContentStatus;
import com.bitconnect.backend.modules.community.entity.CommunityReply;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommunityReplyRepository extends JpaRepository<CommunityReply, UUID> {

    // ─── Fetch with associations ───────────────────────────────────────────────

    @EntityGraph(attributePaths = {"post", "author", "author.roles", "parentReply", "moderatedBy"})
    @Query("SELECT r FROM CommunityReply r WHERE r.id = :id")
    Optional<CommunityReply> findByIdWithDetails(@Param("id") UUID id);

    /** Top-level (non-nested) replies for a post, newest first. */
    @EntityGraph(attributePaths = {"author", "author.roles", "moderatedBy"})
    Page<CommunityReply> findByPostIdAndParentReplyIsNullAndStatusNotOrderByCreatedAtAsc(
            UUID postId, CommunityContentStatus excludedStatus, Pageable pageable);

    /** Thread replies nested under a specific top-level reply. */
    @EntityGraph(attributePaths = {"author", "author.roles"})
    List<CommunityReply> findByParentReplyIdAndStatusNotOrderByCreatedAtAsc(
            UUID parentReplyId, CommunityContentStatus excludedStatus);

    // ─── Counter updates ───────────────────────────────────────────────────────

    @Modifying
    @Query("UPDATE CommunityReply r SET r.upvoteCount = r.upvoteCount + 1 WHERE r.id = :id")
    void incrementUpvoteCount(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE CommunityReply r SET r.upvoteCount = r.upvoteCount - 1 WHERE r.id = :id AND r.upvoteCount > 0")
    void decrementUpvoteCount(@Param("id") UUID id);

    // ─── Existence checks ─────────────────────────────────────────────────────

    boolean existsByIdAndAuthorId(UUID replyId, UUID authorId);

    boolean existsByIdAndPostId(UUID replyId, UUID postId);

    long countByPostIdAndStatusNot(UUID postId, CommunityContentStatus excludedStatus);
}
