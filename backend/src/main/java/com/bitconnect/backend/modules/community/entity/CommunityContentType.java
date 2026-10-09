package com.bitconnect.backend.modules.community.entity;

/**
 * Defines the type of community content posted in the BIT Connect Community Forum.
 */
public enum CommunityContentType {
    /** Student doubts, technical queries, interview questions — answered with accepted resolution */
    QUESTION,
    /** General posts: achievements, event recaps, project showcases, resources */
    POST,
    /** Flexible internship/job/referral sharing — only title + body required */
    OPPORTUNITY,
    /** Open-ended peer or faculty conversations */
    DISCUSSION
}
