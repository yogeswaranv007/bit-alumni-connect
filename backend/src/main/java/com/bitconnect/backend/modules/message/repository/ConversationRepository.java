package com.bitconnect.backend.modules.message.repository;

import com.bitconnect.backend.modules.message.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @EntityGraph(attributePaths = {"user1", "user1.roles", "user2", "user2.roles"})
    @Query("SELECT c FROM Conversation c WHERE (c.user1.id = :u1 AND c.user2.id = :u2) OR (c.user1.id = :u2 AND c.user2.id = :u1)")
    Optional<Conversation> findBetweenUsers(@Param("u1") UUID u1, @Param("u2") UUID u2);

    @EntityGraph(attributePaths = {"user1", "user1.roles", "user2", "user2.roles"})
    @Query("SELECT c FROM Conversation c WHERE c.id = :id")
    Optional<Conversation> findByIdWithUsers(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"user1", "user1.roles", "user2", "user2.roles"})
    @Query("SELECT c FROM Conversation c WHERE c.user1.id = :userId OR c.user2.id = :userId ORDER BY c.lastMessageAt DESC NULLS LAST, c.createdAt DESC")
    Page<Conversation> findUserConversations(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Conversation c WHERE c.id = :conversationId AND (c.user1.id = :userId OR c.user2.id = :userId)")
    boolean isUserParticipant(@Param("conversationId") UUID conversationId, @Param("userId") UUID userId);
}
