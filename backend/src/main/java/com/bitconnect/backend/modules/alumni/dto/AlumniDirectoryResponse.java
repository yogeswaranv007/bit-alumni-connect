package com.bitconnect.backend.modules.alumni.dto;

import java.util.UUID;

/**
 * Privacy-safe public summary projection for the Alumni Directory.
 * Explicitly omits sensitive PII (roll number, register number, phone, email, address, DOB, blood group).
 */
public record AlumniDirectoryResponse(
        UUID id,
        String fullName,
        String profilePhotoUrl,
        String departmentName,
        String departmentCode,
        String degree,
        Integer batchEndYear,
        String currentCompany,
        String currentDesignation,
        String industry,
        String linkedinUrl,
        String city,
        String country
) {
    public static AlumniDirectoryResponse fromEntity(com.bitconnect.backend.modules.alumni.entity.AlumniProfile profile) {
        return new AlumniDirectoryResponse(
                profile.getId(),
                profile.getUser().getFullName(),
                profile.getProfilePhotoUrl(),
                profile.getDepartment() != null ? profile.getDepartment().getName() : null,
                profile.getDepartment() != null ? profile.getDepartment().getCode() : null,
                profile.getDegree(),
                profile.getBatchEndYear(),
                profile.getCurrentCompany(),
                profile.getCurrentDesignation(),
                profile.getIndustry(),
                profile.getLinkedinUrl(),
                profile.getCity(),
                profile.getCountry()
        );
    }
}
