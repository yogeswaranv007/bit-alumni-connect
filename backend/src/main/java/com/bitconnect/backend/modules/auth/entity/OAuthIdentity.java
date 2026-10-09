package com.bitconnect.backend.modules.auth.entity;

import com.bitconnect.backend.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * OAuth identity mapping — associates an external OAuth provider identity with a BIT Connect User account.
 *
 * <p><strong>Architecture</strong>: A BIT Connect User can have multiple OAuth identities
 * (e.g. a student could later link their institutional Google account). An OAuth identity
 * can only be linked to ONE BIT Connect User to prevent account sharing.
 *
 * <p><strong>Google OAuth (Students Only — Future)</strong>:
 * Google authentication will ONLY be available for ROLE_STUDENT accounts.
 * The flow will be:
 * <ol>
 *   <li>Student institutional record verified → BIT Connect account exists</li>
 *   <li>Student links institutional Google account → OAuthIdentity created</li>
 *   <li>Future Google login → OAuthIdentity.providerSubject resolved → existing Student account returned</li>
 * </ol>
 * Google OAuth MUST NOT bypass institutional verification (step 1 is always required first).
 *
 * <p>To implement Google OAuth: create a {@code GoogleOAuthService} that:
 * <ol>
 *   <li>Validates the Google ID token / authorization code</li>
 *   <li>Looks up OAuthIdentity by (provider=GOOGLE, providerSubject=sub claim)</li>
 *   <li>If found → load associated User and issue JWT</li>
 *   <li>If NOT found and student is already authenticated → create OAuthIdentity linking to their existing account</li>
 *   <li>If NOT found and no session → redirect to institutional verification first</li>
 * </ol>
 *
 * <p>Schema: {@code oauth_identities}
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "oauth_identities",
        uniqueConstraints = {
                // One provider account cannot be linked to multiple BIT Connect users
                @UniqueConstraint(
                        name = "uk_oauth_identities_provider_subject",
                        columnNames = {"provider", "provider_subject"}
                )
        },
        indexes = {
                @Index(name = "idx_oauth_identities_user_id", columnList = "user_id")
        }
)
public class OAuthIdentity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /** The BIT Connect user this OAuth identity is associated with. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_oauth_identities_user"))
    private User user;

    /** OAuth provider name, e.g. "GOOGLE". Stored as uppercase string. */
    @Enumerated(EnumType.STRING)
    @Column(name = "provider", length = 30, nullable = false)
    private OAuthProvider provider;

    /**
     * The unique subject identifier from the OAuth provider (e.g. Google's "sub" claim).
     * This is the stable, provider-assigned identifier for the external account.
     */
    @Column(name = "provider_subject", length = 255, nullable = false)
    private String providerSubject;

    /** The email address from the OAuth provider at the time of linking. */
    @Column(name = "provider_email", length = 120)
    private String providerEmail;

    /** Display name from the OAuth provider at time of linking. */
    @Column(name = "provider_display_name", length = 120)
    private String providerDisplayName;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
