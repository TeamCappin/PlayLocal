package com.backend.playlocal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import com.backend.playlocal.service.EmailService;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
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
class PlayLocalApplicationTest {

    @MockBean
    private EmailService emailService;

    @Test
    @DisplayName("US-1.1: Application context loads successfully")
    void contextLoads() {
    }
}