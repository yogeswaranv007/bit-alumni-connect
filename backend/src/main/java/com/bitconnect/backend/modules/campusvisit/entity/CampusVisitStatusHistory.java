package com.bitconnect.backend.modules.campusvisit.entity;

import com.bitconnect.backend.common.entity.BaseAuditableEntity;
import com.bitconnect.backend.modules.user.entity.RoleName;
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

import java.util.UUID;

/**
 * Audit history entity recording all approval, scheduling, rejection, and cancellation
 * lifecycle transitions for a campus visit request.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "campus_visit_status_history",
        indexes = {
                @Index(name = "idx_cv_history_visit", columnList = "campus_visit_id")
        }
)
public class CampusVisitStatusHistory extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "campus_visit_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_cv_history_campus_visit")
    )
    private CampusVisit campusVisit;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", length = 30)
    private CampusVisitStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", length = 30, nullable = false)
    private CampusVisitStatus newStatus;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "changed_by")
    private UUID changedBy;

    @Column(name = "changed_by_name", length = 120)
    private String changedByName;

    @Enumerated(EnumType.STRING)
    @Column(name = "changed_by_role", length = 30)
    private RoleName changedByRole;
}
