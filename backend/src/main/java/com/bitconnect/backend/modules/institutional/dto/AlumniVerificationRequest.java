package com.bitconnect.backend.modules.institutional.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Input for verifying an alumni against the college institutional master data.
 * Register number + name + DOB must all match the college record.
 */
public record AlumniVerificationRequest(

        @NotBlank(message = "Register number is required")
        String registerNumber,

        @NotBlank(message = "Full name is required")
        String name,

        @NotNull(message = "Date of birth is required")
        LocalDate dateOfBirth
) {}
