package com.bitconnect.backend.modules.message.service;

import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.message.dto.BlockUserRequest;
import com.bitconnect.backend.modules.message.dto.ConversationResponse;
import com.bitconnect.backend.modules.message.dto.CreateConversationRequest;
import com.bitconnect.backend.modules.message.dto.DeviceKeyRegistrationRequest;
import com.bitconnect.backend.modules.message.dto.DeviceKeyResponse;
import com.bitconnect.backend.modules.message.dto.EncryptedMessageResponse;
import com.bitconnect.backend.modules.message.dto.SendEncryptedMessageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface MessagingService {

    // Device keys
    DeviceKeyResponse registerDeviceKey(UUID userId, DeviceKeyRegistrationRequest request);

    List<DeviceKeyResponse> getActiveDeviceKeys(UUID targetUserId);

    void revokeDeviceKey(UUID userId, String deviceId);

    // Conversations
    ConversationResponse getOrCreateConversation(UUID currentUserId, CreateConversationRequest request);

    PagedResponse<ConversationResponse> getMyConversations(UUID currentUserId, Pageable pageable);

    ConversationResponse getConversationDetails(UUID currentUserId, UUID conversationId);

    // Messages
    PagedResponse<EncryptedMessageResponse> getConversationMessages(UUID currentUserId, UUID conversationId, Pageable pageable);

    EncryptedMessageResponse sendEncryptedMessage(UUID senderId, UUID conversationId, SendEncryptedMessageRequest request);

    int markMessagesAsRead(UUID currentUserId, UUID conversationId);

    // Safety & Blocking
    void blockUser(UUID currentUserId, UUID conversationId, BlockUserRequest request);

    void unblockUser(UUID currentUserId, UUID conversationId);
}
