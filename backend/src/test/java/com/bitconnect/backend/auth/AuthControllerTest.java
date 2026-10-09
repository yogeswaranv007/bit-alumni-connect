package com.bitconnect.backend.auth;

import com.bitconnect.backend.modules.auth.dto.AlumniRegisterRequest;
import com.bitconnect.backend.modules.auth.dto.LoginRequest;
import com.bitconnect.backend.modules.institutional.entity.CollegeAlumniRecord;
import com.bitconnect.backend.modules.institutional.entity.CollegeRecordStatus;
import com.bitconnect.backend.modules.institutional.repository.CollegeAlumniRecordRepository;
import com.bitconnect.backend.modules.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CollegeAlumniRecordRepository collegeAlumniRecordRepository;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    private void seedMockAlumniRecord(String regNo, String name, LocalDate dob) {
        collegeAlumniRecordRepository.save(CollegeAlumniRecord.builder()
                .institutionalRecordId("REC-" + regNo)
                .registerNumber(regNo)
                .name(name)
                .dateOfBirth(dob)
                .degree("B.Tech")
                .departmentCode("IT")
                .graduationYear(2022)
                .recordStatus(CollegeRecordStatus.ACTIVE)
                .build());
    }

    @Test
    @DisplayName("Should successfully register alumni user, assign ROLE_ALUMNI, and return JWT")
    void testRegisterSuccess() throws Exception {
        String uniqueEmail = "alumni." + System.currentTimeMillis() + "@bitsathy.ac.in";
        String regNo = "TEST-REG-" + System.currentTimeMillis();
        LocalDate dob = LocalDate.of(2000, 5, 15);
        seedMockAlumniRecord(regNo, "Kavitha Raman", dob);

        AlumniRegisterRequest request = new AlumniRegisterRequest(
                uniqueEmail, "Password@123", regNo, "Kavitha Raman", dob);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("successful")))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.data.user.email", is(uniqueEmail.toLowerCase())))
                .andExpect(jsonPath("$.data.user.fullName", is("Kavitha Raman")))
                .andExpect(jsonPath("$.data.user.roles", hasItem("ROLE_ALUMNI")));
    }

    @Test
    @DisplayName("Should reject registration with duplicate email (HTTP 400)")
    void testRegisterDuplicateEmail() throws Exception {
        String uniqueEmail = "dup." + System.currentTimeMillis() + "@bitsathy.ac.in";
        String regNo1 = "TEST-DUP1-" + System.currentTimeMillis();
        String regNo2 = "TEST-DUP2-" + System.currentTimeMillis();
        LocalDate dob = LocalDate.of(2000, 1, 1);
        seedMockAlumniRecord(regNo1, "Duplicate User", dob);
        seedMockAlumniRecord(regNo2, "Duplicate User", dob);

        AlumniRegisterRequest request1 = new AlumniRegisterRequest(
                uniqueEmail, "Password@123", regNo1, "Duplicate User", dob);
        AlumniRegisterRequest request2 = new AlumniRegisterRequest(
                uniqueEmail, "Password@123", regNo2, "Duplicate User", dob);

        // First registration
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isCreated());

        // Second registration with same email
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    @DisplayName("Should reject invalid registration payload with validation errors (HTTP 400)")
    void testRegisterInvalidPayload() throws Exception {
        AlumniRegisterRequest invalidRequest = new AlumniRegisterRequest(
                "not-an-email", "short", "", "", null);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.data.email", notNullValue()))
                .andExpect(jsonPath("$.data.password", notNullValue()));
    }

    @Test
    @DisplayName("Should login successfully with valid credentials and return JWT")
    void testLoginSuccess() throws Exception {
        String email = "login." + System.currentTimeMillis() + "@bitsathy.ac.in";
        String regNo = "TEST-LOG-" + System.currentTimeMillis();
        LocalDate dob = LocalDate.of(2000, 2, 2);
        seedMockAlumniRecord(regNo, "Login Test", dob);

        AlumniRegisterRequest registerRequest = new AlumniRegisterRequest(
                email, "SecurePass@123", regNo, "Login Test", dob);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        LoginRequest loginRequest = new LoginRequest(email, "SecurePass@123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.email", is(email.toLowerCase())));
    }

    @Test
    @DisplayName("Should reject login with invalid credentials (HTTP 401)")
    void testLoginInvalidCredentials() throws Exception {
        LoginRequest invalidLogin = new LoginRequest("nonexistent@bitsathy.ac.in", "WrongPassword");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Invalid email or password")));
    }

    @Test
    @DisplayName("Should fetch current user profile with valid Bearer JWT")
    void testGetCurrentUserWithValidToken() throws Exception {
        String email = "me." + System.currentTimeMillis() + "@bitsathy.ac.in";
        String regNo = "TEST-ME-" + System.currentTimeMillis();
        LocalDate dob = LocalDate.of(2000, 3, 3);
        seedMockAlumniRecord(regNo, "Current User Test", dob);

        AlumniRegisterRequest registerRequest = new AlumniRegisterRequest(
                email, "SecurePass@123", regNo, "Current User Test", dob);

        MvcResult registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode responseNode = objectMapper.readTree(registerResult.getResponse().getContentAsString());
        String token = responseNode.path("data").path("accessToken").asText();

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is(email.toLowerCase())))
                .andExpect(jsonPath("$.data.fullName", is("Current User Test")))
                .andExpect(jsonPath("$.data.roles", hasItem("ROLE_ALUMNI")));
    }

    @Test
    @DisplayName("Should reject accessing /api/v1/auth/me without token (HTTP 401)")
    void testGetCurrentUserWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }
}
