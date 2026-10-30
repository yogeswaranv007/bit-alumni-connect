package com.bitconnect.backend.message;

import com.bitconnect.backend.modules.auth.dto.AlumniRegisterRequest;
import com.bitconnect.backend.modules.institutional.entity.CollegeAlumniRecord;
import com.bitconnect.backend.modules.institutional.entity.CollegeRecordStatus;
import com.bitconnect.backend.modules.institutional.repository.CollegeAlumniRecordRepository;
import com.bitconnect.backend.modules.message.dto.BlockUserRequest;
import com.bitconnect.backend.modules.message.dto.CreateConversationRequest;
import com.bitconnect.backend.modules.message.dto.DeviceKeyRegistrationRequest;
import com.bitconnect.backend.modules.message.dto.SendEncryptedMessageRequest;
import com.bitconnect.backend.modules.message.repository.EncryptedMessageRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
class MessagingControllerIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private CollegeAlumniRecordRepository collegeAlumniRecordRepository;

    @Autowired
    private EncryptedMessageRepository encryptedMessageRepository;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    private static class TestUser {
        final UUID userId;
        final String email;
        final String token;

        TestUser(UUID userId, String email, String token) {
            this.userId = userId;
            this.email = email;
            this.token = token;
        }
    }

    private TestUser createAndRegisterUser(String prefix, String name) throws Exception {
        long ts = System.currentTimeMillis() + (long)(Math.random() * 100000);
        String regNo = "REG-" + prefix + "-" + ts;
        String email = prefix.toLowerCase() + "." + ts + "@bitsathy.ac.in";
        LocalDate dob = LocalDate.of(1998, 1, 1);

        collegeAlumniRecordRepository.save(CollegeAlumniRecord.builder()
                .institutionalRecordId("REC-" + regNo)
                .registerNumber(regNo)
                .name(name)
                .dateOfBirth(dob)
                .degree("B.E.")
                .departmentCode("CSE")
                .graduationYear(2020)
                .recordStatus(CollegeRecordStatus.ACTIVE)
                .build());

        AlumniRegisterRequest req = new AlumniRegisterRequest(email, "Password@123", regNo, name, dob);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        String token = root.path("data").path("accessToken").asText();
        UUID userId = UUID.fromString(root.path("data").path("user").path("id").asText());

        return new TestUser(userId, email, token);
    }

    @Test
    @DisplayName("Device Key Registration and Peer Retrieval: Public keys are accessible, private keys never requested")
    void testDeviceKeyRegistrationAndRetrieval() throws Exception {
        TestUser user1 = createAndRegisterUser("KEY1", "Alice Keys");
        TestUser user2 = createAndRegisterUser("KEY2", "Bob Keys");

        // User 1 registers device public key
        DeviceKeyRegistrationRequest regRequest = new DeviceKeyRegistrationRequest(
                "device-chrome-abc",
                "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEtestPublicKeyDataAlice1234567890=",
                "ECDH_P256"
        );

        mockMvc.perform(post("/api/v1/messages/keys")
                        .header("Authorization", "Bearer " + user1.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.deviceId", is("device-chrome-abc")))
                .andExpect(jsonPath("$.data.publicKeyData", containsString("testPublicKeyDataAlice")));

        // User 2 retrieves User 1's public key
        mockMvc.perform(get("/api/v1/messages/keys/" + user1.userId)
                        .header("Authorization", "Bearer " + user2.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].publicKeyData", containsString("testPublicKeyDataAlice")));
    }

    @Test
    @DisplayName("Two-User Conversation: Canonical deduplication and dual retrieval")
    void testTwoUserConversationInitiationAndDeduplication() throws Exception {
        TestUser user1 = createAndRegisterUser("CONV1", "User One");
        TestUser user2 = createAndRegisterUser("CONV2", "User Two");

        // User 1 creates conversation with User 2
        CreateConversationRequest req1 = new CreateConversationRequest(user2.userId);
        MvcResult res1 = mockMvc.perform(post("/api/v1/messages/conversations")
                        .header("Authorization", "Bearer " + user1.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.otherUserId", is(user2.userId.toString())))
                .andReturn();

        JsonNode node1 = objectMapper.readTree(res1.getResponse().getContentAsString());
        String conversationId = node1.path("data").path("id").asText();

        // User 2 creates conversation with User 1 -> returns exact same conversationId
        CreateConversationRequest req2 = new CreateConversationRequest(user1.userId);
        mockMvc.perform(post("/api/v1/messages/conversations")
                        .header("Authorization", "Bearer " + user2.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(conversationId)))
                .andExpect(jsonPath("$.data.otherUserId", is(user1.userId.toString())));
    }

    @Test
    @DisplayName("Message Dispatch: Server enforces sender identity, persists ciphertext only, and rejects unauthorized access")
    void testMessageDispatchAndAuthorization() throws Exception {
        TestUser alice = createAndRegisterUser("ALICE", "Alice Sender");
        TestUser bob = createAndRegisterUser("BOB", "Bob Recipient");
        TestUser eve = createAndRegisterUser("EVE", "Eve Eavesdropper");

        // Alice creates conversation with Bob
        MvcResult convResult = mockMvc.perform(post("/api/v1/messages/conversations")
                        .header("Authorization", "Bearer " + alice.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateConversationRequest(bob.userId))))
                .andExpect(status().isOk())
                .andReturn();

        String convId = objectMapper.readTree(convResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Alice sends encrypted message
        String simulatedCiphertext = "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA=";
        String simulatedIv = "MDEyMzQ1Njc4OTAx";
        SendEncryptedMessageRequest sendReq = new SendEncryptedMessageRequest(
                simulatedCiphertext,
                simulatedIv
        );

        MvcResult sendResult = mockMvc.perform(post("/api/v1/messages/conversations/" + convId + "/messages")
                        .header("Authorization", "Bearer " + alice.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sendReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.senderId", is(alice.userId.toString())))
                .andExpect(jsonPath("$.data.encryptedPayload", is(simulatedCiphertext)))
                .andExpect(jsonPath("$.data.iv", is(simulatedIv)))
                .andReturn();

        String msgId = objectMapper.readTree(sendResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Verify in DB directly: Only ciphertext and IV stored, no plaintext
        var msgEntityOpt = encryptedMessageRepository.findById(UUID.fromString(msgId));
        assertTrue(msgEntityOpt.isPresent());
        var msgEntity = msgEntityOpt.get();
        assertFalse(msgEntity.getEncryptedPayload().contains("Hello"));
        assertFalse(msgEntity.getEncryptedPayload().contains("secret"));

        // Bob can read messages
        mockMvc.perform(get("/api/v1/messages/conversations/" + convId + "/messages")
                        .header("Authorization", "Bearer " + bob.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].senderId", is(alice.userId.toString())));

        // Eve (unauthorized third party) attempts to read conversation messages -> 403 Forbidden
        mockMvc.perform(get("/api/v1/messages/conversations/" + convId + "/messages")
                        .header("Authorization", "Bearer " + eve.token))
                .andExpect(status().isForbidden());

        // Eve attempts to send a message to Alice-Bob conversation -> 403 Forbidden
        mockMvc.perform(post("/api/v1/messages/conversations/" + convId + "/messages")
                        .header("Authorization", "Bearer " + eve.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sendReq)))
                .andExpect(status().isForbidden());

        // Bob marks messages as read
        mockMvc.perform(patch("/api/v1/messages/conversations/" + convId + "/read")
                        .header("Authorization", "Bearer " + bob.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(1)));
    }

    @Test
    @DisplayName("Blocking Workflow: Blocked recipient cannot send messages; unblock restores capability")
    void testBlockAndUnblockWorkflow() throws Exception {
        TestUser userA = createAndRegisterUser("BLKA", "Blocker User");
        TestUser userB = createAndRegisterUser("BLKB", "Blocked User");

        // User A creates conversation with User B
        MvcResult convResult = mockMvc.perform(post("/api/v1/messages/conversations")
                        .header("Authorization", "Bearer " + userA.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateConversationRequest(userB.userId))))
                .andExpect(status().isOk())
                .andReturn();

        String convId = objectMapper.readTree(convResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // User A blocks User B
        mockMvc.perform(post("/api/v1/messages/conversations/" + convId + "/block")
                        .header("Authorization", "Bearer " + userA.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new BlockUserRequest("Harassment"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // User B attempts to send message to User A -> 403 Forbidden (Blocked)
        SendEncryptedMessageRequest blockedReq = new SendEncryptedMessageRequest(
                "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA=",
                "MDEyMzQ1Njc4OTAx"
        );

        mockMvc.perform(post("/api/v1/messages/conversations/" + convId + "/messages")
                        .header("Authorization", "Bearer " + userB.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blockedReq)))
                .andExpect(status().isForbidden());

        // User A unblocks User B
        mockMvc.perform(post("/api/v1/messages/conversations/" + convId + "/unblock")
                        .header("Authorization", "Bearer " + userA.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // User B sends message successfully now
        mockMvc.perform(post("/api/v1/messages/conversations/" + convId + "/messages")
                        .header("Authorization", "Bearer " + userB.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blockedReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
