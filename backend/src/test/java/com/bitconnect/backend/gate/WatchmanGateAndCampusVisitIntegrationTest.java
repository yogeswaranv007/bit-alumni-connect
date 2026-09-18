package com.bitconnect.backend.gate;

import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.alumni.entity.VerificationStatus;
import com.bitconnect.backend.modules.alumni.repository.AlumniProfileRepository;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitCreateRequest;
import com.bitconnect.backend.modules.campusvisit.dto.CampusVisitReviewRequest;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisit;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitEvent;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitStatus;
import com.bitconnect.backend.modules.campusvisit.entity.CampusVisitType;
import com.bitconnect.backend.modules.campusvisit.repository.CampusVisitEventRepository;
import com.bitconnect.backend.modules.campusvisit.repository.CampusVisitRepository;
import com.bitconnect.backend.modules.department.entity.Department;
import com.bitconnect.backend.modules.department.repository.DepartmentRepository;
import com.bitconnect.backend.modules.event.entity.Event;
import com.bitconnect.backend.modules.event.entity.EventLocationType;
import com.bitconnect.backend.modules.event.entity.EventParticipant;
import com.bitconnect.backend.modules.event.entity.EventType;
import com.bitconnect.backend.modules.event.entity.ParticipantStatus;
import com.bitconnect.backend.modules.event.repository.EventParticipantRepository;
import com.bitconnect.backend.modules.event.repository.EventRepository;
import com.bitconnect.backend.modules.gate.dto.WatchmanEntryRequest;
import com.bitconnect.backend.modules.gate.entity.CampusEntryLog;
import com.bitconnect.backend.modules.gate.entity.EntryDecision;
import com.bitconnect.backend.modules.gate.entity.VerificationMethod;
import com.bitconnect.backend.modules.gate.repository.CampusEntryLogRepository;
import com.bitconnect.backend.modules.notification.entity.Notification;
import com.bitconnect.backend.modules.notification.entity.NotificationType;
import com.bitconnect.backend.modules.notification.repository.NotificationRepository;
import com.bitconnect.backend.modules.rfid.entity.RfidIdentityMapping;
import com.bitconnect.backend.modules.rfid.entity.RfidStatus;
import com.bitconnect.backend.modules.rfid.repository.RfidIdentityMappingRepository;
import com.bitconnect.backend.modules.staff.entity.StaffProfile;
import com.bitconnect.backend.modules.staff.repository.StaffProfileRepository;
import com.bitconnect.backend.modules.user.entity.Role;
import com.bitconnect.backend.modules.user.entity.RoleName;
import com.bitconnect.backend.modules.user.entity.User;
import com.bitconnect.backend.modules.user.repository.RoleRepository;
import com.bitconnect.backend.modules.user.repository.UserRepository;
import com.bitconnect.backend.modules.virtualid.entity.QrVerificationToken;
import com.bitconnect.backend.modules.virtualid.entity.TokenStatus;
import com.bitconnect.backend.modules.virtualid.entity.VirtualAlumniId;
import com.bitconnect.backend.modules.virtualid.entity.VirtualIdStatus;
import com.bitconnect.backend.modules.virtualid.repository.QrVerificationTokenRepository;
import com.bitconnect.backend.modules.virtualid.repository.VirtualAlumniIdRepository;
import com.bitconnect.backend.modules.virtualid.service.VirtualIdService;
import com.bitconnect.backend.security.JwtTokenProvider;
import com.bitconnect.backend.security.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
class WatchmanGateAndCampusVisitIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private AlumniProfileRepository alumniProfileRepository;

    @Autowired
    private StaffProfileRepository staffProfileRepository;

    @Autowired
    private VirtualAlumniIdRepository virtualIdRepository;

    @Autowired
    private QrVerificationTokenRepository qrTokenRepository;

    @Autowired
    private RfidIdentityMappingRepository rfidRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private EventParticipantRepository eventParticipantRepository;

    @Autowired
    private CampusVisitRepository campusVisitRepository;

    @Autowired
    private CampusVisitEventRepository campusVisitEventRepository;

    @Autowired
    private CampusEntryLogRepository campusEntryLogRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private VirtualIdService virtualIdService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private String alumniToken;
    private String adminToken;
    private String watchmanToken;
    private String facultyToken;
    private String otherFacultyToken;

    private User alumniUser;
    private User adminUser;
    private User watchmanUser;
    private User facultyUser;
    private User otherFacultyUser;

    private AlumniProfile alumniProfile;
    private Department itDept;
    private Department eceDept;
    private VirtualAlumniId virtualId;
    private QrVerificationToken qrToken;
    private RfidIdentityMapping rfidMapping;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        Role alumniRole = roleRepository.findByName(RoleName.ROLE_ALUMNI).orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_ALUMNI)));
        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN).orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_ADMIN)));
        Role staffRole = roleRepository.findByName(RoleName.ROLE_STAFF).orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_STAFF)));
        Role watchmanRole = roleRepository.findByName(RoleName.ROLE_WATCHMAN).orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_WATCHMAN)));

        itDept = departmentRepository.findByCode("IT").orElseGet(() -> departmentRepository.save(new Department("IT", "Information Technology", "IT Dept")));
        eceDept = departmentRepository.findByCode("ECE").orElseGet(() -> departmentRepository.save(new Department("ECE", "Electronics and Communication Engineering", "ECE Dept")));

        String testSuffix = UUID.randomUUID().toString().substring(0, 8);

        // 1. Alumni User & Verified Profile
        alumniUser = User.builder()
                .email("arun." + testSuffix + "@bitsathy.ac.in")
                .fullName("Arun Kumar")
                .password(passwordEncoder.encode("Password@123"))
                .isActive(true)
                .roles(new HashSet<>(Set.of(alumniRole)))
                .build();
        alumniUser = userRepository.save(alumniUser);
        alumniToken = jwtTokenProvider.generateTokenFromUser(UserPrincipal.create(alumniUser));

        alumniProfile = AlumniProfile.builder()
                .user(alumniUser)
                .department(itDept)
                .rollNumber("ARUN" + testSuffix)
                .registerNumber("7376ARUN" + testSuffix)
                .degree("B.Tech")
                .batchStartYear(2020)
                .batchEndYear(2024)
                .verificationStatus(VerificationStatus.VERIFIED)
                .verifiedAt(Instant.now())
                .isDirectoryVisible(true)
                .build();
        alumniProfile = alumniProfileRepository.save(alumniProfile);

        virtualId = virtualIdService.issueVirtualId(alumniProfile);
        qrToken = qrTokenRepository.findActiveTokenByVirtualIdId(virtualId.getId(), TokenStatus.ACTIVE).orElseThrow();

        rfidMapping = RfidIdentityMapping.builder()
                .alumniProfile(alumniProfile)
                .rfidUid("RFID-UID-" + testSuffix)
                .cardNumber("CARD-" + testSuffix)
                .status(RfidStatus.ACTIVE)
                .issuedDate(LocalDate.now())
                .build();
        rfidMapping = rfidRepository.save(rfidMapping);

        // 2. Admin User
        adminUser = User.builder()
                .email("admin." + testSuffix + "@bitsathy.ac.in")
                .fullName("Admin Officer")
                .password(passwordEncoder.encode("Password@123"))
                .isActive(true)
                .roles(new HashSet<>(Set.of(adminRole)))
                .build();
        adminUser = userRepository.save(adminUser);
        adminToken = jwtTokenProvider.generateTokenFromUser(UserPrincipal.create(adminUser));

        // 3. Watchman User
        watchmanUser = User.builder()
                .email("watchman." + testSuffix + "@bitsathy.ac.in")
                .fullName("Main Gate Watchman")
                .password(passwordEncoder.encode("Password@123"))
                .isActive(true)
                .roles(new HashSet<>(Set.of(watchmanRole)))
                .build();
        watchmanUser = userRepository.save(watchmanUser);
        watchmanToken = jwtTokenProvider.generateTokenFromUser(UserPrincipal.create(watchmanUser));

        // 4. IT Faculty User
        facultyUser = User.builder()
                .email("faculty.it." + testSuffix + "@bitsathy.ac.in")
                .fullName("Dr. Suresh Kumar")
                .password(passwordEncoder.encode("Password@123"))
                .isActive(true)
                .roles(new HashSet<>(Set.of(staffRole)))
                .build();
        facultyUser = userRepository.save(facultyUser);
        facultyToken = jwtTokenProvider.generateTokenFromUser(UserPrincipal.create(facultyUser));

        StaffProfile itStaff = StaffProfile.builder()
                .user(facultyUser)
                .department(itDept)
                .staffCode("STF-IT-" + testSuffix)
                .designation("Professor & HOD")
                .build();
        staffProfileRepository.save(itStaff);

        // 5. Other (ECE) Faculty User
        otherFacultyUser = User.builder()
                .email("faculty.ece." + testSuffix + "@bitsathy.ac.in")
                .fullName("Dr. Ramesh Babu")
                .password(passwordEncoder.encode("Password@123"))
                .isActive(true)
                .roles(new HashSet<>(Set.of(staffRole)))
                .build();
        otherFacultyUser = userRepository.save(otherFacultyUser);
        otherFacultyToken = jwtTokenProvider.generateTokenFromUser(UserPrincipal.create(otherFacultyUser));

        StaffProfile eceStaff = StaffProfile.builder()
                .user(otherFacultyUser)
                .department(eceDept)
                .staffCode("STF-ECE-" + testSuffix)
                .designation("Professor & HOD ECE")
                .build();
        staffProfileRepository.save(eceStaff);
    }

    // ==========================================
    // 1. IDENTITY & AUTHORIZATION GATE TESTS
    // ==========================================

    @Test
    @DisplayName("Option A: Valid QR + Approved Visit for Today -> ALLOWED + Today's Activities")
    void testValidQrWithApprovedVisitToday_ReturnsAllowed() throws Exception {
        // Create approved visit for today
        CampusVisit visit = CampusVisit.builder()
                .alumniProfile(alumniProfile)
                .visitDate(LocalDate.now())
                .preferredArrivalTime(LocalTime.of(10, 30))
                .approvedArrivalTime(LocalTime.of(10, 30))
                .purpose("IT Faculty Meeting")
                .visitType(CampusVisitType.FACULTY_MEETING)
                .department(itDept)
                .assignedFaculty(facultyUser)
                .status(CampusVisitStatus.APPROVED)
                .approvedBy(facultyUser)
                .approverRole(RoleName.ROLE_STAFF)
                .approvedAt(Instant.now())
                .meetingLocation("IT Block Room 204")
                .contactPerson("Dr. Suresh Kumar")
                .build();
        visit = campusVisitRepository.save(visit);

        // Associate 2 activities for today
        Event event1 = Event.builder()
                .title("IT Faculty Meeting")
                .eventType(EventType.FACULTY_MEETING)
                .locationType(EventLocationType.ON_CAMPUS)
                .venue("IT Block Room 204")
                .eventDate(LocalDate.now())
                .startTime(LocalTime.of(10, 30))
                .endTime(LocalTime.of(11, 30))
                .department(itDept)
                .organizer("Dr. Suresh Kumar")
                .isActive(true)
                .build();
        event1 = eventRepository.save(event1);

        Event event2 = Event.builder()
                .title("Alumni Association General Body Meet")
                .eventType(EventType.ALUMNI_MEET)
                .locationType(EventLocationType.ON_CAMPUS)
                .venue("Alumni Centre")
                .eventDate(LocalDate.now())
                .startTime(LocalTime.of(12, 0))
                .endTime(LocalTime.of(13, 0))
                .organizer("Alumni Association")
                .isActive(true)
                .build();
        event2 = eventRepository.save(event2);

        campusVisitEventRepository.save(CampusVisitEvent.builder().campusVisit(visit).event(event1).build());
        campusVisitEventRepository.save(CampusVisitEvent.builder().campusVisit(visit).event(event2).build());

        // Watchman verifies by QR token
        mockMvc.perform(post("/api/v1/watchman/verify/qr")
                        .header("Authorization", "Bearer " + watchmanToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("qrToken", qrToken.getToken()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.decision", is("ALLOWED")))
                .andExpect(jsonPath("$.data.verificationMethod", is("DIGITAL_ID_QR")))
                .andExpect(jsonPath("$.data.alumni.fullName", is("Arun Kumar")))
                .andExpect(jsonPath("$.data.alumni.rollNumber", is(alumniProfile.getRollNumber())))
                .andExpect(jsonPath("$.data.campusVisit.purpose", is("IT Faculty Meeting")))
                .andExpect(jsonPath("$.data.campusVisit.approverName", is("Dr. Suresh Kumar")))
                .andExpect(jsonPath("$.data.todayActivities", hasSize(2)));
    }

    @Test
    @DisplayName("Option B: Alumni ID Fallback with Approved Visit -> ALLOWED")
    void testAlumniIdFallbackWithApprovedVisit_ReturnsAllowed() throws Exception {
        CampusVisit visit = CampusVisit.builder()
                .alumniProfile(alumniProfile)
                .visitDate(LocalDate.now())
                .preferredArrivalTime(LocalTime.of(10, 30))
                .approvedArrivalTime(LocalTime.of(10, 30))
                .purpose("Personal Campus Visit")
                .visitType(CampusVisitType.PERSONAL_VISIT)
                .status(CampusVisitStatus.APPROVED)
                .approvedBy(adminUser)
                .approverRole(RoleName.ROLE_ADMIN)
                .approvedAt(Instant.now())
                .build();
        campusVisitRepository.save(visit);

        mockMvc.perform(post("/api/v1/watchman/verify/alumni-id")
                        .header("Authorization", "Bearer " + watchmanToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("alumniIdNumber", virtualId.getAlumniIdCardNumber()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.decision", is("ALLOWED")))
                .andExpect(jsonPath("$.data.verificationMethod", is("ALUMNI_ID")))
                .andExpect(jsonPath("$.data.alumni.fullName", is("Arun Kumar")));
    }

    @Test
    @DisplayName("Option C: Physical RFID Card -> ALLOWED with verificationMethod = RFID")
    void testRfidVerification_ReturnsAllowed() throws Exception {
        CampusVisit visit = CampusVisit.builder()
                .alumniProfile(alumniProfile)
                .visitDate(LocalDate.now())
                .preferredArrivalTime(LocalTime.of(11, 0))
                .approvedArrivalTime(LocalTime.of(11, 0))
                .purpose("Department Visit")
                .visitType(CampusVisitType.DEPARTMENT_VISIT)
                .department(itDept)
                .status(CampusVisitStatus.APPROVED)
                .approvedBy(facultyUser)
                .approverRole(RoleName.ROLE_STAFF)
                .approvedAt(Instant.now())
                .build();
        campusVisitRepository.save(visit);

        mockMvc.perform(post("/api/v1/watchman/verify/rfid")
                        .header("Authorization", "Bearer " + watchmanToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rfidUid", rfidMapping.getRfidUid()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.decision", is("ALLOWED")))
                .andExpect(jsonPath("$.data.verificationMethod", is("RFID")))
                .andExpect(jsonPath("$.data.alumni.fullName", is("Arun Kumar")));
    }

    @Test
    @DisplayName("Option D: Valid Digital ID but NO Campus Visit Today -> DENIED")
    void testValidDigitalIdWithoutCampusVisit_ReturnsDenied() throws Exception {
        mockMvc.perform(post("/api/v1/watchman/verify/qr")
                        .header("Authorization", "Bearer " + watchmanToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("qrToken", qrToken.getToken()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.decision", is("DENIED")))
                .andExpect(jsonPath("$.data.denialReason", containsString("No approved campus visit found for today")));
    }

    @Test
    @DisplayName("Lost RFID -> DENIED")
    void testLostRfid_ReturnsDenied() throws Exception {
        rfidMapping.setStatus(RfidStatus.LOST);
        rfidRepository.save(rfidMapping);

        mockMvc.perform(post("/api/v1/watchman/verify/rfid")
                        .header("Authorization", "Bearer " + watchmanToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rfidUid", rfidMapping.getRfidUid()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.decision", is("DENIED")))
                .andExpect(jsonPath("$.data.denialReason", containsString("LOST")));
    }

    @Test
    @DisplayName("Pending Visit -> REVIEW_REQUIRED")
    void testPendingVisit_ReturnsReviewRequired() throws Exception {
        CampusVisit visit = CampusVisit.builder()
                .alumniProfile(alumniProfile)
                .visitDate(LocalDate.now())
                .preferredArrivalTime(LocalTime.of(10, 30))
                .purpose("Faculty Meeting")
                .visitType(CampusVisitType.FACULTY_MEETING)
                .department(itDept)
                .status(CampusVisitStatus.PENDING)
                .build();
        campusVisitRepository.save(visit);

        mockMvc.perform(post("/api/v1/watchman/verify/qr")
                        .header("Authorization", "Bearer " + watchmanToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("qrToken", qrToken.getToken()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.decision", is("REVIEW_REQUIRED")))
                .andExpect(jsonPath("$.data.denialReason", containsString("PENDING")));
    }

    @Test
    @DisplayName("Tomorrow's Visit -> DENIED Today (Date mismatch)")
    void testTomorrowsVisit_ReturnsDeniedToday() throws Exception {
        CampusVisit visit = CampusVisit.builder()
                .alumniProfile(alumniProfile)
                .visitDate(LocalDate.now().plusDays(1))
                .preferredArrivalTime(LocalTime.of(10, 30))
                .approvedArrivalTime(LocalTime.of(10, 30))
                .purpose("Tomorrow's Meeting")
                .visitType(CampusVisitType.FACULTY_MEETING)
                .status(CampusVisitStatus.APPROVED)
                .approvedBy(facultyUser)
                .build();
        campusVisitRepository.save(visit);

        mockMvc.perform(post("/api/v1/watchman/verify/qr")
                        .header("Authorization", "Bearer " + watchmanToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("qrToken", qrToken.getToken()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.decision", is("DENIED")))
                .andExpect(jsonPath("$.data.denialReason", containsString("No approved campus visit found for today")));
    }

    // ==========================================
    // 2. EVENT PARTICIPATION VS CAMPUS VISIT SEPARATION
    // ==========================================

    @Test
    @DisplayName("Off-Campus Event Registration alone does NOT authorize campus entry")
    void testOffCampusEventRegistration_DoesNotAuthorizeCampusEntry() throws Exception {
        Event offCampusEvent = Event.builder()
                .title("Chennai Alumni Meet")
                .eventType(EventType.ALUMNI_MEET)
                .locationType(EventLocationType.OFF_CAMPUS)
                .venue("ITC Grand Chola, Chennai")
                .eventDate(LocalDate.now())
                .startTime(LocalTime.of(18, 0))
                .endTime(LocalTime.of(21, 0))
                .organizer("Chennai Chapter")
                .isActive(true)
                .build();
        offCampusEvent = eventRepository.save(offCampusEvent);

        // Register alumnus for off-campus event
        eventParticipantRepository.save(EventParticipant.builder()
                .event(offCampusEvent)
                .alumniProfile(alumniProfile)
                .status(ParticipantStatus.REGISTERED)
                .build());

        // Without an approved CampusVisit for today -> DENIED
        mockMvc.perform(post("/api/v1/watchman/verify/qr")
                        .header("Authorization", "Bearer " + watchmanToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("qrToken", qrToken.getToken()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.decision", is("DENIED")));
    }

    @Test
    @DisplayName("CampusVisit WITHOUT EventParticipant can still authorize campus entry")
    void testCampusVisitWithoutEventParticipant_AuthorizesEntry() throws Exception {
        CampusVisit visit = CampusVisit.builder()
                .alumniProfile(alumniProfile)
                .visitDate(LocalDate.now())
                .preferredArrivalTime(LocalTime.of(14, 0))
                .approvedArrivalTime(LocalTime.of(14, 0))
                .purpose("One-on-one discussion with HOD")
                .visitType(CampusVisitType.FACULTY_MEETING)
                .department(itDept)
                .assignedFaculty(facultyUser)
                .status(CampusVisitStatus.APPROVED)
                .approvedBy(facultyUser)
                .approverRole(RoleName.ROLE_STAFF)
                .approvedAt(Instant.now())
                .build();
        campusVisitRepository.save(visit);

        mockMvc.perform(post("/api/v1/watchman/verify/qr")
                        .header("Authorization", "Bearer " + watchmanToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("qrToken", qrToken.getToken()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.decision", is("ALLOWED")));
    }

    // ==========================================
    // 3. FACULTY SCOPED APPROVAL & RBAC
    // ==========================================

    @Test
    @DisplayName("IT Faculty can approve IT Department visit; ECE Faculty receives 403 Forbidden")
    void testFacultyScopedApproval() throws Exception {
        // Alumnus creates IT visit request
        CampusVisit visit = CampusVisit.builder()
                .alumniProfile(alumniProfile)
                .visitDate(LocalDate.now().plusDays(2))
                .preferredArrivalTime(LocalTime.of(10, 0))
                .purpose("Meet IT HOD")
                .visitType(CampusVisitType.FACULTY_MEETING)
                .department(itDept)
                .assignedFaculty(facultyUser)
                .status(CampusVisitStatus.PENDING)
                .build();
        visit = campusVisitRepository.save(visit);

        // 1. ECE Faculty tries to approve IT visit -> 403 Forbidden
        CampusVisitReviewRequest reviewReq = new CampusVisitReviewRequest(
                CampusVisitStatus.APPROVED,
                "Approved",
                "IT Block",
                "HOD",
                "Welcome"
        );

        mockMvc.perform(patch("/api/v1/faculty/campus-visits/" + visit.getId() + "/approve")
                        .header("Authorization", "Bearer " + otherFacultyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isForbidden());

        // 2. IT Faculty approves IT visit -> 200 OK
        mockMvc.perform(patch("/api/v1/faculty/campus-visits/" + visit.getId() + "/approve")
                        .header("Authorization", "Bearer " + facultyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("APPROVED")))
                .andExpect(jsonPath("$.data.approverRole", is("ROLE_STAFF")));
    }

    @Test
    @DisplayName("Rejection without comment fails with 400 Bad Request")
    void testRejectionWithoutComment_Fails() throws Exception {
        CampusVisit visit = CampusVisit.builder()
                .alumniProfile(alumniProfile)
                .visitDate(LocalDate.now().plusDays(3))
                .preferredArrivalTime(LocalTime.of(10, 0))
                .purpose("Lab tour")
                .visitType(CampusVisitType.DEPARTMENT_VISIT)
                .department(itDept)
                .status(CampusVisitStatus.PENDING)
                .build();
        visit = campusVisitRepository.save(visit);

        CampusVisitReviewRequest emptyCommentReq = new CampusVisitReviewRequest(
                CampusVisitStatus.REJECTED,
                "   ",
                null,
                null,
                null
        );

        mockMvc.perform(patch("/api/v1/faculty/campus-visits/" + visit.getId() + "/reject")
                        .header("Authorization", "Bearer " + facultyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyCommentReq)))
                .andExpect(status().isBadRequest());
    }

    // ==========================================
    // 4. ENTRY RECORDING, LOGGING & NOTIFICATIONS
    // ==========================================

    @Test
    @DisplayName("Recording entry creates immutable CampusEntryLog and dispatches multi-party notifications")
    void testRecordEntry_CreatesLogAndDispatchesNotifications() throws Exception {
        CampusVisit visit = CampusVisit.builder()
                .alumniProfile(alumniProfile)
                .visitDate(LocalDate.now())
                .preferredArrivalTime(LocalTime.of(10, 30))
                .approvedArrivalTime(LocalTime.of(10, 30))
                .purpose("IT Department Meeting")
                .visitType(CampusVisitType.FACULTY_MEETING)
                .department(itDept)
                .assignedFaculty(facultyUser)
                .status(CampusVisitStatus.APPROVED)
                .approvedBy(facultyUser)
                .approverRole(RoleName.ROLE_STAFF)
                .approvedAt(Instant.now())
                .build();
        visit = campusVisitRepository.save(visit);

        WatchmanEntryRequest entryReq = new WatchmanEntryRequest(
                alumniProfile.getId(),
                VerificationMethod.DIGITAL_ID_QR,
                "Main Gate",
                "Verified via scanner"
        );

        mockMvc.perform(post("/api/v1/watchman/entry")
                        .header("Authorization", "Bearer " + watchmanToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(entryReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.decision", is("ALLOWED")))
                .andExpect(jsonPath("$.data.alumniRollNumber", is(alumniProfile.getRollNumber())));

        // Verify CampusEntryLog was persisted
        List<CampusEntryLog> logs = campusEntryLogRepository.findByAlumniProfileIdOrderByEntryTimestampDesc(alumniProfile.getId());
        assertFalse(logs.isEmpty());
        CampusEntryLog log = logs.get(0);
        assertEquals(EntryDecision.ALLOWED, log.getEntryDecision());
        assertEquals(VerificationMethod.DIGITAL_ID_QR, log.getVerificationMethod());
        assertEquals("Main Gate", log.getGate());

        // Verify notifications were dispatched to Alumnus, Approving Faculty, and Admin
        List<Notification> alumniNotifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(alumniUser.getId());
        assertFalse(alumniNotifications.isEmpty());
        assertEquals(NotificationType.ENTRY_VERIFIED, alumniNotifications.get(0).getType());

        List<Notification> facultyNotifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(facultyUser.getId());
        assertFalse(facultyNotifications.isEmpty());
        assertEquals(NotificationType.ENTRY_VERIFIED, facultyNotifications.get(0).getType());
    }
}
