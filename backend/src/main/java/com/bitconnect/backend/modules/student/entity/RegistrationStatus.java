package com.bitconnect.backend.modules.student.entity;

/**
 * Lifecycle status for a student's institutional registration/verification.
 *
 * <p>This is domain state, NOT a security role. Do not create ROLE_PENDING_STUDENT etc.
 * Use ROLE_STUDENT on the User entity for platform access; use this for institutional approval.
 *
 * <ul>
 *   <li>PENDING  � submitted, awaiting admin review (initial state)</li>
 *   <li>APPROVED � admin verified the institutional identity; Digital Student ID is issued</li>
 *   <li>REJECTED � admin rejected with a reason; student may correct and resubmit</li>
 * </ul>
 */
public enum RegistrationStatus {
    PENDING,
    APPROVED,
    REJECTED
}
