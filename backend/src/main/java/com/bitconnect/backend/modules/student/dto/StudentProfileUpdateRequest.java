package com.bitconnect.backend.modules.student.dto;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Partial update request for a student profile.
 * Only allowed while status is PENDING or REJECTED.
 * All fields optional — only non-null values applied.
 * Register number is NEVER updatable (institutional identity constraint).
 * Official institutional fields (registerNumber, bloodGroup, DOB, address, phones, officialEmail)
 * cannot be changed once APPROVED; admin must use the admin update endpoint instead.
 */
public record StudentProfileUpdateRequest(

        Integer departmentId,
        @Size(max = 50) String degree,
        Integer batchStartYear,
        Integer batchEndYear,

        // Physical-card fields (editable while PENDING or REJECTED)
        String studentType,
        String bloodGroup,
        LocalDate dateOfBirth,
        String address,
        String studentPhone,
        String parentPhone,
        String officialEmail,

        // Photo is always editable regardless of status
        String profilePhotoUrl
) {
}
