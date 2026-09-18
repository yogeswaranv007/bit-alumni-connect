package com.bitconnect.backend.modules.event.entity;

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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Domain entity mapping an alumnus to an event participation/invitation record.
 * IMPORTANT: Event registration answers "Is this alumnus participating?",
 * which remains strictly independent of CampusVisit (physical gate entry authorization).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "event_participants",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_event_participants_event_alumni", columnNames = {"event_id", "alumni_profile_id"})
        },
        indexes = {
                @Index(name = "idx_event_part_alumni", columnList = "alumni_profile_id"),
                @Index(name = "idx_event_part_event", columnList = "event_id")
        }
)
public class EventParticipant extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "event_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_event_participants_event")
    )
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "alumni_profile_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_event_participants_alumni")
    )
    private AlumniProfile alumniProfile;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private ParticipantStatus status = ParticipantStatus.REGISTERED;

    @Column(name = "registered_at", nullable = false)
    @Builder.Default
    private Instant registeredAt = Instant.now();
}
