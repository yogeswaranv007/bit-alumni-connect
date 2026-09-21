package com.bitconnect.backend.modules.virtualid.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.modules.virtualid.dto.VirtualIdCardResponse;
import com.bitconnect.backend.modules.virtualid.service.VirtualIdService;
import com.bitconnect.backend.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for authenticated alumni to view their digital identity card
 * and request QR code regeneration.
 */
@RestController
@RequestMapping("/api/v1/alumni/virtual-id")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Virtual Alumni ID (Alumni)", description = "Endpoints for alumni to access and manage their digital identity card")
public class AlumniVirtualIdController {

    private final VirtualIdService virtualIdService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('ALUMNI')")
    @Operation(summary = "Get own Virtual Alumni ID card", description = "Returns full front/back card presentation and Base64-rendered QR code for the authenticated alumnus")
    public ResponseEntity<ApiResponse<VirtualIdCardResponse>> getMyVirtualId() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        VirtualIdCardResponse response = virtualIdService.getMyVirtualId(currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
