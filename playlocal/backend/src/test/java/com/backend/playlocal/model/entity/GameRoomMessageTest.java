package com.backend.playlocal.model.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class GameRoomMessageTest {

    @Test
    @DisplayName("Default constructor: fields are null")
    void defaultConstructor_FieldsNull() {
        // Arrange
        // (nothing)

        // Act
        GameRoomMessage msg = new GameRoomMessage();

        // Assert
        assertThat(msg.getGameId()).isNull();
        assertThat(msg.getSenderId()).isNull();
        assertThat(msg.getSenderName()).isNull();
        assertThat(msg.getContent()).isNull();
        assertThat(msg.getCreatedAt()).isNull();
    }

    @Test
    @DisplayName("All-args constructor: populates all fields")
    void allArgsConstructor_PopulatesFields() {
        // Arrange
        Instant ts = Instant.parse("2025-01-01T00:00:00Z");

        // Act
        GameRoomMessage msg = new GameRoomMessage(
                "game-1",
                "sender-1",
                "Alice",
                "Hello",
                ts
        );

        // Assert
        assertThat(msg.getGameId()).isEqualTo("game-1");
        assertThat(msg.getSenderId()).isEqualTo("sender-1");
        assertThat(msg.getSenderName()).isEqualTo("Alice");
        assertThat(msg.getContent()).isEqualTo("Hello");
        assertThat(msg.getCreatedAt()).isEqualTo(ts);
    }

    @Test
    @DisplayName("Setters + getters: round-trip values")
    void settersGetters_RoundTrip() {
        // Arrange
        GameRoomMessage msg = new GameRoomMessage();
        Instant ts = Instant.parse("2026-01-15T12:34:56Z");

        // Act
        msg.setGameId("game-x");
        msg.setSenderId("user-x");
        msg.setSenderName("Bob");
        msg.setContent("Message content");
        msg.setCreatedAt(ts);

        // Assert
        assertThat(msg.getGameId()).isEqualTo("game-x");
        assertThat(msg.getSenderId()).isEqualTo("user-x");
        assertThat(msg.getSenderName()).isEqualTo("Bob");
        assertThat(msg.getContent()).isEqualTo("Message content");
        assertThat(msg.getCreatedAt()).isEqualTo(ts);
    }

    @Test
    @DisplayName("setTimestamp: sets createdAt only when createdAt is null")
    void setTimestamp_SetsCreatedAt_WhenNull() {
        // Arrange
        GameRoomMessage msg = new GameRoomMessage();
        Instant ts = Instant.parse("2025-02-02T02:02:02Z");
        msg.setCreatedAt(null);

        // Act
        msg.setTimestamp(ts);

        // Assert
        assertThat(msg.getCreatedAt()).isEqualTo(ts);
    }

    @Test
    @DisplayName("setTimestamp: does NOT overwrite createdAt when already set")
    void setTimestamp_DoesNotOverwrite_WhenAlreadySet() {
        // Arrange
        GameRoomMessage msg = new GameRoomMessage();
        Instant existing = Instant.parse("2025-01-01T00:00:00Z");
        Instant incoming = Instant.parse("2025-02-02T02:02:02Z");

        msg.setCreatedAt(existing);

        // Act
        msg.setTimestamp(incoming);

        // Assert
        assertThat(msg.getCreatedAt()).isEqualTo(existing);
    }
}
