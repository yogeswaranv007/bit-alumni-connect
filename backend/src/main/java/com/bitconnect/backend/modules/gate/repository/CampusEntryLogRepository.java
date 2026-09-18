package com.bitconnect.backend.modules.gate.repository;

import com.bitconnect.backend.modules.gate.entity.CampusEntryLog;
import com.bitconnect.backend.modules.gate.entity.EntryDecision;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CampusEntryLogRepository extends JpaRepository<CampusEntryLog, UUID>, JpaSpecificationExecutor<CampusEntryLog> {

    @EntityGraph(attributePaths = {"alumniProfile", "alumniProfile.user", "alumniProfile.department", "campusVisit", "watchman"})
    List<CampusEntryLog> findByEntryDateOrderByEntryTimestampDesc(LocalDate entryDate);

    @EntityGraph(attributePaths = {"alumniProfile", "alumniProfile.user", "alumniProfile.department", "campusVisit", "watchman"})
    List<CampusEntryLog> findTop20ByOrderByEntryTimestampDesc();

    @EntityGraph(attributePaths = {"alumniProfile", "alumniProfile.user", "alumniProfile.department", "campusVisit", "watchman"})
    List<CampusEntryLog> findByAlumniProfileIdOrderByEntryTimestampDesc(UUID alumniProfileId);

    @EntityGraph(attributePaths = {"alumniProfile", "alumniProfile.user", "alumniProfile.department", "campusVisit", "watchman"})
    @Query("SELECT l FROM CampusEntryLog l WHERE l.id = :id")
    Optional<CampusEntryLog> findByIdWithDetails(@Param("id") UUID id);

    long countByEntryDateAndEntryDecision(LocalDate entryDate, EntryDecision entryDecision);
}
