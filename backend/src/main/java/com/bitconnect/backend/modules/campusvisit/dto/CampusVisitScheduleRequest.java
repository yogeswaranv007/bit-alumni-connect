package com.bitconnect.backend.modules.campusvisit.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

public record CampusVisitScheduleRequest(
        @NotNull(message = "Approved arrival time is required")
        LocalTime approvedArrivalTime,

        @Size(max = 200, message = "Meeting location cannot exceed 200 characters")
        String meetingLocation,

        @Size(max = 120, message = "Contact person cannot exceed 120 characters")
        String contactPerson,

        @Size(max = 2000, message = "Instructions cannot exceed 2000 characters")
        String adminRemarks
) {
}
