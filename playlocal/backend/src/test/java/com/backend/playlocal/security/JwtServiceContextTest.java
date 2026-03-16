package com.backend.playlocal.security;

import com.backend.playlocal.config.JwtConfig;
import com.backend.playlocal.config.JwtSecretValidator;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceContextTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(TestConfig.class);

    @Test
    void failsWithSecurityMessageNotJjwt() {
        contextRunner
                .withPropertyValues("spring.profiles.active=prod", "jwt.secret=too-short")
                .run(context -> {
                    assertThat(context).hasFailed();
                    // We expect our validator's exact root cause,
                    // NOT JJWT throwing WeakKeyException.
                    Throwable failure = context.getStartupFailure();
                    while (failure.getCause() != null && failure.getCause() != failure) {
                        failure = failure.getCause();
                    }
                    assertThat(failure)
                            .isInstanceOf(IllegalStateException.class)
                            .hasMessageContaining("[SECURITY]");
                });
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(JwtConfig.class)
    @Import({JwtService.class, JwtSecretValidator.class})
    static class TestConfig {
    }
}
