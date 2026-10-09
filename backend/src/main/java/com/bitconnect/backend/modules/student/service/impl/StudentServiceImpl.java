package com.bitconnect.backend.modules.student.service.impl;

import com.bitconnect.backend.common.exception.BadRequestException;
import com.bitconnect.backend.common.exception.ResourceNotFoundException;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.department.entity.Department;
import com.bitconnect.backend.modules.department.repository.DepartmentRepository;
import com.bitconnect.backend.modules.notification.entity.NotificationType;
import com.bitconnect.backend.modules.notification.service.NotificationService;
import com.bitconnect.backend.modules.student.dto.StudentIdCardResponse;
import com.bitconnect.backend.modules.student.dto.StudentProfileCreateRequest;
import com.bitconnect.backend.modules.student.dto.StudentProfileResponse;
import com.bitconnect.backend.modules.student.dto.StudentProfileUpdateRequest;
import com.bitconnect.backend.modules.student.dto.StudentPublicVerificationResponse;
import com.bitconnect.backend.modules.student.dto.StudentRejectRequest;
import com.bitconnect.backend.modules.student.entity.RegistrationStatus;
import com.bitconnect.backend.modules.student.entity.StudentProfile;
import com.bitconnect.backend.modules.student.entity.StudentQrVerificationToken;
import com.bitconnect.backend.modules.student.entity.StudentType;
import com.bitconnect.backend.modules.student.entity.VirtualStudentId;
import com.bitconnect.backend.modules.student.repository.StudentProfileRepository;
import com.bitconnect.backend.modules.student.repository.StudentQrVerificationTokenRepository;
import com.bitconnect.backend.modules.student.repository.VirtualStudentIdRepository;
import com.bitconnect.backend.modules.student.service.StudentService;
import com.bitconnect.backend.modules.user.entity.RoleName;
import com.bitconnect.backend.modules.user.entity.User;
import com.bitconnect.backend.modules.user.repository.UserRepository;
import com.bitconnect.backend.modules.virtualid.entity.TokenStatus;
import com.bitconnect.backend.modules.virtualid.service.QrCodeGeneratorService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements StudentService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private final AtomicLong studentSeq = new AtomicLong(System.currentTimeMillis() % 100_000);

    private final StudentProfileRepository       studentProfileRepository;
    private final VirtualStudentIdRepository     virtualStudentIdRepository;
    private final StudentQrVerificationTokenRepository studentQrTokenRepository;
    private final UserRepository                 userRepository;
    private final DepartmentRepository           departmentRepository;
    private final QrCodeGeneratorService         qrCodeGeneratorService;
    private final NotificationService            notificationService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendBaseUrl;

    // ── Validation helpers ────────────────────────────────────────────────────

    /**
     * DOB must be in the past AND student must be at least 14 years old.
     * Always calculated dynamically from current date — no hardcoded years.
     */
    private void validateDob(LocalDate dob) {
        if (dob == null) return; // DOB is optional; if absent, no validation needed
        LocalDate today = LocalDate.now();
        if (!dob.isBefore(today)) {
            throw new BadRequestException("Date of birth must be in the past");
        }
        if (dob.isAfter(today.minusYears(14))) {
            throw new BadRequestException(
                    "Student must be at least 14 years old. " +
                    "Date of birth must be on or before " + today.minusYears(14));
        }
    }

    /**
     * Validates batch start year and calculates the canonical end year.
     * Allowed start years: [currentYear - 3, currentYear]. Automatically adjusts each calendar year.
     * End year is ALWAYS start + 4 regardless of what the client submits.
     */
    private int validateAndCalculateBatchEndYear(Integer startYear) {
        if (startYear == null) {
            throw new BadRequestException("Batch start year is required");
        }
        int currentYear = LocalDate.now().getYear();
        int minStart = currentYear - 3;
        int maxStart = currentYear;
        if (startYear < minStart || startYear > maxStart) {
            throw new BadRequestException(
                    "Batch start year must be between " + minStart + " and " + maxStart +
                    " (current year " + currentYear + "). Got: " + startYear);
        }
        return startYear + 4;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private StudentProfileResponse toProfileResponse(StudentProfile p) {
        String cardNumber = virtualStudentIdRepository
                .findByStudentProfileUserIdWithDetails(p.getUser().getId())
                .map(VirtualStudentId::getStudentIdCardNumber)
                .orElse(null);
        return StudentProfileResponse.from(p, cardNumber);
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public StudentProfileResponse createProfile(UUID userId, StudentProfileCreateRequest req) {
        if (studentProfileRepository.existsByUserId(userId)) {
            throw new BadRequestException("Student profile already exists for this account");
        }
        String regNum = req.registerNumber().trim().toUpperCase();
        if (studentProfileRepository.existsByRegisterNumber(regNum)) {
            throw new BadRequestException("A student profile with register number " + regNum + " already exists");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Department dept = departmentRepository.findById(req.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", req.departmentId()));

        StudentType studentType = null;
        if (req.studentType() != null && !req.studentType().isBlank()) {
            try { studentType = StudentType.valueOf(req.studentType().trim().toUpperCase()); }
            catch (IllegalArgumentException e) { throw new BadRequestException("Invalid studentType: " + req.studentType()); }
        }

        // Validate DOB and batch year — always dynamic, no hardcoded years
        validateDob(req.dateOfBirth());
        int calculatedEndYear = validateAndCalculateBatchEndYear(req.batchStartYear());

        StudentProfile profile = StudentProfile.builder()
                .user(user)
                .department(dept)
                .registerNumber(regNum)
                .degree(req.degree().trim())
                .batchStartYear(req.batchStartYear())
                .batchEndYear(calculatedEndYear)   // always = startYear + 4, client value ignored
                .studentType(studentType)
                .bloodGroup(req.bloodGroup() != null ? req.bloodGroup().trim() : null)
                .dateOfBirth(req.dateOfBirth())
                .address(req.address() != null ? req.address().trim() : null)
                .studentPhone(req.studentPhone() != null ? req.studentPhone().trim() : null)
                .parentPhone(req.parentPhone() != null ? req.parentPhone().trim() : null)
                .officialEmail(req.officialEmail() != null ? req.officialEmail().trim().toLowerCase() : null)
                .profilePhotoUrl(req.profilePhotoUrl())
                .registrationStatus(RegistrationStatus.PENDING)
                .build();

        StudentProfile saved = studentProfileRepository.save(profile);
        log.info("Student profile PENDING for user {}: regNum={}", userId, regNum);

        // Notify all admins of new student registration
        List<User> admins = userRepository.findByRolesName(RoleName.ROLE_ADMIN);
        for (User admin : admins) {
            notificationService.sendNotification(
                    admin,
                    NotificationType.NEW_STUDENT_REGISTRATION,
                    "New Student Registration",
                    String.format("%s (%s) submitted a student registration for review.", user.getFullName(), regNum),
                    saved.getId(),
                    "STUDENT_PROFILE",
                    "/admin/student-registrations",
                    user.getFullName()
            );
        }
        return toProfileResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentProfileResponse getMyProfile(UUID userId) {
        StudentProfile p = studentProfileRepository.findByUserIdWithDetails(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));
        return toProfileResponse(p);
    }

    @Override
    @Transactional
    public StudentProfileResponse updateMyProfile(UUID userId, StudentProfileUpdateRequest req) {
        StudentProfile p = studentProfileRepository.findByUserIdWithDetails(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        // APPROVED profile: only photo may be updated
        if (p.getRegistrationStatus() == RegistrationStatus.APPROVED) {
            if (req.profilePhotoUrl() != null) {
                p.setProfilePhotoUrl(req.profilePhotoUrl());
                studentProfileRepository.save(p);
                return toProfileResponse(p);
            }
            throw new BadRequestException(
                    "Your student registration is approved. Official identity fields cannot be modified directly. " +
                    "Contact the administrator for corrections.");
        }

        // PENDING or REJECTED — update permitted fields
        if (req.departmentId() != null) {
            Department dept = departmentRepository.findById(req.departmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", req.departmentId()));
            p.setDepartment(dept);
        }
        if (req.degree() != null && !req.degree().isBlank()) p.setDegree(req.degree().trim());
        if (req.batchStartYear() != null) {
            int calculatedEndYear = validateAndCalculateBatchEndYear(req.batchStartYear());
            p.setBatchStartYear(req.batchStartYear());
            p.setBatchEndYear(calculatedEndYear); // always startYear + 4
        }

        if (req.studentType() != null && !req.studentType().isBlank()) {
            try { p.setStudentType(StudentType.valueOf(req.studentType().trim().toUpperCase())); }
            catch (IllegalArgumentException e) { throw new BadRequestException("Invalid studentType: " + req.studentType()); }
        }
        if (req.bloodGroup() != null)    p.setBloodGroup(req.bloodGroup().trim());
        if (req.dateOfBirth() != null) {
            validateDob(req.dateOfBirth());
            p.setDateOfBirth(req.dateOfBirth());
        }
        if (req.address() != null)       p.setAddress(req.address().trim());
        if (req.studentPhone() != null)  p.setStudentPhone(req.studentPhone().trim());
        if (req.parentPhone() != null)   p.setParentPhone(req.parentPhone().trim());
        if (req.officialEmail() != null) p.setOfficialEmail(req.officialEmail().trim().toLowerCase());
        if (req.profilePhotoUrl() != null) p.setProfilePhotoUrl(req.profilePhotoUrl());

        // Resubmission: REJECTED → PENDING
        boolean wasRejected = p.getRegistrationStatus() == RegistrationStatus.REJECTED;
        if (wasRejected) {
            p.setRegistrationStatus(RegistrationStatus.PENDING);
            p.setRejectionReason(null);
            p.setActionedBy(null);
            p.setActionedAt(null);
            log.info("Student profile {} reset to PENDING (resubmission by user {})", p.getId(), userId);
        }

        StudentProfile saved = studentProfileRepository.save(p);

        // Notify admins of resubmission
        if (wasRejected) {
            List<User> admins = userRepository.findByRolesName(RoleName.ROLE_ADMIN);
            for (User admin : admins) {
                notificationService.sendNotification(
                        admin,
                        NotificationType.STUDENT_REGISTRATION_RESUBMITTED,
                        "Student Registration Resubmitted",
                        String.format("%s (%s) has corrected and resubmitted their student registration.",
                                saved.getUser().getFullName(), saved.getRegisterNumber()),
                        saved.getId(),
                        "STUDENT_PROFILE",
                        "/admin/student-registrations",
                        saved.getUser().getFullName()
                );
            }
        }
        return toProfileResponse(saved);
    }

    // ── Admin Verification ────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<StudentProfileResponse> searchAdminStudentProfiles(
            RegistrationStatus status, Integer departmentId, Integer batchEndYear,
            String search, Pageable pageable) {

        Specification<StudentProfile> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null)       predicates.add(cb.equal(root.get("registrationStatus"), status));
            if (departmentId != null) predicates.add(cb.equal(root.get("department").get("id"), departmentId));
            if (batchEndYear != null) predicates.add(cb.equal(root.get("batchEndYear"), batchEndYear));
            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.toLowerCase().trim() + "%";
                Predicate nameLike  = cb.like(cb.lower(root.get("user").get("fullName")), pattern);
                Predicate regLike   = cb.like(cb.lower(root.get("registerNumber")), pattern);
                Predicate emailLike = cb.like(cb.lower(root.get("user").get("email")), pattern);
                predicates.add(cb.or(nameLike, regLike, emailLike));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<StudentProfile> page = studentProfileRepository.findAll(spec, pageable);
        return PagedResponse.from(page.map(this::toProfileResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public StudentProfileResponse getStudentProfileById(UUID profileId) {
        StudentProfile p = studentProfileRepository.findByIdWithDetails(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "id", profileId));
        return toProfileResponse(p);
    }

    @Override
    @Transactional
    public StudentProfileResponse approveRegistration(UUID profileId, UUID adminId) {
        StudentProfile p = studentProfileRepository.findByIdWithDetails(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "id", profileId));

        if (p.getRegistrationStatus() == RegistrationStatus.APPROVED) {
            // Idempotent — already approved; return existing response
            return toProfileResponse(p);
        }
        if (p.getRegistrationStatus() == RegistrationStatus.REJECTED) {
            throw new BadRequestException(
                    "Cannot approve a rejected registration directly. " +
                    "The student must resubmit first (status must be PENDING).");
        }

        p.setRegistrationStatus(RegistrationStatus.APPROVED);
        p.setActionedBy(adminId);
        p.setActionedAt(Instant.now());
        p.setRejectionReason(null);

        StudentProfile approved = studentProfileRepository.save(p);
        log.info("Student profile {} APPROVED by admin {}", profileId, adminId);

        // Auto-issue Digital Student ID (within same transaction)
        VirtualStudentId virtualId = issueDigitalIdInternal(approved);

        // Notify student
        notificationService.sendNotification(
                approved.getUser(),
                NotificationType.STUDENT_REGISTRATION_APPROVED,
                "Student Registration Approved",
                "Congratulations! Your BIT student registration has been approved by the administrator.",
                approved.getId(),
                "STUDENT_PROFILE",
                "/student/digital-id"
        );
        notificationService.sendNotification(
                approved.getUser(),
                NotificationType.STUDENT_DIGITAL_ID_ISSUED,
                "Digital Student ID Issued",
                "Your Digital Student ID (" + virtualId.getStudentIdCardNumber() + ") is now available.",
                virtualId.getId(),
                "VIRTUAL_STUDENT_ID",
                "/student/digital-id"
        );

        return toProfileResponse(approved);
    }

    @Override
    @Transactional
    public StudentProfileResponse rejectRegistration(UUID profileId, UUID adminId, StudentRejectRequest req) {
        StudentProfile p = studentProfileRepository.findByIdWithDetails(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "id", profileId));

        if (p.getRegistrationStatus() == RegistrationStatus.APPROVED) {
            throw new BadRequestException("Cannot reject an already-approved registration. Deactivate the student account instead.");
        }

        p.setRegistrationStatus(RegistrationStatus.REJECTED);
        p.setActionedBy(adminId);
        p.setActionedAt(Instant.now());
        p.setRejectionReason(req.reason().trim());

        StudentProfile rejected = studentProfileRepository.save(p);
        log.info("Student profile {} REJECTED by admin {}: {}", profileId, adminId, req.reason());

        // Notify student
        notificationService.sendNotification(
                rejected.getUser(),
                NotificationType.STUDENT_REGISTRATION_REJECTED,
                "Student Registration Requires Correction",
                "Your student registration was reviewed: " + req.reason().trim() +
                " Please correct the information and resubmit.",
                rejected.getId(),
                "STUDENT_PROFILE",
                "/student/profile"
        );

        return toProfileResponse(rejected);
    }

    // ── Digital ID (student-facing — approved only) ───────────────────────────

    @Override
    @Transactional(readOnly = true)
    public StudentIdCardResponse getMyDigitalId(UUID userId) {
        StudentProfile p = studentProfileRepository.findByUserIdWithDetails(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        if (p.getRegistrationStatus() != RegistrationStatus.APPROVED) {
            throw new BadRequestException(
                    "Digital Student ID is only available after your registration is approved by an administrator.");
        }

        VirtualStudentId virtualId = virtualStudentIdRepository.findByStudentProfileUserIdWithDetails(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Digital Student ID has not been issued yet. Please contact the administrator."));
        return buildCardResponse(virtualId);
    }

    @Override
    @Transactional
    public StudentIdCardResponse regenerateQrToken(UUID userId) {
        StudentProfile p = studentProfileRepository.findByUserIdWithDetails(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));
        if (p.getRegistrationStatus() != RegistrationStatus.APPROVED) {
            throw new BadRequestException("QR token rotation requires an approved student registration.");
        }

        VirtualStudentId virtualId = virtualStudentIdRepository.findByStudentProfileUserIdWithDetails(userId)
                .orElseThrow(() -> new ResourceNotFoundException("VirtualStudentId", "userId", userId));

        studentQrTokenRepository.revokeActiveTokens(virtualId.getId(), TokenStatus.REVOKED);
        createActiveQrToken(virtualId);
        log.info("QR token rotated for VirtualStudentId {} (user {})", virtualId.getId(), userId);
        return buildCardResponse(virtualId);
    }

    // ── Public verification ───────────────────────────────────────────────────

    @Override
    @Transactional
    public StudentPublicVerificationResponse verifyPublicToken(String token) {
        var opt = studentQrTokenRepository.findActiveTokenWithDetails(token);
        if (opt.isEmpty()) {
            return StudentPublicVerificationResponse.invalid("QR code is invalid or has expired");
        }

        StudentQrVerificationToken qrToken = opt.get();
        VirtualStudentId virtualId = qrToken.getVirtualStudentId();
        StudentProfile profile = virtualId.getStudentProfile();

        qrToken.setScanCount(qrToken.getScanCount() + 1);
        qrToken.setLastScannedAt(Instant.now());
        studentQrTokenRepository.save(qrToken);

        return new StudentPublicVerificationResponse(
                true,
                "BIT Student ID verified successfully",
                profile.getUser().getFullName(),
                virtualId.getStudentIdCardNumber(),
                profile.getDepartment().getName(),
                profile.getDepartment().getCode(),
                profile.getDegree(),
                profile.getBatchEndYear(),
                profile.getStudentType(),
                qrToken.getScanCount()
        );
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /** Issue a new Digital Student ID as part of the approval transaction. Idempotent. */
    private VirtualStudentId issueDigitalIdInternal(StudentProfile profile) {
        return virtualStudentIdRepository.findByStudentProfileUserIdWithDetails(profile.getUser().getId())
                .orElseGet(() -> {
                    String cardNumber = generateStudentCardNumber(profile.getBatchEndYear());
                    LocalDate expiry  = LocalDate.of(profile.getBatchEndYear(), 7, 31);

                    VirtualStudentId v = VirtualStudentId.builder()
                            .studentProfile(profile)
                            .studentIdCardNumber(cardNumber)
                            .issuedDate(LocalDate.now())
                            .expiryDate(expiry)
                            .build();

                    VirtualStudentId saved = virtualStudentIdRepository.save(v);
                    createActiveQrToken(saved);
                    log.info("Issued VirtualStudentId {} for profile {}", cardNumber, profile.getId());
                    return saved;
                });
    }

    private StudentIdCardResponse buildCardResponse(VirtualStudentId virtualId) {
        String activeToken = studentQrTokenRepository
                .findFirstByVirtualStudentIdIdAndStatus(virtualId.getId(), TokenStatus.ACTIVE)
                .map(StudentQrVerificationToken::getToken)
                .orElseGet(() -> createActiveQrToken(virtualId).getToken());

        String verificationUrl = frontendBaseUrl + "/verify/student/" + activeToken;
        String qrBase64 = qrCodeGeneratorService.generateQrCodeBase64(verificationUrl);
        return StudentIdCardResponse.from(virtualId, qrBase64, verificationUrl, activeToken);
    }

    private StudentQrVerificationToken createActiveQrToken(VirtualStudentId virtualId) {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        String tokenValue = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        StudentQrVerificationToken token = StudentQrVerificationToken.builder()
                .virtualStudentId(virtualId)
                .token(tokenValue)
                .status(TokenStatus.ACTIVE)
                .build();
        return studentQrTokenRepository.save(token);
    }

    private String generateStudentCardNumber(Integer batchYear) {
        int year = (batchYear != null) ? batchYear : LocalDate.now().getYear();
        long seq  = studentSeq.incrementAndGet();
        return String.format("BIT-STU-%d-%06d", year, seq % 1_000_000);
    }
}
