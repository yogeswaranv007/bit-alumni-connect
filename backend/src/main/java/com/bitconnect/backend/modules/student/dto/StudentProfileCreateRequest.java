package com.bitconnect.backend.modules.student.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Request payload for creating a new student profile.
 * Fields match the BIT physical student ID card (front + back).
 *
 * Validation rules enforced here AND independently in StudentServiceImpl:
 *   - DOB must be in the past and student >= 14 years old
 *   - batchStartYear in [currentYear-3, currentYear]
 *   - batchEndYear = batchStartYear + 4 (auto-calculated; client-supplied value ignored)
 */
public record StudentProfileCreateRequest(

        @NotNull(message = "Department ID is required")
        Integer departmentId,

        @NotBlank(message = "Register number is required")
        @Size(min = 3, max = 30, message = "Register number must be 3-30 characters")
        String registerNumber,

        @NotBlank(message = "Degree is required")
        @Size(max = 50)
        String degree,

        @NotNull(message = "Batch start year is required")
        @Min(value = 2000, message = "Batch start year must be 2000 or later")
        @Max(value = 2100, message = "Batch start year must be 2100 or earlier")
        Integer batchStartYear,

        // batchEndYear is calculated on the backend as batchStartYear + 4; client value is ignored
        Integer batchEndYear,

        // Physical card fields (optional on creation, editable while PENDING/REJECTED)
        String studentType,       // "DAY_SCHOLAR" or "HOSTELER"
        String bloodGroup,

        // DOB validated on backend: must be past date, student >= 14 years old
        LocalDate dateOfBirth,

        String address,
        String studentPhone,
        String parentPhone,
        String officialEmail,
        String profilePhotoUrl
) {
}