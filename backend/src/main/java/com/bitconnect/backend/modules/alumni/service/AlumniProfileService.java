package com.bitconnect.backend.modules.alumni.service;

import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.alumni.dto.AlumniDirectoryResponse;
import com.bitconnect.backend.modules.alumni.dto.AlumniProfileCreateRequest;
import com.bitconnect.backend.modules.alumni.dto.AlumniProfileResponse;
import com.bitconnect.backend.modules.alumni.dto.AlumniProfileUpdateRequest;
import com.bitconnect.backend.modules.alumni.dto.AlumniRejectRequest;
import com.bitconnect.backend.modules.alumni.entity.VerificationStatus;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service handling alumni profile creation, updates, privacy-safe directory searches,
 * and administrative verification workflows.
 */
public interface AlumniProfileService {

    AlumniProfileResponse createProfile(UUID userId, AlumniProfileCreateRequest request);

    AlumniProfileResponse getMyProfile(UUID userId);

    AlumniProfileResponse updateMyProfile(UUID userId, AlumniProfileUpdateRequest request);

    PagedResponse<AlumniDirectoryResponse> searchDirectory(String search, Integer departmentId, Integer batchEndYear, Pageable pageable);

    PagedResponse<AlumniProfileResponse> searchAdminProfiles(VerificationStatus status, Integer departmentId, Integer batchEndYear, String search, Pageable pageable);

    AlumniProfileResponse getProfileById(UUID id);

    AlumniProfileResponse verifyProfile(UUID id, UUID adminId);

    AlumniProfileResponse rejectProfile(UUID id, UUID adminId, AlumniRejectRequest request);
}
