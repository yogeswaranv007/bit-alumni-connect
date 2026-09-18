package com.bitconnect.backend.modules.staff.repository;

import com.bitconnect.backend.modules.staff.entity.StaffProfile;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StaffProfileRepository extends JpaRepository<StaffProfile, UUID> {

    @EntityGraph(attributePaths = {"user", "department"})
    Optional<StaffProfile> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);

    boolean existsByStaffCode(String staffCode);
}
