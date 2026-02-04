package com.backend.playlocal.integration;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.extension.ExtendWith;
import com.backend.playlocal.testutil.DockerOrExternalDbCondition;

/**
 * Base class for integration tests that require a real PostgreSQL database.
 * Uses Testcontainers to spin up a PostgreSQL instance for local testing.
 * In CI (GitHub Actions), uses SPRING_DATASOURCE_URL environment variable pointing to service container.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ExtendWith(DockerOrExternalDbCondition.class)
public abstract class IntegrationTestBase {

    // Only initialize container if not in CI (Spring Boot will use SPRING_DATASOURCE_URL env var in CI)
    static PostgreSQLContainer<?> postgres;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // Only configure Testcontainers properties if running locally
        // In CI, Spring Boot automatically uses SPRING_DATASOURCE_URL environment variables
        if (System.getenv("SPRING_DATASOURCE_URL") == null) {
            if (postgres == null) {
                postgres = new PostgreSQLContainer<>("postgres:15-alpine")
                        .withDatabaseName("playlocal_test")
                        .withUsername("test")
                        .withPassword("test");
                postgres.start();
            }
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
        }
    }

    @AfterAll
    static void tearDown() {
        if (postgres != null) {
            postgres.stop();
        }
    }
}
