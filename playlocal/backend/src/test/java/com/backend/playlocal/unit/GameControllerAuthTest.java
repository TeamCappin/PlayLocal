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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
        when(gameService.getUpcomingGames(isNull(), isNull(), isNull(), isNull(), isNull()))
                .thenReturn(List.of(mockGame));

        ResponseEntity<List<GameDto.GameResponse>> response = gameController.getUpcomingGames(
                null, null, null, null, null, null, null, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(gameService).getUpcomingGames(isNull(), isNull(), isNull(), isNull(), isNull());
        verify(gameService, org.mockito.Mockito.never()).findNearbyGames(any(), any(), any(), any(), any(), any(),
                any(), any());
    }

    @Test
    @DisplayName("getUpcomingGames with lat and lon calls findNearbyGames")
    void getUpcomingGames_WithLatLon_CallsFindNearbyGames() {
        Float lat = 45.5f;
        Float lon = -73.5f;
        Double radiusKm = 10.0;
        when(gameService.findNearbyGames(eq(lat), eq(lon), eq(radiusKm), isNull(), isNull(), isNull(), isNull(),
                isNull()))
                .thenReturn(List.of(mockGame));

        ResponseEntity<List<GameDto.GameResponse>> response = gameController.getUpcomingGames(
                lat, lon, radiusKm, null, null, null, null, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(gameService).findNearbyGames(eq(lat), eq(lon), eq(radiusKm), isNull(), isNull(), isNull(), isNull(),
                isNull());
        verify(gameService, org.mockito.Mockito.never()).getUpcomingGames(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("getUpcomingGames with filter params forwards to getUpcomingGames")
    void getUpcomingGames_WithFilters_ForwardsToService() {
        when(gameService.getUpcomingGames(eq("Basketball"), eq("intermediate"), eq("outdoor"), eq("competitive"),
                isNull()))
                .thenReturn(List.of(mockGame));

        ResponseEntity<List<GameDto.GameResponse>> response = gameController.getUpcomingGames(
                null, null, null, "Basketball", "intermediate", "outdoor", "competitive", null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(gameService).getUpcomingGames(eq("Basketball"), eq("intermediate"), eq("outdoor"), eq("competitive"),
                isNull());
    }

    @Test
    @DisplayName("getUpcomingGames with authenticated user extracts userId")
    void getUpcomingGames_AuthenticatedUser_PassesUserId() {
        UUID userId = UUID.randomUUID();
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn(userId.toString());
        when(gameService.getUpcomingGames(isNull(), isNull(), isNull(), isNull(), eq(userId)))
                .thenReturn(List.of(mockGame));

        ResponseEntity<List<GameDto.GameResponse>> response = gameController.getUpcomingGames(
                null, null, null, null, null, null, null, authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(gameService).getUpcomingGames(isNull(), isNull(), isNull(), isNull(), eq(userId));
    }

    @Test
    @DisplayName("getUpcomingGames with invalid UUID in auth name handles gracefully")
    void getUpcomingGames_InvalidUUID_PassesNullUserId() {
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("anonymousUser"); // Not a valid UUID

        when(gameService.getUpcomingGames(isNull(), isNull(), isNull(), isNull(), isNull()))
                .thenReturn(List.of(mockGame));

        ResponseEntity<List<GameDto.GameResponse>> response = gameController.getUpcomingGames(
                null, null, null, null, null, null, null, authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(gameService).getUpcomingGames(isNull(), isNull(), isNull(), isNull(), isNull());
    }

    @Test
    @DisplayName("getUpcomingGames with unauthenticated calls service with null userId")
    void getUpcomingGames_NotAuthenticated_PassesNullUserId() {
        when(authentication.isAuthenticated()).thenReturn(false);
        when(gameService.getUpcomingGames(isNull(), isNull(), isNull(), isNull(), isNull()))
                .thenReturn(List.of(mockGame));

        ResponseEntity<List<GameDto.GameResponse>> response = gameController.getUpcomingGames(
                null, null, null, null, null, null, null, authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(gameService).getUpcomingGames(isNull(), isNull(), isNull(), isNull(), isNull());
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
            when(gameService.getRoster(eq(gameId), any(UUID.class))).thenReturn(roster);
            when(authentication.getName()).thenReturn(UUID.randomUUID().toString());

            ResponseEntity<GameDto.RosterResponse> response = gameController.getRoster(gameId, authentication);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getConfirmed()).hasSize(1);
            assertThat(response.getBody().getMaxPlayers()).isEqualTo(10);
            verify(gameService).getRoster(eq(gameId), any(UUID.class));
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

    @Nested
    @DisplayName("US-2.4: Cancel Game (DELETE /games/{gameId})")
    class CancelGameTests {

        @Test
        @DisplayName("cancelGame should call service with authenticated userId")
        void cancelGame_Authenticated_ShouldCallService() {
            // Given
            UUID userId = UUID.randomUUID();
            when(authentication.getName()).thenReturn(userId.toString());
            when(gameService.cancelGame(gameId, userId)).thenReturn(mockGame);

            // When
            ResponseEntity<GameDto.GameResponse> response = gameController.cancelGame(gameId, authentication);

            // Then
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isEqualTo(mockGame);
            verify(gameService).cancelGame(gameId, userId);
        }

        @Test
        @DisplayName("cancelGame should extract userId from authentication")
        void cancelGame_ShouldExtractUserId() {
            // Given
            UUID organizerId = UUID.randomUUID();
            when(authentication.getName()).thenReturn(organizerId.toString());
            when(gameService.cancelGame(gameId, organizerId)).thenReturn(mockGame);

            // When
            ResponseEntity<GameDto.GameResponse> response = gameController.cancelGame(gameId, authentication);

            // Then
            verify(authentication).getName();
            verify(gameService).cancelGame(gameId, organizerId);
        }

        @Test
        @DisplayName("cancelGame should return game response from service")
        void cancelGame_ShouldReturnGameResponse() {
            // Given
            UUID userId = UUID.randomUUID();
            GameDto.GameResponse cancelledGame = GameDto.GameResponse.builder()
                    .gameId(gameId.toString())
                    .title("Cancelled Game")
                    .status("CANCELLED")
                    .build();

            when(authentication.getName()).thenReturn(userId.toString());
            when(gameService.cancelGame(gameId, userId)).thenReturn(cancelledGame);

            // When
            ResponseEntity<GameDto.GameResponse> response = gameController.cancelGame(gameId, authentication);

            // Then
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getStatus()).isEqualTo("CANCELLED");
            assertThat(response.getBody().getGameId()).isEqualTo(gameId.toString());
        }

        @Test
        @DisplayName("cancelGame with null authentication should throw bad credentials")
        void cancelGame_NullAuthentication_ShouldThrowBadCredentials() {
            assertThatThrownBy(() -> gameController.cancelGame(gameId, null))
                    .isInstanceOf(org.springframework.security.authentication.BadCredentialsException.class)
                    .hasMessage("Authentication is required");
        }
    }

    @Nested
    @DisplayName("US-2.5: Complete and Archive Game")
    class CompleteAndArchiveTests {

        @Test
        @DisplayName("completeGame should call service with authenticated userId")
        void completeGame_Authenticated_ShouldCallService() {
            UUID userId = UUID.randomUUID();
            GameDto.GameResponse completedGame = GameDto.GameResponse.builder()
                    .gameId(gameId.toString())
                    .status("COMPLETED")
                    .build();

            when(authentication.getName()).thenReturn(userId.toString());
            when(gameService.completeGame(gameId, userId)).thenReturn(completedGame);

            ResponseEntity<GameDto.GameResponse> response = gameController.completeGame(gameId, authentication);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isEqualTo(completedGame);
            verify(gameService).completeGame(gameId, userId);
        }

        @Test
        @DisplayName("archiveGame should call service with authenticated userId")
        void archiveGame_Authenticated_ShouldCallService() {
            UUID userId = UUID.randomUUID();
            GameDto.GameResponse archivedGame = GameDto.GameResponse.builder()
                    .gameId(gameId.toString())
                    .status("ARCHIVED")
                    .build();

            when(authentication.getName()).thenReturn(userId.toString());
            when(gameService.archiveGame(gameId, userId)).thenReturn(archivedGame);

            ResponseEntity<GameDto.GameResponse> response = gameController.archiveGame(gameId, authentication);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isEqualTo(archivedGame);
            verify(gameService).archiveGame(gameId, userId);
        }

                @Test
                @DisplayName("getOrganizerProgress should call service and return 200")
                void getOrganizerProgress_ShouldCallServiceAndReturn200() {
                        GameDto.OrganizerProgressResponse progress = GameDto.OrganizerProgressResponse.builder()
                                        .gameId(gameId.toString())
                                        .organizerUserId(UUID.randomUUID().toString())
                                        .organizerStatus("PROVISIONAL")
                                        .eligibleGamesCompleted(1)
                                        .build();
                        when(gameService.getOrganizerProgress(gameId)).thenReturn(progress);

                        ResponseEntity<GameDto.OrganizerProgressResponse> response = gameController.getOrganizerProgress(gameId);

                        assertThat(response.getStatusCode().value()).isEqualTo(200);
                        assertThat(response.getBody()).isEqualTo(progress);
                        verify(gameService).getOrganizerProgress(gameId);
                }

                @Test
                @DisplayName("getOrganizerProgress should expose returned fields")
                void getOrganizerProgress_ShouldExposeFields() {
                        UUID organizerId = UUID.randomUUID();
                        GameDto.OrganizerProgressResponse progress = GameDto.OrganizerProgressResponse.builder()
                                        .gameId(gameId.toString())
                                        .organizerUserId(organizerId.toString())
                                        .organizerStatus("FULL")
                                        .eligibleGamesCompleted(2)
                                        .build();
                        when(gameService.getOrganizerProgress(gameId)).thenReturn(progress);

                        ResponseEntity<GameDto.OrganizerProgressResponse> response = gameController.getOrganizerProgress(gameId);

                        assertThat(response.getBody()).isNotNull();
                        assertThat(response.getBody().getOrganizerStatus()).isEqualTo("FULL");
                        assertThat(response.getBody().getEligibleGamesCompleted()).isEqualTo(2);
                }
    }

    @Nested
    @DisplayName("US-4.1: joinGame and updateGame")
    class JoinAndUpdateGameTests {

        @Test
        @DisplayName("joinGame should call service with userId and optional body and return 200")
        void joinGame_Authenticated_ShouldCallServiceAndReturn200() {
            UUID userId = UUID.randomUUID();
            when(authentication.getName()).thenReturn(userId.toString());
            GameDto.JoinRequest joinRequest = GameDto.JoinRequest.builder().build();
            GameDto.JoinResponse joinResponse = GameDto.JoinResponse.builder()
                    .participationId(UUID.randomUUID().toString())
                    .joinStatus("CONFIRMED")
                    .message("Joined")
                    .build();
            when(gameService.joinGame(gameId, userId, joinRequest)).thenReturn(joinResponse);

            ResponseEntity<GameDto.JoinResponse> response = gameController.joinGame(gameId, joinRequest, authentication);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getJoinStatus()).isEqualTo("CONFIRMED");
            verify(gameService).joinGame(gameId, userId, joinRequest);
        }

        @Test
        @DisplayName("joinGame with null body should call service with null request")
        void joinGame_NullBody_ShouldCallServiceWithNull() {
            UUID userId = UUID.randomUUID();
            when(authentication.getName()).thenReturn(userId.toString());
            GameDto.JoinResponse joinResponse = GameDto.JoinResponse.builder()
                    .participationId(UUID.randomUUID().toString())
                    .joinStatus("CONFIRMED")
                    .build();
            when(gameService.joinGame(gameId, userId, null)).thenReturn(joinResponse);

            ResponseEntity<GameDto.JoinResponse> response = gameController.joinGame(gameId, null, authentication);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            verify(gameService).joinGame(gameId, userId, null);
        }

        @Test
        @DisplayName("updateGame should call service with userId and request and return 200")
        void updateGame_Organizer_ShouldCallServiceAndReturn200() {
            UUID organizerId = UUID.randomUUID();
            when(authentication.getName()).thenReturn(organizerId.toString());
            GameDto.UpdateRequest updateRequest = GameDto.UpdateRequest.builder()
                    .minReliabilityRequired(85.0f)
                    .build();
            GameDto.GameResponse updatedGame = GameDto.GameResponse.builder()
                    .gameId(gameId.toString())
                    .title("Updated Game")
                    .minReliabilityRequired(85.0f)
                    .build();
            when(gameService.updateGame(gameId, organizerId, updateRequest)).thenReturn(updatedGame);

            ResponseEntity<GameDto.GameResponse> response = gameController.updateGame(gameId, updateRequest, authentication);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getMinReliabilityRequired()).isEqualTo(85.0f);
            verify(gameService).updateGame(gameId, organizerId, updateRequest);
        }
    }
}
