package com.bitconnect.backend.modules.staff.entity;

import com.bitconnect.backend.common.entity.BaseAuditableEntity;
import com.bitconnect.backend.modules.department.entity.Department;
import com.bitconnect.backend.modules.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Domain entity representing an academic staff or faculty profile,
 * establishing departmental affiliation for scoped approvals.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "staff_profiles",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_staff_profiles_user_id", columnNames = "user_id"),
                @UniqueConstraint(name = "uk_staff_profiles_staff_code", columnNames = "staff_code")
        },
        indexes = {
                @Index(name = "idx_staff_dept", columnList = "department_id")
        }
)
public class StaffProfile extends BaseAuditableEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_staff_profiles_user")
    )
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "department_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_staff_profiles_department")
    )
    private Department department;

    @Column(name = "staff_code", length = 30, nullable = false, unique = true)
    private String staffCode;

    @Column(name = "designation", length = 100, nullable = false)
    private String designation;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;
}
