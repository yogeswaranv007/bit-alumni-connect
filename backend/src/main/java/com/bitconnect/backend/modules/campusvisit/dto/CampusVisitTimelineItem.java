package com.bitconnect.backend.modules.campusvisit.dto;

import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitStatus;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitStatusHistory;
import com.bitconnect.backend.modules.user.entity.RoleName;

import java.time.Instant;
import java.util.UUID;

public record CampusVisitTimelineItem(
        UUID id,
        CampusVisitStatus oldStatus,
        CampusVisitStatus newStatus,
        String comment,
        String changedByName,
        RoleName changedByRole,
        Instant timestamp
) {
    public static CampusVisitTimelineItem from(CampusVisitStatusHistory h) {
        return new CampusVisitTimelineItem(
                h.getId(),
                h.getOldStatus(),
                h.getNewStatus(),
                h.getComment(),
                h.getChangedByName(),
                h.getChangedByRole(),
                h.getCreatedAt()
        );
    }
}
