package com.bitconnect.backend.modules.rfid.repository;

import com.bitconnect.backend.modules.rfid.entity.RfidIdentityMapping;
import com.bitconnect.backend.modules.rfid.entity.RfidStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RfidIdentityMappingRepository extends JpaRepository<RfidIdentityMapping, UUID> {

    @EntityGraph(attributePaths = {"alumniProfile", "alumniProfile.user", "alumniProfile.department"})
    Optional<RfidIdentityMapping> findByRfidUid(String rfidUid);

    @EntityGraph(attributePaths = {"alumniProfile", "alumniProfile.user", "alumniProfile.department"})
    Optional<RfidIdentityMapping> findByRfidUidAndStatus(String rfidUid, RfidStatus status);

    @EntityGraph(attributePaths = {"alumniProfile", "alumniProfile.user", "alumniProfile.department"})
    Optional<RfidIdentityMapping> findByAlumniProfileId(UUID alumniProfileId);

    boolean existsByRfidUid(String rfidUid);

    boolean existsByAlumniProfileId(UUID alumniProfileId);
}
