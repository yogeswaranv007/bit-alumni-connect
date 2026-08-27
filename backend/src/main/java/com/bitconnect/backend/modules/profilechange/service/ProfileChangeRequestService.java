package com.bitconnect.backend.modules.profilechange.service;

import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.profilechange.dto.AdminProfileChangeRequestDetailResponse;
import com.bitconnect.backend.modules.profilechange.dto.ProfileChangeRequestCreateRequest;
import com.bitconnect.backend.modules.profilechange.dto.ProfileChangeRequestResponse;
import com.bitconnect.backend.modules.profilechange.dto.ProfileChangeRequestReviewRequest;
import com.bitconnect.backend.modules.profilechange.dto.ProfileChangeRequestUpdateRequest;
import com.bitconnect.backend.modules.profilechange.entity.ChangeRequestStatus;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ProfileChangeRequestService {

    ProfileChangeRequestResponse createChangeRequest(UUID userId, ProfileChangeRequestCreateRequest request);

    List<ProfileChangeRequestResponse> getMyChangeRequests(UUID userId);

    ProfileChangeRequestResponse getChangeRequestById(UUID id, UUID userId, boolean isAdmin);

    ProfileChangeRequestResponse updateChangeRequest(UUID id, UUID userId, ProfileChangeRequestUpdateRequest request);

    ProfileChangeRequestResponse resubmitChangeRequest(UUID id, UUID userId);

    PagedResponse<ProfileChangeRequestResponse> searchAdminChangeRequests(
            ChangeRequestStatus status,
            Integer departmentId,
            Integer batchEndYear,
            String search,
            Pageable pageable
    );

    AdminProfileChangeRequestDetailResponse getAdminChangeRequestDetail(UUID id);

    ProfileChangeRequestResponse approveChangeRequest(UUID id, UUID adminId, String comment);

    ProfileChangeRequestResponse rejectChangeRequest(UUID id, UUID adminId, ProfileChangeRequestReviewRequest request);
}
