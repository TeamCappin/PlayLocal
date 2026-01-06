package com.backend.playlocal.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for RateLimitConfig properties.
 * UserStory: US-1.1
 */
class RateLimitConfigTest {

    @Test
    @DisplayName("US-1.1: RateLimitConfig nested properties should work")
    void nestedPropertiesWork() {
        RateLimitConfig config = new RateLimitConfig();

        // Test Login Limit
        RateLimitConfig.LoginLimit loginLimit = new RateLimitConfig.LoginLimit();
        loginLimit.setMaxAttempts(10);
        loginLimit.setWindowMinutes(30);
        config.setLogin(loginLimit);

        assertThat(config.getLogin().getMaxAttempts()).isEqualTo(10);
        assertThat(config.getLogin().getWindowMinutes()).isEqualTo(30);

        // Test Report Limit
        RateLimitConfig.ReportLimit reportLimit = new RateLimitConfig.ReportLimit();
        reportLimit.setMaxPerHour(5);
        config.setReport(reportLimit);

        assertThat(config.getReport().getMaxPerHour()).isEqualTo(5);

        // Test General Limit
        RateLimitConfig.GeneralLimit generalLimit = new RateLimitConfig.GeneralLimit();
        generalLimit.setRequestsPerMinute(120);
        config.setGeneral(generalLimit);

        assertThat(config.getGeneral().getRequestsPerMinute()).isEqualTo(120);
    }
}
