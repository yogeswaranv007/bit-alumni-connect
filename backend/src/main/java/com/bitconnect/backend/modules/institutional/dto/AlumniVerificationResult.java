package com.bitconnect.backend.modules.institutional.dto;

import com.bitconnect.backend.modules.institutional.entity.CollegeRecordStatus;

import java.time.LocalDate;

/**
 * Result returned when an alumni is successfully verified against the institutional master data.
 */
public record AlumniVerificationResult(
        String institutionalRecordId,
        String registerNumber,
        String name,
        LocalDate dateOfBirth,
        String degree,
        String departmentCode,
        Integer graduationYear,
        String officialEmail,
        String phone,
        String address,
        CollegeRecordStatus recordStatus
) {}
