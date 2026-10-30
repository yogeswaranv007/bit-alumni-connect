package com.bitconnect.backend.message;

import com.bitconnect.backend.modules.auth.dto.AlumniRegisterRequest;
import com.bitconnect.backend.modules.auth.dto.AuthResponse;
import com.bitconnect.backend.modules.auth.service.AuthService;
import com.bitconnect.backend.modules.institutional.entity.CollegeAlumniRecord;
import com.bitconnect.backend.modules.institutional.entity.CollegeRecordStatus;
import com.bitconnect.backend.modules.institutional.repository.CollegeAlumniRecordRepository;
import com.bitconnect.backend.modules.message.dto.ConversationResponse;
import com.bitconnect.backend.modules.message.dto.CreateConversationRequest;
import com.bitconnect.backend.modules.message.dto.EncryptedMessageResponse;
import com.bitconnect.backend.modules.message.dto.ReadReceipt;
import com.bitconnect.backend.modules.message.dto.SendEncryptedMessageRequest;
import com.bitconnect.backend.modules.message.service.MessagingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class MessagingWebSocketEndToEndTest {

    @LocalServerPort
    private int port;

    @Autowired
    private AuthService authService;

    @Autowired
    private CollegeAlumniRecordRepository collegeAlumniRecordRepository;

    @Autowired
    private MessagingService messagingService;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    private WebSocketStompClient stompClient;

    @BeforeEach
    void setUp() {
        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setObjectMapper(objectMapper);
        stompClient.setMessageConverter(converter);
    }

    private static class TestAccount {
        final UUID userId;
        final String token;

        TestAccount(UUID userId, String token) {
            this.userId = userId;
            this.token = token;
        }
    }

    private TestAccount registerTestAccount(String prefix) {
        long ts = System.currentTimeMillis() + (long) (Math.random() * 100000);
        String regNo = "WS-" + prefix + "-" + ts;
        String email = "ws." + prefix.toLowerCase() + ts + "@bitsathy.ac.in";
        LocalDate dob = LocalDate.of(1999, 5, 20);

        collegeAlumniRecordRepository.save(CollegeAlumniRecord.builder()
                .institutionalRecordId("INST-" + regNo)
                .registerNumber(regNo)
                .name(prefix + " Tester")
                .dateOfBirth(dob)
                .degree("B.E.")
                .departmentCode("ECE")
                .graduationYear(2021)
                .recordStatus(CollegeRecordStatus.ACTIVE)
                .build());

        AlumniRegisterRequest req = new AlumniRegisterRequest(email, "Password@123", regNo, prefix + " Tester", dob);
        AuthResponse res = authService.registerAlumni(req);
        return new TestAccount(res.user().id(), res.accessToken());
    }

    @Test
    @DisplayName("Genuine WebSocket STOMP Delivery: Receiver gets encrypted message in real time without polling")
    void testRealTimeWebSocketDelivery() throws Exception {
        TestAccount sender = registerTestAccount("SND");
        TestAccount receiver = registerTestAccount("RCV");

        // 1. Create conversation
        ConversationResponse conv = messagingService.getOrCreateConversation(
                sender.userId,
                new CreateConversationRequest(receiver.userId)
        );
        UUID convId = conv.id();

        // 2. Connect receiver via WebSocket STOMP
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + receiver.token);

        CompletableFuture<EncryptedMessageResponse> messageFuture = new CompletableFuture<>();

        String wsUrl = "ws://localhost:" + port + "/ws";
        StompSession session = stompClient.connectAsync(
                wsUrl,
                new WebSocketHttpHeaders(),
                connectHeaders,
                new StompSessionHandlerAdapter() {
                    @Override
                    public void handleException(StompSession session, StompCommand command, StompHeaders headers, byte[] payload, Throwable exception) {
                        messageFuture.completeExceptionally(exception);
                    }

                    @Override
                    public void handleTransportError(StompSession session, Throwable exception) {
                        messageFuture.completeExceptionally(exception);
                    }
                }
        ).get(10, TimeUnit.SECONDS);

        assertTrue(session.isConnected(), "STOMP session should be connected");

        // 3. Receiver subscribes to conversation topic
        session.subscribe("/topic/conversations/" + convId, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return EncryptedMessageResponse.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                if (payload instanceof EncryptedMessageResponse msg) {
                    messageFuture.complete(msg);
                }
            }
        });

        // Small pause to ensure broker subscription is registered
        Thread.sleep(300);

        // 4. Sender dispatches encrypted message via messagingService
        String expectedCiphertext = "EnCrYpTeDcIpHeRtExT==";
        String expectedIv = "123456789012";
        SendEncryptedMessageRequest sendReq = new SendEncryptedMessageRequest(expectedCiphertext, expectedIv);

        EncryptedMessageResponse sentResponse = messagingService.sendEncryptedMessage(sender.userId, convId, sendReq);
        assertNotNull(sentResponse);

        // 5. Verify real-time receipt on the receiver's WebSocket
        EncryptedMessageResponse receivedMessage = messageFuture.get(10, TimeUnit.SECONDS);

        assertNotNull(receivedMessage);
        assertEquals(sentResponse.id(), receivedMessage.id());
        assertEquals(sender.userId, receivedMessage.senderId());
        assertEquals(expectedCiphertext, receivedMessage.encryptedPayload());
        assertEquals(expectedIv, receivedMessage.iv());

        session.disconnect();
    }

    @Test
    @DisplayName("Genuine WebSocket STOMP Read Receipt Delivery: Sender gets read notification in real time")
    void testRealTimeWebSocketReadReceiptDelivery() throws Exception {
        TestAccount sender = registerTestAccount("SND2");
        TestAccount receiver = registerTestAccount("RCV2");

        ConversationResponse conv = messagingService.getOrCreateConversation(
                sender.userId,
                new CreateConversationRequest(receiver.userId)
        );
        UUID convId = conv.id();

        // Sender sends message first
        messagingService.sendEncryptedMessage(
                sender.userId,
                convId,
                new SendEncryptedMessageRequest("CIPHER123==", "IV1234567890")
        );

        // Sender connects STOMP session to listen for read receipts
        StompHeaders senderHeaders = new StompHeaders();
        senderHeaders.add("Authorization", "Bearer " + sender.token);

        CompletableFuture<ReadReceipt> receiptFuture = new CompletableFuture<>();

        String wsUrl = "ws://localhost:" + port + "/ws";
        StompSession senderSession = stompClient.connectAsync(
                wsUrl,
                new WebSocketHttpHeaders(),
                senderHeaders,
                new StompSessionHandlerAdapter() {}
        ).get(10, TimeUnit.SECONDS);

        senderSession.subscribe("/topic/conversations/" + convId + "/read", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return ReadReceipt.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                if (payload instanceof ReadReceipt receipt) {
                    receiptFuture.complete(receipt);
                }
            }
        });

        Thread.sleep(300);

        // Receiver marks messages as read
        int updated = messagingService.markMessagesAsRead(receiver.userId, convId);
        assertTrue(updated > 0);

        // Sender receives real-time read receipt frame
        ReadReceipt receivedReceipt = receiptFuture.get(10, TimeUnit.SECONDS);
        assertNotNull(receivedReceipt);
        assertEquals(convId, receivedReceipt.conversationId());
        assertEquals(receiver.userId, receivedReceipt.readerId());

        if (senderSession.isConnected()) {
            senderSession.disconnect();
        }
    }

    @Test
    @DisplayName("WebSocket STOMP Subscription Security: Unauthorized non-participant is denied subscription")
    void testUnauthorizedUserSubscriptionRejection() throws Exception {
        TestAccount alice = registerTestAccount("ALICE_SEC");
        TestAccount bob = registerTestAccount("BOB_SEC");
        TestAccount eve = registerTestAccount("EVE_SEC");

        ConversationResponse conv = messagingService.getOrCreateConversation(
                alice.userId,
                new CreateConversationRequest(bob.userId)
        );
        UUID convId = conv.id();

        StompHeaders eveHeaders = new StompHeaders();
        eveHeaders.add("Authorization", "Bearer " + eve.token);

        CompletableFuture<Throwable> errorFuture = new CompletableFuture<>();

        String wsUrl = "ws://localhost:" + port + "/ws";
        StompSession eveSession = stompClient.connectAsync(
                wsUrl,
                new WebSocketHttpHeaders(),
                eveHeaders,
                new StompSessionHandlerAdapter() {
                    @Override
                    public void handleException(StompSession session, StompCommand command, StompHeaders headers, byte[] payload, Throwable exception) {
                        errorFuture.complete(exception);
                    }

                    @Override
                    public void handleTransportError(StompSession session, Throwable exception) {
                        errorFuture.complete(exception);
                    }
                }
        ).get(10, TimeUnit.SECONDS);

        // Eve attempts to subscribe to Alice-Bob conversation topic
        eveSession.subscribe("/topic/conversations/" + convId, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return Object.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {}
        });

        // The subscription interceptor throws AccessDeniedException which triggers STOMP ERROR or disconnect
        Throwable error = errorFuture.get(10, TimeUnit.SECONDS);
        assertNotNull(error, "Eve should receive a transport/security error on unauthorized subscription");

        if (eveSession.isConnected()) {
            eveSession.disconnect();
        }
    }
}
