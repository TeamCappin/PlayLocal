package com.backend.playlocal.service;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.AttendanceDto;
import com.backend.playlocal.model.dto.ScoreHistoryDto;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.GameParticipation;
import com.backend.playlocal.model.entity.ScoreHistory;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.GameRepository;
import com.backend.playlocal.repository.ScoreHistoryRepository;
import com.backend.playlocal.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for the Core Reliability Loop.
 * Implements: US-2.6 (Attendance Confirmation), US-2.7 (Reliability Score +
 * History)
 * 
 * The reliability score is calculated as:
 * reliability_score = (attended_count / games_count) * 100
 * 
 * Where games_count = attended_count + no_show_count
 */
@Service
public class ReliabilityService {

    private final GameRepository gameRepository;
    private final GameParticipationRepository participationRepository;
    private final UserRepository userRepository;
    private final ScoreHistoryRepository scoreHistoryRepository;
    private final OrganizerQualityService oqsService;
    private final OrganizerCompatibilityLayer organizerCompatibilityLayer;

    public ReliabilityService(GameRepository gameRepository,
            GameParticipationRepository participationRepository,
            UserRepository userRepository,
            ScoreHistoryRepository scoreHistoryRepository,
            OrganizerQualityService oqsService,
            OrganizerCompatibilityLayer organizerCompatibilityLayer) {
        this.gameRepository = gameRepository;
        this.participationRepository = participationRepository;
        this.userRepository = userRepository;
        this.scoreHistoryRepository = scoreHistoryRepository;
        this.oqsService = oqsService;
        this.organizerCompatibilityLayer = organizerCompatibilityLayer;
    }

    /**
     * Confirm attendance for participants in a completed game.
     * Only the organizer can confirm attendance.
     * US-2.6: Organizer-confirmed attendance workflow
     * US-2.7: Score history is logged for each change
     */
    @Transactional
    public AttendanceDto.AttendanceResponse confirmAttendance(
            UUID gameId,
            UUID requesterUserId,
            AttendanceDto.ConfirmRequest request) {

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

        UUID requesterOrganizerId = organizerCompatibilityLayer.requireOrganizerIdByUserId(requesterUserId);
        UUID gameOrganizerId = organizerCompatibilityLayer.requireOrganizerIdByUserId(game.getCreatedBy().getUserId());

        // Verify caller is the organizer
        if (!gameOrganizerId.equals(requesterOrganizerId)) {
            throw new AccessDeniedException("Only the organizer can confirm attendance");
        }

        // Verify game is completed or in progress (past start time)
        if (game.getStatus() == Game.GameStatus.CANCELLED) {
            throw new IllegalStateException("Cannot confirm attendance for cancelled game");
        }
        if (game.getStatus() == Game.GameStatus.ARCHIVED) {
            throw new IllegalStateException("Cannot confirm attendance for archived game");
        }

        User organizer = game.getCreatedBy();

        // Get all confirmed participants for this game
        List<GameParticipation> participants = participationRepository.findForAttendanceConfirmation(gameId);
        Map<UUID, GameParticipation> participationMap = participants.stream()
                .collect(Collectors.toMap(p -> p.getParticipationId(), p -> p));

        List<AttendanceDto.UpdatedScore> updatedScores = new ArrayList<>();
        int attendedCount = 0;
        int noShowCount = 0;

        // Process each attendance entry
        for (AttendanceDto.AttendanceEntry entry : request.getAttendances()) {
            UUID participationId = UUID.fromString(entry.getParticipationId());
            GameParticipation participation = participationMap.get(participationId);

            if (participation == null) {
                continue; // Skip invalid participation IDs
            }

            // Skip if already confirmed (idempotent)
            if (participation.getAttendanceStatus() != GameParticipation.AttendanceStatus.UNKNOWN) {
                continue;
            }

            User user = participation.getUser();
            float previousScore = user.getReliabilityScore();

            // Determine attendance status
            GameParticipation.AttendanceStatus status;
            ScoreHistory.ScoreChangeReason reason;
            String description;

            if ("ATTENDED".equalsIgnoreCase(entry.getAttendanceStatus())) {
                status = GameParticipation.AttendanceStatus.ATTENDED;
                reason = ScoreHistory.ScoreChangeReason.ATTENDANCE;
                description = "Attended game: " + game.getTitle();
                user.setAttendedCount(user.getAttendedCount() + 1);
                attendedCount++;
            } else if ("NO_SHOW".equalsIgnoreCase(entry.getAttendanceStatus())) {
                status = GameParticipation.AttendanceStatus.NO_SHOW;
                reason = ScoreHistory.ScoreChangeReason.NO_SHOW;
                description = "No-show for game: " + game.getTitle();
                user.setNoShowCount(user.getNoShowCount() + 1);
                noShowCount++;
            } else {
                continue; // Invalid status
            }

            user.setGamesCount(user.getGamesCount() + 1);

            // Calculate new reliability score
            float newScore = calculateReliabilityScore(user.getAttendedCount(), user.getGamesCount());
            user.setReliabilityScore(newScore);
            userRepository.save(user);

            // US 2.7: Log score change to history
            float delta = newScore - previousScore;
            logScoreChange(user, game, previousScore, newScore, delta, reason, description, organizer);

            // Update participation record
            participation.setAttendanceStatus(status);
            participation.setAttendanceConfirmedAt(Instant.now());
            participation.setAttendanceConfirmedBy(organizer);
            participationRepository.save(participation);

            updatedScores.add(AttendanceDto.UpdatedScore.builder()
                    .userId(user.getUserId().toString())
                    .displayName(user.getDisplayName())
                    .previousScore(previousScore)
                    .newScore(newScore)
                    .attendanceStatus(status.name())
                    .build());
        }

        // Mark game as completed if not already
        if (game.getStatus() == Game.GameStatus.SCHEDULED || game.getStatus() == Game.GameStatus.IN_PROGRESS) {
            game.setStatus(Game.GameStatus.COMPLETED);
            gameRepository.save(game);
        }

        // US-6.1: Recalculate OQS for the organizer after attendance confirmation
        oqsService.onAttendanceConfirmed(gameId);

        return AttendanceDto.AttendanceResponse.builder()
                .gameId(gameId.toString())
                .attendedCount(attendedCount)
                .noShowCount(noShowCount)
                .updatedScores(updatedScores)
                .build();
    }

    /**
     * Log a score change to the history table.
     * US 2.7: Each score change is written to a score history log
     */
    private void logScoreChange(User user, Game game, float previousScore, float newScore,
            float delta, ScoreHistory.ScoreChangeReason reason, String description, User createdBy) {
        ScoreHistory history = ScoreHistory.builder()
                .user(user)
                .game(game)
                .previousScore(previousScore)
                .newScore(newScore)
                .delta(delta)
                .reason(reason)
                .description(description)
                .createdAt(Instant.now())
                .createdBy(createdBy)
                .build();
        scoreHistoryRepository.save(history);
    }

    /**
     * Get score history for a user.
     * US 2.7: Users can view a simple "Score History" list on their profile (most
     * recent first)
     */
    public ScoreHistoryDto.ScoreHistoryResponse getScoreHistory(UUID userId, int page, int size) {
        User user = userRepository.findActiveById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Page<ScoreHistory> historyPage = scoreHistoryRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));

        List<ScoreHistoryDto.ScoreHistoryEntry> entries = historyPage.getContent().stream()
                .map(this::toHistoryEntry)
                .collect(Collectors.toList());

        return ScoreHistoryDto.ScoreHistoryResponse.builder()
                .userId(userId.toString())
                .displayName(user.getDisplayName())
                .currentScore(user.getReliabilityScore())
                .history(entries)
                .totalEntries(historyPage.getTotalElements())
                .currentPage(page)
                .totalPages(historyPage.getTotalPages())
                .build();
    }

    /**
     * Get score summary for a user.
     */
    public ScoreHistoryDto.ScoreSummary getScoreSummary(UUID userId) {
        User user = userRepository.findActiveById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        float attendanceRate = user.getGamesCount() > 0
                ? ((float) user.getAttendedCount() / user.getGamesCount()) * 100
                : 100.0f;

        return ScoreHistoryDto.ScoreSummary.builder()
                .userId(userId.toString())
                .currentScore(user.getReliabilityScore())
                .attendedCount(user.getAttendedCount())
                .noShowCount(user.getNoShowCount())
                .gamesCount(user.getGamesCount())
                .attendanceRate(attendanceRate)
                .build();
    }

    private ScoreHistoryDto.ScoreHistoryEntry toHistoryEntry(ScoreHistory history) {
        return ScoreHistoryDto.ScoreHistoryEntry.builder()
                .scoreHistoryId(history.getScoreHistoryId().toString())
                .userId(history.getUser().getUserId().toString())
                .gameId(history.getGame() != null ? history.getGame().getGameId().toString() : null)
                .gameTitle(history.getGame() != null ? history.getGame().getTitle() : null)
                .previousScore(history.getPreviousScore())
                .newScore(history.getNewScore())
                .delta(history.getDelta())
                .reason(history.getReason().name())
                .description(history.getDescription())
                .createdAt(history.getCreatedAt().toString())
                .createdByUserId(history.getCreatedBy() != null ? history.getCreatedBy().getUserId().toString() : null)
                .createdByDisplayName(history.getCreatedBy() != null ? history.getCreatedBy().getDisplayName() : null)
                .build();
    }

    /**
     * Get participants awaiting attendance confirmation. US-2.6
     */
    public List<AttendanceDto.AttendanceEntry> getPendingAttendance(UUID gameId, UUID requesterUserId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

        UUID requesterOrganizerId = organizerCompatibilityLayer.requireOrganizerIdByUserId(requesterUserId);
        UUID gameOrganizerId = organizerCompatibilityLayer.requireOrganizerIdByUserId(game.getCreatedBy().getUserId());

        if (!gameOrganizerId.equals(requesterOrganizerId)) {
            throw new AccessDeniedException("Only the organizer can view attendance");
        }
        if (game.getStatus() == Game.GameStatus.ARCHIVED) {
            throw new IllegalStateException("Archived games are read-only");
        }

        return participationRepository
                .findForAttendanceConfirmation(gameId).stream()
                .map(p -> AttendanceDto.AttendanceEntry.builder()
                        .participationId(p.getParticipationId().toString())
                        .attendanceStatus(p.getAttendanceStatus().name())
                        .userId(p.getUser().getUserId().toString())
                        .sportId(p.getSport().getSportId().toString())
                        // TODO fetch actual position role - figure out the position role table
                        .requestedPositionRoleId("HARD CODED POSITION ROLE")
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Calculate reliability score based on attendance history.
     * Formula: (attended / total_games) * 100
     * 
     * US-2.7: Objective, rule-based reliability score
     */
    private float calculateReliabilityScore(int attendedCount, int gamesCount) {
        if (gamesCount == 0) {
            return 100.0f; // New users start at 100%
        }
        return ((float) attendedCount / gamesCount) * 100.0f;
    }

    /**
     * Get user reliability info.
     */
    public ReliabilityInfo getUserReliability(UUID userId) {
        User user = userRepository.findActiveById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return new ReliabilityInfo(
                user.getReliabilityScore(),
                user.getAttendedCount(),
                user.getNoShowCount(),
                user.getGamesCount());
    }

    public record ReliabilityInfo(float score, int attended, int noShows, int total) {
    }
}
