package com.bitconnect.backend.modules.auth.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

/**
 * Student registration request.
 *
 * <p>Includes institutional verification fields (registerNumber, name, dateOfBirth)
 * that are checked against the college master database BEFORE account creation.
 * Account creation is refused if institutional verification fails.
 *
 * <p>The login email and password are the BIT Connect account credentials and do not
 * have to match the institutional email — a student may use any personal email to sign in.
 */
public record StudentRegisterRequest(

        /** BIT Connect login email (any email, not necessarily institutional). */
        @NotBlank(message = "Email is required")
        @Email(message = "Please provide a valid email address")
        @Size(max = 120, message = "Email cannot exceed 120 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 64, message = "Password must be between 8 and 64 characters")
        String password,

        // ── Institutional verification fields ─────────────────────────────────

        /** Must match the register number in the college master student record. */
        @NotBlank(message = "Register number is required")
        String registerNumber,

        /** Must match the student's name in the college master student record. */
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 120)
        String fullName,

        /** Must match the DOB in the college master student record. */
        @NotNull(message = "Date of birth is required")
        LocalDate dateOfBirth
) {}
