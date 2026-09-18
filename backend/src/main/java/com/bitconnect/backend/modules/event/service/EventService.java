package com.bitconnect.backend.modules.event.service;

import com.bitconnect.backend.modules.event.dto.EventCreateRequest;
import com.bitconnect.backend.modules.event.dto.EventDto;
import com.bitconnect.backend.modules.event.entity.Event;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface EventService {

    EventDto createEvent(EventCreateRequest request);

    List<EventDto> getUpcomingEvents();

    List<EventDto> getUpcomingOnCampusEvents();

    List<EventDto> getEventsByDate(LocalDate date);

    EventDto getEventById(UUID eventId);

    List<Event> getActiveEventsForAlumniOnDate(UUID alumniProfileId, LocalDate date);
}
