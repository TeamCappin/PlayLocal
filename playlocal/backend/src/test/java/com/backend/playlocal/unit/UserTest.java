package com.backend.playlocal.unit;

import com.backend.playlocal.model.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for User entity.
 * UserStory: US-1.1 Register/Login/Logout
 * Tests Lombok builders, getters, setters, and entity methods.
 */
class UserTest {

    @Test
    @DisplayName("US-1.1: User builder should create valid object")
    void builder_CreatesValidUser() {
        UUID userId = UUID.randomUUID();
        Instant now = Instant.now();

        User user = User.builder()
                .userId(userId)
                .email("test@example.com")
                .passwordHash("hash")
                .displayName("Test")
                .status(User.UserStatus.ACTIVE)
                .createdAt(now)
                .build();

        assertThat(user.getUserId()).isEqualTo(userId);
        assertThat(user.getEmail()).isEqualTo("test@example.com");
        assertThat(user.getStatus()).isEqualTo(User.UserStatus.ACTIVE);
        assertThat(user.getReliabilityScore()).isEqualTo(100.0f); // Default
    }

    @Test
    @DisplayName("US-1.1: User setters should update fields")
    void setters_UpdateFields() {
        User user = new User();
        user.setEmail("test@example.com");
        user.setDisplayName("Name");
        user.setAvailability("Morning");

        assertThat(user.getEmail()).isEqualTo("test@example.com");
        assertThat(user.getDisplayName()).isEqualTo("Name");
        assertThat(user.getAvailability()).isEqualTo("Morning");
    }

    @Test
    @DisplayName("US-1.1: PreUpdate should update timestamp")
    void preUpdate_UpdatesTimestamp() throws Exception {
        User user = new User();
        user.setUpdatedAt(Instant.now().minusSeconds(100));

        // Use reflection to invoke protected method
        java.lang.reflect.Method onUpdate = User.class.getDeclaredMethod("onUpdate");
        onUpdate.setAccessible(true);
        onUpdate.invoke(user);

        assertThat(user.getUpdatedAt()).isAfter(Instant.now().minusSeconds(5));
    }

    @Test
    @DisplayName("US-1.1: User all args constructor should work")
    void allArgsConstructor_Works() {
        UUID userId = UUID.randomUUID();
        User user = new User(
                userId, "email", "hash", "name", "url", "phone",
                User.UserStatus.ACTIVE, null, "high", "all", "bio", "loc",
                100.0f, 0, 0, 0,
                Instant.now(), Instant.now(), null, null);

        assertThat(user.getUserId()).isEqualTo(userId);
    }

    @Test
    @DisplayName("US-1.1: User no args constructor should work")
    void noArgsConstructor_Works() {
        User user = new User();
        assertThat(user).isNotNull();
    }
}
