package com.bitconnect.backend.modules.virtualid.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.modules.virtualid.dto.PublicVerificationResponse;
import com.bitconnect.backend.modules.virtualid.service.VirtualIdService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public REST controller for QR scan verification.
 * Does not require authentication and returns zero sensitive PII.
 */
@RestController
@RequestMapping("/api/v1/verify")
@RequiredArgsConstructor
@Tag(name = "Identity Verification", description = "Public endpoints for scanning and validating digital Virtual Alumni ID QR codes")
public class PublicVerificationController {

    private final VirtualIdService virtualIdService;

    @GetMapping("/{token}")
    @Operation(summary = "Verify Virtual Alumni ID by QR token", description = "Validates the QR token and returns public-safe identity verification information")
    public ResponseEntity<ApiResponse<PublicVerificationResponse>> verifyToken(@PathVariable String token) {
        PublicVerificationResponse response = virtualIdService.verifyPublicToken(token);
        if (!response.valid()) {
            return ResponseEntity.ok(ApiResponse.error(response.message(), response));
        }
        return ResponseEntity.ok(ApiResponse.success(response.message(), response));
    }
}
