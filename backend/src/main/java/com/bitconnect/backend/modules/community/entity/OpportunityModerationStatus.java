package com.bitconnect.backend.modules.community.entity;

/**
 * Moderation/verification status specifically for Opportunity posts.
 * Clearly distinguishes community-posted opportunities from BIT-verified ones.
 */
public enum OpportunityModerationStatus {
    /** Standard community contribution — not verified by BIT administration */
    COMMUNITY_POSTED,
    /** Explicitly verified as legitimate by BIT administration */
    VERIFIED_BY_BIT,
    /** Flagged as suspicious or fake after moderation review */
    FLAGGED,
    /** Removed from public view by moderator */
    REJECTED
}
