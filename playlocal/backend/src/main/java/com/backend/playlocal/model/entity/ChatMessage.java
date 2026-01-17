package com.backend.playlocal.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "chat_message", indexes = {
        @Index(name = "idx_chat_message_room_created", columnList = "room_id, created_at")
})
public class ChatMessage {

    @Id
    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "game_id", nullable = false)
    private UUID gameId;

    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    @Column(name = "sender_name")
    private String senderName;

    // Stored field (same concept as your messageText)
    @Column(name = "message_text", nullable = false, columnDefinition = "text")
    private String messageText;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @PrePersist
    void prePersist() {
        if (messageId == null) messageId = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    // ---- JSON shape for frontend (same as your current class) ----

    @JsonProperty("id")
    public String getId() {
        return messageId != null ? messageId.toString() : null;
    }

    @JsonProperty("content")
    public String getContent() {
        return messageText;
    }

    @JsonIgnore
    public String getMessageText() {
        return messageText;
    }
}