package com.bitconnect.backend.modules.virtualid.service.impl;

import com.bitconnect.backend.common.exception.BadRequestException;
import com.bitconnect.backend.common.exception.ResourceNotFoundException;
import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.alumni.entity.VerificationStatus;
import com.bitconnect.backend.modules.virtualid.dto.PublicVerificationResponse;
import com.bitconnect.backend.modules.virtualid.dto.VirtualIdCardResponse;
import com.bitconnect.backend.modules.virtualid.entity.QrVerificationToken;
import com.bitconnect.backend.modules.virtualid.entity.TokenStatus;
import com.bitconnect.backend.modules.virtualid.entity.VirtualAlumniId;
import com.bitconnect.backend.modules.virtualid.entity.VirtualIdStatus;
import com.bitconnect.backend.modules.virtualid.repository.QrVerificationTokenRepository;
import com.bitconnect.backend.modules.virtualid.repository.VirtualAlumniIdRepository;
import com.bitconnect.backend.modules.virtualid.service.AlumniIdGeneratorService;
import com.bitconnect.backend.modules.virtualid.service.QrCodeGeneratorService;
import com.bitconnect.backend.modules.virtualid.service.VirtualIdService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VirtualIdServiceImpl implements VirtualIdService {

    private final VirtualAlumniIdRepository virtualAlumniIdRepository;
    private final QrVerificationTokenRepository qrVerificationTokenRepository;
    private final AlumniIdGeneratorService alumniIdGeneratorService;
    private final QrCodeGeneratorService qrCodeGeneratorService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Override
    @Transactional
    public VirtualAlumniId issueVirtualId(AlumniProfile profile) {
        if (virtualAlumniIdRepository.existsByAlumniProfileId(profile.getId())) {
            log.info("Virtual ID already exists for alumni profile ID: {}", profile.getId());
            return virtualAlumniIdRepository.findByAlumniProfileId(profile.getId()).orElseThrow();
        }

        String alumniIdCardNumber = alumniIdGeneratorService.generateNextAlumniId(profile.getBatchEndYear());

        VirtualAlumniId virtualId = VirtualAlumniId.builder()
                .alumniProfile(profile)
                .alumniIdCardNumber(alumniIdCardNumber)
                .status(VirtualIdStatus.ACTIVE)
                .issuedDate(LocalDate.now())
                .build();

        VirtualAlumniId savedVirtualId = virtualAlumniIdRepository.save(virtualId);

        // Issue initial active QR token
        createActiveQrToken(savedVirtualId);
        log.info("Issued Virtual Alumni ID: {} for profile: {}", alumniIdCardNumber, profile.getId());

        return savedVirtualId;
    }

    @Override
    @Transactional(readOnly = true)
    public VirtualIdCardResponse getMyVirtualId(UUID userId) {
        VirtualAlumniId virtualId = virtualAlumniIdRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Virtual Alumni ID not found for this user. Please complete your profile and wait for admin verification."));

        return buildCardResponse(virtualId);
    }

    @Override
    @Transactional(readOnly = true)
    public VirtualIdCardResponse getVirtualIdByAlumniProfileId(UUID alumniProfileId) {
        VirtualAlumniId virtualId = virtualAlumniIdRepository.findByAlumniProfileId(alumniProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Virtual Alumni ID not found for alumni profile ID: " + alumniProfileId));

        return buildCardResponse(virtualId);
    }

    @Override
    @Transactional
    public VirtualIdCardResponse regenerateQrToken(UUID virtualIdId, UUID requestorId) {
        VirtualAlumniId virtualId = virtualAlumniIdRepository.findById(virtualIdId)
                .orElseThrow(() -> new ResourceNotFoundException("Virtual Alumni ID", "id", virtualIdId));

        if (virtualId.getStatus() != VirtualIdStatus.ACTIVE) {
            throw new BadRequestException("Cannot regenerate QR code for inactive Virtual ID with status: " + virtualId.getStatus());
        }

        // Revoke previous active tokens
        qrVerificationTokenRepository.findActiveTokenByVirtualIdId(virtualId.getId(), TokenStatus.ACTIVE)
                .ifPresent(token -> {
                    token.setStatus(TokenStatus.REVOKED);
                    qrVerificationTokenRepository.save(token);
                    log.info("Revoked previous QR token ID: {} for Virtual ID: {}", token.getId(), virtualIdId);
                });

        // Issue new active token
        createActiveQrToken(virtualId);
        log.info("Regenerated new active QR token for Virtual ID: {} by user ID: {}", virtualIdId, requestorId);

        return buildCardResponse(virtualId);
    }

    @Override
    @Transactional
    public VirtualIdCardResponse updateVirtualIdStatus(UUID virtualIdId, VirtualIdStatus status) {
        VirtualAlumniId virtualId = virtualAlumniIdRepository.findById(virtualIdId)
                .orElseThrow(() -> new ResourceNotFoundException("Virtual Alumni ID", "id", virtualIdId));

        virtualId.setStatus(status);

        if (status != VirtualIdStatus.ACTIVE) {
            // Revoke active tokens if suspended or revoked
            qrVerificationTokenRepository.findActiveTokenByVirtualIdId(virtualId.getId(), TokenStatus.ACTIVE)
                    .ifPresent(token -> {
                        token.setStatus(TokenStatus.REVOKED);
                        qrVerificationTokenRepository.save(token);
                    });
        }

        VirtualAlumniId updatedVirtualId = virtualAlumniIdRepository.save(virtualId);
        log.info("Updated Virtual ID: {} status to: {}", virtualIdId, status);

        return buildCardResponse(updatedVirtualId);
    }

    @Override
    @Transactional
    public PublicVerificationResponse verifyPublicToken(String tokenString) {
        if (tokenString == null || tokenString.trim().isEmpty()) {
            return PublicVerificationResponse.invalid("Invalid verification token format");
        }

        Optional<QrVerificationToken> tokenOpt = qrVerificationTokenRepository.findByToken(tokenString.trim());
        if (tokenOpt.isEmpty()) {
            return PublicVerificationResponse.invalid("Invalid QR verification code. This record does not exist in BIT Connect.");
        }

        QrVerificationToken token = tokenOpt.get();

        if (token.getStatus() != TokenStatus.ACTIVE) {
            return PublicVerificationResponse.invalid("This QR verification code has been revoked or expired. Please ask the alumnus to present an updated QR code.");
        }

        VirtualAlumniId virtualId = token.getVirtualAlumniId();
        if (virtualId.getStatus() != VirtualIdStatus.ACTIVE) {
            return PublicVerificationResponse.invalid("This Virtual Alumni ID is currently " + virtualId.getStatus() + ". Identity cannot be verified.");
        }

        AlumniProfile profile = virtualId.getAlumniProfile();
        if (profile.getVerificationStatus() != VerificationStatus.VERIFIED || !profile.getUser().isActive()) {
            return PublicVerificationResponse.invalid("Alumni identity record is not verified or account is inactive.");
        }

        // Audit scan
        token.setScanCount(token.getScanCount() + 1);
        token.setLastScannedAt(Instant.now());
        qrVerificationTokenRepository.save(token);

        log.info("Successful public QR scan verification for Alumni ID: {} (Total scans: {})",
                virtualId.getAlumniIdCardNumber(), token.getScanCount());

        return new PublicVerificationResponse(
                true,
                "✓ VERIFIED ALUMNUS",
                profile.getUser().getFullName(),
                virtualId.getAlumniIdCardNumber(),
                profile.getProfilePhotoUrl(),
                profile.getDepartment().getName(),
                profile.getDepartment().getCode(),
                profile.getDegree(),
                profile.getBatchEndYear(),
                "ACTIVE / VERIFIED",
                virtualId.getIssuedDate(),
                token.getScanCount()
        );
    }

    private QrVerificationToken createActiveQrToken(VirtualAlumniId virtualId) {
        String tokenString = UUID.randomUUID().toString();

        QrVerificationToken token = QrVerificationToken.builder()
                .virtualAlumniId(virtualId)
                .token(tokenString)
                .status(TokenStatus.ACTIVE)
                .scanCount(0)
                .build();

        return qrVerificationTokenRepository.save(token);
    }

    private VirtualIdCardResponse buildCardResponse(VirtualAlumniId virtualId) {
        Optional<QrVerificationToken> tokenOpt = qrVerificationTokenRepository.findActiveTokenByVirtualIdId(
                virtualId.getId(), TokenStatus.ACTIVE);

        String tokenString = tokenOpt.map(QrVerificationToken::getToken).orElse(null);
        String verificationUrl = (tokenString != null)
                ? String.format("%s/verify/%s", frontendBaseUrl.replaceAll("/$", ""), tokenString)
                : null;

        String qrBase64 = (verificationUrl != null)
                ? qrCodeGeneratorService.generateQrCodeBase64(verificationUrl)
                : null;

        return VirtualIdCardResponse.fromEntity(virtualId, qrBase64, verificationUrl, tokenString);
    }
}
