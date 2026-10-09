package com.bitconnect.backend.modules.student.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.modules.student.dto.StudentPublicVerificationResponse;
import com.bitconnect.backend.modules.student.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public REST controller for Student ID QR verification.
 * Does NOT require authentication.
 * Returns only privacy-safe minimal information (no register number, no raw IDs).
 */
@RestController
@RequestMapping("/api/v1/verify/student")
@RequiredArgsConstructor
@Tag(name = "Student Identity Verification",
     description = "Public endpoint for scanning and validating Digital Student ID QR codes")
public class StudentPublicVerificationController {

    private final StudentService studentService;

    @GetMapping("/{token}")
    @Operation(summary = "Verify Student ID by QR token",
               description = "Validates the QR token and returns privacy-safe student identity confirmation")
    public ResponseEntity<ApiResponse<StudentPublicVerificationResponse>> verifyToken(
            @PathVariable String token) {
        StudentPublicVerificationResponse response = studentService.verifyPublicToken(token);
        if (!response.valid()) {
            return ResponseEntity.ok(ApiResponse.error(response.message(), response));
        }
        return ResponseEntity.ok(ApiResponse.success(response.message(), response));
    }
}
