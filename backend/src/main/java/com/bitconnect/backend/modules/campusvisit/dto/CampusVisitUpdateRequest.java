package com.bitconnect.backend.modules.campusvisit.dto;

import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record CampusVisitUpdateRequest(
        @NotNull(message = "Visit date is required")
        LocalDate visitDate,

        @NotNull(message = "Preferred arrival time is required")
        LocalTime preferredArrivalTime,

        @NotNull(message = "Visit type is required")
        CampusVisitType visitType,

        @NotBlank(message = "Purpose of visit is required")
        @Size(max = 1000, message = "Purpose cannot exceed 1000 characters")
        String purpose,

        Integer departmentId,

        UUID assignedFacultyId,

        List<UUID> associatedEventIds,

        @Size(max = 2000, message = "Remarks cannot exceed 2000 characters")
        String remarks
) {
}
