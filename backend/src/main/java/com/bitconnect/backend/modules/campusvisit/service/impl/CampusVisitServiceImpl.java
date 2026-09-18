package com.bitconnect.backend.modules.campusvisit.service.impl;

import com.bitconnect.backend.common.exception.BadRequestException;
import com.bitconnect.backend.common.exception.ForbiddenException;
import com.bitconnect.backend.common.exception.ResourceNotFoundException;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.alumni.entity.VerificationStatus;
import com.bitconnect.backend.modules.alumni.repository.AlumniProfileRepository;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitCreateRequest;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitResponse;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitReviewRequest;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitScheduleRequest;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitStatsResponse;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitTimelineItem;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitUpdateRequest;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisit;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitEvent;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitStatus;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitStatusHistory;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitType;
import com.bitconnect.backend.modules.campusvisit.repository.CampusVisitEventRepository;
import com.bitconnect.backend.modules.campusvisit.repository.CampusVisitRepository;
import com.bitconnect.backend.modules.campusvisit.repository.CampusVisitStatusHistoryRepository;
import com.bitconnect.backend.modules.campusvisit.service.CampusVisitService;
import com.bitconnect.backend.modules.department.entity.Department;
import com.bitconnect.backend.modules.department.repository.DepartmentRepository;
import com.bitconnect.backend.modules.event.dto.EventDto;
import com.bitconnect.backend.modules.event.entity.Event;
import com.bitconnect.backend.modules.event.repository.EventRepository;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CampusVisitServiceImpl implements CampusVisitService {

    private final CampusVisitRepository campusVisitRepository;
    private final CampusVisitEventRepository campusVisitEventRepository;
    private final CampusVisitStatusHistoryRepository statusHistoryRepository;
    private final AlumniProfileRepository alumniProfileRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final EventRepository eventRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public CampusVisitResponse createVisitRequest(UUID userId, CampusVisitCreateRequest request) {
        AlumniProfile profile = alumniProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("AlumniProfile for user", "userId", userId));

        if (profile.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new ForbiddenException("Campus visit registration is available only after your alumni profile has been verified.");
        }

        if (request.visitDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Visit date cannot be in the past.");
        }

        // Prevent duplicate active visit requests for the same date
        boolean hasActive = campusVisitRepository.existsByAlumniProfileIdAndVisitDateAndStatusIn(
                profile.getId(),
                request.visitDate(),
                List.of(CampusVisitStatus.PENDING, CampusVisitStatus.APPROVED, CampusVisitStatus.SCHEDULED)
        );
        if (hasActive) {
            throw new BadRequestException("You already have an active campus visit request for " + request.visitDate() + ". You can only request once until the active visit on that date ends (is completed, rejected, or cancelled).");
        }

        Department dept = null;
        if (request.departmentId() != null) {
            dept = departmentRepository.findById(request.departmentId()).orElse(null);
        }

        User assignedFaculty = null;
        if (request.assignedFacultyId() != null) {
            assignedFaculty = userRepository.findById(request.assignedFacultyId()).orElse(null);
            if (dept == null && assignedFaculty != null) {
                Optional<StaffProfile> staffOpt = staffProfileRepository.findByUserId(assignedFaculty.getId());
                if (staffOpt.isPresent() && staffOpt.get().getDepartment() != null) {
                    dept = staffOpt.get().getDepartment();
                }
            }
        }

        CampusVisit visit = CampusVisit.builder()
                .alumniProfile(profile)
                .visitDate(request.visitDate())
                .preferredArrivalTime(request.preferredArrivalTime())
                .visitType(request.visitType())
                .purpose(request.purpose())
                .department(dept)
                .assignedFaculty(assignedFaculty)
                .status(CampusVisitStatus.PENDING)
                .adminRemarks(request.remarks())
                .build();

        CampusVisit savedVisit = campusVisitRepository.save(visit);

        // Associate optional events
        associateEvents(savedVisit, request.associatedEventIds());

        // Create initial status history
        recordStatusHistory(savedVisit, null, CampusVisitStatus.PENDING, "Visit request submitted by alumnus", profile.getUser().getId(), profile.getUser().getFullName(), RoleName.ROLE_ALUMNI);

        log.info("Submitted new CampusVisit ID: {} for alumnus: {}", savedVisit.getId(), profile.getRollNumber());
        return mapToResponse(savedVisit);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<CampusVisitResponse> searchAlumniVisits(
            UUID userId,
            CampusVisitStatus status,
            CampusVisitType visitType,
            LocalDate visitDate,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            Pageable pageable
    ) {
        AlumniProfile profile = alumniProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("AlumniProfile for user", "userId", userId));

        Specification<CampusVisit> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("alumniProfile").get("id"), profile.getId()));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (visitType != null) {
                predicates.add(cb.equal(root.get("visitType"), visitType));
            }
            if (visitDate != null) {
                predicates.add(cb.equal(root.get("visitDate"), visitDate));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("visitDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("visitDate"), endDate));
            }
            if (search != null && !search.isBlank()) {
                String term = "%" + search.toLowerCase().trim() + "%";
                Predicate purposeMatch = cb.like(cb.lower(root.get("purpose")), term);
                Predicate remarksMatch = cb.like(cb.lower(root.get("adminRemarks")), term);
                Predicate locMatch = cb.like(cb.lower(root.get("meetingLocation")), term);
                Predicate contactMatch = cb.like(cb.lower(root.get("contactPerson")), term);
                Predicate deptMatch = cb.like(cb.lower(root.get("department").get("name")), term);
                Predicate facultyMatch = cb.like(cb.lower(root.get("assignedFaculty").get("fullName")), term);
                predicates.add(cb.or(purposeMatch, remarksMatch, locMatch, contactMatch, deptMatch, facultyMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<CampusVisit> page = campusVisitRepository.findAll(spec, pageable);
        List<CampusVisitResponse> responseContent = page.getContent().stream()
                .map(this::mapToResponse)
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
    public List<CampusVisitResponse> getMyVisitRequests(UUID userId) {
        AlumniProfile profile = alumniProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("AlumniProfile for user", "userId", userId));

        return campusVisitRepository.findByAlumniProfileIdOrderByCreatedAtDesc(profile.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CampusVisitResponse getMyVisitRequestById(UUID visitId, UUID userId) {
        AlumniProfile profile = alumniProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("AlumniProfile for user", "userId", userId));

        CampusVisit visit = campusVisitRepository.findByIdAndAlumniProfileId(visitId, profile.getId())
                .orElseThrow(() -> new ResourceNotFoundException("CampusVisit", "id", visitId));

        return mapToResponse(visit);
    }

    @Override
    @Transactional
    public CampusVisitResponse updateVisitRequest(UUID visitId, UUID userId, CampusVisitUpdateRequest request) {
        AlumniProfile profile = alumniProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("AlumniProfile for user", "userId", userId));

        CampusVisit visit = campusVisitRepository.findByIdAndAlumniProfileId(visitId, profile.getId())
                .orElseThrow(() -> new ResourceNotFoundException("CampusVisit", "id", visitId));

        if (visit.getStatus() != CampusVisitStatus.REJECTED) {
            throw new BadRequestException("Only REJECTED visit requests can be modified and resubmitted.");
        }

        if (request.visitDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Visit date cannot be in the past.");
        }

        Department dept = null;
        if (request.departmentId() != null) {
            dept = departmentRepository.findById(request.departmentId()).orElse(null);
        }

        User assignedFaculty = null;
        if (request.assignedFacultyId() != null) {
            assignedFaculty = userRepository.findById(request.assignedFacultyId()).orElse(null);
        }

        CampusVisitStatus oldStatus = visit.getStatus();
        visit.setVisitDate(request.visitDate());
        visit.setPreferredArrivalTime(request.preferredArrivalTime());
        visit.setVisitType(request.visitType());
        visit.setPurpose(request.purpose());
        visit.setDepartment(dept);
        visit.setAssignedFaculty(assignedFaculty);
        visit.setStatus(CampusVisitStatus.PENDING);
        visit.setAdminRemarks(request.remarks());

        CampusVisit saved = campusVisitRepository.save(visit);

        // Update associated events
        campusVisitEventRepository.deleteByCampusVisitId(saved.getId());
        associateEvents(saved, request.associatedEventIds());

        recordStatusHistory(saved, oldStatus, CampusVisitStatus.PENDING, "Modified and resubmitted for review", profile.getUser().getId(), profile.getUser().getFullName(), RoleName.ROLE_ALUMNI);

        log.info("Resubmitted CampusVisit ID: {} for review", saved.getId());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CampusVisitResponse cancelVisitRequest(UUID visitId, UUID userId, String reason) {
        AlumniProfile profile = alumniProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("AlumniProfile for user", "userId", userId));

        CampusVisit visit = campusVisitRepository.findByIdAndAlumniProfileId(visitId, profile.getId())
                .orElseThrow(() -> new ResourceNotFoundException("CampusVisit", "id", visitId));

        if (visit.getStatus() == CampusVisitStatus.COMPLETED || visit.getStatus() == CampusVisitStatus.CANCELLED || visit.getStatus() == CampusVisitStatus.REJECTED) {
            throw new BadRequestException("Cannot cancel a request that is already " + visit.getStatus());
        }

        CampusVisitStatus oldStatus = visit.getStatus();
        visit.setStatus(CampusVisitStatus.CANCELLED);
        visit.setAdminComment(reason != null ? reason : "Cancelled by alumnus");
        CampusVisit saved = campusVisitRepository.save(visit);

        recordStatusHistory(saved, oldStatus, CampusVisitStatus.CANCELLED, reason, profile.getUser().getId(), profile.getUser().getFullName(), RoleName.ROLE_ALUMNI);

        log.info("Cancelled CampusVisit ID: {} by alumnus: {}", saved.getId(), profile.getRollNumber());
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventDto> getAvailableEvents() {
        return eventRepository.findUpcomingOnCampusEvents(LocalDate.now())
                .stream()
                .map(EventDto::from)
                .toList();
    }

    // ==========================================
    // FACULTY SCOPED WORKFLOW
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<CampusVisitResponse> searchFacultyVisits(
            UUID facultyUserId,
            CampusVisitStatus status,
            CampusVisitType visitType,
            LocalDate visitDate,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            String scope,
            Pageable pageable
    ) {
        Optional<StaffProfile> staffOpt = staffProfileRepository.findByUserId(facultyUserId);
        Integer deptId = staffOpt.map(s -> s.getDepartment() != null ? s.getDepartment().getId() : null).orElse(null);

        Specification<CampusVisit> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Scoping: ASSIGNED_TO_ME vs ALL_DEPARTMENT
            if ("ASSIGNED_TO_ME".equalsIgnoreCase(scope)) {
                predicates.add(cb.equal(root.get("assignedFaculty").get("id"), facultyUserId));
            } else {
                if (deptId != null) {
                    Predicate deptMatch = cb.equal(root.get("department").get("id"), deptId);
                    Predicate facMatch = cb.equal(root.get("assignedFaculty").get("id"), facultyUserId);
                    predicates.add(cb.or(deptMatch, facMatch));
                } else {
                    predicates.add(cb.equal(root.get("assignedFaculty").get("id"), facultyUserId));
                }
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (visitType != null) {
                predicates.add(cb.equal(root.get("visitType"), visitType));
            }
            if (visitDate != null) {
                predicates.add(cb.equal(root.get("visitDate"), visitDate));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("visitDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("visitDate"), endDate));
            }
            if (search != null && !search.isBlank()) {
                String term = "%" + search.toLowerCase().trim() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("alumniProfile").get("user").get("fullName")), term);
                Predicate rollMatch = cb.like(cb.lower(root.get("alumniProfile").get("rollNumber")), term);
                Predicate regMatch = cb.like(cb.lower(root.get("alumniProfile").get("registerNumber")), term);
                Predicate purposeMatch = cb.like(cb.lower(root.get("purpose")), term);
                Predicate remarksMatch = cb.like(cb.lower(root.get("adminRemarks")), term);
                predicates.add(cb.or(nameMatch, rollMatch, regMatch, purposeMatch, remarksMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<CampusVisit> page = campusVisitRepository.findAll(spec, pageable);
        List<CampusVisitResponse> responseContent = page.getContent().stream()
                .map(this::mapToResponse)
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
    public List<CampusVisitResponse> getPendingVisitsForFaculty(UUID facultyUserId) {
        Optional<StaffProfile> staffOpt = staffProfileRepository.findByUserId(facultyUserId);
        Integer deptId = staffOpt.map(s -> s.getDepartment().getId()).orElse(null);

        return campusVisitRepository.findPendingVisitsForFaculty(deptId, facultyUserId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CampusVisitResponse getFacultyVisitById(UUID visitId, UUID facultyUserId) {
        CampusVisit visit = campusVisitRepository.findByIdWithDetails(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("CampusVisit", "id", visitId));

        verifyFacultyAuthorization(visit, facultyUserId);
        return mapToResponse(visit);
    }

    @Override
    @Transactional
    public CampusVisitResponse facultyApproveVisit(UUID visitId, UUID facultyUserId, CampusVisitReviewRequest request) {
        CampusVisit visit = campusVisitRepository.findByIdWithDetails(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("CampusVisit", "id", visitId));

        verifyFacultyAuthorization(visit, facultyUserId);

        if (visit.getStatus() != CampusVisitStatus.PENDING) {
            throw new BadRequestException("Only PENDING visits can be approved.");
        }

        User faculty = userRepository.findById(facultyUserId).orElseThrow();
        CampusVisitStatus oldStatus = visit.getStatus();
        visit.setStatus(CampusVisitStatus.APPROVED);
        visit.setApprovedBy(faculty);
        visit.setApproverRole(RoleName.ROLE_STAFF);
        visit.setApprovedAt(Instant.now());

        if (request.approvedArrivalTime() != null) {
            visit.setApprovedArrivalTime(request.approvedArrivalTime());
        }
        if (request.meetingLocation() != null && !request.meetingLocation().isBlank()) {
            visit.setMeetingLocation(request.meetingLocation());
        }
        if (request.contactPerson() != null && !request.contactPerson().isBlank()) {
            visit.setContactPerson(request.contactPerson());
        }
        if (request.adminRemarks() != null && !request.adminRemarks().isBlank()) {
            visit.setAdminRemarks(request.adminRemarks());
        }

        CampusVisit saved = campusVisitRepository.save(visit);
        recordStatusHistory(saved, oldStatus, CampusVisitStatus.APPROVED, request.getEffectiveComment(), faculty.getId(), faculty.getFullName(), RoleName.ROLE_STAFF);

        // Notify Alumnus
        notificationService.sendNotification(
                saved.getAlumniProfile().getUser(),
                NotificationType.VISIT_APPROVED,
                "Campus Visit Approved",
                "Your campus visit request for " + saved.getVisitDate() + " has been approved by " + faculty.getFullName() + ".",
                saved.getId(),
                "CampusVisit"
        );

        log.info("Faculty {} approved CampusVisit ID: {}", faculty.getEmail(), saved.getId());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CampusVisitResponse facultyRejectVisit(UUID visitId, UUID facultyUserId, CampusVisitReviewRequest request) {
        CampusVisit visit = campusVisitRepository.findByIdWithDetails(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("CampusVisit", "id", visitId));

        verifyFacultyAuthorization(visit, facultyUserId);

        if (visit.getStatus() != CampusVisitStatus.PENDING) {
            throw new BadRequestException("Only PENDING visits can be rejected.");
        }

        String comment = request.getEffectiveComment();
        if (comment == null || comment.isBlank()) {
            throw new BadRequestException("Rejection reason/comment is mandatory.");
        }

        User faculty = userRepository.findById(facultyUserId).orElseThrow();
        CampusVisitStatus oldStatus = visit.getStatus();
        visit.setStatus(CampusVisitStatus.REJECTED);
        visit.setApprovedBy(faculty);
        visit.setApproverRole(RoleName.ROLE_STAFF);
        visit.setApprovedAt(Instant.now());
        visit.setAdminComment(comment);

        CampusVisit saved = campusVisitRepository.save(visit);
        recordStatusHistory(saved, oldStatus, CampusVisitStatus.REJECTED, comment, faculty.getId(), faculty.getFullName(), RoleName.ROLE_STAFF);

        // Notify Alumnus
        notificationService.sendNotification(
                saved.getAlumniProfile().getUser(),
                NotificationType.VISIT_REJECTED,
                "Campus Visit Request Rejected",
                "Your campus visit request for " + saved.getVisitDate() + " was rejected. Reason: " + comment,
                saved.getId(),
                "CampusVisit"
        );

        log.info("Faculty {} rejected CampusVisit ID: {}", faculty.getEmail(), saved.getId());
        return mapToResponse(saved);
    }

    // ==========================================
    // ADMIN SCOPED WORKFLOW
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<CampusVisitResponse> searchAdminVisits(
            CampusVisitStatus status,
            CampusVisitType visitType,
            Integer departmentId,
            LocalDate visitDate,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            Pageable pageable
    ) {
        Specification<CampusVisit> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (visitType != null) {
                predicates.add(cb.equal(root.get("visitType"), visitType));
            }
            if (departmentId != null) {
                predicates.add(cb.equal(root.get("department").get("id"), departmentId));
            }
            if (visitDate != null) {
                predicates.add(cb.equal(root.get("visitDate"), visitDate));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("visitDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("visitDate"), endDate));
            }
            if (search != null && !search.isBlank()) {
                String term = "%" + search.toLowerCase().trim() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("alumniProfile").get("user").get("fullName")), term);
                Predicate rollMatch = cb.like(cb.lower(root.get("alumniProfile").get("rollNumber")), term);
                Predicate regMatch = cb.like(cb.lower(root.get("alumniProfile").get("registerNumber")), term);
                Predicate purposeMatch = cb.like(cb.lower(root.get("purpose")), term);
                Predicate deptMatch = cb.like(cb.lower(root.get("department").get("name")), term);
                Predicate facMatch = cb.like(cb.lower(root.get("assignedFaculty").get("fullName")), term);
                Predicate remarksMatch = cb.like(cb.lower(root.get("adminRemarks")), term);
                predicates.add(cb.or(nameMatch, rollMatch, regMatch, purposeMatch, deptMatch, facMatch, remarksMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<CampusVisit> page = campusVisitRepository.findAll(spec, pageable);
        List<CampusVisitResponse> responseContent = page.getContent().stream()
                .map(this::mapToResponse)
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
    public CampusVisitResponse getAdminVisitById(UUID visitId) {
        CampusVisit visit = campusVisitRepository.findByIdWithDetails(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("CampusVisit", "id", visitId));
        return mapToResponse(visit);
    }

    @Override
    @Transactional
    public CampusVisitResponse adminApproveVisit(UUID visitId, UUID adminUserId, CampusVisitReviewRequest request) {
        CampusVisit visit = campusVisitRepository.findByIdWithDetails(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("CampusVisit", "id", visitId));

        if (visit.getStatus() != CampusVisitStatus.PENDING) {
            throw new BadRequestException("Only PENDING visits can be approved.");
        }

        User admin = userRepository.findById(adminUserId).orElseThrow();
        CampusVisitStatus oldStatus = visit.getStatus();
        visit.setStatus(CampusVisitStatus.APPROVED);
        visit.setApprovedBy(admin);
        visit.setApproverRole(RoleName.ROLE_ADMIN);
        visit.setApprovedAt(Instant.now());

        if (request != null) {
            if (request.approvedArrivalTime() != null) {
                visit.setApprovedArrivalTime(request.approvedArrivalTime());
            }
            if (request.meetingLocation() != null && !request.meetingLocation().isBlank()) {
                visit.setMeetingLocation(request.meetingLocation());
            }
            if (request.contactPerson() != null && !request.contactPerson().isBlank()) {
                visit.setContactPerson(request.contactPerson());
            }
            if (request.adminRemarks() != null && !request.adminRemarks().isBlank()) {
                visit.setAdminRemarks(request.adminRemarks());
            }
        }

        CampusVisit saved = campusVisitRepository.save(visit);
        String comment = request != null ? request.getEffectiveComment() : null;
        recordStatusHistory(saved, oldStatus, CampusVisitStatus.APPROVED, comment, admin.getId(), admin.getFullName(), RoleName.ROLE_ADMIN);

        // Notify Alumnus
        notificationService.sendNotification(
                saved.getAlumniProfile().getUser(),
                NotificationType.VISIT_APPROVED,
                "Campus Visit Approved",
                "Your campus visit request for " + saved.getVisitDate() + " has been approved by the Alumni Administration.",
                saved.getId(),
                "CampusVisit"
        );

        log.info("Admin {} approved CampusVisit ID: {}", admin.getEmail(), saved.getId());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CampusVisitResponse adminRejectVisit(UUID visitId, UUID adminUserId, CampusVisitReviewRequest request) {
        CampusVisit visit = campusVisitRepository.findByIdWithDetails(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("CampusVisit", "id", visitId));

        if (visit.getStatus() != CampusVisitStatus.PENDING) {
            throw new BadRequestException("Only PENDING visits can be rejected.");
        }

        String comment = request != null ? request.getEffectiveComment() : null;
        if (comment == null || comment.isBlank()) {
            throw new BadRequestException("Rejection reason/comment is mandatory.");
        }

        User admin = userRepository.findById(adminUserId).orElseThrow();
        CampusVisitStatus oldStatus = visit.getStatus();
        visit.setStatus(CampusVisitStatus.REJECTED);
        visit.setApprovedBy(admin);
        visit.setApproverRole(RoleName.ROLE_ADMIN);
        visit.setApprovedAt(Instant.now());
        visit.setAdminComment(comment);

        CampusVisit saved = campusVisitRepository.save(visit);
        recordStatusHistory(saved, oldStatus, CampusVisitStatus.REJECTED, comment, admin.getId(), admin.getFullName(), RoleName.ROLE_ADMIN);

        // Notify Alumnus
        notificationService.sendNotification(
                saved.getAlumniProfile().getUser(),
                NotificationType.VISIT_REJECTED,
                "Campus Visit Request Rejected",
                "Your campus visit request for " + saved.getVisitDate() + " was rejected. Reason: " + comment,
                saved.getId(),
                "CampusVisit"
        );

        log.info("Admin {} rejected CampusVisit ID: {}", admin.getEmail(), saved.getId());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CampusVisitResponse adminScheduleVisit(UUID visitId, UUID adminUserId, CampusVisitScheduleRequest request) {
        CampusVisit visit = campusVisitRepository.findByIdWithDetails(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("CampusVisit", "id", visitId));

        if (visit.getStatus() != CampusVisitStatus.APPROVED && visit.getStatus() != CampusVisitStatus.SCHEDULED) {
            throw new BadRequestException("Only APPROVED visits can be scheduled.");
        }

        User admin = userRepository.findById(adminUserId).orElseThrow();
        CampusVisitStatus oldStatus = visit.getStatus();
        visit.setStatus(CampusVisitStatus.SCHEDULED);
        visit.setApprovedArrivalTime(request.approvedArrivalTime());
        visit.setMeetingLocation(request.meetingLocation());
        visit.setContactPerson(request.contactPerson());
        if (request.adminRemarks() != null && !request.adminRemarks().isBlank()) {
            visit.setAdminRemarks(request.adminRemarks());
        }

        CampusVisit saved = campusVisitRepository.save(visit);
        recordStatusHistory(saved, oldStatus, CampusVisitStatus.SCHEDULED, "Visit scheduled with arrival time " + request.approvedArrivalTime(), admin.getId(), admin.getFullName(), RoleName.ROLE_ADMIN);

        // Notify Alumnus
        notificationService.sendNotification(
                saved.getAlumniProfile().getUser(),
                NotificationType.VISIT_SCHEDULED,
                "Campus Visit Finalized & Scheduled",
                "Your visit for " + saved.getVisitDate() + " is scheduled for " + request.approvedArrivalTime() + " at " + request.meetingLocation() + ".",
                saved.getId(),
                "CampusVisit"
        );

        log.info("Admin {} scheduled CampusVisit ID: {}", admin.getEmail(), saved.getId());
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CampusVisitStatsResponse getAdminStats() {
        long pending = campusVisitRepository.countByStatus(CampusVisitStatus.PENDING);
        long approved = campusVisitRepository.countByStatus(CampusVisitStatus.APPROVED);
        long scheduled = campusVisitRepository.countByStatus(CampusVisitStatus.SCHEDULED);
        long completed = campusVisitRepository.countByStatus(CampusVisitStatus.COMPLETED);
        long rejected = campusVisitRepository.countByStatus(CampusVisitStatus.REJECTED);
        long cancelled = campusVisitRepository.countByStatus(CampusVisitStatus.CANCELLED);
        long total = campusVisitRepository.count();
        long todaysVisits = campusVisitRepository.countByVisitDateAndStatusIn(
                LocalDate.now(),
                List.of(CampusVisitStatus.APPROVED, CampusVisitStatus.SCHEDULED)
        );

        return new CampusVisitStatsResponse(total, pending, approved, scheduled, completed, rejected, cancelled, todaysVisits);
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private void verifyFacultyAuthorization(CampusVisit visit, UUID facultyUserId) {
        // If assigned directly to faculty
        if (visit.getAssignedFaculty() != null && visit.getAssignedFaculty().getId().equals(facultyUserId)) {
            return;
        }

        // Check if reviewing faculty's department matches visit's department or assigned faculty's department
        Optional<StaffProfile> staffOpt = staffProfileRepository.findByUserId(facultyUserId);
        if (staffOpt.isPresent() && staffOpt.get().getDepartment() != null) {
            Integer facultyDeptId = staffOpt.get().getDepartment().getId();

            // Match visit's department
            if (visit.getDepartment() != null && facultyDeptId.equals(visit.getDepartment().getId())) {
                return;
            }

            // Match assigned faculty's department
            if (visit.getAssignedFaculty() != null) {
                Optional<StaffProfile> assignedStaffOpt = staffProfileRepository.findByUserId(visit.getAssignedFaculty().getId());
                if (assignedStaffOpt.isPresent() && assignedStaffOpt.get().getDepartment() != null &&
                        facultyDeptId.equals(assignedStaffOpt.get().getDepartment().getId())) {
                    return;
                }
            }
        }

        throw new ForbiddenException("You are not authorized to review or approve this departmental campus visit request.");
    }

    private void associateEvents(CampusVisit visit, List<UUID> eventIds) {
        if (eventIds == null || eventIds.isEmpty()) return;

        for (UUID eventId : eventIds) {
            eventRepository.findById(eventId).ifPresent(event -> {
                CampusVisitEvent cve = CampusVisitEvent.builder()
                        .campusVisit(visit)
                        .event(event)
                        .build();
                campusVisitEventRepository.save(cve);
            });
        }
    }

    private void recordStatusHistory(CampusVisit visit, CampusVisitStatus oldStatus, CampusVisitStatus newStatus, String comment, UUID changedBy, String changedByName, RoleName changedByRole) {
        CampusVisitStatusHistory history = CampusVisitStatusHistory.builder()
                .campusVisit(visit)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .comment(comment)
                .changedBy(changedBy)
                .changedByName(changedByName)
                .changedByRole(changedByRole)
                .build();
        statusHistoryRepository.save(history);
    }

    private CampusVisitResponse mapToResponse(CampusVisit cv) {
        List<EventDto> events = campusVisitEventRepository.findByCampusVisitId(cv.getId())
                .stream()
                .map(cve -> EventDto.from(cve.getEvent()))
                .toList();

        List<CampusVisitTimelineItem> timeline = statusHistoryRepository.findByCampusVisitIdOrderByCreatedAtAsc(cv.getId())
                .stream()
                .map(CampusVisitTimelineItem::from)
                .toList();

        return CampusVisitResponse.from(cv, events, timeline);
    }
}
