package com.bitconnect.backend.modules.notification.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.alumni.entity.VerificationStatus;
import com.bitconnect.backend.modules.alumni.repository.AlumniProfileRepository;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisit;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitStatus;
import com.bitconnect.backend.modules.campusvisit.repository.CampusVisitRepository;
import com.bitconnect.backend.modules.notification.dto.AdminPendingSummaryDto;
import com.bitconnect.backend.modules.notification.dto.AdminPendingSummaryDto.PendingActivityItemDto;
import com.bitconnect.backend.modules.profilechange.entity.ChangeRequestStatus;
import com.bitconnect.backend.modules.profilechange.entity.ProfileChangeRequest;
import com.bitconnect.backend.modules.profilechange.repository.ProfileChangeRequestRepository;
import com.bitconnect.backend.modules.staff.entity.StaffProfile;
import com.bitconnect.backend.modules.staff.repository.StaffProfileRepository;
import com.bitconnect.backend.modules.user.entity.RoleName;
import com.bitconnect.backend.modules.user.entity.User;
import com.bitconnect.backend.modules.user.repository.UserRepository;
import com.bitconnect.backend.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/pending-summary")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin Pending Summary", description = "Endpoints for administrator live notification bell and sidebar badge counts")
public class AdminNotificationController {

    private final AlumniProfileRepository alumniProfileRepository;
    private final CampusVisitRepository campusVisitRepository;
    private final ProfileChangeRequestRepository profileChangeRequestRepository;
    private final UserRepository userRepository;
    private final StaffProfileRepository staffProfileRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get unread/pending request summary counts and recent activity for Admin console")
    public ResponseEntity<ApiResponse<AdminPendingSummaryDto>> getPendingSummary() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
        boolean isAdmin = currentUser != null && currentUser.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_ADMIN);
        boolean isStaff = currentUser != null && currentUser.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_STAFF);

        // If faculty (staff and not admin)
        if (!isAdmin && isStaff && currentUserId != null) {
            Optional<StaffProfile> staffOpt = staffProfileRepository.findByUserId(currentUserId);
            Integer deptId = staffOpt.map(s -> s.getDepartment() != null ? s.getDepartment().getId() : null).orElse(null);

            long pendingVisits = campusVisitRepository.countPendingVisitsForFaculty(deptId, currentUserId);
            List<CampusVisit> recentVisits = campusVisitRepository.findTop8PendingVisitsForFaculty(deptId, currentUserId);

            List<PendingActivityItemDto> activities = new ArrayList<>();
            for (CampusVisit cv : recentVisits) {
                String name = cv.getAlumniProfile() != null && cv.getAlumniProfile().getUser() != null
                        ? cv.getAlumniProfile().getUser().getFullName() : "Alumnus";
                String reg = cv.getAlumniProfile() != null ? cv.getAlumniProfile().getRegisterNumber() : "N/A";
                Instant ts = cv.getCreatedAt() != null ? cv.getCreatedAt() : Instant.now();
                String purpose = cv.getPurpose() != null ? cv.getPurpose() : "Campus Visit";
                activities.add(new PendingActivityItemDto(
                        cv.getId(),
                        "CAMPUS_VISIT",
                        "Department Campus Visit Authorization",
                        String.format("%s requested visit pass for %s on %s", name, purpose, cv.getVisitDate()),
                        name,
                        reg,
                        ts,
                        "/faculty/campus-visits"
                ));
            }

            AdminPendingSummaryDto summary = new AdminPendingSummaryDto(
                    0,
                    pendingVisits,
                    0,
                    pendingVisits,
                    activities
            );
            return ResponseEntity.ok(ApiResponse.success(summary));
        }

        long pendingVerifications = alumniProfileRepository.countByVerificationStatus(VerificationStatus.PENDING);
        long pendingVisits = campusVisitRepository.countByStatus(CampusVisitStatus.PENDING);
        long pendingChanges = profileChangeRequestRepository.countByStatus(ChangeRequestStatus.PENDING);
        long totalPending = pendingVerifications + pendingVisits + pendingChanges;

        List<PendingActivityItemDto> activities = new ArrayList<>();

        // 1. Recent Pending Alumni Verifications
        List<AlumniProfile> recentProfiles = alumniProfileRepository.findTop8ByVerificationStatusOrderByCreatedAtDesc(VerificationStatus.PENDING);
        for (AlumniProfile p : recentProfiles) {
            String name = p.getUser() != null ? p.getUser().getFullName() : "Alumnus";
            String reg = p.getRegisterNumber() != null ? p.getRegisterNumber() : (p.getRollNumber() != null ? p.getRollNumber() : "N/A");
            Instant ts = p.getCreatedAt() != null ? p.getCreatedAt() : Instant.now();
            activities.add(new PendingActivityItemDto(
                    p.getId(),
                    "ALUMNI_VERIFICATION",
                    "Alumni Identity Verification",
                    String.format("%s (%s) submitted academic profile for verification", name, reg),
                    name,
                    reg,
                    ts,
                    "/admin/alumni"
            ));
        }

        // 2. Recent Pending Campus Visits
        List<CampusVisit> recentVisits = campusVisitRepository.findTop8ByStatusOrderByCreatedAtDesc(CampusVisitStatus.PENDING);
        for (CampusVisit cv : recentVisits) {
            String name = cv.getAlumniProfile() != null && cv.getAlumniProfile().getUser() != null
                    ? cv.getAlumniProfile().getUser().getFullName() : "Alumnus";
            String reg = cv.getAlumniProfile() != null ? cv.getAlumniProfile().getRegisterNumber() : "N/A";
            Instant ts = cv.getCreatedAt() != null ? cv.getCreatedAt() : Instant.now();
            String purpose = cv.getPurpose() != null ? cv.getPurpose() : "Campus Visit";
            activities.add(new PendingActivityItemDto(
                    cv.getId(),
                    "CAMPUS_VISIT",
                    "Campus Visit Authorization",
                    String.format("%s requested visit pass for %s on %s", name, purpose, cv.getVisitDate()),
                    name,
                    reg,
                    ts,
                    "/admin/campus-visits"
            ));
        }

        // 3. Recent Pending Profile Change Requests
        List<ProfileChangeRequest> recentChanges = profileChangeRequestRepository.findTop8ByStatusOrderByCreatedAtDesc(ChangeRequestStatus.PENDING);
        for (ProfileChangeRequest cr : recentChanges) {
            String name = cr.getAlumniProfile() != null && cr.getAlumniProfile().getUser() != null
                    ? cr.getAlumniProfile().getUser().getFullName() : "Alumnus";
            String reg = cr.getAlumniProfile() != null ? cr.getAlumniProfile().getRegisterNumber() : "N/A";
            Instant ts = cr.getCreatedAt() != null ? cr.getCreatedAt() : Instant.now();
            activities.add(new PendingActivityItemDto(
                    cr.getId(),
                    "PROFILE_CHANGE",
                    "Profile Update Request",
                    String.format("%s requested official record update", name),
                    name,
                    reg,
                    ts,
                    "/admin/change-requests"
            ));
        }

        // Sort combined activities by timestamp descending and take top 10
        activities.sort(Comparator.comparing(PendingActivityItemDto::timestamp, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        List<PendingActivityItemDto> topActivities = activities.stream().limit(10).toList();

        AdminPendingSummaryDto summary = new AdminPendingSummaryDto(
                pendingVerifications,
                pendingVisits,
                pendingChanges,
                totalPending,
                topActivities
        );

        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
