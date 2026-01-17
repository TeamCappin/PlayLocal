package com.backend.playlocal.unit;

import com.backend.playlocal.controller.ChatController;
import com.backend.playlocal.model.entity.ChatMessage;
import com.backend.playlocal.model.entity.ChatRoom;
import com.backend.playlocal.model.entity.GameRoomMessage;
import com.backend.playlocal.repository.ChatMessageRepository;
import com.backend.playlocal.service.ChatRoomService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ChatControllerTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private ChatRoomService chatRoomService;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @InjectMocks
    private ChatController chatController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(chatController).build();
    }

    // ==========================================================
    // sendToGameRoom (MessageMapping) tests
    // ==========================================================

    @Test
    @DisplayName("sendToGameRoom: returns early when gameId is null")
    void sendToGameRoom_GameIdNull_ReturnsEarly() {
        // Arrange
        GameRoomMessage msg = mock(GameRoomMessage.class);
        when(msg.getGameId()).thenReturn(null);

        // Act
        chatController.sendToGameRoom(msg);

        // Assert
        verifyNoInteractions(chatRoomService, chatMessageRepository, messagingTemplate);
    }

    @Test
    @DisplayName("sendToGameRoom: returns early when gameId is blank")
    void sendToGameRoom_GameIdBlank_ReturnsEarly() {
        // Arrange
        GameRoomMessage msg = mock(GameRoomMessage.class);
        when(msg.getGameId()).thenReturn("   ");

        // Act
        chatController.sendToGameRoom(msg);

        // Assert
        verifyNoInteractions(chatRoomService, chatMessageRepository, messagingTemplate);
    }

    @Test
    @DisplayName("sendToGameRoom: returns early when senderId is null")
    void sendToGameRoom_SenderIdNull_ReturnsEarly() {
        // Arrange
        GameRoomMessage msg = mock(GameRoomMessage.class);
        when(msg.getGameId()).thenReturn(UUID.randomUUID().toString());
        when(msg.getSenderId()).thenReturn(null);

        // Act
        chatController.sendToGameRoom(msg);

        // Assert
        verifyNoInteractions(chatRoomService, chatMessageRepository, messagingTemplate);
    }

    @Test
    @DisplayName("sendToGameRoom: returns early when senderId is blank")
    void sendToGameRoom_SenderIdBlank_ReturnsEarly() {
        // Arrange
        GameRoomMessage msg = mock(GameRoomMessage.class);
        when(msg.getGameId()).thenReturn(UUID.randomUUID().toString());
        when(msg.getSenderId()).thenReturn(" ");

        // Act
        chatController.sendToGameRoom(msg);

        // Assert
        verifyNoInteractions(chatRoomService, chatMessageRepository, messagingTemplate);
    }

    @Test
    @DisplayName("sendToGameRoom: returns early when content is null")
    void sendToGameRoom_ContentNull_ReturnsEarly() {
        // Arrange
        GameRoomMessage msg = mock(GameRoomMessage.class);
        when(msg.getGameId()).thenReturn(UUID.randomUUID().toString());
        when(msg.getSenderId()).thenReturn(UUID.randomUUID().toString());
        when(msg.getContent()).thenReturn(null);

        // Act
        chatController.sendToGameRoom(msg);

        // Assert
        verifyNoInteractions(chatRoomService, chatMessageRepository, messagingTemplate);
    }

    @Test
    @DisplayName("sendToGameRoom: returns early when content is blank")
    void sendToGameRoom_ContentBlank_ReturnsEarly() {
        // Arrange
        GameRoomMessage msg = mock(GameRoomMessage.class);
        when(msg.getGameId()).thenReturn(UUID.randomUUID().toString());
        when(msg.getSenderId()).thenReturn(UUID.randomUUID().toString());
        when(msg.getContent()).thenReturn("   ");

        // Act
        chatController.sendToGameRoom(msg);

        // Assert
        verifyNoInteractions(chatRoomService, chatMessageRepository, messagingTemplate);
    }

    @Test
    @DisplayName("sendToGameRoom: creates room, saves message, and publishes to topic (createdAt provided)")
    void sendToGameRoom_HappyPath_PersistsAndPublishes_WithProvidedCreatedAt() {
        // Arrange
        String gameIdStr = UUID.randomUUID().toString();
        String senderIdStr = UUID.randomUUID().toString();
        String senderName = "Alice";
        String content = "Hello!";
        Instant createdAt = Instant.parse("2025-01-01T00:00:00Z");

        UUID roomId = UUID.randomUUID();
        UUID gameIdUuid = UUID.fromString(gameIdStr);

        ChatRoom room = ChatRoom.builder()
                .roomId(roomId)
                .gameId(gameIdUuid)
                .createdAt(Instant.now())
                .build();

        when(chatRoomService.getOrCreate(gameIdStr)).thenReturn(room);

        GameRoomMessage msg = mock(GameRoomMessage.class);
        when(msg.getGameId()).thenReturn(gameIdStr);
        when(msg.getSenderId()).thenReturn(senderIdStr);
        when(msg.getSenderName()).thenReturn(senderName);
        when(msg.getContent()).thenReturn(content);
        when(msg.getCreatedAt()).thenReturn(createdAt);

        ArgumentCaptor<ChatMessage> savedCaptor = ArgumentCaptor.forClass(ChatMessage.class);

        // Act
        chatController.sendToGameRoom(msg);

        // Assert
        verify(chatRoomService, times(1)).getOrCreate(gameIdStr);

        verify(chatMessageRepository, times(1)).save(savedCaptor.capture());
        ChatMessage saved = savedCaptor.getValue();

        assertThat(saved.getRoomId()).isEqualTo(roomId);
        assertThat(saved.getGameId()).isEqualTo(gameIdUuid);
        assertThat(saved.getSenderId()).isEqualTo(UUID.fromString(senderIdStr));
        assertThat(saved.getSenderName()).isEqualTo(senderName);
        assertThat(saved.getMessageText()).isEqualTo(content);
        assertThat(saved.getCreatedAt()).isEqualTo(createdAt);
        assertThat(saved.getDeletedAt()).isNull();

        verify(messagingTemplate, times(1))
                .convertAndSend(eq("/topic/game/" + gameIdStr), same(saved));

        verifyNoMoreInteractions(chatRoomService, chatMessageRepository, messagingTemplate);
    }

    @Test
    @DisplayName("sendToGameRoom: uses Instant.now when createdAt is null")
    void sendToGameRoom_UsesNow_WhenCreatedAtNull() {
        // Arrange
        String gameIdStr = UUID.randomUUID().toString();
        String senderIdStr = UUID.randomUUID().toString();

        UUID roomId = UUID.randomUUID();
        UUID gameIdUuid = UUID.fromString(gameIdStr);

        ChatRoom room = ChatRoom.builder()
                .roomId(roomId)
                .gameId(gameIdUuid)
                .createdAt(Instant.now())
                .build();

        when(chatRoomService.getOrCreate(gameIdStr)).thenReturn(room);

        GameRoomMessage msg = mock(GameRoomMessage.class);
        when(msg.getGameId()).thenReturn(gameIdStr);
        when(msg.getSenderId()).thenReturn(senderIdStr);
        when(msg.getSenderName()).thenReturn("Bob");
        when(msg.getContent()).thenReturn("Hi");
        when(msg.getCreatedAt()).thenReturn(null);

        ArgumentCaptor<ChatMessage> captor = ArgumentCaptor.forClass(ChatMessage.class);

        Instant before = Instant.now();

        // Act
        chatController.sendToGameRoom(msg);

        Instant after = Instant.now();

        // Assert
        verify(chatMessageRepository).save(captor.capture());
        ChatMessage saved = captor.getValue();

        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(!saved.getCreatedAt().isBefore(before)).isTrue();
        assertThat(!saved.getCreatedAt().isAfter(after)).isTrue();

        verify(messagingTemplate).convertAndSend(eq("/topic/game/" + gameIdStr), same(saved));
    }

    // ==========================================================
    // REST endpoint tests (MockMvc)
    // ==========================================================

    @Test
    @DisplayName("GET /api/v1/games/{gameId}/messages: returns message history ordered asc")
    void getHistory_ReturnsList() throws Exception {
        // Arrange
        String gameIdStr = UUID.randomUUID().toString();
        UUID roomId = UUID.randomUUID();

        ChatRoom room = ChatRoom.builder()
                .roomId(roomId)
                .gameId(UUID.fromString(gameIdStr))
                .createdAt(Instant.now())
                .build();

        when(chatRoomService.getOrCreate(gameIdStr)).thenReturn(room);
        when(chatMessageRepository.findByRoomIdOrderByCreatedAtAsc(roomId)).thenReturn(List.of());

        // Act + Assert
        mockMvc.perform(get("/api/v1/games/{gameId}/messages", gameIdStr))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(jsonPath("$.length()").value(0));

        verify(chatRoomService).getOrCreate(gameIdStr);
        verify(chatMessageRepository).findByRoomIdOrderByCreatedAtAsc(roomId);
        verifyNoMoreInteractions(chatRoomService, chatMessageRepository);
        verifyNoInteractions(messagingTemplate);
    }

    @Test
    @DisplayName("GET /api/v1/games/{gameId}/room: returns room (getOrCreate)")
    void getOrCreateRoom_ReturnsRoom() throws Exception {
        // Arrange
        String gameIdStr = UUID.randomUUID().toString();
        UUID gameIdUuid = UUID.fromString(gameIdStr);

        ChatRoom room = ChatRoom.builder()
                .roomId(UUID.randomUUID())
                .gameId(gameIdUuid)
                .createdAt(Instant.now())
                .build();

        when(chatRoomService.getOrCreate(gameIdStr)).thenReturn(room);

        // Act + Assert
        mockMvc.perform(get("/api/v1/games/{gameId}/room", gameIdStr))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"));

        verify(chatRoomService).getOrCreate(gameIdStr);
        verifyNoMoreInteractions(chatRoomService);
        verifyNoInteractions(chatMessageRepository, messagingTemplate);
    }
}
