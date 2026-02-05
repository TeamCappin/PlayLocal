package com.backend.playlocal.unit;

import com.backend.playlocal.model.dto.RequestUploadSlotResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class RequestUploadSlotResponseTest {

    @Test
    @DisplayName("RequestUploadSlotResponse should support constructors and getters/setters (objectKey alias)")
    void requestUploadSlotResponse_Basics() {
        // Arrange
        UUID mediaId = UUID.randomUUID();
        RequestUploadSlotResponse resp = new RequestUploadSlotResponse(mediaId, "http://example.com/put", "games/x/photos/y");

        // Act
        resp.setUploadUrl("http://example.com/put2");
        resp.setObjectKey("games/a/photos/b");

        // Assert
        assertThat(resp.getMediaId()).isEqualTo(mediaId);
        assertThat(resp.getUploadUrl()).isEqualTo("http://example.com/put2");
        assertThat(resp.getObjectKey()).isEqualTo("games/a/photos/b");
    }

    @Test
    @DisplayName("RequestUploadSlotResponse no-args constructor should create mutable object")
    void requestUploadSlotResponse_NoArgsConstructor() {
        // Arrange
        RequestUploadSlotResponse resp = new RequestUploadSlotResponse();
        UUID mediaId = UUID.randomUUID();

        // Act
        resp.setMediaId(mediaId);
        resp.setUploadUrl("u");
        resp.setObjectKey("k");

        // Assert
        assertThat(resp.getMediaId()).isEqualTo(mediaId);
        assertThat(resp.getUploadUrl()).isEqualTo("u");
        assertThat(resp.getObjectKey()).isEqualTo("k");
    }
}
