package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.OrganizerScoreHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for OrganizerScoreHistory entity.
 * Implements: US-6.1 - OQS audit trail
 */
@Repository
public interface OrganizerScoreHistoryRepository extends JpaRepository<OrganizerScoreHistory, UUID> {

    /**
     * Find history entries for an organizer, ordered by creation date descending.
     */
    @Query("SELECT h FROM OrganizerScoreHistory h " +
           "WHERE h.organizer.organizerId = :organizerId " +
           "ORDER BY h.createdAt DESC")
    Page<OrganizerScoreHistory> findByOrganizerIdOrderByCreatedAtDesc(
            @Param("organizerId") UUID organizerId, 
            Pageable pageable);

    /**
     * Find recent history entries for an organizer.
     */
    @Query("SELECT h FROM OrganizerScoreHistory h " +
           "WHERE h.organizer.organizerId = :organizerId " +
           "ORDER BY h.createdAt DESC")
    List<OrganizerScoreHistory> findRecentByOrganizerId(
            @Param("organizerId") UUID organizerId, 
            Pageable pageable);

    /**
     * Find history entries for a specific game.
     */
    @Query("SELECT h FROM OrganizerScoreHistory h " +
           "WHERE h.game.gameId = :gameId " +
           "ORDER BY h.createdAt DESC")
    List<OrganizerScoreHistory> findByGameId(@Param("gameId") UUID gameId);

    /**
     * Count history entries for an organizer.
     */
       @Query("SELECT COUNT(h) FROM OrganizerScoreHistory h WHERE h.organizer.organizerId = :organizerId")
    long countByOrganizerId(@Param("organizerId") UUID organizerId);

    /**
     * Find by organizer ID (for backward compatibility).
     */
       @Query("SELECT h FROM OrganizerScoreHistory h WHERE h.organizer.organizerId = :organizerId")
    List<OrganizerScoreHistory> findByOrganizerId(@Param("organizerId") UUID organizerId);
}