package com.bitconnect.backend.modules.institutional.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Input for verifying a student against the college institutional master data.
 * Register number is the primary key; name + DOB are additional verification factors.
 * The register number alone is never sufficient — additional fields must match.
 */
public record StudentVerificationRequest(

        @NotBlank(message = "Register number is required")
        String registerNumber,

        @NotBlank(message = "Full name is required")
        String name,

        @NotNull(message = "Date of birth is required")
        LocalDate dateOfBirth
) {}
