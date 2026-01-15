package com.backend.playlocal.chat;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRoomService chatRoomService;
    private final ChatMessageRepository chatMessageRepository;

    public ChatController(SimpMessagingTemplate messagingTemplate,
                          ChatRoomService chatRoomService,
                          ChatMessageRepository chatMessageRepository) {
        this.messagingTemplate = messagingTemplate;
        this.chatRoomService = chatRoomService;
        this.chatMessageRepository = chatMessageRepository;
    }

    @MessageMapping("/game.send")
    public void sendToGameRoom(@Payload GameRoomMessage msg) {
        if (msg.getGameId() == null || msg.getGameId().isBlank()) return;
        if (msg.getSenderId() == null || msg.getSenderId().isBlank()) return;
        if (msg.getContent() == null || msg.getContent().isBlank()) return;

        ChatRoom room = chatRoomService.getOrCreate(msg.getGameId());

        Instant createdAt = (msg.getCreatedAt() != null) ? msg.getCreatedAt() : Instant.now();

        ChatMessage saved = ChatMessage.builder()
                .roomId(room.getRoomId())
                .gameId(UUID.fromString(room.getGameId().toString()))
                .senderId(UUID.fromString(msg.getSenderId()))
                .senderName(msg.getSenderName())
                .messageText(msg.getContent())
                .createdAt(createdAt)
                .deletedAt(null)
                .build();

        chatMessageRepository.save(saved);

        messagingTemplate.convertAndSend("/topic/game/" + msg.getGameId(), saved);
    }

    @GetMapping("/games/{gameId}/messages")
    public ResponseEntity<List<ChatMessage>> getHistory(@PathVariable String gameId) {
        ChatRoom room = chatRoomService.getOrCreate(gameId);
        return ResponseEntity.ok(
                chatMessageRepository.findByRoomIdOrderByCreatedAtAsc(room.getRoomId())
        );
    }

    @GetMapping("/games/{gameId}/room")
    public ResponseEntity<ChatRoom> getOrCreateRoom(@PathVariable String gameId) {
        return ResponseEntity.ok(chatRoomService.getOrCreate(gameId));
    }
}
