package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.Organizer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Organizer entity.
 * Manages queries for organizer profiles and onboarding state.
 */
@Repository
public interface OrganizerRepository extends JpaRepository<Organizer, UUID> {

    /**
     * Find organizer by user ID.
     */
    Optional<Organizer> findByUser_UserId(UUID userId);

    /**
     * Find organizer by status.
     */
    @Query("SELECT o FROM Organizer o WHERE o.status = :status ORDER BY o.createdAt DESC")
    java.util.List<Organizer> findByStatus(Organizer.OrganizerStatus status);

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
