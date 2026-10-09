package com.bitconnect.backend.modules.institutional.repository;

import com.bitconnect.backend.modules.institutional.entity.CollegeAlumniRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data repository for development mock college alumni records.
 */
public interface CollegeAlumniRecordRepository extends JpaRepository<CollegeAlumniRecord, UUID> {

    Optional<CollegeAlumniRecord> findByRegisterNumber(String registerNumber);

    boolean existsByRegisterNumber(String registerNumber);

    boolean existsByLinkedBitConnectUserId(UUID userId);

    Optional<CollegeAlumniRecord> findByInstitutionalRecordId(String institutionalRecordId);
}
