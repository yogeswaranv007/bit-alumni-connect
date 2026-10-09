package com.bitconnect.backend.modules.institutional.repository;

import com.bitconnect.backend.modules.institutional.entity.CollegeStudentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data repository for development mock college student records.
 * In production, replace the data source — not this repository — with the real integration.
 */
public interface CollegeStudentRecordRepository extends JpaRepository<CollegeStudentRecord, UUID> {

    Optional<CollegeStudentRecord> findByRegisterNumber(String registerNumber);

    boolean existsByRegisterNumber(String registerNumber);

    boolean existsByLinkedBitConnectUserId(UUID userId);

    Optional<CollegeStudentRecord> findByInstitutionalRecordId(String institutionalRecordId);
}
