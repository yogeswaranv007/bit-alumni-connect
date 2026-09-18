package com.bitconnect.backend.modules.rfid.entity;

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
 * Domain entity mapping a physical RFID / NFC card identifier to an AlumniProfile.
 * Contains ZERO sensitive personal data. Acts strictly as an identity pointer.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "rfid_identity_mappings",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_rfid_mappings_rfid_uid", columnNames = "rfid_uid"),
                @UniqueConstraint(name = "uk_rfid_mappings_alumni_profile", columnNames = "alumni_profile_id")
        },
        indexes = {
                @Index(name = "idx_rfid_uid", columnList = "rfid_uid"),
                @Index(name = "idx_rfid_status", columnList = "status")
        }
)
public class RfidIdentityMapping extends BaseAuditableEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "alumni_profile_id",
            nullable = false,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_rfid_mappings_alumni")
    )
    private AlumniProfile alumniProfile;

    @Column(name = "rfid_uid", length = 64, nullable = false, unique = true)
    private String rfidUid;

    @Column(name = "card_number", length = 50)
    private String cardNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private RfidStatus status = RfidStatus.ACTIVE;

    @Column(name = "issued_date", nullable = false)
    private LocalDate issuedDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
