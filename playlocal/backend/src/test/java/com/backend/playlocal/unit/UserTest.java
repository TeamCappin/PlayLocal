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
    @DisplayName("US-1.4: PreUpdate should generate slug if missing")
    void preUpdate_GeneratesSlug() throws Exception {
        User user = new User();
        user.setDisplayName("Updated User");
        // slug is null by default

        java.lang.reflect.Method onUpdate = User.class.getDeclaredMethod("onUpdate");
        onUpdate.setAccessible(true);
        onUpdate.invoke(user);

        assertThat(user.getSlug()).isEqualTo("updated-user");
    }

    @Test
    @DisplayName("US-1.1: User all args constructor should work")
    void allArgsConstructor_Works() {
        UUID userId = UUID.randomUUID();
        User user = new User(
                userId, "email", "hash", "name", "name-slug", "url", "phone",
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

    @Test
    @DisplayName("US-1.4: generateSlug should handle null safely")
    void generateSlug_Null_ReturnsNull() {
        assertThat(User.generateSlug(null)).isNull();
    }

    @Test
    @DisplayName("US-1.4: generateSlug should lowercase and replace spaces")
    void generateSlug_SimpleName() {
        assertThat(User.generateSlug("Test User")).isEqualTo("test-user");
    }

    @Test
    @DisplayName("US-1.4: generateSlug should remove special chars")
    void generateSlug_SpecialChars() {
        assertThat(User.generateSlug("User #1 @ Home!")).isEqualTo("user-1-home");
    }

    @Test
    @DisplayName("US-1.4: generateSlug should trim dashes")
    void generateSlug_TrimDashes() {
        assertThat(User.generateSlug("-User Name-")).isEqualTo("user-name");
    }

    @Test
    @DisplayName("US-1.4: generateSlug should collapse multiple dashes")
    void generateSlug_CollapseDashes() {
        assertThat(User.generateSlug("User   Name")).isEqualTo("user-name");
    }

    @Test
    @DisplayName("US-1.4: Lifecycle hooks should generate slug")
    void lifecycleHooks_GenerateSlug() throws Exception {
        User user = User.builder().displayName("New User").build();

        // Use reflection to invoke protected lifecycle methods
        java.lang.reflect.Method onCreate = User.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(user);

        assertThat(user.getSlug()).isEqualTo("new-user");
        assertThat(user.getCreatedAt()).isNotNull();
        assertThat(user.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("US-1.4: Lifecycle hooks should preserve existing slug")
    void lifecycleHooks_PreserveExistingSlug() throws Exception {
        User user = User.builder()
                .displayName("New User")
                .slug("custom-slug")
                .build();

        java.lang.reflect.Method onCreate = User.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(user);

        assertThat(user.getSlug()).isEqualTo("custom-slug");
    }

    @Test
    @DisplayName("US-1.4: Lifecycle hooks should not generate slug if display name is null")
    void lifecycleHooks_NullDisplayName_NoSlug() throws Exception {
        User user = User.builder().displayName(null).build();

        java.lang.reflect.Method onCreate = User.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(user);

        assertThat(user.getSlug()).isNull();
    }
}
