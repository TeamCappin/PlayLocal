package com.backend.playlocal.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class GameRoomMessage {
    private String gameId;
    private String senderId;
    private String content;
    private Date timestamp;
}
