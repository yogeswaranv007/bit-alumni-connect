package com.bitconnect.backend.modules.profilechange.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.modules.profilechange.dto.ProfileChangeRequestCreateRequest;
import com.bitconnect.backend.modules.profilechange.dto.ProfileChangeRequestResponse;
import com.bitconnect.backend.modules.profilechange.dto.ProfileChangeRequestUpdateRequest;
import com.bitconnect.backend.modules.profilechange.service.ProfileChangeRequestService;
import com.bitconnect.backend.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/alumni/profile/change-requests")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Alumni Profile Change Requests", description = "Endpoints for alumni to request modifications to verified profile and ID card details")
public class AlumniProfileChangeRequestController {

    private final ProfileChangeRequestService changeRequestService;

    @PostMapping
    @PreAuthorize("hasRole('ALUMNI')")
    @Operation(summary = "Submit a profile change request", description = "Submits proposed modifications for administrative review while keeping official profile active and unchanged")
    public ResponseEntity<ApiResponse<ProfileChangeRequestResponse>> createChangeRequest(
            @Valid @RequestBody ProfileChangeRequestCreateRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        ProfileChangeRequestResponse response = changeRequestService.createChangeRequest(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Profile change request submitted successfully for administrator review", response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ALUMNI')")
    @Operation(summary = "Get own profile change requests", description = "Lists all change requests submitted by the authenticated alumnus")
    public ResponseEntity<ApiResponse<List<ProfileChangeRequestResponse>>> getMyChangeRequests() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        List<ProfileChangeRequestResponse> response = changeRequestService.getMyChangeRequests(currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ALUMNI')")
    @Operation(summary = "Get a specific change request", description = "Retrieves details and review status of a specific change request")
    public ResponseEntity<ApiResponse<ProfileChangeRequestResponse>> getChangeRequestById(@PathVariable UUID id) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        ProfileChangeRequestResponse response = changeRequestService.getChangeRequestById(id, currentUserId, false);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ALUMNI')")
    @Operation(summary = "Update a rejected change request", description = "Modifies values of a rejected change request in response to admin feedback")
    public ResponseEntity<ApiResponse<ProfileChangeRequestResponse>> updateChangeRequest(
            @PathVariable UUID id,
            @Valid @RequestBody ProfileChangeRequestUpdateRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        ProfileChangeRequestResponse response = changeRequestService.updateChangeRequest(id, currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Rejected change request updated", response));
    }

    @PostMapping("/{id}/resubmit")
    @PreAuthorize("hasRole('ALUMNI')")
    @Operation(summary = "Resubmit a rejected change request", description = "Moves a rejected change request back to PENDING status for admin review")
    public ResponseEntity<ApiResponse<ProfileChangeRequestResponse>> resubmitChangeRequest(@PathVariable UUID id) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        ProfileChangeRequestResponse response = changeRequestService.resubmitChangeRequest(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Profile change request resubmitted for admin review", response));
    }
}
