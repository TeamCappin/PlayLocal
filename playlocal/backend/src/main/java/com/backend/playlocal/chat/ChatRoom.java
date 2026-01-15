package com.backend.playlocal.chat;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "chat_room",
        uniqueConstraints = @UniqueConstraint(name = "uq_chat_room_game", columnNames = "game_id"))
public class ChatRoom {

    @Id
    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "game_id", nullable = false, unique = true)
    private UUID gameId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (roomId == null) roomId = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public static ChatRoom create(String gameId) {
        return ChatRoom.builder()
                .roomId(UUID.randomUUID())
                .gameId(UUID.fromString(gameId))
                .createdAt(Instant.now())
                .build();
    }
}
