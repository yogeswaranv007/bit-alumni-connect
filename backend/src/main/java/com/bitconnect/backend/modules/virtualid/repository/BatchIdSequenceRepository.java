package com.bitconnect.backend.modules.virtualid.repository;

import com.bitconnect.backend.modules.virtualid.entity.BatchIdSequence;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BatchIdSequenceRepository extends JpaRepository<BatchIdSequence, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM BatchIdSequence s WHERE s.batchYear = :batchYear")
    Optional<BatchIdSequence> findByBatchYearWithLock(@Param("batchYear") Integer batchYear);
}
