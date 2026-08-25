package com.bitconnect.backend.modules.virtualid.service;

import com.bitconnect.backend.modules.virtualid.entity.BatchIdSequence;
import com.bitconnect.backend.modules.virtualid.repository.BatchIdSequenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service responsible for generating collision-free, sequential Alumni IDs
 * per graduation batch year (e.g. BIT-ALU-2023-000001) using database-level locking.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AlumniIdGeneratorService {

    private final BatchIdSequenceRepository batchIdSequenceRepository;

    @Transactional
    public String generateNextAlumniId(Integer batchYear) {
        int year = (batchYear != null) ? batchYear : 2024;

        BatchIdSequence sequence = batchIdSequenceRepository.findByBatchYearWithLock(year)
                .orElseGet(() -> {
                    BatchIdSequence newSeq = BatchIdSequence.builder()
                            .batchYear(year)
                            .nextSequence(1L)
                            .build();
                    return batchIdSequenceRepository.saveAndFlush(newSeq);
                });

        long currentSeq = sequence.getNextSequence();
        sequence.setNextSequence(currentSeq + 1);
        batchIdSequenceRepository.save(sequence);

        String alumniId = String.format("BIT-ALU-%d-%06d", year, currentSeq);
        log.info("Generated unique Alumni ID: {}", alumniId);
        return alumniId;
    }
}
