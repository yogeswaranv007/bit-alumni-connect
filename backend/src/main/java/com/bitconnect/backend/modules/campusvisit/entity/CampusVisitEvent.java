package com.bitconnect.backend.modules.campusvisit.entity;

import com.bitconnect.backend.common.entity.BaseAuditableEntity;
import com.bitconnect.backend.modules.event.entity.Event;
import jakarta.persistence.Entity;
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

/**
 * Optional association linking a physical CampusVisit to one or more Events
 * scheduled on that visit date.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "campus_visit_events",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_campus_visit_events_visit_event", columnNames = {"campus_visit_id", "event_id"})
        },
        indexes = {
                @Index(name = "idx_cve_visit", columnList = "campus_visit_id"),
                @Index(name = "idx_cve_event", columnList = "event_id")
        }
)
public class CampusVisitEvent extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "campus_visit_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_cve_campus_visit")
    )
    private CampusVisit campusVisit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "event_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_cve_event")
    )
    private Event event;
}
