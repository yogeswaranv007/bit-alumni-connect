package com.bitconnect.backend.modules.profilechange.repository;

import com.bitconnect.backend.modules.profilechange.entity.ChangeRequestStatus;
import com.bitconnect.backend.modules.profilechange.entity.ProfileChangeRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileChangeRequestRepository extends JpaRepository<ProfileChangeRequest, UUID>, JpaSpecificationExecutor<ProfileChangeRequest> {

    List<ProfileChangeRequest> findByAlumniProfileIdOrderByCreatedAtDesc(UUID alumniProfileId);

    @Query("SELECT r FROM ProfileChangeRequest r WHERE r.alumniProfile.id = :alumniProfileId AND r.status = :status")
    Optional<ProfileChangeRequest> findByAlumniProfileIdAndStatus(
            @Param("alumniProfileId") UUID alumniProfileId,
            @Param("status") ChangeRequestStatus status);

    boolean existsByAlumniProfileIdAndStatus(UUID alumniProfileId, ChangeRequestStatus status);

    @Query("SELECT r FROM ProfileChangeRequest r JOIN FETCH r.alumniProfile p JOIN FETCH p.user JOIN FETCH p.department WHERE r.id = :id")
    Optional<ProfileChangeRequest> findByIdWithDetails(@Param("id") UUID id);

    long countByStatus(ChangeRequestStatus status);

    @Query("SELECT r FROM ProfileChangeRequest r JOIN FETCH r.alumniProfile p JOIN FETCH p.user WHERE r.status = :status ORDER BY r.createdAt DESC")
    List<ProfileChangeRequest> findTop8ByStatusOrderByCreatedAtDesc(@Param("status") ChangeRequestStatus status);
}
