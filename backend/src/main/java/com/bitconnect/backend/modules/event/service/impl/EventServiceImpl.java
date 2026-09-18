package com.bitconnect.backend.modules.event.service.impl;

import com.bitconnect.backend.common.exception.ResourceNotFoundException;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitEvent;
import com.bitconnect.backend.modules.campusvisit.repository.CampusVisitEventRepository;
import com.bitconnect.backend.modules.department.entity.Department;
import com.bitconnect.backend.modules.department.repository.DepartmentRepository;
import com.bitconnect.backend.modules.event.dto.EventCreateRequest;
import com.bitconnect.backend.modules.event.dto.EventDto;
import com.bitconnect.backend.modules.event.entity.Event;
import com.bitconnect.backend.modules.event.entity.EventParticipant;
import com.bitconnect.backend.modules.event.entity.ParticipantStatus;
import com.bitconnect.backend.modules.event.repository.EventParticipantRepository;
import com.bitconnect.backend.modules.event.repository.EventRepository;
import com.bitconnect.backend.modules.event.service.EventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final EventParticipantRepository participantRepository;
    private final CampusVisitEventRepository campusVisitEventRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional
    public EventDto createEvent(EventCreateRequest request) {
        Department department = null;
        if (request.departmentId() != null) {
            department = departmentRepository.findById(request.departmentId()).orElse(null);
        }

        Event event = Event.builder()
                .title(request.title())
                .eventType(request.eventType())
                .locationType(request.locationType())
                .venue(request.venue())
                .eventDate(request.eventDate())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .department(department)
                .organizer(request.organizer())
                .description(request.description())
                .isActive(true)
                .build();

        Event saved = eventRepository.save(event);
        log.info("Created event: {} on {}", saved.getTitle(), saved.getEventDate());
        return EventDto.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventDto> getUpcomingEvents() {
        return eventRepository.findByEventDateGreaterThanEqualAndIsActiveTrueOrderByEventDateAscStartTimeAsc(LocalDate.now())
                .stream()
                .map(EventDto::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventDto> getUpcomingOnCampusEvents() {
        return eventRepository.findUpcomingOnCampusEvents(LocalDate.now())
                .stream()
                .map(EventDto::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventDto> getEventsByDate(LocalDate date) {
        return eventRepository.findByEventDateAndIsActiveTrue(date)
                .stream()
                .map(EventDto::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public EventDto getEventById(UUID eventId) {
        Event event = eventRepository.findByIdWithDetails(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
        return EventDto.from(event);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> getActiveEventsForAlumniOnDate(UUID alumniProfileId, LocalDate date) {
        Set<UUID> seenEventIds = new HashSet<>();
        List<Event> result = new ArrayList<>();

        // 1. Check direct EventParticipant assignments for this date
        List<EventParticipant> participations = participantRepository.findByAlumniProfileIdAndEventDateAndStatusIn(
                alumniProfileId, date, List.of(ParticipantStatus.INVITED, ParticipantStatus.REGISTERED, ParticipantStatus.ATTENDED)
        );
        for (EventParticipant ep : participations) {
            if (seenEventIds.add(ep.getEvent().getId())) {
                result.add(ep.getEvent());
            }
        }

        // 2. Check CampusVisitEvent associations for this date
        List<CampusVisitEvent> visitEvents = campusVisitEventRepository.findByAlumniProfileIdAndVisitDate(alumniProfileId, date);
        for (CampusVisitEvent cve : visitEvents) {
            if (seenEventIds.add(cve.getEvent().getId())) {
                result.add(cve.getEvent());
            }
        }

        return result;
    }
}
