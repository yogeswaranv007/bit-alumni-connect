package com.bitconnect.backend.modules.profilechange.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.profilechange.dto.AdminProfileChangeRequestDetailResponse;
import com.bitconnect.backend.modules.profilechange.dto.ProfileChangeRequestResponse;
import com.bitconnect.backend.modules.profilechange.dto.ProfileChangeRequestReviewRequest;
import com.bitconnect.backend.modules.profilechange.entity.ChangeRequestStatus;
import com.bitconnect.backend.modules.profilechange.service.ProfileChangeRequestService;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/profile-change-requests")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin Profile Change Management", description = "Endpoints for administrators to review, compare, approve, and reject alumni profile change requests")
public class AdminProfileChangeRequestController {

    private final ProfileChangeRequestService changeRequestService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "List profile change requests", description = "Returns a paginated list of change requests filterable by status, department, and search terms")
    public ResponseEntity<ApiResponse<PagedResponse<ProfileChangeRequestResponse>>> searchAdminChangeRequests(
            @RequestParam(required = false) ChangeRequestStatus status,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) Integer batchEndYear,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        Sort sort = sortDirection.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), sort);

        PagedResponse<ProfileChangeRequestResponse> response = changeRequestService.searchAdminChangeRequests(
                status, departmentId, batchEndYear, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get detailed profile change request review data", description = "Retrieves comparison of current vs requested fields and generates a proposed Virtual ID preview")
    public ResponseEntity<ApiResponse<AdminProfileChangeRequestDetailResponse>> getAdminChangeRequestDetail(
            @PathVariable UUID id) {
        AdminProfileChangeRequestDetailResponse response = changeRequestService.getAdminChangeRequestDetail(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Approve profile change request", description = "Applies requested changes onto official profile, rotates active QR verification token, and marks request as APPROVED")
    public ResponseEntity<ApiResponse<ProfileChangeRequestResponse>> approveChangeRequest(
            @PathVariable UUID id,
            @RequestParam(required = false) String comment) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        ProfileChangeRequestResponse response = changeRequestService.approveChangeRequest(id, adminId, comment);
        return ResponseEntity.ok(ApiResponse.success("Profile change request approved and applied to official profile", response));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Reject profile change request", description = "Rejects change request with mandatory comment and explanation for the alumnus")
    public ResponseEntity<ApiResponse<ProfileChangeRequestResponse>> rejectChangeRequest(
            @PathVariable UUID id,
            @Valid @RequestBody ProfileChangeRequestReviewRequest request) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        ProfileChangeRequestResponse response = changeRequestService.rejectChangeRequest(id, adminId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile change request rejected", response));
    }
}
