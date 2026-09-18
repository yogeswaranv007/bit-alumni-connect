package com.bitconnect.backend.modules.gate.dto;

import com.bitconnect.backend.modules.gate.entity.CampusEntryLog;
import com.bitconnect.backend.modules.gate.entity.EntryDecision;

import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

public record WatchmanEntryResponse(
        UUID logId,
        EntryDecision decision,
        String message,
        String alumniName,
        String alumniRollNumber,
        String alumniRegisterNumber,
        String gate,
        LocalTime entryTime,
        Instant timestamp
) {
    public static WatchmanEntryResponse from(CampusEntryLog log, String message) {
        String name = log.getAlumniProfile().getUser() != null ? log.getAlumniProfile().getUser().getFullName() : "Unknown";
        return new WatchmanEntryResponse(
                log.getId(),
                log.getEntryDecision(),
                message,
                name,
                log.getAlumniProfile().getRollNumber(),
                log.getAlumniProfile().getRegisterNumber(),
                log.getGate(),
                log.getActualEntryTime(),
                log.getEntryTimestamp()
        );
    }
}
