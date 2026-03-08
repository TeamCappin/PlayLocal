package com.backend.playlocal.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Validates the JWT secret during application startup in the production profile.
 *
 * <p>Production startup will be rejected if the secret is:</p>
 * <ul>
 *   <li>null or blank</li>
 *   <li>equal to a known default placeholder value</li>
 * </ul>
 *
 * <p>This validator is only active under the {@code prod} Spring profile and
 * has no effect in {@code dev}, {@code test}, or {@code local} profiles.</p>
 *
 * <p>To resolve a startup failure, set the {@code JWT_SECRET} environment
 * variable to a strong, unique value of at least 32 characters before
 * deploying.</p>
 */
@Profile("prod")
@Component
public class JwtSecretValidator {

    /**
     * Known default/placeholder secrets that must never be used in production.
     * These originate from {@code application.yml} and {@code docker-compose.yml}.
     */
    private static final Set<String> FORBIDDEN_SECRETS = Set.of(
            "your-256-bit-secret-key-change-in-production-minimum-32-chars",
            "development-secret-key-change-in-production-min-32-chars"
    );

    private final JwtConfig jwtConfig;

    public JwtSecretValidator(JwtConfig jwtConfig) {
        this.jwtConfig = jwtConfig;
    }

    @PostConstruct
    public void validateSecret() {
        String secret = jwtConfig.getSecret();

        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "[SECURITY] Production startup aborted: JWT_SECRET is not set or is blank. "
                    + "Set the JWT_SECRET environment variable to a strong, unique value "
                    + "of at least 32 characters before deploying."
            );
        }

        if (FORBIDDEN_SECRETS.contains(secret)) {
            throw new IllegalStateException(
                    "[SECURITY] Production startup aborted: JWT_SECRET is set to a known default "
                    + "placeholder value. Set JWT_SECRET to a strong, unique value of at least "
                    + "32 characters before deploying."
            );
        }
    }
}
