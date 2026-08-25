package com.bitconnect.backend.config;

import com.bitconnect.backend.modules.user.entity.Role;
import com.bitconnect.backend.modules.user.entity.RoleName;
import com.bitconnect.backend.modules.user.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * Seeds required system roles into the database idempotently upon application startup.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {
        seedRoles();
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
}
