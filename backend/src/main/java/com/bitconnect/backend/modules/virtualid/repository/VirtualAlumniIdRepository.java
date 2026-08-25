package com.bitconnect.backend.modules.virtualid.repository;

import com.bitconnect.backend.modules.virtualid.entity.VirtualAlumniId;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VirtualAlumniIdRepository extends JpaRepository<VirtualAlumniId, UUID> {

    @EntityGraph(attributePaths = {"alumniProfile", "alumniProfile.user", "alumniProfile.department"})
    Optional<VirtualAlumniId> findByAlumniProfileId(UUID alumniProfileId);

    @EntityGraph(attributePaths = {"alumniProfile", "alumniProfile.user", "alumniProfile.department"})
    @Query("SELECT v FROM VirtualAlumniId v WHERE v.alumniProfile.user.id = :userId")
    Optional<VirtualAlumniId> findByUserId(@Param("userId") UUID userId);

    @EntityGraph(attributePaths = {"alumniProfile", "alumniProfile.user", "alumniProfile.department"})
    Optional<VirtualAlumniId> findByAlumniIdCardNumber(String alumniIdCardNumber);

    boolean existsByAlumniProfileId(UUID alumniProfileId);
}
