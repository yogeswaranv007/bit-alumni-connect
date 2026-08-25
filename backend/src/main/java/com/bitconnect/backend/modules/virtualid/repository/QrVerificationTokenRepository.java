package com.bitconnect.backend.modules.virtualid.repository;

import com.bitconnect.backend.modules.virtualid.entity.QrVerificationToken;
import com.bitconnect.backend.modules.virtualid.entity.TokenStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QrVerificationTokenRepository extends JpaRepository<QrVerificationToken, UUID> {

    @EntityGraph(attributePaths = {
            "virtualAlumniId",
            "virtualAlumniId.alumniProfile",
            "virtualAlumniId.alumniProfile.user",
            "virtualAlumniId.alumniProfile.department"
    })
    Optional<QrVerificationToken> findByToken(String token);

    @Query("SELECT t FROM QrVerificationToken t WHERE t.virtualAlumniId.id = :virtualIdId AND t.status = :status")
    Optional<QrVerificationToken> findActiveTokenByVirtualIdId(
            @Param("virtualIdId") UUID virtualIdId,
            @Param("status") TokenStatus status
    );

    List<QrVerificationToken> findAllByVirtualAlumniIdIdOrderByCreatedAtDesc(UUID virtualAlumniIdId);
}
