package com.bitconnect.backend.modules.event.dto;

import com.bitconnect.backend.modules.event.entity.EventLocationType;
import com.bitconnect.backend.modules.event.entity.EventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record EventCreateRequest(
        @NotBlank(message = "Event title is required")
        @Size(max = 200, message = "Event title cannot exceed 200 characters")
        String title,

        @NotNull(message = "Event type is required")
        EventType eventType,

        @NotNull(message = "Location type is required")
        EventLocationType locationType,

        @Size(max = 200, message = "Venue cannot exceed 200 characters")
        String venue,

        @NotNull(message = "Event date is required")
        LocalDate eventDate,

        @NotNull(message = "Start time is required")
        LocalTime startTime,

        @NotNull(message = "End time is required")
        LocalTime endTime,

        Integer departmentId,

        @Size(max = 150, message = "Organizer cannot exceed 150 characters")
        String organizer,

        String description
) {
}
