package com.bitconnect.backend.modules.auth.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

/**
 * Alumni registration request with institutional verification fields.
 *
 * <p>The register number, name, and date of birth are checked against the
 * college alumni master database BEFORE account creation.
 */
public record AlumniRegisterRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Please provide a valid email address")
        @Size(max = 120, message = "Email cannot exceed 120 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 64, message = "Password must be between 8 and 64 characters")
        String password,

        // ── Institutional verification fields ─────────────────────────────────

        @NotBlank(message = "Register number is required")
        String registerNumber,

        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 120)
        String fullName,

        @NotNull(message = "Date of birth is required")
        LocalDate dateOfBirth
) {}
