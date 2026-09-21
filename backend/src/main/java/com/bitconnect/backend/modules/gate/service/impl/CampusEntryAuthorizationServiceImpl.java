package com.bitconnect.backend.modules.gate.service.impl;

import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.alumni.entity.VerificationStatus;
import com.bitconnect.backend.modules.alumni.repository.AlumniProfileRepository;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitAlumniSummary;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisit;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitStatus;
import com.bitconnect.backend.modules.campusvisit.repository.CampusVisitRepository;
import com.bitconnect.backend.modules.event.entity.Event;
import com.bitconnect.backend.modules.event.service.EventService;
import com.bitconnect.backend.modules.gate.dto.TodayActivityDto;
import com.bitconnect.backend.modules.gate.dto.WatchmanVerificationResponse;
import com.bitconnect.backend.modules.gate.entity.EntryDecision;
import com.bitconnect.backend.modules.gate.entity.TimingStatus;
import com.bitconnect.backend.modules.gate.entity.VerificationMethod;
import com.bitconnect.backend.modules.gate.service.CampusEntryAuthorizationService;
import com.bitconnect.backend.modules.rfid.entity.RfidIdentityMapping;
import com.bitconnect.backend.modules.rfid.entity.RfidStatus;
import com.bitconnect.backend.modules.rfid.repository.RfidIdentityMappingRepository;
import com.bitconnect.backend.modules.virtualid.entity.QrVerificationToken;
import com.bitconnect.backend.modules.virtualid.entity.TokenStatus;
import com.bitconnect.backend.modules.virtualid.entity.VirtualAlumniId;
import com.bitconnect.backend.modules.virtualid.entity.VirtualIdStatus;
import com.bitconnect.backend.modules.virtualid.repository.QrVerificationTokenRepository;
import com.bitconnect.backend.modules.virtualid.repository.VirtualAlumniIdRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class CampusEntryAuthorizationServiceImpl implements CampusEntryAuthorizationService {

    private final QrVerificationTokenRepository qrTokenRepository;
    private final RfidIdentityMappingRepository rfidRepository;
    private final VirtualAlumniIdRepository virtualIdRepository;
    private final AlumniProfileRepository alumniProfileRepository;
    private final CampusVisitRepository campusVisitRepository;
    private final EventService eventService;

    // Real-time in-memory checkin queue for Gate QR Scans
    private final Map<String, GateCheckinRecord> activeGateCheckins = new ConcurrentHashMap<>();

    public record GateCheckinRecord(WatchmanVerificationResponse response, Instant timestamp, String gate) {}

    @Override
    @Transactional(readOnly = true)
    public WatchmanVerificationResponse registerGateCheckin(UUID userId, String gate) {
        String gateKey = (gate != null && !gate.isBlank()) ? gate.trim() : "Main Gate";
        AlumniProfile profile = alumniProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new com.bitconnect.backend.common.exception.ResourceNotFoundException("Alumni profile not found for user: " + userId));

        String checkinId = UUID.randomUUID().toString();
        WatchmanVerificationResponse verification = evaluateAuthorization(profile, VerificationMethod.DIGITAL_ID_QR).withCheckinId(checkinId);
        GateCheckinRecord record = new GateCheckinRecord(verification, Instant.now(), gateKey);
        activeGateCheckins.put(gateKey.toLowerCase(), record);
        // Also associate with standard main gate fallback
        activeGateCheckins.put("main gate", record);
        log.info("Live Gate QR check-in registered (checkinId: {}) for alumnus: {} at gate: {}", checkinId, profile.getUser() != null ? profile.getUser().getFullName() : profile.getId(), gateKey);
        return verification;
    }

    @Override
    public WatchmanVerificationResponse pollLatestGateCheckin(String gate) {
        String gateKey = (gate != null && !gate.isBlank()) ? gate.trim().toLowerCase() : "main gate";
        GateCheckinRecord record = activeGateCheckins.get(gateKey);
        if (record == null) {
            record = activeGateCheckins.get("main gate");
        }
        if (record != null) {
            long ageSeconds = Duration.between(record.timestamp(), Instant.now()).getSeconds();
            if (ageSeconds < 45) {
                return record.response();
            }
        }
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public WatchmanVerificationResponse verifyByQrToken(String qrToken) {
        if (qrToken == null || qrToken.isBlank()) {
            return createDenialResponse(VerificationMethod.DIGITAL_ID_QR, null, "QR token is required");
        }

        String cleaned = qrToken.trim();

        // 1. Try URL extraction
        if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
            if (cleaned.contains("token=")) {
                cleaned = cleaned.substring(cleaned.indexOf("token=") + 6);
                if (cleaned.contains("&")) cleaned = cleaned.substring(0, cleaned.indexOf("&"));
            } else if (cleaned.contains("visitId=")) {
                cleaned = cleaned.substring(cleaned.indexOf("visitId=") + 8);
                if (cleaned.contains("&")) cleaned = cleaned.substring(0, cleaned.indexOf("&"));
            } else if (cleaned.contains("alumniId=")) {
                cleaned = cleaned.substring(cleaned.indexOf("alumniId=") + 9);
                if (cleaned.contains("&")) cleaned = cleaned.substring(0, cleaned.indexOf("&"));
            } else if (cleaned.contains("regNo=")) {
                cleaned = cleaned.substring(cleaned.indexOf("regNo=") + 6);
                if (cleaned.contains("&")) cleaned = cleaned.substring(0, cleaned.indexOf("&"));
            } else if (cleaned.contains("/verify/")) {
                cleaned = cleaned.substring(cleaned.indexOf("/verify/") + 8);
                if (cleaned.contains("?")) cleaned = cleaned.substring(0, cleaned.indexOf("?"));
                if (cleaned.contains("/")) cleaned = cleaned.substring(0, cleaned.indexOf("/"));
            }
        }

        // 2. Try JSON extraction if payload is formatted as JSON string
        if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
            if (cleaned.contains("\"token\"")) {
                String val = extractJsonField(cleaned, "token");
                if (val != null) cleaned = val;
            } else if (cleaned.contains("\"visitId\"")) {
                String val = extractJsonField(cleaned, "visitId");
                if (val != null) cleaned = val;
            } else if (cleaned.contains("\"alumniId\"")) {
                String val = extractJsonField(cleaned, "alumniId");
                if (val != null) cleaned = val;
            } else if (cleaned.contains("\"regNo\"")) {
                String val = extractJsonField(cleaned, "regNo");
                if (val != null) cleaned = val;
            } else if (cleaned.contains("\"registerNumber\"")) {
                String val = extractJsonField(cleaned, "registerNumber");
                if (val != null) cleaned = val;
            }
        }

        // 3. Search in QrVerificationTokenRepository
        Optional<QrVerificationToken> tokenOpt = qrTokenRepository.findByTokenAndStatus(cleaned, TokenStatus.ACTIVE);
        if (tokenOpt.isPresent()) {
            VirtualAlumniId virtualId = tokenOpt.get().getVirtualAlumniId();
            if (virtualId.getStatus() != VirtualIdStatus.ACTIVE) {
                return createDenialResponse(VerificationMethod.DIGITAL_ID_QR, virtualId.getAlumniProfile(), "Digital Alumni ID is not active (Status: " + virtualId.getStatus() + ")");
            }
            return evaluateAuthorization(virtualId.getAlumniProfile(), VerificationMethod.DIGITAL_ID_QR);
        }

        // 4. Try parsing as UUID (Campus Visit ID or Alumni Profile ID)
        try {
            UUID uuid = UUID.fromString(cleaned);
            Optional<CampusVisit> visitOpt = campusVisitRepository.findById(uuid);
            if (visitOpt.isPresent()) {
                return evaluateAuthorization(visitOpt.get().getAlumniProfile(), VerificationMethod.DIGITAL_ID_QR);
            }
            Optional<AlumniProfile> profileOpt = alumniProfileRepository.findById(uuid);
            if (profileOpt.isPresent()) {
                return evaluateAuthorization(profileOpt.get(), VerificationMethod.DIGITAL_ID_QR);
            }
        } catch (IllegalArgumentException ignored) {
            // Not a UUID, continue
        }

        // 5. Try Alumni ID card number (e.g. "BIT-ALU-2024-001245")
        Optional<VirtualAlumniId> vidOpt = virtualIdRepository.findByAlumniIdCardNumber(cleaned);
        if (vidOpt.isPresent()) {
            return evaluateAuthorization(vidOpt.get().getAlumniProfile(), VerificationMethod.DIGITAL_ID_QR);
        }

        // 6. Try Register Number or Roll Number
        final String searchKey = cleaned.toLowerCase();
        List<AlumniProfile> profiles = alumniProfileRepository.findAll((root, query, cb) ->
                cb.or(
                        cb.equal(cb.lower(root.get("registerNumber")), searchKey),
                        cb.equal(cb.lower(root.get("rollNumber")), searchKey)
                )
        );
        if (!profiles.isEmpty()) {
            return evaluateAuthorization(profiles.get(0), VerificationMethod.DIGITAL_ID_QR);
        }

        return createDenialResponse(VerificationMethod.DIGITAL_ID_QR, null, "Invalid or unrecognized QR verification token: " + qrToken);
    }

    private String extractJsonField(String json, String fieldName) {
        String key = "\"" + fieldName + "\"";
        int idx = json.indexOf(key);
        if (idx == -1) return null;
        int colonIdx = json.indexOf(":", idx);
        if (colonIdx == -1) return null;
        int firstQuote = json.indexOf("\"", colonIdx);
        if (firstQuote == -1) return null;
        int secondQuote = json.indexOf("\"", firstQuote + 1);
        if (secondQuote == -1) return null;
        return json.substring(firstQuote + 1, secondQuote);
    }

    @Override
    @Transactional(readOnly = true)
    public WatchmanVerificationResponse verifyByRfid(String rfidUid) {
        if (rfidUid == null || rfidUid.isBlank()) {
            return createDenialResponse(VerificationMethod.RFID, null, "RFID UID is required");
        }

        Optional<RfidIdentityMapping> mappingOpt = rfidRepository.findByRfidUid(rfidUid.trim());
        if (mappingOpt.isEmpty()) {
            return createDenialResponse(VerificationMethod.RFID, null, "RFID tag not recognized in college directory");
        }

        RfidIdentityMapping mapping = mappingOpt.get();
        if (mapping.getStatus() == RfidStatus.LOST) {
            return createDenialResponse(VerificationMethod.RFID, mapping.getAlumniProfile(), "RFID card is marked as LOST");
        }
        if (mapping.getStatus() == RfidStatus.SUSPENDED) {
            return createDenialResponse(VerificationMethod.RFID, mapping.getAlumniProfile(), "RFID card is SUSPENDED");
        }

        return evaluateAuthorization(mapping.getAlumniProfile(), VerificationMethod.RFID);
    }

    @Override
    @Transactional(readOnly = true)
    public WatchmanVerificationResponse verifyByAlumniId(String alumniIdNumber) {
        if (alumniIdNumber == null || alumniIdNumber.isBlank()) {
            return createDenialResponse(VerificationMethod.ALUMNI_ID, null, "Alumni ID number is required");
        }

        Optional<VirtualAlumniId> vidOpt = virtualIdRepository.findByAlumniIdCardNumber(alumniIdNumber.trim());
        if (vidOpt.isEmpty()) {
            return createDenialResponse(VerificationMethod.ALUMNI_ID, null, "Alumni ID number not recognized: " + alumniIdNumber);
        }

        VirtualAlumniId virtualId = vidOpt.get();
        if (virtualId.getStatus() != VirtualIdStatus.ACTIVE) {
            return createDenialResponse(VerificationMethod.ALUMNI_ID, virtualId.getAlumniProfile(), "Digital Alumni ID is not active (Status: " + virtualId.getStatus() + ")");
        }

        return evaluateAuthorization(virtualId.getAlumniProfile(), VerificationMethod.ALUMNI_ID);
    }

    @Override
    @Transactional(readOnly = true)
    public WatchmanVerificationResponse verifyByRegisterNumber(String registerNumber) {
        if (registerNumber == null || registerNumber.isBlank()) {
            return createDenialResponse(VerificationMethod.REGISTER_NUMBER, null, "Register number is required");
        }

        // Controlled search for verified profile
        List<AlumniProfile> profiles = alumniProfileRepository.findAll((root, query, cb) ->
                cb.equal(cb.lower(root.get("registerNumber")), registerNumber.toLowerCase().trim())
        );

        if (profiles.isEmpty()) {
            return createDenialResponse(VerificationMethod.REGISTER_NUMBER, null, "No alumni profile found for register number: " + registerNumber);
        }

        return evaluateAuthorization(profiles.get(0), VerificationMethod.REGISTER_NUMBER);
    }

    // ==========================================
    // CENTRALIZED GATE AUTHORIZATION ENGINE
    // ==========================================

    private WatchmanVerificationResponse evaluateAuthorization(AlumniProfile profile, VerificationMethod method) {
        CampusVisitAlumniSummary alumniSummary = CampusVisitAlumniSummary.from(profile);

        // 1. Verify profile status
        if (profile.getVerificationStatus() != VerificationStatus.VERIFIED) {
            return new WatchmanVerificationResponse(
                    EntryDecision.DENIED,
                    "Alumni profile is unverified or pending administrative review (Status: " + profile.getVerificationStatus() + ")",
                    method,
                    alumniSummary,
                    null,
                    List.of(),
                    null
            );
        }

        LocalDate today = LocalDate.now();

        // 2. Find today's campus visit
        List<CampusVisit> todayVisits = campusVisitRepository.findByAlumniProfileIdAndVisitDateAndStatusIn(
                profile.getId(),
                today,
                List.of(CampusVisitStatus.PENDING, CampusVisitStatus.APPROVED, CampusVisitStatus.SCHEDULED, CampusVisitStatus.REJECTED, CampusVisitStatus.CANCELLED, CampusVisitStatus.COMPLETED, CampusVisitStatus.EXPIRED)
        );

        CampusVisit visit = selectBestVisit(todayVisits);

        if (visit == null) {
            return new WatchmanVerificationResponse(
                    EntryDecision.DENIED,
                    "No approved campus visit found for today (" + today + ")",
                    method,
                    alumniSummary,
                    null,
                    List.of(),
                    null
            );
        }

        WatchmanVerificationResponse.WatchmanVisitSummary visitSummary = WatchmanVerificationResponse.WatchmanVisitSummary.from(visit);

        // 3. Aggregate all today's activities for this alumnus
        List<Event> todayEvents = eventService.getActiveEventsForAlumniOnDate(profile.getId(), today);
        List<TodayActivityDto> activities = todayEvents.stream()
                .map(TodayActivityDto::from)
                .toList();

        // 4. Calculate timing state
        LocalTime targetTime = visit.getApprovedArrivalTime() != null ? visit.getApprovedArrivalTime() : visit.getPreferredArrivalTime();
        TimingStatus timingStatus = calculateTimingStatus(targetTime);

        // 5. Evaluate Decision
        if (visit.getStatus() == CampusVisitStatus.EXPIRED) {
            return new WatchmanVerificationResponse(
                    EntryDecision.DENIED,
                    "Campus visit request has EXPIRED as the scheduled visit date (" + visit.getVisitDate() + ") has already passed.",
                    method,
                    alumniSummary,
                    visitSummary,
                    activities,
                    timingStatus
            );
        }

        if (visit.getStatus() == CampusVisitStatus.REJECTED) {
            String reason = visit.getAdminComment() != null ? visit.getAdminComment() : "Visit was rejected by administrator";
            return new WatchmanVerificationResponse(
                    EntryDecision.DENIED,
                    "Campus visit was REJECTED. Reason: " + reason,
                    method,
                    alumniSummary,
                    visitSummary,
                    activities,
                    timingStatus
            );
        }

        if (visit.getStatus() == CampusVisitStatus.CANCELLED) {
            return new WatchmanVerificationResponse(
                    EntryDecision.DENIED,
                    "Campus visit was CANCELLED",
                    method,
                    alumniSummary,
                    visitSummary,
                    activities,
                    timingStatus
            );
        }

        if (visit.getStatus() == CampusVisitStatus.PENDING) {
            return new WatchmanVerificationResponse(
                    EntryDecision.REVIEW_REQUIRED,
                    "Campus visit request is PENDING departmental/administrative approval",
                    method,
                    alumniSummary,
                    visitSummary,
                    activities,
                    timingStatus
            );
        }

        // APPROVED or SCHEDULED or COMPLETED
        return new WatchmanVerificationResponse(
                EntryDecision.ALLOWED,
                null,
                method,
                alumniSummary,
                visitSummary,
                activities,
                timingStatus
        );
    }

    private TimingStatus calculateTimingStatus(LocalTime scheduledTime) {
        if (scheduledTime == null) return TimingStatus.ON_TIME;

        LocalTime now = LocalTime.now();
        long minutesDiff = Duration.between(scheduledTime, now).toMinutes();

        if (Math.abs(minutesDiff) <= 60) {
            return TimingStatus.ON_TIME;
        } else if (minutesDiff < -60) {
            return TimingStatus.EARLY;
        } else {
            return TimingStatus.LATE;
        }
    }

    private CampusVisit selectBestVisit(List<CampusVisit> visits) {
        if (visits == null || visits.isEmpty()) return null;

        // 1. Look for Approved / Scheduled / Completed visit first
        Optional<CampusVisit> authorizedVisit = visits.stream()
                .filter(v -> v.getStatus() == CampusVisitStatus.APPROVED || v.getStatus() == CampusVisitStatus.SCHEDULED || v.getStatus() == CampusVisitStatus.COMPLETED)
                .findFirst();
        if (authorizedVisit.isPresent()) {
            return authorizedVisit.get();
        }

        // 2. Look for Pending visit
        Optional<CampusVisit> pendingVisit = visits.stream()
                .filter(v -> v.getStatus() == CampusVisitStatus.PENDING)
                .findFirst();
        if (pendingVisit.isPresent()) {
            return pendingVisit.get();
        }

        // 3. Fallback to most recently updated or created visit
        return visits.stream()
                .sorted((a, b) -> {
                    Instant timeA = a.getUpdatedAt() != null ? a.getUpdatedAt() : (a.getCreatedAt() != null ? a.getCreatedAt() : Instant.EPOCH);
                    Instant timeB = b.getUpdatedAt() != null ? b.getUpdatedAt() : (b.getCreatedAt() != null ? b.getCreatedAt() : Instant.EPOCH);
                    return timeB.compareTo(timeA);
                })
                .findFirst()
                .orElse(visits.get(0));
    }

    private WatchmanVerificationResponse createDenialResponse(VerificationMethod method, AlumniProfile profile, String reason) {
        CampusVisitAlumniSummary summary = profile != null ? CampusVisitAlumniSummary.from(profile) : null;
        return new WatchmanVerificationResponse(
                EntryDecision.DENIED,
                reason,
                method,
                summary,
                null,
                List.of(),
                null
        );
    }
}
