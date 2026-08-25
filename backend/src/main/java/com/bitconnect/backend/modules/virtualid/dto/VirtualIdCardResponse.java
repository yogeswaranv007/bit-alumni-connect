package com.bitconnect.backend.modules.virtualid.dto;

import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.virtualid.entity.VirtualAlumniId;
import com.bitconnect.backend.modules.virtualid.entity.VirtualIdStatus;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Detailed representation of an alumni digital identity card containing
 * front-side institutional branding/identity, back-side authenticated details,
 * and Base64-rendered QR code.
 */
public record VirtualIdCardResponse(
        UUID id,
        String alumniIdCardNumber,
        VirtualIdStatus status,
        LocalDate issuedDate,
        LocalDate expiryDate,

        // Front Face Presentation
        String fullName,
        String profilePhotoUrl,
        String departmentName,
        String departmentCode,
        String degree,
        Integer batchStartYear,
        Integer batchEndYear,

        // Back Face Authenticated Details
        String rollNumber,
        String registerNumber,
        LocalDate dateOfBirth,
        String bloodGroup,
        String phoneNumber,
        String personalEmail,
        String permanentAddress,
        String city,
        String state,
        String country,
        String postalCode,

        // QR Code Artifacts
        String qrCodeBase64,
        String verificationUrl,
        String activeToken
) {
    public static VirtualIdCardResponse fromEntity(
            VirtualAlumniId virtualId,
            String qrCodeBase64,
            String verificationUrl,
            String activeToken) {
        AlumniProfile profile = virtualId.getAlumniProfile();

        return new VirtualIdCardResponse(
                virtualId.getId(),
                virtualId.getAlumniIdCardNumber(),
                virtualId.getStatus(),
                virtualId.getIssuedDate(),
                virtualId.getExpiryDate(),

                // Front Face
                profile.getUser().getFullName(),
                profile.getProfilePhotoUrl(),
                profile.getDepartment().getName(),
                profile.getDepartment().getCode(),
                profile.getDegree(),
                profile.getBatchStartYear(),
                profile.getBatchEndYear(),

                // Back Face
                profile.getRollNumber(),
                profile.getRegisterNumber(),
                profile.getDateOfBirth(),
                profile.getBloodGroup(),
                profile.getPhoneNumber(),
                profile.getPersonalEmail(),
                profile.getPermanentAddress(),
                profile.getCity(),
                profile.getState(),
                profile.getCountry(),
                profile.getPostalCode(),

                // QR
                qrCodeBase64,
                verificationUrl,
                activeToken
        );
    }
}
