package com.bitconnect.backend.modules.rfid.service;

import com.bitconnect.backend.modules.rfid.dto.RfidAssignRequest;
import com.bitconnect.backend.modules.rfid.dto.RfidMappingDto;
import com.bitconnect.backend.modules.rfid.dto.RfidStatusUpdateRequest;
import com.bitconnect.backend.modules.rfid.entity.RfidIdentityMapping;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RfidService {

    RfidMappingDto assignRfid(RfidAssignRequest request);

    RfidMappingDto updateStatus(UUID mappingId, RfidStatusUpdateRequest request);

    Optional<RfidIdentityMapping> findActiveMappingByUid(String rfidUid);

    Optional<RfidMappingDto> getMappingByAlumniProfileId(UUID alumniProfileId);

    List<RfidMappingDto> getAllMappings();
}
