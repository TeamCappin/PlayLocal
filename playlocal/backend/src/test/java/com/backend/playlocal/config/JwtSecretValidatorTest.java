package com.backend.playlocal.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import org.springframework.core.env.Environment;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link JwtSecretValidator}.
 *
 * <p>These tests instantiate the validator directly (no Spring context) to
 * keep them fast and database-free. Each test covers one scenario from the
 * US-FB-4 acceptance criteria.</p>
 */
class JwtSecretValidatorTest {

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private JwtSecretValidator validatorWithSecret(String secret) {
        return validatorWithSecretAndProfile(secret, "prod");
    }

    private JwtSecretValidator validatorWithSecretAndProfile(String secret, String profile) {
        JwtConfig config = new JwtConfig();
        config.setSecret(secret);
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles(profile);
        return new JwtSecretValidator(config, env);
    }

    // -----------------------------------------------------------------------
    // Acceptance Test 1 — production with default application.yml placeholder
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("US-FB-4: validateSecret throws when secret equals application.yml default")
    void validateSecret_throwsForApplicationYmlDefault() {
        JwtSecretValidator validator = validatorWithSecret(
                "your-256-bit-secret-key-change-in-production-minimum-32-chars");

        assertThatThrownBy(validator::validateSecret)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("[SECURITY]");
    }

    // -----------------------------------------------------------------------
    // Acceptance Test 2 — production with default docker-compose placeholder
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("US-FB-4: validateSecret throws when secret equals docker-compose default")
    void validateSecret_throwsForDockerComposeDefault() {
        JwtSecretValidator validator = validatorWithSecret(
                "development-secret-key-change-in-production-min-32-chars");

        assertThatThrownBy(validator::validateSecret)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("[SECURITY]");
    }

    // -----------------------------------------------------------------------
    // Acceptance Test 3 — production with blank secret
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("US-FB-4: validateSecret throws when secret is blank")
    void validateSecret_throwsForBlankSecret() {
        JwtSecretValidator validator = validatorWithSecret("   ");

        assertThatThrownBy(validator::validateSecret)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("[SECURITY]");
    }

    @Test
    @DisplayName("US-FB-4: validateSecret throws when secret is null")
    void validateSecret_throwsForNullSecret() {
        JwtSecretValidator validator = validatorWithSecret(null);

        assertThatThrownBy(validator::validateSecret)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("[SECURITY]");
    }

    // -----------------------------------------------------------------------
    // Acceptance Test 4 — production with a secret shorter than 32 bytes
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("US-FB-4: validateSecret throws when secret is shorter than 32 bytes")
    void validateSecret_throwsForShortSecret() {
        JwtSecretValidator validator = validatorWithSecret("too-short");

        assertThatThrownBy(validator::validateSecret)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("[SECURITY]");
    }

    // -----------------------------------------------------------------------
    // Acceptance Test 5 — production with a valid, non-default secret
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("US-FB-4: validateSecret passes for a strong unique secret")
    void validateSecret_passesForStrongSecret() {
        JwtSecretValidator validator = validatorWithSecret(
                "9f2c84ab-1ea3-4d7b-b92e-5a3f6d0e12c7-secure-prod-secret");

        assertThatCode(validator::validateSecret).doesNotThrowAnyException();
    }
}
