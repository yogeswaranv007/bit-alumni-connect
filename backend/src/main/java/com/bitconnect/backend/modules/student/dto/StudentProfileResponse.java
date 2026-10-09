package com.bitconnect.backend.modules.student.dto;

import com.bitconnect.backend.modules.student.entity.RegistrationStatus;
import com.bitconnect.backend.modules.student.entity.StudentProfile;
import com.bitconnect.backend.modules.student.entity.StudentType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Read-only student profile response.
 * Includes all institutional fields and registration workflow state.
 * Used by student (own profile) and admin (review screen).
 */
public record StudentProfileResponse(
        UUID id,
        UUID userId,

        // Identity
        String fullName,
        String accountEmail,
        String registerNumber,
        String degree,
        Integer batchStartYear,
        Integer batchEndYear,
        Integer departmentId,
        String departmentCode,
        String departmentName,

        // Physical-card fields
        StudentType studentType,
        String bloodGroup,
        LocalDate dateOfBirth,
        String address,
        String studentPhone,
        String parentPhone,
        String officialEmail,
        String profilePhotoUrl,

        // Workflow
        RegistrationStatus registrationStatus,
        String rejectionReason,
        UUID actionedBy,
        Instant actionedAt,

        // Digital ID info
        String studentIdCardNumber   // null until APPROVED and ID issued
) {
    public static StudentProfileResponse from(StudentProfile p, String cardNumber) {
        return new StudentProfileResponse(
                p.getId(),
                p.getUser().getId(),
                p.getUser().getFullName(),
                p.getUser().getEmail(),
                p.getRegisterNumber(),
                p.getDegree(),
                p.getBatchStartYear(),
                p.getBatchEndYear(),
                p.getDepartment().getId(),
                p.getDepartment().getCode(),
                p.getDepartment().getName(),
                p.getStudentType(),
                p.getBloodGroup(),
                p.getDateOfBirth(),
                p.getAddress(),
                p.getStudentPhone(),
                p.getParentPhone(),
                p.getOfficialEmail(),
                p.getProfilePhotoUrl(),
                p.getRegistrationStatus(),
                p.getRejectionReason(),
                p.getActionedBy(),
                p.getActionedAt(),
                cardNumber
        );
    }

    public static StudentProfileResponse from(StudentProfile p) {
        return from(p, null);
    }
}
