package com.bitconnect.backend.modules.rfid.dto;

import com.bitconnect.backend.modules.rfid.entity.RfidIdentityMapping;
import com.bitconnect.backend.modules.rfid.entity.RfidStatus;

import java.time.LocalDate;
import java.util.UUID;

public record RfidMappingDto(
        UUID id,
        UUID alumniProfileId,
        String alumniName,
        String alumniRollNumber,
        String alumniRegisterNumber,
        String rfidUid,
        String cardNumber,
        RfidStatus status,
        LocalDate issuedDate,
        String notes
) {
    public static RfidMappingDto from(RfidIdentityMapping m) {
        String name = m.getAlumniProfile().getUser() != null ? m.getAlumniProfile().getUser().getFullName() : "Unknown";
        return new RfidMappingDto(
                m.getId(),
                m.getAlumniProfile().getId(),
                name,
                m.getAlumniProfile().getRollNumber(),
                m.getAlumniProfile().getRegisterNumber(),
                m.getRfidUid(),
                m.getCardNumber(),
                m.getStatus(),
                m.getIssuedDate(),
                m.getNotes()
        );
    }
}
