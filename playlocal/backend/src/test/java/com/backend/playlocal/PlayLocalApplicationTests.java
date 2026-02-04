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
 * In CI (GitHub Actions), uses the SPRING_DATASOURCE_URL environment variable
 * which points to the service container instead of starting a new container.
 */
@SpringBootTest
class PlayLocalApplicationTests {

    // Only initialize container if not in CI (Spring Boot will use SPRING_DATASOURCE_URL env var in CI)
    static PostgreSQLContainer<?> postgres;

    static {
        // Only create container for local development (CI uses service container via SPRING_DATASOURCE_URL)
        if (System.getenv("SPRING_DATASOURCE_URL") == null) {
            try {
                postgres = new PostgreSQLContainer<>("postgres:15-alpine")
                        .withDatabaseName("playlocal_test")
                        .withUsername("test")
                        .withPassword("test");
                postgres.start();
            } catch (Exception e) {
                postgres = null; // Docker unavailable; tests will use H2
            }
        }
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // Only configure Testcontainers properties if running locally with Docker
        // In CI, Spring Boot uses SPRING_DATASOURCE_URL. Without Docker, use H2 so context loads.
        if (postgres != null) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
        } else if (System.getenv("SPRING_DATASOURCE_URL") == null) {
            registry.add("spring.datasource.url", () -> "jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL");
            registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
            registry.add("spring.datasource.username", () -> "sa");
            registry.add("spring.datasource.password", () -> "");
            registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
            registry.add("spring.flyway.enabled", () -> "false");
        }
        if (postgres != null || System.getenv("SPRING_DATASOURCE_URL") != null) {
            registry.add("spring.flyway.enabled", () -> "true");
        }
    }

    @Test
    void contextLoads() {
    }
}
