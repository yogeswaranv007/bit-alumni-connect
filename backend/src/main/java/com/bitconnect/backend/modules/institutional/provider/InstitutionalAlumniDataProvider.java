package com.bitconnect.backend.modules.institutional.provider;

import com.bitconnect.backend.modules.institutional.dto.AlumniVerificationRequest;
import com.bitconnect.backend.modules.institutional.dto.AlumniVerificationResult;

import java.util.Optional;
import java.util.UUID;

/**
 * Abstraction over the college's alumni master data source.
 *
 * <p><strong>Development</strong>: Backed by {@link MockInstitutionalAlumniDataProvider}
 * using the {@code college_alumni_records} table.
 *
 * <p><strong>Production (future)</strong>: Replace with {@code BITInstitutionalAlumniDataProvider}
 * that calls the actual BIT college database / API.
 */
public interface InstitutionalAlumniDataProvider {

    /**
     * Verifies the request against active alumni records in the college master data.
     * Register number + name + DOB must all match. Record must be ACTIVE.
     *
     * @return verified alumni result, or empty if verification fails
     */
    Optional<AlumniVerificationResult> verify(AlumniVerificationRequest request);

    /**
     * Returns true if the given institutional record ID is already linked to a BIT Connect account.
     */
    boolean isAlreadyRegistered(String institutionalRecordId);

    /**
     * Links the alumni institutional record to a BIT Connect user after account creation.
     */
    void markAsRegistered(String institutionalRecordId, UUID bitConnectUserId);
}
