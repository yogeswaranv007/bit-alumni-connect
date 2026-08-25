package com.bitconnect.backend.modules.virtualid.service;

import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.virtualid.dto.PublicVerificationResponse;
import com.bitconnect.backend.modules.virtualid.dto.VirtualIdCardResponse;
import com.bitconnect.backend.modules.virtualid.entity.VirtualAlumniId;
import com.bitconnect.backend.modules.virtualid.entity.VirtualIdStatus;

import java.util.UUID;

/**
 * Service managing Virtual Alumni ID issuance, digital card generation,
 * QR token rotation, status administration, and public zero-PII identity verification.
 */
public interface VirtualIdService {

    VirtualAlumniId issueVirtualId(AlumniProfile profile);

    VirtualIdCardResponse getMyVirtualId(UUID userId);

    VirtualIdCardResponse getVirtualIdByAlumniProfileId(UUID alumniProfileId);

    VirtualIdCardResponse regenerateQrToken(UUID virtualIdId, UUID requestorId);

    VirtualIdCardResponse updateVirtualIdStatus(UUID virtualIdId, VirtualIdStatus status);

    PublicVerificationResponse verifyPublicToken(String token);
}
