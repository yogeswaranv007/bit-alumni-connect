package com.bitconnect.backend.modules.event.repository;

import com.bitconnect.backend.modules.event.entity.Event;
import com.bitconnect.backend.modules.event.entity.EventLocationType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {

    @EntityGraph(attributePaths = {"department"})
    List<Event> findByEventDateAndIsActiveTrue(LocalDate eventDate);

    @EntityGraph(attributePaths = {"department"})
    List<Event> findByEventDateGreaterThanEqualAndIsActiveTrueOrderByEventDateAscStartTimeAsc(LocalDate fromDate);

    @EntityGraph(attributePaths = {"department"})
    List<Event> findByEventDateAndLocationTypeAndIsActiveTrue(LocalDate eventDate, EventLocationType locationType);

    @EntityGraph(attributePaths = {"department"})
    @Query("SELECT e FROM Event e WHERE e.eventDate >= :today AND e.locationType = 'ON_CAMPUS' AND e.isActive = true ORDER BY e.eventDate ASC, e.startTime ASC")
    List<Event> findUpcomingOnCampusEvents(@Param("today") LocalDate today);

    @EntityGraph(attributePaths = {"department"})
    @Query("SELECT e FROM Event e WHERE e.id = :id")
    Optional<Event> findByIdWithDetails(@Param("id") UUID id);
}
