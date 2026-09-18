package com.bitconnect.backend.modules.event.dto;

import com.bitconnect.backend.modules.event.entity.Event;
import com.bitconnect.backend.modules.event.entity.EventLocationType;
import com.bitconnect.backend.modules.event.entity.EventType;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record EventDto(
        UUID id,
        String title,
        EventType eventType,
        EventLocationType locationType,
        String venue,
        LocalDate eventDate,
        LocalTime startTime,
        LocalTime endTime,
        Integer departmentId,
        String departmentName,
        String departmentCode,
        String organizer,
        String description,
        boolean isActive
) {
    public static EventDto from(Event e) {
        Integer deptId = e.getDepartment() != null ? e.getDepartment().getId() : null;
        String deptName = e.getDepartment() != null ? e.getDepartment().getName() : null;
        String deptCode = e.getDepartment() != null ? e.getDepartment().getCode() : null;

        return new EventDto(
                e.getId(),
                e.getTitle(),
                e.getEventType(),
                e.getLocationType(),
                e.getVenue(),
                e.getEventDate(),
                e.getStartTime(),
                e.getEndTime(),
                deptId,
                deptName,
                deptCode,
                e.getOrganizer(),
                e.getDescription(),
                e.isActive()
        );
    }
}
