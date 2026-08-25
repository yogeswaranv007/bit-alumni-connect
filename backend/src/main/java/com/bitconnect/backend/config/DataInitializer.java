package com.bitconnect.backend.config;

import com.bitconnect.backend.modules.department.entity.Department;
import com.bitconnect.backend.modules.department.repository.DepartmentRepository;
import com.bitconnect.backend.modules.user.entity.Role;
import com.bitconnect.backend.modules.user.entity.RoleName;
import com.bitconnect.backend.modules.user.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Seeds required system roles and academic departments into the database
 * idempotently upon application startup.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    public void run(String... args) {
        seedRoles();
        seedDepartments();
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
}
