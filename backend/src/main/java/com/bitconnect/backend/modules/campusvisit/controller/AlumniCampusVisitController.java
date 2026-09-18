package com.bitconnect.backend.modules.campusvisit.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitCreateRequest;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitResponse;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitUpdateRequest;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/alumni/campus-visits")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Alumni Campus Visits", description = "Endpoints for verified alumni to request and track campus visits")
public class AlumniCampusVisitController {

    private final CampusVisitService campusVisitService;
    private final com.bitconnect.backend.modules.gate.service.CampusEntryAuthorizationService authorizationService;

    @PostMapping
    @PreAuthorize("hasRole('ALUMNI')")
    @Operation(summary = "Submit campus visit request", description = "Submits a request for physical campus entry on a specific date")
    public ResponseEntity<ApiResponse<CampusVisitResponse>> createVisitRequest(
            @Valid @RequestBody CampusVisitCreateRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CampusVisitResponse response = campusVisitService.createVisitRequest(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Campus visit request submitted successfully for approval", response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ALUMNI')")
    @Operation(summary = "Search, filter and list own campus visit requests")
    public ResponseEntity<ApiResponse<PagedResponse<CampusVisitResponse>>> getMyVisitRequests(
            @RequestParam(required = false) CampusVisitStatus status,
            @RequestParam(required = false) CampusVisitType visitType,
            @RequestParam(required = false) LocalDate visitDate,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "visitDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Sort.Direction dir = "ASC".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortField = (sortBy == null || sortBy.isBlank()) ? "visitDate" : sortBy;
        Sort sort = Sort.by(dir, sortField);
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), sort);

        PagedResponse<CampusVisitResponse> response = campusVisitService.searchAlumniVisits(
                currentUserId, status, visitType, visitDate, startDate, endDate, search, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/available-events")
    @PreAuthorize("hasRole('ALUMNI')")
    @Operation(summary = "List upcoming on-campus events available for visit linking")
    public ResponseEntity<ApiResponse<List<com.bitconnect.backend.modules.event.dto.EventDto>>> getAvailableEvents() {
        List<com.bitconnect.backend.modules.event.dto.EventDto> response = campusVisitService.getAvailableEvents();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ALUMNI')")
    @Operation(summary = "Get specific campus visit request")
    public ResponseEntity<ApiResponse<CampusVisitResponse>> getMyVisitRequestById(@PathVariable UUID id) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CampusVisitResponse response = campusVisitService.getMyVisitRequestById(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ALUMNI')")
    @Operation(summary = "Modify and resubmit rejected visit request")
    public ResponseEntity<ApiResponse<CampusVisitResponse>> updateVisitRequest(
            @PathVariable UUID id,
            @Valid @RequestBody CampusVisitUpdateRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CampusVisitResponse response = campusVisitService.updateVisitRequest(id, currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Campus visit request updated and resubmitted for review", response));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ALUMNI')")
    @Operation(summary = "Cancel campus visit request")
    public ResponseEntity<ApiResponse<CampusVisitResponse>> cancelVisitRequest(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CampusVisitResponse response = campusVisitService.cancelVisitRequest(id, currentUserId, reason);
        return ResponseEntity.ok(ApiResponse.success("Campus visit request cancelled", response));
    }

    @PostMapping("/gate-checkin")
    @PreAuthorize("hasRole('ALUMNI')")
    @Operation(summary = "Alumni self check-in by scanning gate QR code")
    public ResponseEntity<ApiResponse<com.bitconnect.backend.modules.gate.dto.WatchmanVerificationResponse>> checkInAtGate(
            @RequestBody(required = false) java.util.Map<String, String> payload) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        String gate = payload != null ? payload.getOrDefault("gate", "Main Gate") : "Main Gate";
        com.bitconnect.backend.modules.gate.dto.WatchmanVerificationResponse response = authorizationService.registerGateCheckin(currentUserId, gate);
        return ResponseEntity.ok(ApiResponse.success("Gate check-in recorded successfully", response));
    }
}
