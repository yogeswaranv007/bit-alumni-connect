package com.bitconnect.backend.modules.virtualid.entity;

import com.bitconnect.backend.common.entity.BaseAuditableEntity;
import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * Domain entity representing an issued digital Virtual Alumni ID credential.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "virtual_alumni_ids",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_virtual_alumni_ids_profile_id", columnNames = "alumni_profile_id"),
                @UniqueConstraint(name = "uk_virtual_alumni_ids_card_number", columnNames = "alumni_id_card_number")
        },
        indexes = {
                @Index(name = "idx_virtual_id_card_number", columnList = "alumni_id_card_number"),
                @Index(name = "idx_virtual_id_status", columnList = "status")
        }
)
public class VirtualAlumniId extends BaseAuditableEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "alumni_profile_id",
            nullable = false,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_virtual_alumni_ids_profile")
    )
    private AlumniProfile alumniProfile;

    @Column(name = "alumni_id_card_number", length = 40, nullable = false, unique = true)
    private String alumniIdCardNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private VirtualIdStatus status = VirtualIdStatus.ACTIVE;

    @Column(name = "issued_date", nullable = false)
    private LocalDate issuedDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;
}
