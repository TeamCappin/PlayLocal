package com.backend.playlocal.service;

import com.backend.playlocal.model.dto.StatsDto;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.GameParticipation;
import com.backend.playlocal.model.entity.PlayerRating;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.PlayerRatingRepository;
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
 *   <li><b>Show-up rate</b>: ATTENDED / (ATTENDED + NO_SHOW) for games where attendance was formally
 *       confirmed by the organizer. Represents how often the user showed up among games they
 *       committed to and had their attendance recorded.</li>
 *   <li><b>Attendance rate</b>: ATTENDED / total CONFIRMED for all games the user joined
 *       (including games where attendance was never formally confirmed, i.e. UNKNOWN).
 *       A broader measure of participation relative to commitments.</li>
 *   <li><b>Skill trend</b>: Skill evolution based on the skill level and intensity of games
 *       the user has played. 100 = Advanced + Competitive, 0 = Beginner + Beginner-Friendly.
 *       Games with "All Levels" skill band are excluded.</li>
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
    private final PlayerRatingRepository playerRatingRepository;

    public StatsService(GameParticipationRepository participationRepository, PlayerRatingRepository playerRatingRepository) { 
        this.participationRepository = participationRepository;
        this.playerRatingRepository = playerRatingRepository;
    }

    // -------------------------------------------------------------------------
    // Show-up Rate
    // -------------------------------------------------------------------------

    /**
     * Show-up rate = ATTENDED / (ATTENDED + NO_SHOW) for the games where the organizer
     * formally confirmed attendance. Monthly data points are included for charting.
     *
     * @param userId    the authenticated user's ID
     * @param timeframe "30", "90", or "all"
     * @return stats response; {@code empty=true} when no tracked-attendance games exist
     */
    public StatsDto.StatsResponse getShowUpRate(UUID userId, String timeframe) {
        Instant cutoff = parseCutoff(timeframe);
        List<GameParticipation> all = participationRepository.findConfirmedByUserSince(userId, cutoff);

        // Only games where attendance was explicitly confirmed (ATTENDED or NO_SHOW)
        List<GameParticipation> tracked = all.stream()
                .filter(gp -> gp.getAttendanceStatus() != GameParticipation.AttendanceStatus.UNKNOWN)
                .collect(Collectors.toList());

        if (tracked.isEmpty()) {
            return emptyResponse("show_up_rate", timeframe);
        }

        long attended = counted(tracked, GameParticipation.AttendanceStatus.ATTENDED);
        double rate = round1((double) attended / tracked.size() * 100.0);

        List<StatsDto.DataPoint> dataPoints = toMonthlyRatePoints(
                tracked, GameParticipation.AttendanceStatus.ATTENDED);

        return StatsDto.StatsResponse.builder()
                .metric("show_up_rate")
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
     * Skill evolution based on the skill level and intensity of games the user has
     * played.  100&nbsp;=&nbsp;Advanced&nbsp;+&nbsp;Competitive, 0&nbsp;=&nbsp;Beginner&nbsp;+&nbsp;Beginner-Friendly.
     *
     * <p>Games with skill band "all_levels" / "ALL_LEVELS" are excluded.
     * For each qualifying game a score is computed as
     * {@code (skillScore + intensityScore) / 2}.
     * Monthly data points show the <em>cumulative</em> average of all games up to that month.
     *
     * @param userId    the authenticated user's ID
     * @param timeframe "30", "90", or "all"
     * @return stats response; {@code empty=true} when no qualifying games exist
     */
    public StatsDto.StatsResponse getSkillTrend(UUID userId, String timeframe) {
        Instant cutoff = parseCutoff(timeframe);
        List<GameParticipation> all = participationRepository.findConfirmedByUserSince(userId, cutoff);

        // Filter out games with "ALL_LEVELS" skill band (case-insensitive)
        List<GameParticipation> qualifying = all.stream()
                .filter(gp -> {
                    String sb = gp.getGame().getSkillBand();
                    return sb != null && !sb.equalsIgnoreCase("all_levels");
                })
                .collect(Collectors.toList());

        if (qualifying.isEmpty()) {
            return emptyResponse("skill_trend", timeframe);
        }

        // Build cumulative-average data points per month
        Map<String, List<Double>> monthlyScores = new TreeMap<>();
        for (GameParticipation gp : qualifying) {
            String month = MONTH_FMT.format(gp.getGame().getStartTime());
            double score = gameSkillScore(gp.getGame());
            monthlyScores.computeIfAbsent(month, k -> new java.util.ArrayList<>()).add(score);
        }

        List<StatsDto.DataPoint> dataPoints = new java.util.ArrayList<>();
        double cumulativeSum = 0;
        int cumulativeCount = 0;
        for (Map.Entry<String, List<Double>> entry : monthlyScores.entrySet()) {
            for (double s : entry.getValue()) {
                cumulativeSum += s;
                cumulativeCount++;
            }
            dataPoints.add(StatsDto.DataPoint.builder()
                    .date(entry.getKey())
                    .value(round1(cumulativeSum / cumulativeCount))
                    .build());
        }

        double currentAvg = round1(cumulativeSum / cumulativeCount);

        return StatsDto.StatsResponse.builder()
                .metric("skill_trend")
                .value(currentAvg)
                .timeframe(timeframe)
                .dataPoints(dataPoints)
                .empty(false)
                .build();
    }

    /**
     * Compute a 0-100 skill score for a single game as the average of its
     * skill-band score and intensity-band score.
     */
    static double gameSkillScore(Game game) {
        double skill = skillBandScore(game.getSkillBand());
        double intensity = intensityBandScore(game.getIntensityBand());
        return (skill + intensity) / 2.0;
    }

    /** Map skill band string to a 0-100 numeric score. */
    static double skillBandScore(String band) {
        if (band == null) return 50.0; // default to middle if unknown
        return switch (band.toUpperCase()) {
            case "BEGINNER"     -> 0.0;
            case "INTERMEDIATE" -> 50.0;
            case "ADVANCED"     -> 100.0;
            default             -> 50.0;
        };
    }

    /** Map intensity band string to a 0-100 numeric score. */
    static double intensityBandScore(String band) {
        if (band == null) return 50.0; // default to middle if unknown
        return switch (band.toUpperCase()) {
            case "BEGINNER"    -> 0.0;
            case "CASUAL"      -> 50.0;
            case "COMPETITIVE" -> 100.0;
            default            -> 50.0;
        };
    }

    // -------------------------------------------------------------------------
    // Player Rating
    // -------------------------------------------------------------------------

    /**
     * Player rating evolution. Monthly data points show the cumulative average of
     * all ratings received up to that month.
     *
     * @param userId    the authenticated user's ID
     * @param timeframe "30", "90", or "all"
     * @return stats response; {@code empty=true} when no ratings exist
     */
    public StatsDto.StatsResponse getPlayerRatingStats(UUID userId, String timeframe) {
        Instant cutoff = parseCutoff(timeframe);
        List<PlayerRating> all = playerRatingRepository.findByRateeUserIdAndCreatedAtAfter(userId, cutoff);

        if (all.isEmpty()) {
            return emptyResponse("player_rating", timeframe);
        }

        Map<String, List<Integer>> monthlyScores = new TreeMap<>();
        for (PlayerRating pr : all) {
            String month = MONTH_FMT.format(pr.getCreatedAt());
            monthlyScores.computeIfAbsent(month, k -> new java.util.ArrayList<>()).add(pr.getRating());
        }

        List<StatsDto.DataPoint> dataPoints = new java.util.ArrayList<>();
        double cumulativeSum = 0;
        int cumulativeCount = 0;
        for (Map.Entry<String, List<Integer>> entry : monthlyScores.entrySet()) {
            for (int s : entry.getValue()) {
                cumulativeSum += s;
                cumulativeCount++;
            }
            dataPoints.add(StatsDto.DataPoint.builder()
                    .date(entry.getKey())
                    .value(round1(cumulativeSum / cumulativeCount))
                    .build());
        }

        double currentAvg = round1(cumulativeSum / cumulativeCount);
        long count = all.size();

        return StatsDto.StatsResponse.builder()
                .metric("player_rating")
                .value(currentAvg)
                .count(count)
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
