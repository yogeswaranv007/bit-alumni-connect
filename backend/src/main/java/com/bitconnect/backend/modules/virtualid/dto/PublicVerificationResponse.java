package com.bitconnect.backend.modules.virtualid.dto;

import java.time.LocalDate;

/**
 * Privacy-safe public verification payload returned when a gate scanner
 * or browser accesses /verify/{token}.
 * Excludes all sensitive PII (address, phone, email, roll number, DOB, blood group).
 */
public record PublicVerificationResponse(
        boolean valid,
        String message,
        String fullName,
        String alumniIdNumber,
        String profilePhotoUrl,
        String departmentName,
        String departmentCode,
        String degree,
        Integer batchEndYear,
        String status,
        LocalDate issuedDate,
        Integer scanCount
) {
    public static PublicVerificationResponse invalid(String message) {
        return new PublicVerificationResponse(
                false,
                message,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "INVALID",
                null,
                null
        );
    }
}
