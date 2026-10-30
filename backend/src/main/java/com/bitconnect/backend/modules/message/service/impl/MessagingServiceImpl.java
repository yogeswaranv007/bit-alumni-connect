package com.bitconnect.backend.modules.message.service.impl;

import com.bitconnect.backend.common.exception.BadRequestException;
import com.bitconnect.backend.common.exception.ForbiddenException;
import com.bitconnect.backend.common.exception.ResourceNotFoundException;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.alumni.repository.AlumniProfileRepository;
import com.bitconnect.backend.modules.message.dto.BlockUserRequest;
import com.bitconnect.backend.modules.message.dto.ConversationResponse;
import com.bitconnect.backend.modules.message.dto.CreateConversationRequest;
import com.bitconnect.backend.modules.message.dto.DeviceKeyRegistrationRequest;
import com.bitconnect.backend.modules.message.dto.DeviceKeyResponse;
import com.bitconnect.backend.modules.message.dto.EncryptedMessageResponse;
import com.bitconnect.backend.modules.message.dto.ReadReceipt;
import com.bitconnect.backend.modules.message.dto.SendEncryptedMessageRequest;
import com.bitconnect.backend.modules.message.entity.Conversation;
import com.bitconnect.backend.modules.message.entity.ConversationStatus;
import com.bitconnect.backend.modules.message.entity.DevicePublicKey;
import com.bitconnect.backend.modules.message.entity.EncryptedMessage;
import com.bitconnect.backend.modules.message.entity.MessageDeliveryStatus;
import com.bitconnect.backend.modules.message.entity.UserBlock;
import com.bitconnect.backend.modules.message.repository.ConversationRepository;
import com.bitconnect.backend.modules.message.repository.DevicePublicKeyRepository;
import com.bitconnect.backend.modules.message.repository.EncryptedMessageRepository;
import com.bitconnect.backend.modules.message.repository.UserBlockRepository;
import com.bitconnect.backend.modules.message.service.MessagingService;
import com.bitconnect.backend.modules.notification.entity.NotificationType;
import com.bitconnect.backend.modules.notification.service.NotificationService;
import com.bitconnect.backend.modules.user.entity.User;
import com.bitconnect.backend.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class MessagingServiceImpl implements MessagingService {

    private final ConversationRepository conversationRepository;
    private final EncryptedMessageRepository messageRepository;
    private final DevicePublicKeyRepository deviceKeyRepository;
    private final UserBlockRepository blockRepository;
    private final UserRepository userRepository;
    private final AlumniProfileRepository alumniProfileRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    public MessagingServiceImpl(
            ConversationRepository conversationRepository,
            EncryptedMessageRepository messageRepository,
            DevicePublicKeyRepository deviceKeyRepository,
            UserBlockRepository blockRepository,
            UserRepository userRepository,
            AlumniProfileRepository alumniProfileRepository,
            NotificationService notificationService,
            @Autowired(required = false) SimpMessagingTemplate messagingTemplate) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.deviceKeyRepository = deviceKeyRepository;
        this.blockRepository = blockRepository;
        this.userRepository = userRepository;
        this.alumniProfileRepository = alumniProfileRepository;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
    }

    // ── Device Public Keys ────────────────────────────────────────────────────

    @Override
    @Transactional
    public DeviceKeyResponse registerDeviceKey(UUID userId, DeviceKeyRegistrationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Revoke any prior active key for the same device ID
        deviceKeyRepository.revokeDeviceKey(userId, request.deviceId());

        DevicePublicKey key = DevicePublicKey.builder()
                .user(user)
                .deviceId(request.deviceId().trim())
                .publicKeyData(request.publicKeyData().trim())
                .algorithm(request.algorithm() != null && !request.algorithm().isBlank() ? request.algorithm().trim() : "ECDH-P256")
                .active(true)
                .build();

        DevicePublicKey saved = deviceKeyRepository.save(key);
        log.info("Registered active device public key for user ID: {}, device ID: {}", userId, request.deviceId());

        return toDeviceKeyResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeviceKeyResponse> getActiveDeviceKeys(UUID targetUserId) {
        if (!userRepository.existsById(targetUserId)) {
            throw new ResourceNotFoundException("User", "id", targetUserId);
        }
        return deviceKeyRepository.findByUserIdAndActiveTrue(targetUserId).stream()
                .map(this::toDeviceKeyResponse)
                .toList();
    }

    @Override
    @Transactional
    public void revokeDeviceKey(UUID userId, String deviceId) {
        deviceKeyRepository.revokeDeviceKey(userId, deviceId);
        log.info("Revoked device key for user ID: {}, device ID: {}", userId, deviceId);
    }

    // ── Conversations ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public ConversationResponse getOrCreateConversation(UUID currentUserId, CreateConversationRequest request) {
        UUID recipientId = request.recipientUserId();
        if (currentUserId.equals(recipientId)) {
            throw new BadRequestException("You cannot start a private conversation with yourself.");
        }

        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", recipientId));

        if (!recipient.isActive()) {
            throw new BadRequestException("The requested recipient account is inactive.");
        }

        // Canonical ordering: u1 has smaller UUID string than u2
        UUID u1Id = currentUserId.compareTo(recipientId) < 0 ? currentUserId : recipientId;
        UUID u2Id = currentUserId.compareTo(recipientId) < 0 ? recipientId : currentUserId;

        Optional<Conversation> existingOpt = conversationRepository.findBetweenUsers(u1Id, u2Id);
        Conversation conversation;

        if (existingOpt.isPresent()) {
            conversation = existingOpt.get();
        } else {
            // Check if communication is blocked before creating a brand new conversation
            if (blockRepository.isBlockedEitherWay(currentUserId, recipientId)) {
                throw new ForbiddenException("Cannot create conversation: communication is blocked between participants.");
            }

            User u1 = userRepository.findById(u1Id)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", u1Id));
            User u2 = userRepository.findById(u2Id)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", u2Id));

            conversation = Conversation.builder()
                    .user1(u1)
                    .user2(u2)
                    .status(ConversationStatus.ACTIVE)
                    .build();
            conversation = conversationRepository.save(conversation);
            log.info("Created new 1-on-1 conversation ID: {} between users: {} and {}", conversation.getId(), u1Id, u2Id);
        }

        return toConversationResponse(conversation, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ConversationResponse> getMyConversations(UUID currentUserId, Pageable pageable) {
        Page<Conversation> page = conversationRepository.findUserConversations(currentUserId, pageable);
        return PagedResponse.from(page.map(conv -> toConversationResponse(conv, currentUserId)));
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationResponse getConversationDetails(UUID currentUserId, UUID conversationId) {
        Conversation conv = getAndAuthorizeConversation(conversationId, currentUserId);
        return toConversationResponse(conv, currentUserId);
    }

    // ── Messages ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<EncryptedMessageResponse> getConversationMessages(UUID currentUserId, UUID conversationId, Pageable pageable) {
        getAndAuthorizeConversation(conversationId, currentUserId);

        Page<EncryptedMessage> messagesPage = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId, pageable);
        return PagedResponse.from(messagesPage.map(this::toEncryptedMessageResponse));
    }

    @Override
    @Transactional
    public EncryptedMessageResponse sendEncryptedMessage(UUID senderId, UUID conversationId, SendEncryptedMessageRequest request) {
        Conversation conversation = getAndAuthorizeConversation(conversationId, senderId);

        if (conversation.getStatus() == ConversationStatus.BLOCKED) {
            throw new ForbiddenException("This conversation has been blocked and cannot receive messages.");
        }

        User recipient = conversation.getOtherParticipant(senderId);
        if (blockRepository.isBlockedEitherWay(senderId, recipient.getId())) {
            throw new ForbiddenException("Cannot send message: communication is blocked between participants.");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", senderId));

        EncryptedMessage message = EncryptedMessage.builder()
                .conversation(conversation)
                .sender(sender)
                .recipient(recipient)
                .encryptedPayload(request.encryptedPayload().trim())
                .iv(request.iv().trim())
                .deliveryStatus(MessageDeliveryStatus.SENT)
                .build();

        EncryptedMessage savedMessage = messageRepository.save(message);

        conversation.setLastMessageAt(savedMessage.getCreatedAt());
        conversationRepository.save(conversation);

        EncryptedMessageResponse response = toEncryptedMessageResponse(savedMessage);

        // Real-time WebSocket dispatch (if broker active)
        if (messagingTemplate != null) {
            try {
                // Broadcast to conversation topic
                messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, response);
                // Private user queue for unread sync
                messagingTemplate.convertAndSendToUser(recipient.getId().toString(), "/queue/messages", response);
            } catch (Exception ex) {
                log.warn("WebSocket dispatch error: {}", ex.getMessage());
            }
        }

        // Trigger in-app notification to recipient (Privacy-first: Zero plaintext content)
        try {
            notificationService.sendNotification(
                    recipient,
                    NotificationType.NEW_ENCRYPTED_MESSAGE,
                    "New Private Message",
                    String.format("You received an end-to-end encrypted message from %s.", sender.getFullName()),
                    conversation.getId(),
                    "CONVERSATION",
                    "/messages?conversationId=" + conversation.getId(),
                    sender.getFullName()
            );
        } catch (Exception ex) {
            log.warn("Failed to dispatch in-app notification: {}", ex.getMessage());
        }

        return response;
    }

    @Override
    @Transactional
    public int markMessagesAsRead(UUID currentUserId, UUID conversationId) {
        getAndAuthorizeConversation(conversationId, currentUserId);
        Instant now = Instant.now();
        int updatedCount = messageRepository.markConversationMessagesAsRead(conversationId, currentUserId, now);

        if (updatedCount > 0 && messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/conversations/" + conversationId + "/read",
                        new ReadReceipt(conversationId, currentUserId, now));
            } catch (Exception ex) {
                log.warn("WebSocket read receipt dispatch error: {}", ex.getMessage());
            }
        }

        return updatedCount;
    }

    // ── Blocking & Abuse Prevention ───────────────────────────────────────────

    @Override
    @Transactional
    public void blockUser(UUID currentUserId, UUID conversationId, BlockUserRequest request) {
        Conversation conversation = getAndAuthorizeConversation(conversationId, currentUserId);
        User otherUser = conversation.getOtherParticipant(currentUserId);

        if (!blockRepository.existsByBlockerIdAndBlockedId(currentUserId, otherUser.getId())) {
            User blocker = userRepository.findById(currentUserId).orElseThrow();
            UserBlock block = UserBlock.builder()
                    .blocker(blocker)
                    .blocked(otherUser)
                    .reason(request != null ? request.reason() : null)
                    .build();
            blockRepository.save(block);
        }

        conversation.setStatus(ConversationStatus.BLOCKED);
        conversation.setBlockedBy(currentUserId);
        conversationRepository.save(conversation);

        log.info("User {} blocked user {} in conversation {}", currentUserId, otherUser.getId(), conversationId);
    }

    @Override
    @Transactional
    public void unblockUser(UUID currentUserId, UUID conversationId) {
        Conversation conversation = getAndAuthorizeConversation(conversationId, currentUserId);

        if (conversation.getStatus() == ConversationStatus.BLOCKED) {
            User otherUser = conversation.getOtherParticipant(currentUserId);
            boolean isBlocker = blockRepository.existsByBlockerIdAndBlockedId(currentUserId, otherUser.getId());
            boolean isBlocked = blockRepository.existsByBlockerIdAndBlockedId(otherUser.getId(), currentUserId);

            // Strictly verify that the user requesting the unblock is indeed the blocker
            if ((conversation.getBlockedBy() != null && !conversation.getBlockedBy().equals(currentUserId))
                    || (isBlocked && !isBlocker)) {
                throw new ForbiddenException("Only the participant who initiated the block can unblock this conversation.");
            }

            // Remove block record for current user
            blockRepository.findByBlockerIdAndBlockedId(currentUserId, otherUser.getId())
                    .ifPresent(blockRepository::delete);

            // If neither user blocks the other anymore, restore conversation to ACTIVE
            if (!blockRepository.isBlockedEitherWay(currentUserId, otherUser.getId())) {
                conversation.setStatus(ConversationStatus.ACTIVE);
                conversation.setBlockedBy(null);
            } else {
                conversation.setBlockedBy(otherUser.getId());
            }

            conversationRepository.save(conversation);
            log.info("User {} unblocked conversation {}", currentUserId, conversationId);
        }
    }

    // ── Helper Methods ────────────────────────────────────────────────────────

    private Conversation getAndAuthorizeConversation(UUID conversationId, UUID userId) {
        Conversation conv = conversationRepository.findByIdWithUsers(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        if (!conv.isParticipant(userId)) {
            log.warn("Security Alert: User {} attempted unauthorized access to conversation {}", userId, conversationId);
            throw new ForbiddenException("You are not a participant in this conversation.");
        }

        return conv;
    }

    private ConversationResponse toConversationResponse(Conversation conv, UUID currentUserId) {
        User otherUser = conv.getOtherParticipant(currentUserId);
        long unreadCount = 0;
        try {
            unreadCount = messageRepository.countUnreadMessages(conv.getId(), currentUserId);
        } catch (Exception ex) {
            log.debug("Unread count lookup note: {}", ex.getMessage());
        }

        String profilePhotoUrl = null;
        try {
            Optional<AlumniProfile> profileOpt = alumniProfileRepository.findByUserId(otherUser.getId());
            if (profileOpt.isPresent()) {
                profilePhotoUrl = profileOpt.get().getProfilePhotoUrl();
            }
        } catch (Exception ex) {
            log.debug("Profile lookup note: {}", ex.getMessage());
        }

        String otherUserRole = "ROLE_USER";
        try {
            if (otherUser != null && otherUser.getRoles() != null && !otherUser.getRoles().isEmpty()) {
                otherUserRole = otherUser.getRoles().iterator().next().getName().name();
            }
        } catch (Exception ex) {
            log.debug("Role lookup note: {}", ex.getMessage());
        }

        return new ConversationResponse(
                conv.getId(),
                otherUser.getId(),
                otherUser.getFullName(),
                otherUser.getEmail(),
                otherUserRole,
                profilePhotoUrl,
                conv.getStatus(),
                conv.getBlockedBy(),
                unreadCount,
                conv.getLastMessageAt(),
                conv.getCreatedAt()
        );
    }

    private EncryptedMessageResponse toEncryptedMessageResponse(EncryptedMessage msg) {
        return new EncryptedMessageResponse(
                msg.getId(),
                msg.getConversation().getId(),
                msg.getSender().getId(),
                msg.getSender().getFullName(),
                msg.getRecipient().getId(),
                msg.getEncryptedPayload(),
                msg.getIv(),
                msg.getDeliveryStatus(),
                msg.getDeliveredAt(),
                msg.getReadAt(),
                msg.getCreatedAt()
        );
    }

    private DeviceKeyResponse toDeviceKeyResponse(DevicePublicKey k) {
        return new DeviceKeyResponse(
                k.getId(),
                k.getUser().getId(),
                k.getDeviceId(),
                k.getPublicKeyData(),
                k.getAlgorithm(),
                k.getCreatedAt()
        );
    }
}
