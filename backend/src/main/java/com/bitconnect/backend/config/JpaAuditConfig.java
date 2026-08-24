package com.bitconnect.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Enables Spring Data JPA auditing for automatic population of createdAt and updatedAt timestamps.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditConfig {
}
