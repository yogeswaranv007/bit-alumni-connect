package com.bitconnect.backend.modules.community.dto;

import com.bitconnect.backend.modules.community.entity.CommunityContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Request payload for creating a new community post.
 *
 * <p>Validation rules:<br>
 * - {@code contentType}, {@code title}, and {@code body} are always required.<br>
 * - All opportunity-specific fields (opportunityCompany, opportunityRole, etc.)
 *   are optional regardless of contentType, per the product requirement.</p>
 */
public record CommunityPostCreateRequest(

        @NotNull(message = "Content type is required")
        CommunityContentType contentType,

        @NotBlank(message = "Title is required")
        @Size(max = 300, message = "Title must not exceed 300 characters")
        String title,

        @NotBlank(message = "Body is required")
        String body,

        /** Optional: scope the post to a specific department. Null = global. */
        Integer departmentId,

        /** Optional: comma-separated tags, e.g. "java,internship" */
        @Size(max = 500, message = "Tags must not exceed 500 characters")
        String tags,

        /** Optional: post anonymously (hides author name in UI) */
        boolean anonymous,

        // ─── Opportunity-specific (all optional) ──────────────────────────────

        @Size(max = 150, message = "Company name must not exceed 150 characters")
        String opportunityCompany,

        @Size(max = 150, message = "Role must not exceed 150 characters")
        String opportunityRole,

        @Size(max = 150, message = "Location must not exceed 150 characters")
        String opportunityLocation,

        @Size(max = 60, message = "Opportunity type must not exceed 60 characters")
        String opportunityType,

        LocalDate opportunityDeadline,

        String opportunityApplyUrl,

        @Size(max = 500, message = "Eligibility must not exceed 500 characters")
        String opportunityEligibility,

        @Size(max = 120, message = "Compensation must not exceed 120 characters")
        String opportunityCompensation
) {
}
