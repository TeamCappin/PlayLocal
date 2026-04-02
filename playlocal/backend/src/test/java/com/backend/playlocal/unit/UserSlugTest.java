package com.backend.playlocal.unit;

import com.backend.playlocal.model.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for User entity slug functionality.
 * Covers: generateSlug, updateSlugIfNeeded, lifecycle hooks
 */
class UserSlugTest {

    @Test
    @DisplayName("generateSlug should convert display name to lowercase with hyphens")
    void generateSlug_NormalName_ReturnsSlug() {
        String slug = User.generateSlug("John Doe");
        assertThat(slug).isEqualTo("john-doe");
    }

    @Test
    @DisplayName("generateSlug should handle special characters")
    void generateSlug_SpecialCharacters_RemovesThem() {
        String slug = User.generateSlug("John's Game! #1");
        assertThat(slug).isEqualTo("john-s-game-1");
    }

    @Test
    @DisplayName("generateSlug should handle multiple spaces")
    void generateSlug_MultipleSpaces_SingleHyphen() {
        String slug = User.generateSlug("John    Doe");
        assertThat(slug).isEqualTo("john-doe");
    }

    @Test
    @DisplayName("generateSlug should return null for null input")
    void generateSlug_NullInput_ReturnsNull() {
        String slug = User.generateSlug(null);
        assertThat(slug).isNull();
    }

    @Test
    @DisplayName("generateSlug should trim leading/trailing hyphens")
    void generateSlug_LeadingTrailingSpecialChars_TrimsHyphens() {
        String slug = User.generateSlug("  -John Doe-  ");
        assertThat(slug).isEqualTo("john-doe");
    }

    @Test
    @DisplayName("generateSlug should truncate to 32 characters")
    void generateSlug_LongDisplayName_TruncatesTo32() {
        String slug = User.generateSlug("This Display Name Is Extremely Long And Keeps Going Forever");

        assertThat(slug.length()).isLessThanOrEqualTo(User.MAX_SLUG_LENGTH);
        assertThat(slug).doesNotEndWith("-");
    }

    @Test
    @DisplayName("onCreate should populate slug from displayName")
    void onCreate_DisplayNameSet_PopulatesSlug() throws Exception {
        User user = User.builder()
                .displayName("Test User")
                .build();

        // Manually invoke @PrePersist method via reflection
        java.lang.reflect.Method onCreate = User.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(user);

        assertThat(user.getSlug()).isEqualTo("test-user");
        assertThat(user.getCreatedAt()).isNotNull();
        assertThat(user.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("onCreate should not overwrite existing slug")
    void onCreate_SlugAlreadySet_DoesNotOverwrite() throws Exception {
        User user = User.builder()
                .displayName("Test User")
                .slug("existing-slug")
                .build();

        java.lang.reflect.Method onCreate = User.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(user);

        assertThat(user.getSlug()).isEqualTo("existing-slug");
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

    @Test
    @DisplayName("updateSlugIfNeeded does nothing if slug is already set")
    void updateSlugIfNeeded_SlugExists_NoChange() throws Exception {
        User user = User.builder()
                .displayName("New Name")
                .slug("old-slug")
                .build();

        java.lang.reflect.Method updateSlugIfNeeded = User.class.getDeclaredMethod("updateSlugIfNeeded");
        updateSlugIfNeeded.setAccessible(true);
        updateSlugIfNeeded.invoke(user);

        assertThat(user.getSlug()).isEqualTo("old-slug");
    }

    @Test
    @DisplayName("updateSlugIfNeeded does nothing if displayName is null")
    void updateSlugIfNeeded_NullDisplayName_NoChange() throws Exception {
        User user = User.builder().build();

        java.lang.reflect.Method updateSlugIfNeeded = User.class.getDeclaredMethod("updateSlugIfNeeded");
        updateSlugIfNeeded.setAccessible(true);
        updateSlugIfNeeded.invoke(user);

        assertThat(user.getSlug()).isNull();
    }
}
