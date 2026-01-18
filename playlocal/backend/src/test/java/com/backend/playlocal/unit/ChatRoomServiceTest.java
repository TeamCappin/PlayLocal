package com.backend.playlocal.unit;

import com.backend.playlocal.model.entity.ChatRoom;
import com.backend.playlocal.repository.ChatRoomRepository;
import com.backend.playlocal.service.ChatRoomService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatRoomServiceTest {

    @Mock
    private ChatRoomRepository repo;

    @InjectMocks
    private ChatRoomService service;

    @Test
    @DisplayName("getOrCreate: returns existing room when repo finds by gameId")
    void getOrCreate_ReturnsExistingRoom() {
        // Arrange
        UUID gameId = UUID.randomUUID();
        ChatRoom existing = ChatRoom.builder()
                .roomId(UUID.randomUUID())
                .gameId(gameId)
                .createdAt(Instant.now())
                .build();

        when(repo.findByGameId(gameId)).thenReturn(Optional.of(existing));

        // Act
        ChatRoom result = service.getOrCreate(gameId.toString());

        // Assert
        assertThat(result).isSameAs(existing);
        verify(repo, times(1)).findByGameId(gameId);
        verify(repo, never()).save(any(ChatRoom.class));
        verifyNoMoreInteractions(repo);
    }

    @Test
    @DisplayName("getOrCreate: saves and returns a new room when none exists")
    void getOrCreate_CreatesAndSavesRoom() {
        // Arrange
        UUID gameId = UUID.randomUUID();

        when(repo.findByGameId(gameId)).thenReturn(Optional.empty());
        when(repo.save(any(ChatRoom.class))).thenAnswer(inv -> inv.getArgument(0));

        ArgumentCaptor<ChatRoom> captor = ArgumentCaptor.forClass(ChatRoom.class);

        // Act
        ChatRoom result = service.getOrCreate(gameId.toString());

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getGameId()).isEqualTo(gameId);
        assertThat(result.getRoomId()).isNotNull();
        assertThat(result.getCreatedAt()).isNotNull();

        verify(repo, times(1)).findByGameId(gameId);
        verify(repo, times(1)).save(captor.capture());

        ChatRoom saved = captor.getValue();
        assertThat(saved.getGameId()).isEqualTo(gameId);
        assertThat(saved.getRoomId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();

        verifyNoMoreInteractions(repo);
    }

    @Test
    @DisplayName("getOrCreate: throws IllegalArgumentException for invalid UUID input")
    void getOrCreate_InvalidUuid_Throws() {
        // Arrange
        String badGameId = "not-a-uuid";

        // Act + Assert
        assertThrows(IllegalArgumentException.class, () -> service.getOrCreate(badGameId));
        verifyNoInteractions(repo);
    }
}
