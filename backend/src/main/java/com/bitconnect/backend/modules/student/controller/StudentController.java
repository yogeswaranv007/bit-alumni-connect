package com.bitconnect.backend.modules.student.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.modules.student.dto.StudentIdCardResponse;
import com.bitconnect.backend.modules.student.dto.StudentProfileCreateRequest;
import com.bitconnect.backend.modules.student.dto.StudentProfileResponse;
import com.bitconnect.backend.modules.student.dto.StudentProfileUpdateRequest;
import com.bitconnect.backend.modules.student.service.StudentService;
import com.bitconnect.backend.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for student-facing profile and digital ID operations.
 *
 * <p>All endpoints require ROLE_STUDENT. The authenticated user identity is
 * always derived from SecurityUtils — never from request payloads.
 *
 * <p>Digital Student ID is issued automatically on admin approval.
 * Students cannot manually trigger ID generation (backend enforces this).
 */
@RestController
@RequestMapping("/api/v1/student")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Student", description = "Student profile and digital ID endpoints")
public class StudentController {

    private final StudentService studentService;

    // ── Profile ───────────────────────────────────────────────────────────────

    @PostMapping("/profile")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Create student profile",
               description = "Creates the student's institutional identity profile in PENDING status")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> createProfile(
            @Valid @RequestBody StudentProfileCreateRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        StudentProfileResponse response = studentService.createProfile(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student registration submitted. Pending admin review.", response));
    }

    @GetMapping("/profile/me")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get my student profile")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> getMyProfile() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(studentService.getMyProfile(userId)));
    }

    @PutMapping("/profile/me")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Update my student profile",
               description = "Allowed while PENDING or REJECTED. Updating a REJECTED profile resubmits it (status -> PENDING). " +
                             "APPROVED profile: only profilePhotoUrl may be updated.")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> updateMyProfile(
            @Valid @RequestBody StudentProfileUpdateRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                "Student profile updated successfully", studentService.updateMyProfile(userId, request)));
    }

    // ── Digital ID ────────────────────────────────────────────────────────────

    @GetMapping("/virtual-id/me")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get my Digital Student ID card",
               description = "Only available after admin approval. Returns null/error if not yet approved.")
    public ResponseEntity<ApiResponse<StudentIdCardResponse>> getMyDigitalId() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(studentService.getMyDigitalId(userId)));
    }

    @PostMapping("/virtual-id/regenerate-qr")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Regenerate QR verification token",
               description = "Revokes current active QR token and issues a new one. Permanent card number unchanged.")
    public ResponseEntity<ApiResponse<StudentIdCardResponse>> regenerateQrToken() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                "QR token regenerated successfully", studentService.regenerateQrToken(userId)));
    }
}
