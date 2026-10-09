package com.bitconnect.backend.modules.institutional.provider;

import com.bitconnect.backend.modules.institutional.dto.StudentVerificationRequest;
import com.bitconnect.backend.modules.institutional.dto.StudentVerificationResult;

import java.util.Optional;
import java.util.UUID;

/**
 * Abstraction over the college's current-student master data source.
 *
 * <p><strong>Development</strong>: Backed by {@link MockInstitutionalStudentDataProvider}
 * using the {@code college_student_records} table.
 *
 * <p><strong>Production (future)</strong>: Replace with {@code BITInstitutionalStudentDataProvider}
 * that calls the actual BIT college database / API.
 * BIT Connect registration, StudentProfile, and Digital ID logic do NOT need to change.
 *
 * <p>Implementations MUST NOT expose raw institutional records outside this interface.
 */
public interface InstitutionalStudentDataProvider {

    /**
     * Verifies that the given request matches an active student record in the college master data.
     *
     * <p>Matching criteria (all must pass):
     * <ol>
     *   <li>Register number exists in the master data</li>
     *   <li>Name matches (case-insensitive, trimmed)</li>
     *   <li>Date of birth matches exactly</li>
     *   <li>Record status is ACTIVE</li>
     * </ol>
     *
     * @return the verified student result, or empty if verification fails for any reason
     */
    Optional<StudentVerificationResult> verify(StudentVerificationRequest request);

    /**
     * Returns true if the given institutional record ID is already linked to a BIT Connect account.
     * Used to prevent duplicate account creation.
     */
    boolean isAlreadyRegistered(String institutionalRecordId);

    /**
     * Links the institutional record to a BIT Connect user after successful account creation.
     * Must be called within the same transaction as account creation.
     */
    void markAsRegistered(String institutionalRecordId, UUID bitConnectUserId);
}
