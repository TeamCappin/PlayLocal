package com.backend.playlocal.unit;

import com.backend.playlocal.model.dto.GameDto;
import com.backend.playlocal.model.entity.*;
import com.backend.playlocal.repository.*;
import com.backend.playlocal.service.GameService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for GameService discovery methods (US-2.3).
 * Covers getUpcomingGames and findNearbyGames including filter normalization.
 */
@ExtendWith(MockitoExtension.class)
class GameServiceDiscoveryTest {

        @Mock
        private GameRepository gameRepository;
        @Mock
        private GameParticipationRepository participationRepository;
        @Mock
        private UserRepository userRepository;
        @Mock
        private SportRepository sportRepository;
        @Mock
        private LocationRepository locationRepository;
        @Mock
        private GameVisibilityRepository gameVisibilityRepository;

        @InjectMocks
        private GameService gameService;

        private Game game;
        private User organizer;
        private UUID userId;

        @BeforeEach
        void setUp() {
                organizer = User.builder()
                                .userId(UUID.randomUUID())
                                .displayName("Organizer")
                                .reliabilityScore(100.0f)
                                .build();
                userId = organizer.getUserId();

                Location location = Location.builder()
                                .name("Test Field")
                                .city("Montreal")
                                .latitude(45.5f)
                                .longitude(-73.5f)
                                .build();

                game = Game.builder()
                                .gameId(UUID.randomUUID())
                                .title("Test Game")
                                .createdBy(organizer)
                                .location(location)
                                .sport(Sport.builder().name("Basketball").build())
                                .indoorOutdoor("outdoor")
                                .intensityBand("competitive")
                                .skillBand("intermediate")
                                .minPlayers(2)
                                .maxPlayers(10)
                                .allowWaitlist(true)
                                .status(Game.GameStatus.SCHEDULED)
                                .startTime(Instant.now().plusSeconds(3600))
                                .endTime(Instant.now().plusSeconds(7200))
                                .build();
        }

        private void mockMapToGameResponseDependencies() {
                when(participationRepository.countConfirmedParticipants(any())).thenReturn(1);
                when(participationRepository.findWaitlistedByGame(any())).thenReturn(List.of());
                // lenient: when user is organizer we don't call findByGameAndUser
                lenient().when(participationRepository.findByGameAndUser(any(), eq(userId)))
                                .thenReturn(Optional.of(GameParticipation.builder()
                                                .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                                                .user(organizer)
                                                .build()));
        }

        @Test
        @DisplayName("getUpcomingGames with all null filters calls repository with nulls")
        void getUpcomingGames_NullFilters_CallsRepoWithNulls() {
                when(gameRepository.findUpcomingGamesWithFilters(
                                any(Instant.class), isNull(), isNull(), isNull(), isNull()))
                                .thenReturn(List.of(game));
                mockMapToGameResponseDependencies();

                List<GameDto.GameResponse> result = gameService.getUpcomingGames(
                                null, null, null, null, userId);

                assertThat(result).hasSize(1);
                assertThat(result.get(0).getTitle()).isEqualTo("Test Game");
                verify(gameRepository).findUpcomingGamesWithFilters(
                                any(Instant.class), isNull(), isNull(), isNull(), isNull());
        }

        @Test
        @DisplayName("getUpcomingGames with filters normalizes and passes to repository")
        void getUpcomingGames_WithFilters_NormalizesAndCallsRepo() {
                when(gameRepository.findUpcomingGamesWithFilters(
                                any(Instant.class), eq("Basketball"), eq("intermediate"), eq("outdoor"),
                                eq("competitive")))
                                .thenReturn(List.of(game));
                mockMapToGameResponseDependencies();

                List<GameDto.GameResponse> result = gameService.getUpcomingGames(
                                "  Basketball  ", "Intermediate", "Outdoor", "Competitive", userId);

                assertThat(result).hasSize(1);
                verify(gameRepository).findUpcomingGamesWithFilters(
                                any(Instant.class), eq("Basketball"), eq("intermediate"), eq("outdoor"),
                                eq("competitive"));
        }

        @Test
        @DisplayName("getUpcomingGames maps High intensity to competitive")
        void getUpcomingGames_HighIntensity_MapsToCompetitive() {
                when(gameRepository.findUpcomingGamesWithFilters(
                                any(Instant.class), isNull(), isNull(), isNull(), eq("competitive")))
                                .thenReturn(List.of(game));
                mockMapToGameResponseDependencies();

                gameService.getUpcomingGames(null, null, null, "High", userId);

                verify(gameRepository).findUpcomingGamesWithFilters(
                                any(Instant.class), isNull(), isNull(), isNull(), eq("competitive"));
        }

        @Test
        @DisplayName("getUpcomingGames with empty string filters treats as null")
        void getUpcomingGames_EmptyStrings_TreatsAsNull() {
                when(gameRepository.findUpcomingGamesWithFilters(
                                any(Instant.class), isNull(), isNull(), isNull(), isNull()))
                                .thenReturn(List.of(game));
                mockMapToGameResponseDependencies();

                gameService.getUpcomingGames("", "  ", null, "", userId);

                verify(gameRepository).findUpcomingGamesWithFilters(
                                any(Instant.class), isNull(), isNull(), isNull(), isNull());
        }

        @Test
        @DisplayName("findNearbyGames with lat/lon calls repository and returns mapped games")
        void findNearbyGames_WithCoords_CallsRepoAndReturnsMapped() {
                when(gameRepository.findNearbyGameIdsWithFilters(
                                any(Instant.class), eq(45.5f), eq(-73.5f), eq(10.0),
                                isNull(), isNull(), isNull(), isNull()))
                                .thenReturn(List.of(game.getGameId()));
                when(gameRepository.findById(game.getGameId())).thenReturn(Optional.of(game));
                mockMapToGameResponseDependencies();

                List<GameDto.GameResponse> result = gameService.findNearbyGames(
                                45.5f, -73.5f, 10.0, null, null, null, null, userId);

                assertThat(result).hasSize(1);
                assertThat(result.get(0).getTitle()).isEqualTo("Test Game");
                verify(gameRepository).findNearbyGameIdsWithFilters(
                                any(Instant.class), eq(45.5f), eq(-73.5f), eq(10.0),
                                isNull(), isNull(), isNull(), isNull());
                verify(gameRepository).findById(game.getGameId());
        }

        @Test
        @DisplayName("findNearbyGames with filters normalizes and passes to repository")
        void findNearbyGames_WithFilters_NormalizesAndCallsRepo() {
                when(gameRepository.findNearbyGameIdsWithFilters(
                                any(Instant.class), eq(45.5f), eq(-73.5f), eq(5.0),
                                eq("Soccer"), eq("beginner"), eq("indoor"), eq("casual")))
                                .thenReturn(List.of());

                gameService.findNearbyGames(
                                45.5f, -73.5f, 5.0,
                                "  Soccer  ", "Beginner", "Indoor", "Casual", userId);

                verify(gameRepository).findNearbyGameIdsWithFilters(
                                any(Instant.class), eq(45.5f), eq(-73.5f), eq(5.0),
                                eq("Soccer"), eq("beginner"), eq("indoor"), eq("casual"));
        }

        @Test
        @DisplayName("findNearbyGames maps High intensity to competitive")
        void findNearbyGames_HighIntensity_MapsToCompetitive() {
                when(gameRepository.findNearbyGameIdsWithFilters(
                                any(Instant.class), eq(45.5f), eq(-73.5f), eq(10.0),
                                isNull(), isNull(), isNull(), eq("competitive")))
                                .thenReturn(List.of());

                gameService.findNearbyGames(45.5f, -73.5f, 10.0, null, null, null, "high", userId);

                verify(gameRepository).findNearbyGameIdsWithFilters(
                                any(Instant.class), eq(45.5f), eq(-73.5f), eq(10.0),
                                isNull(), isNull(), isNull(), eq("competitive"));
        }

        @Test
        @DisplayName("getUpcomingGames with null userId still maps response")
        void getUpcomingGames_NullUserId_MapsResponse() {
                when(gameRepository.findUpcomingGamesWithFilters(
                                any(Instant.class), isNull(), isNull(), isNull(), isNull()))
                                .thenReturn(List.of(game));
                when(participationRepository.countConfirmedParticipants(any())).thenReturn(0);
                when(participationRepository.findWaitlistedByGame(any())).thenReturn(List.of());

                List<GameDto.GameResponse> result = gameService.getUpcomingGames(null, null, null, null, null);

                assertThat(result).hasSize(1);
                assertThat(result.get(0).getTitle()).isEqualTo("Test Game");
                assertThat(result.get(0).getHasExactLocationAccess()).isFalse();
        }
}
