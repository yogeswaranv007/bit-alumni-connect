package com.bitconnect.backend.modules.campusvisit.dto;

import com.bitconnect.backend.modules.campusvisit.entity.CampusVisit;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitStatus;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitType;
import com.bitconnect.backend.modules.event.dto.EventDto;
import com.bitconnect.backend.modules.user.entity.RoleName;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record CampusVisitResponse(
        UUID id,
        CampusVisitStatus status,
        CampusVisitType visitType,
        CampusVisitAlumniSummary alumni,
        String alumniName,
        String alumniIdNumber,
        LocalDate visitDate,
        LocalTime preferredArrivalTime,
        LocalTime approvedArrivalTime,
        String purpose,
        Integer departmentId,
        String departmentName,
        String departmentCode,
        UUID assignedFacultyId,
        String assignedFacultyName,
        UUID approvedById,
        String approvedByName,
        String approverName,
        RoleName approverRole,
        Instant approvedAt,
        String meetingLocation,
        String contactPerson,
        String adminComment,
        String adminRemarks,
        List<EventDto> associatedEvents,
        List<CampusVisitTimelineItem> timeline,
        Instant createdAt,
        Instant updatedAt
) {
    public static CampusVisitResponse from(
            CampusVisit cv,
            List<EventDto> events,
            List<CampusVisitTimelineItem> timeline
    ) {
        Integer deptId = cv.getDepartment() != null ? cv.getDepartment().getId() : null;
        String deptName = cv.getDepartment() != null ? cv.getDepartment().getName() : "Alumni Association";
        String deptCode = cv.getDepartment() != null ? cv.getDepartment().getCode() : "AA";

        UUID facId = cv.getAssignedFaculty() != null ? cv.getAssignedFaculty().getId() : null;
        String facName = cv.getAssignedFaculty() != null ? cv.getAssignedFaculty().getFullName() : null;

        UUID appById = cv.getApprovedBy() != null ? cv.getApprovedBy().getId() : null;
        String appByName = cv.getApprovedBy() != null ? cv.getApprovedBy().getFullName() : null;

        CampusVisitAlumniSummary alumniSummary = CampusVisitAlumniSummary.from(cv.getAlumniProfile());
        String aluName = alumniSummary != null ? alumniSummary.fullName() : (cv.getAlumniProfile() != null && cv.getAlumniProfile().getUser() != null ? cv.getAlumniProfile().getUser().getFullName() : null);
        String aluIdNum = alumniSummary != null ? (alumniSummary.registerNumber() != null ? alumniSummary.registerNumber() : alumniSummary.rollNumber()) : (cv.getAlumniProfile() != null ? cv.getAlumniProfile().getRollNumber() : null);

        return new CampusVisitResponse(
                cv.getId(),
                cv.getStatus(),
                cv.getVisitType(),
                alumniSummary,
                aluName,
                aluIdNum,
                cv.getVisitDate(),
                cv.getPreferredArrivalTime(),
                cv.getApprovedArrivalTime(),
                cv.getPurpose(),
                deptId,
                deptName,
                deptCode,
                facId,
                facName,
                appById,
                appByName,
                appByName,
                cv.getApproverRole(),
                cv.getApprovedAt(),
                cv.getMeetingLocation(),
                cv.getContactPerson(),
                cv.getAdminComment(),
                cv.getAdminRemarks(),
                events != null ? events : List.of(),
                timeline != null ? timeline : List.of(),
                cv.getCreatedAt(),
                cv.getUpdatedAt()
        );
    }
}
