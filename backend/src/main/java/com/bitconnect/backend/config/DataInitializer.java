package com.bitconnect.backend.config;

import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.alumni.entity.VerificationStatus;
import com.bitconnect.backend.modules.alumni.repository.AlumniProfileRepository;
import com.bitconnect.backend.modules.department.entity.Department;
import com.bitconnect.backend.modules.department.repository.DepartmentRepository;
import com.bitconnect.backend.modules.event.entity.Event;
import com.bitconnect.backend.modules.event.entity.EventLocationType;
import com.bitconnect.backend.modules.event.entity.EventType;
import com.bitconnect.backend.modules.event.repository.EventRepository;
import com.bitconnect.backend.modules.institutional.entity.CollegeAlumniRecord;
import com.bitconnect.backend.modules.institutional.entity.CollegeRecordStatus;
import com.bitconnect.backend.modules.institutional.entity.CollegeStudentRecord;
import com.bitconnect.backend.modules.institutional.entity.StudentRecordType;
import com.bitconnect.backend.modules.institutional.repository.CollegeAlumniRecordRepository;
import com.bitconnect.backend.modules.institutional.repository.CollegeStudentRecordRepository;
import com.bitconnect.backend.modules.rfid.entity.RfidIdentityMapping;
import com.bitconnect.backend.modules.rfid.entity.RfidStatus;
import com.bitconnect.backend.modules.rfid.repository.RfidIdentityMappingRepository;
import com.bitconnect.backend.modules.staff.entity.StaffProfile;
import com.bitconnect.backend.modules.staff.repository.StaffProfileRepository;
import com.bitconnect.backend.modules.student.entity.RegistrationStatus;
import com.bitconnect.backend.modules.student.entity.StudentProfile;
import com.bitconnect.backend.modules.student.entity.StudentType;
import com.bitconnect.backend.modules.student.repository.StudentProfileRepository;
import com.bitconnect.backend.modules.user.entity.Role;
import com.bitconnect.backend.modules.user.entity.RoleName;
import com.bitconnect.backend.modules.user.entity.User;
import com.bitconnect.backend.modules.user.repository.RoleRepository;
import com.bitconnect.backend.modules.user.repository.UserRepository;
import com.bitconnect.backend.modules.virtualid.service.VirtualIdService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Seeds required system roles, academic departments, development test accounts,
 * sample events, and ensures database column types support rich text.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final AlumniProfileRepository alumniProfileRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final CollegeStudentRecordRepository collegeStudentRecordRepository;
    private final CollegeAlumniRecordRepository collegeAlumniRecordRepository;
    private final EventRepository eventRepository;
    private final RfidIdentityMappingRepository rfidRepository;
    private final VirtualIdService virtualIdService;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        migrateColumnTypes();
        seedRoles();
        seedDepartments();
        seedInstitutionalMasterData();  // Must run before seedDemoUsers so records exist for linking
        seedDemoUsers();
        seedSampleEvents();
    }

    private void migrateColumnTypes() {
        try {
            jdbcTemplate.execute("ALTER TABLE alumni_profiles ALTER COLUMN profile_photo_url TYPE TEXT");
            jdbcTemplate.execute("ALTER TABLE alumni_profiles ALTER COLUMN permanent_address TYPE TEXT");
            jdbcTemplate.execute("ALTER TABLE alumni_profiles ALTER COLUMN rejection_reason TYPE TEXT");
            jdbcTemplate.execute("ALTER TABLE alumni_profiles ALTER COLUMN linkedin_url TYPE TEXT");
            log.info("Migrated alumni_profiles columns to TEXT for large payload support");
        } catch (Exception ex) {
            log.debug("Column migration for alumni_profiles note: {}", ex.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE profile_change_requests ALTER COLUMN current_profile_snapshot TYPE TEXT");
            jdbcTemplate.execute("ALTER TABLE profile_change_requests ALTER COLUMN requested_changes TYPE TEXT");
            jdbcTemplate.execute("ALTER TABLE profile_change_requests ALTER COLUMN admin_comment TYPE TEXT");
            log.info("Migrated profile_change_requests columns to TEXT");
        } catch (Exception ex) {
            log.debug("Column migration for profile_change_requests note: {}", ex.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE campus_visit_status_history ALTER COLUMN changed_by DROP NOT NULL");
            jdbcTemplate.execute("ALTER TABLE campus_visits DROP CONSTRAINT IF EXISTS campus_visits_status_check");
            jdbcTemplate.execute("ALTER TABLE campus_visit_status_history DROP CONSTRAINT IF EXISTS campus_visit_status_history_new_status_check");
            jdbcTemplate.execute("ALTER TABLE campus_visit_status_history DROP CONSTRAINT IF EXISTS campus_visit_status_history_old_status_check");
            log.info("Migrated campus_visit_status_history and dropped status check constraints");
        } catch (Exception ex) {
            log.debug("Column/constraint migration for campus_visit_status_history note: {}", ex.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_check");
            jdbcTemplate.execute("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check");
            log.info("Dropped legacy roles_name_check and notifications_type_check constraints if present");
        } catch (Exception ex) {
            log.debug("Role/notification constraint migration note: {}", ex.getMessage());
        }

        // Student profile: add new columns introduced in the approval workflow update
        try {
            jdbcTemplate.execute("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'");
            jdbcTemplate.execute("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT");
            jdbcTemplate.execute("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS actioned_by UUID");
            jdbcTemplate.execute("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS actioned_at TIMESTAMPTZ");
            jdbcTemplate.execute("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS student_type VARCHAR(20)");
            jdbcTemplate.execute("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10)");
            jdbcTemplate.execute("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE");
            jdbcTemplate.execute("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS address TEXT");
            jdbcTemplate.execute("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS student_phone VARCHAR(20)");
            jdbcTemplate.execute("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(20)");
            jdbcTemplate.execute("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS official_email VARCHAR(120)");
            jdbcTemplate.execute("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT");
            log.info("Migrated student_profiles: added approval workflow and physical-card columns");
        } catch (Exception ex) {
            log.debug("student_profiles column migration note: {}", ex.getMessage());
        }

        // student_qr_verification_tokens notification constraint may exist
        try {
            jdbcTemplate.execute("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check");
        } catch (Exception ex) {
            log.debug("Notification constraint drop note: {}", ex.getMessage());
        }

        // Add institutional_record_id to student_profiles and alumni_profiles (Phase 2 — institutional verification)
        try {
            jdbcTemplate.execute("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS institutional_record_id VARCHAR(40)");
            log.info("Migrated student_profiles: added institutional_record_id column");
        } catch (Exception ex) {
            log.debug("student_profiles institutional_record_id migration note: {}", ex.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE alumni_profiles ADD COLUMN IF NOT EXISTS institutional_record_id VARCHAR(40)");
            log.info("Migrated alumni_profiles: added institutional_record_id column");
        } catch (Exception ex) {
            log.debug("alumni_profiles institutional_record_id migration note: {}", ex.getMessage());
        }
    }

    private void seedRoles() {
        Arrays.stream(RoleName.values()).forEach(roleName -> {
            if (!roleRepository.existsByName(roleName)) {
                Role role = new Role(roleName);
                roleRepository.save(role);
                log.info("Initialized system role: {}", roleName);
            }
        });
    }

    private void seedDepartments() {
        List<Department> defaultDepartments = List.of(
                new Department("CSE", "Computer Science and Engineering", "Department of Computer Science and Engineering"),
                new Department("IT", "Information Technology", "Department of Information Technology"),
                new Department("ECE", "Electronics and Communication Engineering", "Department of Electronics and Communication Engineering"),
                new Department("EEE", "Electrical and Electronics Engineering", "Department of Electrical and Electronics Engineering"),
                new Department("MECH", "Mechanical Engineering", "Department of Mechanical Engineering"),
                new Department("CIVIL", "Civil Engineering", "Department of Civil Engineering"),
                new Department("AIDS", "Artificial Intelligence and Data Science", "Department of Artificial Intelligence and Data Science"),
                new Department("AIML", "Artificial Intelligence and Machine Learning", "Department of Artificial Intelligence and Machine Learning"),
                new Department("BT", "Biotechnology", "Department of Biotechnology"),
                new Department("FT", "Food Technology", "Department of Food Technology"),
                new Department("TT", "Textile Technology", "Department of Textile Technology"),
                new Department("MBA", "Master of Business Administration", "Department of Management Studies"),
                new Department("MCA", "Master of Computer Applications", "Department of Computer Applications")
        );

        for (Department dept : defaultDepartments) {
            if (!departmentRepository.existsByCode(dept.getCode())) {
                departmentRepository.save(dept);
                log.info("Initialized academic department: {} - {}", dept.getCode(), dept.getName());
            }
        }
    }

    private void seedDemoUsers() {
        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN).orElseThrow();
        Role alumniRole = roleRepository.findByName(RoleName.ROLE_ALUMNI).orElseThrow();
        Role staffRole = roleRepository.findByName(RoleName.ROLE_STAFF).orElseThrow();
        Role watchmanRole = roleRepository.findByName(RoleName.ROLE_WATCHMAN).orElseThrow();

        // 1. Seed Development Administrator (admin@bitsathy.ac.in / Password@123)
        if (!userRepository.existsByEmail("admin@bitsathy.ac.in")) {
            User adminUser = User.builder()
                    .email("admin@bitsathy.ac.in")
                    .fullName("System Administrator")
                    .password(passwordEncoder.encode("Password@123"))
                    .isActive(true)
                    .roles(new HashSet<>(Set.of(adminRole)))
                    .build();
            userRepository.save(adminUser);
            log.info("Initialized dev admin user: admin@bitsathy.ac.in");
        }

        // 2. Seed Development Gate Watchman (watchman@bitsathy.ac.in / Password@123)
        if (!userRepository.existsByEmail("watchman@bitsathy.ac.in")) {
            User watchmanUser = User.builder()
                    .email("watchman@bitsathy.ac.in")
                    .fullName("Main Gate Security Watchman")
                    .password(passwordEncoder.encode("Password@123"))
                    .isActive(true)
                    .roles(new HashSet<>(Set.of(watchmanRole)))
                    .build();
            userRepository.save(watchmanUser);
            log.info("Initialized dev watchman user: watchman@bitsathy.ac.in");
        }

        // 3. Seed Development IT Faculty Member (faculty.it@bitsathy.ac.in / Password@123)
        if (!userRepository.existsByEmail("faculty.it@bitsathy.ac.in")) {
            Department itDept = departmentRepository.findByCode("IT").orElseThrow();
            User facultyUser = User.builder()
                    .email("faculty.it@bitsathy.ac.in")
                    .fullName("Dr. Suresh Kumar")
                    .password(passwordEncoder.encode("Password@123"))
                    .isActive(true)
                    .roles(new HashSet<>(Set.of(staffRole)))
                    .build();
            User savedFaculty = userRepository.save(facultyUser);

            StaffProfile staffProfile = StaffProfile.builder()
                    .user(savedFaculty)
                    .department(itDept)
                    .staffCode("BIT-STF-IT-001")
                    .designation("Professor & Head, Department of IT")
                    .phoneNumber("+91 94433 12345")
                    .build();
            staffProfileRepository.save(staffProfile);
            log.info("Initialized dev faculty user: faculty.it@bitsathy.ac.in");
        }

        // 4. Seed Development Verified Alumnus (alumni@bitsathy.ac.in / Password@123)
        if (!userRepository.existsByEmail("alumni@bitsathy.ac.in")) {
            User alumniUser = User.builder()
                    .email("alumni@bitsathy.ac.in")
                    .fullName("Demo Alumnus")
                    .password(passwordEncoder.encode("Password@123"))
                    .isActive(true)
                    .roles(new HashSet<>(Set.of(alumniRole)))
                    .build();
            User savedAlumni = userRepository.save(alumniUser);

            Department itDept = departmentRepository.findByCode("IT").orElseThrow();
            AlumniProfile profile = AlumniProfile.builder()
                    .user(savedAlumni)
                    .department(itDept)
                    .rollNumber("DEMO2024")
                    .registerNumber("7376DEMO2024")
                    .degree("B.Tech")
                    .batchStartYear(2020)
                    .batchEndYear(2024)
                    .profilePhotoUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400")
                    .dateOfBirth(LocalDate.of(2002, 5, 15))
                    .bloodGroup("O+")
                    .personalEmail("demo.alumni@gmail.com")
                    .phoneNumber("+91 98765 43210")
                    .permanentAddress("123 College Road, Sathyamangalam, Erode, Tamil Nadu")
                    .city("Erode")
                    .state("Tamil Nadu")
                    .country("India")
                    .postalCode("638401")
                    .currentCompany("Amazon Web Services")
                    .currentDesignation("Software Development Engineer II")
                    .industry("Cloud Computing & AI")
                    .linkedinUrl("https://linkedin.com/in/demoalumnus")
                    .verificationStatus(VerificationStatus.VERIFIED)
                    .verifiedAt(Instant.now())
                    .isDirectoryVisible(true)
                    .build();

            AlumniProfile savedProfile = alumniProfileRepository.save(profile);
            virtualIdService.issueVirtualId(savedProfile);

            // Seed sample RFID mapping for demo alumnus
            RfidIdentityMapping rfidMapping = RfidIdentityMapping.builder()
                    .alumniProfile(savedProfile)
                    .rfidUid("RFID-BIT-DEMO-001")
                    .cardNumber("NFC-2024-001")
                    .status(RfidStatus.ACTIVE)
                    .issuedDate(LocalDate.now())
                    .notes("Primary RFID physical card")
                    .build();
            rfidRepository.save(rfidMapping);

            log.info("Initialized dev verified Alumni Profile, Virtual ID & RFID for: alumni@bitsathy.ac.in");
        }

        // 5. Seed Development Student (student@bitsathy.ac.in / Password@123)
        // [DEV ONLY] Clearly synthetic test account — not a real BIT student
        Role studentRole = roleRepository.findByName(RoleName.ROLE_STUDENT).orElseThrow();
        Department itDeptForStudent = departmentRepository.findByCode("IT").orElseThrow();

        User studentUser;
        if (!userRepository.existsByEmail("student@bitsathy.ac.in")) {
            studentUser = User.builder()
                    .email("student@bitsathy.ac.in")
                    .fullName("Test Student [DEV]")          // clearly synthetic
                    .password(passwordEncoder.encode("Password@123"))
                    .isActive(true)
                    .roles(new HashSet<>(Set.of(studentRole)))
                    .build();
            studentUser = userRepository.save(studentUser);
            log.info("[DEV] Initialized student user: student@bitsathy.ac.in / Password@123");
        } else {
            studentUser = userRepository.findByEmail("student@bitsathy.ac.in").orElseThrow();
        }

        // Seed PENDING StudentProfile for dev student if not already created
        if (!studentProfileRepository.existsByUserId(studentUser.getId())) {
            // Link the institutional record to this dev account
            final User finalStudentUser = studentUser; // effectively final alias for lambda
            collegeStudentRecordRepository.findByRegisterNumber("TEST-STU-001").ifPresent(rec -> {
                rec.setLinkedBitConnectUserId(finalStudentUser.getId());
                collegeStudentRecordRepository.save(rec);
            });

            StudentProfile studentProfile = StudentProfile.builder()
                    .user(studentUser)
                    .department(itDeptForStudent)
                    .institutionalRecordId("STU-000001")      // matches CollegeStudentRecord
                    .registerNumber("TEST-STU-001")           // clearly synthetic
                    .degree("B.Tech")
                    .batchStartYear(2023)
                    .batchEndYear(2027)                       // 2023 + 4
                    .studentType(StudentType.DAY_SCHOLAR)
                    .bloodGroup("O+")
                    .dateOfBirth(LocalDate.of(2005, 6, 15))  // valid: age ~21, clearly > 14
                    .address("[DEV] 42 Test Colony, Sathyamangalam, Erode, Tamil Nadu 638401")
                    .studentPhone("+91 99000 00001")          // synthetic test number
                    .parentPhone("+91 99000 00002")           // synthetic test number
                    .officialEmail("test.student@bitsathy.example") // .example = non-deliverable
                    .registrationStatus(RegistrationStatus.PENDING)
                    .build();
            studentProfileRepository.save(studentProfile);
            log.info("[DEV] Seeded PENDING StudentProfile for test student: TEST-STU-001 | student@bitsathy.ac.in");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Mock Institutional Master Data (DEVELOPMENT ONLY)
    //
    // These are synthetic college master records used for testing institutional
    // verification without requiring the real BIT database.
    //
    // FUTURE: Replace MockInstitutionalStudentDataProvider / MockInstitutionalAlumniDataProvider
    //         with BITInstitutionalStudentDataProvider / BITInstitutionalAlumniDataProvider
    //         that call the real BIT college API/DB. No other code needs changing.
    // ─────────────────────────────────────────────────────────────────────────
    private void seedInstitutionalMasterData() {
        seedMockStudentRecords();
        seedMockAlumniRecords();
    }

    private void seedMockStudentRecords() {
        if (collegeStudentRecordRepository.count() > 0) return;

        // STU-000001 — matches the dev demo student account (TEST-STU-001)
        collegeStudentRecordRepository.save(CollegeStudentRecord.builder()
                .institutionalRecordId("STU-000001")
                .registerNumber("TEST-STU-001")
                .name("Test Student [DEV]")              // must match for verification
                .dateOfBirth(LocalDate.of(2005, 6, 15))
                .degree("B.Tech")
                .departmentCode("IT")
                .batchStartYear(2023)
                .batchEndYear(2027)
                .studentType(StudentRecordType.DAY_SCHOLAR)
                .officialEmail("test.student@bitsathy.example")
                .phone("+91 99000 00001")
                .parentPhone("+91 99000 00002")
                .bloodGroup("O+")
                .address("[DEV] 42 Test Colony, Sathyamangalam, Erode, Tamil Nadu 638401")
                .recordStatus(CollegeRecordStatus.ACTIVE)
                .build());

        // STU-000002 — Day Scholar, CSE, 2024 batch (unregistered — for Scenario A/B/C testing)
        collegeStudentRecordRepository.save(CollegeStudentRecord.builder()
                .institutionalRecordId("STU-000002")
                .registerNumber("TEST-STU-002")
                .name("Dev TestUser Two")
                .dateOfBirth(LocalDate.of(2006, 3, 20))
                .degree("B.Tech")
                .departmentCode("CSE")
                .batchStartYear(2024)
                .batchEndYear(2028)
                .studentType(StudentRecordType.DAY_SCHOLAR)
                .officialEmail("dev.testuser2@bitsathy.example")
                .phone("+91 99000 00003")
                .parentPhone("+91 99000 00004")
                .bloodGroup("A+")
                .address("[DEV] 100 Sample Street, Erode, Tamil Nadu 638001")
                .recordStatus(CollegeRecordStatus.ACTIVE)
                .build());

        // STU-000003 — Hosteler, ECE, 2025 batch (unregistered)
        collegeStudentRecordRepository.save(CollegeStudentRecord.builder()
                .institutionalRecordId("STU-000003")
                .registerNumber("TEST-STU-003")
                .name("Dev TestUser Three")
                .dateOfBirth(LocalDate.of(2007, 8, 10))
                .degree("B.Tech")
                .departmentCode("ECE")
                .batchStartYear(2025)
                .batchEndYear(2029)
                .studentType(StudentRecordType.HOSTELER)
                .officialEmail("dev.testuser3@bitsathy.example")
                .phone("+91 99000 00005")
                .parentPhone("+91 99000 00006")
                .bloodGroup("B+")
                .address("[DEV] Hostel Block C, BIT Campus, Sathyamangalam")
                .recordStatus(CollegeRecordStatus.ACTIVE)
                .build());

        log.info("[DEV] Seeded 3 mock CollegeStudentRecords (STU-000001..003) — DEVELOPMENT ONLY, not real BIT data");
    }

    private void seedMockAlumniRecords() {
        if (collegeAlumniRecordRepository.count() > 0) return;

        // ALU-000001 — matches dev alumni account (alumni@bitsathy.ac.in)
        collegeAlumniRecordRepository.save(CollegeAlumniRecord.builder()
                .institutionalRecordId("ALU-000001")
                .registerNumber("TEST-ALU-001")
                .name("Dev Alumni One")
                .dateOfBirth(LocalDate.of(1999, 4, 12))
                .degree("B.Tech")
                .departmentCode("IT")
                .graduationYear(2021)
                .officialEmail("dev.alumni1@bitsathy.example")
                .phone("+91 99000 10001")
                .address("[DEV] 10 Alumni Lane, Chennai, Tamil Nadu 600001")
                .recordStatus(CollegeRecordStatus.ACTIVE)
                .build());

        // ALU-000002 — CSE, 2022 batch (unregistered — for testing)
        collegeAlumniRecordRepository.save(CollegeAlumniRecord.builder()
                .institutionalRecordId("ALU-000002")
                .registerNumber("TEST-ALU-002")
                .name("Dev Alumni Two")
                .dateOfBirth(LocalDate.of(2000, 7, 25))
                .degree("B.Tech")
                .departmentCode("CSE")
                .graduationYear(2022)
                .officialEmail("dev.alumni2@bitsathy.example")
                .phone("+91 99000 10002")
                .address("[DEV] 25 Grad Avenue, Coimbatore, Tamil Nadu 641001")
                .recordStatus(CollegeRecordStatus.ACTIVE)
                .build());

        log.info("[DEV] Seeded 2 mock CollegeAlumniRecords (ALU-000001..002) — DEVELOPMENT ONLY, not real BIT data");
    }

    private void seedSampleEvents() {
        if (eventRepository.count() == 0) {
            Department itDept = departmentRepository.findByCode("IT").orElse(null);

            Event event1 = Event.builder()
                    .title("IT Department Faculty Interaction & Mentorship")
                    .eventType(EventType.FACULTY_MEETING)
                    .locationType(EventLocationType.ON_CAMPUS)
                    .venue("IT Block - Conference Hall 204")
                    .eventDate(LocalDate.now())
                    .startTime(LocalTime.of(10, 30))
                    .endTime(LocalTime.of(11, 30))
                    .department(itDept)
                    .organizer("Dr. Suresh Kumar (HOD IT)")
                    .description("One-on-one academic interaction and student mentorship discussion.")
                    .isActive(true)
                    .build();

            Event event2 = Event.builder()
                    .title("Alumni Association General Body Meet")
                    .eventType(EventType.ALUMNI_MEET)
                    .locationType(EventLocationType.ON_CAMPUS)
                    .venue("Alumni Centre, Main Block")
                    .eventDate(LocalDate.now())
                    .startTime(LocalTime.of(12, 0))
                    .endTime(LocalTime.of(13, 30))
                    .organizer("BIT Alumni Association")
                    .description("Quarterly general meet discussing scholarship and incubator funding.")
                    .isActive(true)
                    .build();

            Event event3 = Event.builder()
                    .title("Chennai Regional Alumni Chapter Meet")
                    .eventType(EventType.ALUMNI_MEET)
                    .locationType(EventLocationType.OFF_CAMPUS)
                    .venue("ITC Grand Chola, Guindy, Chennai")
                    .eventDate(LocalDate.now().plusDays(15))
                    .startTime(LocalTime.of(18, 0))
                    .endTime(LocalTime.of(21, 0))
                    .organizer("Chennai Chapter Council")
                    .description("Networking dinner and alumni entrepreneurship roundtable.")
                    .isActive(true)
                    .build();

            eventRepository.saveAll(List.of(event1, event2, event3));
            log.info("Seeded canonical sample on-campus and off-campus events");
        }
    }
}
