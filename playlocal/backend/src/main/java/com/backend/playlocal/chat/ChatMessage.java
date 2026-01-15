package com.backend.playlocal.chat;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    private String messageId;          // Mongo _id

    private String roomId;             // FK -> chat_room.roomId
    private String gameId;             // useful for filtering
    private String senderId;

    private String senderName;

    // Stored field
    private String messageText;        // stored content
    private Date createdAt;
    private Date deletedAt;            // null normally

    // -----------------------------
    // JSON shape for frontend
    // -----------------------------

    /**
     * Frontend expects `id`.
     * We expose `messageId` as `id` without changing the DB field name.
     */
    @JsonProperty("id")
    public String getId() {
        return messageId;
    }

    /**
     * Frontend expects `content`.
     * We expose `messageText` as `content`.
     */
    @JsonProperty("content")
    public String getContent() {
        return messageText;
    }

    /**
     * Prevent duplicate JSON field if you don't want `messageText` appearing too.
     */
    @JsonIgnore
    public String getMessageText() {
        return messageText;
    }
}
