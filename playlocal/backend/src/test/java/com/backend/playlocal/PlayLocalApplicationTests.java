package com.backend.playlocal;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import com.backend.playlocal.testutil.DockerOrExternalDbCondition;

/**
 * Integration test that uses Testcontainers for local development.
 * In CI (GitHub Actions), uses the SPRING_DATASOURCE_URL environment variable
 * which points to the service container instead of starting a new container.
 */
@SpringBootTest
@ExtendWith(DockerOrExternalDbCondition.class)
class PlayLocalApplicationTests {

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
        registry.add("spring.flyway.enabled", () -> "true");
    }

    @Test
    void contextLoads() {
    }

    @AfterAll
    static void tearDown() {
        if (postgres != null) {
            postgres.stop();
        }
    }
}
