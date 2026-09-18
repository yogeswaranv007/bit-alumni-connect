package com.bitconnect.backend.modules.gate.dto;

import com.bitconnect.backend.modules.event.entity.Event;
import com.bitconnect.backend.modules.event.entity.EventLocationType;
import com.bitconnect.backend.modules.event.entity.EventType;

import java.time.LocalTime;
import java.util.UUID;

public record TodayActivityDto(
        UUID eventId,
        String title,
        EventType eventType,
        EventLocationType locationType,
        LocalTime startTime,
        LocalTime endTime,
        String venue,
        String departmentName,
        String organizer,
        String description
) {
    public static TodayActivityDto from(Event e) {
        String deptName = e.getDepartment() != null ? e.getDepartment().getName() : "General";
        return new TodayActivityDto(
                e.getId(),
                e.getTitle(),
                e.getEventType(),
                e.getLocationType(),
                e.getStartTime(),
                e.getEndTime(),
                e.getVenue(),
                deptName,
                e.getOrganizer(),
                e.getDescription()
        );
    }
}
