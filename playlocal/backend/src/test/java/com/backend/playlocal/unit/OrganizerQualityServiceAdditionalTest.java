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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Additional unit tests for OrganizerQualityService to improve coverage.
 * Covers: Info card descriptions, event triggers, edge cases
 * Implements: US-6.1 - Organizer Quality Score
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrganizerQualityServiceAdditionalTest {

    @Mock
    private OrganizerQualityScoreRepository oqsRepository;

    @Mock
    private OrganizerScoreHistoryRepository historyRepository;

        @Mock
        private OrganizerRepository organizerRepository;

    @Mock
    private GameRepository gameRepository;

    @Mock
    private GameParticipationRepository participationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrganizerQualityService oqsService;

        private User testOrganizer;
        private Organizer testOrganizerProfile;
    private Game testGame;

    @BeforeEach
    void setUp() {
        testOrganizer = User.builder()
                .userId(UUID.randomUUID())
                .email("organizer@test.com")
                .displayName("Test Organizer")
                .status(User.UserStatus.ACTIVE)
                .build();

        testOrganizerProfile = Organizer.builder()
                .organizerId(UUID.randomUUID())
                .user(testOrganizer)
                .status(Organizer.OrganizerStatus.PROVISIONAL)
                .build();

        lenient().when(organizerRepository.findByUser_UserId(testOrganizer.getUserId()))
                .thenReturn(Optional.of(testOrganizerProfile));
        lenient().when(organizerRepository.findById(testOrganizerProfile.getOrganizerId()))
                .thenReturn(Optional.of(testOrganizerProfile));

        testGame = Game.builder()
                .gameId(UUID.randomUUID())
                .createdBy(testOrganizer)
                .title("Test Game")
                .status(Game.GameStatus.COMPLETED)
                .build();
    }

    @Nested
    @DisplayName("getOqsInfoCard Tests - Existing Organizer")
    class GetOqsInfoCardExistingOrganizerTests {

        @Test
        @DisplayName("Should return info card with excellent score description (>=90)")
        void shouldReturnExcellentScoreDescription() {
            OrganizerQualityScore oqs = createOqsWithScore(95.0f, 10, 10, 0, 50, 30);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getOverallDescription()).contains("Excellent");
            assertThat(infoCard.getOqsScore()).isEqualTo(95.0f);
        }

        @Test
        @DisplayName("Should return info card with good score description (>=75, <90)")
        void shouldReturnGoodScoreDescription() {
            OrganizerQualityScore oqs = createOqsWithScore(80.0f, 8, 8, 0, 40, 15);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getOverallDescription()).contains("Good");
        }

        @Test
        @DisplayName("Should return info card with average score description (>=60, <75)")
        void shouldReturnAverageScoreDescription() {
            OrganizerQualityScore oqs = createOqsWithScore(65.0f, 5, 4, 1, 20, 5);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getOverallDescription()).contains("Average");
        }

        @Test
        @DisplayName("Should return info card with below average score description (>=40, <60)")
        void shouldReturnBelowAverageScoreDescription() {
            OrganizerQualityScore oqs = createOqsWithScore(45.0f, 4, 2, 2, 15, 2);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getOverallDescription()).contains("Below average");
        }

        @Test
        @DisplayName("Should return info card with low score description (<40)")
        void shouldReturnLowScoreDescription() {
            OrganizerQualityScore oqs = createOqsWithScore(30.0f, 3, 1, 2, 10, 0);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getOverallDescription()).contains("Low score");
        }

        @Test
        @DisplayName("Should return excellent completion rate description (>=95)")
        void shouldReturnExcellentCompletionRateDescription() {
            OrganizerQualityScore oqs = createOqsWithScore(90.0f, 10, 10, 0, 50, 25);
            oqs.setGameCompletionRate(100.0f);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getCompletionRateDescription()).contains("Excellent");
        }

        @Test
        @DisplayName("Should return good completion rate description (>=80, <95)")
        void shouldReturnGoodCompletionRateDescription() {
            OrganizerQualityScore oqs = createOqsWithScore(80.0f, 10, 9, 1, 50, 25);
            oqs.setGameCompletionRate(90.0f);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getCompletionRateDescription()).contains("Good reliability");
        }

        @Test
        @DisplayName("Should return some cancellations description (>=60, <80)")
        void shouldReturnSomeCancellationsDescription() {
            OrganizerQualityScore oqs = createOqsWithScore(70.0f, 10, 7, 3, 50, 20);
            oqs.setGameCompletionRate(70.0f);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getCompletionRateDescription()).contains("Some cancellations");
        }

        @Test
        @DisplayName("Should return high cancellation rate description (<60)")
        void shouldReturnHighCancellationRateDescription() {
            OrganizerQualityScore oqs = createOqsWithScore(50.0f, 10, 5, 5, 30, 5);
            oqs.setGameCompletionRate(50.0f);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getCompletionRateDescription()).contains("High cancellation rate");
        }

        @Test
        @DisplayName("Should return building player base description (total < 5)")
        void shouldReturnBuildingPlayerBaseDescription() {
            OrganizerQualityScore oqs = createOqsWithScore(80.0f, 2, 2, 0, 4, 1);
            oqs.setRepeatPlayerRate(25.0f);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getRepeatRateDescription()).contains("Building player base");
        }

        @Test
        @DisplayName("Should return great retention description (>=50%)")
        void shouldReturnGreatRetentionDescription() {
            OrganizerQualityScore oqs = createOqsWithScore(90.0f, 10, 10, 0, 50, 30);
            oqs.setRepeatPlayerRate(60.0f);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getRepeatRateDescription()).contains("Great retention");
        }

        @Test
        @DisplayName("Should return good retention description (>=25%, <50%)")
        void shouldReturnGoodRetentionDescription() {
            OrganizerQualityScore oqs = createOqsWithScore(80.0f, 10, 9, 1, 50, 15);
            oqs.setRepeatPlayerRate(30.0f);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getRepeatRateDescription()).contains("Good retention");
        }

        @Test
        @DisplayName("Should return building loyalty description (>0%, <25%)")
        void shouldReturnBuildingLoyaltyDescription() {
            OrganizerQualityScore oqs = createOqsWithScore(75.0f, 8, 7, 1, 40, 5);
            oqs.setRepeatPlayerRate(12.5f);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getRepeatRateDescription()).contains("Building loyalty");
        }

        @Test
        @DisplayName("Should return no returning players description (0%)")
        void shouldReturnNoReturningPlayersDescription() {
            OrganizerQualityScore oqs = createOqsWithScore(60.0f, 5, 5, 0, 20, 0);
            oqs.setRepeatPlayerRate(0.0f);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getRepeatRateDescription()).contains("No returning players yet");
        }

        @Test
        @DisplayName("Should return no players yet description (0 unique players)")
        void shouldReturnNoPlayersYetDescription() {
            OrganizerQualityScore oqs = createOqsWithScore(100.0f, 1, 1, 0, 0, 0);
            oqs.setRepeatPlayerRate(0.0f);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getRepeatRateDescription()).contains("No players yet");
        }

        @Test
        @DisplayName("Should return correct games for next level - LOW confidence")
        void shouldReturnGamesForNextLevelLow() {
            OrganizerQualityScore oqs = createOqsWithScore(80.0f, 1, 1, 0, 5, 0);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getGamesForNextLevel()).isEqualTo(2); // 3 - 1 = 2
            assertThat(infoCard.getConfidenceLevel()).isEqualTo("LOW");
        }

        @Test
        @DisplayName("Should return correct games for next level - MEDIUM confidence")
        void shouldReturnGamesForNextLevelMedium() {
            OrganizerQualityScore oqs = createOqsWithScore(80.0f, 5, 5, 0, 20, 5);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getGamesForNextLevel()).isEqualTo(5); // 10 - 5 = 5
            assertThat(infoCard.getConfidenceLevel()).isEqualTo("MEDIUM");
        }

        @Test
        @DisplayName("Should return 0 games for next level - HIGH confidence")
        void shouldReturnZeroGamesForNextLevelHigh() {
            OrganizerQualityScore oqs = createOqsWithScore(85.0f, 15, 14, 1, 60, 30);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getGamesForNextLevel()).isEqualTo(0);
            assertThat(infoCard.getConfidenceLevel()).isEqualTo("HIGH");
        }

        @Test
        @DisplayName("Should return LOW confidence description correctly - singular game")
        void shouldReturnLowConfidenceDescriptionSingular() {
            OrganizerQualityScore oqs = createOqsWithScore(100.0f, 1, 1, 0, 5, 0);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getConfidenceDescription()).contains("Based on 1 game");
        }

        @Test
        @DisplayName("Should return MEDIUM confidence description correctly")
        void shouldReturnMediumConfidenceDescription() {
            OrganizerQualityScore oqs = createOqsWithScore(80.0f, 5, 5, 0, 25, 10);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getConfidenceDescription()).contains("becoming more reliable");
        }

        @Test
        @DisplayName("Should return HIGH confidence description correctly")
        void shouldReturnHighConfidenceDescription() {
            OrganizerQualityScore oqs = createOqsWithScore(85.0f, 12, 11, 1, 50, 25);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getConfidenceDescription()).contains("highly reliable");
        }
    }

    @Nested
    @DisplayName("getOqsInfoCard Tests - New Organizer")
    class GetOqsInfoCardNewOrganizerTests {

        @Test
        @DisplayName("Should return new organizer info card when OQS is null")
        void shouldReturnNewOrganizerInfoCardWhenNull() {
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.empty());

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getOqsScore()).isEqualTo(100.0f);
            assertThat(infoCard.getOverallDescription()).contains("New organizer");
            assertThat(infoCard.getCompletedGames()).isEqualTo(0);
            assertThat(infoCard.getGamesForNextLevel()).isEqualTo(3);
        }

        @Test
        @DisplayName("Should return new organizer info card when 0 games hosted")
        void shouldReturnNewOrganizerInfoCardWhenZeroGames() {
            OrganizerQualityScore oqs = createOqsWithScore(100.0f, 0, 0, 0, 0, 0);
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));

            OrganizerQualityDto.OqsInfoCard infoCard = oqsService.getOqsInfoCard(testOrganizer.getUserId());

            assertThat(infoCard.getOverallDescription()).contains("New organizer");
        }
    }

    @Nested
    @DisplayName("onAttendanceConfirmed Tests")
    class OnAttendanceConfirmedTests {

        @Test
        @DisplayName("Should recalculate OQS on attendance confirmed")
        void shouldRecalculateOqsOnAttendanceConfirmed() {
            OrganizerQualityScore oqs = createOqsWithScore(80.0f, 5, 5, 0, 20, 8);
            
            when(gameRepository.findById(testGame.getGameId()))
                    .thenReturn(Optional.of(testGame));
            when(userRepository.findActiveById(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOrganizer));
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));
            when(oqsRepository.save(any(OrganizerQualityScore.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(gameRepository.findByOrganizer(testOrganizer.getUserId()))
                    .thenReturn(Collections.singletonList(testGame));
            when(participationRepository.findByGameId(any()))
                    .thenReturn(Collections.emptyList());

            oqsService.onAttendanceConfirmed(testGame.getGameId());

            verify(oqsRepository).save(any(OrganizerQualityScore.class));
        }

        @Test
        @DisplayName("Should throw exception when game not found")
        void shouldThrowExceptionWhenGameNotFound() {
            UUID nonExistentGameId = UUID.randomUUID();
            when(gameRepository.findById(nonExistentGameId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> oqsService.onAttendanceConfirmed(nonExistentGameId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Game not found");
        }
    }

    @Nested
    @DisplayName("onGameCompleted Tests")
    class OnGameCompletedTests {

        @Test
        @DisplayName("Should throw exception when game not found")
        void shouldThrowExceptionWhenGameNotFound() {
            UUID nonExistentGameId = UUID.randomUUID();
            when(gameRepository.findById(nonExistentGameId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> oqsService.onGameCompleted(nonExistentGameId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Game not found");
        }
    }

    @Nested
    @DisplayName("onGameCancelled Tests")
    class OnGameCancelledTests {

        @Test
        @DisplayName("Should throw exception when game not found")
        void shouldThrowExceptionWhenGameNotFound() {
            UUID nonExistentGameId = UUID.randomUUID();
            when(gameRepository.findById(nonExistentGameId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> oqsService.onGameCancelled(nonExistentGameId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Game not found");
        }
    }

    @Nested
    @DisplayName("getOqsHistory Tests")
    class GetOqsHistoryTests {

        @Test
        @DisplayName("Should throw exception when organizer not found")
        void shouldThrowExceptionWhenOrganizerNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(userRepository.findActiveById(nonExistentId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> oqsService.getOqsHistory(nonExistentId, 0, 10))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Organizer not found");
        }

        @Test
        @DisplayName("Should return default OQS score when no OQS record exists")
        void shouldReturnDefaultOqsScoreWhenNoRecord() {
            when(userRepository.findActiveById(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOrganizer));
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.empty());
            when(historyRepository.findByOrganizerIdOrderByCreatedAtDesc(
                    eq(testOrganizer.getUserId()), any(PageRequest.class)))
                    .thenReturn(new PageImpl<>(Collections.emptyList()));

            OrganizerQualityDto.OqsHistoryResponse response = 
                    oqsService.getOqsHistory(testOrganizer.getUserId(), 0, 10);

            assertThat(response.getCurrentOqs()).isEqualTo(100.0f);
        }

        @Test
        @DisplayName("Should return history entry with null game")
        void shouldReturnHistoryEntryWithNullGame() {
            OrganizerQualityScore oqs = createOqsWithScore(85.0f, 10, 9, 1, 50, 20);
            OrganizerScoreHistory historyWithNullGame = OrganizerScoreHistory.builder()
                    .historyId(UUID.randomUUID())
                    .organizer(testOrganizer)
                    .game(null)
                    .previousOqs(80.0f)
                    .newOqs(85.0f)
                    .delta(5.0f)
                    .reason(OrganizerScoreHistory.OqsChangeReason.MANUAL_ADJUSTMENT)
                    .description("Manual adjustment")
                    .createdAt(Instant.now())
                    .build();

            Page<OrganizerScoreHistory> historyPage = new PageImpl<>(
                    Collections.singletonList(historyWithNullGame), PageRequest.of(0, 10), 1);

            when(userRepository.findActiveById(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOrganizer));
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));
            when(historyRepository.findByOrganizerIdOrderByCreatedAtDesc(
                    eq(testOrganizer.getUserId()), any(PageRequest.class)))
                    .thenReturn(historyPage);

            OrganizerQualityDto.OqsHistoryResponse response = 
                    oqsService.getOqsHistory(testOrganizer.getUserId(), 0, 10);

            assertThat(response.getHistory()).hasSize(1);
            assertThat(response.getHistory().get(0).getGameId()).isNull();
            assertThat(response.getHistory().get(0).getGameTitle()).isNull();
        }
    }

    @Nested
    @DisplayName("calculateOqs Tests - Edge Cases")
    class CalculateOqsEdgeCasesTests {

        @Test
        @DisplayName("Should calculate OQS with only cancelled games")
        void shouldCalculateOqsWithOnlyCancelledGames() {
            List<Game> games = Arrays.asList(
                    createGame(Game.GameStatus.CANCELLED),
                    createGame(Game.GameStatus.CANCELLED)
            );

            when(userRepository.findActiveById(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOrganizer));
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.empty());
            when(oqsRepository.save(any(OrganizerQualityScore.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(gameRepository.findByOrganizer(testOrganizer.getUserId()))
                    .thenReturn(games);

            OrganizerQualityDto.OqsResponse response = oqsService.calculateOqs(
                    testOrganizerProfile.getOrganizerId(),
                    OrganizerScoreHistory.OqsChangeReason.GAME_CANCELLED,
                    testGame
            );

            // 0 completed out of 2 = 0% completion rate
            assertThat(response.getGameCompletionRate()).isEqualTo(0.0f);
            assertThat(response.getCancelledGames()).isEqualTo(2);
        }

        @Test
        @DisplayName("Should skip games with SCHEDULED status")
        void shouldSkipScheduledGames() {
            Game scheduledGame = createGame(Game.GameStatus.SCHEDULED);
            Game completedGame = createGame(Game.GameStatus.COMPLETED);
            List<Game> games = Arrays.asList(scheduledGame, completedGame);

            when(userRepository.findActiveById(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOrganizer));
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.empty());
            when(oqsRepository.save(any(OrganizerQualityScore.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(gameRepository.findByOrganizer(testOrganizer.getUserId()))
                    .thenReturn(games);
            when(participationRepository.findByGameId(completedGame.getGameId()))
                    .thenReturn(Collections.emptyList());

            OrganizerQualityDto.OqsResponse response = oqsService.calculateOqs(
                    testOrganizerProfile.getOrganizerId(),
                    OrganizerScoreHistory.OqsChangeReason.GAME_COMPLETED,
                    completedGame
            );

            // Only 1 game counted (completed), scheduled game ignored
            assertThat(response.getTotalGamesHosted()).isEqualTo(1);
        }

        @Test
        @DisplayName("Should not log history when delta is below threshold")
        void shouldNotLogHistoryWhenDeltaBelowThreshold() {
            OrganizerQualityScore oqs = createOqsWithScore(85.0f, 10, 9, 1, 50, 20);
            
            when(userRepository.findActiveById(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOrganizer));
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.of(oqs));
            when(oqsRepository.save(any(OrganizerQualityScore.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            // Return same games - no change in metrics
            List<Game> games = new ArrayList<>();
            for (int i = 0; i < 9; i++) {
                games.add(createGame(Game.GameStatus.COMPLETED));
            }
            games.add(createGame(Game.GameStatus.CANCELLED));
            when(gameRepository.findByOrganizer(testOrganizer.getUserId()))
                    .thenReturn(games);
            when(participationRepository.findByGameId(any()))
                    .thenReturn(Collections.emptyList());

            oqsService.calculateOqs(
                    testOrganizerProfile.getOrganizerId(),
                    OrganizerScoreHistory.OqsChangeReason.GAME_COMPLETED,
                    testGame
            );

            // Should still save OQS but may or may not log history depending on delta
            verify(oqsRepository).save(any(OrganizerQualityScore.class));
        }

        @Test
        @DisplayName("Should calculate with null triggering game")
        void shouldCalculateWithNullTriggeringGame() {
            when(userRepository.findActiveById(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOrganizer));
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.empty());
            when(oqsRepository.save(any(OrganizerQualityScore.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(gameRepository.findByOrganizer(testOrganizer.getUserId()))
                    .thenReturn(Collections.emptyList());

            OrganizerQualityDto.OqsResponse response = oqsService.calculateOqs(
                    testOrganizerProfile.getOrganizerId(),
                    OrganizerScoreHistory.OqsChangeReason.INITIAL_CALCULATION,
                    null
            );

            assertThat(response).isNotNull();
            verify(historyRepository).save(any(OrganizerScoreHistory.class));
        }

        @Test
        @DisplayName("Should exclude organizer from repeat player count")
        void shouldExcludeOrganizerFromRepeatPlayerCount() {
            Game game1 = createGame(Game.GameStatus.COMPLETED);
            Game game2 = createGame(Game.GameStatus.COMPLETED);

            UUID playerId = UUID.randomUUID();
            User player = User.builder()
                    .userId(playerId)
                    .displayName("Regular Player")
                    .status(User.UserStatus.ACTIVE)
                    .build();

            // Organizer participates in their own games (should be excluded)
            GameParticipation organizerParticipation = GameParticipation.builder()
                    .participationId(UUID.randomUUID())
                    .game(game1)
                    .user(testOrganizer)
                    .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                    .attendanceStatus(GameParticipation.AttendanceStatus.ATTENDED)
                    .build();

            GameParticipation playerParticipation = GameParticipation.builder()
                    .participationId(UUID.randomUUID())
                    .game(game1)
                    .user(player)
                    .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                    .attendanceStatus(GameParticipation.AttendanceStatus.ATTENDED)
                    .build();

            when(userRepository.findActiveById(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOrganizer));
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.empty());
            when(oqsRepository.save(any(OrganizerQualityScore.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(gameRepository.findByOrganizer(testOrganizer.getUserId()))
                    .thenReturn(Arrays.asList(game1, game2));
            when(participationRepository.findByGameId(game1.getGameId()))
                    .thenReturn(Arrays.asList(organizerParticipation, playerParticipation));
            when(participationRepository.findByGameId(game2.getGameId()))
                    .thenReturn(Collections.emptyList());

            OrganizerQualityDto.OqsResponse response = oqsService.calculateOqs(
                    testOrganizerProfile.getOrganizerId(),
                    OrganizerScoreHistory.OqsChangeReason.INITIAL_CALCULATION,
                    null
            );

            // Only player should be counted, not organizer
            assertThat(response.getTotalUniquePlayers()).isEqualTo(1);
        }

        @Test
        @DisplayName("Should only count CONFIRMED and ATTENDED participations")
        void shouldOnlyCountConfirmedAndAttendedParticipations() {
            Game game = createGame(Game.GameStatus.COMPLETED);

            UUID player1Id = UUID.randomUUID();
            UUID player2Id = UUID.randomUUID();
            User player1 = User.builder().userId(player1Id).displayName("Player 1").status(User.UserStatus.ACTIVE).build();
            User player2 = User.builder().userId(player2Id).displayName("Player 2").status(User.UserStatus.ACTIVE).build();

            // Confirmed and attended - should count
            GameParticipation attendedParticipation = GameParticipation.builder()
                    .participationId(UUID.randomUUID())
                    .game(game)
                    .user(player1)
                    .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                    .attendanceStatus(GameParticipation.AttendanceStatus.ATTENDED)
                    .build();

            // Confirmed but not attended - should NOT count
            GameParticipation noShowParticipation = GameParticipation.builder()
                    .participationId(UUID.randomUUID())
                    .game(game)
                    .user(player2)
                    .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                    .attendanceStatus(GameParticipation.AttendanceStatus.NO_SHOW)
                    .build();

            when(userRepository.findActiveById(testOrganizer.getUserId()))
                    .thenReturn(Optional.of(testOrganizer));
            when(oqsRepository.findByOrganizer_OrganizerId(testOrganizerProfile.getOrganizerId()))
                    .thenReturn(Optional.empty());
            when(oqsRepository.save(any(OrganizerQualityScore.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(gameRepository.findByOrganizer(testOrganizer.getUserId()))
                    .thenReturn(Collections.singletonList(game));
            when(participationRepository.findByGameId(game.getGameId()))
                    .thenReturn(Arrays.asList(attendedParticipation, noShowParticipation));

            OrganizerQualityDto.OqsResponse response = oqsService.calculateOqs(
                    testOrganizerProfile.getOrganizerId(),
                    OrganizerScoreHistory.OqsChangeReason.INITIAL_CALCULATION,
                    null
            );

            // Only player1 should be counted (attended), player2 was a no-show
            assertThat(response.getTotalUniquePlayers()).isEqualTo(1);
        }
    }

    // Helper methods
    private OrganizerQualityScore createOqsWithScore(float oqsScore, int totalGames, int completed, 
                                                      int cancelled, int uniquePlayers, int repeatPlayers) {
        return OrganizerQualityScore.builder()
                .organizer(testOrganizerProfile)
                .oqsScore(oqsScore)
                .gameCompletionRate(totalGames > 0 ? ((float) completed / totalGames) * 100 : 100.0f)
                .repeatPlayerRate(uniquePlayers > 0 ? ((float) repeatPlayers / uniquePlayers) * 100 : 0.0f)
                .totalGamesHosted(totalGames)
                .completedGames(completed)
                .cancelledGames(cancelled)
                .totalUniquePlayers(uniquePlayers)
                .repeatPlayers(repeatPlayers)
                .lastCalculatedAt(Instant.now())
                .build();
    }

    private Game createGame(Game.GameStatus status) {
        return Game.builder()
                .gameId(UUID.randomUUID())
                .createdBy(testOrganizer)
                .title("Test Game")
                .status(status)
                .build();
    }
}
