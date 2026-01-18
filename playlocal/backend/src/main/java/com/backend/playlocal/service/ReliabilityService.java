package com.backend.playlocal.service;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.AttendanceDto;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.GameParticipation;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.GameRepository;
import com.backend.playlocal.repository.UserRepository;
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
 * Implements: US-3.1 (Attendance Confirmation), US-3.2 (Reliability Score)
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

    public ReliabilityService(GameRepository gameRepository,
            GameParticipationRepository participationRepository,
            UserRepository userRepository) {
        this.gameRepository = gameRepository;
        this.participationRepository = participationRepository;
        this.userRepository = userRepository;
    }

    /**
     * Confirm attendance for participants in a completed game.
     * Only the organizer can confirm attendance.
     * US-3.1: Organizer-confirmed attendance workflow
     */
    @Transactional
    public AttendanceDto.AttendanceResponse confirmAttendance(
            UUID gameId,
            UUID organizerId,
            AttendanceDto.ConfirmRequest request) {

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

        // Verify caller is the organizer
        if (!game.getCreatedBy().getUserId().equals(organizerId)) {
            throw new AccessDeniedException("Only the organizer can confirm attendance");
        }

        // Verify game is completed or in progress (past start time)
        if (game.getStatus() == Game.GameStatus.CANCELLED) {
            throw new IllegalStateException("Cannot confirm attendance for cancelled game");
        }

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
            if ("ATTENDED".equalsIgnoreCase(entry.getAttendanceStatus())) {
                status = GameParticipation.AttendanceStatus.ATTENDED;
                user.setAttendedCount(user.getAttendedCount() + 1);
                attendedCount++;
            } else if ("NO_SHOW".equalsIgnoreCase(entry.getAttendanceStatus())) {
                status = GameParticipation.AttendanceStatus.NO_SHOW;
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

            // Update participation record
            participation.setAttendanceStatus(status);
            participation.setAttendanceConfirmedAt(Instant.now());
            participation.setAttendanceConfirmedBy(game.getCreatedBy());
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

        return AttendanceDto.AttendanceResponse.builder()
                .gameId(gameId.toString())
                .attendedCount(attendedCount)
                .noShowCount(noShowCount)
                .updatedScores(updatedScores)
                .build();
    }

    /**
     * Get participants awaiting attendance confirmation.
     */
    public List<AttendanceDto.AttendanceEntry> getPendingAttendance(UUID gameId, UUID organizerId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

        if (!game.getCreatedBy().getUserId().equals(organizerId)) {
            throw new AccessDeniedException("Only the organizer can view attendance");
        }

        List<AttendanceDto.AttendanceEntry> pendingEntries = participationRepository
                .findForAttendanceConfirmation(gameId).stream()
                .filter(p -> p.getAttendanceStatus() != GameParticipation.AttendanceStatus.UNKNOWN)
                .map(p -> AttendanceDto.AttendanceEntry.builder()
                        .participationId(p.getParticipationId().toString())
                        .attendanceStatus("UNKNOWN")
                        .userId(p.getUser().getUserId().toString())
                        .sportId(p.getSport().getSportId().toString())
                        // TODO fetch actual position role - figure out the position role table
                        .requestedPositionRoleId("HARD CODED POSITION ROLE")
                        .build())
                .collect(Collectors.toList());
        return pendingEntries;
    }

    /**
     * Calculate reliability score based on attendance history.
     * Formula: (attended / total_games) * 100
     * 
     * US-3.2: Objective, rule-based reliability score
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
