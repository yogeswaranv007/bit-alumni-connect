package com.bitconnect.backend.modules.campusvisit.repository;

import com.bitconnect.backend.modules.campusvisit.entity.CampusVisit;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CampusVisitRepository extends JpaRepository<CampusVisit, UUID>, JpaSpecificationExecutor<CampusVisit> {

    @EntityGraph(attributePaths = {"alumniProfile", "alumniProfile.user", "alumniProfile.department", "department", "assignedFaculty", "approvedBy"})
    List<CampusVisit> findByAlumniProfileIdOrderByCreatedAtDesc(UUID alumniProfileId);

    @EntityGraph(attributePaths = {"alumniProfile", "alumniProfile.user", "alumniProfile.department", "department", "assignedFaculty", "approvedBy"})
    Optional<CampusVisit> findByIdAndAlumniProfileId(UUID id, UUID alumniProfileId);

    @EntityGraph(attributePaths = {"alumniProfile", "alumniProfile.user", "alumniProfile.department", "department", "assignedFaculty", "approvedBy"})
    @Query("SELECT cv FROM CampusVisit cv WHERE cv.id = :id")
    Optional<CampusVisit> findByIdWithDetails(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"alumniProfile", "alumniProfile.user", "alumniProfile.department", "department", "assignedFaculty", "approvedBy"})
    @Query("SELECT cv FROM CampusVisit cv WHERE cv.alumniProfile.id = :profileId AND cv.visitDate = :visitDate AND cv.status IN :statuses")
    List<CampusVisit> findByAlumniProfileIdAndVisitDateAndStatusIn(
            @Param("profileId") UUID profileId,
            @Param("visitDate") LocalDate visitDate,
            @Param("statuses") Collection<CampusVisitStatus> statuses
    );

    @EntityGraph(attributePaths = {"alumniProfile", "alumniProfile.user", "alumniProfile.department", "department", "assignedFaculty", "approvedBy"})
    @Query("SELECT cv FROM CampusVisit cv WHERE (cv.department.id = :departmentId OR cv.assignedFaculty.id = :facultyUserId) AND cv.status = 'PENDING' ORDER BY cv.createdAt ASC")
    List<CampusVisit> findPendingVisitsForFaculty(
            @Param("departmentId") Integer departmentId,
            @Param("facultyUserId") UUID facultyUserId
    );

    boolean existsByAlumniProfileIdAndVisitDateAndStatusIn(
            UUID alumniProfileId,
            LocalDate visitDate,
            Collection<CampusVisitStatus> statuses
    );

    long countByStatus(CampusVisitStatus status);

    long countByVisitDateAndStatusIn(LocalDate visitDate, Collection<CampusVisitStatus> statuses);

    @EntityGraph(attributePaths = {"alumniProfile", "alumniProfile.user", "alumniProfile.department", "department", "assignedFaculty", "approvedBy"})
    List<CampusVisit> findTop8ByStatusOrderByCreatedAtDesc(CampusVisitStatus status);
}
