package com.bitconnect.backend.modules.notification.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminPendingSummaryDto(
        long pendingAlumniVerifications,
        long pendingCampusVisits,
        long pendingChangeRequests,
        long totalPendingCount,
        List<PendingActivityItemDto> recentPendingActivities
) {
    public record PendingActivityItemDto(
            UUID id,
            String type,
            String title,
            String description,
            String alumniName,
            String alumniRegisterNumber,
            Instant timestamp,
            String targetUrl
    ) {}
}
