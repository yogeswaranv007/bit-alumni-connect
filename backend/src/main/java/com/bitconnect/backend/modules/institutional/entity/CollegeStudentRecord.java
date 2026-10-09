package com.bitconnect.backend.modules.institutional.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DEVELOPMENT MOCK — represents one entry in the college's current-student master database.
 *
 * <p><strong>This is NOT the real BIT institutional schema.</strong>
 * It is a development substitute designed to be replaced by the actual
 * college database / API when the real integration is available.
 *
 * <p>In production, replace {@link com.bitconnect.backend.modules.institutional.provider.MockInstitutionalStudentDataProvider}
 * with a real {@code BITInstitutionalStudentDataProvider} that calls the actual college API/DB.
 * No other BIT Connect code needs to change.
 *
 * <p>Schema: {@code college_student_records}
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "college_student_records",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_csr_register_number",       columnNames = "register_number"),
                @UniqueConstraint(name = "uk_csr_institutional_id",      columnNames = "institutional_record_id"),
                @UniqueConstraint(name = "uk_csr_official_email",        columnNames = "official_email")
        }
)
public class CollegeStudentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /**
     * Stable external identifier used by the college (e.g. "STU-000123").
     * This is what BIT Connect stores in StudentProfile.institutionalRecordId
     * so it can be traced back to the authoritative record without duplicating the full record.
     */
    @Column(name = "institutional_record_id", length = 40, nullable = false, unique = true)
    private String institutionalRecordId;

    /** Official register number (e.g. 7376232IT286). Primary matching key. */
    @Column(name = "register_number", length = 30, nullable = false, unique = true)
    private String registerNumber;

    /** Student's full name as in college records. */
    @Column(name = "name", length = 120, nullable = false)
    private String name;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    /** Degree programme (e.g. "B.Tech"). */
    @Column(name = "degree", length = 50, nullable = false)
    private String degree;

    /** Department code (e.g. "IT", "CSE"). Matches BIT Connect Department.code. */
    @Column(name = "department_code", length = 20, nullable = false)
    private String departmentCode;

    @Column(name = "batch_start_year", nullable = false)
    private Integer batchStartYear;

    @Column(name = "batch_end_year", nullable = false)
    private Integer batchEndYear;

    /** DAY_SCHOLAR or HOSTELER. */
    @Enumerated(EnumType.STRING)
    @Column(name = "student_type", length = 20, nullable = false)
    private StudentRecordType studentType;

    /** Official institutional email (e.g. yogeswaran.it23@bitsathy.ac.in). */
    @Column(name = "official_email", length = 120, unique = true)
    private String officialEmail;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "parent_phone", length = 20)
    private String parentPhone;

    @Column(name = "blood_group", length = 10)
    private String bloodGroup;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    /** ACTIVE = currently enrolled; INACTIVE = no longer enrolled. */
    @Enumerated(EnumType.STRING)
    @Column(name = "record_status", length = 20, nullable = false)
    @Builder.Default
    private CollegeRecordStatus recordStatus = CollegeRecordStatus.ACTIVE;

    /**
     * UUID of the BIT Connect User who has already registered using this institutional record.
     * Null if no BIT Connect account has been created yet.
     * Used to prevent duplicate account creation.
     */
    @Column(name = "linked_bit_connect_user_id")
    private UUID linkedBitConnectUserId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
