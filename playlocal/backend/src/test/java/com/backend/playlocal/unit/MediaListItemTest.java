package com.backend.playlocal.unit;

import com.backend.playlocal.model.dto.MediaListItem;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class MediaListItemTest {

    @Test
    @DisplayName("MediaListItem should support constructors and getters/setters")
    void mediaListItem_Basics() {
        // Arrange
        UUID mediaId = UUID.randomUUID();
        UUID uploaderId = UUID.randomUUID();
        Instant createdAt = Instant.now();

        MediaListItem item = new MediaListItem(mediaId, "http://example.com/get", createdAt, uploaderId);

        // Act
        item.setUrl("http://example.com/get2");

        // Assert
        assertThat(item.getMediaId()).isEqualTo(mediaId);
        assertThat(item.getUrl()).isEqualTo("http://example.com/get2");
        assertThat(item.getCreatedAt()).isEqualTo(createdAt);
        assertThat(item.getUploaderUserId()).isEqualTo(uploaderId);
    }

    @Test
    @DisplayName("MediaListItem no-args constructor should create mutable object")
    void mediaListItem_NoArgsConstructor() {
        // Arrange
        MediaListItem item = new MediaListItem();
        UUID mediaId = UUID.randomUUID();
        UUID uploaderId = UUID.randomUUID();
        Instant createdAt = Instant.parse("2026-01-01T00:00:00Z");

        // Act
        item.setMediaId(mediaId);
        item.setUrl("u");
        item.setCreatedAt(createdAt);
        item.setUploaderUserId(uploaderId);

        // Assert
        assertThat(item.getMediaId()).isEqualTo(mediaId);
        assertThat(item.getUrl()).isEqualTo("u");
        assertThat(item.getCreatedAt()).isEqualTo(createdAt);
        assertThat(item.getUploaderUserId()).isEqualTo(uploaderId);
    }
}
