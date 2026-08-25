package com.bitconnect.backend.modules.virtualid.entity;

import com.bitconnect.backend.common.entity.BaseAuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Domain entity representing a high-entropy, revocable QR verification token
 * decoupled from the permanent Alumni ID.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "qr_verification_tokens",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_qr_verification_tokens_token", columnNames = "token")
        },
        indexes = {
                @Index(name = "idx_qr_token_lookup", columnList = "token, status")
        }
)
public class QrVerificationToken extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "virtual_alumni_id_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_qr_tokens_virtual_id")
    )
    private VirtualAlumniId virtualAlumniId;

    @Column(name = "token", length = 64, nullable = false, unique = true)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private TokenStatus status = TokenStatus.ACTIVE;

    @Column(name = "scan_count", nullable = false)
    @Builder.Default
    private Integer scanCount = 0;

    @Column(name = "last_scanned_at")
    private Instant lastScannedAt;
}
