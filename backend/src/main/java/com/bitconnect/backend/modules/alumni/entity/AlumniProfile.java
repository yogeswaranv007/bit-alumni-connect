package com.bitconnect.backend.modules.alumni.entity;

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
 * Domain entity representing an alumnus profile, academic identity,
 * personal details (matching physical card reference), and verification status.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "alumni_profiles",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_alumni_profiles_user_id", columnNames = "user_id"),
                @UniqueConstraint(name = "uk_alumni_profiles_roll_number", columnNames = "roll_number"),
                @UniqueConstraint(name = "uk_alumni_profiles_register_number", columnNames = "register_number")
        },
        indexes = {
                @Index(name = "idx_alumni_batch_dept", columnList = "batch_end_year, department_id"),
                @Index(name = "idx_alumni_verification_status", columnList = "verification_status")
        }
)
public class AlumniProfile extends BaseAuditableEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_alumni_profiles_user")
    )
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "department_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_alumni_profiles_department")
    )
    private Department department;

    // Academic Information
    @Column(name = "roll_number", length = 30, nullable = false, unique = true)
    private String rollNumber;

    @Column(name = "register_number", length = 30, nullable = false, unique = true)
    private String registerNumber;

    @Column(name = "degree", length = 50, nullable = false)
    private String degree;

    @Column(name = "batch_start_year", nullable = false)
    private Integer batchStartYear;

    @Column(name = "batch_end_year", nullable = false)
    private Integer batchEndYear;

    // Personal Details
    @Column(name = "profile_photo_url", length = 255)
    private String profilePhotoUrl;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "blood_group", length = 10)
    private String bloodGroup;

    @Column(name = "personal_email", length = 120)
    private String personalEmail;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "permanent_address", columnDefinition = "TEXT")
    private String permanentAddress;

    @Column(name = "city", length = 80)
    private String city;

    @Column(name = "state", length = 80)
    private String state;

    @Column(name = "country", length = 80)
    private String country;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    // Professional Information
    @Column(name = "current_company", length = 120)
    private String currentCompany;

    @Column(name = "current_designation", length = 100)
    private String currentDesignation;

    @Column(name = "industry", length = 80)
    private String industry;

    @Column(name = "linkedin_url", length = 255)
    private String linkedinUrl;

    // Verification Workflow State
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", length = 20, nullable = false)
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(name = "verified_by")
    private UUID verifiedBy;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    // Privacy Setting
    @Column(name = "is_directory_visible", nullable = false)
    @Builder.Default
    private boolean isDirectoryVisible = true;
}
