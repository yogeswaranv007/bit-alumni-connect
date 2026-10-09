package com.bitconnect.backend.modules.institutional.provider;

import com.bitconnect.backend.modules.institutional.dto.AlumniVerificationRequest;
import com.bitconnect.backend.modules.institutional.dto.AlumniVerificationResult;
import com.bitconnect.backend.modules.institutional.entity.CollegeAlumniRecord;
import com.bitconnect.backend.modules.institutional.entity.CollegeRecordStatus;
import com.bitconnect.backend.modules.institutional.repository.CollegeAlumniRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * DEVELOPMENT MOCK implementation of {@link InstitutionalAlumniDataProvider}.
 *
 * <p>Queries the {@code college_alumni_records} table, which is seeded with synthetic data.
 *
 * <p><strong>This class is a development substitute.</strong>
 * Replace with {@code BITInstitutionalAlumniDataProvider} when the real college API is available.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MockInstitutionalAlumniDataProvider implements InstitutionalAlumniDataProvider {

    private final CollegeAlumniRecordRepository repository;

    @Override
    @Transactional(readOnly = true)
    public Optional<AlumniVerificationResult> verify(AlumniVerificationRequest request) {
        String registerNumber = request.registerNumber().trim().toUpperCase();

        Optional<CollegeAlumniRecord> recordOpt = repository.findByRegisterNumber(registerNumber);
        if (recordOpt.isEmpty()) {
            log.debug("[MOCK-INST] No alumni record found for register number: {}", registerNumber);
            return Optional.empty();
        }

        CollegeAlumniRecord record = recordOpt.get();

        if (record.getRecordStatus() != CollegeRecordStatus.ACTIVE) {
            log.debug("[MOCK-INST] Alumni record {} is INACTIVE", registerNumber);
            return Optional.empty();
        }

        boolean nameMatches = record.getName().trim().equalsIgnoreCase(request.name().trim());
        if (!nameMatches) {
            log.debug("[MOCK-INST] Name mismatch for alumni register number {}", registerNumber);
            return Optional.empty();
        }

        boolean dobMatches = record.getDateOfBirth().equals(request.dateOfBirth());
        if (!dobMatches) {
            log.debug("[MOCK-INST] DOB mismatch for alumni register number {}", registerNumber);
            return Optional.empty();
        }

        log.info("[MOCK-INST] Alumni verified successfully: {}", registerNumber);
        return Optional.of(toResult(record));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isAlreadyRegistered(String institutionalRecordId) {
        return repository.findByInstitutionalRecordId(institutionalRecordId)
                .map(r -> r.getLinkedBitConnectUserId() != null)
                .orElse(false);
    }

    @Override
    @Transactional
    public void markAsRegistered(String institutionalRecordId, UUID bitConnectUserId) {
        repository.findByInstitutionalRecordId(institutionalRecordId).ifPresent(record -> {
            record.setLinkedBitConnectUserId(bitConnectUserId);
            repository.save(record);
            log.info("[MOCK-INST] Linked alumni record {} to BIT Connect user {}",
                    institutionalRecordId, bitConnectUserId);
        });
    }

    private AlumniVerificationResult toResult(CollegeAlumniRecord r) {
        return new AlumniVerificationResult(
                r.getInstitutionalRecordId(),
                r.getRegisterNumber(),
                r.getName(),
                r.getDateOfBirth(),
                r.getDegree(),
                r.getDepartmentCode(),
                r.getGraduationYear(),
                r.getOfficialEmail(),
                r.getPhone(),
                r.getAddress(),
                r.getRecordStatus()
        );
    }
}
