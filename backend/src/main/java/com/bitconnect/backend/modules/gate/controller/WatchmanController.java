package com.bitconnect.backend.modules.gate.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.modules.gate.dto.GateLogDto;
import com.bitconnect.backend.modules.gate.dto.WatchmanEntryRequest;
import com.bitconnect.backend.modules.gate.dto.WatchmanEntryResponse;
import com.bitconnect.backend.modules.gate.dto.WatchmanVerificationResponse;
import com.bitconnect.backend.modules.gate.service.CampusEntryAuthorizationService;
import com.bitconnect.backend.modules.gate.service.CampusEntryLogService;
import com.bitconnect.backend.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/watchman")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Watchman Gate Verification", description = "Endpoints for security personnel to verify alumni identity and authorize campus gate entry")
public class WatchmanController {

    private final CampusEntryAuthorizationService authorizationService;
    private final CampusEntryLogService entryLogService;

    @PostMapping("/verify/qr")
    @PreAuthorize("hasAnyRole('WATCHMAN', 'ADMIN')")
    @Operation(summary = "Verify alumni by Digital ID QR token")
    public ResponseEntity<ApiResponse<WatchmanVerificationResponse>> verifyByQrToken(@RequestBody Map<String, String> payload) {
        String token = payload.get("qrToken");
        WatchmanVerificationResponse response = authorizationService.verifyByQrToken(token);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/verify/rfid")
    @PreAuthorize("hasAnyRole('WATCHMAN', 'ADMIN')")
    @Operation(summary = "Verify alumni by physical RFID UID")
    public ResponseEntity<ApiResponse<WatchmanVerificationResponse>> verifyByRfid(@RequestBody Map<String, String> payload) {
        String rfidUid = payload.get("rfidUid");
        WatchmanVerificationResponse response = authorizationService.verifyByRfid(rfidUid);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/verify/alumni-id")
    @PreAuthorize("hasAnyRole('WATCHMAN', 'ADMIN')")
    @Operation(summary = "Verify alumni by Alumni ID number (Fallback)")
    public ResponseEntity<ApiResponse<WatchmanVerificationResponse>> verifyByAlumniId(@RequestBody Map<String, String> payload) {
        String alumniId = payload.get("alumniIdNumber");
        WatchmanVerificationResponse response = authorizationService.verifyByAlumniId(alumniId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/verify/register-number")
    @PreAuthorize("hasAnyRole('WATCHMAN', 'ADMIN')")
    @Operation(summary = "Verify alumni by register number (Controlled fallback)")
    public ResponseEntity<ApiResponse<WatchmanVerificationResponse>> verifyByRegisterNumber(@RequestBody Map<String, String> payload) {
        String registerNumber = payload.get("registerNumber");
        WatchmanVerificationResponse response = authorizationService.verifyByRegisterNumber(registerNumber);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/entry")
    @PreAuthorize("hasAnyRole('WATCHMAN', 'ADMIN')")
    @Operation(summary = "Record and authorize campus entry", description = "Re-validates authorization, records immutable CampusEntryLog, and dispatches multi-party notifications")
    public ResponseEntity<ApiResponse<WatchmanEntryResponse>> recordEntry(@Valid @RequestBody WatchmanEntryRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        WatchmanEntryResponse response = entryLogService.recordEntry(currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success(response.message(), response));
    }

    @GetMapping("/today-logs")
    @PreAuthorize("hasAnyRole('WATCHMAN', 'ADMIN')")
    @Operation(summary = "Get today's gate verification logs")
    public ResponseEntity<ApiResponse<List<GateLogDto>>> getTodayLogs() {
        List<GateLogDto> logs = entryLogService.getTodayLogs();
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/live-checkin")
    @PreAuthorize("hasAnyRole('WATCHMAN', 'ADMIN')")
    @Operation(summary = "Poll latest real-time gate checkin")
    public ResponseEntity<ApiResponse<WatchmanVerificationResponse>> pollGateCheckin(
            @RequestParam(defaultValue = "Main Gate") String gate) {
        WatchmanVerificationResponse response = authorizationService.pollLatestGateCheckin(gate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
