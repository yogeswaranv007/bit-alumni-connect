package com.bitconnect.backend.message;

import com.bitconnect.backend.common.exception.ForbiddenException;
import com.bitconnect.backend.modules.message.dto.BlockUserRequest;
import com.bitconnect.backend.modules.message.dto.ConversationResponse;
import com.bitconnect.backend.modules.message.dto.CreateConversationRequest;
import com.bitconnect.backend.modules.message.dto.DeviceKeyRegistrationRequest;
import com.bitconnect.backend.modules.message.dto.DeviceKeyResponse;
import com.bitconnect.backend.modules.message.dto.EncryptedMessageResponse;
import com.bitconnect.backend.modules.message.dto.SendEncryptedMessageRequest;
import com.bitconnect.backend.modules.message.entity.Conversation;
import com.bitconnect.backend.modules.message.entity.ConversationStatus;
import com.bitconnect.backend.modules.message.entity.DevicePublicKey;
import com.bitconnect.backend.modules.message.entity.EncryptedMessage;
import com.bitconnect.backend.modules.message.entity.MessageDeliveryStatus;
import com.bitconnect.backend.modules.message.repository.ConversationRepository;
import com.bitconnect.backend.modules.message.repository.DevicePublicKeyRepository;
import com.bitconnect.backend.modules.message.repository.EncryptedMessageRepository;
import com.bitconnect.backend.modules.message.repository.UserBlockRepository;
import com.bitconnect.backend.modules.message.service.impl.MessagingServiceImpl;
import com.bitconnect.backend.modules.notification.service.NotificationService;
import com.bitconnect.backend.modules.user.entity.User;
import com.bitconnect.backend.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessagingServiceUnitTest {

    @Mock
    private ConversationRepository conversationRepository;
    @Mock
    private EncryptedMessageRepository messageRepository;
    @Mock
    private DevicePublicKeyRepository deviceKeyRepository;
    @Mock
    private UserBlockRepository blockRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private com.bitconnect.backend.modules.alumni.repository.AlumniProfileRepository alumniProfileRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private MessagingServiceImpl messagingService;

    private User userA;
    private User userB;
    private User userC;
    private Conversation conversationAB;

    @BeforeEach
    void setUp() {
        userA = User.builder().email("alumni.a@bitsathy.ac.in").fullName("Alice Alumni").isActive(true).build();
        userA.setId(UUID.fromString("11111111-1111-1111-1111-111111111111"));

        userB = User.builder().email("alumni.b@bitsathy.ac.in").fullName("Bob Alumni").isActive(true).build();
        userB.setId(UUID.fromString("22222222-2222-2222-2222-222222222222"));

        userC = User.builder().email("intruder@bitsathy.ac.in").fullName("Intruder").isActive(true).build();
        userC.setId(UUID.fromString("33333333-3333-3333-3333-333333333333"));

        conversationAB = Conversation.builder()
                .user1(userA)
                .user2(userB)
                .status(ConversationStatus.ACTIVE)
                .build();
        conversationAB.setId(UUID.fromString("44444444-4444-4444-4444-444444444444"));
    }

    @Test
    @DisplayName("Starting conversation between userA and userB canonically orders participants to prevent duplicates")
    void getOrCreateConversation_createsCanonicalConversation() {
        when(userRepository.findById(userB.getId())).thenReturn(Optional.of(userB));
        when(userRepository.findById(userA.getId())).thenReturn(Optional.of(userA));
        when(blockRepository.isBlockedEitherWay(userA.getId(), userB.getId())).thenReturn(false);
        when(conversationRepository.findBetweenUsers(userA.getId(), userB.getId())).thenReturn(Optional.empty());
        when(conversationRepository.save(any(Conversation.class))).thenAnswer(invocation -> {
            Conversation c = invocation.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        ConversationResponse resp = messagingService.getOrCreateConversation(userA.getId(), new CreateConversationRequest(userB.getId()));

        assertThat(resp).isNotNull();
        assertThat(resp.otherUserId()).isEqualTo(userB.getId());
        verify(conversationRepository).save(any(Conversation.class));
    }

    @Test
    @DisplayName("Unauthorized non-participant cannot send message or access conversation history")
    void sendEncryptedMessage_unauthorizedNonParticipantThrowsForbidden() {
        when(conversationRepository.findByIdWithUsers(conversationAB.getId())).thenReturn(Optional.of(conversationAB));

        SendEncryptedMessageRequest req = new SendEncryptedMessageRequest("dGVzdC1jaXBoZXJ0ZXh0", "aXYtMTIzNDU2");

        assertThatThrownBy(() -> messagingService.sendEncryptedMessage(userC.getId(), conversationAB.getId(), req))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("You are not a participant in this conversation");

        verify(messageRepository, never()).save(any());
    }

    @Test
    @DisplayName("Participant can send encrypted payload without server decrypting")
    void sendEncryptedMessage_authorizedParticipantSuccess() {
        when(conversationRepository.findByIdWithUsers(conversationAB.getId())).thenReturn(Optional.of(conversationAB));
        when(blockRepository.isBlockedEitherWay(userA.getId(), userB.getId())).thenReturn(false);
        when(userRepository.findById(userA.getId())).thenReturn(Optional.of(userA));
        when(messageRepository.save(any(EncryptedMessage.class))).thenAnswer(invocation -> {
            EncryptedMessage m = invocation.getArgument(0);
            m.setId(UUID.randomUUID());
            m.setCreatedAt(Instant.now());
            return m;
        });

        SendEncryptedMessageRequest req = new SendEncryptedMessageRequest("ZW5jcnlwdGVkLXBheWxvYWQtYmFzZTY0", "bm9uY2UtaXYtMTI=");

        EncryptedMessageResponse resp = messagingService.sendEncryptedMessage(userA.getId(), conversationAB.getId(), req);

        assertThat(resp).isNotNull();
        assertThat(resp.encryptedPayload()).isEqualTo("ZW5jcnlwdGVkLXBheWxvYWQtYmFzZTY0");
        assertThat(resp.iv()).isEqualTo("bm9uY2UtaXYtMTI=");
        assertThat(resp.deliveryStatus()).isEqualTo(MessageDeliveryStatus.SENT);
        verify(messageRepository).save(any(EncryptedMessage.class));
    }

    @Test
    @DisplayName("Blocked user cannot send message in conversation")
    void sendEncryptedMessage_blockedConversationThrowsForbidden() {
        conversationAB.setStatus(ConversationStatus.BLOCKED);
        conversationAB.setBlockedBy(userB.getId());

        when(conversationRepository.findByIdWithUsers(conversationAB.getId())).thenReturn(Optional.of(conversationAB));

        SendEncryptedMessageRequest req = new SendEncryptedMessageRequest("Y2lwaGVydGV4dA==", "aXYxMg==");

        assertThatThrownBy(() -> messagingService.sendEncryptedMessage(userA.getId(), conversationAB.getId(), req))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("conversation has been blocked");

        verify(messageRepository, never()).save(any());
    }

    @Test
    @DisplayName("Registering device key revokes prior key for same deviceId")
    void registerDeviceKey_revokesPriorDeviceKey() {
        when(userRepository.findById(userA.getId())).thenReturn(Optional.of(userA));
        when(deviceKeyRepository.save(any(DevicePublicKey.class))).thenAnswer(invocation -> {
            DevicePublicKey k = invocation.getArgument(0);
            k.setId(UUID.randomUUID());
            k.setCreatedAt(Instant.now());
            return k;
        });

        DeviceKeyRegistrationRequest req = new DeviceKeyRegistrationRequest("chrome-device-1", "{\"kty\":\"EC\",\"crv\":\"P-256\",\"x\":\"...\",\"y\":\"...\"}", "ECDH-P256");

        DeviceKeyResponse resp = messagingService.registerDeviceKey(userA.getId(), req);

        assertThat(resp).isNotNull();
        assertThat(resp.deviceId()).isEqualTo("chrome-device-1");
        verify(deviceKeyRepository).revokeDeviceKey(userA.getId(), "chrome-device-1");
        verify(deviceKeyRepository).save(any(DevicePublicKey.class));
    }

    @Test
    @DisplayName("Participant can block and unblock conversation successfully")
    void blockAndUnblockUser_flow() {
        when(conversationRepository.findByIdWithUsers(conversationAB.getId())).thenReturn(Optional.of(conversationAB));
        when(blockRepository.existsByBlockerIdAndBlockedId(userA.getId(), userB.getId())).thenReturn(false);
        when(userRepository.findById(userA.getId())).thenReturn(Optional.of(userA));

        // Block
        messagingService.blockUser(userA.getId(), conversationAB.getId(), new BlockUserRequest("Spam"));
        assertThat(conversationAB.getStatus()).isEqualTo(ConversationStatus.BLOCKED);
        assertThat(conversationAB.getBlockedBy()).isEqualTo(userA.getId());

        // Unblock
        messagingService.unblockUser(userA.getId(), conversationAB.getId());
        assertThat(conversationAB.getStatus()).isEqualTo(ConversationStatus.ACTIVE);
        assertThat(conversationAB.getBlockedBy()).isNull();
    }

    @Test
    @DisplayName("Non-participant cannot mark messages as read")
    void markMessagesAsRead_unauthorizedThrowsForbidden() {
        when(conversationRepository.findByIdWithUsers(conversationAB.getId())).thenReturn(Optional.of(conversationAB));

        assertThatThrownBy(() -> messagingService.markMessagesAsRead(userC.getId(), conversationAB.getId()))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("You are not a participant in this conversation");

        verify(messageRepository, never()).markConversationMessagesAsRead(any(), any(), any());
    }

    @Test
    @DisplayName("Participant can mark messages as read and dispatches read receipt via WebSocket")
    void markMessagesAsRead_participantSuccess() {
        when(conversationRepository.findByIdWithUsers(conversationAB.getId())).thenReturn(Optional.of(conversationAB));
        when(messageRepository.markConversationMessagesAsRead(eq(conversationAB.getId()), eq(userB.getId()), any(Instant.class)))
                .thenReturn(3);

        int count = messagingService.markMessagesAsRead(userB.getId(), conversationAB.getId());

        assertThat(count).isEqualTo(3);
        verify(messagingTemplate).convertAndSend(eq("/topic/conversations/" + conversationAB.getId() + "/read"), any(Object.class));
    }

    @Test
    @DisplayName("Non-participant cannot access message history")
    void getMessageHistory_unauthorizedThrowsForbidden() {
        when(conversationRepository.findByIdWithUsers(conversationAB.getId())).thenReturn(Optional.of(conversationAB));

        assertThatThrownBy(() -> messagingService.getConversationMessages(userC.getId(), conversationAB.getId(), org.springframework.data.domain.PageRequest.of(0, 20)))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("Sender cannot message self")
    void getOrCreateConversation_selfMessagingThrowsBadRequest() {
        assertThatThrownBy(() -> messagingService.getOrCreateConversation(userA.getId(), new CreateConversationRequest(userA.getId())))
                .isInstanceOf(com.bitconnect.backend.common.exception.BadRequestException.class)
                .hasMessageContaining("You cannot start a private conversation with yourself");
    }

    @Test
    @DisplayName("Sender cannot message inactive user")
    void getOrCreateConversation_inactiveUserThrowsBadRequest() {
        User inactive = User.builder().email("inactive@bitsathy.ac.in").fullName("Inactive").isActive(false).build();
        inactive.setId(UUID.randomUUID());
        when(userRepository.findById(inactive.getId())).thenReturn(Optional.of(inactive));

        assertThatThrownBy(() -> messagingService.getOrCreateConversation(userA.getId(), new CreateConversationRequest(inactive.getId())))
                .isInstanceOf(com.bitconnect.backend.common.exception.BadRequestException.class)
                .hasMessageContaining("recipient account is inactive");
    }
}
