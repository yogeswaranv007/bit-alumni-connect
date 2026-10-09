package com.bitconnect.backend.modules.student.service;

import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.student.dto.StudentIdCardResponse;
import com.bitconnect.backend.modules.student.dto.StudentProfileCreateRequest;
import com.bitconnect.backend.modules.student.dto.StudentProfileResponse;
import com.bitconnect.backend.modules.student.dto.StudentProfileUpdateRequest;
import com.bitconnect.backend.modules.student.dto.StudentPublicVerificationResponse;
import com.bitconnect.backend.modules.student.dto.StudentRejectRequest;
import com.bitconnect.backend.modules.student.entity.RegistrationStatus;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service managing student profile CRUD, admin approval workflow,
 * digital ID issuance (on approval only), QR token rotation, and public verification.
 */
public interface StudentService {

    // ── Student Profile ───────────────────────────────────────────────────────

    /** Create a new student profile in PENDING state. */
    StudentProfileResponse createProfile(UUID userId, StudentProfileCreateRequest request);

    /** Get the authenticated student's own profile. */
    StudentProfileResponse getMyProfile(UUID userId);

    /**
     * Update mutable fields while status is PENDING or REJECTED.
     * APPROVED profiles are locked — student cannot modify institutional fields directly.
     * Photo (profilePhotoUrl) remains editable regardless of status.
     * Updating a REJECTED profile resets status to PENDING (resubmission).
     */
    StudentProfileResponse updateMyProfile(UUID userId, StudentProfileUpdateRequest request);

    // ── Admin Student Verification ────────────────────────────────────────────

    /** Paginated admin search across all student registrations. */
    PagedResponse<StudentProfileResponse> searchAdminStudentProfiles(
            RegistrationStatus status, Integer departmentId, Integer batchEndYear,
            String search, Pageable pageable);

    /** Admin: get full student profile by profile ID. */
    StudentProfileResponse getStudentProfileById(UUID profileId);

    /**
     * Admin: approve a pending student registration.
     * Automatically issues the Digital Student ID and QR token, then notifies the student.
     * Idempotent: re-approving an already-approved profile is a no-op.
     */
    StudentProfileResponse approveRegistration(UUID profileId, UUID adminId);

    /**
     * Admin: reject a student registration with a mandatory reason.
     * Student can correct and resubmit (updateMyProfile -> PENDING).
     */
    StudentProfileResponse rejectRegistration(UUID profileId, UUID adminId, StudentRejectRequest request);

    // ── Digital ID ───────────────────────────────────────────────────────────

    /**
     * Get the authenticated student's Digital ID card.
     * Only accessible if status is APPROVED and a Digital ID exists.
     */
    StudentIdCardResponse getMyDigitalId(UUID userId);

    /** Regenerate QR token (revoke old, issue new). Card number unchanged. */
    StudentIdCardResponse regenerateQrToken(UUID userId);

    // ── Public verification ───────────────────────────────────────────────────

    /** Verify a QR token without authentication. Returns safe minimal payload. */
    StudentPublicVerificationResponse verifyPublicToken(String token);
}
