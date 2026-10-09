package com.bitconnect.backend.modules.student.dto;

import com.bitconnect.backend.modules.student.entity.StudentType;

/**
 * Privacy-safe public verification payload for GET /api/v1/verify/student/{token}.
 *
 * <p>Exposes only non-sensitive fields sufficient to verify authenticity.
 * Does NOT expose: address, parent phone, student phone, DOB, blood group,
 * profile photo URL, register number, or raw database IDs.
 */
public record StudentPublicVerificationResponse(
        boolean valid,
        String message,
        String fullName,
        String studentIdNumber,
        String departmentName,
        String departmentCode,
        String degree,
        Integer batchEndYear,
        StudentType studentType,    // DAY_SCHOLAR or HOSTELER — safe to expose
        Integer scanCount
) {
    public static StudentPublicVerificationResponse invalid(String message) {
        return new StudentPublicVerificationResponse(
                false, message,
                null, null, null, null, null, null, null, null
        );
    }
}
