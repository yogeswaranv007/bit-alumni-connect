package com.bitconnect.backend.modules.community.entity;

/**
 * The reaction a user can cast on a post or reply.
 * Intentionally kept minimal — single UPVOTE per person per item.
 * Future: can add HELPFUL, INSIGHTFUL, etc.
 */
public enum VoteType {
    UPVOTE
}
