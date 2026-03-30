package com.backend.playlocal.integration;

import com.backend.playlocal.service.EmailService;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.junit.jupiter.api.extension.ExtendWith;
import com.backend.playlocal.testutil.DockerOrExternalDbCondition;

/**
 * Base class for integration tests that require a real PostgreSQL database.
 * Uses Testcontainers to spin up a PostgreSQL instance for local testing.
 * In CI (GitHub Actions), uses SPRING_DATASOURCE_URL environment variable
 * pointing to service container.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "mail.from-email=test@playlocal.com",
                "mail.from-name=PlayLocal",
                "mail.enabled=false",
                "mail.brevo-api-key=test-key",
                "jwt.secret=test-secret-key-that-is-long-enough-for-testing-purposes",
                "jwt.expiration=86400000",
                "recaptcha.secret-key=test-key",
                "recaptcha.enabled=false",
                "recaptcha.score-threshold=0.5",
                "s3.bucket=test-bucket",
                "s3.region=us-east-2",
                "s3.accessKey=test-key",
                "s3.secretKey=test-secret",
                "s3.endpoint=http://localhost:4566",
                "s3.publicEndpoint=http://localhost:4566",
                "s3.forcePathStyle=true",
                "s3.presignExpirySeconds=900"
        })
@ExtendWith(DockerOrExternalDbCondition.class)
public abstract class IntegrationTestBase {

    @MockBean
    private EmailService emailService;  // prevents real Brevo calls in all integration tests

    static PostgreSQLContainer<?> postgres;

    private static boolean hasExternalDatasource() {
        String springDatasourceUrl = System.getenv("SPRING_DATASOURCE_URL");
        String databaseUrl = System.getenv("DATABASE_URL");
        return (springDatasourceUrl != null && !springDatasourceUrl.isBlank())
                || (databaseUrl != null && !databaseUrl.isBlank());
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        if (!hasExternalDatasource()) {
            if (postgres == null || !postgres.isRunning()) {
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
}