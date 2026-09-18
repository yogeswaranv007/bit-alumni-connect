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
            jdbcTemplate.execute("ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_check");
            log.info("Dropped legacy roles_name_check constraint if present");
        } catch (Exception ex) {
            log.debug("Role constraint migration note: {}", ex.getMessage());
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
