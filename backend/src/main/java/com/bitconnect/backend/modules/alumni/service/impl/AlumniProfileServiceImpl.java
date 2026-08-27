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

    @Override
    @Transactional
    public AlumniProfileResponse createProfile(UUID userId, AlumniProfileCreateRequest request) {
        if (alumniProfileRepository.existsByUserId(userId)) {
            throw new BadRequestException("Alumni profile already exists for this user");
        }

        String rollNumber = request.rollNumber().trim().toUpperCase();
        if (alumniProfileRepository.existsByRollNumber(rollNumber)) {
            throw new BadRequestException("Roll number is already registered: " + rollNumber);
        }

        String registerNumber = request.registerNumber().trim().toUpperCase();
        if (alumniProfileRepository.existsByRegisterNumber(registerNumber)) {
            throw new BadRequestException("Register number is already registered: " + registerNumber);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.departmentId()));

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

        return AlumniProfileResponse.fromEntity(savedProfile);
    }

    @Override
    @Transactional(readOnly = true)
    public AlumniProfileResponse getMyProfile(UUID userId) {
        AlumniProfile profile = alumniProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Alumni profile not found for this user"));
        return AlumniProfileResponse.fromEntity(profile);
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
        return AlumniProfileResponse.fromEntity(updatedProfile);
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
        return PagedResponse.from(page.map(AlumniProfileResponse::fromEntity));
    }

    @Override
    @Transactional(readOnly = true)
    public AlumniProfileResponse getProfileById(UUID id) {
        AlumniProfile profile = alumniProfileRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alumni profile", "id", id));
        return AlumniProfileResponse.fromEntity(profile);
    }

    @Override
    @Transactional
    public AlumniProfileResponse verifyProfile(UUID id, UUID adminId) {
        AlumniProfile profile = alumniProfileRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alumni profile", "id", id));

        profile.setVerificationStatus(VerificationStatus.VERIFIED);
        profile.setVerifiedBy(adminId);
        profile.setVerifiedAt(Instant.now());
        profile.setRejectionReason(null);

        AlumniProfile verifiedProfile = alumniProfileRepository.save(profile);
        log.info("Alumni profile ID: {} verified successfully by admin ID: {}", id, adminId);

        // Automatically issue Virtual Alumni ID upon verification
        virtualIdService.issueVirtualId(verifiedProfile);

        return AlumniProfileResponse.fromEntity(verifiedProfile);
    }

    @Override
    @Transactional
    public AlumniProfileResponse rejectProfile(UUID id, UUID adminId, AlumniRejectRequest request) {
        AlumniProfile profile = alumniProfileRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alumni profile", "id", id));

        profile.setVerificationStatus(VerificationStatus.REJECTED);
        profile.setVerifiedBy(adminId);
        profile.setVerifiedAt(Instant.now());
        profile.setRejectionReason(request.reason().trim());

        AlumniProfile rejectedProfile = alumniProfileRepository.save(profile);
        log.info("Alumni profile ID: {} rejected by admin ID: {} with reason: {}", id, adminId, request.reason());
        return AlumniProfileResponse.fromEntity(rejectedProfile);
    }
}
