package com.backend.playlocal.service;

import com.backend.playlocal.model.dto.StatsDto;
import com.backend.playlocal.model.entity.*;
import com.backend.playlocal.repository.GameParticipationRepository;
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
    // getShowUpRate
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("getShowUpRate")
    class GetShowUpRateTests {

        @Test
        @DisplayName("Returns empty response when no confirmed participations exist")
        void getShowUpRate_noParticipations_returnsEmpty() {
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(List.of());

            StatsDto.StatsResponse response = statsService.getShowUpRate(userId, "30");

            assertThat(response.isEmpty()).isTrue();
            assertThat(response.getMetric()).isEqualTo("show_up_rate");
            assertThat(response.getTimeframe()).isEqualTo("30");
            assertThat(response.getValue()).isNull();
            assertThat(response.getDataPoints()).isEmpty();
        }

        @Test
        @DisplayName("Returns empty response when all participations have UNKNOWN attendance")
        void getShowUpRate_allUnknownAttendance_returnsEmpty() {
            List<GameParticipation> participations = List.of(
                    buildParticipation(GameParticipation.AttendanceStatus.UNKNOWN, daysAgo(20)),
                    buildParticipation(GameParticipation.AttendanceStatus.UNKNOWN, daysAgo(10))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getShowUpRate(userId, "30");

            assertThat(response.isEmpty()).isTrue();
        }

        @Test
        @DisplayName("Returns correct show-up rate: 2 attended out of 3 tracked = 66.7%")
        void getShowUpRate_twoAttendedOneNoShow_returns66Percent() {
            List<GameParticipation> participations = List.of(
                    buildParticipation(GameParticipation.AttendanceStatus.ATTENDED, daysAgo(25)),
                    buildParticipation(GameParticipation.AttendanceStatus.ATTENDED, daysAgo(15)),
                    buildParticipation(GameParticipation.AttendanceStatus.NO_SHOW,  daysAgo(5))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getShowUpRate(userId, "30");

            assertThat(response.isEmpty()).isFalse();
            assertThat(response.getValue()).isEqualTo(66.7);
            assertThat(response.getMetric()).isEqualTo("show_up_rate");
            assertThat(response.getDataPoints()).isNotEmpty();
        }

        @Test
        @DisplayName("Returns 100.0 when all tracked games were attended")
        void getShowUpRate_allAttended_returns100() {
            List<GameParticipation> participations = List.of(
                    buildParticipation(GameParticipation.AttendanceStatus.ATTENDED, daysAgo(20)),
                    buildParticipation(GameParticipation.AttendanceStatus.ATTENDED, daysAgo(10))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getShowUpRate(userId, "30");

            assertThat(response.getValue()).isEqualTo(100.0);
        }

        @Test
        @DisplayName("UNKNOWN participations are excluded from show-up rate denominator")
        void getShowUpRate_unknownParticipationsExcluded_fromDenominator() {
            // 1 attended, 1 no-show, 1 unknown → tracked = 2, rate = 50.0
            List<GameParticipation> participations = List.of(
                    buildParticipation(GameParticipation.AttendanceStatus.ATTENDED, daysAgo(20)),
                    buildParticipation(GameParticipation.AttendanceStatus.NO_SHOW,  daysAgo(15)),
                    buildParticipation(GameParticipation.AttendanceStatus.UNKNOWN,  daysAgo(5))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getShowUpRate(userId, "30");

            assertThat(response.getValue()).isEqualTo(50.0);
        }

        @Test
        @DisplayName("Invalid timeframe propagates IllegalArgumentException")
        void getShowUpRate_invalidTimeframe_throwsException() {
            assertThatThrownBy(() -> statsService.getShowUpRate(userId, "7"))
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
        @DisplayName("Returns empty response when user has no confirmed participations")
        void getSkillTrend_noParticipations_returnsEmpty() {
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(List.of());

            StatsDto.StatsResponse response = statsService.getSkillTrend(userId, "30");

            assertThat(response.isEmpty()).isTrue();
            assertThat(response.getMetric()).isEqualTo("skill_trend");
            assertThat(response.getValue()).isNull();
            assertThat(response.getDataPoints()).isEmpty();
        }

        @Test
        @DisplayName("Returns empty response when all games are ALL_LEVELS")
        void getSkillTrend_allAllLevels_returnsEmpty() {
            List<GameParticipation> participations = List.of(
                    buildSkillParticipation("ALL_LEVELS", "CASUAL", Instant.parse("2025-01-15T10:00:00Z")),
                    buildSkillParticipation("all_levels", "COMPETITIVE", Instant.parse("2025-02-15T10:00:00Z"))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getSkillTrend(userId, "30");

            assertThat(response.isEmpty()).isTrue();
        }

        @Test
        @DisplayName("Advanced + Competitive = 100")
        void getSkillTrend_advancedCompetitive_returns100() {
            List<GameParticipation> participations = List.of(
                    buildSkillParticipation("ADVANCED", "COMPETITIVE", Instant.parse("2025-01-15T10:00:00Z"))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getSkillTrend(userId, "30");

            assertThat(response.isEmpty()).isFalse();
            assertThat(response.getValue()).isEqualTo(100.0);
        }

        @Test
        @DisplayName("Beginner + Beginner intensity = 0")
        void getSkillTrend_beginnerBeginner_returns0() {
            List<GameParticipation> participations = List.of(
                    buildSkillParticipation("BEGINNER", "BEGINNER", Instant.parse("2025-01-15T10:00:00Z"))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getSkillTrend(userId, "30");

            assertThat(response.getValue()).isEqualTo(0.0);
        }

        @Test
        @DisplayName("Intermediate + Casual = 50")
        void getSkillTrend_intermediateCasual_returns50() {
            List<GameParticipation> participations = List.of(
                    buildSkillParticipation("INTERMEDIATE", "CASUAL", Instant.parse("2025-01-15T10:00:00Z"))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getSkillTrend(userId, "30");

            assertThat(response.getValue()).isEqualTo(50.0);
        }

        @Test
        @DisplayName("Filters out ALL_LEVELS games (case-insensitive) and averages the rest")
        void getSkillTrend_filtersAllLevels_averagesRest() {
            // Advanced+Competitive=100, ALL_LEVELS excluded, Beginner+Beginner=0 → avg = 50
            List<GameParticipation> participations = List.of(
                    buildSkillParticipation("ADVANCED", "COMPETITIVE", Instant.parse("2025-01-15T10:00:00Z")),
                    buildSkillParticipation("all_levels", "CASUAL", Instant.parse("2025-01-20T10:00:00Z")),
                    buildSkillParticipation("BEGINNER", "BEGINNER", Instant.parse("2025-02-15T10:00:00Z"))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getSkillTrend(userId, "all");

            assertThat(response.getValue()).isEqualTo(50.0);
        }

        @Test
        @DisplayName("Monthly data points show cumulative running average")
        void getSkillTrend_cumulativeAveragePerMonth() {
            // Jan: Advanced+Competitive=100 → cumulative avg = 100
            // Feb: Beginner+Beginner=0 → cumulative avg = (100+0)/2 = 50
            List<GameParticipation> participations = List.of(
                    buildSkillParticipation("ADVANCED", "COMPETITIVE", Instant.parse("2025-01-15T10:00:00Z")),
                    buildSkillParticipation("BEGINNER", "BEGINNER", Instant.parse("2025-02-15T10:00:00Z"))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getSkillTrend(userId, "all");

            assertThat(response.getDataPoints()).hasSize(2);
            assertThat(response.getDataPoints().get(0).getDate()).isEqualTo("2025-01");
            assertThat(response.getDataPoints().get(0).getValue()).isEqualTo(100.0);
            assertThat(response.getDataPoints().get(1).getDate()).isEqualTo("2025-02");
            assertThat(response.getDataPoints().get(1).getValue()).isEqualTo(50.0);
        }

        @Test
        @DisplayName("Multiple games in same month are grouped together in cumulative average")
        void getSkillTrend_multipleGamesPerMonth() {
            // Jan game 1: Advanced+Competitive=100, Jan game 2: Beginner+Casual=25
            // → cumulative avg after Jan = (100+25)/2 = 62.5
            List<GameParticipation> participations = List.of(
                    buildSkillParticipation("ADVANCED", "COMPETITIVE", Instant.parse("2025-01-10T10:00:00Z")),
                    buildSkillParticipation("BEGINNER", "CASUAL", Instant.parse("2025-01-20T10:00:00Z"))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getSkillTrend(userId, "all");

            assertThat(response.getDataPoints()).hasSize(1);
            assertThat(response.getDataPoints().get(0).getDate()).isEqualTo("2025-01");
            assertThat(response.getDataPoints().get(0).getValue()).isEqualTo(62.5);
        }

        @Test
        @DisplayName("Invalid timeframe throws IllegalArgumentException")
        void getSkillTrend_invalidTimeframe_throws() {
            assertThatThrownBy(() -> statsService.getSkillTrend(userId, "invalid"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Games with null skillBand are excluded")
        void getSkillTrend_nullSkillBand_excluded() {
            List<GameParticipation> participations = List.of(
                    buildSkillParticipation(null, "COMPETITIVE", Instant.parse("2025-01-15T10:00:00Z"))
            );
            when(participationRepository.findConfirmedByUserSince(eq(userId), any(Instant.class)))
                    .thenReturn(participations);

            StatsDto.StatsResponse response = statsService.getSkillTrend(userId, "30");

            assertThat(response.isEmpty()).isTrue();
        }
    }

    // -------------------------------------------------------------------------
    // gameSkillScore static helpers
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("Skill score helpers")
    class SkillScoreHelperTests {

        @Test
        @DisplayName("skillBandScore maps correctly")
        void skillBandScore_mapping() {
            assertThat(StatsService.skillBandScore("BEGINNER")).isEqualTo(0.0);
            assertThat(StatsService.skillBandScore("INTERMEDIATE")).isEqualTo(50.0);
            assertThat(StatsService.skillBandScore("ADVANCED")).isEqualTo(100.0);
            assertThat(StatsService.skillBandScore("beginner")).isEqualTo(0.0);
            assertThat(StatsService.skillBandScore(null)).isEqualTo(50.0);
            assertThat(StatsService.skillBandScore("UNKNOWN")).isEqualTo(50.0);
        }

        @Test
        @DisplayName("intensityBandScore maps correctly")
        void intensityBandScore_mapping() {
            assertThat(StatsService.intensityBandScore("BEGINNER")).isEqualTo(0.0);
            assertThat(StatsService.intensityBandScore("CASUAL")).isEqualTo(50.0);
            assertThat(StatsService.intensityBandScore("COMPETITIVE")).isEqualTo(100.0);
            assertThat(StatsService.intensityBandScore("casual")).isEqualTo(50.0);
            assertThat(StatsService.intensityBandScore(null)).isEqualTo(50.0);
            assertThat(StatsService.intensityBandScore("UNKNOWN")).isEqualTo(50.0);
        }

        @Test
        @DisplayName("gameSkillScore averages skill and intensity")
        void gameSkillScore_averages() {
            Game game1 = Game.builder().skillBand("ADVANCED").intensityBand("COMPETITIVE").build();
            assertThat(StatsService.gameSkillScore(game1)).isEqualTo(100.0);

            Game game2 = Game.builder().skillBand("BEGINNER").intensityBand("BEGINNER").build();
            assertThat(StatsService.gameSkillScore(game2)).isEqualTo(0.0);

            Game game3 = Game.builder().skillBand("ADVANCED").intensityBand("CASUAL").build();
            assertThat(StatsService.gameSkillScore(game3)).isEqualTo(75.0);
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

    private GameParticipation buildSkillParticipation(String skillBand, String intensityBand,
                                                       Instant gameStartTime) {
        Game game = Game.builder()
                .gameId(UUID.randomUUID())
                .title("Test Game")
                .startTime(gameStartTime)
                .sport(sport)
                .createdBy(user)
                .status(Game.GameStatus.COMPLETED)
                .skillBand(skillBand)
                .intensityBand(intensityBand)
                .build();

        return GameParticipation.builder()
                .participationId(UUID.randomUUID())
                .user(user)
                .game(game)
                .sport(sport)
                .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                .attendanceStatus(GameParticipation.AttendanceStatus.ATTENDED)
                .build();
    }

    private Instant daysAgo(int days) {
        return Instant.now().minus(days, ChronoUnit.DAYS);
    }
}
