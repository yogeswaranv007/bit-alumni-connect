package com.bitconnect.backend.modules.institutional.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DEVELOPMENT MOCK — represents one entry in the college's alumni master database.
 *
 * <p><strong>This is NOT the real BIT institutional schema.</strong>
 * It is a development substitute designed to be replaced by the actual
 * college alumni database / API when the real integration is available.
 *
 * <p>In production, replace {@link com.bitconnect.backend.modules.institutional.provider.MockInstitutionalAlumniDataProvider}
 * with a real {@code BITInstitutionalAlumniDataProvider} that calls the actual college API/DB.
 *
 * <p>Schema: {@code college_alumni_records}
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "college_alumni_records",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_car_register_number",  columnNames = "register_number"),
                @UniqueConstraint(name = "uk_car_institutional_id", columnNames = "institutional_record_id"),
                @UniqueConstraint(name = "uk_car_official_email",   columnNames = "official_email")
        }
)
public class CollegeAlumniRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /**
     * Stable external identifier used by the college (e.g. "ALU-000001").
     * Stored in AlumniProfile.institutionalRecordId.
     */
    @Column(name = "institutional_record_id", length = 40, nullable = false, unique = true)
    private String institutionalRecordId;

    @Column(name = "register_number", length = 30, nullable = false, unique = true)
    private String registerNumber;

    @Column(name = "name", length = 120, nullable = false)
    private String name;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(name = "degree", length = 50, nullable = false)
    private String degree;

    /** Department code. Matches BIT Connect Department.code. */
    @Column(name = "department_code", length = 20, nullable = false)
    private String departmentCode;

    /** Year of graduation (e.g. 2022). */
    @Column(name = "graduation_year", nullable = false)
    private Integer graduationYear;

    /** Official institutional email at time of graduation. */
    @Column(name = "official_email", length = 120, unique = true)
    private String officialEmail;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(name = "record_status", length = 20, nullable = false)
    @Builder.Default
    private CollegeRecordStatus recordStatus = CollegeRecordStatus.ACTIVE;

    /**
     * UUID of the BIT Connect User who has already registered using this alumni record.
     * Null = no BIT Connect account yet. Used to prevent duplicates.
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
