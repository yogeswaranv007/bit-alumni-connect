package com.bitconnect.backend.modules.student.entity;

import com.bitconnect.backend.common.entity.BaseAuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Permanent digital credential for a BIT student.
 * The card number (BIT-STU-{batchYear}-{seq}) is stable; only the QR token rotates.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "virtual_student_ids",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_virtual_student_ids_profile",     columnNames = "student_profile_id"),
                @UniqueConstraint(name = "uk_virtual_student_ids_card_number", columnNames = "student_id_card_number")
        },
        indexes = {
                @Index(name = "idx_virtual_student_id_card_number", columnList = "student_id_card_number")
        }
)
public class VirtualStudentId extends BaseAuditableEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "student_profile_id",
            nullable = false,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_virtual_student_ids_profile")
    )
    private StudentProfile studentProfile;

    @Column(name = "student_id_card_number", length = 40, nullable = false, unique = true)
    private String studentIdCardNumber;

    @Column(name = "issued_date", nullable = false)
    private LocalDate issuedDate;

    /** Optional expiry — typically end of academic programme (batchEndYear). */
    @Column(name = "expiry_date")
    private LocalDate expiryDate;
}
