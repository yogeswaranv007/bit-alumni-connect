package com.bitconnect.backend.modules.student.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.student.dto.StudentProfileResponse;
import com.bitconnect.backend.modules.student.dto.StudentRejectRequest;
import com.bitconnect.backend.modules.student.entity.RegistrationStatus;
import com.bitconnect.backend.modules.student.service.StudentService;
import com.bitconnect.backend.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for administrative management of student registrations.
 * Endpoint base: /api/v1/admin/student-registrations
 *
 * <p>Kept COMPLETELY SEPARATE from AdminAlumniController (/api/v1/admin/alumni).
 * Student and alumni registration queues must never be mixed.
 */
@RestController
@RequestMapping("/api/v1/admin/student-registrations")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin Student Registrations",
     description = "Admin endpoints for reviewing, approving, and rejecting student registrations")
public class AdminStudentController {

    private final StudentService studentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "List student registrations",
               description = "Paginated list filterable by status, department, batch, and keyword search")
    public ResponseEntity<ApiResponse<PagedResponse<StudentProfileResponse>>> listStudentRegistrations(
            @RequestParam(required = false) RegistrationStatus status,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) Integer batchEndYear,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "10")  int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        Sort sort = sortDirection.equalsIgnoreCase("ASC")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), sort);

        PagedResponse<StudentProfileResponse> result =
                studentService.searchAdminStudentProfiles(status, departmentId, batchEndYear, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get full student profile by ID")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(studentService.getStudentProfileById(id)));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve a student registration",
               description = "Marks the profile APPROVED and auto-issues the Digital Student ID. Notifies the student.")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> approveRegistration(@PathVariable UUID id) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        StudentProfileResponse result = studentService.approveRegistration(id, adminId);
        return ResponseEntity.ok(ApiResponse.success("Student registration approved. Digital Student ID issued.", result));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject a student registration",
               description = "Rejects with a mandatory reason. Student may correct and resubmit.")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> rejectRegistration(
            @PathVariable UUID id,
            @Valid @RequestBody StudentRejectRequest request) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        StudentProfileResponse result = studentService.rejectRegistration(id, adminId, request);
        return ResponseEntity.ok(ApiResponse.success("Student registration rejected.", result));
    }
}
