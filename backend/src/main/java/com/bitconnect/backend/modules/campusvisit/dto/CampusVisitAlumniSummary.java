package com.bitconnect.backend.modules.campusvisit.dto;

import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;

import java.util.UUID;

public record CampusVisitAlumniSummary(
        UUID id,
        UUID profileId,
        String name,
        String fullName,
        String alumniIdNumber,
        String rollNumber,
        String registerNumber,
        String department,
        String departmentName,
        String departmentCode,
        String degree,
        String batch,
        Integer batchEndYear,
        String email,
        String phoneNumber,
        String profilePhotoUrl
) {
    public static CampusVisitAlumniSummary from(AlumniProfile p) {
        if (p == null) return null;
        String name = p.getUser() != null ? p.getUser().getFullName() : "Unknown";
        String email = p.getUser() != null ? p.getUser().getEmail() : p.getPersonalEmail();
        String deptName = p.getDepartment() != null ? p.getDepartment().getName() : "";
        String deptCode = p.getDepartment() != null ? p.getDepartment().getCode() : "";
        String batchStr = p.getBatchStartYear() != null && p.getBatchEndYear() != null
                ? p.getBatchStartYear() + " - " + p.getBatchEndYear()
                : (p.getBatchEndYear() != null ? "Class of " + p.getBatchEndYear() : "");
        String aluId = p.getRegisterNumber() != null ? p.getRegisterNumber() : (p.getRollNumber() != null ? p.getRollNumber() : "ALUMNI");

        return new CampusVisitAlumniSummary(
                p.getId(),
                p.getId(),
                name,
                name,
                aluId,
                p.getRollNumber(),
                p.getRegisterNumber(),
                deptName,
                deptName,
                deptCode,
                p.getDegree(),
                batchStr,
                p.getBatchEndYear(),
                email,
                p.getPhoneNumber(),
                p.getProfilePhotoUrl()
        );
    }
}
