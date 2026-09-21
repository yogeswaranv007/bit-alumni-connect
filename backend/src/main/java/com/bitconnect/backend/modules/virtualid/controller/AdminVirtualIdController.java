package com.bitconnect.backend.modules.virtualid.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.modules.virtualid.dto.VirtualIdCardResponse;
import com.bitconnect.backend.modules.virtualid.dto.VirtualIdStatusUpdateRequest;
import com.bitconnect.backend.modules.virtualid.service.VirtualIdService;
import com.bitconnect.backend.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for administrators and staff to view, manage status,
 * and rotate QR codes for issued Virtual Alumni IDs.
 */
@RestController
@RequestMapping("/api/v1/admin/virtual-ids")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin Virtual ID Management", description = "Endpoints for administrators to manage Virtual Alumni ID credentials and status")
public class AdminVirtualIdController {

    private final VirtualIdService virtualIdService;

    @GetMapping("/{alumniProfileId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get Virtual ID by Alumni Profile ID", description = "Retrieves digital card details and active QR token for administrative inspection")
    public ResponseEntity<ApiResponse<VirtualIdCardResponse>> getVirtualIdByAlumniId(
            @PathVariable UUID alumniProfileId) {
        VirtualIdCardResponse response = virtualIdService.getVirtualIdByAlumniProfileId(alumniProfileId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update Virtual ID status", description = "Modifies status (ACTIVE, SUSPENDED, REVOKED, EXPIRED). Revokes active QR tokens if status is not ACTIVE.")
    public ResponseEntity<ApiResponse<VirtualIdCardResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody VirtualIdStatusUpdateRequest request) {
        VirtualIdCardResponse response = virtualIdService.updateVirtualIdStatus(id, request.status());
        return ResponseEntity.ok(ApiResponse.success("Virtual Alumni ID status updated to " + request.status(), response));
    }

    @PostMapping("/{id}/regenerate-qr")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin force QR token regeneration", description = "Force revokes current QR token and generates a new active token for the given Virtual ID")
    public ResponseEntity<ApiResponse<VirtualIdCardResponse>> regenerateQrCode(
            @PathVariable UUID id) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        VirtualIdCardResponse response = virtualIdService.regenerateQrToken(id, adminId);
        return ResponseEntity.ok(ApiResponse.success("QR verification token regenerated successfully", response));
    }

    @PostMapping("/by-alumni/{alumniProfileId}/regenerate-qr")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin force QR token regeneration by Alumni Profile ID", description = "Force revokes current QR token and generates a new active token for the given Alumni Profile")
    public ResponseEntity<ApiResponse<VirtualIdCardResponse>> regenerateQrCodeByAlumniId(
            @PathVariable UUID alumniProfileId) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        VirtualIdCardResponse response = virtualIdService.regenerateQrTokenByAlumniProfileId(alumniProfileId, adminId);
        return ResponseEntity.ok(ApiResponse.success("QR verification token regenerated successfully for alumnus", response));
    }
}
