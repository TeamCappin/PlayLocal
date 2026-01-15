package com.backend.playlocal.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "chat_message")
public class ChatMessage {

    @Id
    private String messageId;          // PK

    private String roomId;             // FK -> chat_room.roomId
    private String gameId;             // FK -> game.gameId (optional but useful)
    private String senderId;           // later can be senderParticipationId

    private String messageText;        // content
    private Date createdAt;
    private Date deletedAt;            // null normally
}
