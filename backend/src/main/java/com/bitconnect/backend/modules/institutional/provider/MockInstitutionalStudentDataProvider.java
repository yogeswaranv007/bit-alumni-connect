package com.bitconnect.backend.modules.institutional.provider;

import com.bitconnect.backend.modules.institutional.dto.StudentVerificationRequest;
import com.bitconnect.backend.modules.institutional.dto.StudentVerificationResult;
import com.bitconnect.backend.modules.institutional.entity.CollegeRecordStatus;
import com.bitconnect.backend.modules.institutional.entity.CollegeStudentRecord;
import com.bitconnect.backend.modules.institutional.repository.CollegeStudentRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * DEVELOPMENT MOCK implementation of {@link InstitutionalStudentDataProvider}.
 *
 * <p>Queries the {@code college_student_records} table, which is seeded with synthetic
 * development data in {@link com.bitconnect.backend.config.DataInitializer}.
 *
 * <p><strong>This class is a development substitute.</strong>
 * When the real BIT college database / API is available:
 * <ol>
 *   <li>Create {@code BITInstitutionalStudentDataProvider implements InstitutionalStudentDataProvider}</li>
 *   <li>Mark this class with {@code @Profile("dev")} and the new one with {@code @Profile("prod")}</li>
 *   <li>No other BIT Connect code needs to change</li>
 * </ol>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MockInstitutionalStudentDataProvider implements InstitutionalStudentDataProvider {

    private final CollegeStudentRecordRepository repository;

    @Override
    @Transactional(readOnly = true)
    public Optional<StudentVerificationResult> verify(StudentVerificationRequest request) {
        String registerNumber = request.registerNumber().trim().toUpperCase();

        Optional<CollegeStudentRecord> recordOpt = repository.findByRegisterNumber(registerNumber);
        if (recordOpt.isEmpty()) {
            log.debug("[MOCK-INST] No student record found for register number: {}", registerNumber);
            return Optional.empty();
        }

        CollegeStudentRecord record = recordOpt.get();

        // Record must be ACTIVE
        if (record.getRecordStatus() != CollegeRecordStatus.ACTIVE) {
            log.debug("[MOCK-INST] Student record {} is INACTIVE", registerNumber);
            return Optional.empty();
        }

        // Name must match (case-insensitive, trimmed)
        boolean nameMatches = record.getName().trim().equalsIgnoreCase(request.name().trim());
        if (!nameMatches) {
            log.debug("[MOCK-INST] Name mismatch for register number {}: expected '{}', got '{}'",
                    registerNumber, record.getName(), request.name());
            return Optional.empty();
        }

        // Date of birth must match exactly
        boolean dobMatches = record.getDateOfBirth().equals(request.dateOfBirth());
        if (!dobMatches) {
            log.debug("[MOCK-INST] DOB mismatch for register number {}", registerNumber);
            return Optional.empty();
        }

        log.info("[MOCK-INST] Student verified successfully: {}", registerNumber);
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
            log.info("[MOCK-INST] Linked institutional record {} to BIT Connect user {}",
                    institutionalRecordId, bitConnectUserId);
        });
    }

    private StudentVerificationResult toResult(CollegeStudentRecord r) {
        return new StudentVerificationResult(
                r.getInstitutionalRecordId(),
                r.getRegisterNumber(),
                r.getName(),
                r.getDateOfBirth(),
                r.getDegree(),
                r.getDepartmentCode(),
                r.getBatchStartYear(),
                r.getBatchEndYear(),
                r.getStudentType(),
                r.getOfficialEmail(),
                r.getPhone(),
                r.getParentPhone(),
                r.getBloodGroup(),
                r.getAddress(),
                r.getRecordStatus()
        );
    }
}
