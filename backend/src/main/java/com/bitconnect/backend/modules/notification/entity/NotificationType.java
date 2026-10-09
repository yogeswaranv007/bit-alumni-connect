package com.bitconnect.backend.modules.notification.entity;

/**
 * Standardized domain-wide notification types for BIT Connect.
 */
public enum NotificationType {
    // Alumni Verification
    ALUMNI_VERIFIED,
    ALUMNI_REJECTED,
    NEW_ALUMNI_VERIFICATION,

    // Student Registration Workflow
    NEW_STUDENT_REGISTRATION,    // admin notified when a student submits registration
    STUDENT_REGISTRATION_APPROVED, // student notified when admin approves
    STUDENT_REGISTRATION_REJECTED, // student notified when admin rejects (includes reason)
    STUDENT_DIGITAL_ID_ISSUED,   // student notified when Digital Student ID is auto-generated
    STUDENT_REGISTRATION_RESUBMITTED, // admin notified when rejected student resubmits

    // Profile Changes
    PROFILE_CHANGE_REQUEST,
    PROFILE_CHANGE_APPROVED,
    PROFILE_CHANGE_REJECTED,

    // Digital Alumni ID
    DIGITAL_ID_GENERATED,

    // Campus Visits & Gate Operations
    CAMPUS_VISIT_REQUESTED,
    CAMPUS_VISIT_APPROVED,
    CAMPUS_VISIT_SCHEDULED,
    CAMPUS_VISIT_REJECTED,
    CAMPUS_VISIT_CANCELLED,
    ALUMNI_GATE_ENTRY,
    GATE_ENTRY_DENIED,

    // Events
    EVENT_REGISTRATION_CONFIRMED,
    EVENT_UPDATED,
    EVENT_CANCELLED,

    // System
    SYSTEM_ANNOUNCEMENT,
    SECURITY_ALERT,

    // Community / Forum
    COMMUNITY_POST_REPLIED,      // author's post received a new reply
    COMMUNITY_REPLY_UPVOTED,     // author's reply was upvoted (debounced)
    COMMUNITY_POST_UPVOTED,      // author's post was upvoted (debounced)
    COMMUNITY_REPLY_ACCEPTED,    // reply was accepted as best answer
    COMMUNITY_POST_HIDDEN,       // admin hid a user's post (inform author)

    // Legacy compatibility constants for existing database rows
    ENTRY_VERIFIED,
    VISIT_APPROVED,
    VISIT_REJECTED,
    VISIT_SCHEDULED
}

