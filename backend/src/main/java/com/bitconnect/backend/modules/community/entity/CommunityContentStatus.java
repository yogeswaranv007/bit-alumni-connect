package com.bitconnect.backend.modules.community.entity;

/**
 * Lifecycle status for any community content item.
 * Separates moderation state from question-specific solved state.
 */
public enum CommunityContentStatus {
    /** Publicly visible and active */
    ACTIVE,
    /** Content has been edited by author (still visible) */
    EDITED,
    /** Hidden by admin moderation — not displayed to regular users */
    HIDDEN,
    /** Soft-deleted — not displayed but preserved for audit/moderation */
    DELETED
}
