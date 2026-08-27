package com.bitconnect.backend.config;

import com.bitconnect.backend.modules.alumni.entity.AlumniProfile;
import com.bitconnect.backend.modules.alumni.entity.VerificationStatus;
import com.bitconnect.backend.modules.alumni.repository.AlumniProfileRepository;
import com.bitconnect.backend.modules.department.entity.Department;
import com.bitconnect.backend.modules.department.repository.DepartmentRepository;
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
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Seeds required system roles, academic departments, demo accounts,
 * and ensures database column types support rich text and large Base64 images.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final AlumniProfileRepository alumniProfileRepository;
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

        // 1. Seed Demo Administrator (admin@bitsathy.ac.in / Password@123)
        if (!userRepository.existsByEmail("admin@bitsathy.ac.in")) {
            User adminUser = User.builder()
                    .email("admin@bitsathy.ac.in")
                    .fullName("System Administrator")
                    .password(passwordEncoder.encode("Password@123"))
                    .isActive(true)
                    .roles(new HashSet<>(Set.of(adminRole)))
                    .build();
            userRepository.save(adminUser);
            log.info("Initialized demo admin user: admin@bitsathy.ac.in");
        }

        // 2. Seed Demo Verified Alumnus (alumni@bitsathy.ac.in / Password@123)
        if (!userRepository.existsByEmail("alumni@bitsathy.ac.in")) {
            User alumniUser = User.builder()
                    .email("alumni@bitsathy.ac.in")
                    .fullName("Demo Alumnus")
                    .password(passwordEncoder.encode("Password@123"))
                    .isActive(true)
                    .roles(new HashSet<>(Set.of(alumniRole)))
                    .build();
            User savedAlumni = userRepository.save(alumniUser);
            log.info("Initialized demo alumnus user: alumni@bitsathy.ac.in");

            // Seed associated verified profile and Virtual ID
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
            log.info("Initialized demo verified Alumni Profile & Virtual ID for: alumni@bitsathy.ac.in");
        }
    }
}
