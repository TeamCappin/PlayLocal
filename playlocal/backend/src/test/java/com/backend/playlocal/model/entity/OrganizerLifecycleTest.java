package com.backend.playlocal.model.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class OrganizerLifecycleTest {

    @Test
    @DisplayName("onCreate sets createdAt and updatedAt when createdAt is null")
    void onCreate_SetsCreatedAtAndUpdatedAt_WhenCreatedAtNull() {
        Organizer organizer = Organizer.builder()
                .createdAt(null)
                .updatedAt(null)
                .build();

        organizer.onCreate();

        assertThat(organizer.getCreatedAt()).isNotNull();
        assertThat(organizer.getUpdatedAt()).isNotNull();
        assertThat(organizer.getUpdatedAt()).isCloseTo(Instant.now(), within(1, ChronoUnit.SECONDS));
    }

    @Test
    @DisplayName("onCreate preserves createdAt and refreshes updatedAt")
    void onCreate_PreservesCreatedAt_RefreshesUpdatedAt() {
        Instant existingCreatedAt = Instant.parse("2025-01-01T00:00:00Z");
        Instant oldUpdatedAt = Instant.now().minus(1, ChronoUnit.HOURS);

        Organizer organizer = Organizer.builder()
                .createdAt(existingCreatedAt)
                .updatedAt(oldUpdatedAt)
                .build();

        organizer.onCreate();

        assertThat(organizer.getCreatedAt()).isEqualTo(existingCreatedAt);
        assertThat(organizer.getUpdatedAt()).isAfter(oldUpdatedAt);
    }

    @Test
    @DisplayName("onUpdate refreshes updatedAt")
    void onUpdate_RefreshesUpdatedAt() {
        Instant oldUpdatedAt = Instant.now().minus(1, ChronoUnit.HOURS);
        Organizer organizer = Organizer.builder()
                .updatedAt(oldUpdatedAt)
                .build();

        organizer.onUpdate();

        assertThat(organizer.getUpdatedAt()).isAfter(oldUpdatedAt);
        assertThat(organizer.getUpdatedAt()).isCloseTo(Instant.now(), within(1, ChronoUnit.SECONDS));
    }
}
