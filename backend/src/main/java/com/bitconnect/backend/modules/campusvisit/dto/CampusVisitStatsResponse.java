package com.bitconnect.backend.modules.campusvisit.dto;

public record CampusVisitStatsResponse(
        long total,
        long pending,
        long approved,
        long scheduled,
        long completed,
        long rejected,
        long cancelled,
        long expired,
        long todaysVisits
) {
}

