package com.backend.playlocal.service;

import com.backend.playlocal.model.dto.StatsDto;
import com.backend.playlocal.model.entity.GameParticipation;
import com.backend.playlocal.model.entity.ScoreHistory;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.ScoreHistoryRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for Stats & Analytics endpoints.
 * US-7.6: Dashboard + Metric Explanations
 *
 * <p>Three metrics are supported:
 * <ul>
 *   <li><b>Win rate</b>: ATTENDED / (ATTENDED + NO_SHOW) for games where attendance was formally
 *       confirmed by the organizer. Represents how often the user showed up among games they
 *       committed to and had their attendance recorded.</li>
 *   <li><b>Attendance rate</b>: ATTENDED / total CONFIRMED for all games the user joined
 *       (including games where attendance was never formally confirmed, i.e. UNKNOWN).
 *       A broader measure of participation relative to commitments.</li>
 *   <li><b>Skill trend</b>: Reliability score over time from ScoreHistory, plotted as a
 *       chronological line chart.</li>
 * </ul>
 *
 * <p>All metrics support timeframe filtering via a string parameter ("30", "90", "all").
 * An empty-state response is returned (never null/crash) when no data exists.
 */
@Service
public class StatsService {

    private static final DateTimeFormatter MONTH_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM").withZone(ZoneOffset.UTC);

    private final GameParticipationRepository participationRepository;
    private final ScoreHistoryRepository scoreHistoryRepository;

    public StatsService(GameParticipationRepository participationRepository,
                        ScoreHistoryRepository scoreHistoryRepository) {
        this.participationRepository = participationRepository;
        this.scoreHistoryRepository = scoreHistoryRepository;
    }

    // -------------------------------------------------------------------------
    // Win Rate
    // -------------------------------------------------------------------------

    /**
     * Win rate = ATTENDED / (ATTENDED + NO_SHOW) for the games where the organizer
     * formally confirmed attendance. Monthly data points are included for charting.
     *
     * @param userId    the authenticated user's ID
     * @param timeframe "30", "90", or "all"
     * @return stats response; {@code empty=true} when no tracked-attendance games exist
     */
    public StatsDto.StatsResponse getWinRate(UUID userId, String timeframe) {
        Instant cutoff = parseCutoff(timeframe);
        List<GameParticipation> all = participationRepository.findConfirmedByUserSince(userId, cutoff);

        // Only games where attendance was explicitly confirmed (ATTENDED or NO_SHOW)
        List<GameParticipation> tracked = all.stream()
                .filter(gp -> gp.getAttendanceStatus() != GameParticipation.AttendanceStatus.UNKNOWN)
                .collect(Collectors.toList());

        if (tracked.isEmpty()) {
            return emptyResponse("win_rate", timeframe);
        }

        long attended = counted(tracked, GameParticipation.AttendanceStatus.ATTENDED);
        double rate = round1((double) attended / tracked.size() * 100.0);

        List<StatsDto.DataPoint> dataPoints = toMonthlyRatePoints(
                tracked, GameParticipation.AttendanceStatus.ATTENDED);

        return StatsDto.StatsResponse.builder()
                .metric("win_rate")
                .value(rate)
                .timeframe(timeframe)
                .dataPoints(dataPoints)
                .empty(false)
                .build();
    }

    // -------------------------------------------------------------------------
    // Attendance Rate
    // -------------------------------------------------------------------------

    /**
     * Attendance rate = ATTENDED / total CONFIRMED for all games the user joined,
     * including those where attendance was never formally recorded (UNKNOWN).
     * Monthly data points are included for charting.
     *
     * @param userId    the authenticated user's ID
     * @param timeframe "30", "90", or "all"
     * @return stats response; {@code empty=true} when user has no confirmed participations
     */
    public StatsDto.StatsResponse getAttendanceRate(UUID userId, String timeframe) {
        Instant cutoff = parseCutoff(timeframe);
        List<GameParticipation> all = participationRepository.findConfirmedByUserSince(userId, cutoff);

        if (all.isEmpty()) {
            return emptyResponse("attendance_rate", timeframe);
        }

        long attended = counted(all, GameParticipation.AttendanceStatus.ATTENDED);
        double rate = round1((double) attended / all.size() * 100.0);

        List<StatsDto.DataPoint> dataPoints = toMonthlyRatePoints(
                all, GameParticipation.AttendanceStatus.ATTENDED);

        return StatsDto.StatsResponse.builder()
                .metric("attendance_rate")
                .value(rate)
                .timeframe(timeframe)
                .dataPoints(dataPoints)
                .empty(false)
                .build();
    }

    // -------------------------------------------------------------------------
    // Skill Trend
    // -------------------------------------------------------------------------

    /**
     * Skill (reliability score) trend from ScoreHistory, ordered chronologically.
     * Each data point is {@code {date: ISO-8601 instant, value: newScore}}.
     * The aggregate {@code value} is the most recent reliability score in the timeframe.
     *
     * @param userId    the authenticated user's ID
     * @param timeframe "30", "90", or "all"
     * @return stats response; {@code empty=true} when user has no score history
     */
    public StatsDto.StatsResponse getSkillTrend(UUID userId, String timeframe) {
        Instant cutoff = parseCutoff(timeframe);
        List<ScoreHistory> history = scoreHistoryRepository.findByUserIdSince(userId, cutoff);

        if (history.isEmpty()) {
            return emptyResponse("skill_trend", timeframe);
        }

        List<StatsDto.DataPoint> dataPoints = history.stream()
                .map(sh -> StatsDto.DataPoint.builder()
                        .date(sh.getCreatedAt().toString())
                        .value(sh.getNewScore())
                        .build())
                .collect(Collectors.toList());

        // Most recent score as the headline value
        double currentScore = history.get(history.size() - 1).getNewScore();

        return StatsDto.StatsResponse.builder()
                .metric("skill_trend")
                .value(currentScore)
                .timeframe(timeframe)
                .dataPoints(dataPoints)
                .empty(false)
                .build();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Parse the timeframe query param into an Instant cutoff.
     * <ul>
     *   <li>"30"  → 30 days ago</li>
     *   <li>"90"  → 90 days ago</li>
     *   <li>"all" → {@link Instant#EPOCH} (no date filter)</li>
     * </ul>
     *
     * @throws IllegalArgumentException for any value other than "30", "90", or "all"
     */
    public static Instant parseCutoff(String timeframe) {
        return switch (timeframe.toLowerCase()) {
            case "30"  -> Instant.now().minus(30, ChronoUnit.DAYS);
            case "90"  -> Instant.now().minus(90, ChronoUnit.DAYS);
            case "all" -> Instant.EPOCH;
            default    -> throw new IllegalArgumentException(
                    "Invalid timeframe '" + timeframe + "'. Accepted values: 30, 90, all");
        };
    }

    /** Build a consistent empty-state response for a given metric. */
    private StatsDto.StatsResponse emptyResponse(String metric, String timeframe) {
        return StatsDto.StatsResponse.builder()
                .metric(metric)
                .timeframe(timeframe)
                .dataPoints(List.of())
                .empty(true)
                .build();
    }

    /** Count participations matching the given attendance status. */
    private long counted(List<GameParticipation> participations,
                         GameParticipation.AttendanceStatus status) {
        return participations.stream()
                .filter(gp -> gp.getAttendanceStatus() == status)
                .count();
    }

    /**
     * Aggregate participations into monthly rate data points.
     * Each point: date = "yyyy-MM", value = (statusCount / totalCount) * 100.
     */
    private List<StatsDto.DataPoint> toMonthlyRatePoints(
            List<GameParticipation> participations,
            GameParticipation.AttendanceStatus positiveStatus) {

        // TreeMap keeps months in chronological order
        Map<String, long[]> buckets = new TreeMap<>();
        for (GameParticipation gp : participations) {
            String month = MONTH_FMT.format(gp.getGame().getStartTime());
            buckets.computeIfAbsent(month, k -> new long[2]); // [positiveCount, totalCount]
            if (gp.getAttendanceStatus() == positiveStatus) {
                buckets.get(month)[0]++;
            }
            buckets.get(month)[1]++;
        }

        return buckets.entrySet().stream()
                .map(e -> StatsDto.DataPoint.builder()
                        .date(e.getKey())
                        .value(e.getValue()[1] == 0
                                ? 0.0
                                : round1((double) e.getValue()[0] / e.getValue()[1] * 100.0))
                        .build())
                .collect(Collectors.toList());
    }

    /** Round to one decimal place. */
    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
