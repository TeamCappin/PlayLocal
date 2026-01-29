package com.backend.playlocal.unit;

import com.backend.playlocal.model.entity.GameTag;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for GameTag entity.
 * UserStory: US-4.2 Community-Specific Game Filters
 */
class GameTagTest {

    @Test
    @DisplayName("US-4.2: GameTag builder should create valid object")
    void builder_CreatesValidGameTag() {
        UUID id = UUID.randomUUID();

        GameTag tag = GameTag.builder()
                .tagId(id)
                .tagType("community")
                .name("women")
                .isSystemTag(true)
                .isRestricted(true)
                .build();

        assertThat(tag.getTagId()).isEqualTo(id);
        assertThat(tag.getTagType()).isEqualTo("community");
        assertThat(tag.getName()).isEqualTo("women");
        assertThat(tag.getIsSystemTag()).isTrue();
        assertThat(tag.getIsRestricted()).isTrue();
    }

    @Test
    @DisplayName("US-4.2: GameTag defaults should work correctly")
    void defaults_WorkCorrectly() {
        GameTag tag = GameTag.builder()
                .tagType("language")
                .name("french-speaking")
                .build();

        assertThat(tag.getIsSystemTag()).isFalse();
        assertThat(tag.getIsRestricted()).isFalse();
    }

    @Test
    @DisplayName("US-4.2: GameTag setters should update fields")
    void setters_UpdateFields() {
        GameTag tag = new GameTag();

        tag.setTagType("community");
        tag.setName("men");
        tag.setIsSystemTag(true);
        tag.setIsRestricted(true);

        assertThat(tag.getTagType()).isEqualTo("community");
        assertThat(tag.getName()).isEqualTo("men");
        assertThat(tag.getIsSystemTag()).isTrue();
        assertThat(tag.getIsRestricted()).isTrue();
    }

    @Test
    @DisplayName("US-4.2: GameTag no args constructor should work")
    void noArgsConstructor_Works() {
        GameTag tag = new GameTag();
        assertThat(tag).isNotNull();
    }

    @Test
    @DisplayName("US-4.2: GameTag all args constructor should work")
    void allArgsConstructor_Works() {
        UUID id = UUID.randomUUID();
        GameTag tag = new GameTag(id, "community", "beginner-friendly", true, false);

        assertThat(tag.getTagId()).isEqualTo(id);
        assertThat(tag.getTagType()).isEqualTo("community");
        assertThat(tag.getName()).isEqualTo("beginner-friendly");
        assertThat(tag.getIsSystemTag()).isTrue();
        assertThat(tag.getIsRestricted()).isFalse();
    }
}
