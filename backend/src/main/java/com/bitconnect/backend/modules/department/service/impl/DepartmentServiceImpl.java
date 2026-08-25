package com.bitconnect.backend.modules.department.service.impl;

import com.bitconnect.backend.common.exception.ResourceNotFoundException;
import com.bitconnect.backend.modules.department.dto.DepartmentResponse;
import com.bitconnect.backend.modules.department.entity.Department;
import com.bitconnect.backend.modules.department.repository.DepartmentRepository;
import com.bitconnect.backend.modules.department.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllActiveDepartments() {
        return departmentRepository.findAllByIsActiveTrueOrderByNameAsc().stream()
                .map(DepartmentResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentResponse getDepartmentById(Integer id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));
        return DepartmentResponse.fromEntity(department);
    }
}
