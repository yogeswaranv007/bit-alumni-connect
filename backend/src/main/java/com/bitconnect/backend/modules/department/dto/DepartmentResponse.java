package com.bitconnect.backend.modules.department.dto;

import com.bitconnect.backend.modules.department.entity.Department;

/**
 * Response DTO representing an academic department.
 */
public record DepartmentResponse(
        Integer id,
        String code,
        String name,
        String description,
        boolean isActive
) {
    public static DepartmentResponse fromEntity(Department department) {
        return new DepartmentResponse(
                department.getId(),
                department.getCode(),
                department.getName(),
                department.getDescription(),
                department.isActive()
        );
    }
}
