package com.bitconnect.backend.modules.campusvisit.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitResponse;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitReviewRequest;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitScheduleRequest;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitStatsResponse;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitStatus;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitType;
import com.bitconnect.backend.modules.campusvisit.service.CampusVisitService;
import com.bitconnect.backend.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/campus-visits")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin Campus Visits", description = "Endpoints for administrators to review, approve, reject, and schedule all campus visit requests")
public class AdminCampusVisitController {

    private final CampusVisitService campusVisitService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Search and filter all campus visits")
    public ResponseEntity<ApiResponse<PagedResponse<CampusVisitResponse>>> searchAdminVisits(
            @RequestParam(required = false) CampusVisitStatus status,
            @RequestParam(required = false) CampusVisitType visitType,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) LocalDate visitDate,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "visitDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        Sort.Direction dir = sortDirection.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortField = (sortBy == null || sortBy.isBlank()) ? "visitDate" : sortBy;
        Sort sort = Sort.by(dir, sortField);
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), sort);

        PagedResponse<CampusVisitResponse> response = campusVisitService.searchAdminVisits(
                status, visitType, departmentId, visitDate, startDate, endDate, search, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get campus visit metrics")
    public ResponseEntity<ApiResponse<CampusVisitStatsResponse>> getAdminStats() {
        CampusVisitStatsResponse stats = campusVisitService.getAdminStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get campus visit details")
    public ResponseEntity<ApiResponse<CampusVisitResponse>> getAdminVisitById(@PathVariable UUID id) {
        CampusVisitResponse response = campusVisitService.getAdminVisitById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Admin approve campus visit")
    public ResponseEntity<ApiResponse<CampusVisitResponse>> adminApproveVisit(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) CampusVisitReviewRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CampusVisitReviewRequest req = request != null ? request : new CampusVisitReviewRequest(CampusVisitStatus.APPROVED, null, null, null, null);
        CampusVisitResponse response = campusVisitService.adminApproveVisit(id, currentUserId, req);
        return ResponseEntity.ok(ApiResponse.success("Campus visit approved successfully", response));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Admin reject campus visit with mandatory reason")
    public ResponseEntity<ApiResponse<CampusVisitResponse>> adminRejectVisit(
            @PathVariable UUID id,
            @Valid @RequestBody CampusVisitReviewRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CampusVisitResponse response = campusVisitService.adminRejectVisit(id, currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Campus visit rejected", response));
    }

    @PatchMapping("/{id}/schedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Admin finalize scheduled visit")
    public ResponseEntity<ApiResponse<CampusVisitResponse>> adminScheduleVisit(
            @PathVariable UUID id,
            @Valid @RequestBody CampusVisitScheduleRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CampusVisitResponse response = campusVisitService.adminScheduleVisit(id, currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Campus visit scheduled successfully", response));
    }
}
