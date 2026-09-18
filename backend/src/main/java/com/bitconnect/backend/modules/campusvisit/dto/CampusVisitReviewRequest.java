package com.bitconnect.backend.modules.campusvisit.dto;

import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitStatus;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

public record CampusVisitReviewRequest(
        CampusVisitStatus status,

        @Size(max = 2000, message = "Comment cannot exceed 2000 characters")
        String comment,

        String rejectionComment,

        LocalTime approvedArrivalTime,

        @Size(max = 200, message = "Meeting location cannot exceed 200 characters")
        String meetingLocation,

        @Size(max = 120, message = "Contact person cannot exceed 120 characters")
        String contactPerson,

        @Size(max = 2000, message = "Instructions cannot exceed 2000 characters")
        String adminRemarks
) {
    public CampusVisitReviewRequest(CampusVisitStatus status, String comment, String meetingLocation, String contactPerson, String adminRemarks) {
        this(status, comment, comment, null, meetingLocation, contactPerson, adminRemarks);
    }

    public String getEffectiveComment() {
        if (comment != null && !comment.isBlank()) return comment;
        if (rejectionComment != null && !rejectionComment.isBlank()) return rejectionComment;
        return null;
    }
}
