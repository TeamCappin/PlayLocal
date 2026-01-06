package com.backend.playlocal.model.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for User lifecycle events.
 * UserStory: US-1.1
 */
class UserLifecycleTest {

    @Test
    @DisplayName("US-1.1: onUpdate should update timestamp")
    void onUpdate_SetsUpdatedAt() throws InterruptedException {
        // Given
        Instant oldTime = Instant.now().minus(1, ChronoUnit.HOURS);
        User user = User.builder()
                .updatedAt(oldTime)
                .build();

        // When
        // Manually trigger the lifecycle method since we are not in a full JPA
        // container
        user.onUpdate();

        // Then
        assertThat(user.getUpdatedAt()).isAfter(oldTime);
        assertThat(user.getUpdatedAt()).isCloseTo(Instant.now(),
                org.assertj.core.api.Assertions.within(1, ChronoUnit.SECONDS));
    }
}
