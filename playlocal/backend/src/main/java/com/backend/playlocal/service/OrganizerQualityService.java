package com.backend.playlocal.service;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.OrganizerQualityDto;
import com.backend.playlocal.model.entity.*;
import com.backend.playlocal.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for Organizer Quality Score (OQS).
 * Implements: US-6.1 - Organizer Quality Score
 * 
 * OQS is calculated from objective metrics:
 * - Game completion rate (weight: 60%): % of games completed vs cancelled
 * - Repeat player rate (weight: 40%): % of players who join organizer's games more than once
 * 
 * Formula: OQS = (completion_rate * 0.6) + (repeat_player_rate * 0.4)
 */
@Service
public class OrganizerQualityService {

    // Weights for OQS calculation
    private static final float COMPLETION_RATE_WEIGHT = 0.6f;
    private static final float REPEAT_PLAYER_RATE_WEIGHT = 0.4f;

    private final OrganizerQualityScoreRepository oqsRepository;
    private final OrganizerScoreHistoryRepository historyRepository;
    private final GameRepository gameRepository;
    private final GameParticipationRepository participationRepository;
    private final UserRepository userRepository;

    public OrganizerQualityService(
            OrganizerQualityScoreRepository oqsRepository,
            OrganizerScoreHistoryRepository historyRepository,
            GameRepository gameRepository,
            GameParticipationRepository participationRepository,
            UserRepository userRepository) {
        this.oqsRepository = oqsRepository;
        this.historyRepository = historyRepository;
        this.gameRepository = gameRepository;
        this.participationRepository = participationRepository;
        this.userRepository = userRepository;
    }

    /**
     * Get OQS for a user. Creates initial OQS if not exists.
     */
    @Transactional(readOnly = true)
    public OrganizerQualityDto.OqsResponse getOqs(UUID userId) {
        User user = userRepository.findActiveById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        OrganizerQualityScore oqs = oqsRepository.findByUserId(userId)
                .orElse(createDefaultOqs(user));

        return toOqsResponse(oqs, user);
    }

    /**
     * Get OQS summary (simplified for display in game cards).
     */
    @Transactional(readOnly = true)
    public OrganizerQualityDto.OqsSummary getOqsSummary(UUID userId) {
        OrganizerQualityScore oqs = oqsRepository.findByUserId(userId)
                .orElse(null);

        if (oqs == null) {
            return OrganizerQualityDto.OqsSummary.builder()
                    .userId(userId.toString())
                    .oqsScore(100.0f)
                    .confidenceLevel("LOW")
                    .totalGamesHosted(0)
                    .build();
        }

        return OrganizerQualityDto.OqsSummary.builder()
                .userId(userId.toString())
                .oqsScore(oqs.getOqsScore())
                .confidenceLevel(oqs.getConfidenceLevel().name())
                .totalGamesHosted(oqs.getTotalGamesHosted())
                .build();
    }

    /**
     * Get OQS info card with plain language explanations.
     */
    @Transactional(readOnly = true)
    public OrganizerQualityDto.OqsInfoCard getOqsInfoCard(UUID userId) {
        OrganizerQualityScore oqs = oqsRepository.findByUserId(userId)
                .orElse(null);

        if (oqs == null || oqs.getTotalGamesHosted() == 0) {
            return buildNewOrganizerInfoCard(userId);
        }

        return buildInfoCard(oqs);
    }

    /**
     * Calculate/recalculate OQS for an organizer.
     * Called on game completion, cancellation, or when attendance is confirmed.
     */
    @Transactional
    public OrganizerQualityDto.OqsResponse calculateOqs(UUID organizerId, OrganizerScoreHistory.OqsChangeReason reason, Game triggeringGame) {
        User organizer = userRepository.findActiveById(organizerId)
                .orElseThrow(() -> new ResourceNotFoundException("Organizer not found"));

        OrganizerQualityScore oqs = oqsRepository.findByUserId(organizerId)
                .orElseGet(() -> initializeOqs(organizer));

        // Store previous values for audit log
        float previousOqs = oqs.getOqsScore();
        float previousCompletionRate = oqs.getGameCompletionRate();
        float previousRepeatRate = oqs.getRepeatPlayerRate();

        // Calculate new metrics
        calculateMetrics(oqs, organizerId);

        // Calculate new OQS score
        float newOqs = calculateOqsScore(oqs.getGameCompletionRate(), oqs.getRepeatPlayerRate());
        oqs.setOqsScore(newOqs);
        oqs.setLastCalculatedAt(Instant.now());

        oqsRepository.save(oqs);

        // Log the change if there was a meaningful difference
        float delta = newOqs - previousOqs;
        if (Math.abs(delta) >= 0.01f || reason == OrganizerScoreHistory.OqsChangeReason.INITIAL_CALCULATION) {
            logOqsChange(oqs, triggeringGame, previousOqs, newOqs, delta,
                    previousCompletionRate, oqs.getGameCompletionRate(),
                    previousRepeatRate, oqs.getRepeatPlayerRate(),
                    reason, buildChangeDescription(reason, triggeringGame),
                    organizer);
        }

        return toOqsResponse(oqs, organizer);
    }

    /**
     * Recalculate OQS when a game is completed.
     */
    @Transactional
    public void onGameCompleted(UUID gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

        UUID organizerId = game.getCreatedBy().getUserId();
        calculateOqs(organizerId, OrganizerScoreHistory.OqsChangeReason.GAME_COMPLETED, game);
    }

    /**
     * Recalculate OQS when a game is cancelled.
     */
    @Transactional
    public void onGameCancelled(UUID gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

        UUID organizerId = game.getCreatedBy().getUserId();
        calculateOqs(organizerId, OrganizerScoreHistory.OqsChangeReason.GAME_CANCELLED, game);
    }

    /**
     * Recalculate OQS when attendance is confirmed (updates repeat player stats).
     */
    @Transactional
    public void onAttendanceConfirmed(UUID gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

        UUID organizerId = game.getCreatedBy().getUserId();
        calculateOqs(organizerId, OrganizerScoreHistory.OqsChangeReason.PLAYER_RETURNED, game);
    }

    /**
     * Get OQS history for an organizer.
     */
    @Transactional(readOnly = true)
    public OrganizerQualityDto.OqsHistoryResponse getOqsHistory(UUID organizerId, int page, int size) {
        User organizer = userRepository.findActiveById(organizerId)
                .orElseThrow(() -> new ResourceNotFoundException("Organizer not found"));

        OrganizerQualityScore oqs = oqsRepository.findByUserId(organizerId).orElse(null);
        float currentOqs = oqs != null ? oqs.getOqsScore() : 100.0f;

        Page<OrganizerScoreHistory> historyPage = historyRepository
                .findByOrganizerIdOrderByCreatedAtDesc(organizerId, PageRequest.of(page, size));

        List<OrganizerQualityDto.OqsHistoryEntry> entries = historyPage.getContent().stream()
                .map(this::toHistoryEntry)
                .collect(Collectors.toList());

        return OrganizerQualityDto.OqsHistoryResponse.builder()
                .organizerId(organizerId.toString())
                .displayName(organizer.getDisplayName())
                .currentOqs(currentOqs)
                .history(entries)
                .totalEntries(historyPage.getTotalElements())
                .currentPage(page)
                .totalPages(historyPage.getTotalPages())
                .build();
    }

    // ==================== Private Helper Methods ====================

    private void calculateMetrics(OrganizerQualityScore oqs, UUID organizerId) {
        // Get all games hosted by this organizer
        List<Game> hostedGames = gameRepository.findByOrganizer(organizerId);

        int totalGames = 0;
        int completedGames = 0;
        int cancelledGames = 0;

        for (Game game : hostedGames) {
            // Only count games that have a final status
            if (game.getStatus() == Game.GameStatus.COMPLETED) {
                totalGames++;
                completedGames++;
            } else if (game.getStatus() == Game.GameStatus.CANCELLED) {
                totalGames++;
                cancelledGames++;
            }
            // SCHEDULED, IN_PROGRESS, ARCHIVED games are not counted yet
        }

        oqs.setTotalGamesHosted(totalGames);
        oqs.setCompletedGames(completedGames);
        oqs.setCancelledGames(cancelledGames);

        // Calculate game completion rate
        float completionRate = totalGames > 0 
                ? ((float) completedGames / totalGames) * 100.0f 
                : 100.0f;
        oqs.setGameCompletionRate(completionRate);

        // Calculate repeat player rate
        calculateRepeatPlayerRate(oqs, organizerId, hostedGames);
    }

    private void calculateRepeatPlayerRate(OrganizerQualityScore oqs, UUID organizerId, List<Game> hostedGames) {
        if (hostedGames.isEmpty()) {
            oqs.setTotalUniquePlayers(0);
            oqs.setRepeatPlayers(0);
            oqs.setRepeatPlayerRate(0.0f);
            return;
        }

        // Get all game IDs for this organizer
        List<UUID> gameIds = hostedGames.stream()
                .filter(g -> g.getStatus() == Game.GameStatus.COMPLETED)
                .map(Game::getGameId)
                .collect(Collectors.toList());

        if (gameIds.isEmpty()) {
            oqs.setTotalUniquePlayers(0);
            oqs.setRepeatPlayers(0);
            oqs.setRepeatPlayerRate(0.0f);
            return;
        }

        // Count participations per player across all organizer's completed games
        // A player is a "repeat player" if they've joined 2+ games by this organizer
        Map<UUID, Long> playerGameCounts = new HashMap<>();

        for (UUID gameId : gameIds) {
            List<GameParticipation> participations = participationRepository.findByGameId(gameId);
            for (GameParticipation p : participations) {
                // Only count confirmed attendees, exclude the organizer
                if (p.getJoinStatus() == GameParticipation.JoinStatus.CONFIRMED 
                        && p.getAttendanceStatus() == GameParticipation.AttendanceStatus.ATTENDED
                        && !p.getUser().getUserId().equals(organizerId)) {
                    UUID playerId = p.getUser().getUserId();
                    playerGameCounts.merge(playerId, 1L, Long::sum);
                }
            }
        }

        int totalUniquePlayers = playerGameCounts.size();
        int repeatPlayers = (int) playerGameCounts.values().stream()
                .filter(count -> count >= 2)
                .count();

        oqs.setTotalUniquePlayers(totalUniquePlayers);
        oqs.setRepeatPlayers(repeatPlayers);

        // Calculate repeat player rate
        float repeatRate = totalUniquePlayers > 0 
                ? ((float) repeatPlayers / totalUniquePlayers) * 100.0f 
                : 0.0f;
        oqs.setRepeatPlayerRate(repeatRate);
    }

    private float calculateOqsScore(float completionRate, float repeatPlayerRate) {
        // Weighted average: 60% completion rate + 40% repeat player rate
        return (completionRate * COMPLETION_RATE_WEIGHT) + (repeatPlayerRate * REPEAT_PLAYER_RATE_WEIGHT);
    }

    private OrganizerQualityScore initializeOqs(User user) {
        OrganizerQualityScore oqs = OrganizerQualityScore.builder()
                .userId(user.getUserId())
                .oqsScore(100.0f)
                .gameCompletionRate(100.0f)
                .repeatPlayerRate(0.0f)
                .totalGamesHosted(0)
                .completedGames(0)
                .cancelledGames(0)
                .totalUniquePlayers(0)
                .repeatPlayers(0)
                .build();
        return oqsRepository.save(oqs);
    }

    private OrganizerQualityScore createDefaultOqs(User user) {
        return OrganizerQualityScore.builder()
                .userId(user.getUserId())
                .oqsScore(100.0f)
                .gameCompletionRate(100.0f)
                .repeatPlayerRate(0.0f)
                .totalGamesHosted(0)
                .completedGames(0)
                .cancelledGames(0)
                .totalUniquePlayers(0)
                .repeatPlayers(0)
                .build();
    }

private void logOqsChange(OrganizerQualityScore oqs, Game game,
                              float previousOqs, float newOqs, float delta,
                              float previousCompletionRate, float newCompletionRate,
                              float previousRepeatRate, float newRepeatRate,
                              OrganizerScoreHistory.OqsChangeReason reason, String description,
                              User organizer) {
        OrganizerScoreHistory history = OrganizerScoreHistory.builder()
                .organizer(organizer)
                .game(game)
                .previousOqs(previousOqs)
                .newOqs(newOqs)
                .delta(delta)
                .previousCompletionRate(previousCompletionRate)
                .newCompletionRate(newCompletionRate)
                .previousRepeatRate(previousRepeatRate)
                .newRepeatRate(newRepeatRate)
                .reason(reason)
                .description(description)
                .createdAt(Instant.now())
                .build();
        historyRepository.save(history);
    }

    private String buildChangeDescription(OrganizerScoreHistory.OqsChangeReason reason, Game game) {
        String gameTitle = game != null ? game.getTitle() : "Unknown game";
        return switch (reason) {
            case GAME_COMPLETED -> "Game completed: " + gameTitle;
            case GAME_CANCELLED -> "Game cancelled: " + gameTitle;
            case PLAYER_RETURNED -> "Attendance confirmed for: " + gameTitle;
            case INITIAL_CALCULATION -> "Initial OQS calculation";
            case MANUAL_ADJUSTMENT -> "Manual adjustment by admin";
            case RECALCULATION -> "Periodic recalculation";
        };
    }

    private OrganizerQualityDto.OqsResponse toOqsResponse(OrganizerQualityScore oqs, User user) {
        return OrganizerQualityDto.OqsResponse.builder()
                .userId(oqs.getUserId().toString())
                .displayName(user.getDisplayName())
                .oqsScore(oqs.getOqsScore())
                .gameCompletionRate(oqs.getGameCompletionRate())
                .repeatPlayerRate(oqs.getRepeatPlayerRate())
                .totalGamesHosted(oqs.getTotalGamesHosted())
                .completedGames(oqs.getCompletedGames())
                .cancelledGames(oqs.getCancelledGames())
                .totalUniquePlayers(oqs.getTotalUniquePlayers())
                .repeatPlayers(oqs.getRepeatPlayers())
                .confidenceLevel(oqs.getConfidenceLevel().name())
                .confidenceDescription(getConfidenceDescription(oqs.getConfidenceLevel(), oqs.getTotalGamesHosted()))
                .lastCalculatedAt(oqs.getLastCalculatedAt() != null ? oqs.getLastCalculatedAt().toString() : null)
                .build();
    }

    private OrganizerQualityDto.OqsHistoryEntry toHistoryEntry(OrganizerScoreHistory history) {
        return OrganizerQualityDto.OqsHistoryEntry.builder()
                .historyId(history.getHistoryId().toString())
                .organizerId(history.getOrganizer().getUserId().toString())
                .gameId(history.getGame() != null ? history.getGame().getGameId().toString() : null)
                .gameTitle(history.getGame() != null ? history.getGame().getTitle() : null)
                .previousOqs(history.getPreviousOqs())
                .newOqs(history.getNewOqs())
                .delta(history.getDelta())
                .previousCompletionRate(history.getPreviousCompletionRate())
                .newCompletionRate(history.getNewCompletionRate())
                .previousRepeatRate(history.getPreviousRepeatRate())
                .newRepeatRate(history.getNewRepeatRate())
                .reason(history.getReason().name())
                .description(history.getDescription())
                .createdAt(history.getCreatedAt().toString())
                .build();
    }

    private OrganizerQualityDto.OqsInfoCard buildNewOrganizerInfoCard(UUID userId) {
        return OrganizerQualityDto.OqsInfoCard.builder()
                .oqsScore(100.0f)
                .overallDescription("New organizer - no games hosted yet")
                .gameCompletionRate(100.0f)
                .completionRateDescription("No games to measure yet")
                .completedGames(0)
                .totalGames(0)
                .repeatPlayerRate(0.0f)
                .repeatRateDescription("No returning players yet")
                .repeatPlayers(0)
                .totalUniquePlayers(0)
                .confidenceLevel("LOW")
                .confidenceDescription("Host at least 3 games to build confidence")
                .gamesForNextLevel(3)
                .build();
    }

    private OrganizerQualityDto.OqsInfoCard buildInfoCard(OrganizerQualityScore oqs) {
        OrganizerQualityScore.ConfidenceLevel confidence = oqs.getConfidenceLevel();
        int gamesForNext = getGamesForNextLevel(confidence, oqs.getTotalGamesHosted());

        return OrganizerQualityDto.OqsInfoCard.builder()
                .oqsScore(oqs.getOqsScore())
                .overallDescription(getOverallDescription(oqs.getOqsScore()))
                .gameCompletionRate(oqs.getGameCompletionRate())
                .completionRateDescription(getCompletionRateDescription(oqs))
                .completedGames(oqs.getCompletedGames())
                .totalGames(oqs.getTotalGamesHosted())
                .repeatPlayerRate(oqs.getRepeatPlayerRate())
                .repeatRateDescription(getRepeatRateDescription(oqs))
                .repeatPlayers(oqs.getRepeatPlayers())
                .totalUniquePlayers(oqs.getTotalUniquePlayers())
                .confidenceLevel(confidence.name())
                .confidenceDescription(getConfidenceDescription(confidence, oqs.getTotalGamesHosted()))
                .gamesForNextLevel(gamesForNext)
                .build();
    }

    private String getOverallDescription(float oqsScore) {
        if (oqsScore >= 90) return "Excellent organizer with a strong track record";
        if (oqsScore >= 75) return "Good organizer with reliable game history";
        if (oqsScore >= 60) return "Average organizer, some room for improvement";
        if (oqsScore >= 40) return "Below average - consider checking recent game history";
        return "Low score - proceed with caution";
    }

    private String getCompletionRateDescription(OrganizerQualityScore oqs) {
        float rate = oqs.getGameCompletionRate();
        int completed = oqs.getCompletedGames();
        int total = oqs.getTotalGamesHosted();

        if (total == 0) return "No games to measure yet";
        if (rate >= 95) return String.format("Excellent! %d of %d games completed successfully", completed, total);
        if (rate >= 80) return String.format("Good reliability: %d of %d games completed", completed, total);
        if (rate >= 60) return String.format("Some cancellations: %d of %d games completed", completed, total);
        return String.format("High cancellation rate: only %d of %d games completed", completed, total);
    }

    private String getRepeatRateDescription(OrganizerQualityScore oqs) {
        float rate = oqs.getRepeatPlayerRate();
        int repeat = oqs.getRepeatPlayers();
        int total = oqs.getTotalUniquePlayers();

        if (total == 0) return "No players yet";
        if (total < 5) return String.format("Building player base: %d unique players so far", total);
        if (rate >= 50) return String.format("Great retention! %d of %d players have returned", repeat, total);
        if (rate >= 25) return String.format("Good retention: %d of %d players came back", repeat, total);
        if (rate > 0) return String.format("Building loyalty: %d of %d players returned", repeat, total);
        return "No returning players yet - keep hosting great games!";
    }

    private String getConfidenceDescription(OrganizerQualityScore.ConfidenceLevel level, int gamesHosted) {
        return switch (level) {
            case LOW -> String.format("Based on %d game%s - score may change significantly", 
                    gamesHosted, gamesHosted == 1 ? "" : "s");
            case MEDIUM -> String.format("Based on %d games - score is becoming more reliable", gamesHosted);
            case HIGH -> String.format("Based on %d games - score is highly reliable", gamesHosted);
        };
    }

    private int getGamesForNextLevel(OrganizerQualityScore.ConfidenceLevel current, int gamesHosted) {
        return switch (current) {
            case LOW -> 3 - gamesHosted;
            case MEDIUM -> 10 - gamesHosted;
            case HIGH -> 0; // Already at highest level
        };
    }
}
