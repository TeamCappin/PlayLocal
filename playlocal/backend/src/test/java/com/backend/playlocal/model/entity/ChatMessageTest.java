package com.backend.playlocal.model.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ChatMessageTest {

    @Test
    @DisplayName("prePersist: sets messageId/createdAt when missing")
    void prePersist_SetsDefaults_WhenNull() {
        // Arrange
        ChatMessage msg = new ChatMessage();
        msg.setRoomId(UUID.randomUUID());
        msg.setGameId(UUID.randomUUID());
        msg.setSenderId(UUID.randomUUID());
        msg.setMessageText("hello");
        msg.setMessageId(null);
        msg.setCreatedAt(null);

        // Act
        msg.prePersist();

        // Assert
        assertThat(msg.getMessageId()).isNotNull();
        assertThat(msg.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("prePersist: does not overwrite existing messageId/createdAt")
    void prePersist_DoesNotOverwrite_WhenAlreadySet() {
        // Arrange
        UUID id = UUID.randomUUID();
        Instant createdAt = Instant.parse("2025-01-01T00:00:00Z");

        ChatMessage msg = new ChatMessage();
        msg.setRoomId(UUID.randomUUID());
        msg.setGameId(UUID.randomUUID());
        msg.setSenderId(UUID.randomUUID());
        msg.setMessageText("hello");
        msg.setMessageId(id);
        msg.setCreatedAt(createdAt);

        // Act
        msg.prePersist();

        // Assert
        assertThat(msg.getMessageId()).isEqualTo(id);
        assertThat(msg.getCreatedAt()).isEqualTo(createdAt);
    }

    @Test
    @DisplayName("JSON shape: getId returns messageId string or null")
    void getId_ReturnsStringOrNull() {
        // Arrange
        UUID id = UUID.randomUUID();
        ChatMessage withId = ChatMessage.builder()
                .messageId(id)
                .messageText("x")
                .roomId(UUID.randomUUID())
                .gameId(UUID.randomUUID())
                .senderId(UUID.randomUUID())
                .createdAt(Instant.now())
                .build();

        ChatMessage withoutId = ChatMessage.builder()
                .messageId(null)
                .messageText("x")
                .roomId(UUID.randomUUID())
                .gameId(UUID.randomUUID())
                .senderId(UUID.randomUUID())
                .createdAt(Instant.now())
                .build();

        // Act
        String id1 = withId.getId();
        String id2 = withoutId.getId();

        // Assert
        assertThat(id1).isEqualTo(id.toString());
        assertThat(id2).isNull();
    }

    @Test
    @DisplayName("JSON shape: getContent returns messageText")
    void getContent_ReturnsMessageText() {
        // Arrange
        ChatMessage msg = ChatMessage.builder()
                .messageId(UUID.randomUUID())
                .roomId(UUID.randomUUID())
                .gameId(UUID.randomUUID())
                .senderId(UUID.randomUUID())
                .messageText("Hello world")
                .createdAt(Instant.now())
                .build();

        // Act
        String content = msg.getContent();

        // Assert
        assertThat(content).isEqualTo("Hello world");
    }

    @Test
    @DisplayName("getMessageText returns stored messageText")
    void getMessageText_ReturnsStoredField() {
        // Arrange
        ChatMessage msg = ChatMessage.builder()
                .messageId(UUID.randomUUID())
                .roomId(UUID.randomUUID())
                .gameId(UUID.randomUUID())
                .senderId(UUID.randomUUID())
                .messageText("Stored field")
                .createdAt(Instant.now())
                .build();

        // Act
        String stored = msg.getMessageText();

        // Assert
        assertThat(stored).isEqualTo("Stored field");
    }
}
