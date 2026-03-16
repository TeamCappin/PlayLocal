package com.backend.playlocal.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Set;

/**
 * Validates the JWT secret during application startup.
 *
 * <p>Production startup will be rejected if the secret is:</p>
 * <ul>
 *   <li>null or blank</li>
 *   <li>equal to a known default placeholder value</li>
 * </ul>
 *
 * <p>This validator only enforces constraints when the {@code prod} Spring 
 * profile is active. It has no effect in {@code dev}, {@code test}, or 
 * {@code local} profiles.</p>
 *
 * <p>To resolve a startup failure, set the {@code JWT_SECRET} environment
 * variable to a strong, unique value whose UTF-8 encoding is at least 32 bytes
 * (required for HMAC-SHA256) before deploying.</p>
 */
@Component
@Lazy(false)
public class JwtSecretValidator {

    /**
     * Minimum UTF-8 byte length for the JWT secret.
     * JJWT requires ≥256 bits (32 bytes) for HMAC-SHA256.
     */
    private static final int MIN_SECRET_BYTES = 32;

    /**
     * Known default/placeholder secrets that must never be used in production.
     * These originate from {@code application.yml} and {@code docker-compose.yml}.
     */
    private static final Set<String> FORBIDDEN_SECRETS = Set.of(
            "your-256-bit-secret-key-change-in-production-minimum-32-chars",
            "development-secret-key-change-in-production-min-32-chars"
    );

    private final JwtConfig jwtConfig;
    private final Environment environment;

    public JwtSecretValidator(JwtConfig jwtConfig, Environment environment) {
        this.jwtConfig = jwtConfig;
        this.environment = environment;
    }

    @PostConstruct
    public void validateSecret() {
        boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");
        if (!isProd) {
            return;
        }
        String secret = jwtConfig.getSecret();

        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "[SECURITY] Production startup aborted: JWT_SECRET is not set or is blank. "
                    + "Set the JWT_SECRET environment variable to a strong, unique value "
                    + "whose UTF-8 encoding is at least 32 bytes before deploying."
            );
        }

        if (FORBIDDEN_SECRETS.contains(secret)) {
            throw new IllegalStateException(
                    "[SECURITY] Production startup aborted: JWT_SECRET is set to a known default "
                    + "placeholder value. Set JWT_SECRET to a strong, unique value whose "
                    + "UTF-8 encoding is at least 32 bytes before deploying."
            );
        }

        if (secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "[SECURITY] Production startup aborted: JWT_SECRET is too short. "
                    + "Its UTF-8 encoding must be at least 32 bytes to satisfy HMAC-SHA256 "
                    + "key requirements."
            );
        }
    }
}
