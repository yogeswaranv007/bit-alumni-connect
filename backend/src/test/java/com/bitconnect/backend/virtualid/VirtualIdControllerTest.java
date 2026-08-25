package com.bitconnect.backend.virtualid;

import com.bitconnect.backend.modules.alumni.dto.AlumniProfileCreateRequest;
import com.bitconnect.backend.modules.auth.dto.RegisterRequest;
import com.bitconnect.backend.modules.department.entity.Department;
import com.bitconnect.backend.modules.department.repository.DepartmentRepository;
import com.bitconnect.backend.modules.user.entity.Role;
import com.bitconnect.backend.modules.user.entity.RoleName;
import com.bitconnect.backend.modules.user.entity.User;
import com.bitconnect.backend.modules.user.repository.RoleRepository;
import com.bitconnect.backend.modules.user.repository.UserRepository;
import com.bitconnect.backend.modules.virtualid.dto.VirtualIdStatusUpdateRequest;
import com.bitconnect.backend.modules.virtualid.entity.VirtualIdStatus;
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
import java.util.HashSet;
import java.util.Set;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
class VirtualIdControllerTest {

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
        String adminEmail = "admin.vid." + System.currentTimeMillis() + "@bitsathy.ac.in";
        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_ADMIN)));

        User admin = User.builder()
                .email(adminEmail)
                .fullName("Admin Officer")
                .password(passwordEncoder.encode("AdminPassword@123"))
                .isActive(true)
                .roles(new HashSet<>(Set.of(adminRole)))
                .build();

        User savedAdmin = userRepository.save(admin);
        UserPrincipal principal = UserPrincipal.create(savedAdmin);
        return jwtTokenProvider.generateTokenFromUser(principal);
    }

    @Test
    @DisplayName("Complete Virtual ID flow: automatic issuance on verification, digital card display, QR scan, regeneration, and admin suspension")
    void testVirtualIdAndQrVerificationFullWorkflow() throws Exception {
        Department cseDept = departmentRepository.findByCode("CSE").orElseThrow();

        String email = "alumni.vid." + System.currentTimeMillis() + "@bitsathy.ac.in";
        String alumniToken = createAlumniAndGetToken(email, "Karthik Subramanian");
        String adminToken = createAdminAndGetToken();

        String rollNo = "21CS" + (System.currentTimeMillis() % 100000);
        String regNo = "7376211CS" + (System.currentTimeMillis() % 100000);

        // 1. Submit Alumni Profile
        AlumniProfileCreateRequest profileReq = new AlumniProfileCreateRequest(
                cseDept.getId(),
                rollNo,
                regNo,
                "B.E.",
                2021,
                2025,
                "https://example.com/karthik.jpg",
                LocalDate.of(2003, 8, 20),
                "B+",
                "karthik.sub@gmail.com",
                "+919876543299",
                "BIT Campus, Sathyamangalam",
                "Erode",
                "Tamil Nadu",
                "India",
                "638401",
                "Microsoft",
                "Software Engineer",
                "Technology",
                "https://linkedin.com/in/karthiksub",
                true
        );

        MvcResult profileResult = mockMvc.perform(post("/api/v1/alumni/profile")
                        .header("Authorization", "Bearer " + alumniToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String profileId = objectMapper.readTree(profileResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // 2. Admin verifies profile -> triggers automatic Virtual ID issuance
        mockMvc.perform(patch("/api/v1/admin/alumni/" + profileId + "/verify")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus", is("VERIFIED")));

        // 3. Alumni views own Virtual ID digital card
        MvcResult cardResult = mockMvc.perform(get("/api/v1/alumni/virtual-id/me")
                        .header("Authorization", "Bearer " + alumniToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.alumniIdCardNumber", startsWith("BIT-ALU-2025-")))
                .andExpect(jsonPath("$.data.fullName", is("Karthik Subramanian")))
                .andExpect(jsonPath("$.data.departmentCode", is("CSE")))
                .andExpect(jsonPath("$.data.bloodGroup", is("B+")))
                .andExpect(jsonPath("$.data.qrCodeBase64", startsWith("data:image/png;base64,")))
                .andExpect(jsonPath("$.data.verificationUrl", containsString("/verify/")))
                .andReturn();

        JsonNode cardNode = objectMapper.readTree(cardResult.getResponse().getContentAsString()).path("data");
        String initialToken = cardNode.path("activeToken").asText();
        String virtualId = cardNode.path("id").asText();

        // 4. Public QR Scan Verification (no auth header)
        mockMvc.perform(get("/api/v1/verify/" + initialToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid", is(true)))
                .andExpect(jsonPath("$.data.fullName", is("Karthik Subramanian")))
                .andExpect(jsonPath("$.data.alumniIdNumber", startsWith("BIT-ALU-2025-")))
                .andExpect(jsonPath("$.data.departmentCode", is("CSE")))
                .andExpect(jsonPath("$.data.degree", is("B.E.")))
                .andExpect(jsonPath("$.data.batchEndYear", is(2025)))
                .andExpect(jsonPath("$.data.scanCount", is(1)))
                // Verify ZERO sensitive PII is exposed
                .andExpect(jsonPath("$.data.phoneNumber").doesNotExist())
                .andExpect(jsonPath("$.data.rollNumber").doesNotExist())
                .andExpect(jsonPath("$.data.permanentAddress").doesNotExist());

        // Second scan increases scan audit count to 2
        mockMvc.perform(get("/api/v1/verify/" + initialToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.scanCount", is(2)));

        // 5. Alumni regenerates QR token (rotates token)
        MvcResult regenResult = mockMvc.perform(post("/api/v1/alumni/virtual-id/regenerate-qr")
                        .header("Authorization", "Bearer " + alumniToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.qrCodeBase64", startsWith("data:image/png;base64,")))
                .andReturn();

        String newToken = objectMapper.readTree(regenResult.getResponse().getContentAsString())
                .path("data").path("activeToken").asText();

        // 6. Old token is now revoked and invalid
        mockMvc.perform(get("/api/v1/verify/" + initialToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid", is(false)))
                .andExpect(jsonPath("$.data.status", is("INVALID")));

        // 7. New token verifies successfully
        mockMvc.perform(get("/api/v1/verify/" + newToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid", is(true)))
                .andExpect(jsonPath("$.data.scanCount", is(1)));

        // 8. Admin suspends Virtual ID
        VirtualIdStatusUpdateRequest suspendReq = new VirtualIdStatusUpdateRequest(VirtualIdStatus.SUSPENDED);
        mockMvc.perform(patch("/api/v1/admin/virtual-ids/" + virtualId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(suspendReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("SUSPENDED")));

        // 9. Public scan on suspended ID fails
        mockMvc.perform(get("/api/v1/verify/" + newToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid", is(false)))
                .andExpect(jsonPath("$.data.status", is("INVALID")));
    }
}
