package com.bitconnect.backend.modules.alumni.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.alumni.dto.AlumniDirectoryResponse;
import com.bitconnect.backend.modules.alumni.dto.AlumniProfileCreateRequest;
import com.bitconnect.backend.modules.alumni.dto.AlumniProfileResponse;
import com.bitconnect.backend.modules.alumni.dto.AlumniProfileUpdateRequest;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for alumni self-profile management and public directory searches.
 */
@RestController
@RequestMapping("/api/v1/alumni")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Alumni Profile & Directory", description = "Endpoints for alumni profile self-management and directory searches")
public class AlumniProfileController {

    private final AlumniProfileService alumniProfileService;

    @PostMapping("/profile")
    @PreAuthorize("hasRole('ALUMNI')")
    @Operation(summary = "Create initial alumni profile", description = "Submits official academic and contact details for administrative verification")
    public ResponseEntity<ApiResponse<AlumniProfileResponse>> createProfile(
            @Valid @RequestBody AlumniProfileCreateRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        AlumniProfileResponse response = alumniProfileService.createProfile(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Alumni profile submitted successfully for verification", response));
    }

    @GetMapping("/profile/me")
    @PreAuthorize("hasRole('ALUMNI')")
    @Operation(summary = "Get own alumni profile", description = "Retrieves the full profile of the authenticated alumnus")
    public ResponseEntity<ApiResponse<AlumniProfileResponse>> getMyProfile() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        AlumniProfileResponse response = alumniProfileService.getMyProfile(currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/profile/me")
    @PreAuthorize("hasRole('ALUMNI')")
    @Operation(summary = "Update own alumni profile", description = "Updates editable personal/professional details. Resets status to PENDING if previously rejected.")
    public ResponseEntity<ApiResponse<AlumniProfileResponse>> updateMyProfile(
            @Valid @RequestBody AlumniProfileUpdateRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        AlumniProfileResponse response = alumniProfileService.updateMyProfile(currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Alumni profile updated successfully", response));
    }

    @GetMapping("/directory")
    @Operation(summary = "Search alumni directory", description = "Returns a paginated, privacy-safe list of verified alumni with optional filters")
    public ResponseEntity<ApiResponse<PagedResponse<AlumniDirectoryResponse>>> searchDirectory(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) Integer batchEndYear,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "batchEndYear") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        Sort sort = sortDirection.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), sort);

        PagedResponse<AlumniDirectoryResponse> response = alumniProfileService.searchDirectory(
                search, departmentId, batchEndYear, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
