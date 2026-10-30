package com.bitconnect.backend.modules.message.repository;

import com.bitconnect.backend.modules.message.entity.DevicePublicKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DevicePublicKeyRepository extends JpaRepository<DevicePublicKey, UUID> {

    Optional<DevicePublicKey> findByUserIdAndDeviceIdAndActiveTrue(UUID userId, String deviceId);

    List<DevicePublicKey> findByUserIdAndActiveTrue(UUID userId);

    @Modifying
    @Query("UPDATE DevicePublicKey d SET d.active = false WHERE d.user.id = :userId AND d.deviceId = :deviceId")
    void revokeDeviceKey(@Param("userId") UUID userId, @Param("deviceId") String deviceId);

    @Modifying
    @Query("UPDATE DevicePublicKey d SET d.active = false WHERE d.user.id = :userId")
    void revokeAllUserKeys(@Param("userId") UUID userId);
}
