package com.bitconnect.backend.modules.profilechange.dto;

import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.profilechange.entity.ChangeRequestStatus;
import com.bitconnect.backend.modules.profilechange.entity.ProfileChangeRequest;

import java.time.Instant;
import java.util.UUID;

/**
 * Standard summary response for an alumni profile change request.
 */
public record ProfileChangeRequestResponse(
        UUID id,
        UUID alumniProfileId,
        String alumniName,
        String registerNumber,
        String departmentCode,
        String departmentName,
        Integer batchStartYear,
        Integer batchEndYear,
        ChangeRequestStatus status,
        String currentProfileSnapshot,
        String requestedChanges,
        String adminComment,
        UUID reviewedBy,
        Instant reviewedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static ProfileChangeRequestResponse fromEntity(ProfileChangeRequest request) {
        if (request == null) return null;
        AlumniProfile profile = request.getAlumniProfile();
        String alumniName = (profile != null && profile.getUser() != null) ? profile.getUser().getFullName() : null;
        String regNo = profile != null ? profile.getRegisterNumber() : null;
        String deptCode = (profile != null && profile.getDepartment() != null) ? profile.getDepartment().getCode() : null;
        String deptName = (profile != null && profile.getDepartment() != null) ? profile.getDepartment().getName() : null;
        Integer batchStart = profile != null ? profile.getBatchStartYear() : null;
        Integer batchEnd = profile != null ? profile.getBatchEndYear() : null;
        UUID profileId = profile != null ? profile.getId() : null;

        return new ProfileChangeRequestResponse(
                request.getId(),
                profileId,
                alumniName,
                regNo,
                deptCode,
                deptName,
                batchStart,
                batchEnd,
                request.getStatus(),
                request.getCurrentProfileSnapshot(),
                request.getRequestedChanges(),
                request.getAdminComment(),
                request.getReviewedBy(),
                request.getReviewedAt(),
                request.getCreatedAt(),
                request.getUpdatedAt()
        );
    }
}
