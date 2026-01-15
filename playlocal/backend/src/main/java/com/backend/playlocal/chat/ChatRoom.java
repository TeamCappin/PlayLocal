package com.backend.playlocal.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "chat_room")
public class ChatRoom {

    @Id
    private String roomId; // PK

    @Indexed(unique = true)
    private String gameId; // FK, UK (1 room per game)

    private Date createdAt;

    public static ChatRoom create(String gameId) {
        return ChatRoom.builder()
                .roomId(UUID.randomUUID().toString())
                .gameId(gameId)
                .createdAt(new Date())
                .build();
    }
}
