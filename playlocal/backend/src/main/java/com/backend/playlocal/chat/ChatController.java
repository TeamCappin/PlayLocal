package com.backend.playlocal.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Date;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRoomService chatRoomService;
    private final ChatMessageRepository chatMessageRepository;

    // send message to a game room
    @MessageMapping("/game.send")
    public void sendToGameRoom(@Payload GameRoomMessage msg) {
        if (msg.getGameId() == null || msg.getGameId().isBlank()) return;
        if (msg.getSenderId() == null || msg.getSenderId().isBlank()) return;
        if (msg.getContent() == null || msg.getContent().isBlank()) return;

        ChatRoom room = chatRoomService.getOrCreate(msg.getGameId());

        ChatMessage saved = ChatMessage.builder()
                .roomId(room.getRoomId())
                .gameId(room.getGameId())
                .senderId(msg.getSenderId())
                .messageText(msg.getContent())
                .createdAt(msg.getTimestamp() != null ? msg.getTimestamp() : new Date())
                .deletedAt(null)
                .build();

        chatMessageRepository.save(saved);

        // broadcast to everyone in that room
        messagingTemplate.convertAndSend("/topic/game/" + msg.getGameId(), saved);
    }

    // room history (persistence)
    @GetMapping("/games/{gameId}/messages")
    public ResponseEntity<List<ChatMessage>> getHistory(@PathVariable String gameId) {
        ChatRoom room = chatRoomService.getOrCreate(gameId);
        return ResponseEntity.ok(chatMessageRepository.findByRoomIdOrderByCreatedAtAsc(room.getRoomId()));
    }

    // optional: force-create room on join
    @GetMapping("/games/{gameId}/room")
    public ResponseEntity<ChatRoom> getOrCreateRoom(@PathVariable String gameId) {
        return ResponseEntity.ok(chatRoomService.getOrCreate(gameId));
    }
}
