package com.bitconnect.backend.modules.student.repository;

import com.bitconnect.backend.modules.student.entity.VirtualStudentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface VirtualStudentIdRepository extends JpaRepository<VirtualStudentId, UUID> {

    boolean existsByStudentProfileId(UUID studentProfileId);

    @Query("SELECT v FROM VirtualStudentId v " +
           "JOIN FETCH v.studentProfile sp " +
           "JOIN FETCH sp.user " +
           "JOIN FETCH sp.department " +
           "WHERE sp.user.id = :userId")
    Optional<VirtualStudentId> findByStudentProfileUserIdWithDetails(@Param("userId") UUID userId);

    @Query("SELECT v FROM VirtualStudentId v " +
           "JOIN FETCH v.studentProfile sp " +
           "JOIN FETCH sp.user " +
           "JOIN FETCH sp.department " +
           "WHERE sp.id = :profileId")
    Optional<VirtualStudentId> findByStudentProfileIdWithDetails(@Param("profileId") UUID profileId);
}
