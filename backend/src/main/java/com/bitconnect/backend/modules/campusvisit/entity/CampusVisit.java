package com.bitconnect.backend.modules.campusvisit.entity;

import com.bitconnect.backend.common.entity.BaseAuditableEntity;
import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.department.entity.Department;
import com.bitconnect.backend.modules.user.entity.RoleName;
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
 * Domain entity representing a physical campus entry authorization request
 * for a specific calendar date.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "campus_visits",
        indexes = {
                @Index(name = "idx_campus_visit_date", columnList = "visit_date"),
                @Index(name = "idx_campus_visit_status", columnList = "status"),
                @Index(name = "idx_campus_visit_alumni", columnList = "alumni_profile_id"),
                @Index(name = "idx_campus_visit_dept", columnList = "department_id")
        }
)
public class CampusVisit extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "alumni_profile_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_campus_visits_alumni")
    )
    private AlumniProfile alumniProfile;

    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;

    @Column(name = "preferred_arrival_time", nullable = false)
    private LocalTime preferredArrivalTime;

    @Column(name = "approved_arrival_time")
    private LocalTime approvedArrivalTime;

    @Column(name = "purpose", columnDefinition = "TEXT", nullable = false)
    private String purpose;

    @Enumerated(EnumType.STRING)
    @Column(name = "visit_type", length = 40, nullable = false)
    @Builder.Default
    private CampusVisitType visitType = CampusVisitType.PERSONAL_VISIT;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private CampusVisitStatus status = CampusVisitStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "department_id",
            foreignKey = @ForeignKey(name = "fk_campus_visits_department")
    )
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "assigned_faculty_id",
            foreignKey = @ForeignKey(name = "fk_campus_visits_faculty")
    )
    private User assignedFaculty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "approved_by_id",
            foreignKey = @ForeignKey(name = "fk_campus_visits_approver")
    )
    private User approvedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "approver_role", length = 30)
    private RoleName approverRole;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "meeting_location", length = 200)
    private String meetingLocation;

    @Column(name = "contact_person", length = 120)
    private String contactPerson;

    @Column(name = "admin_comment", columnDefinition = "TEXT")
    private String adminComment;

    @Column(name = "admin_remarks", columnDefinition = "TEXT")
    private String adminRemarks;
}
