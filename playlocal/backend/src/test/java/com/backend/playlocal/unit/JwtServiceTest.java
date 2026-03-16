package com.backend.playlocal.unit;

import com.backend.playlocal.config.JwtConfig;
import com.backend.playlocal.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for JwtService.
 * UserStory: US-1.1 Register/Login/Logout
 * Tests JWT token generation, parsing, and validation.
 */
class JwtServiceTest {

    private JwtService jwtService;
    private static final UUID TEST_USER_ID = UUID.randomUUID();
    private static final String TEST_EMAIL = "test@example.com";
    private static final List<String> TEST_ROLES = List.of("user");

    @BeforeEach
    void setUp() {
        // Create a JwtConfig with test values
        JwtConfig jwtConfig = new JwtConfig();
        jwtConfig.setSecret("test-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256");
        jwtConfig.setExpiration(86400000L); // 24 hours in ms

        jwtService = new JwtService(jwtConfig, null);
    }

    // ==========================================
    // TOKEN GENERATION TESTS
    // ==========================================

    @Test
    @DisplayName("US-1.1: generateToken should return a valid JWT string")
    void generateToken_ReturnsValidJwt() {
        String token = jwtService.generateToken(TEST_USER_ID, TEST_EMAIL, TEST_ROLES);

        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        // JWT format: header.payload.signature (3 parts separated by dots)
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    @DisplayName("US-1.1: generateToken should create different tokens for different users")
    void generateToken_UniquePerUser() {
        UUID userId1 = UUID.randomUUID();
        UUID userId2 = UUID.randomUUID();

        String token1 = jwtService.generateToken(userId1, "user1@example.com", TEST_ROLES);
        String token2 = jwtService.generateToken(userId2, "user2@example.com", TEST_ROLES);

        assertThat(token1).isNotEqualTo(token2);
    }

    // ==========================================
    // TOKEN PARSING TESTS
    // ==========================================

    @Test
    @DisplayName("US-1.1: getUserIdFromToken should extract correct user ID")
    void getUserIdFromToken_ReturnsCorrectUserId() {
        String token = jwtService.generateToken(TEST_USER_ID, TEST_EMAIL, TEST_ROLES);

        UUID extractedUserId = jwtService.getUserIdFromToken(token);

        assertThat(extractedUserId).isEqualTo(TEST_USER_ID);
    }

    @Test
    @DisplayName("US-1.1: getEmailFromToken should extract correct email")
    void getEmailFromToken_ReturnsCorrectEmail() {
        String token = jwtService.generateToken(TEST_USER_ID, TEST_EMAIL, TEST_ROLES);

        String extractedEmail = jwtService.getEmailFromToken(token);

        assertThat(extractedEmail).isEqualTo(TEST_EMAIL);
    }

    @Test
    @DisplayName("US-1.1: getRolesFromToken should extract correct roles")
    void getRolesFromToken_ReturnsCorrectRoles() {
        List<String> roles = List.of("user", "admin");
        String token = jwtService.generateToken(TEST_USER_ID, TEST_EMAIL, roles);

        List<String> extractedRoles = jwtService.getRolesFromToken(token);

        assertThat(extractedRoles).containsExactlyInAnyOrderElementsOf(roles);
    }

    // ==========================================
    // TOKEN VALIDATION TESTS
    // ==========================================

    @Test
    @DisplayName("US-1.1: validateToken should return true for valid token")
    void validateToken_ValidToken_ReturnsTrue() {
        String token = jwtService.generateToken(TEST_USER_ID, TEST_EMAIL, TEST_ROLES);

        boolean isValid = jwtService.validateToken(token);

        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("US-1.1: validateToken should return false for malformed token")
    void validateToken_MalformedToken_ReturnsFalse() {
        boolean isValid = jwtService.validateToken("not-a-valid-jwt-token");

        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("US-1.1: validateToken should return false for empty token")
    void validateToken_EmptyToken_ReturnsFalse() {
        boolean isValid = jwtService.validateToken("");

        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("US-1.1: validateToken should return false for null token")
    void validateToken_NullToken_ReturnsFalse() {
        boolean isValid = jwtService.validateToken(null);

        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("US-1.1: validateToken should return false for token signed with different key")
    void validateToken_DifferentSigningKey_ReturnsFalse() {
        // Create a service with a different secret
        JwtConfig differentConfig = new JwtConfig();
        differentConfig.setSecret("different-secret-key-that-is-also-at-least-256-bits-long");
        differentConfig.setExpiration(86400000L);
        JwtService differentService = new JwtService(differentConfig, null);

        // Generate token with different service
        String tokenFromDifferentKey = differentService.generateToken(TEST_USER_ID, TEST_EMAIL, TEST_ROLES);

        // Validate with our service
        boolean isValid = jwtService.validateToken(tokenFromDifferentKey);

        assertThat(isValid).isFalse();
    }

    // ==========================================
    // EXPIRATION TESTS
    // ==========================================

    @Test
    @DisplayName("US-1.1: getExpirationMs should return configured expiration")
    void getExpirationMs_ReturnsConfiguredValue() {
        long expiration = jwtService.getExpirationMs();

        assertThat(expiration).isEqualTo(86400000L);
    }

    @Test
    @DisplayName("US-1.1: validateToken should return false for expired token")
    void validateToken_ExpiredToken_ReturnsFalse() {
        // Create a service with very short expiration (already expired)
        JwtConfig expiredConfig = new JwtConfig();
        expiredConfig.setSecret("test-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256");
        expiredConfig.setExpiration(-1000L); // Negative = already expired

        JwtService expiredService = new JwtService(expiredConfig, null);
        String expiredToken = expiredService.generateToken(TEST_USER_ID, TEST_EMAIL, TEST_ROLES);

        // Wait a moment to ensure expiration
        boolean isValid = jwtService.validateToken(expiredToken);

        assertThat(isValid).isFalse();
    }
}
