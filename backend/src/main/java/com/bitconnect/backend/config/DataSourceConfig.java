package com.bitconnect.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;
import java.net.URI;

/**
 * Custom DataSource configuration supporting both Neon/Cloud DATABASE_URL (URI format)
 * and standard Spring Boot datasource properties (JDBC format).
 */
@Slf4j
@Configuration
public class DataSourceConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Value("${DB_URL:}")
    private String dbUrl;

    @Value("${spring.datasource.url:}")
    private String defaultUrl;

    @Value("${spring.datasource.username:}")
    private String defaultUsername;

    @Value("${spring.datasource.password:}")
    private String defaultPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        // Resolve raw database URL candidate across DATABASE_URL, DB_URL, or spring.datasource.url
        String candidateUrl = null;
        if (StringUtils.hasText(databaseUrl)) {
            candidateUrl = databaseUrl.trim();
        } else if (StringUtils.hasText(dbUrl)) {
            candidateUrl = dbUrl.trim();
        } else if (StringUtils.hasText(defaultUrl)) {
            candidateUrl = defaultUrl.trim();
        }

        // Strip surrounding quotes if loaded from .env or container environment
        if (candidateUrl != null && candidateUrl.startsWith("\"") && candidateUrl.endsWith("\"") && candidateUrl.length() > 1) {
            candidateUrl = candidateUrl.substring(1, candidateUrl.length() - 1);
        }

        HikariConfig config = new HikariConfig();
        config.setDriverClassName("org.postgresql.Driver");

        if (StringUtils.hasText(candidateUrl) && (candidateUrl.startsWith("postgres://") || candidateUrl.startsWith("postgresql://"))) {
            log.info("Configuring DataSource from PostgreSQL URI (Neon / Cloud Postgres)");
            try {
                URI uri = new URI(candidateUrl);
                String userInfo = uri.getUserInfo();
                String username = null;
                String password = null;
                if (userInfo != null) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    if (parts.length > 1) {
                        password = parts[1];
                    }
                }

                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath();
                String query = uri.getQuery();

                StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                        .append(host)
                        .append(":")
                        .append(port)
                        .append(path != null ? path : "");

                if (StringUtils.hasText(query)) {
                    jdbcUrl.append("?").append(query);
                }

                config.setJdbcUrl(jdbcUrl.toString());
                if (username != null) {
                    config.setUsername(username);
                }
                if (password != null) {
                    config.setPassword(password);
                }
            } catch (Exception ex) {
                log.error("Failed to parse PostgreSQL URI: {}", ex.getMessage());
                throw new IllegalStateException("Failed to parse database connection URI", ex);
            }
        } else if (StringUtils.hasText(candidateUrl)) {
            config.setJdbcUrl(candidateUrl);
            if (StringUtils.hasText(defaultUsername)) {
                config.setUsername(defaultUsername);
            }
            if (StringUtils.hasText(defaultPassword)) {
                config.setPassword(defaultPassword);
            }
        } else {
            throw new IllegalStateException("No database URL configured! Please set DATABASE_URL or DB_URL.");
        }

        // HikariCP connection pool settings tuned for Neon Serverless Postgres
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(300000); // 5 minutes
        config.setMaxLifetime(1800000); // 30 minutes
        config.setConnectionTimeout(20000); // 20 seconds
        config.setPoolName("BitConnect-NeonHikariPool");

        return new HikariDataSource(config);
    }
}
