package com.bitconnect.backend.modules.alumni.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Payload for initial alumni profile submission.
 */
public record AlumniProfileCreateRequest(
        @NotNull(message = "Department ID is required")
        Integer departmentId,

        @NotBlank(message = "Roll number is required")
        @Size(max = 30, message = "Roll number cannot exceed 30 characters")
        String rollNumber,

        @NotBlank(message = "University register number is required")
        @Size(max = 30, message = "Register number cannot exceed 30 characters")
        String registerNumber,

        @NotBlank(message = "Degree is required")
        @Size(max = 50, message = "Degree cannot exceed 50 characters")
        String degree,

        @NotNull(message = "Batch start year is required")
        @Min(value = 1996, message = "Batch start year must be 1996 or later")
        @Max(value = 2100, message = "Invalid batch start year")
        Integer batchStartYear,

        @NotNull(message = "Batch end / graduation year is required")
        @Min(value = 2000, message = "Batch end year must be 2000 or later")
        @Max(value = 2100, message = "Invalid batch end year")
        Integer batchEndYear,

        String profilePhotoUrl,

        LocalDate dateOfBirth,

        @Size(max = 10, message = "Blood group cannot exceed 10 characters")
        String bloodGroup,

        @Email(message = "Please provide a valid personal email address")
        @Size(max = 120, message = "Personal email cannot exceed 120 characters")
        String personalEmail,

        @Size(max = 20, message = "Phone number cannot exceed 20 characters")
        String phoneNumber,

        String permanentAddress,

        @Size(max = 80, message = "City cannot exceed 80 characters")
        String city,

        @Size(max = 80, message = "State cannot exceed 80 characters")
        String state,

        @Size(max = 80, message = "Country cannot exceed 80 characters")
        String country,

        @Size(max = 20, message = "Postal code cannot exceed 20 characters")
        String postalCode,

        @Size(max = 120, message = "Current company cannot exceed 120 characters")
        String currentCompany,

        @Size(max = 100, message = "Current designation cannot exceed 100 characters")
        String currentDesignation,

        @Size(max = 80, message = "Industry cannot exceed 80 characters")
        String industry,

        @Size(max = 255, message = "LinkedIn URL cannot exceed 255 characters")
        String linkedinUrl,

        Boolean isDirectoryVisible
) {
}
