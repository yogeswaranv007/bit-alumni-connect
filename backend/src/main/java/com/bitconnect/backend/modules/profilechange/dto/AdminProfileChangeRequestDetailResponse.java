package com.bitconnect.backend.modules.profilechange.dto;

import com.bitconnect.backend.modules.virtualid.dto.VirtualIdCardResponse;

import java.util.List;
import java.util.Map;

/**
 * Detailed composite response for administrative review and comparison,
 * including side-by-side changed fields and proposed Digital Alumni ID card preview.
 */
public record AdminProfileChangeRequestDetailResponse(
        ProfileChangeRequestResponse request,
        Map<String, Object> alumni,
        Map<String, Object> currentProfile,
        Map<String, Object> requestedChanges,
        List<String> changedFields,
        VirtualIdCardResponse currentVirtualId,
        VirtualIdCardResponse proposedVirtualIdPreview
) {
}
