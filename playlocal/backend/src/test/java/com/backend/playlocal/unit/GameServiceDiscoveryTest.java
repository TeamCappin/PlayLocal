package com.backend.playlocal.unit;

import com.backend.playlocal.model.dto.GameDto;
import com.backend.playlocal.model.entity.*;
import com.backend.playlocal.repository.*;
import com.backend.playlocal.service.GameService;
import com.backend.playlocal.service.OrganizerQualityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
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
        private GameVisibilityRepository gameVisibilityRepository;
        @Mock
        private EndorsementRepository endorsementRepository;
        @Mock
        private GameTagRepository tagRepository;
        @Mock
        private GameTagAssignmentRepository tagAssignmentRepository;
        @Mock
        private GameTagConfirmationRepository tagConfirmationRepository;
        @Mock
        private OrganizerQualityService oqsService;

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
        when(participationRepository.countParticipationSummaryByGameIds(any()))
                .thenReturn(List.of(new Object[] { game.getGameId(), 1L, 0L }));
        when(tagAssignmentRepository.findAllByGame_GameIdIn(any())).thenReturn(List.of());
        lenient().when(participationRepository.findConfirmedGameIdsForUser(eq(userId), any()))
                .thenReturn(List.of(game.getGameId()));
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
                                any(Instant.class), eq("basketball"), eq("intermediate"), eq("outdoor"),
                                eq("competitive")))
                                .thenReturn(List.of(game));
                mockMapToGameResponseDependencies();

                List<GameDto.GameResponse> result = gameService.getUpcomingGames(
                                "  Basketball  ", "Intermediate", "Outdoor", "Competitive", userId);

                assertThat(result).hasSize(1);
                verify(gameRepository).findUpcomingGamesWithFilters(
                                any(Instant.class), eq("basketball"), eq("intermediate"), eq("outdoor"),
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
        @DisplayName("getUpcomingGames uses batched metadata lookups for list mapping")
        void getUpcomingGames_UsesBatchedMetadataLookups() {
                when(gameRepository.findUpcomingGamesWithFilters(
                                any(Instant.class), isNull(), isNull(), isNull(), isNull()))
                                .thenReturn(List.of(game));
                mockMapToGameResponseDependencies();

                List<GameDto.GameResponse> result = gameService.getUpcomingGames(
                                null, null, null, null, userId);

                assertThat(result).hasSize(1);
                verify(participationRepository).countParticipationSummaryByGameIds(List.of(game.getGameId()));
                verify(tagAssignmentRepository).findAllByGame_GameIdIn(List.of(game.getGameId()));
                verify(participationRepository).findConfirmedGameIdsForUser(userId, List.of(game.getGameId()));
        }

        @Test
        @DisplayName("getUpcomingGames preserves repository order while applying batched summaries")
        void getUpcomingGames_PreservesOrderWithBatchedSummaries() {
                Game secondGame = Game.builder()
                                .gameId(UUID.randomUUID())
                                .title("Second Upcoming Game")
                                .createdBy(organizer)
                                .location(Location.builder().name("Second Field").city("Montreal").build())
                                .sport(Sport.builder().name("Basketball").build())
                                .indoorOutdoor("indoor")
                                .intensityBand("casual")
                                .skillBand("beginner")
                                .minPlayers(2)
                                .maxPlayers(12)
                                .allowWaitlist(true)
                                .status(Game.GameStatus.SCHEDULED)
                                .startTime(Instant.now().plusSeconds(5400))
                                .endTime(Instant.now().plusSeconds(9000))
                                .build();

                when(gameRepository.findUpcomingGamesWithFilters(
                                any(Instant.class), isNull(), isNull(), isNull(), isNull()))
                                .thenReturn(List.of(secondGame, game));
                when(participationRepository.countParticipationSummaryByGameIds(any()))
                                .thenReturn(List.of(
                                                new Object[] { game.getGameId(), 1L, 0L },
                                                new Object[] { secondGame.getGameId(), 3L, 2L }));
                when(tagAssignmentRepository.findAllByGame_GameIdIn(any())).thenReturn(List.of());
                when(participationRepository.findConfirmedGameIdsForUser(eq(userId), any()))
                                .thenReturn(List.of(game.getGameId(), secondGame.getGameId()));

                List<GameDto.GameResponse> result = gameService.getUpcomingGames(
                                null, null, null, null, userId);

                assertThat(result).extracting(GameDto.GameResponse::getGameId)
                                .containsExactly(secondGame.getGameId().toString(), game.getGameId().toString());
                assertThat(result).extracting(GameDto.GameResponse::getConfirmedCount)
                                .containsExactly(3, 1);
                assertThat(result).extracting(GameDto.GameResponse::getWaitlistCount)
                                .containsExactly(2, 0);
        }

        @Test
        @DisplayName("getUpcomingGames exposes exact location for confirmed requester from batched access lookup")
        void getUpcomingGames_ConfirmedUserGetsExactLocationFromBatchedLookup() {
                UUID confirmedUserId = UUID.randomUUID();
                when(gameRepository.findUpcomingGamesWithFilters(
                                any(Instant.class), isNull(), isNull(), isNull(), isNull()))
                                .thenReturn(List.of(game));
                when(participationRepository.countParticipationSummaryByGameIds(any()))
                                .thenReturn(List.of(new Object[] { game.getGameId(), 1L, 0L }));
                when(tagAssignmentRepository.findAllByGame_GameIdIn(any())).thenReturn(List.of());
                when(participationRepository.findConfirmedGameIdsForUser(eq(confirmedUserId), any()))
                                .thenReturn(List.of(game.getGameId()));

                List<GameDto.GameResponse> result = gameService.getUpcomingGames(
                                null, null, null, null, confirmedUserId);

                assertThat(result).hasSize(1);
                assertThat(result.get(0).getHasExactLocationAccess()).isTrue();
                assertThat(result.get(0).getLocation()).isNotNull();
                assertThat(result.get(0).getLocation().getName()).isEqualTo("Test Field");
        }

        @Test
        @DisplayName("findNearbyGames with lat/lon calls repository and returns mapped games")
        void findNearbyGames_WithCoords_CallsRepoAndReturnsMapped() {
                when(gameRepository.findNearbyGameIdsWithFilters(
                                any(Instant.class), eq(45.5f), eq(-73.5f), eq(10.0),
                                isNull(), isNull(), isNull(), isNull()))
                                .thenReturn(List.of(game.getGameId()));
                when(gameRepository.findAllByGameIdIn(List.of(game.getGameId()))).thenReturn(List.of(game));
                mockMapToGameResponseDependencies();

                List<GameDto.GameResponse> result = gameService.findNearbyGames(
                                45.5f, -73.5f, 10.0, null, null, null, null, userId);

                assertThat(result).hasSize(1);
                assertThat(result.get(0).getTitle()).isEqualTo("Test Game");
                verify(gameRepository).findNearbyGameIdsWithFilters(
                                any(Instant.class), eq(45.5f), eq(-73.5f), eq(10.0),
                                isNull(), isNull(), isNull(), isNull());
                verify(gameRepository).findAllByGameIdIn(List.of(game.getGameId()));
                verify(participationRepository).countParticipationSummaryByGameIds(List.of(game.getGameId()));
                verify(tagAssignmentRepository).findAllByGame_GameIdIn(List.of(game.getGameId()));
                verify(participationRepository).findConfirmedGameIdsForUser(userId, List.of(game.getGameId()));
        }

        @Test
        @DisplayName("findNearbyGames preserves repository ID order after batched fetch")
        void findNearbyGames_PreservesNearbyOrderingAfterBatchFetch() {
                Game secondGame = Game.builder()
                                .gameId(UUID.randomUUID())
                                .title("Second Game")
                                .createdBy(organizer)
                                .location(Location.builder().name("Second Field").city("Montreal").build())
                                .sport(Sport.builder().name("Basketball").build())
                                .indoorOutdoor("outdoor")
                                .intensityBand("competitive")
                                .skillBand("intermediate")
                                .minPlayers(2)
                                .maxPlayers(10)
                                .allowWaitlist(true)
                                .status(Game.GameStatus.SCHEDULED)
                                .startTime(Instant.now().plusSeconds(5400))
                                .endTime(Instant.now().plusSeconds(9000))
                                .build();

                when(gameRepository.findNearbyGameIdsWithFilters(
                                any(Instant.class), eq(45.5f), eq(-73.5f), eq(10.0),
                                isNull(), isNull(), isNull(), isNull()))
                                .thenReturn(List.of(secondGame.getGameId(), game.getGameId()));
                when(gameRepository.findAllByGameIdIn(List.of(secondGame.getGameId(), game.getGameId())))
                                .thenReturn(List.of(game, secondGame));
                when(participationRepository.countParticipationSummaryByGameIds(any()))
                                .thenReturn(List.of(
                                                new Object[] { game.getGameId(), 1L, 0L },
                                                new Object[] { secondGame.getGameId(), 2L, 1L }));
                when(tagAssignmentRepository.findAllByGame_GameIdIn(any())).thenReturn(List.of());
                when(participationRepository.findConfirmedGameIdsForUser(eq(userId), any()))
                                .thenReturn(List.of(game.getGameId(), secondGame.getGameId()));

                List<GameDto.GameResponse> result = gameService.findNearbyGames(
                                45.5f, -73.5f, 10.0, null, null, null, null, userId);

                assertThat(result).extracting(GameDto.GameResponse::getGameId)
                                .containsExactly(secondGame.getGameId().toString(), game.getGameId().toString());
                assertThat(result).extracting(GameDto.GameResponse::getConfirmedCount)
                                .containsExactly(2, 1);
                assertThat(result).extracting(GameDto.GameResponse::getWaitlistCount)
                                .containsExactly(1, 0);
        }

        @Test
        @DisplayName("findNearbyGames exposes exact location for confirmed requester via batched access lookup")
        void findNearbyGames_ConfirmedUserGetsExactLocationFromBatchedLookup() {
                UUID confirmedUserId = UUID.randomUUID();
                when(gameRepository.findNearbyGameIdsWithFilters(
                                any(Instant.class), eq(45.5f), eq(-73.5f), eq(10.0),
                                isNull(), isNull(), isNull(), isNull()))
                                .thenReturn(List.of(game.getGameId()));
                when(gameRepository.findAllByGameIdIn(List.of(game.getGameId()))).thenReturn(List.of(game));
                when(participationRepository.countParticipationSummaryByGameIds(any()))
                                .thenReturn(List.of(new Object[] { game.getGameId(), 1L, 0L }));
                when(tagAssignmentRepository.findAllByGame_GameIdIn(any())).thenReturn(List.of());
                when(participationRepository.findConfirmedGameIdsForUser(eq(confirmedUserId), any()))
                                .thenReturn(List.of(game.getGameId()));

                List<GameDto.GameResponse> result = gameService.findNearbyGames(
                                45.5f, -73.5f, 10.0, null, null, null, null, confirmedUserId);

                assertThat(result).hasSize(1);
                assertThat(result.get(0).getHasExactLocationAccess()).isTrue();
                assertThat(result.get(0).getLocation()).isNotNull();
                assertThat(result.get(0).getLocation().getName()).isEqualTo("Test Field");
        }

        @Test
        @DisplayName("findNearbyGames with filters normalizes and passes to repository")
        void findNearbyGames_WithFilters_NormalizesAndCallsRepo() {
                when(gameRepository.findNearbyGameIdsWithFilters(
                                any(Instant.class), eq(45.5f), eq(-73.5f), eq(5.0),
                                eq("soccer"), eq("beginner"), eq("indoor"), eq("casual")))
                                .thenReturn(List.of());

                gameService.findNearbyGames(
                                45.5f, -73.5f, 5.0,
                                "  Soccer  ", "Beginner", "Indoor", "Casual", userId);

                verify(gameRepository).findNearbyGameIdsWithFilters(
                                any(Instant.class), eq(45.5f), eq(-73.5f), eq(5.0),
                                eq("soccer"), eq("beginner"), eq("indoor"), eq("casual"));
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
        @DisplayName("getPastGames returns mapped games for user")
        void getPastGames_ShouldReturnMappedGames() {
                when(gameRepository.findPastGames(eq(userId), any(Instant.class)))
                                .thenReturn(List.of(game));
                mockMapToGameResponseDependencies();

                List<GameDto.GameResponse> result = gameService.getPastGames(userId);

                assertThat(result).hasSize(1);
                assertThat(result.get(0).getTitle()).isEqualTo("Test Game");
                assertThat(result.get(0).getSportName()).isEqualTo("Basketball");
                verify(gameRepository).findPastGames(eq(userId), any(Instant.class));
        }

        @Test
        @DisplayName("getUpcomingGames with null userId still maps response")
        void getUpcomingGames_NullUserId_MapsResponse() {
                when(gameRepository.findUpcomingGamesWithFilters(
                                any(Instant.class), isNull(), isNull(), isNull(), isNull()))
                                .thenReturn(List.of(game));
                when(participationRepository.countParticipationSummaryByGameIds(any())).thenReturn(List.of());
                when(tagAssignmentRepository.findAllByGame_GameIdIn(any())).thenReturn(List.of());

                List<GameDto.GameResponse> result = gameService.getUpcomingGames(null, null, null, null, null);

                assertThat(result).hasSize(1);
                assertThat(result.get(0).getTitle()).isEqualTo("Test Game");
                assertThat(result.get(0).getHasExactLocationAccess()).isFalse();
        }
}
