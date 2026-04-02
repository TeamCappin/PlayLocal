package com.backend.playlocal.unit;

import com.backend.playlocal.model.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for User entity lifecycle behavior.
 * Slug normalization and generation are owned by UsernameService.
 */
class UserSlugTest {

    @Test
    @DisplayName("onCreate sets createdAt and updatedAt")
    void onCreate_SetsTimestamps() throws Exception {
        User user = User.builder()
                .displayName("Test User")
                .build();

        java.lang.reflect.Method onCreate = User.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(user);

        assertThat(user.getCreatedAt()).isNotNull();
        assertThat(user.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("onCreate does not auto-generate slug")
    void onCreate_DoesNotGenerateSlug() throws Exception {
        User user = User.builder()
                .displayName("Test User")
                .build();

        java.lang.reflect.Method onCreate = User.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(user);

        assertThat(user.getSlug()).isNull();
    }

    @Test
    @DisplayName("onUpdate should update timestamp")
    void onUpdate_Called_UpdatesTimestamp() throws Exception {
        User user = User.builder()
                .displayName("Test")
                .updatedAt(Instant.now().minusSeconds(100))
                .build();

        Instant before = user.getUpdatedAt();

        java.lang.reflect.Method onUpdate = User.class.getDeclaredMethod("onUpdate");
        onUpdate.setAccessible(true);
        onUpdate.invoke(user);

        assertThat(user.getUpdatedAt()).isAfter(before);
    }
}
