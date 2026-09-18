package com.bitconnect.backend.modules.event.repository;

import com.bitconnect.backend.modules.event.entity.EventParticipant;
import com.bitconnect.backend.modules.event.entity.ParticipantStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventParticipantRepository extends JpaRepository<EventParticipant, UUID> {

    @EntityGraph(attributePaths = {"event", "event.department", "alumniProfile"})
    List<EventParticipant> findByAlumniProfileId(UUID alumniProfileId);

    @EntityGraph(attributePaths = {"event", "event.department", "alumniProfile"})
    @Query("SELECT ep FROM EventParticipant ep WHERE ep.alumniProfile.id = :profileId AND ep.event.eventDate = :eventDate AND ep.status IN :statuses")
    List<EventParticipant> findByAlumniProfileIdAndEventDateAndStatusIn(
            @Param("profileId") UUID profileId,
            @Param("eventDate") LocalDate eventDate,
            @Param("statuses") Collection<ParticipantStatus> statuses
    );

    Optional<EventParticipant> findByEventIdAndAlumniProfileId(UUID eventId, UUID alumniProfileId);

    boolean existsByEventIdAndAlumniProfileId(UUID eventId, UUID alumniProfileId);
}
