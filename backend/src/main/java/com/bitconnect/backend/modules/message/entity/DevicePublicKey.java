package com.bitconnect.backend.modules.message.entity;

import com.bitconnect.backend.common.entity.BaseAuditableEntity;
import com.bitconnect.backend.modules.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Stores a user's client-side cryptographic device public key (e.g. ECDH P-256 in JWK or SPKI format).
 * Private keys are strictly generated on client devices and NEVER sent to or stored on the backend.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "device_public_keys",
        indexes = {
                @Index(name = "idx_device_keys_user_active", columnList = "user_id, is_active")
        }
)
public class DevicePublicKey extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_device_keys_user")
    )
    private User user;

    /**
     * Unique identifier for this client device / browser instance.
     */
    @Column(name = "device_id", length = 64, nullable = false)
    private String deviceId;

    /**
     * Public key representation (e.g., JSON Web Key (JWK) string or Base64 SPKI).
     */
    @Column(name = "public_key_data", nullable = false, columnDefinition = "TEXT")
    private String publicKeyData;

    @Column(name = "algorithm", length = 32, nullable = false)
    @Builder.Default
    private String algorithm = "ECDH-P256";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
