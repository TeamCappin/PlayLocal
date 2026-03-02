package com.backend.playlocal.service;

import com.backend.playlocal.model.dto.StatsDto;
import com.backend.playlocal.model.entity.*;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.ScoreHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for StatsService.
 * US-7.6: Stats & Analytics Dashboard + Metric Explanations
 */
@ExtendWith(MockitoExtension.class)
class StatsServiceTest {

    @Mock
    private GameParticipationRepository participationRepository;

    @Mock
    private ScoreHistoryRepository scoreHistoryRepository;

    @InjectMocks
    private StatsService statsService;

    private UUID userId;
    private User user;
    private Sport sport;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = User.builder()
                .userId(userId)
                .email("player@test.com")
                .displayName("Test Player")
                .slug("test-player")
                .reliabilityScore(80.0f)
                .attendedCount(4)
                .noShowCount(1)
                .gamesCount(5)
                .build();

        sport = Sport.builder()
                .sportId(UUID.randomUUID())
                .name("Basketball")
                .build();
    }

    // -------------------------------------------------------------------------
    // parseCutoff
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("parseCutoff")
    class ParseCutoffTests {

        @Test
        @DisplayName("'30' returns approximately 30 days ago")
        void parseCutoff_30_returns30DaysAgo() {
            Instant cutoff = StatsService.parseCutoff("30");
            Instant expected = Instant.now().minus(30, ChronoUnit.DAYS);
            // Allow a 2-second window to account for test execution time
            assertThat(cutoff).isBetween(expected.minusSeconds(2), expected.plusSeconds(2));
        }

        @Test
        @DisplayName("'90' returns approximately 90 days ago")
        void parseCutoff_90_returns90DaysAgo() {
            Instant cutoff = StatsService.parseCutoff("90");
            Instant expected = Instant.now().minus(90, ChronoUnit.DAYS);
            assertThat(cutoff).isBetween(expected.minusSeconds(2), expected.plusSeconds(2));
        }

        @Test
        @DisplayName("'all' returns Instant.EPOCH")
        void parseCutoff_all_returnsEpoch() {
            assertThat(StatsService.parseCutoff("all")).isEqualTo(Instant.EPOCH);
        }

        @Test
        @DisplayName("'ALL' (uppercase) also returns Instant.EPOCH")
        void parseCutoff_allUppercase_returnsEpoch() {
            assertThat(StatsService.parseCutoff("ALL")).isEqualTo(Instant.EPOCH);
        }

        @Test
        @DisplayName("Invalid timeframe throws IllegalArgumentException")
        void parseCutoff_invalid_throwsIllegalArgumentException() {
            assertThatThrownBy(() -> StatsService.parseCutoff("7"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid timeframe '7'")
                    .hasMessageContaining("30, 90, all");
        }

        @Test
        @DisplayName("Empty string throws IllegalArgumentException")
        void parseCutoff_emptyString_throwsIllegalArgumentException() {
            assertThatThrownBy(() -> StatsService.parseCutoff(""))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // -------------------------------------------------------------------------
    // getWinRate
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("getWinRate")
    class GetWinRateTests {

        @Test
        @DisplayName("Returns empty response when no confirmed participations exist")
        void getWinRate_noParticipations_returnsEmpty() {
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(List.of());

            StatsDto.StatsResponse response = statsService.getWinRate(userId, "30");

            assertThat(response.isEmpty()).isTrue();
            assertThat(response.getMetric()).isEqualTo("win_rate");
            assertThat(response.getTimeframe()).isEqualTo("30");
            assertThat(response.getValue()).isNull();
            assertThat(response.getDataPoints()).isEmpty();
        }

        @Test
        @DisplayName("Returns empty response when all participations have UNKNOWN attendance")
        void getWinRate_allUnknownAttendance_returnsEmpty() {
            List<GameParticipation> participations = List.of(
                    buildParticipation(GameParticipation.AttendanceStatus.UNKNOWN, daysAgo(20)),
                    buildParticipation(GameParticipation.AttendanceStatus.UNKNOWN, daysAgo(10))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getWinRate(userId, "30");

            assertThat(response.isEmpty()).isTrue();
        }

        @Test
        @DisplayName("Returns correct win rate: 2 attended out of 3 tracked = 66.7%")
        void getWinRate_twoAttendedOneNoShow_returns66Percent() {
            List<GameParticipation> participations = List.of(
                    buildParticipation(GameParticipation.AttendanceStatus.ATTENDED, daysAgo(25)),
                    buildParticipation(GameParticipation.AttendanceStatus.ATTENDED, daysAgo(15)),
                    buildParticipation(GameParticipation.AttendanceStatus.NO_SHOW,  daysAgo(5))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getWinRate(userId, "30");

            assertThat(response.isEmpty()).isFalse();
            assertThat(response.getValue()).isEqualTo(66.7);
            assertThat(response.getMetric()).isEqualTo("win_rate");
            assertThat(response.getDataPoints()).isNotEmpty();
        }

        @Test
        @DisplayName("Returns 100.0 when all tracked games were attended")
        void getWinRate_allAttended_returns100() {
            List<GameParticipation> participations = List.of(
                    buildParticipation(GameParticipation.AttendanceStatus.ATTENDED, daysAgo(20)),
                    buildParticipation(GameParticipation.AttendanceStatus.ATTENDED, daysAgo(10))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getWinRate(userId, "30");

            assertThat(response.getValue()).isEqualTo(100.0);
        }

        @Test
        @DisplayName("UNKNOWN participations are excluded from win rate denominator")
        void getWinRate_unknownParticipationsExcluded_fromDenominator() {
            // 1 attended, 1 no-show, 1 unknown → tracked = 2, rate = 50.0
            List<GameParticipation> participations = List.of(
                    buildParticipation(GameParticipation.AttendanceStatus.ATTENDED, daysAgo(20)),
                    buildParticipation(GameParticipation.AttendanceStatus.NO_SHOW,  daysAgo(15)),
                    buildParticipation(GameParticipation.AttendanceStatus.UNKNOWN,  daysAgo(5))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getWinRate(userId, "30");

            assertThat(response.getValue()).isEqualTo(50.0);
        }

        @Test
        @DisplayName("Invalid timeframe propagates IllegalArgumentException")
        void getWinRate_invalidTimeframe_throwsException() {
            assertThatThrownBy(() -> statsService.getWinRate(userId, "7"))
                    .isInstanceOf(IllegalArgumentException.class);
            verifyNoInteractions(participationRepository);
        }
    }

    // -------------------------------------------------------------------------
    // getAttendanceRate
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("getAttendanceRate")
    class GetAttendanceRateTests {

        @Test
        @DisplayName("Returns empty response when no confirmed participations exist")
        void getAttendanceRate_noParticipations_returnsEmpty() {
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(List.of());

            StatsDto.StatsResponse response = statsService.getAttendanceRate(userId, "90");

            assertThat(response.isEmpty()).isTrue();
            assertThat(response.getMetric()).isEqualTo("attendance_rate");
            assertThat(response.getValue()).isNull();
        }

        @Test
        @DisplayName("UNKNOWN games count in denominator: 1 attended out of 3 total = 33.3%")
        void getAttendanceRate_unknownCountsInDenominator() {
            List<GameParticipation> participations = List.of(
                    buildParticipation(GameParticipation.AttendanceStatus.ATTENDED, daysAgo(60)),
                    buildParticipation(GameParticipation.AttendanceStatus.UNKNOWN,  daysAgo(30)),
                    buildParticipation(GameParticipation.AttendanceStatus.NO_SHOW,  daysAgo(10))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getAttendanceRate(userId, "90");

            assertThat(response.getValue()).isEqualTo(33.3);
        }

        @Test
        @DisplayName("All-time timeframe passes Instant.EPOCH cutoff to repository")
        void getAttendanceRate_allTimeframe_passesEpochCutoff() {
            when(participationRepository.findConfirmedByUserSince(eq(userId), eq(Instant.EPOCH)))
                    .thenReturn(List.of());

            statsService.getAttendanceRate(userId, "all");

            verify(participationRepository).findConfirmedByUserSince(userId, Instant.EPOCH);
        }

        @Test
        @DisplayName("DataPoints are grouped by month and ordered chronologically")
        void getAttendanceRate_dataPointsGroupedByMonth() {
            // Two participations in same month, one in next month
            List<GameParticipation> participations = List.of(
                    buildParticipation(GameParticipation.AttendanceStatus.ATTENDED, Instant.parse("2025-01-10T10:00:00Z")),
                    buildParticipation(GameParticipation.AttendanceStatus.NO_SHOW,  Instant.parse("2025-01-20T10:00:00Z")),
                    buildParticipation(GameParticipation.AttendanceStatus.ATTENDED, Instant.parse("2025-02-05T10:00:00Z"))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getAttendanceRate(userId, "all");

            assertThat(response.getDataPoints()).hasSize(2);
            assertThat(response.getDataPoints().get(0).getDate()).isEqualTo("2025-01");
            assertThat(response.getDataPoints().get(1).getDate()).isEqualTo("2025-02");
            // Jan: 1 attended / 2 total = 50.0
            assertThat(response.getDataPoints().get(0).getValue()).isEqualTo(50.0);
            // Feb: 1 attended / 1 total = 100.0
            assertThat(response.getDataPoints().get(1).getValue()).isEqualTo(100.0);
        }
    }

    // -------------------------------------------------------------------------
    // getSkillTrend
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("getSkillTrend")
    class GetSkillTrendTests {

        @Test
        @DisplayName("Returns empty response when no score history exists")
        void getSkillTrend_noHistory_returnsEmpty() {
            when(scoreHistoryRepository.findByUserIdSince(eq(userId), any(Instant.class)))
                    .thenReturn(List.of());

            StatsDto.StatsResponse response = statsService.getSkillTrend(userId, "30");

            assertThat(response.isEmpty()).isTrue();
            assertThat(response.getMetric()).isEqualTo("skill_trend");
            assertThat(response.getValue()).isNull();
            assertThat(response.getDataPoints()).isEmpty();
        }

        @Test
        @DisplayName("Returns correct current score (last entry's newScore) and all dataPoints")
        void getSkillTrend_withHistory_returnsCurrentScoreAndDataPoints() {
            List<ScoreHistory> history = List.of(
                    buildScoreHistory(100.0f, 95.0f, daysAgo(20)),  // previous 100 → new 95
                    buildScoreHistory(95.0f,  90.0f, daysAgo(10)),  // previous 95 → new 90
                    buildScoreHistory(90.0f,  92.0f, daysAgo(2))    // previous 90 → new 92
            );
            when(scoreHistoryRepository.findByUserIdSince(eq(userId), any(Instant.class)))
                    .thenReturn(history);

            StatsDto.StatsResponse response = statsService.getSkillTrend(userId, "30");

            assertThat(response.isEmpty()).isFalse();
            assertThat(response.getValue()).isEqualTo(92.0); // last entry
            assertThat(response.getDataPoints()).hasSize(3);
            assertThat(response.getDataPoints().get(0).getValue()).isEqualTo(95.0);
            assertThat(response.getDataPoints().get(1).getValue()).isEqualTo(90.0);
            assertThat(response.getDataPoints().get(2).getValue()).isEqualTo(92.0);
        }

        @Test
        @DisplayName("DataPoints are in chronological order (oldest first)")
        void getSkillTrend_dataPointsChronological() {
            Instant earlier = Instant.parse("2025-01-01T10:00:00Z");
            Instant later   = Instant.parse("2025-02-01T10:00:00Z");

            // Repository returns oldest-first (ORDER BY createdAt ASC)
            List<ScoreHistory> history = List.of(
                    buildScoreHistory(100.0f, 95.0f, earlier),
                    buildScoreHistory(95.0f,  98.0f, later)
            );
            when(scoreHistoryRepository.findByUserIdSince(eq(userId), any(Instant.class)))
                    .thenReturn(history);

            StatsDto.StatsResponse response = statsService.getSkillTrend(userId, "all");

            assertThat(response.getDataPoints().get(0).getDate())
                    .isEqualTo(earlier.toString());
            assertThat(response.getDataPoints().get(1).getDate())
                    .isEqualTo(later.toString());
        }

        @Test
        @DisplayName("All-time timeframe passes Instant.EPOCH cutoff to repository")
        void getSkillTrend_allTimeframe_passesEpochCutoff() {
            when(scoreHistoryRepository.findByUserIdSince(eq(userId), eq(Instant.EPOCH)))
                    .thenReturn(List.of());

            statsService.getSkillTrend(userId, "all");

            verify(scoreHistoryRepository).findByUserIdSince(userId, Instant.EPOCH);
        }

        @Test
        @DisplayName("Invalid timeframe throws IllegalArgumentException before querying")
        void getSkillTrend_invalidTimeframe_throwsBeforeQuery() {
            assertThatThrownBy(() -> statsService.getSkillTrend(userId, "invalid"))
                    .isInstanceOf(IllegalArgumentException.class);
            verifyNoInteractions(scoreHistoryRepository);
        }
    }

    // -------------------------------------------------------------------------
    // Test builders
    // -------------------------------------------------------------------------

    private GameParticipation buildParticipation(GameParticipation.AttendanceStatus status,
                                                  Instant gameStartTime) {
        Game game = Game.builder()
                .gameId(UUID.randomUUID())
                .title("Test Game")
                .startTime(gameStartTime)
                .sport(sport)
                .createdBy(user)
                .status(Game.GameStatus.COMPLETED)
                .build();

        return GameParticipation.builder()
                .participationId(UUID.randomUUID())
                .user(user)
                .game(game)
                .sport(sport)
                .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                .attendanceStatus(status)
                .build();
    }

    private ScoreHistory buildScoreHistory(float previousScore, float newScore, Instant createdAt) {
        return ScoreHistory.builder()
                .scoreHistoryId(UUID.randomUUID())
                .user(user)
                .previousScore(previousScore)
                .newScore(newScore)
                .delta(newScore - previousScore)
                .reason(newScore >= previousScore
                        ? ScoreHistory.ScoreChangeReason.ATTENDANCE
                        : ScoreHistory.ScoreChangeReason.NO_SHOW)
                .createdAt(createdAt)
                .build();
    }

    private Instant daysAgo(int days) {
        return Instant.now().minus(days, ChronoUnit.DAYS);
    }
}
