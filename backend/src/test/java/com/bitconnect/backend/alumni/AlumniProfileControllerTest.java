package com.bitconnect.backend.alumni;

import com.bitconnect.backend.modules.alumni.dto.AlumniProfileCreateRequest;
import com.bitconnect.backend.modules.alumni.dto.AlumniProfileUpdateRequest;
import com.bitconnect.backend.modules.alumni.dto.AlumniRejectRequest;
import com.bitconnect.backend.modules.auth.dto.RegisterRequest;
import com.bitconnect.backend.modules.department.entity.Department;
import com.bitconnect.backend.modules.department.repository.DepartmentRepository;
import com.bitconnect.backend.modules.user.entity.Role;
import com.bitconnect.backend.modules.user.entity.RoleName;
import com.bitconnect.backend.modules.user.entity.User;
import com.bitconnect.backend.modules.user.repository.RoleRepository;
import com.bitconnect.backend.modules.user.repository.UserRepository;
import com.bitconnect.backend.security.JwtTokenProvider;
import com.bitconnect.backend.security.UserPrincipal;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
class AlumniProfileControllerTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    private String createAlumniAndGetToken(String email, String name) throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(name, email, "Password@123");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.path("data").path("accessToken").asText();
    }

    private String createAdminAndGetToken() {
        String adminEmail = "admin." + System.currentTimeMillis() + "@bitsathy.ac.in";
        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_ADMIN)));

        User admin = User.builder()
                .email(adminEmail)
                .fullName("System Administrator")
                .password(passwordEncoder.encode("AdminPassword@123"))
                .isActive(true)
                .roles(new HashSet<>(Set.of(adminRole)))
                .build();

        User savedAdmin = userRepository.save(admin);
        UserPrincipal principal = UserPrincipal.create(savedAdmin);
        return jwtTokenProvider.generateTokenFromUser(principal);
    }

    @Test
    @DisplayName("Should list all active departments without authentication")
    void testGetDepartments() throws Exception {
        mockMvc.perform(get("/api/v1/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.length()", greaterThanOrEqualTo(10)))
                .andExpect(jsonPath("$.data[?(@.code == 'IT')].name", hasItem("Information Technology")));
    }

    @Test
    @DisplayName("Complete alumni lifecycle: create, get, update, verify, directory search, reject, reset on update")
    void testAlumniProfileFullLifecycle() throws Exception {
        Department itDept = departmentRepository.findByCode("IT")
                .orElseThrow();

        String email = "lifecycle." + System.currentTimeMillis() + "@bitsathy.ac.in";
        String alumniToken = createAlumniAndGetToken(email, "Praveen Kumar");
        String adminToken = createAdminAndGetToken();

        String rollNo = "20IT" + (System.currentTimeMillis() % 100000);
        String regNo = "7376202IT" + (System.currentTimeMillis() % 100000);

        // 1. Submit initial profile
        AlumniProfileCreateRequest createReq = new AlumniProfileCreateRequest(
                itDept.getId(),
                rollNo,
                regNo,
                "B.Tech",
                2020,
                2024,
                "https://example.com/photo.jpg",
                LocalDate.of(2002, 5, 15),
                "O+",
                "praveen.personal@gmail.com",
                "+919876543210",
                "123 College Road, Sathyamangalam",
                "Erode",
                "Tamil Nadu",
                "India",
                "638401",
                "Amazon",
                "Software Development Engineer",
                "Technology",
                "https://linkedin.com/in/praveenkumar",
                true
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/alumni/profile")
                        .header("Authorization", "Bearer " + alumniToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.verificationStatus", is("PENDING")))
                .andExpect(jsonPath("$.data.rollNumber", is(rollNo)))
                .andExpect(jsonPath("$.data.department.code", is("IT")))
                .andReturn();

        JsonNode createNode = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String profileId = createNode.path("data").path("id").asText();

        // 2. Prevent duplicate profile creation
        mockMvc.perform(post("/api/v1/alumni/profile")
                        .header("Authorization", "Bearer " + alumniToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("already exists for this user")));

        // 3. Get own profile
        mockMvc.perform(get("/api/v1/alumni/profile/me")
                        .header("Authorization", "Bearer " + alumniToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName", is("Praveen Kumar")))
                .andExpect(jsonPath("$.data.currentCompany", is("Amazon")));

        // 4. Update own profile
        AlumniProfileUpdateRequest updateReq = new AlumniProfileUpdateRequest(
                "https://example.com/new-photo.jpg",
                LocalDate.of(2002, 5, 15),
                "O+",
                "praveen.new@gmail.com",
                "+919876543211",
                "456 New Road",
                "Bengaluru",
                "Karnataka",
                "India",
                "560001",
                "Google",
                "Senior SDE",
                "Technology",
                "https://linkedin.com/in/praveenkumar-google",
                true
        );

        mockMvc.perform(put("/api/v1/alumni/profile/me")
                        .header("Authorization", "Bearer " + alumniToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentCompany", is("Google")))
                .andExpect(jsonPath("$.data.city", is("Bengaluru")));

        // 5. Admin verifies profile
        mockMvc.perform(patch("/api/v1/admin/alumni/" + profileId + "/verify")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus", is("VERIFIED")));

        // 6. Search directory -> Verified alumni must appear with privacy-safe fields
        mockMvc.perform(get("/api/v1/alumni/directory")
                        .header("Authorization", "Bearer " + alumniToken)
                        .param("search", "Praveen")
                        .param("departmentId", String.valueOf(itDept.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].fullName", is("Praveen Kumar")))
                .andExpect(jsonPath("$.data.content[0].currentCompany", is("Google")))
                .andExpect(jsonPath("$.data.content[0].rollNumber").doesNotExist())
                .andExpect(jsonPath("$.data.content[0].phoneNumber").doesNotExist());

        // 7. Admin rejects profile with reason
        AlumniRejectRequest rejectReq = new AlumniRejectRequest("Register number verification pending from university.");
        mockMvc.perform(patch("/api/v1/admin/alumni/" + profileId + "/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus", is("REJECTED")))
                .andExpect(jsonPath("$.data.rejectionReason", containsString("university")));

        // 8. Rejected profile should no longer appear in directory
        mockMvc.perform(get("/api/v1/alumni/directory")
                        .header("Authorization", "Bearer " + alumniToken)
                        .param("search", "Praveen"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(0)));

        // 9. When rejected alumni resubmits/updates profile, status resets to PENDING
        mockMvc.perform(put("/api/v1/alumni/profile/me")
                        .header("Authorization", "Bearer " + alumniToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus", is("PENDING")))
                .andExpect(jsonPath("$.data.rejectionReason").doesNotExist());
    }
}
