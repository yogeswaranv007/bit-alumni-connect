package com.bitconnect.backend.modules.virtualid.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Tracks batch-specific sequential counters for collision-free Alumni ID generation
 * under high concurrency using database-level locking.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "batch_id_sequences")
public class BatchIdSequence {

    @Id
    @Column(name = "batch_year", nullable = false)
    private Integer batchYear;

    @Column(name = "next_sequence", nullable = false)
    @Builder.Default
    private Long nextSequence = 1L;
}
