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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Tracks directional user blocks to prevent unwanted messaging, harassment, or spam.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "user_blocks",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_user_blocks_blocker_blocked", columnNames = {"blocker_id", "blocked_id"})
        },
        indexes = {
                @Index(name = "idx_user_blocks_blocker", columnList = "blocker_id"),
                @Index(name = "idx_user_blocks_blocked", columnList = "blocked_id")
        }
)
public class UserBlock extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "blocker_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_user_blocks_blocker")
    )
    private User blocker;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "blocked_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_user_blocks_blocked")
    )
    private User blocked;

    @Column(name = "reason", length = 255)
    private String reason;
}
