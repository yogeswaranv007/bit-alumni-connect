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
        String uniqueName = "Praveen" + (System.currentTimeMillis() % 100000);
        String alumniToken = createAlumniAndGetToken(email, uniqueName);
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
                .andExpect(jsonPath("$.data.fullName", is(uniqueName)))
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
                true,
                null,
                null,
                null,
                null,
                null,
                null
        );

        mockMvc.perform(put("/api/v1/alumni/profile/me")
                        .header("Authorization", "Bearer " + alumniToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentCompany", is("Google")))
                .andExpect(jsonPath("$.data.city", is("Bengaluru")));

        // 5. Admin rejects profile with reason
        AlumniRejectRequest rejectReq = new AlumniRejectRequest("Register number verification pending from university.");
        mockMvc.perform(patch("/api/v1/admin/alumni/" + profileId + "/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus", is("REJECTED")))
                .andExpect(jsonPath("$.data.rejectionReason", containsString("university")));

        // 6. Admin CANNOT approve a rejected profile (Must be rejected until alumni modifies and resubmits)
        mockMvc.perform(patch("/api/v1/admin/alumni/" + profileId + "/verify")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Cannot approve a rejected profile")));

        // 7. Rejected profile should not appear in directory
        mockMvc.perform(get("/api/v1/alumni/directory")
                        .header("Authorization", "Bearer " + alumniToken)
                        .param("search", uniqueName))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(0)));

        // 8. When rejected alumni modifies their details and resubmits, status resets to PENDING
        mockMvc.perform(put("/api/v1/alumni/profile/me")
                        .header("Authorization", "Bearer " + alumniToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus", is("PENDING")))
                .andExpect(jsonPath("$.data.rejectionReason").doesNotExist());

        // 9. Now Admin can verify the newly modified and resubmitted profile
        mockMvc.perform(patch("/api/v1/admin/alumni/" + profileId + "/verify")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus", is("VERIFIED")));

        // 10. Verified profile now appears in public directory
        mockMvc.perform(get("/api/v1/alumni/directory")
                        .header("Authorization", "Bearer " + alumniToken)
                        .param("search", uniqueName)
                        .param("departmentId", String.valueOf(itDept.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].fullName", is(uniqueName)))
                .andExpect(jsonPath("$.data.content[0].currentCompany", is("Google")));
    }

    @Test
    @DisplayName("Should reject profile submission when Register Number department code does not match selected department")
    void testDepartmentCodeMismatchRejection() throws Exception {
        Department aidsDept = departmentRepository.findByCode("AIDS")
                .orElseGet(() -> departmentRepository.save(new Department("AIDS", "Artificial Intelligence and Data Science", "AIDS Dept")));

        String email = "deptmismatch." + System.currentTimeMillis() + "@bitsathy.ac.in";
        String token = createAlumniAndGetToken(email, "Student Test");

        String uniqueSuffix = String.valueOf(System.currentTimeMillis() % 100000);
        // Register number has IT, but department selected is AIDS
        AlumniProfileCreateRequest mismatchReq = new AlumniProfileCreateRequest(
                aidsDept.getId(),
                "23IT" + uniqueSuffix,
                "7376232IT" + uniqueSuffix,
                "B.Tech",
                2023,
                2027,
                null,
                null,
                null,
                "test@gmail.com",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                true
        );

        mockMvc.perform(post("/api/v1/alumni/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(mismatchReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("contains department code 'IT'")))
                .andExpect(jsonPath("$.message", containsString("does not match the selected department 'AIDS'")));
    }
}
