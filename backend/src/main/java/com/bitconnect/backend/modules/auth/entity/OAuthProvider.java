package com.bitconnect.backend.modules.auth.entity;

/**
 * Supported OAuth providers for BIT Connect.
 *
 * GOOGLE — Google OAuth 2.0, available ONLY for ROLE_STUDENT accounts (future implementation).
 *          Must NOT bypass institutional student verification.
 */
public enum OAuthProvider {
    GOOGLE
}
