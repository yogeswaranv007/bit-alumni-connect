package com.bitconnect.backend.modules.rfid.service.impl;

import com.bitconnect.backend.common.exception.BadRequestException;
import com.bitconnect.backend.common.exception.ResourceNotFoundException;
import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.alumni.entity.VerificationStatus;
import com.bitconnect.backend.modules.alumni.repository.AlumniProfileRepository;
import com.bitconnect.backend.modules.rfid.dto.RfidAssignRequest;
import com.bitconnect.backend.modules.rfid.dto.RfidMappingDto;
import com.bitconnect.backend.modules.rfid.dto.RfidStatusUpdateRequest;
import com.bitconnect.backend.modules.rfid.entity.RfidIdentityMapping;
import com.bitconnect.backend.modules.rfid.entity.RfidStatus;
import com.bitconnect.backend.modules.rfid.repository.RfidIdentityMappingRepository;
import com.bitconnect.backend.modules.rfid.service.RfidService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RfidServiceImpl implements RfidService {

    private final RfidIdentityMappingRepository rfidRepository;
    private final AlumniProfileRepository alumniProfileRepository;

    @Override
    @Transactional
    public RfidMappingDto assignRfid(RfidAssignRequest request) {
        AlumniProfile profile = alumniProfileRepository.findById(request.alumniProfileId())
                .orElseThrow(() -> new ResourceNotFoundException("AlumniProfile", "id", request.alumniProfileId()));

        if (profile.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new BadRequestException("Cannot assign RFID to unverified alumni profile");
        }

        // Check if RFID tag is already assigned to someone else
        Optional<RfidIdentityMapping> existingByUid = rfidRepository.findByRfidUid(request.rfidUid().trim());
        if (existingByUid.isPresent()) {
            RfidIdentityMapping existing = existingByUid.get();
            if (!existing.getAlumniProfile().getId().equals(profile.getId())) {
                throw new BadRequestException("RFID UID is already assigned to another alumni profile");
            }
        }

        // Check if alumnus already has an RFID mapping
        Optional<RfidIdentityMapping> existingProfileMapping = rfidRepository.findByAlumniProfileId(profile.getId());
        RfidIdentityMapping mapping;
        if (existingProfileMapping.isPresent()) {
            mapping = existingProfileMapping.get();
            mapping.setRfidUid(request.rfidUid().trim());
            mapping.setCardNumber(request.cardNumber());
            mapping.setStatus(RfidStatus.ACTIVE);
            mapping.setIssuedDate(LocalDate.now());
            mapping.setNotes(request.notes());
            log.info("Updated existing RFID mapping for alumni: {} to RFID UID: {}", profile.getRollNumber(), request.rfidUid());
        } else {
            mapping = RfidIdentityMapping.builder()
                    .alumniProfile(profile)
                    .rfidUid(request.rfidUid().trim())
                    .cardNumber(request.cardNumber())
                    .status(RfidStatus.ACTIVE)
                    .issuedDate(LocalDate.now())
                    .notes(request.notes())
                    .build();
            log.info("Assigned new RFID UID: {} to alumni: {}", request.rfidUid(), profile.getRollNumber());
        }

        RfidIdentityMapping saved = rfidRepository.save(mapping);
        return RfidMappingDto.from(saved);
    }

    @Override
    @Transactional
    public RfidMappingDto updateStatus(UUID mappingId, RfidStatusUpdateRequest request) {
        RfidIdentityMapping mapping = rfidRepository.findById(mappingId)
                .orElseThrow(() -> new ResourceNotFoundException("RfidIdentityMapping", "id", mappingId));

        mapping.setStatus(request.status());
        if (request.notes() != null && !request.notes().isBlank()) {
            mapping.setNotes(request.notes());
        }

        RfidIdentityMapping saved = rfidRepository.save(mapping);
        log.info("Updated RFID mapping {} status to: {}", mappingId, request.status());
        return RfidMappingDto.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RfidIdentityMapping> findActiveMappingByUid(String rfidUid) {
        if (rfidUid == null || rfidUid.isBlank()) {
            return Optional.empty();
        }
        return rfidRepository.findByRfidUidAndStatus(rfidUid.trim(), RfidStatus.ACTIVE);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RfidMappingDto> getMappingByAlumniProfileId(UUID alumniProfileId) {
        return rfidRepository.findByAlumniProfileId(alumniProfileId)
                .map(RfidMappingDto::from);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RfidMappingDto> getAllMappings() {
        return rfidRepository.findAll()
                .stream()
                .map(RfidMappingDto::from)
                .toList();
    }
}
