package com.bitconnect.backend.modules.gate.service;

import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.gate.dto.GateLogDto;
import com.bitconnect.backend.modules.gate.dto.WatchmanEntryRequest;
import com.bitconnect.backend.modules.gate.dto.WatchmanEntryResponse;
import com.bitconnect.backend.modules.gate.entity.EntryDecision;
import com.bitconnect.backend.modules.gate.entity.VerificationMethod;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface CampusEntryLogService {

    WatchmanEntryResponse recordEntry(UUID watchmanUserId, WatchmanEntryRequest request);

    List<GateLogDto> getTodayLogs();

    PagedResponse<GateLogDto> searchEntryLogs(
            LocalDate startDate,
            LocalDate endDate,
            LocalDate entryDate,
            VerificationMethod method,
            EntryDecision decision,
            String gate,
            Integer departmentId,
            String search,
            Pageable pageable
    );

    GateLogDto getEntryLogById(UUID id);
}
