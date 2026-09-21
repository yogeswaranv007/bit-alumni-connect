package com.bitconnect.backend.modules.gate.service.impl;

import com.bitconnect.backend.common.exception.ForbiddenException;
import com.bitconnect.backend.common.exception.ResourceNotFoundException;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.alumni.repository.AlumniProfileRepository;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisit;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitStatus;
import com.bitconnect.backend.modules.campusvisit.repository.CampusVisitRepository;
import com.bitconnect.backend.modules.gate.dto.GateLogDto;
import com.bitconnect.backend.modules.gate.dto.WatchmanEntryRequest;
import com.bitconnect.backend.modules.gate.dto.WatchmanEntryResponse;
import com.bitconnect.backend.modules.gate.dto.WatchmanVerificationResponse;
import com.bitconnect.backend.modules.gate.entity.CampusEntryLog;
import com.bitconnect.backend.modules.gate.entity.EntryDecision;
import com.bitconnect.backend.modules.gate.entity.VerificationMethod;
import com.bitconnect.backend.modules.gate.repository.CampusEntryLogRepository;
import com.bitconnect.backend.modules.gate.service.CampusEntryAuthorizationService;
import com.bitconnect.backend.modules.gate.service.CampusEntryLogService;
import com.bitconnect.backend.modules.notification.entity.NotificationType;
import com.bitconnect.backend.modules.notification.service.NotificationService;
import com.bitconnect.backend.modules.staff.entity.StaffProfile;
import com.bitconnect.backend.modules.staff.repository.StaffProfileRepository;
import com.bitconnect.backend.modules.user.entity.RoleName;
import com.bitconnect.backend.modules.user.entity.User;
import com.bitconnect.backend.modules.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CampusEntryLogServiceImpl implements CampusEntryLogService {

    private final CampusEntryLogRepository entryLogRepository;
    private final AlumniProfileRepository alumniProfileRepository;
    private final CampusVisitRepository campusVisitRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final UserRepository userRepository;
    private final CampusEntryAuthorizationService authorizationService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public WatchmanEntryResponse recordEntry(UUID watchmanUserId, WatchmanEntryRequest request) {
        User watchman = userRepository.findById(watchmanUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", watchmanUserId));

        AlumniProfile profile = alumniProfileRepository.findById(request.alumniProfileId())
                .orElseThrow(() -> new ResourceNotFoundException("AlumniProfile", "id", request.alumniProfileId()));

        // Server-side revalidation of authorization
        WatchmanVerificationResponse verification = authorizationService.verifyByRegisterNumber(profile.getRegisterNumber());

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        String gate = request.gate() != null && !request.gate().isBlank() ? request.gate() : "Main Gate";

        // Find today's campus visit if available (prioritizing approved/scheduled visits)
        List<CampusVisit> visits = campusVisitRepository.findByAlumniProfileIdAndVisitDateAndStatusIn(
                profile.getId(),
                today,
                List.of(CampusVisitStatus.APPROVED, CampusVisitStatus.SCHEDULED, CampusVisitStatus.PENDING, CampusVisitStatus.REJECTED, CampusVisitStatus.CANCELLED, CampusVisitStatus.COMPLETED, CampusVisitStatus.EXPIRED)
        );
        CampusVisit visit = selectBestVisit(visits);

        String approverName = null;
        String approverRole = null;
        LocalTime approvedTime = null;

        if (visit != null) {
            approverName = visit.getApprovedBy() != null ? visit.getApprovedBy().getFullName() : null;
            approverRole = visit.getApproverRole() != null ? visit.getApproverRole().name() : null;
            approvedTime = visit.getApprovedArrivalTime() != null ? visit.getApprovedArrivalTime() : visit.getPreferredArrivalTime();
        }

        CampusEntryLog entryLog = CampusEntryLog.builder()
                .alumniProfile(profile)
                .campusVisit(visit)
                .entryDate(today)
                .entryTimestamp(Instant.now())
                .actualEntryTime(now)
                .verificationMethod(request.verificationMethod())
                .entryDecision(verification.decision())
                .watchman(watchman)
                .gate(gate)
                .approvalAuthorityName(approverName)
                .approverRole(approverRole)
                .approvedArrivalTime(approvedTime)
                .timingStatus(verification.timingStatus())
                .denialReason(verification.denialReason())
                .remarks(request.remarks())
                .build();

        CampusEntryLog savedLog = entryLogRepository.save(entryLog);
        log.info("Recorded gate entry log ID: {} with decision: {} for alumnus: {}", savedLog.getId(), verification.decision(), profile.getRollNumber());

        // Dispatch notifications if ALLOWED
        if (verification.decision() == EntryDecision.ALLOWED && profile.getUser() != null) {
            String purpose = visit != null ? visit.getPurpose() : "Campus Visit";

            // 1. Notify Alumnus
            notificationService.sendNotification(
                    profile.getUser(),
                    NotificationType.ALUMNI_GATE_ENTRY,
                    "Campus Entry Verified",
                    String.format("Your campus entry was verified at %s at %s for %s.", gate, now.toString().substring(0, 5), purpose),
                    savedLog.getId(),
                    "GATE_ENTRY",
                    "/alumni/campus-visits"
            );

            // 2. Notify Approver (Faculty / Admin), Assigned Host, and Department Faculty
            if (visit != null) {
                if (visit.getApprovedBy() != null) {
                    notificationService.sendNotification(
                            visit.getApprovedBy(),
                            NotificationType.ALUMNI_GATE_ENTRY,
                            "Alumnus Arrived at Gate",
                            String.format("Alumnus %s (%s) has arrived at %s for %s.", profile.getUser().getFullName(), profile.getRollNumber(), gate, purpose),
                            savedLog.getId(),
                            "GATE_ENTRY",
                            "/faculty/campus-entry-logs",
                            profile.getUser().getFullName()
                    );
                }

                if (visit.getAssignedFaculty() != null && (visit.getApprovedBy() == null || !visit.getAssignedFaculty().getId().equals(visit.getApprovedBy().getId()))) {
                    notificationService.sendNotification(
                            visit.getAssignedFaculty(),
                            NotificationType.ALUMNI_GATE_ENTRY,
                            "Alumnus Arrived at Gate",
                            String.format("Alumnus %s (%s) has arrived at %s for your meeting: %s.", profile.getUser().getFullName(), profile.getRollNumber(), gate, purpose),
                            savedLog.getId(),
                            "GATE_ENTRY",
                            "/faculty/campus-entry-logs",
                            profile.getUser().getFullName()
                    );
                }

                if (visit.getDepartment() != null) {
                    List<StaffProfile> deptStaff = staffProfileRepository.findByDepartmentId(visit.getDepartment().getId());
                    for (StaffProfile sp : deptStaff) {
                        if (sp.getUser() != null) {
                            UUID uId = sp.getUser().getId();
                            boolean alreadySent = (visit.getApprovedBy() != null && visit.getApprovedBy().getId().equals(uId)) ||
                                                  (visit.getAssignedFaculty() != null && visit.getAssignedFaculty().getId().equals(uId));
                            if (!alreadySent) {
                                notificationService.sendNotification(
                                        sp.getUser(),
                                        NotificationType.ALUMNI_GATE_ENTRY,
                                        "Department Alumnus Arrived at Gate",
                                        String.format("Alumnus %s (%s) arrived at %s for %s (%s).", profile.getUser().getFullName(), profile.getRollNumber(), gate, purpose, visit.getDepartment().getName()),
                                        savedLog.getId(),
                                        "GATE_ENTRY",
                                        "/faculty/campus-entry-logs",
                                        profile.getUser().getFullName()
                                );
                            }
                        }
                    }
                }
            }

            // 3. Notify Alumni Admin / Association security monitoring
            List<User> admins = userRepository.findByRolesName(RoleName.ROLE_ADMIN);
            for (User admin : admins) {
                if (visit == null || visit.getApprovedBy() == null || !admin.getId().equals(visit.getApprovedBy().getId())) {
                    notificationService.sendNotification(
                            admin,
                            NotificationType.ALUMNI_GATE_ENTRY,
                            "Gate Entry Logged",
                            String.format("Entry verified for %s (%s) at %s via %s.", profile.getUser().getFullName(), profile.getRollNumber(), gate, request.verificationMethod()),
                            savedLog.getId(),
                            "GATE_ENTRY",
                            "/admin/campus-entry-logs",
                            profile.getUser().getFullName()
                    );
                }
            }
        }

        String msg = verification.decision() == EntryDecision.ALLOWED ? "Campus entry successfully authorized and recorded" : "Entry attempt recorded as " + verification.decision();
        return WatchmanEntryResponse.from(savedLog, msg);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GateLogDto> getTodayLogs() {
        return entryLogRepository.findByEntryDateOrderByEntryTimestampDesc(LocalDate.now())
                .stream()
                .map(GateLogDto::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<GateLogDto> searchEntryLogs(
            UUID currentUserId,
            LocalDate startDate,
            LocalDate endDate,
            LocalDate entryDate,
            VerificationMethod method,
            EntryDecision decision,
            String gate,
            Integer departmentId,
            String search,
            Pageable pageable
    ) {
        // Scoping check for Faculty (Staff without Admin role)
        Integer facultyDeptId = null;
        if (currentUserId != null) {
            Optional<User> userOpt = userRepository.findById(currentUserId);
            boolean isAdmin = userOpt.map(u -> u.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_ADMIN)).orElse(false);
            boolean isStaff = userOpt.map(u -> u.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_STAFF)).orElse(false);

            if (!isAdmin && isStaff) {
                Optional<StaffProfile> staffOpt = staffProfileRepository.findByUserId(currentUserId);
                if (staffOpt.isPresent() && staffOpt.get().getDepartment() != null) {
                    facultyDeptId = staffOpt.get().getDepartment().getId();
                }
            }
        }

        final Integer finalFacultyDeptId = facultyDeptId;
        final UUID finalFacultyUserId = currentUserId;

        Specification<CampusEntryLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            jakarta.persistence.criteria.Join<CampusEntryLog, AlumniProfile> alumniJoin = root.join("alumniProfile", jakarta.persistence.criteria.JoinType.LEFT);
            jakarta.persistence.criteria.Join<CampusEntryLog, CampusVisit> visitJoin = root.join("campusVisit", jakarta.persistence.criteria.JoinType.LEFT);

            // Department / Faculty isolation (strictly restricted to faculty's department)
            if (finalFacultyDeptId != null) {
                Predicate alumniDeptMatch = cb.equal(alumniJoin.get("department").get("id"), finalFacultyDeptId);
                Predicate visitDeptMatch = cb.equal(visitJoin.get("department").get("id"), finalFacultyDeptId);
                predicates.add(cb.or(alumniDeptMatch, visitDeptMatch));
            } else if (departmentId != null) {
                predicates.add(cb.equal(alumniJoin.get("department").get("id"), departmentId));
            }

            if (startDate != null && endDate != null) {
                predicates.add(cb.between(root.get("entryDate"), startDate, endDate));
            } else if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("entryDate"), startDate));
            } else if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("entryDate"), endDate));
            } else if (entryDate != null) {
                predicates.add(cb.equal(root.get("entryDate"), entryDate));
            }

            if (method != null) {
                predicates.add(cb.equal(root.get("verificationMethod"), method));
            }
            if (decision != null) {
                predicates.add(cb.equal(root.get("entryDecision"), decision));
            }
            if (gate != null && !gate.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("gate")), gate.toLowerCase().trim()));
            }
            if (search != null && !search.isBlank()) {
                String term = "%" + search.toLowerCase().trim() + "%";
                Predicate nameMatch = cb.like(cb.lower(alumniJoin.get("user").get("fullName")), term);
                Predicate rollMatch = cb.like(cb.lower(alumniJoin.get("rollNumber")), term);
                Predicate regMatch = cb.like(cb.lower(alumniJoin.get("registerNumber")), term);
                Predicate gateMatch = cb.like(cb.lower(root.get("gate")), term);
                Predicate approverMatch = cb.like(cb.lower(root.get("approvalAuthorityName")), term);
                Predicate remarksMatch = cb.like(cb.lower(root.get("remarks")), term);
                Predicate visitPurposeMatch = cb.like(cb.lower(visitJoin.get("purpose")), term);
                predicates.add(cb.or(nameMatch, rollMatch, regMatch, gateMatch, approverMatch, remarksMatch, visitPurposeMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<CampusEntryLog> page = entryLogRepository.findAll(spec, pageable);
        List<GateLogDto> responseContent = page.getContent().stream()
                .map(GateLogDto::from)
                .toList();

        return new PagedResponse<>(
                responseContent,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public GateLogDto getEntryLogById(UUID id, UUID currentUserId) {
        CampusEntryLog log = entryLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CampusEntryLog", "id", id));

        if (currentUserId != null) {
            Optional<User> userOpt = userRepository.findById(currentUserId);
            boolean isAdmin = userOpt.map(u -> u.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_ADMIN)).orElse(false);
            boolean isStaff = userOpt.map(u -> u.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_STAFF)).orElse(false);

            if (!isAdmin && isStaff) {
                Optional<StaffProfile> staffOpt = staffProfileRepository.findByUserId(currentUserId);
                Integer facultyDeptId = staffOpt.map(s -> s.getDepartment() != null ? s.getDepartment().getId() : null).orElse(null);

                boolean isAuthorized = false;
                if (facultyDeptId != null) {
                    if (log.getAlumniProfile() != null && log.getAlumniProfile().getDepartment() != null &&
                            facultyDeptId.equals(log.getAlumniProfile().getDepartment().getId())) {
                        isAuthorized = true;
                    }
                    if (log.getCampusVisit() != null && log.getCampusVisit().getDepartment() != null &&
                            facultyDeptId.equals(log.getCampusVisit().getDepartment().getId())) {
                        isAuthorized = true;
                    }
                }

                if (!isAuthorized) {
                    throw new ForbiddenException("You are not authorized to view gate entry logs outside your department.");
                }
            }
        }

        return GateLogDto.from(log);
    }

    private CampusVisit selectBestVisit(List<CampusVisit> visits) {
        if (visits == null || visits.isEmpty()) return null;

        // 1. Look for Approved / Scheduled / Completed visit first
        Optional<CampusVisit> authorizedVisit = visits.stream()
                .filter(v -> v.getStatus() == CampusVisitStatus.APPROVED || v.getStatus() == CampusVisitStatus.SCHEDULED || v.getStatus() == CampusVisitStatus.COMPLETED)
                .findFirst();
        if (authorizedVisit.isPresent()) {
            return authorizedVisit.get();
        }

        // 2. Look for Pending visit
        Optional<CampusVisit> pendingVisit = visits.stream()
                .filter(v -> v.getStatus() == CampusVisitStatus.PENDING)
                .findFirst();
        if (pendingVisit.isPresent()) {
            return pendingVisit.get();
        }

        // 3. Fallback to most recently updated or created visit
        return visits.stream()
                .sorted((a, b) -> {
                    Instant timeA = a.getUpdatedAt() != null ? a.getUpdatedAt() : (a.getCreatedAt() != null ? a.getCreatedAt() : Instant.EPOCH);
                    Instant timeB = b.getUpdatedAt() != null ? b.getUpdatedAt() : (b.getCreatedAt() != null ? b.getCreatedAt() : Instant.EPOCH);
                    return timeB.compareTo(timeA);
                })
                .findFirst()
                .orElse(visits.get(0));
    }
}
