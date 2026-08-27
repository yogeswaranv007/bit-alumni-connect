package com.bitconnect.backend.profilechange;

import com.bitconnect.backend.modules.alumni.dto.AlumniProfileCreateRequest;
import com.bitconnect.backend.modules.auth.dto.RegisterRequest;
import com.bitconnect.backend.modules.department.entity.Department;
import com.bitconnect.backend.modules.department.repository.DepartmentRepository;
import com.bitconnect.backend.modules.profilechange.dto.ProfileChangeRequestCreateRequest;
import com.bitconnect.backend.modules.profilechange.dto.ProfileChangeRequestReviewRequest;
import com.bitconnect.backend.modules.profilechange.dto.ProfileChangeRequestUpdateRequest;
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
import java.util.HashSet;
import java.util.Set;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
class ProfileChangeRequestIntegrationTest {

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
        String adminEmail = "admin.cr." + System.currentTimeMillis() + "@bitsathy.ac.in";
        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_ADMIN)));

        User admin = User.builder()
                .email(adminEmail)
                .fullName("Admin Approver")
                .password(passwordEncoder.encode("AdminPassword@123"))
                .isActive(true)
                .roles(new HashSet<>(Set.of(adminRole)))
                .build();

        User savedAdmin = userRepository.save(admin);
        UserPrincipal principal = UserPrincipal.create(savedAdmin);
        return jwtTokenProvider.generateTokenFromUser(principal);
    }

    @Test
    @DisplayName("Complete Profile Change Request Workflow: Submission, Rejection, Resubmission, Approval, QR Token Rotation & Verification")
    void testProfileChangeRequestCompleteLifecycle() throws Exception {
        Department itDept = departmentRepository.findByCode("IT").orElseThrow();

        String email = "alumni.pcr." + System.currentTimeMillis() + "@bitsathy.ac.in";
        String alumniToken = createAlumniAndGetToken(email, "Suresh Kumar");
        String adminToken = createAdminAndGetToken();

        String rollNo = "22IT" + (System.currentTimeMillis() % 100000);
        String regNo = "7376222IT" + (System.currentTimeMillis() % 100000);

        // 1. Submit Initial Alumni Profile
        AlumniProfileCreateRequest profileReq = new AlumniProfileCreateRequest(
                itDept.getId(),
                rollNo,
                regNo,
                "B.Tech",
                2022,
                2026,
                "https://example.com/suresh_old.jpg",
                LocalDate.of(2004, 3, 10),
                "O+",
                "suresh.original@gmail.com",
                "+919876543210",
                "123 Anna Nagar",
                "Erode",
                "Tamil Nadu",
                "India",
                "638001",
                "Zoho Corp",
                "Member Technical Staff",
                "Software",
                "https://linkedin.com/in/sureshk",
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

        // 2. Admin verifies profile -> Virtual ID and initial QR Token are issued
        mockMvc.perform(patch("/api/v1/admin/alumni/" + profileId + "/verify")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus", is("VERIFIED")));

        // Get initial card details & active QR token
        MvcResult cardResult = mockMvc.perform(get("/api/v1/alumni/virtual-id/me")
                        .header("Authorization", "Bearer " + alumniToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.alumniIdCardNumber", notNullValue()))
                .andReturn();

        JsonNode initialCard = objectMapper.readTree(cardResult.getResponse().getContentAsString()).path("data");
        String initialCardNumber = initialCard.path("alumniIdCardNumber").asText();
        String initialQrToken = initialCard.path("activeToken").asText();

        // Initial token verification is valid
        mockMvc.perform(get("/api/v1/verify/" + initialQrToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid", is(true)))
                .andExpect(jsonPath("$.data.fullName", is("Suresh Kumar")));

        // 3. Alumnus submits a Profile Change Request
        ProfileChangeRequestCreateRequest changeReq = new ProfileChangeRequestCreateRequest(
                "Suresh Kumar S",
                "https://example.com/suresh_new_passport.jpg",
                null,
                null,
                "suresh.updated@gmail.com",
                "+919999988888",
                "456 Gandhi Road",
                "Coimbatore",
                "Tamil Nadu",
                "India",
                "641001",
                "Google India",
                "Senior Software Engineer",
                "Cloud AI",
                "https://linkedin.com/in/sureshkumars",
                null,
                null,
                null,
                null,
                null,
                null,
                true
        );

        MvcResult changeResult = mockMvc.perform(post("/api/v1/alumni/profile/change-requests")
                        .header("Authorization", "Bearer " + alumniToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changeReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status", is("PENDING")))
                .andReturn();

        String requestId = objectMapper.readTree(changeResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // 4. Verify official profile remains UNCHANGED while request is PENDING
        mockMvc.perform(get("/api/v1/alumni/profile/me")
                        .header("Authorization", "Bearer " + alumniToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName", is("Suresh Kumar")))
                .andExpect(jsonPath("$.data.profilePhotoUrl", is("https://example.com/suresh_old.jpg")))
                .andExpect(jsonPath("$.data.phoneNumber", is("+919876543210")));

        // 5. Admin lists change requests & views detail with Proposed Digital ID Preview
        mockMvc.perform(get("/api/v1/admin/profile-change-requests")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("status", "PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id", is(requestId)));

        mockMvc.perform(get("/api/v1/admin/profile-change-requests/" + requestId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.changedFields", hasItem("profilePhotoUrl")))
                .andExpect(jsonPath("$.data.changedFields", hasItem("phoneNumber")))
                .andExpect(jsonPath("$.data.proposedVirtualIdPreview.fullName", is("Suresh Kumar S")))
                .andExpect(jsonPath("$.data.proposedVirtualIdPreview.profilePhotoUrl", is("https://example.com/suresh_new_passport.jpg")))
                .andExpect(jsonPath("$.data.proposedVirtualIdPreview.alumniIdCardNumber", is(initialCardNumber)));

        // 6. Admin REJECTS request with mandatory comment
        ProfileChangeRequestReviewRequest rejectReq = new ProfileChangeRequestReviewRequest(
                "Please upload a clearer passport-size photograph with white background."
        );

        mockMvc.perform(patch("/api/v1/admin/profile-change-requests/" + requestId + "/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("REJECTED")))
                .andExpect(jsonPath("$.data.adminComment", containsString("clearer passport-size photograph")));

        // 7. Alumnus sees rejection comment
        mockMvc.perform(get("/api/v1/alumni/profile/change-requests/" + requestId)
                        .header("Authorization", "Bearer " + alumniToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("REJECTED")))
                .andExpect(jsonPath("$.data.adminComment", containsString("clearer passport-size photograph")));

        // 8. Alumnus edits the rejected request with a new photo and resubmits
        ProfileChangeRequestUpdateRequest updateReq = new ProfileChangeRequestUpdateRequest(
                "Suresh Kumar S",
                "https://example.com/suresh_hd_photo.jpg",
                null,
                null,
                "suresh.updated@gmail.com",
                "+919999988888",
                "456 Gandhi Road",
                "Coimbatore",
                "Tamil Nadu",
                "India",
                "641001",
                "Google India",
                "Senior Software Engineer",
                "Cloud AI",
                "https://linkedin.com/in/sureshkumars",
                null,
                null,
                null,
                null,
                null,
                null,
                true
        );

        mockMvc.perform(put("/api/v1/alumni/profile/change-requests/" + requestId)
                        .header("Authorization", "Bearer " + alumniToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk());

        // Resubmit request (REJECTED -> PENDING)
        mockMvc.perform(post("/api/v1/alumni/profile/change-requests/" + requestId + "/resubmit")
                        .header("Authorization", "Bearer " + alumniToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("PENDING")));

        // 9. Admin APPROVES the resubmitted change request
        mockMvc.perform(patch("/api/v1/admin/profile-change-requests/" + requestId + "/approve")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("comment", "Approved. Digital ID updated."))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("APPROVED")));

        // 10. Official profile is now updated with the approved values
        mockMvc.perform(get("/api/v1/alumni/profile/me")
                        .header("Authorization", "Bearer " + alumniToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName", is("Suresh Kumar S")))
                .andExpect(jsonPath("$.data.profilePhotoUrl", is("https://example.com/suresh_hd_photo.jpg")))
                .andExpect(jsonPath("$.data.phoneNumber", is("+919999988888")))
                .andExpect(jsonPath("$.data.currentCompany", is("Google India")));

        // 11. Permanent Alumni ID number is PRESERVED, new QR token is generated
        MvcResult updatedCardResult = mockMvc.perform(get("/api/v1/alumni/virtual-id/me")
                        .header("Authorization", "Bearer " + alumniToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.alumniIdCardNumber", is(initialCardNumber)))
                .andExpect(jsonPath("$.data.fullName", is("Suresh Kumar S")))
                .andExpect(jsonPath("$.data.profilePhotoUrl", is("https://example.com/suresh_hd_photo.jpg")))
                .andReturn();

        String newQrToken = objectMapper.readTree(updatedCardResult.getResponse().getContentAsString())
                .path("data").path("activeToken").asText();

        // 12. Old QR token is now REVOKED and invalid
        mockMvc.perform(get("/api/v1/verify/" + initialQrToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid", is(false)))
                .andExpect(jsonPath("$.data.status", is("INVALID")));

        // 13. New QR token verifies successfully with updated alumnus details
        mockMvc.perform(get("/api/v1/verify/" + newQrToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid", is(true)))
                .andExpect(jsonPath("$.data.fullName", is("Suresh Kumar S")))
                .andExpect(jsonPath("$.data.alumniIdNumber", is(initialCardNumber)));
    }
}
