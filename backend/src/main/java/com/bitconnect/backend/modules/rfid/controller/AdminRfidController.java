package com.bitconnect.backend.modules.rfid.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.modules.rfid.dto.RfidAssignRequest;
import com.bitconnect.backend.modules.rfid.dto.RfidMappingDto;
import com.bitconnect.backend.modules.rfid.dto.RfidStatusUpdateRequest;
import com.bitconnect.backend.modules.rfid.service.RfidService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/rfid-mappings")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin RFID Management", description = "Endpoints for administrators to assign, replace, and manage physical RFID cards")
public class AdminRfidController {

    private final RfidService rfidService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "List all RFID mappings")
    public ResponseEntity<ApiResponse<List<RfidMappingDto>>> getAllMappings() {
        List<RfidMappingDto> mappings = rfidService.getAllMappings();
        return ResponseEntity.ok(ApiResponse.success(mappings));
    }

    @GetMapping("/by-alumni")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get RFID mapping for alumni profile")
    public ResponseEntity<ApiResponse<RfidMappingDto>> getByAlumniProfile(@RequestParam UUID alumniProfileId) {
        RfidMappingDto dto = rfidService.getMappingByAlumniProfileId(alumniProfileId)
                .orElse(null);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Assign or replace physical RFID card")
    public ResponseEntity<ApiResponse<RfidMappingDto>> assignRfid(@Valid @RequestBody RfidAssignRequest request) {
        RfidMappingDto dto = rfidService.assignRfid(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Physical RFID card mapped successfully", dto));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Update RFID status (ACTIVE, SUSPENDED, LOST)")
    public ResponseEntity<ApiResponse<RfidMappingDto>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody RfidStatusUpdateRequest request) {
        RfidMappingDto dto = rfidService.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("RFID status updated", dto));
    }
}
