package com.backend.playlocal.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Context-level tests for {@link JwtSecretValidator} profile and startup behavior.
 */
class JwtSecretValidatorContextTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(JwtSecretValidatorTestConfig.class);

    @Test
    @DisplayName("US-FB-4: validator Bean is created but has no effect outside prod profile")
    void validatorBeanHasNoEffectOutsideProdProfile() {
        contextRunner
                .withPropertyValues("jwt.secret=development-secret-key-change-in-production-min-32-chars")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    // Bean is always created now, but fast-returns if not "prod"
                    assertThat(context).hasSingleBean(JwtSecretValidator.class);
                });
    }

    @Test
    @DisplayName("US-FB-4: prod context fails to start with default placeholder")
    void prodContextFailsForDefaultSecret() {
        contextRunner
                .withPropertyValues(
                        "spring.profiles.active=prod",
                        "jwt.secret=your-256-bit-secret-key-change-in-production-minimum-32-chars")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .hasRootCauseInstanceOf(IllegalStateException.class);
                    assertThat(context.getStartupFailure().getCause())
                            .isInstanceOf(IllegalStateException.class)
                            .hasMessageContaining("[SECURITY]");
                });
    }

    @Test
    @DisplayName("US-FB-4: prod context fails to start with a too-short secret")
    void prodContextFailsForShortSecret() {
        contextRunner
                .withPropertyValues(
                        "spring.profiles.active=prod",
                        "jwt.secret=too-short")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure().getCause())
                            .isInstanceOf(IllegalStateException.class)
                            .hasMessageContaining("[SECURITY]");
                });
    }

    @Test
    @DisplayName("US-FB-4: prod context starts with non-default secret")
    void prodContextStartsForNonDefaultSecret() {
        contextRunner
                .withPropertyValues(
                        "spring.profiles.active=prod",
                        "jwt.secret=secure-prod-secret-35-characters-minimum")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context).hasSingleBean(JwtSecretValidator.class);
                });
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(JwtConfig.class)
    @Import(JwtSecretValidator.class)
    static class JwtSecretValidatorTestConfig {
    }
}
