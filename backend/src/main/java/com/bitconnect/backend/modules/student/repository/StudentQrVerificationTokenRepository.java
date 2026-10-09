package com.bitconnect.backend.modules.student.repository;

import com.bitconnect.backend.modules.student.entity.StudentQrVerificationToken;
import com.bitconnect.backend.modules.virtualid.entity.TokenStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface StudentQrVerificationTokenRepository extends JpaRepository<StudentQrVerificationToken, UUID> {

    @Query("SELECT t FROM StudentQrVerificationToken t " +
           "JOIN FETCH t.virtualStudentId v " +
           "JOIN FETCH v.studentProfile sp " +
           "JOIN FETCH sp.user " +
           "JOIN FETCH sp.department " +
           "WHERE t.token = :token AND t.status = 'ACTIVE'")
    Optional<StudentQrVerificationToken> findActiveTokenWithDetails(@Param("token") String token);

    Optional<StudentQrVerificationToken> findFirstByVirtualStudentIdIdAndStatus(
            UUID virtualStudentIdId, TokenStatus status);

    @Modifying
    @Query("UPDATE StudentQrVerificationToken t SET t.status = :status " +
           "WHERE t.virtualStudentId.id = :virtualStudentIdId AND t.status = 'ACTIVE'")
    void revokeActiveTokens(@Param("virtualStudentIdId") UUID virtualStudentIdId,
                            @Param("status") TokenStatus status);
}
