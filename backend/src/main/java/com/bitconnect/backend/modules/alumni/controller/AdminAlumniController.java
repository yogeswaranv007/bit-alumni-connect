package com.bitconnect.backend.modules.alumni.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.alumni.dto.AlumniProfileResponse;
import com.bitconnect.backend.modules.alumni.dto.AlumniRejectRequest;
import com.bitconnect.backend.modules.alumni.entity.VerificationStatus;
import com.bitconnect.backend.modules.alumni.service.AlumniProfileService;
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

/**
 * REST controller for administrative management and verification of alumni profiles.
 */
@RestController
@RequestMapping("/api/v1/admin/alumni")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin Alumni Management", description = "Endpoints for administrators and staff to review and verify alumni records")
public class AdminAlumniController {

    private final AlumniProfileService alumniProfileService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "List and search alumni profiles", description = "Returns a paginated list of detailed alumni profiles filterable by status, department, and search term")
    public ResponseEntity<ApiResponse<PagedResponse<AlumniProfileResponse>>> searchAdminProfiles(
            @RequestParam(required = false) VerificationStatus status,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) Integer batchEndYear,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        Sort sort = sortDirection.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), sort);

        PagedResponse<AlumniProfileResponse> response = alumniProfileService.searchAdminProfiles(
                status, departmentId, batchEndYear, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get full alumni profile by ID", description = "Retrieves complete alumni profile details for administrative review")
    public ResponseEntity<ApiResponse<AlumniProfileResponse>> getProfileById(@PathVariable UUID id) {
        AlumniProfileResponse response = alumniProfileService.getProfileById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Verify an alumni profile", description = "Approves a pending or rejected alumni profile and marks it as VERIFIED")
    public ResponseEntity<ApiResponse<AlumniProfileResponse>> verifyProfile(@PathVariable UUID id) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        AlumniProfileResponse response = alumniProfileService.verifyProfile(id, adminId);
        return ResponseEntity.ok(ApiResponse.success("Alumni profile verified successfully", response));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject an alumni profile", description = "Rejects an alumni profile with a recorded reason")
    public ResponseEntity<ApiResponse<AlumniProfileResponse>> rejectProfile(
            @PathVariable UUID id,
            @Valid @RequestBody AlumniRejectRequest request) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        AlumniProfileResponse response = alumniProfileService.rejectProfile(id, adminId, request);
        return ResponseEntity.ok(ApiResponse.success("Alumni profile rejected", response));
    }
}
