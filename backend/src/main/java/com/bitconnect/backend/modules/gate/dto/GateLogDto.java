package com.bitconnect.backend.modules.gate.dto;

import com.bitconnect.backend.modules.gate.entity.CampusEntryLog;
import com.bitconnect.backend.modules.gate.entity.EntryDecision;
import com.bitconnect.backend.modules.gate.entity.TimingStatus;
import com.bitconnect.backend.modules.gate.entity.VerificationMethod;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record GateLogDto(
        UUID id,
        UUID alumniProfileId,
        String alumniName,
        String alumniRollNumber,
        String alumniRegisterNumber,
        String alumniIdNumber,
        String departmentName,
        String departmentCode,
        String batch,
        String profilePhotoUrl,
        String alumniEmail,
        String alumniPhone,
        LocalDate entryDate,
        Instant entryTimestamp,
        LocalTime actualEntryTime,
        VerificationMethod verificationMethod,
        EntryDecision entryDecision,
        String watchmanName,
        String gate,
        UUID campusVisitId,
        String visitPurpose,
        String visitType,
        String assignedFaculty,
        String meetingLocation,
        String contactPerson,
        String approvalAuthorityName,
        String approverRole,
        Instant approvedAt,
        LocalTime approvedArrivalTime,
        TimingStatus timingStatus,
        String denialReason,
        String remarks,
        String adminRemarks
) {
    public static GateLogDto from(CampusEntryLog log) {
        String alumniName = log.getAlumniProfile().getUser() != null ? log.getAlumniProfile().getUser().getFullName() : "Unknown";
        String deptName = log.getAlumniProfile().getDepartment() != null ? log.getAlumniProfile().getDepartment().getName() : "";
        String deptCode = log.getAlumniProfile().getDepartment() != null ? log.getAlumniProfile().getDepartment().getCode() : "";
        String watchman = log.getWatchman() != null ? log.getWatchman().getFullName() : "Gate System";
        String email = log.getAlumniProfile().getUser() != null ? log.getAlumniProfile().getUser().getEmail() : "";
        String phone = log.getAlumniProfile().getPhoneNumber() != null ? log.getAlumniProfile().getPhoneNumber() : "";
        String photo = log.getAlumniProfile().getProfilePhotoUrl();
        String batch = log.getAlumniProfile().getBatchEndYear() != null ? String.valueOf(log.getAlumniProfile().getBatchEndYear()) : "";
        String aluId = log.getAlumniProfile().getRegisterNumber() != null ? log.getAlumniProfile().getRegisterNumber() : "BIT-ALU";

        UUID visitId = null;
        String purpose = "Campus Visit";
        String visitType = null;
        String faculty = null;
        String location = null;
        String contact = null;
        Instant approvedAt = null;
        String adminRemarks = null;

        if (log.getCampusVisit() != null) {
            visitId = log.getCampusVisit().getId();
            purpose = log.getCampusVisit().getPurpose();
            visitType = log.getCampusVisit().getVisitType() != null ? log.getCampusVisit().getVisitType().name() : null;
            faculty = log.getCampusVisit().getAssignedFaculty() != null ? log.getCampusVisit().getAssignedFaculty().getFullName() : null;
            location = log.getCampusVisit().getMeetingLocation();
            contact = log.getCampusVisit().getContactPerson();
            approvedAt = log.getCampusVisit().getApprovedAt();
            adminRemarks = log.getCampusVisit().getAdminRemarks();
        }

        return new GateLogDto(
                log.getId(),
                log.getAlumniProfile().getId(),
                alumniName,
                log.getAlumniProfile().getRollNumber(),
                log.getAlumniProfile().getRegisterNumber(),
                aluId,
                deptName,
                deptCode,
                batch,
                photo,
                email,
                phone,
                log.getEntryDate(),
                log.getEntryTimestamp(),
                log.getActualEntryTime(),
                log.getVerificationMethod(),
                log.getEntryDecision(),
                watchman,
                log.getGate(),
                visitId,
                purpose,
                visitType,
                faculty,
                location,
                contact,
                log.getApprovalAuthorityName(),
                log.getApproverRole(),
                approvedAt,
                log.getApprovedArrivalTime(),
                log.getTimingStatus(),
                log.getDenialReason(),
                log.getRemarks(),
                adminRemarks
        );
    }
}
