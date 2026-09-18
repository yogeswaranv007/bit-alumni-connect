package com.bitconnect.backend.modules.event.entity;

import com.bitconnect.backend.common.entity.BaseAuditableEntity;
import com.bitconnect.backend.modules.department.entity.Department;
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

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Domain entity representing an institutional activity, department meet, seminar,
 * or faculty meeting. Events may be on-campus, off-campus, or online.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "events",
        indexes = {
                @Index(name = "idx_events_date", columnList = "event_date"),
                @Index(name = "idx_events_location_type", columnList = "location_type"),
                @Index(name = "idx_events_dept", columnList = "department_id")
        }
)
public class Event extends BaseAuditableEntity {

    @Column(name = "title", length = 200, nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", length = 40, nullable = false)
    private EventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "location_type", length = 30, nullable = false)
    @Builder.Default
    private EventLocationType locationType = EventLocationType.ON_CAMPUS;

    @Column(name = "venue", length = 200)
    private String venue;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "department_id",
            foreignKey = @ForeignKey(name = "fk_events_department")
    )
    private Department department;

    @Column(name = "organizer", length = 150)
    private String organizer;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
