package com.bitconnect.backend.auth;

import com.bitconnect.backend.modules.auth.dto.LoginRequest;
import com.bitconnect.backend.modules.auth.dto.RegisterRequest;
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

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    @DisplayName("Should successfully register alumni user, assign ROLE_ALUMNI, and return JWT")
    void testRegisterSuccess() throws Exception {
        String uniqueEmail = "alumni." + System.currentTimeMillis() + "@bitsathy.ac.in";
        RegisterRequest request = new RegisterRequest("Kavitha Raman", uniqueEmail, "Password@123");

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
        RegisterRequest request = new RegisterRequest("Duplicate User", uniqueEmail, "Password@123");

        // First registration
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Second registration with same email
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("already in use")));
    }

    @Test
    @DisplayName("Should reject invalid registration payload with validation errors (HTTP 400)")
    void testRegisterInvalidPayload() throws Exception {
        RegisterRequest invalidRequest = new RegisterRequest("", "not-an-email", "short");

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
        RegisterRequest registerRequest = new RegisterRequest("Login Test", email, "SecurePass@123");

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
        RegisterRequest registerRequest = new RegisterRequest("Current User Test", email, "SecurePass@123");

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
