package com.bitconnect.backend.modules.community.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

/**
 * Request payload for creating a reply to a post or to another reply.
 */
public record CommunityReplyCreateRequest(

        @NotBlank(message = "Reply body is required")
        String body,

        /**
         * When null: top-level reply to the post.
         * When set: a thread reply under an existing reply.
         * Service enforces one level of nesting only.
         */
        UUID parentReplyId,

        boolean anonymous
) {
}
