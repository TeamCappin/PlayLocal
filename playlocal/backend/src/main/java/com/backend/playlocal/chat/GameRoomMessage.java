package com.backend.playlocal.chat;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;

@JsonIgnoreProperties(ignoreUnknown = true)
public class GameRoomMessage {

    private String gameId;
    private String senderId;
    private String senderName;
    private String content;
    private Instant createdAt;

    public GameRoomMessage() {}

    public GameRoomMessage(String gameId, String senderId, String senderName, String content, Instant createdAt) {
        this.gameId = gameId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.content = content;
        this.createdAt = createdAt;
    }

    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    // If some clients send "timestamp", map it into createdAt
    @JsonProperty("timestamp")
    public void setTimestamp(Instant ts) {
        if (this.createdAt == null) this.createdAt = ts;
    }
}
