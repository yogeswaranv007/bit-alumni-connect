package com.bitconnect.backend.modules.campusvisit.repository;

import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitEvent;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface CampusVisitEventRepository extends JpaRepository<CampusVisitEvent, UUID> {

    @EntityGraph(attributePaths = {"event", "event.department"})
    List<CampusVisitEvent> findByCampusVisitId(UUID campusVisitId);

    @EntityGraph(attributePaths = {"event", "event.department"})
    @Query("SELECT cve FROM CampusVisitEvent cve WHERE cve.campusVisit.alumniProfile.id = :profileId AND cve.campusVisit.visitDate = :visitDate")
    List<CampusVisitEvent> findByAlumniProfileIdAndVisitDate(
            @Param("profileId") UUID profileId,
            @Param("visitDate") LocalDate visitDate
    );

    void deleteByCampusVisitId(UUID campusVisitId);
}
