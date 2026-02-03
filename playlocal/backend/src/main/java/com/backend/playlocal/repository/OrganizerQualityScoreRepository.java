package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.OrganizerQualityScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for OrganizerQualityScore entity.
 * Implements: US-6.1 - Organizer Quality Score
 */
@Repository
public interface OrganizerQualityScoreRepository extends JpaRepository<OrganizerQualityScore, UUID> {

    /**
     * Find OQS by user ID.
     */
    Optional<OrganizerQualityScore> findByUserId(UUID userId);

    /**
     * Find all organizers with games hosted (for batch recalculation).
     */
    @Query("SELECT oqs FROM OrganizerQualityScore oqs WHERE oqs.totalGamesHosted > 0")
    List<OrganizerQualityScore> findAllWithGamesHosted();

    /**
     * Find top organizers by OQS score.
     */
    @Query("SELECT oqs FROM OrganizerQualityScore oqs " +
           "WHERE oqs.totalGamesHosted >= :minGames " +
           "ORDER BY oqs.oqsScore DESC")
    List<OrganizerQualityScore> findTopOrganizers(@Param("minGames") int minGames);

    /**
     * Check if user has an OQS record.
     */
    boolean existsByUserId(UUID userId);
}