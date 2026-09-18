package com.bitconnect.backend.modules.gate.dto;

import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitAlumniSummary;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisit;
import com.bitconnect.backend.modules.gate.entity.EntryDecision;
import com.bitconnect.backend.modules.gate.entity.TimingStatus;
import com.bitconnect.backend.modules.gate.entity.VerificationMethod;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record WatchmanVerificationResponse(
        EntryDecision decision,
        String denialReason,
        VerificationMethod verificationMethod,
        CampusVisitAlumniSummary alumni,
        WatchmanVisitSummary campusVisit,
        List<TodayActivityDto> todayActivities,
        TimingStatus timingStatus,
        String checkinId
) {
    public WatchmanVerificationResponse(
            EntryDecision decision,
            String denialReason,
            VerificationMethod verificationMethod,
            CampusVisitAlumniSummary alumni,
            WatchmanVisitSummary campusVisit,
            List<TodayActivityDto> todayActivities,
            TimingStatus timingStatus
    ) {
        this(decision, denialReason, verificationMethod, alumni, campusVisit, todayActivities, timingStatus, null);
    }

    public WatchmanVerificationResponse withCheckinId(String newCheckinId) {
        return new WatchmanVerificationResponse(decision, denialReason, verificationMethod, alumni, campusVisit, todayActivities, timingStatus, newCheckinId);
    }
    public record WatchmanVisitSummary(
            UUID visitId,
            LocalDate visitDate,
            String purpose,
            LocalTime approvedArrivalTime,
            String approverName,
            String approverRole,
            Instant approvedAt,
            String meetingLocation,
            String contactPerson,
            String adminRemarks
    ) {
        public static WatchmanVisitSummary from(CampusVisit cv) {
            if (cv == null) return null;
            String approver = cv.getApprovedBy() != null ? cv.getApprovedBy().getFullName() : "Administrator";
            String role = cv.getApproverRole() != null ? cv.getApproverRole().name() : "ROLE_ADMIN";
            return new WatchmanVisitSummary(
                    cv.getId(),
                    cv.getVisitDate(),
                    cv.getPurpose(),
                    cv.getApprovedArrivalTime() != null ? cv.getApprovedArrivalTime() : cv.getPreferredArrivalTime(),
                    approver,
                    role,
                    cv.getApprovedAt(),
                    cv.getMeetingLocation(),
                    cv.getContactPerson(),
                    cv.getAdminRemarks()
            );
        }
    }
}
