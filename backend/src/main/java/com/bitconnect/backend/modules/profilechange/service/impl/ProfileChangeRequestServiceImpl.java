package com.bitconnect.backend.modules.profilechange.service.impl;

import com.bitconnect.backend.common.exception.BadRequestException;
import com.bitconnect.backend.common.exception.ForbiddenException;
import com.bitconnect.backend.common.exception.ResourceNotFoundException;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.alumni.entity.VerificationStatus;
import com.bitconnect.backend.modules.alumni.repository.AlumniProfileRepository;
import com.bitconnect.backend.modules.alumni.util.DepartmentCodeValidator;
import com.bitconnect.backend.modules.department.entity.Department;
import com.bitconnect.backend.modules.department.repository.DepartmentRepository;
import com.bitconnect.backend.modules.profilechange.dto.AdminProfileChangeRequestDetailResponse;
import com.bitconnect.backend.modules.profilechange.dto.ProfileChangeRequestCreateRequest;
import com.bitconnect.backend.modules.profilechange.dto.ProfileChangeRequestResponse;
import com.bitconnect.backend.modules.profilechange.dto.ProfileChangeRequestReviewRequest;
import com.bitconnect.backend.modules.profilechange.dto.ProfileChangeRequestUpdateRequest;
import com.bitconnect.backend.modules.profilechange.entity.ChangeRequestStatus;
import com.bitconnect.backend.modules.profilechange.entity.ProfileChangeRequest;
import com.bitconnect.backend.modules.profilechange.repository.ProfileChangeRequestRepository;
import com.bitconnect.backend.modules.profilechange.service.ProfileChangeRequestService;
import com.bitconnect.backend.modules.user.entity.User;
import com.bitconnect.backend.modules.user.repository.UserRepository;
import com.bitconnect.backend.modules.virtualid.dto.VirtualIdCardResponse;
import com.bitconnect.backend.modules.virtualid.entity.VirtualAlumniId;
import com.bitconnect.backend.modules.virtualid.entity.VirtualIdStatus;
import com.bitconnect.backend.modules.virtualid.repository.VirtualAlumniIdRepository;
import com.bitconnect.backend.modules.virtualid.service.VirtualIdService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileChangeRequestServiceImpl implements ProfileChangeRequestService {

    private final ProfileChangeRequestRepository changeRequestRepository;
    private final AlumniProfileRepository alumniProfileRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final VirtualAlumniIdRepository virtualAlumniIdRepository;
    private final VirtualIdService virtualIdService;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Override
    @Transactional
    public ProfileChangeRequestResponse createChangeRequest(UUID userId, ProfileChangeRequestCreateRequest request) {
        AlumniProfile profile = alumniProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Alumni profile not found for user: " + userId));

        if (profile.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new BadRequestException("Only verified alumni with an active Digital Alumni ID can submit profile change requests.");
        }

        if (changeRequestRepository.existsByAlumniProfileIdAndStatus(profile.getId(), ChangeRequestStatus.PENDING)) {
            throw new BadRequestException("You already have an active profile change request under review by the administrator.");
        }

        Map<String, Object> currentSnapshot = buildCurrentSnapshot(profile);
        Map<String, Object> requestedChanges = buildRequestedChangesMap(profile, request);

        if (requestedChanges.isEmpty()) {
            throw new BadRequestException("No modified profile fields detected. Please change at least one field before submitting a change request.");
        }

        validateChangeRequestDepartmentMatch(profile, requestedChanges);

        ProfileChangeRequest changeRequest = ProfileChangeRequest.builder()
                .alumniProfile(profile)
                .status(ChangeRequestStatus.PENDING)
                .currentProfileSnapshot(toJson(currentSnapshot))
                .requestedChanges(toJson(requestedChanges))
                .build();

        ProfileChangeRequest saved = changeRequestRepository.save(changeRequest);
        log.info("Created ProfileChangeRequest ID: {} for alumni profile: {}", saved.getId(), profile.getId());

        return ProfileChangeRequestResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProfileChangeRequestResponse> getMyChangeRequests(UUID userId) {
        AlumniProfile profile = alumniProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Alumni profile not found for user: " + userId));

        return changeRequestRepository.findByAlumniProfileIdOrderByCreatedAtDesc(profile.getId())
                .stream()
                .map(ProfileChangeRequestResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProfileChangeRequestResponse getChangeRequestById(UUID id, UUID userId, boolean isAdmin) {
        ProfileChangeRequest request = changeRequestRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile change request", "id", id));

        if (!isAdmin && !request.getAlumniProfile().getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to view this change request.");
        }

        return ProfileChangeRequestResponse.fromEntity(request);
    }

    @Override
    @Transactional
    public ProfileChangeRequestResponse updateChangeRequest(UUID id, UUID userId, ProfileChangeRequestUpdateRequest request) {
        ProfileChangeRequest changeRequest = changeRequestRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile change request", "id", id));

        if (!changeRequest.getAlumniProfile().getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to update this change request.");
        }

        if (changeRequest.getStatus() != ChangeRequestStatus.REJECTED) {
            throw new BadRequestException("Only REJECTED change requests can be updated. Current status: " + changeRequest.getStatus());
        }

        AlumniProfile profile = changeRequest.getAlumniProfile();
        ProfileChangeRequestCreateRequest convertedReq = new ProfileChangeRequestCreateRequest(
                request.fullName(),
                request.profilePhotoUrl(),
                request.dateOfBirth(),
                request.bloodGroup(),
                request.personalEmail(),
                request.phoneNumber(),
                request.permanentAddress(),
                request.city(),
                request.state(),
                request.country(),
                request.postalCode(),
                request.currentCompany(),
                request.currentDesignation(),
                request.industry(),
                request.linkedinUrl(),
                request.departmentId(),
                request.degree(),
                request.batchStartYear(),
                request.batchEndYear(),
                request.rollNumber(),
                request.registerNumber(),
                request.isDirectoryVisible()
        );

        Map<String, Object> requestedChanges = buildRequestedChangesMap(profile, convertedReq);
        if (requestedChanges.isEmpty()) {
            throw new BadRequestException("No modified profile fields detected. Please update at least one field.");
        }

        validateChangeRequestDepartmentMatch(profile, requestedChanges);

        changeRequest.setRequestedChanges(toJson(requestedChanges));
        ProfileChangeRequest saved = changeRequestRepository.save(changeRequest);
        log.info("Updated rejected ProfileChangeRequest ID: {} for user: {}", saved.getId(), userId);

        return ProfileChangeRequestResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public ProfileChangeRequestResponse resubmitChangeRequest(UUID id, UUID userId) {
        ProfileChangeRequest changeRequest = changeRequestRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile change request", "id", id));

        if (!changeRequest.getAlumniProfile().getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to resubmit this change request.");
        }

        if (changeRequest.getStatus() != ChangeRequestStatus.REJECTED) {
            throw new BadRequestException("Only REJECTED change requests can be resubmitted. Current status: " + changeRequest.getStatus());
        }

        AlumniProfile profile = changeRequest.getAlumniProfile();

        // Refresh current snapshot to latest state
        Map<String, Object> currentSnapshot = buildCurrentSnapshot(profile);
        changeRequest.setCurrentProfileSnapshot(toJson(currentSnapshot));
        changeRequest.setStatus(ChangeRequestStatus.PENDING);
        changeRequest.setReviewedBy(null);
        changeRequest.setReviewedAt(null);

        ProfileChangeRequest saved = changeRequestRepository.save(changeRequest);
        log.info("Resubmitted ProfileChangeRequest ID: {} into PENDING status for user: {}", saved.getId(), userId);

        return ProfileChangeRequestResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ProfileChangeRequestResponse> searchAdminChangeRequests(
            ChangeRequestStatus status,
            Integer departmentId,
            Integer batchEndYear,
            String search,
            Pageable pageable) {

        Specification<ProfileChangeRequest> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (departmentId != null) {
                predicates.add(cb.equal(root.get("alumniProfile").get("department").get("id"), departmentId));
            }
            if (batchEndYear != null) {
                predicates.add(cb.equal(root.get("alumniProfile").get("batchEndYear"), batchEndYear));
            }
            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.toLowerCase().trim() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("alumniProfile").get("user").get("fullName")), pattern);
                Predicate rollLike = cb.like(cb.lower(root.get("alumniProfile").get("rollNumber")), pattern);
                Predicate regLike = cb.like(cb.lower(root.get("alumniProfile").get("registerNumber")), pattern);
                Predicate emailLike = cb.like(cb.lower(root.get("alumniProfile").get("user").get("email")), pattern);
                predicates.add(cb.or(nameLike, rollLike, regLike, emailLike));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ProfileChangeRequest> page = changeRequestRepository.findAll(spec, pageable);
        return PagedResponse.from(page.map(ProfileChangeRequestResponse::fromEntity));
    }

    @Override
    @Transactional(readOnly = true)
    public AdminProfileChangeRequestDetailResponse getAdminChangeRequestDetail(UUID id) {
        ProfileChangeRequest changeRequest = changeRequestRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile change request", "id", id));

        AlumniProfile profile = changeRequest.getAlumniProfile();

        Map<String, Object> currentSnapshot = fromJson(changeRequest.getCurrentProfileSnapshot());
        Map<String, Object> requestedChanges = fromJson(changeRequest.getRequestedChanges());
        List<String> changedFields = new ArrayList<>(requestedChanges.keySet());

        Map<String, Object> alumniInfo = new LinkedHashMap<>();
        alumniInfo.put("profileId", profile.getId());
        alumniInfo.put("fullName", profile.getUser() != null ? profile.getUser().getFullName() : "");
        alumniInfo.put("accountEmail", profile.getUser() != null ? profile.getUser().getEmail() : "");
        alumniInfo.put("registerNumber", profile.getRegisterNumber());
        alumniInfo.put("rollNumber", profile.getRollNumber());
        alumniInfo.put("departmentCode", profile.getDepartment() != null ? profile.getDepartment().getCode() : "");
        alumniInfo.put("departmentName", profile.getDepartment() != null ? profile.getDepartment().getName() : "");
        alumniInfo.put("batch", profile.getBatchStartYear() + " - " + profile.getBatchEndYear());
        alumniInfo.put("verificationStatus", profile.getVerificationStatus());

        VirtualIdCardResponse currentVirtualId = null;
        try {
            currentVirtualId = virtualIdService.getVirtualIdByAlumniProfileId(profile.getId());
        } catch (Exception e) {
            log.warn("Current Virtual ID not found for profile {}: {}", profile.getId(), e.getMessage());
        }

        // Build proposed Virtual ID preview by merging requested changes onto current values
        VirtualIdCardResponse proposedVirtualIdPreview = buildProposedPreview(profile, requestedChanges, currentVirtualId);

        return new AdminProfileChangeRequestDetailResponse(
                ProfileChangeRequestResponse.fromEntity(changeRequest),
                alumniInfo,
                currentSnapshot,
                requestedChanges,
                changedFields,
                currentVirtualId,
                proposedVirtualIdPreview
        );
    }

    @Override
    @Transactional
    public ProfileChangeRequestResponse approveChangeRequest(UUID id, UUID adminId, String comment) {
        ProfileChangeRequest changeRequest = changeRequestRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile change request", "id", id));

        if (changeRequest.getStatus() != ChangeRequestStatus.PENDING) {
            throw new BadRequestException("Only PENDING change requests can be approved. Current status: " + changeRequest.getStatus());
        }

        AlumniProfile profile = changeRequest.getAlumniProfile();
        Map<String, Object> changes = fromJson(changeRequest.getRequestedChanges());

        // Apply changes onto AlumniProfile and User
        applyChangesToProfile(profile, changes);
        alumniProfileRepository.save(profile);

        // Ensure Virtual Alumni ID exists and is active, then rotate QR token
        VirtualAlumniId virtualId = virtualAlumniIdRepository.findByAlumniProfileId(profile.getId())
                .orElse(null);

        if (virtualId == null) {
            try {
                virtualId = virtualIdService.issueVirtualId(profile);
            } catch (Exception ex) {
                log.warn("Could not issue Virtual ID on approval: {}", ex.getMessage());
            }
        }

        if (virtualId != null) {
            if (virtualId.getStatus() != VirtualIdStatus.ACTIVE) {
                virtualId.setStatus(VirtualIdStatus.ACTIVE);
                virtualAlumniIdRepository.save(virtualId);
            }
            try {
                virtualIdService.regenerateQrToken(virtualId.getId(), adminId);
                log.info("Regenerated QR verification token for Virtual Alumni ID: {} following change approval", virtualId.getAlumniIdCardNumber());
            } catch (Exception ex) {
                log.error("Failed to regenerate QR token during profile change approval: {}", ex.getMessage(), ex);
            }
        }

        changeRequest.setStatus(ChangeRequestStatus.APPROVED);
        changeRequest.setReviewedBy(adminId);
        changeRequest.setReviewedAt(Instant.now());
        if (StringUtils.hasText(comment)) {
            changeRequest.setAdminComment(comment.trim());
        }

        ProfileChangeRequest saved = changeRequestRepository.save(changeRequest);
        log.info("Admin ID: {} approved ProfileChangeRequest ID: {} for alumni profile ID: {}", adminId, id, profile.getId());

        return ProfileChangeRequestResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public ProfileChangeRequestResponse rejectChangeRequest(UUID id, UUID adminId, ProfileChangeRequestReviewRequest request) {
        ProfileChangeRequest changeRequest = changeRequestRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile change request", "id", id));

        if (changeRequest.getStatus() != ChangeRequestStatus.PENDING) {
            throw new BadRequestException("Only PENDING change requests can be rejected. Current status: " + changeRequest.getStatus());
        }

        if (!StringUtils.hasText(request.comment())) {
            throw new BadRequestException("A mandatory rejection comment / feedback is required for audit and alumni guidance.");
        }

        changeRequest.setStatus(ChangeRequestStatus.REJECTED);
        changeRequest.setAdminComment(request.comment().trim());
        changeRequest.setReviewedBy(adminId);
        changeRequest.setReviewedAt(Instant.now());

        ProfileChangeRequest saved = changeRequestRepository.save(changeRequest);
        log.info("Admin ID: {} rejected ProfileChangeRequest ID: {} with reason: {}", adminId, id, request.comment());

        return ProfileChangeRequestResponse.fromEntity(saved);
    }

    private Map<String, Object> buildCurrentSnapshot(AlumniProfile profile) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("fullName", profile.getUser() != null ? profile.getUser().getFullName() : "");
        map.put("profilePhotoUrl", profile.getProfilePhotoUrl());
        map.put("dateOfBirth", profile.getDateOfBirth() != null ? profile.getDateOfBirth().toString() : null);
        map.put("bloodGroup", profile.getBloodGroup());
        map.put("personalEmail", profile.getPersonalEmail());
        map.put("phoneNumber", profile.getPhoneNumber());
        map.put("permanentAddress", profile.getPermanentAddress());
        map.put("city", profile.getCity());
        map.put("state", profile.getState());
        map.put("country", profile.getCountry());
        map.put("postalCode", profile.getPostalCode());
        map.put("currentCompany", profile.getCurrentCompany());
        map.put("currentDesignation", profile.getCurrentDesignation());
        map.put("industry", profile.getIndustry());
        map.put("linkedinUrl", profile.getLinkedinUrl());
        map.put("departmentId", profile.getDepartment() != null ? profile.getDepartment().getId() : null);
        map.put("departmentCode", profile.getDepartment() != null ? profile.getDepartment().getCode() : null);
        map.put("departmentName", profile.getDepartment() != null ? profile.getDepartment().getName() : null);
        map.put("degree", profile.getDegree());
        map.put("batchStartYear", profile.getBatchStartYear());
        map.put("batchEndYear", profile.getBatchEndYear());
        map.put("rollNumber", profile.getRollNumber());
        map.put("registerNumber", profile.getRegisterNumber());
        map.put("isDirectoryVisible", profile.isDirectoryVisible());
        return map;
    }

    private Map<String, Object> buildRequestedChangesMap(AlumniProfile profile, ProfileChangeRequestCreateRequest req) {
        Map<String, Object> changes = new LinkedHashMap<>();

        String currentFullName = profile.getUser() != null ? profile.getUser().getFullName() : "";
        if (req.fullName() != null && !Objects.equals(req.fullName().trim(), currentFullName)) {
            changes.put("fullName", req.fullName().trim());
        }
        if (req.profilePhotoUrl() != null && !Objects.equals(req.profilePhotoUrl().trim(), profile.getProfilePhotoUrl())) {
            changes.put("profilePhotoUrl", req.profilePhotoUrl().trim());
        }
        if (req.dateOfBirth() != null && !Objects.equals(req.dateOfBirth(), profile.getDateOfBirth())) {
            changes.put("dateOfBirth", req.dateOfBirth().toString());
        }
        if (req.bloodGroup() != null && !Objects.equals(req.bloodGroup().trim().toUpperCase(), profile.getBloodGroup())) {
            changes.put("bloodGroup", req.bloodGroup().trim().toUpperCase());
        }
        if (req.personalEmail() != null && !Objects.equals(req.personalEmail().trim().toLowerCase(), profile.getPersonalEmail())) {
            changes.put("personalEmail", req.personalEmail().trim().toLowerCase());
        }
        if (req.phoneNumber() != null && !Objects.equals(req.phoneNumber().trim(), profile.getPhoneNumber())) {
            changes.put("phoneNumber", req.phoneNumber().trim());
        }
        if (req.permanentAddress() != null && !Objects.equals(req.permanentAddress().trim(), profile.getPermanentAddress())) {
            changes.put("permanentAddress", req.permanentAddress().trim());
        }
        if (req.city() != null && !Objects.equals(req.city().trim(), profile.getCity())) {
            changes.put("city", req.city().trim());
        }
        if (req.state() != null && !Objects.equals(req.state().trim(), profile.getState())) {
            changes.put("state", req.state().trim());
        }
        if (req.country() != null && !Objects.equals(req.country().trim(), profile.getCountry())) {
            changes.put("country", req.country().trim());
        }
        if (req.postalCode() != null && !Objects.equals(req.postalCode().trim(), profile.getPostalCode())) {
            changes.put("postalCode", req.postalCode().trim());
        }
        if (req.currentCompany() != null && !Objects.equals(req.currentCompany().trim(), profile.getCurrentCompany())) {
            changes.put("currentCompany", req.currentCompany().trim());
        }
        if (req.currentDesignation() != null && !Objects.equals(req.currentDesignation().trim(), profile.getCurrentDesignation())) {
            changes.put("currentDesignation", req.currentDesignation().trim());
        }
        if (req.industry() != null && !Objects.equals(req.industry().trim(), profile.getIndustry())) {
            changes.put("industry", req.industry().trim());
        }
        if (req.linkedinUrl() != null && !Objects.equals(req.linkedinUrl().trim(), profile.getLinkedinUrl())) {
            changes.put("linkedinUrl", req.linkedinUrl().trim());
        }
        if (req.departmentId() != null && profile.getDepartment() != null && !Objects.equals(req.departmentId(), profile.getDepartment().getId())) {
            changes.put("departmentId", req.departmentId());
        }
        if (req.degree() != null && !Objects.equals(req.degree().trim(), profile.getDegree())) {
            changes.put("degree", req.degree().trim());
        }
        if (req.batchStartYear() != null && !Objects.equals(req.batchStartYear(), profile.getBatchStartYear())) {
            changes.put("batchStartYear", req.batchStartYear());
        }
        if (req.batchEndYear() != null && !Objects.equals(req.batchEndYear(), profile.getBatchEndYear())) {
            changes.put("batchEndYear", req.batchEndYear());
        }
        if (req.rollNumber() != null && !Objects.equals(req.rollNumber().trim().toUpperCase(), profile.getRollNumber())) {
            changes.put("rollNumber", req.rollNumber().trim().toUpperCase());
        }
        if (req.registerNumber() != null && !Objects.equals(req.registerNumber().trim().toUpperCase(), profile.getRegisterNumber())) {
            changes.put("registerNumber", req.registerNumber().trim().toUpperCase());
        }
        if (req.isDirectoryVisible() != null && !Objects.equals(req.isDirectoryVisible(), profile.isDirectoryVisible())) {
            changes.put("isDirectoryVisible", req.isDirectoryVisible());
        }

        return changes;
    }

    private void validateChangeRequestDepartmentMatch(AlumniProfile profile, Map<String, Object> changes) {
        Department targetDept = profile.getDepartment();
        if (changes.containsKey("departmentId") && changes.get("departmentId") != null) {
            try {
                Integer deptId = ((Number) changes.get("departmentId")).intValue();
                targetDept = departmentRepository.findById(deptId).orElse(targetDept);
            } catch (Exception ignored) {}
        }

        String effectiveRegNo = changes.containsKey("registerNumber")
                ? (String) changes.get("registerNumber")
                : profile.getRegisterNumber();

        String effectiveRollNo = changes.containsKey("rollNumber")
                ? (String) changes.get("rollNumber")
                : profile.getRollNumber();

        DepartmentCodeValidator.validateDepartmentMatch(targetDept, effectiveRegNo, effectiveRollNo);
    }

    private void applyChangesToProfile(AlumniProfile profile, Map<String, Object> changes) {
        if (changes == null || changes.isEmpty()) return;

        if (changes.containsKey("fullName") && changes.get("fullName") != null) {
            User user = profile.getUser();
            if (user != null) {
                user.setFullName(String.valueOf(changes.get("fullName")).trim());
                userRepository.save(user);
            }
        }
        if (changes.containsKey("profilePhotoUrl")) {
            profile.setProfilePhotoUrl(changes.get("profilePhotoUrl") != null ? String.valueOf(changes.get("profilePhotoUrl")).trim() : null);
        }
        if (changes.containsKey("dateOfBirth")) {
            Object dobVal = changes.get("dateOfBirth");
            if (dobVal != null && StringUtils.hasText(String.valueOf(dobVal))) {
                try {
                    profile.setDateOfBirth(LocalDate.parse(String.valueOf(dobVal).trim()));
                } catch (Exception ex) {
                    log.warn("Failed to parse dateOfBirth: {}", dobVal);
                }
            } else {
                profile.setDateOfBirth(null);
            }
        }
        if (changes.containsKey("bloodGroup")) {
            profile.setBloodGroup(changes.get("bloodGroup") != null ? String.valueOf(changes.get("bloodGroup")).trim() : null);
        }
        if (changes.containsKey("personalEmail")) {
            profile.setPersonalEmail(changes.get("personalEmail") != null ? String.valueOf(changes.get("personalEmail")).trim().toLowerCase() : null);
        }
        if (changes.containsKey("phoneNumber")) {
            profile.setPhoneNumber(changes.get("phoneNumber") != null ? String.valueOf(changes.get("phoneNumber")).trim() : null);
        }
        if (changes.containsKey("permanentAddress")) {
            profile.setPermanentAddress(changes.get("permanentAddress") != null ? String.valueOf(changes.get("permanentAddress")).trim() : null);
        }
        if (changes.containsKey("city")) {
            profile.setCity(changes.get("city") != null ? String.valueOf(changes.get("city")).trim() : null);
        }
        if (changes.containsKey("state")) {
            profile.setState(changes.get("state") != null ? String.valueOf(changes.get("state")).trim() : null);
        }
        if (changes.containsKey("country")) {
            profile.setCountry(changes.get("country") != null ? String.valueOf(changes.get("country")).trim() : null);
        }
        if (changes.containsKey("postalCode")) {
            profile.setPostalCode(changes.get("postalCode") != null ? String.valueOf(changes.get("postalCode")).trim() : null);
        }
        if (changes.containsKey("currentCompany")) {
            profile.setCurrentCompany(changes.get("currentCompany") != null ? String.valueOf(changes.get("currentCompany")).trim() : null);
        }
        if (changes.containsKey("currentDesignation")) {
            profile.setCurrentDesignation(changes.get("currentDesignation") != null ? String.valueOf(changes.get("currentDesignation")).trim() : null);
        }
        if (changes.containsKey("industry")) {
            profile.setIndustry(changes.get("industry") != null ? String.valueOf(changes.get("industry")).trim() : null);
        }
        if (changes.containsKey("linkedinUrl")) {
            profile.setLinkedinUrl(changes.get("linkedinUrl") != null ? String.valueOf(changes.get("linkedinUrl")).trim() : null);
        }
        if (changes.containsKey("degree")) {
            profile.setDegree(changes.get("degree") != null ? String.valueOf(changes.get("degree")).trim() : null);
        }
        if (changes.containsKey("batchStartYear")) {
            Object val = changes.get("batchStartYear");
            if (val instanceof Number n) {
                profile.setBatchStartYear(n.intValue());
            } else if (val != null && StringUtils.hasText(String.valueOf(val))) {
                try {
                    profile.setBatchStartYear(Integer.parseInt(String.valueOf(val).trim()));
                } catch (Exception ignored) {}
            }
        }
        if (changes.containsKey("batchEndYear")) {
            Object val = changes.get("batchEndYear");
            if (val instanceof Number n) {
                profile.setBatchEndYear(n.intValue());
            } else if (val != null && StringUtils.hasText(String.valueOf(val))) {
                try {
                    profile.setBatchEndYear(Integer.parseInt(String.valueOf(val).trim()));
                } catch (Exception ignored) {}
            }
        }
        if (changes.containsKey("rollNumber")) {
            profile.setRollNumber(changes.get("rollNumber") != null ? String.valueOf(changes.get("rollNumber")).trim() : null);
        }
        if (changes.containsKey("registerNumber")) {
            profile.setRegisterNumber(changes.get("registerNumber") != null ? String.valueOf(changes.get("registerNumber")).trim() : null);
        }
        if (changes.containsKey("isDirectoryVisible")) {
            Object val = changes.get("isDirectoryVisible");
            if (val instanceof Boolean b) {
                profile.setDirectoryVisible(b);
            } else if (val != null) {
                profile.setDirectoryVisible(Boolean.parseBoolean(String.valueOf(val).trim()));
            }
        }
        if (changes.containsKey("departmentId")) {
            Object val = changes.get("departmentId");
            Integer deptId = null;
            if (val instanceof Number n) {
                deptId = n.intValue();
            } else if (val != null && StringUtils.hasText(String.valueOf(val))) {
                try {
                    deptId = Integer.parseInt(String.valueOf(val).trim());
                } catch (Exception ignored) {}
            }
            if (deptId != null) {
                final Integer finalDeptId = deptId;
                Department dept = departmentRepository.findById(finalDeptId)
                        .orElseThrow(() -> new ResourceNotFoundException("Department", "id", finalDeptId));
                profile.setDepartment(dept);
            }
        }
    }

    private VirtualIdCardResponse buildProposedPreview(
            AlumniProfile profile,
            Map<String, Object> changes,
            VirtualIdCardResponse currentVirtualId) {

        String fullName = (String) changes.getOrDefault("fullName", profile.getUser() != null ? profile.getUser().getFullName() : "");
        String photoUrl = (String) changes.getOrDefault("profilePhotoUrl", profile.getProfilePhotoUrl());
        String degree = (String) changes.getOrDefault("degree", profile.getDegree());
        Integer startYear = changes.containsKey("batchStartYear")
                ? ((Number) changes.get("batchStartYear")).intValue()
                : profile.getBatchStartYear();
        Integer endYear = changes.containsKey("batchEndYear")
                ? ((Number) changes.get("batchEndYear")).intValue()
                : profile.getBatchEndYear();
        String rollNumber = (String) changes.getOrDefault("rollNumber", profile.getRollNumber());
        String registerNumber = (String) changes.getOrDefault("registerNumber", profile.getRegisterNumber());

        LocalDate dob = profile.getDateOfBirth();
        if (changes.containsKey("dateOfBirth") && changes.get("dateOfBirth") != null) {
            try {
                dob = LocalDate.parse(String.valueOf(changes.get("dateOfBirth")).trim());
            } catch (Exception ignored) {}
        }

        String bloodGroup = (String) changes.getOrDefault("bloodGroup", profile.getBloodGroup());
        String phoneNumber = (String) changes.getOrDefault("phoneNumber", profile.getPhoneNumber());
        String email = (String) changes.getOrDefault("personalEmail", profile.getPersonalEmail());
        String address = (String) changes.getOrDefault("permanentAddress", profile.getPermanentAddress());
        String city = (String) changes.getOrDefault("city", profile.getCity());
        String state = (String) changes.getOrDefault("state", profile.getState());
        String country = (String) changes.getOrDefault("country", profile.getCountry());
        String postalCode = (String) changes.getOrDefault("postalCode", profile.getPostalCode());

        String deptName = profile.getDepartment() != null ? profile.getDepartment().getName() : "";
        String deptCode = profile.getDepartment() != null ? profile.getDepartment().getCode() : "";
        if (changes.containsKey("departmentId")) {
            try {
                Integer deptId = ((Number) changes.get("departmentId")).intValue();
                Department d = departmentRepository.findById(deptId).orElse(profile.getDepartment());
                if (d != null) {
                    deptName = d.getName();
                    deptCode = d.getCode();
                }
            } catch (Exception ignored) {}
        }

        String permanentCardNumber = (currentVirtualId != null)
                ? currentVirtualId.alumniIdCardNumber()
                : "BIT-ALU-" + endYear + "-PREVIEW";

        return virtualIdService.generatePreview(
                fullName,
                photoUrl,
                deptName,
                deptCode,
                degree,
                startYear,
                endYear,
                rollNumber,
                registerNumber,
                dob,
                bloodGroup,
                phoneNumber,
                email,
                address,
                city,
                state,
                country,
                postalCode,
                permanentCardNumber
        );
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize to JSON: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> fromJson(String json) {
        if (!StringUtils.hasText(json)) return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.warn("Failed to deserialize JSON: {}", json);
            return Collections.emptyMap();
        }
    }
}
