package com.bitconnect.backend.modules.department.repository;

import com.bitconnect.backend.modules.department.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Integer> {

    Optional<Department> findByCode(String code);

    boolean existsByCode(String code);

    List<Department> findAllByIsActiveTrueOrderByNameAsc();
}
