package com.backend.playlocal.model.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class OrganizerVerificationLifecycleTest {

    @Test
    @DisplayName("onCreate sets createdAt and updatedAt when createdAt is null")
    void onCreate_SetsCreatedAtAndUpdatedAt_WhenCreatedAtNull() {
        OrganizerVerification verification = OrganizerVerification.builder()
                .createdAt(null)
                .updatedAt(null)
                .build();

        verification.onCreate();

        assertThat(verification.getCreatedAt()).isNotNull();
        assertThat(verification.getUpdatedAt()).isNotNull();
        assertThat(verification.getUpdatedAt()).isCloseTo(Instant.now(), within(1, ChronoUnit.SECONDS));
    }

    @Test
    @DisplayName("onCreate preserves createdAt and refreshes updatedAt")
    void onCreate_PreservesCreatedAt_RefreshesUpdatedAt() {
        Instant existingCreatedAt = Instant.parse("2025-01-01T00:00:00Z");
        Instant oldUpdatedAt = Instant.now().minus(1, ChronoUnit.HOURS);

        OrganizerVerification verification = OrganizerVerification.builder()
                .createdAt(existingCreatedAt)
                .updatedAt(oldUpdatedAt)
                .build();

        verification.onCreate();

        assertThat(verification.getCreatedAt()).isEqualTo(existingCreatedAt);
        assertThat(verification.getUpdatedAt()).isAfter(oldUpdatedAt);
    }

    @Test
    @DisplayName("onUpdate refreshes updatedAt")
    void onUpdate_RefreshesUpdatedAt() {
        Instant oldUpdatedAt = Instant.now().minus(1, ChronoUnit.HOURS);
        OrganizerVerification verification = OrganizerVerification.builder()
                .updatedAt(oldUpdatedAt)
                .build();

        verification.onUpdate();

        assertThat(verification.getUpdatedAt()).isAfter(oldUpdatedAt);
        assertThat(verification.getUpdatedAt()).isCloseTo(Instant.now(), within(1, ChronoUnit.SECONDS));
    }
}
