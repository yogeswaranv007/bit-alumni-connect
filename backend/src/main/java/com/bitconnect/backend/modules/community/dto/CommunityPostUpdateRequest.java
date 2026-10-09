package com.bitconnect.backend.modules.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Request payload for updating an existing community post.
 *
 * <p>All fields are optional — only non-null values are applied by the service.
 * Opportunity fields may be updated even if they were originally null.</p>
 */
public record CommunityPostUpdateRequest(

        @Size(max = 300, message = "Title must not exceed 300 characters")
        String title,

        String body,

        @Size(max = 500, message = "Tags must not exceed 500 characters")
        String tags,

        // Opportunity fields (all optional, null = leave unchanged)
        @Size(max = 150) String opportunityCompany,
        @Size(max = 150) String opportunityRole,
        @Size(max = 150) String opportunityLocation,
        @Size(max = 60)  String opportunityType,
        LocalDate opportunityDeadline,
        String opportunityApplyUrl,
        @Size(max = 500) String opportunityEligibility,
        @Size(max = 120) String opportunityCompensation
) {
}
