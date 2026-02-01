package com.backend.playlocal.unit;

import com.backend.playlocal.service.OrganizerQualityService;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.OrganizerQualityDto;
import com.backend.playlocal.model.entity.*;
import com.backend.playlocal.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for OrganizerQualityService.
 * Implements: US-6.1 - Organizer Quality Score
 */
@ExtendWith(MockitoExtension.class)
class OrganizerQualityServiceTest {

    @Mock
    private OrganizerQualityScoreRepository oqsRepository;

    @Mock
    private OrganizerScoreHistoryRepository historyRepository;

    @Mock
    private GameRepository gameRepository;

    @Mock
    private GameParticipationRepository participationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrganizerQualityService oqsService;

    private User testOrganizer;
    private Game testGame;
    private OrganizerQualityScore testOqs;

    @BeforeEach
    void setUp() {
        testOrganizer = User.builder()
                .userId(UUID.randomUUID())
                .email("organizer@test.com")
                .displayName("Test Organizer")
                .status(User.UserStatus.ACTIVE)
                .build();

        testGame = Game.builder()
                .gameId(UUID.randomUUID())
                .createdBy(testOrganizer)
                .title("Test Game")
                .status(Game.GameStatus.COMPLETED)
                .build();

        testOqs = OrganizerQualityScore.builder()
                .userId(testOrganizer.getUserId())
                .oqsScore(85.0f)
                .gameCompletionRate(90.0f)
                .repeatPlayerRate(75.0f)
                .totalGamesHosted(10)
                .completedGames(9)
                .cancelledGames(1)
                .totalUniquePlayers(50)
                .repeatPlayers(20)
                .lastCalculatedAt(Instant.now())
                .build();
    }

    @Nested
    @DisplayName("getOqs Tests")
    class GetOqsTests {

        @Test
        @DisplayName("Should return OQS for existing organizer")
        void shouldReturnOqsForExistingOrganizer() {
            when(userRepository.findActiveById(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOrganizer));
            when(oqsRepository.findByUserId(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOqs));

            OrganizerQualityDto.OqsResponse response = oqsService.getOqs(testOrganizer.getUserId());

            assertThat(response).isNotNull();
            assertThat(response.getUserId()).isEqualTo(testOrganizer.getUserId().toString());
            assertThat(response.getOqsScore()).isEqualTo(85.0f);
            assertThat(response.getGameCompletionRate()).isEqualTo(90.0f);
            assertThat(response.getRepeatPlayerRate()).isEqualTo(75.0f);
            assertThat(response.getTotalGamesHosted()).isEqualTo(10);
            assertThat(response.getConfidenceLevel()).isEqualTo("HIGH");
        }

        @Test
        @DisplayName("Should return default OQS for new organizer")
        void shouldReturnDefaultOqsForNewOrganizer() {
            when(userRepository.findActiveById(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOrganizer));
            when(oqsRepository.findByUserId(testOrganizer.getUserId()))
                    .thenReturn(Optional.empty());

            OrganizerQualityDto.OqsResponse response = oqsService.getOqs(testOrganizer.getUserId());

            assertThat(response).isNotNull();
            assertThat(response.getOqsScore()).isEqualTo(100.0f);
            assertThat(response.getTotalGamesHosted()).isEqualTo(0);
            assertThat(response.getConfidenceLevel()).isEqualTo("LOW");
        }

        @Test
        @DisplayName("Should throw exception for non-existent user")
        void shouldThrowExceptionForNonExistentUser() {
            UUID nonExistentId = UUID.randomUUID();
            when(userRepository.findActiveById(nonExistentId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> oqsService.getOqs(nonExistentId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    @Nested
    @DisplayName("getOqsSummary Tests")
    class GetOqsSummaryTests {

        @Test
        @DisplayName("Should return OQS summary for existing organizer")
        void shouldReturnOqsSummaryForExistingOrganizer() {
            when(oqsRepository.findByUserId(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOqs));

            OrganizerQualityDto.OqsSummary summary = oqsService.getOqsSummary(testOrganizer.getUserId());

            assertThat(summary).isNotNull();
            assertThat(summary.getOqsScore()).isEqualTo(85.0f);
            assertThat(summary.getConfidenceLevel()).isEqualTo("HIGH");
            assertThat(summary.getTotalGamesHosted()).isEqualTo(10);
        }

        @Test
        @DisplayName("Should return default summary for new organizer")
        void shouldReturnDefaultSummaryForNewOrganizer() {
            when(oqsRepository.findByUserId(testOrganizer.getUserId()))
                    .thenReturn(Optional.empty());

            OrganizerQualityDto.OqsSummary summary = oqsService.getOqsSummary(testOrganizer.getUserId());

            assertThat(summary).isNotNull();
            assertThat(summary.getOqsScore()).isEqualTo(100.0f);
            assertThat(summary.getConfidenceLevel()).isEqualTo("LOW");
            assertThat(summary.getTotalGamesHosted()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("calculateOqs Tests")
    class CalculateOqsTests {

        @Test
        @DisplayName("Should calculate OQS correctly with completed games")
        void shouldCalculateOqsWithCompletedGames() {
            // Setup: 8 completed games, 2 cancelled games
            List<Game> games = new ArrayList<>();
            for (int i = 0; i < 8; i++) {
                games.add(createGame(Game.GameStatus.COMPLETED));
            }
            for (int i = 0; i < 2; i++) {
                games.add(createGame(Game.GameStatus.CANCELLED));
            }

            when(userRepository.findActiveById(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOrganizer));
            when(oqsRepository.findByUserId(testOrganizer.getUserId()))
                    .thenReturn(Optional.empty());
            when(oqsRepository.save(any(OrganizerQualityScore.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(gameRepository.findByOrganizer(testOrganizer.getUserId()))
                    .thenReturn(games);
            when(participationRepository.findByGameId(any()))
                    .thenReturn(Collections.emptyList());

            OrganizerQualityDto.OqsResponse response = oqsService.calculateOqs(
                    testOrganizer.getUserId(),
                    OrganizerScoreHistory.OqsChangeReason.INITIAL_CALCULATION,
                    null
            );

            // Expected: completion rate = 8/10 = 80%, repeat rate = 0%
            // OQS = (80 * 0.6) + (0 * 0.4) = 48%
            assertThat(response.getGameCompletionRate()).isEqualTo(80.0f);
            assertThat(response.getRepeatPlayerRate()).isEqualTo(0.0f);
            assertThat(response.getOqsScore()).isEqualTo(48.0f);
        }

        @Test
        @DisplayName("Should calculate repeat player rate correctly")
        void shouldCalculateRepeatPlayerRateCorrectly() {
            // Setup: 3 completed games with some repeat players
            UUID player1 = UUID.randomUUID();
            UUID player2 = UUID.randomUUID();
            UUID player3 = UUID.randomUUID();

            Game game1 = createGame(Game.GameStatus.COMPLETED);
            Game game2 = createGame(Game.GameStatus.COMPLETED);
            Game game3 = createGame(Game.GameStatus.COMPLETED);
            List<Game> games = Arrays.asList(game1, game2, game3);

            // Player1 attended all 3 games (repeat)
            // Player2 attended 2 games (repeat)
            // Player3 attended 1 game (not repeat)
            List<GameParticipation> game1Participants = Arrays.asList(
                    createParticipation(player1, game1),
                    createParticipation(player2, game1)
            );
            List<GameParticipation> game2Participants = Arrays.asList(
                    createParticipation(player1, game2),
                    createParticipation(player2, game2),
                    createParticipation(player3, game2)
            );
            List<GameParticipation> game3Participants = Arrays.asList(
                    createParticipation(player1, game3)
            );

            when(userRepository.findActiveById(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOrganizer));
            when(oqsRepository.findByUserId(testOrganizer.getUserId()))
                    .thenReturn(Optional.empty());
            when(oqsRepository.save(any(OrganizerQualityScore.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(gameRepository.findByOrganizer(testOrganizer.getUserId()))
                    .thenReturn(games);
            when(participationRepository.findByGameId(game1.getGameId()))
                    .thenReturn(game1Participants);
            when(participationRepository.findByGameId(game2.getGameId()))
                    .thenReturn(game2Participants);
            when(participationRepository.findByGameId(game3.getGameId()))
                    .thenReturn(game3Participants);

            OrganizerQualityDto.OqsResponse response = oqsService.calculateOqs(
                    testOrganizer.getUserId(),
                    OrganizerScoreHistory.OqsChangeReason.INITIAL_CALCULATION,
                    null
            );

            // 3 unique players, 2 repeat players (player1 and player2)
            // Repeat rate = 2/3 = 66.67%
            assertThat(response.getTotalUniquePlayers()).isEqualTo(3);
            assertThat(response.getRepeatPlayers()).isEqualTo(2);
            assertThat(response.getRepeatPlayerRate()).isCloseTo(66.67f, within(0.1f));
        }

        @Test
        @DisplayName("Should log OQS change to history")
        void shouldLogOqsChangeToHistory() {
            when(userRepository.findActiveById(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOrganizer));
            when(oqsRepository.findByUserId(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOqs));
            when(oqsRepository.save(any(OrganizerQualityScore.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(gameRepository.findByOrganizer(testOrganizer.getUserId()))
                    .thenReturn(Collections.emptyList());

            oqsService.calculateOqs(
                    testOrganizer.getUserId(),
                    OrganizerScoreHistory.OqsChangeReason.GAME_COMPLETED,
                    testGame
            );

            verify(historyRepository).save(any(OrganizerScoreHistory.class));
        }
    }

    @Nested
    @DisplayName("Confidence Level Tests")
    class ConfidenceLevelTests {

        @Test
        @DisplayName("Should return LOW confidence for < 3 games")
        void shouldReturnLowConfidenceForLessThan3Games() {
            testOqs.setTotalGamesHosted(2);
            when(oqsRepository.findByUserId(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOqs));

            OrganizerQualityDto.OqsSummary summary = oqsService.getOqsSummary(testOrganizer.getUserId());

            assertThat(summary.getConfidenceLevel()).isEqualTo("LOW");
        }

        @Test
        @DisplayName("Should return MEDIUM confidence for 3-9 games")
        void shouldReturnMediumConfidenceFor3To9Games() {
            testOqs.setTotalGamesHosted(5);
            when(oqsRepository.findByUserId(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOqs));

            OrganizerQualityDto.OqsSummary summary = oqsService.getOqsSummary(testOrganizer.getUserId());

            assertThat(summary.getConfidenceLevel()).isEqualTo("MEDIUM");
        }

        @Test
        @DisplayName("Should return HIGH confidence for 10+ games")
        void shouldReturnHighConfidenceFor10PlusGames() {
            testOqs.setTotalGamesHosted(10);
            when(oqsRepository.findByUserId(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOqs));

            OrganizerQualityDto.OqsSummary summary = oqsService.getOqsSummary(testOrganizer.getUserId());

            assertThat(summary.getConfidenceLevel()).isEqualTo("HIGH");
        }
    }

    @Nested
    @DisplayName("getOqsHistory Tests")
    class GetOqsHistoryTests {

        @Test
        @DisplayName("Should return paginated OQS history")
        void shouldReturnPaginatedOqsHistory() {
            List<OrganizerScoreHistory> historyList = Arrays.asList(
                    createHistoryEntry(OrganizerScoreHistory.OqsChangeReason.GAME_COMPLETED),
                    createHistoryEntry(OrganizerScoreHistory.OqsChangeReason.GAME_CANCELLED)
            );
            Page<OrganizerScoreHistory> historyPage = new PageImpl<>(
                    historyList, PageRequest.of(0, 10), 2
            );

            when(userRepository.findActiveById(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOrganizer));
            when(oqsRepository.findByUserId(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOqs));
            when(historyRepository.findByOrganizerIdOrderByCreatedAtDesc(
                    eq(testOrganizer.getUserId()), any(PageRequest.class)))
                    .thenReturn(historyPage);

            OrganizerQualityDto.OqsHistoryResponse response = 
                    oqsService.getOqsHistory(testOrganizer.getUserId(), 0, 10);

            assertThat(response.getHistory()).hasSize(2);
            assertThat(response.getTotalEntries()).isEqualTo(2);
            assertThat(response.getCurrentPage()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Event Trigger Tests")
    class EventTriggerTests {

        @Test
        @DisplayName("Should recalculate OQS on game completed")
        void shouldRecalculateOqsOnGameCompleted() {
            when(gameRepository.findById(testGame.getGameId()))
                    .thenReturn(Optional.of(testGame));
            when(userRepository.findActiveById(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOrganizer));
            when(oqsRepository.findByUserId(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOqs));
            when(oqsRepository.save(any(OrganizerQualityScore.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(gameRepository.findByOrganizer(testOrganizer.getUserId()))
                    .thenReturn(Collections.singletonList(testGame));

            oqsService.onGameCompleted(testGame.getGameId());

            verify(oqsRepository).save(any(OrganizerQualityScore.class));
        }

        @Test
        @DisplayName("Should recalculate OQS on game cancelled")
        void shouldRecalculateOqsOnGameCancelled() {
            testGame.setStatus(Game.GameStatus.CANCELLED);
            
            when(gameRepository.findById(testGame.getGameId()))
                    .thenReturn(Optional.of(testGame));
            when(userRepository.findActiveById(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOrganizer));
            when(oqsRepository.findByUserId(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOqs));
            when(oqsRepository.save(any(OrganizerQualityScore.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(gameRepository.findByOrganizer(testOrganizer.getUserId()))
                    .thenReturn(Collections.singletonList(testGame));

            oqsService.onGameCancelled(testGame.getGameId());

            verify(oqsRepository).save(any(OrganizerQualityScore.class));
        }
    }

    // Helper methods
    private Game createGame(Game.GameStatus status) {
        return Game.builder()
                .gameId(UUID.randomUUID())
                .createdBy(testOrganizer)
                .title("Test Game")
                .status(status)
                .build();
    }

    private GameParticipation createParticipation(UUID playerId, Game game) {
        User player = User.builder()
                .userId(playerId)
                .displayName("Player " + playerId)
                .status(User.UserStatus.ACTIVE)
                .build();

        return GameParticipation.builder()
                .participationId(UUID.randomUUID())
                .game(game)
                .user(player)
                .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                .attendanceStatus(GameParticipation.AttendanceStatus.ATTENDED)
                .build();
    }

    private OrganizerScoreHistory createHistoryEntry(OrganizerScoreHistory.OqsChangeReason reason) {
        return OrganizerScoreHistory.builder()
                .historyId(UUID.randomUUID())
                .organizer(testOrganizer)
                .game(testGame)
                .previousOqs(80.0f)
                .newOqs(85.0f)
                .delta(5.0f)
                .reason(reason)
                .description("Test change")
                .createdAt(Instant.now())
                .build();
    }
}
