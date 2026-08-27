package com.bitconnect.backend.modules.profilechange.entity;

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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain entity representing a formal alumni profile change request
 * subject to administrative oversight, comparison, and approval.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "profile_change_requests",
        indexes = {
                @Index(name = "idx_change_req_alumni", columnList = "alumni_profile_id"),
                @Index(name = "idx_change_req_status", columnList = "status")
        }
)
public class ProfileChangeRequest extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "alumni_profile_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_change_requests_alumni")
    )
    private AlumniProfile alumniProfile;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private ChangeRequestStatus status = ChangeRequestStatus.PENDING;

    @Column(name = "current_profile_snapshot", columnDefinition = "TEXT", nullable = false)
    private String currentProfileSnapshot;

    @Column(name = "requested_changes", columnDefinition = "TEXT", nullable = false)
    private String requestedChanges;

    @Column(name = "admin_comment", columnDefinition = "TEXT")
    private String adminComment;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;
}
