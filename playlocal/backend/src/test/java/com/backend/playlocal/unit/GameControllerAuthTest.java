package com.backend.playlocal.unit;

import com.backend.playlocal.controller.GameController;
import com.backend.playlocal.model.dto.GameDto;
import com.backend.playlocal.service.GameService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

    @Nested
    @DisplayName("US-2.6: getRoster, getPastGamesForUserNeedingAttendanceUpdate, getGameParticipation")
    class RosterAndParticipationTests {

        @Test
        @DisplayName("getRoster should return roster and call service")
        void getRoster_shouldReturnRoster() {
            GameDto.ParticipantDto p = GameDto.ParticipantDto.builder()
                    .participationId(UUID.randomUUID().toString())
                    .userId(UUID.randomUUID().toString())
                    .displayName("Player")
                    .role("PARTICIPANT")
                    .joinStatus("CONFIRMED")
                    .attendanceStatus("UNKNOWN")
                    .joinedAt(Instant.now())
                    .build();
            GameDto.RosterResponse roster = GameDto.RosterResponse.builder()
                    .confirmed(List.of(p))
                    .waitlisted(Collections.emptyList())
                    .maxPlayers(10)
                    .spotsAvailable(9)
                    .build();
            when(gameService.getRoster(gameId)).thenReturn(roster);

            ResponseEntity<GameDto.RosterResponse> response = gameController.getRoster(gameId);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getConfirmed()).hasSize(1);
            assertThat(response.getBody().getMaxPlayers()).isEqualTo(10);
            verify(gameService).getRoster(gameId);
        }

        @Test
        @DisplayName("getPastGamesForUserNeedingAttendanceUpdate should return games for organizer")
        void getPastGamesForUserNeedingAttendanceUpdate_shouldReturnGames() {
            UUID userId = UUID.randomUUID();
            when(authentication.getName()).thenReturn(userId.toString());
            when(gameService.getPastGamesForUserNeedingAttendanceUpdate(userId)).thenReturn(List.of(mockGame));

            ResponseEntity<List<GameDto.GameResponse>> response =
                    gameController.getPastGamesForUserNeedingAttendanceUpdate(authentication);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody()).hasSize(1);
            assertThat(response.getBody().get(0).getGameId()).isEqualTo(gameId.toString());
            verify(authentication).getName();
            verify(gameService).getPastGamesForUserNeedingAttendanceUpdate(userId);
        }

        @Test
        @DisplayName("getGameParticipation should return participation for user and game")
        void getGameParticipation_shouldReturnParticipation() {
            UUID userId = UUID.randomUUID();
            when(authentication.getName()).thenReturn(userId.toString());
            GameDto.ParticipantDto participation = GameDto.ParticipantDto.builder()
                    .participationId(UUID.randomUUID().toString())
                    .userId(userId.toString())
                    .displayName("Me")
                    .role("ORGANIZER")
                    .joinStatus("CONFIRMED")
                    .attendanceStatus("UNKNOWN")
                    .joinedAt(Instant.now())
                    .build();
            when(gameService.getGameParticipation(gameId, userId)).thenReturn(participation);

            ResponseEntity<GameDto.ParticipantDto> response =
                    gameController.getGameParticipation(gameId, authentication);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getUserId()).isEqualTo(userId.toString());
            assertThat(response.getBody().getRole()).isEqualTo("ORGANIZER");
            verify(authentication).getName();
            verify(gameService).getGameParticipation(gameId, userId);
        }
    }
}
