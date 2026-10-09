package com.bitconnect.backend.modules.community.repository;

import com.bitconnect.backend.modules.community.entity.CommunityVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommunityVoteRepository extends JpaRepository<CommunityVote, UUID> {

    /** Vote cast by a user on a specific post. */
    Optional<CommunityVote> findByUserIdAndPostId(UUID userId, UUID postId);

    /** Vote cast by a user on a specific reply. */
    Optional<CommunityVote> findByUserIdAndReplyId(UUID userId, UUID replyId);

    boolean existsByUserIdAndPostId(UUID userId, UUID postId);

    boolean existsByUserIdAndReplyId(UUID userId, UUID replyId);

    void deleteByUserIdAndPostId(UUID userId, UUID postId);

    void deleteByUserIdAndReplyId(UUID userId, UUID replyId);
}
