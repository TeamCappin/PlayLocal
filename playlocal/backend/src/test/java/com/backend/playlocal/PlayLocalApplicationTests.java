package com.backend.playlocal;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Integration test that uses Testcontainers for local development.
 * In CI (GitHub Actions), uses the DATABASE_URL environment variable
 * which points to the service container instead of starting a new container.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class PlayLocalApplicationTests {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("playlocal_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // Only configure from Testcontainers if DATABASE_URL is not set (local dev)
        String databaseUrl = System.getenv("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isEmpty()) {
            // Local development: use Testcontainers
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
        }
        // CI environment: DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD already set
        registry.add("spring.flyway.enabled", () -> "true");
    }

    @Test
    void contextLoads() {
    }
}
