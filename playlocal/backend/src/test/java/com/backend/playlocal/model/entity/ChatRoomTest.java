package com.backend.playlocal.model.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ChatRoomTest {

    @Test
    @DisplayName("ChatRoom.create: sets roomId, gameId, createdAt")
    void create_SetsFields() {
        // Arrange
        String gameId = UUID.randomUUID().toString();

        // Act
        ChatRoom room = ChatRoom.create(gameId);

        // Assert
        assertThat(room).isNotNull();
        assertThat(room.getRoomId()).isNotNull();
        assertThat(room.getGameId()).isEqualTo(UUID.fromString(gameId));
        assertThat(room.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("prePersist: sets roomId/createdAt when missing")
    void prePersist_SetsDefaults_WhenNull() {
        // Arrange
        ChatRoom room = new ChatRoom();
        room.setGameId(UUID.randomUUID());
        room.setRoomId(null);
        room.setCreatedAt(null);

        // Act
        room.prePersist();

        // Assert
        assertThat(room.getRoomId()).isNotNull();
        assertThat(room.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("prePersist: does not overwrite existing roomId/createdAt")
    void prePersist_DoesNotOverwrite_WhenAlreadySet() {
        // Arrange
        UUID existingRoomId = UUID.randomUUID();
        Instant existingCreatedAt = Instant.parse("2025-01-01T00:00:00Z");

        ChatRoom room = new ChatRoom();
        room.setGameId(UUID.randomUUID());
        room.setRoomId(existingRoomId);
        room.setCreatedAt(existingCreatedAt);

        // Act
        room.prePersist();

        // Assert
        assertThat(room.getRoomId()).isEqualTo(existingRoomId);
        assertThat(room.getCreatedAt()).isEqualTo(existingCreatedAt);
    }
}
