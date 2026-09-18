package com.bitconnect.backend.modules.alumni.service.impl;

import com.bitconnect.backend.common.exception.BadRequestException;
import com.bitconnect.backend.common.exception.ResourceNotFoundException;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.alumni.dto.AlumniDirectoryResponse;
import com.bitconnect.backend.modules.alumni.dto.AlumniProfileCreateRequest;
import com.bitconnect.backend.modules.alumni.dto.AlumniProfileResponse;
import com.bitconnect.backend.modules.alumni.dto.AlumniProfileUpdateRequest;
import com.bitconnect.backend.modules.alumni.dto.AlumniRejectRequest;
import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.alumni.entity.VerificationStatus;
import com.bitconnect.backend.modules.alumni.repository.AlumniProfileRepository;
import com.bitconnect.backend.modules.alumni.service.AlumniProfileService;
import com.bitconnect.backend.modules.department.entity.Department;
import com.bitconnect.backend.modules.department.repository.DepartmentRepository;
import com.bitconnect.backend.modules.user.entity.User;
import com.bitconnect.backend.modules.user.repository.UserRepository;
import com.bitconnect.backend.modules.virtualid.entity.VirtualAlumniId;
import com.bitconnect.backend.modules.virtualid.repository.VirtualAlumniIdRepository;
import com.bitconnect.backend.modules.virtualid.service.VirtualIdService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlumniProfileServiceImpl implements AlumniProfileService {

    private final AlumniProfileRepository alumniProfileRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final VirtualIdService virtualIdService;
    private final VirtualAlumniIdRepository virtualAlumniIdRepository;

    private AlumniProfileResponse toProfileResponse(AlumniProfile profile) {
        if (profile == null) return null;
        String alumniId = virtualAlumniIdRepository.findByAlumniProfileId(profile.getId())
                .map(VirtualAlumniId::getAlumniIdCardNumber)
                .orElse(null);
        return AlumniProfileResponse.fromEntity(profile, alumniId);
    }

    @Override
    @Transactional
    public AlumniProfileResponse createProfile(UUID userId, AlumniProfileCreateRequest request) {
        if (alumniProfileRepository.existsByUserId(userId)) {
            throw new BadRequestException("Alumni profile already exists for this user");
        }

        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.departmentId()));

        String rollNumber = request.rollNumber().trim().toUpperCase();
        String registerNumber = request.registerNumber().trim().toUpperCase();

        // Validate that registerNumber and rollNumber department abbreviations match selected department
        com.bitconnect.backend.modules.alumni.util.DepartmentCodeValidator.validateDepartmentMatch(department, registerNumber, rollNumber);

        if (alumniProfileRepository.existsByRollNumber(rollNumber)) {
            throw new BadRequestException("Roll number is already registered: " + rollNumber);
        }

        if (alumniProfileRepository.existsByRegisterNumber(registerNumber)) {
            throw new BadRequestException("Register number is already registered: " + registerNumber);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        AlumniProfile profile = AlumniProfile.builder()
                .user(user)
                .department(department)
                .rollNumber(rollNumber)
                .registerNumber(registerNumber)
                .degree(request.degree().trim())
                .batchStartYear(request.batchStartYear())
                .batchEndYear(request.batchEndYear())
                .profilePhotoUrl(request.profilePhotoUrl())
                .dateOfBirth(request.dateOfBirth())
                .bloodGroup(request.bloodGroup() != null ? request.bloodGroup().trim().toUpperCase() : null)
                .personalEmail(request.personalEmail() != null ? request.personalEmail().trim().toLowerCase() : null)
                .phoneNumber(request.phoneNumber() != null ? request.phoneNumber().trim() : null)
                .permanentAddress(request.permanentAddress() != null ? request.permanentAddress().trim() : null)
                .city(request.city() != null ? request.city().trim() : null)
                .state(request.state() != null ? request.state().trim() : null)
                .country(request.country() != null ? request.country().trim() : null)
                .postalCode(request.postalCode() != null ? request.postalCode().trim() : null)
                .currentCompany(request.currentCompany() != null ? request.currentCompany().trim() : null)
                .currentDesignation(request.currentDesignation() != null ? request.currentDesignation().trim() : null)
                .industry(request.industry() != null ? request.industry().trim() : null)
                .linkedinUrl(request.linkedinUrl() != null ? request.linkedinUrl().trim() : null)
                .verificationStatus(VerificationStatus.PENDING)
                .isDirectoryVisible(request.isDirectoryVisible() != null ? request.isDirectoryVisible() : true)
                .build();

        AlumniProfile savedProfile = alumniProfileRepository.save(profile);
        log.info("Alumni profile created with ID: {} for user: {}", savedProfile.getId(), user.getEmail());

        return toProfileResponse(savedProfile);
    }

    @Override
    @Transactional(readOnly = true)
    public AlumniProfileResponse getMyProfile(UUID userId) {
        AlumniProfile profile = alumniProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Alumni profile not found for this user"));
        return toProfileResponse(profile);
    }

    @Override
    @Transactional
    public AlumniProfileResponse updateMyProfile(UUID userId, AlumniProfileUpdateRequest request) {
        AlumniProfile profile = alumniProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Alumni profile not found for this user"));

        // Once an alumni profile is verified, official profile details cannot be modified directly.
        if (profile.getVerificationStatus() == VerificationStatus.VERIFIED) {
            throw new BadRequestException("Official profile details cannot be modified directly once verified. Please submit a Profile Change Request to request changes for administrator review.");
        }

        if (request.departmentId() != null && !request.departmentId().equals(profile.getDepartment().getId())) {
            Department dept = departmentRepository.findById(request.departmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.departmentId()));
            profile.setDepartment(dept);
        }
        if (request.rollNumber() != null && !request.rollNumber().trim().isEmpty()) {
            String newRoll = request.rollNumber().trim().toUpperCase();
            if (!newRoll.equalsIgnoreCase(profile.getRollNumber())) {
                if (alumniProfileRepository.existsByRollNumber(newRoll)) {
                    throw new BadRequestException("Roll number is already registered: " + newRoll);
                }
                profile.setRollNumber(newRoll);
            }
        }
        if (request.registerNumber() != null && !request.registerNumber().trim().isEmpty()) {
            String newReg = request.registerNumber().trim().toUpperCase();
            if (!newReg.equalsIgnoreCase(profile.getRegisterNumber())) {
                if (alumniProfileRepository.existsByRegisterNumber(newReg)) {
                    throw new BadRequestException("Register number is already registered: " + newReg);
                }
                profile.setRegisterNumber(newReg);
            }
        }
        if (request.degree() != null && !request.degree().trim().isEmpty()) {
            profile.setDegree(request.degree().trim());
        }
        if (request.batchStartYear() != null) {
            profile.setBatchStartYear(request.batchStartYear());
        }
        if (request.batchEndYear() != null) {
            profile.setBatchEndYear(request.batchEndYear());
        }

        // Validate that registerNumber and rollNumber department abbreviations match the profile's department
        com.bitconnect.backend.modules.alumni.util.DepartmentCodeValidator.validateDepartmentMatch(
                profile.getDepartment(),
                profile.getRegisterNumber(),
                profile.getRollNumber()
        );

        if (request.profilePhotoUrl() != null) {
            profile.setProfilePhotoUrl(request.profilePhotoUrl());
        }
        if (request.dateOfBirth() != null) {
            profile.setDateOfBirth(request.dateOfBirth());
        }
        if (request.bloodGroup() != null) {
            profile.setBloodGroup(request.bloodGroup().trim().toUpperCase());
        }
        if (request.personalEmail() != null) {
            profile.setPersonalEmail(request.personalEmail().trim().toLowerCase());
        }
        if (request.phoneNumber() != null) {
            profile.setPhoneNumber(request.phoneNumber().trim());
        }
        if (request.permanentAddress() != null) {
            profile.setPermanentAddress(request.permanentAddress().trim());
        }
        if (request.city() != null) {
            profile.setCity(request.city().trim());
        }
        if (request.state() != null) {
            profile.setState(request.state().trim());
        }
        if (request.country() != null) {
            profile.setCountry(request.country().trim());
        }
        if (request.postalCode() != null) {
            profile.setPostalCode(request.postalCode().trim());
        }
        if (request.currentCompany() != null) {
            profile.setCurrentCompany(request.currentCompany().trim());
        }
        if (request.currentDesignation() != null) {
            profile.setCurrentDesignation(request.currentDesignation().trim());
        }
        if (request.industry() != null) {
            profile.setIndustry(request.industry().trim());
        }
        if (request.linkedinUrl() != null) {
            profile.setLinkedinUrl(request.linkedinUrl().trim());
        }
        if (request.isDirectoryVisible() != null) {
            profile.setDirectoryVisible(request.isDirectoryVisible());
        }

        // If a rejected profile is updated with corrections, reset status to PENDING
        if (profile.getVerificationStatus() == VerificationStatus.REJECTED) {
            profile.setVerificationStatus(VerificationStatus.PENDING);
            profile.setRejectionReason(null);
            profile.setVerifiedBy(null);
            profile.setVerifiedAt(null);
            log.info("Resetting rejected profile ID: {} to PENDING after user update", profile.getId());
        }

        AlumniProfile updatedProfile = alumniProfileRepository.save(profile);
        return toProfileResponse(updatedProfile);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<AlumniDirectoryResponse> searchDirectory(String search, Integer departmentId, Integer batchEndYear, Pageable pageable) {
        Specification<AlumniProfile> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Mandatory filters for public directory
            predicates.add(cb.equal(root.get("verificationStatus"), VerificationStatus.VERIFIED));
            predicates.add(cb.isTrue(root.get("isDirectoryVisible")));
            predicates.add(cb.isTrue(root.get("user").get("isActive")));

            // 2. Department filter
            if (departmentId != null) {
                predicates.add(cb.equal(root.get("department").get("id"), departmentId));
            }

            // 3. Batch year filter
            if (batchEndYear != null) {
                predicates.add(cb.equal(root.get("batchEndYear"), batchEndYear));
            }

            // 4. Keyword search
            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.toLowerCase().trim() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("user").get("fullName")), pattern);
                Predicate companyLike = cb.like(cb.lower(root.get("currentCompany")), pattern);
                Predicate desigLike = cb.like(cb.lower(root.get("currentDesignation")), pattern);
                Predicate cityLike = cb.like(cb.lower(root.get("city")), pattern);
                predicates.add(cb.or(nameLike, companyLike, desigLike, cityLike));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<AlumniProfile> page = alumniProfileRepository.findAll(spec, pageable);
        return PagedResponse.from(page.map(AlumniDirectoryResponse::fromEntity));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<AlumniProfileResponse> searchAdminProfiles(VerificationStatus status, Integer departmentId, Integer batchEndYear, String search, Pageable pageable) {
        Specification<AlumniProfile> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("verificationStatus"), status));
            }
            if (departmentId != null) {
                predicates.add(cb.equal(root.get("department").get("id"), departmentId));
            }
            if (batchEndYear != null) {
                predicates.add(cb.equal(root.get("batchEndYear"), batchEndYear));
            }
            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.toLowerCase().trim() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("user").get("fullName")), pattern);
                Predicate rollLike = cb.like(cb.lower(root.get("rollNumber")), pattern);
                Predicate regLike = cb.like(cb.lower(root.get("registerNumber")), pattern);
                Predicate emailLike = cb.like(cb.lower(root.get("user").get("email")), pattern);
                predicates.add(cb.or(nameLike, rollLike, regLike, emailLike));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<AlumniProfile> page = alumniProfileRepository.findAll(spec, pageable);
        return PagedResponse.from(page.map(this::toProfileResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public AlumniProfileResponse getProfileById(UUID id) {
        AlumniProfile profile = alumniProfileRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alumni profile", "id", id));
        return toProfileResponse(profile);
    }

    @Override
    @Transactional
    public AlumniProfileResponse verifyProfile(UUID id, UUID adminId) {
        AlumniProfile profile = alumniProfileRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alumni profile", "id", id));

        if (profile.getVerificationStatus() == VerificationStatus.REJECTED) {
            throw new BadRequestException("Cannot approve a rejected profile. The alumnus must modify their details and resubmit the verification request first.");
        }
        if (profile.getVerificationStatus() == VerificationStatus.VERIFIED) {
            throw new BadRequestException("Alumni profile is already verified.");
        }

        profile.setVerificationStatus(VerificationStatus.VERIFIED);
        profile.setVerifiedBy(adminId);
        profile.setVerifiedAt(Instant.now());
        profile.setRejectionReason(null);

        AlumniProfile verifiedProfile = alumniProfileRepository.save(profile);
        log.info("Alumni profile ID: {} verified successfully by admin ID: {}", id, adminId);

        // Automatically issue Virtual Alumni ID upon verification
        virtualIdService.issueVirtualId(verifiedProfile);

        return toProfileResponse(verifiedProfile);
    }

    @Override
    @Transactional
    public AlumniProfileResponse rejectProfile(UUID id, UUID adminId, AlumniRejectRequest request) {
        AlumniProfile profile = alumniProfileRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alumni profile", "id", id));

        if (profile.getVerificationStatus() == VerificationStatus.VERIFIED) {
            throw new BadRequestException("Cannot reject an already verified profile. Suspend the user account or revoke virtual ID instead.");
        }

        profile.setVerificationStatus(VerificationStatus.REJECTED);
        profile.setVerifiedBy(adminId);
        profile.setVerifiedAt(Instant.now());
        profile.setRejectionReason(request.reason().trim());

        AlumniProfile rejectedProfile = alumniProfileRepository.save(profile);
        log.info("Alumni profile ID: {} rejected by admin ID: {} with reason: {}", id, adminId, request.reason());
        return toProfileResponse(rejectedProfile);
    }
}
