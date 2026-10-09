package com.bitconnect.backend.modules.student.repository;

import com.bitconnect.backend.modules.student.entity.RegistrationStatus;
import com.bitconnect.backend.modules.student.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface StudentProfileRepository
        extends JpaRepository<StudentProfile, UUID>,
                JpaSpecificationExecutor<StudentProfile> {

    boolean existsByUserId(UUID userId);

    boolean existsByRegisterNumber(String registerNumber);

    long countByRegistrationStatus(RegistrationStatus registrationStatus);

    @Query("SELECT sp FROM StudentProfile sp " +
           "JOIN FETCH sp.user " +
           "JOIN FETCH sp.department " +
           "WHERE sp.user.id = :userId")
    Optional<StudentProfile> findByUserIdWithDetails(@Param("userId") UUID userId);

    @Query("SELECT sp FROM StudentProfile sp " +
           "JOIN FETCH sp.user " +
           "JOIN FETCH sp.department " +
           "WHERE sp.id = :id")
    Optional<StudentProfile> findByIdWithDetails(@Param("id") UUID id);
}
