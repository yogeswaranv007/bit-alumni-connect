package com.bitconnect.backend.modules.institutional.dto;

import com.bitconnect.backend.modules.institutional.entity.CollegeRecordStatus;
import com.bitconnect.backend.modules.institutional.entity.StudentRecordType;

import java.time.LocalDate;

/**
 * Result returned when a student is successfully verified against the institutional master data.
 * Only the fields needed by BIT Connect are exposed.
 * The raw CollegeStudentRecord is never passed outside the institutional layer.
 */
public record StudentVerificationResult(
        String institutionalRecordId,
        String registerNumber,
        String name,
        LocalDate dateOfBirth,
        String degree,
        String departmentCode,
        Integer batchStartYear,
        Integer batchEndYear,
        StudentRecordType studentType,
        String officialEmail,
        String phone,
        String parentPhone,
        String bloodGroup,
        String address,
        CollegeRecordStatus recordStatus
) {}
