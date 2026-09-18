package com.bitconnect.backend.modules.campusvisit.repository;

import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CampusVisitStatusHistoryRepository extends JpaRepository<CampusVisitStatusHistory, UUID> {

    List<CampusVisitStatusHistory> findByCampusVisitIdOrderByCreatedAtAsc(UUID campusVisitId);
}
