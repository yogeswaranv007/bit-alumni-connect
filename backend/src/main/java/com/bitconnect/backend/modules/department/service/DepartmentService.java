package com.bitconnect.backend.modules.department.service;

import com.bitconnect.backend.modules.department.dto.DepartmentResponse;

import java.util.List;

/**
 * Service handling academic department lookup operations.
 */
public interface DepartmentService {

    List<DepartmentResponse> getAllActiveDepartments();

    DepartmentResponse getDepartmentById(Integer id);
}
