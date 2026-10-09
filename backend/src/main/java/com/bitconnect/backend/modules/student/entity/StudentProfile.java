package com.bitconnect.backend.modules.student.entity;

import com.bitconnect.backend.common.entity.BaseAuditableEntity;
import com.bitconnect.backend.modules.department.entity.Department;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Domain entity representing a BIT student institutional identity.
 *
 * <p>Supports the full admin approval workflow:
 * PENDING (submitted) -> APPROVED (Digital Student ID auto-issued) or
 * REJECTED (student corrects and resubmits -> PENDING).
 *
 * <p>registrationStatus is domain state, NOT a security role.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "student_profiles",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_student_profiles_user_id",        columnNames = "user_id"),
                @UniqueConstraint(name = "uk_student_profiles_register_number", columnNames = "register_number")
        },
        indexes = {
                @Index(name = "idx_student_batch_dept",          columnList = "batch_end_year, department_id"),
                @Index(name = "idx_student_registration_status", columnList = "registration_status")
        }
)
public class StudentProfile extends BaseAuditableEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true,
            foreignKey = @ForeignKey(name = "fk_student_profiles_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_student_profiles_department"))
    private Department department;

    /**
     * Reference to the college's authoritative student master record (e.g. "STU-000123").
     * Populated at registration after institutional verification.
     * Allows future lookup against CollegeStudentRecord without duplicating the full institutional record.
     */
    @Column(name = "institutional_record_id", length = 40)
    private String institutionalRecordId;

    /** Official register number (e.g. 7376232IT286). Immutable after creation. */
    @Column(name = "register_number", length = 30, nullable = false, unique = true)
    private String registerNumber;

    @Column(name = "degree", length = 50, nullable = false)
    private String degree;

    @Column(name = "batch_start_year", nullable = false)
    private Integer batchStartYear;

    @Column(name = "batch_end_year", nullable = false)
    private Integer batchEndYear;

    // Physical-card identity fields ───────────────────────────────────────────

    /** DAY_SCHOLAR (D, red card) or HOSTELER (H, blue card). */
    @Enumerated(EnumType.STRING)
    @Column(name = "student_type", length = 20)
    private StudentType studentType;

    /** Blood group as on physical ID back, e.g. "O+ve". */
    @Column(name = "blood_group", length = 10)
    private String bloodGroup;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    /** Full postal address as on physical ID back. */
    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "student_phone", length = 20)
    private String studentPhone;

    @Column(name = "parent_phone", length = 20)
    private String parentPhone;

    /**
     * Official BIT institutional email (e.g. yogeswaran.it23@bitsathy.ac.in).
     * Distinct from the account login email.
     */
    @Column(name = "official_email", length = 120)
    private String officialEmail;

    @Column(name = "profile_photo_url", columnDefinition = "TEXT")
    private String profilePhotoUrl;

    // Registration workflow ────────────────────────────────────────────────────

    /**
     * Institutional registration status: PENDING / APPROVED / REJECTED.
     * Domain state only — never use as a security role.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "registration_status", length = 20, nullable = false)
    @Builder.Default
    private RegistrationStatus registrationStatus = RegistrationStatus.PENDING;

    /** Admin user ID who last approved or rejected this registration. */
    @Column(name = "actioned_by")
    private UUID actionedBy;

    @Column(name = "actioned_at")
    private Instant actionedAt;

    /**
     * Reason written by admin when rejecting.
     * Student reads this to understand what corrections are needed.
     * Cleared when admin approves.
     */
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
}
