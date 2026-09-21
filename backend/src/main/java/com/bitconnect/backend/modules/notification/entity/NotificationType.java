package com.bitconnect.backend.modules.notification.entity;

/**
 * Standardized domain-wide notification types for BIT Connect.
 */
public enum NotificationType {
    // Alumni Verification
    ALUMNI_VERIFIED,
    ALUMNI_REJECTED,
    NEW_ALUMNI_VERIFICATION,

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

    // Legacy compatibility constants for existing database rows
    ENTRY_VERIFIED,
    VISIT_APPROVED,
    VISIT_REJECTED,
    VISIT_SCHEDULED
}

