package com.bitconnect.backend.modules.department.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.modules.department.dto.DepartmentResponse;
import com.bitconnect.backend.modules.department.service.DepartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller providing department lookup endpoints for alumni registration,
 * profiles, and campus visits.
 */
@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
@Tag(name = "Departments", description = "Endpoints for retrieving academic departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    @Operation(summary = "Get all active departments", description = "Returns a list of all active academic departments in alphabetical order")
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> getAllActiveDepartments() {
        List<DepartmentResponse> departments = departmentService.getAllActiveDepartments();
        return ResponseEntity.ok(ApiResponse.success(departments));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get department by ID", description = "Returns details for a specific academic department")
    public ResponseEntity<ApiResponse<DepartmentResponse>> getDepartmentById(@PathVariable Integer id) {
        DepartmentResponse department = departmentService.getDepartmentById(id);
        return ResponseEntity.ok(ApiResponse.success(department));
    }
}
