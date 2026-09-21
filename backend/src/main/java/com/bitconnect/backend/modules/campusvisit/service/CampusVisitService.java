package com.bitconnect.backend.modules.campusvisit.service;

import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitCreateRequest;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitResponse;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitReviewRequest;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitScheduleRequest;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitStatsResponse;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitUpdateRequest;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitStatus;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitType;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface CampusVisitService {

    CampusVisitResponse createVisitRequest(UUID userId, CampusVisitCreateRequest request);

    PagedResponse<CampusVisitResponse> searchAlumniVisits(
            UUID userId,
            CampusVisitStatus status,
            CampusVisitType visitType,
            LocalDate visitDate,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            Pageable pageable
    );

    List<CampusVisitResponse> getMyVisitRequests(UUID userId);

    CampusVisitResponse getMyVisitRequestById(UUID visitId, UUID userId);

    CampusVisitResponse updateVisitRequest(UUID visitId, UUID userId, CampusVisitUpdateRequest request);

    CampusVisitResponse cancelVisitRequest(UUID visitId, UUID userId, String reason);

    List<com.bitconnect.backend.modules.event.dto.EventDto> getAvailableEvents();

    // Faculty Scoped
    PagedResponse<CampusVisitResponse> searchFacultyVisits(
            UUID facultyUserId,
            CampusVisitStatus status,
            CampusVisitType visitType,
            LocalDate visitDate,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            String scope,
            Pageable pageable
    );

    List<CampusVisitResponse> getPendingVisitsForFaculty(UUID facultyUserId);

    CampusVisitResponse getFacultyVisitById(UUID visitId, UUID facultyUserId);

    CampusVisitResponse facultyApproveVisit(UUID visitId, UUID facultyUserId, CampusVisitReviewRequest request);

    CampusVisitResponse facultyRejectVisit(UUID visitId, UUID facultyUserId, CampusVisitReviewRequest request);

    // Admin Scoped
    PagedResponse<CampusVisitResponse> searchAdminVisits(
            CampusVisitStatus status,
            CampusVisitType visitType,
            Integer departmentId,
            LocalDate visitDate,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            Pageable pageable
    );

    CampusVisitResponse getAdminVisitById(UUID visitId);

    CampusVisitResponse adminApproveVisit(UUID visitId, UUID adminUserId, CampusVisitReviewRequest request);

    CampusVisitResponse adminRejectVisit(UUID visitId, UUID adminUserId, CampusVisitReviewRequest request);

    CampusVisitResponse adminScheduleVisit(UUID visitId, UUID adminUserId, CampusVisitScheduleRequest request);

    CampusVisitStatsResponse getAdminStats();

    int expireOutdatedVisits();
}
