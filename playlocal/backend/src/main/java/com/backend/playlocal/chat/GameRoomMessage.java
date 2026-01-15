package com.backend.playlocal.chat;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true) // safe for future additions
public class GameRoomMessage {

    private String gameId;
    private String senderId;

    // ✅ frontend sends senderName (ChatMessageRow displays it)
    private String senderName;

    private String content;

    // ✅ frontend sends createdAt; accept it and normalize
    // If you prefer the field name "createdAt" in Java too, keep it exactly.
    private Instant createdAt;

    // Optional: if some clients still send "timestamp", map it into createdAt
    @JsonProperty("timestamp")
    public void setTimestamp(Instant ts) {
        if (this.createdAt == null) this.createdAt = ts;
    }
}
