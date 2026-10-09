package com.bitconnect.backend.modules.community.repository;

import com.bitconnect.backend.modules.community.entity.CommunityContentStatus;
import com.bitconnect.backend.modules.community.entity.CommunityContentType;
import com.bitconnect.backend.modules.community.entity.CommunityPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.domain.Specification;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for community post persistence.
 *
 * <p>All list/page queries eagerly fetch author (and author.roles) to avoid
 * N+1 selects when rendering the feed. Individual detail lookups also fetch
 * the department association.</p>
 */
@Repository
public interface CommunityPostRepository extends JpaRepository<CommunityPost, UUID>,
        JpaSpecificationExecutor<CommunityPost> {

    @Override
    @EntityGraph(attributePaths = {"author", "author.roles", "department"})
    Page<CommunityPost> findAll(Specification<CommunityPost> spec, Pageable pageable);

    // ─── Single-item fetch ────────────────────────────────────────────────────

    @EntityGraph(attributePaths = {"author", "author.roles", "department", "moderatedBy"})
    @Query("SELECT p FROM CommunityPost p WHERE p.id = :id")
    Optional<CommunityPost> findByIdWithDetails(@Param("id") UUID id);

    // ─── Paginated feed queries ───────────────────────────────────────────────

    /** All visible posts across all departments, newest first. */
    @EntityGraph(attributePaths = {"author", "author.roles", "department"})
    Page<CommunityPost> findByStatusNotOrderByIsPinnedDescCreatedAtDesc(
            CommunityContentStatus excludedStatus, Pageable pageable);

    /** Feed filtered by content type. */
    @EntityGraph(attributePaths = {"author", "author.roles", "department"})
    Page<CommunityPost> findByContentTypeAndStatusNotOrderByIsPinnedDescCreatedAtDesc(
            CommunityContentType contentType,
            CommunityContentStatus excludedStatus,
            Pageable pageable);

    /** Department-scoped feed — all content types. */
    @EntityGraph(attributePaths = {"author", "author.roles", "department"})
    Page<CommunityPost> findByDepartmentIdAndStatusNotOrderByIsPinnedDescCreatedAtDesc(
            Integer departmentId,
            CommunityContentStatus excludedStatus,
            Pageable pageable);

    /** Department-scoped feed filtered by content type. */
    @EntityGraph(attributePaths = {"author", "author.roles", "department"})
    Page<CommunityPost> findByDepartmentIdAndContentTypeAndStatusNotOrderByIsPinnedDescCreatedAtDesc(
            Integer departmentId,
            CommunityContentType contentType,
            CommunityContentStatus excludedStatus,
            Pageable pageable);

    /** Posts authored by a specific user. */
    @EntityGraph(attributePaths = {"author", "author.roles", "department"})
    Page<CommunityPost> findByAuthorIdAndStatusNotOrderByCreatedAtDesc(
            UUID authorId,
            CommunityContentStatus excludedStatus,
            Pageable pageable);

    // ─── Search ───────────────────────────────────────────────────────────────

    @EntityGraph(attributePaths = {"author", "author.roles", "department"})
    @Query("""
            SELECT p FROM CommunityPost p
            WHERE p.status <> 'DELETED'
              AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(p.body) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(p.tags) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY p.isPinned DESC, p.createdAt DESC
            """)
    Page<CommunityPost> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    // ─── Counter updates ─────────────────────────────────────────────────────

    @Modifying
    @Query("UPDATE CommunityPost p SET p.upvoteCount = p.upvoteCount + 1 WHERE p.id = :id")
    void incrementUpvoteCount(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE CommunityPost p SET p.upvoteCount = p.upvoteCount - 1 WHERE p.id = :id AND p.upvoteCount > 0")
    void decrementUpvoteCount(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE CommunityPost p SET p.replyCount = p.replyCount + 1 WHERE p.id = :id")
    void incrementReplyCount(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE CommunityPost p SET p.replyCount = p.replyCount - 1 WHERE p.id = :id AND p.replyCount > 0")
    void decrementReplyCount(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE CommunityPost p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    void incrementViewCount(@Param("id") UUID id);

    // ─── Existence checks ─────────────────────────────────────────────────────

    boolean existsByIdAndAuthorId(UUID postId, UUID authorId);
}
