package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.GameParticipation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GameParticipationRepository extends JpaRepository<GameParticipation, UUID> {

    /**
     * Check if user has any participation in game (including waitlisted/cancelled).
     */
    @Query("SELECT gp FROM GameParticipation gp WHERE gp.game.gameId = :gameId AND gp.user.userId = :userId")
    Optional<GameParticipation> findByGameAndUser(UUID gameId, UUID userId);

    /**
     * Count confirmed participants (not waitlisted, not cancelled).
     */
    @Query("SELECT COUNT(gp) FROM GameParticipation gp WHERE gp.game.gameId = :gameId AND gp.joinStatus = 'CONFIRMED'")
    int countConfirmedParticipants(UUID gameId);

    /**
     * Get all confirmed participants for a game.
     */
    @Query("SELECT gp FROM GameParticipation gp WHERE gp.game.gameId = :gameId AND gp.joinStatus = 'CONFIRMED' ORDER BY gp.joinedAt ASC")
    List<GameParticipation> findConfirmedByGame(UUID gameId);

    /**
     * Get all waitlisted participants ordered by position.
     */
    @Query("SELECT gp FROM GameParticipation gp WHERE gp.game.gameId = :gameId AND gp.joinStatus = 'WAITLISTED' ORDER BY gp.waitlistPosition ASC")
    List<GameParticipation> findWaitlistedByGame(UUID gameId);

    /**
     * Get next waitlist position for a game.
     */
    @Query("SELECT COALESCE(MAX(gp.waitlistPosition), 0) + 1 FROM GameParticipation gp WHERE gp.game.gameId = :gameId AND gp.joinStatus = 'WAITLISTED'")
    int getNextWaitlistPosition(UUID gameId);

    /**
     * Find first in waitlist for promotion.
     */
    @Query("SELECT gp FROM GameParticipation gp WHERE gp.game.gameId = :gameId AND gp.joinStatus = 'WAITLISTED' ORDER BY gp.waitlistPosition ASC")
    List<GameParticipation> findFirstWaitlisted(UUID gameId);

    /**
     * Get all participations for attendance confirmation.
     */
    @Query("SELECT gp FROM GameParticipation gp WHERE gp.game.gameId = :gameId AND gp.joinStatus = 'CONFIRMED'")
    List<GameParticipation> findForAttendanceConfirmation(UUID gameId);

    /**
     * Decrease waitlist positions after a user leaves.
     */
    @Modifying
    @Query("UPDATE GameParticipation gp SET gp.waitlistPosition = gp.waitlistPosition - 1 " +
            "WHERE gp.game.gameId = :gameId AND gp.joinStatus = 'WAITLISTED' AND gp.waitlistPosition > :position")
    void decrementWaitlistPositionsAfter(UUID gameId, int position);

    /**
     * Find participations by user.
     */
    @Query("SELECT gp FROM GameParticipation gp WHERE gp.user.userId = :userId ORDER BY gp.joinedAt DESC")
    List<GameParticipation> findByUser(UUID userId);

    /**
     * Find all participations for a specific game.
     * Used for OQS repeat player calculation (US-6.1).
     */
    @Query("SELECT gp FROM GameParticipation gp WHERE gp.game.gameId = :gameId")
    List<GameParticipation> findByGameId(@Param("gameId") UUID gameId);

    /**
     * US-32: (userId, gameId) for completed games in the last 60 days where user attended.
     * Used to compute co-play count between viewer and targets.
     */
    @Query("SELECT gp.user.userId, gp.game.gameId FROM GameParticipation gp WHERE gp.game.status = :completedStatus " +
            "AND gp.attendanceStatus = 'ATTENDED' AND gp.game.startTime >= :since AND gp.user.userId IN :userIds")
    List<Object[]> findAttendedCompletedGamePairsSince(@Param("userIds") List<UUID> userIds, @Param("since") Instant since, @Param("completedStatus") Game.GameStatus completedStatus);

    /**
     * Stats US-7.6: Find confirmed participations for a user since a cutoff date,
     * with game eagerly fetched for access to startTime without lazy-load issues.
     * Pass {@code Instant.EPOCH} as cutoff for all-time.
     */
    @Query("SELECT gp FROM GameParticipation gp " +
            "JOIN FETCH gp.game g " +
            "WHERE gp.user.userId = :userId " +
            "AND gp.joinStatus = 'CONFIRMED' " +
            "AND g.startTime >= :cutoff " +
            "ORDER BY g.startTime ASC")
    List<GameParticipation> findConfirmedByUserSince(
            @Param("userId") UUID userId,
            @Param("cutoff") Instant cutoff);

    /**
     * US-7.15: Find all future participations for a user (for account deletion).
     * Used to remove user from all upcoming games when deactivating/deleting account.
     */
    @Query("SELECT gp FROM GameParticipation gp " +
            "JOIN FETCH gp.game g " +
            "WHERE gp.user.userId = :userId " +
            "AND g.startTime >= :cutoff " +
            "AND gp.leftAt IS NULL")
    List<GameParticipation> findByUserIdAndGameStartTimeAfter(
            @Param("userId") UUID userId,
            @Param("cutoff") Instant cutoff);
}
