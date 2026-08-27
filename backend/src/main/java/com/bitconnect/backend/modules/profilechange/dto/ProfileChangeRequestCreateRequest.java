package com.bitconnect.backend.modules.profilechange.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Payload for submitting a profile change request.
 */
public record ProfileChangeRequestCreateRequest(
        String fullName,
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
        Integer departmentId,
        String degree,
        Integer batchStartYear,
        Integer batchEndYear,
        String rollNumber,
        String registerNumber,
        Boolean isDirectoryVisible
) {
}
