package com.bitconnect.backend.modules.alumni.dto;

import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.alumni.entity.VerificationStatus;
import com.bitconnect.backend.modules.department.dto.DepartmentResponse;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Detailed DTO representation of an alumnus profile for self-view and administrative review.
 */
public record AlumniProfileResponse(
        UUID id,
        UUID userId,
        String fullName,
        String accountEmail,
        DepartmentResponse department,
        String rollNumber,
        String registerNumber,
        String degree,
        Integer batchStartYear,
        Integer batchEndYear,
        String profilePhotoUrl,
        LocalDate dateOfBirth,
        String bloodGroup,
        String personalEmail,
        String phoneNumber,
        String permanentAddress,
        String city,
        String state,
        String country,
        String postalCode,
        String currentCompany,
        String currentDesignation,
        String industry,
        String linkedinUrl,
        VerificationStatus verificationStatus,
        UUID verifiedBy,
        Instant verifiedAt,
        String rejectionReason,
        boolean isDirectoryVisible,
        Instant createdAt,
        Instant updatedAt
) {
    public static AlumniProfileResponse fromEntity(AlumniProfile profile) {
        return new AlumniProfileResponse(
                profile.getId(),
                profile.getUser().getId(),
                profile.getUser().getFullName(),
                profile.getUser().getEmail(),
                DepartmentResponse.fromEntity(profile.getDepartment()),
                profile.getRollNumber(),
                profile.getRegisterNumber(),
                profile.getDegree(),
                profile.getBatchStartYear(),
                profile.getBatchEndYear(),
                profile.getProfilePhotoUrl(),
                profile.getDateOfBirth(),
                profile.getBloodGroup(),
                profile.getPersonalEmail(),
                profile.getPhoneNumber(),
                profile.getPermanentAddress(),
                profile.getCity(),
                profile.getState(),
                profile.getCountry(),
                profile.getPostalCode(),
                profile.getCurrentCompany(),
                profile.getCurrentDesignation(),
                profile.getIndustry(),
                profile.getLinkedinUrl(),
                profile.getVerificationStatus(),
                profile.getVerifiedBy(),
                profile.getVerifiedAt(),
                profile.getRejectionReason(),
                profile.isDirectoryVisible(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }
}
