package com.bitconnect.backend.modules.campusvisit.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitResponse;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitReviewRequest;
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
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/faculty/campus-visits")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Faculty Campus Visits", description = "Endpoints for academic staff and faculty to review, search, and approve department-scoped visits")
public class FacultyCampusVisitController {

    private final CampusVisitService campusVisitService;

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Search, filter and list department campus visits")
    public ResponseEntity<ApiResponse<PagedResponse<CampusVisitResponse>>> getFacultyVisits(
            @RequestParam(required = false) CampusVisitStatus status,
            @RequestParam(required = false) CampusVisitType visitType,
            @RequestParam(required = false) LocalDate visitDate,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "ALL_DEPARTMENT") String scope,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "visitDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Sort.Direction dir = "ASC".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortField = (sortBy == null || sortBy.isBlank()) ? "visitDate" : sortBy;
        Sort sort = Sort.by(dir, sortField);
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), sort);

        PagedResponse<CampusVisitResponse> response = campusVisitService.searchFacultyVisits(
                currentUserId, status, visitType, visitDate, startDate, endDate, search, scope, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "List pending visits for faculty department")
    public ResponseEntity<ApiResponse<List<CampusVisitResponse>>> getPendingVisitsForFaculty() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        List<CampusVisitResponse> response = campusVisitService.getPendingVisitsForFaculty(currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Get department visit details")
    public ResponseEntity<ApiResponse<CampusVisitResponse>> getFacultyVisitById(@PathVariable UUID id) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CampusVisitResponse response = campusVisitService.getFacultyVisitById(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Faculty approve visit request")
    public ResponseEntity<ApiResponse<CampusVisitResponse>> facultyApproveVisit(
            @PathVariable UUID id,
            @Valid @RequestBody CampusVisitReviewRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CampusVisitResponse response = campusVisitService.facultyApproveVisit(id, currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Campus visit request approved", response));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Faculty reject visit request with mandatory explanation")
    public ResponseEntity<ApiResponse<CampusVisitResponse>> facultyRejectVisit(
            @PathVariable UUID id,
            @Valid @RequestBody CampusVisitReviewRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CampusVisitResponse response = campusVisitService.facultyRejectVisit(id, currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Campus visit request rejected", response));
    }
}
