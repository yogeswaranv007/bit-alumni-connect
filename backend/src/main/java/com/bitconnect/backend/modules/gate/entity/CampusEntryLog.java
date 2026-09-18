package com.bitconnect.backend.modules.gate.entity;

import com.bitconnect.backend.common.entity.BaseAuditableEntity;
import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisit;
import com.bitconnect.backend.modules.user.entity.User;
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
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Immutable security audit log representing a physical gate verification & entry event.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "campus_entry_logs",
        indexes = {
                @Index(name = "idx_entry_date", columnList = "entry_date"),
                @Index(name = "idx_entry_alumni", columnList = "alumni_profile_id"),
                @Index(name = "idx_entry_decision", columnList = "entry_decision"),
                @Index(name = "idx_entry_method", columnList = "verification_method")
        }
)
public class CampusEntryLog extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "alumni_profile_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_entry_logs_alumni")
    )
    private AlumniProfile alumniProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "campus_visit_id",
            foreignKey = @ForeignKey(name = "fk_entry_logs_campus_visit")
    )
    private CampusVisit campusVisit;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(name = "entry_timestamp", nullable = false)
    private Instant entryTimestamp;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_method", length = 30, nullable = false)
    private VerificationMethod verificationMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_decision", length = 30, nullable = false)
    private EntryDecision entryDecision;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "watchman_id",
            foreignKey = @ForeignKey(name = "fk_entry_logs_watchman")
    )
    private User watchman;

    @Column(name = "gate", length = 80, nullable = false)
    @Builder.Default
    private String gate = "Main Gate";

    @Column(name = "approval_authority_name", length = 120)
    private String approvalAuthorityName;

    @Column(name = "approver_role", length = 30)
    private String approverRole;

    @Column(name = "approved_arrival_time")
    private LocalTime approvedArrivalTime;

    @Column(name = "actual_entry_time", nullable = false)
    private LocalTime actualEntryTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "timing_status", length = 30)
    private TimingStatus timingStatus;

    @Column(name = "denial_reason", columnDefinition = "TEXT")
    private String denialReason;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}
