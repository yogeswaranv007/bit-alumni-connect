package com.bitconnect.backend.modules.gate.service;

import com.bitconnect.backend.modules.gate.dto.WatchmanVerificationResponse;

import java.util.UUID;

public interface CampusEntryAuthorizationService {

    WatchmanVerificationResponse verifyByQrToken(String qrToken);

    WatchmanVerificationResponse verifyByRfid(String rfidUid);

    WatchmanVerificationResponse verifyByAlumniId(String alumniIdNumber);

    WatchmanVerificationResponse verifyByRegisterNumber(String registerNumber);

    WatchmanVerificationResponse registerGateCheckin(UUID userId, String gate);

    WatchmanVerificationResponse pollLatestGateCheckin(String gate);
}
