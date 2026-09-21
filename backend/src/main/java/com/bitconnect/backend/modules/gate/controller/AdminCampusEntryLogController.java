package com.bitconnect.backend.modules.gate.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.gate.dto.GateLogDto;
import com.bitconnect.backend.modules.gate.entity.EntryDecision;
import com.bitconnect.backend.modules.gate.entity.VerificationMethod;
import com.bitconnect.backend.modules.gate.service.CampusEntryLogService;
import com.bitconnect.backend.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/campus-entry-logs")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin Campus Entry Logs", description = "Endpoints for administrators to search and inspect security gate entry audit logs")
public class AdminCampusEntryLogController {

    private final CampusEntryLogService entryLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Search and filter campus entry audit logs")
    public ResponseEntity<ApiResponse<PagedResponse<GateLogDto>>> searchEntryLogs(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) LocalDate entryDate,
            @RequestParam(required = false) VerificationMethod method,
            @RequestParam(required = false) EntryDecision decision,
            @RequestParam(required = false) String gate,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "entryTimestamp") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Sort sort = sortDirection.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), sort);

        PagedResponse<GateLogDto> response = entryLogService.searchEntryLogs(
                currentUserId, startDate, endDate, entryDate, method, decision, gate, departmentId, search, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Inspect single gate entry audit trail record")
    public ResponseEntity<ApiResponse<GateLogDto>> getEntryLogDetail(@PathVariable UUID id) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        GateLogDto log = entryLogService.getEntryLogById(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(log));
    }
}
