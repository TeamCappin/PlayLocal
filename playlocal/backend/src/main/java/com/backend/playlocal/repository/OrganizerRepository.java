package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.Organizer;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

/**
 * Repository for Organizer entity.
 * Manages queries for organizer profiles and onboarding state.
 */
@Repository
public interface OrganizerRepository extends JpaRepository<Organizer, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Organizer o WHERE o.organizerId = :organizerId")
    Optional<Organizer> findByIdWithLock(@Param("organizerId") UUID organizerId);

    /**
     * Find organizer by user ID.
     */
    Optional<Organizer> findByUser_UserId(UUID userId);

        /**
         * Find organizer profile for a game's organizer.
         */
        @Query("SELECT o FROM Organizer o WHERE o.user.userId = (" +
            "SELECT g.createdBy.userId FROM Game g WHERE g.gameId = :gameId)")
        Optional<Organizer> findByGameId(@Param("gameId") UUID gameId);

    /**
     * Resolve organizer profiles for a batch of user IDs.
     */
    @Query("SELECT o FROM Organizer o WHERE o.user.userId IN :userIds")
    List<Organizer> findByUser_UserIdIn(@Param("userIds") List<UUID> userIds);

    /**
     * Find organizer by status.
     */
    @Query("SELECT o FROM Organizer o WHERE o.status = :status ORDER BY o.createdAt DESC")
    java.util.List<Organizer> findByStatus(@Param("status") Organizer.OrganizerStatus status);

    /**
     * Count provisional organizers (games completed < 2).
     */
    @Query("SELECT COUNT(o) FROM Organizer o WHERE o.status = 'PROVISIONAL' AND o.provisionalGamesCompleted < 2")
    long countProvisionalOrganizers();

    /**
     * Find organizers who completed onboarding checklist.
     */
    @Query("SELECT o FROM Organizer o WHERE o.organizerAddendumAcceptedAt IS NOT NULL AND o.phoneVerified = TRUE AND o.profilePictureVerified = TRUE ORDER BY o.onboardingCompletedAt DESC")
    java.util.List<Organizer> findOnboardingCompleted();
}
