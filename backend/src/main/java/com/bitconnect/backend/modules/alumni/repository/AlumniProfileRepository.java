package com.bitconnect.backend.modules.alumni.repository;

import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlumniProfileRepository extends JpaRepository<AlumniProfile, UUID>, JpaSpecificationExecutor<AlumniProfile> {

    @EntityGraph(attributePaths = {"user", "department"})
    Optional<AlumniProfile> findByUserId(UUID userId);

    @EntityGraph(attributePaths = {"user", "department"})
    @Query("SELECT p FROM AlumniProfile p WHERE p.id = :id")
    Optional<AlumniProfile> findByIdWithDetails(@Param("id") UUID id);

    boolean existsByUserId(UUID userId);

    boolean existsByRollNumber(String rollNumber);

    boolean existsByRegisterNumber(String registerNumber);
}
