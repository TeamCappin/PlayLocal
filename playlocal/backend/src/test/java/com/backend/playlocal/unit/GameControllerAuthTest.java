package com.backend.playlocal.unit;

import com.backend.playlocal.controller.GameController;
import com.backend.playlocal.model.dto.GameDto;
import com.backend.playlocal.service.GameService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

/**
 * Unit tests for GameController authentication parsing.
 * Covers: getUpcomingGames and getGameById with various auth states
 */
@ExtendWith(MockitoExtension.class)
class GameControllerAuthTest {

    @Mock
    private GameService gameService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private GameController gameController;

    private GameDto.GameResponse mockGame;
    private UUID gameId;

    @BeforeEach
    void setUp() {
        gameId = UUID.randomUUID();
        mockGame = GameDto.GameResponse.builder()
                .gameId(gameId.toString())
                .title("Test Game")
                .build();
    }

    @Test
    @DisplayName("getUpcomingGames with null authentication calls service with null userId")
    void getUpcomingGames_NullAuth_PassesNullUserId() {
        when(gameService.getUpcomingGames(isNull())).thenReturn(List.of(mockGame));

        ResponseEntity<List<GameDto.GameResponse>> response = gameController.getUpcomingGames(null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(gameService).getUpcomingGames(null);
    }

    @Test
    @DisplayName("getUpcomingGames with authenticated user extracts userId")
    void getUpcomingGames_AuthenticatedUser_PassesUserId() {
        UUID userId = UUID.randomUUID();
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn(userId.toString());
        when(gameService.getUpcomingGames(userId)).thenReturn(List.of(mockGame));

        ResponseEntity<List<GameDto.GameResponse>> response = gameController.getUpcomingGames(authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(gameService).getUpcomingGames(userId);
    }

    @Test
    @DisplayName("getUpcomingGames with invalid UUID in auth name handles gracefully")
    void getUpcomingGames_InvalidUUID_PassesNullUserId() {
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("anonymousUser"); // Not a valid UUID

        when(gameService.getUpcomingGames(isNull())).thenReturn(List.of(mockGame));

        ResponseEntity<List<GameDto.GameResponse>> response = gameController.getUpcomingGames(authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(gameService).getUpcomingGames(null);
    }

    @Test
    @DisplayName("getUpcomingGames with unauthenticated calls service with null userId")
    void getUpcomingGames_NotAuthenticated_PassesNullUserId() {
        when(authentication.isAuthenticated()).thenReturn(false);
        when(gameService.getUpcomingGames(isNull())).thenReturn(List.of(mockGame));

        ResponseEntity<List<GameDto.GameResponse>> response = gameController.getUpcomingGames(authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(gameService).getUpcomingGames(null);
    }

    @Test
    @DisplayName("getGameById with null authentication calls service with null userId")
    void getGameById_NullAuth_PassesNullUserId() {
        when(gameService.getGameById(gameId, null)).thenReturn(mockGame);

        ResponseEntity<GameDto.GameResponse> response = gameController.getGameById(gameId, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(gameService).getGameById(gameId, null);
    }

    @Test
    @DisplayName("getGameById with authenticated user extracts userId")
    void getGameById_AuthenticatedUser_PassesUserId() {
        UUID userId = UUID.randomUUID();
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn(userId.toString());
        when(gameService.getGameById(gameId, userId)).thenReturn(mockGame);

        ResponseEntity<GameDto.GameResponse> response = gameController.getGameById(gameId, authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(gameService).getGameById(gameId, userId);
    }

    @Test
    @DisplayName("getGameById with invalid UUID in auth name handles gracefully")
    void getGameById_InvalidUUID_PassesNullUserId() {
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("not-a-uuid");

        when(gameService.getGameById(eq(gameId), isNull())).thenReturn(mockGame);

        ResponseEntity<GameDto.GameResponse> response = gameController.getGameById(gameId, authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(gameService).getGameById(gameId, null);
    }

    @Test
    @DisplayName("getGameById with unauthenticated calls service with null userId")
    void getGameById_NotAuthenticated_PassesNullUserId() {
        when(authentication.isAuthenticated()).thenReturn(false);
        when(gameService.getGameById(eq(gameId), isNull())).thenReturn(mockGame);

        ResponseEntity<GameDto.GameResponse> response = gameController.getGameById(gameId, authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(gameService).getGameById(gameId, null);
    }
}
