package com.bitconnect.backend.modules.message.repository;

import com.bitconnect.backend.modules.message.entity.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, UUID> {

    Optional<UserBlock> findByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);

    boolean existsByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM UserBlock b WHERE (b.blocker.id = :u1 AND b.blocked.id = :u2) OR (b.blocker.id = :u2 AND b.blocked.id = :u1)")
    boolean isBlockedEitherWay(@Param("u1") UUID u1, @Param("u2") UUID u2);
}
