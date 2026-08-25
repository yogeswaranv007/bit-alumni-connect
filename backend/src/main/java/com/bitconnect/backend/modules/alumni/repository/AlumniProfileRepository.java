package com.bitconnect.backend.modules.alumni.repository;

import com.bitconnect.backend.modules.alumni.dto.AlumniDirectoryResponse;
import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.alumni.entity.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlumniProfileRepository extends JpaRepository<AlumniProfile, UUID> {

    @EntityGraph(attributePaths = {"user", "department"})
    Optional<AlumniProfile> findByUserId(UUID userId);

    @EntityGraph(attributePaths = {"user", "department"})
    @Query("SELECT p FROM AlumniProfile p WHERE p.id = :id")
    Optional<AlumniProfile> findByIdWithDetails(@Param("id") UUID id);

    boolean existsByUserId(UUID userId);

    boolean existsByRollNumber(String rollNumber);

    boolean existsByRegisterNumber(String registerNumber);

    /**
     * Privacy-safe directory projection query fetching only public-safe fields
     * for active, verified alumni who have not opted out of the directory.
     */
    @Query("""
        SELECT new com.bitconnect.backend.modules.alumni.dto.AlumniDirectoryResponse(
            p.id,
            u.fullName,
            p.profilePhotoUrl,
            d.name,
            d.code,
            p.degree,
            p.batchEndYear,
            p.currentCompany,
            p.currentDesignation,
            p.industry,
            p.linkedinUrl,
            p.city,
            p.country
        )
        FROM AlumniProfile p
        JOIN p.user u
        JOIN p.department d
        WHERE p.verificationStatus = com.bitconnect.backend.modules.alumni.entity.VerificationStatus.VERIFIED
          AND p.isDirectoryVisible = true
          AND u.isActive = true
          AND (:departmentId IS NULL OR d.id = :departmentId)
          AND (:batchEndYear IS NULL OR p.batchEndYear = :batchEndYear)
          AND (:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(p.currentCompany) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(p.currentDesignation) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(p.city) LIKE LOWER(CONCAT('%', :search, '%')))
    """)
    Page<AlumniDirectoryResponse> searchDirectory(
            @Param("search") String search,
            @Param("departmentId") Integer departmentId,
            @Param("batchEndYear") Integer batchEndYear,
            Pageable pageable
    );

    /**
     * Admin query retrieving detailed alumni profiles filterable by status, department, and search terms.
     */
    @EntityGraph(attributePaths = {"user", "department"})
    @Query("""
        SELECT p FROM AlumniProfile p
        JOIN p.user u
        JOIN p.department d
        WHERE (:status IS NULL OR p.verificationStatus = :status)
          AND (:departmentId IS NULL OR d.id = :departmentId)
          AND (:batchEndYear IS NULL OR p.batchEndYear = :batchEndYear)
          AND (:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(p.rollNumber) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(p.registerNumber) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))
    """)
    Page<AlumniProfile> searchAdminProfiles(
            @Param("status") VerificationStatus status,
            @Param("departmentId") Integer departmentId,
            @Param("batchEndYear") Integer batchEndYear,
            @Param("search") String search,
            Pageable pageable
    );
}
