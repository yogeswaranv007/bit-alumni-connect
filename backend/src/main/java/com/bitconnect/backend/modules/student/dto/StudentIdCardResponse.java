package com.bitconnect.backend.modules.student.dto;

import com.bitconnect.backend.modules.student.entity.StudentType;
import com.bitconnect.backend.modules.student.entity.VirtualStudentId;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Full Digital Student ID card response — front face + back face + QR artifacts.
 *
 * <p>Front face matches physical BIT card:
 *   BIT logo, institution name, photo, name, registerNumber, degree, department, batch, D/H badge.
 *
 * <p>Back face matches physical BIT card:
 *   Blood group, DOB, address, student phone, parent phone, official email,
 *   antiragging info (static institutional constants in frontend).
 *
 * <p>Privacy: this full response is returned only to the authenticated student.
 *   The public QR verification endpoint uses StudentPublicVerificationResponse (minimal).
 */
public record StudentIdCardResponse(
        UUID id,
        String studentIdCardNumber,
        LocalDate issuedDate,
        LocalDate expiryDate,

        // ── Front face ────────────────────────────────────────────────────────
        String fullName,
        String registerNumber,
        String degree,
        String departmentName,
        String departmentCode,
        Integer batchStartYear,
        Integer batchEndYear,
        StudentType studentType,    // DAY_SCHOLAR = red card, HOSTELER = blue card
        String profilePhotoUrl,

        // ── Back face ─────────────────────────────────────────────────────────
        String bloodGroup,
        LocalDate dateOfBirth,
        String address,
        String studentPhone,
        String parentPhone,
        String officialEmail,

        // ── QR artifacts ──────────────────────────────────────────────────────
        String qrCodeBase64,
        String verificationUrl,
        String activeToken
) {
    public static StudentIdCardResponse from(
            VirtualStudentId virtualId,
            String qrCodeBase64,
            String verificationUrl,
            String activeToken) {

        var profile = virtualId.getStudentProfile();

        return new StudentIdCardResponse(
                virtualId.getId(),
                virtualId.getStudentIdCardNumber(),
                virtualId.getIssuedDate(),
                virtualId.getExpiryDate(),

                // Front
                profile.getUser().getFullName(),
                profile.getRegisterNumber(),
                profile.getDegree(),
                profile.getDepartment().getName(),
                profile.getDepartment().getCode(),
                profile.getBatchStartYear(),
                profile.getBatchEndYear(),
                profile.getStudentType(),
                profile.getProfilePhotoUrl(),

                // Back
                profile.getBloodGroup(),
                profile.getDateOfBirth(),
                profile.getAddress(),
                profile.getStudentPhone(),
                profile.getParentPhone(),
                profile.getOfficialEmail(),

                // QR
                qrCodeBase64,
                verificationUrl,
                activeToken
        );
    }
}
