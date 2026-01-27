package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.ScoreHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ScoreHistoryRepository extends JpaRepository<ScoreHistory, UUID> {

    /**
     * Find all score history entries for a user, ordered by most recent first.
     * US 2.7: Users can view a simple "Score History" list on their profile (most recent first)
     */
    @Query("SELECT sh FROM ScoreHistory sh WHERE sh.user.userId = :userId ORDER BY sh.createdAt DESC")
    List<ScoreHistory> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);

    /**
     * Find score history with pagination support.
     */
    @Query("SELECT sh FROM ScoreHistory sh WHERE sh.user.userId = :userId ORDER BY sh.createdAt DESC")
    Page<ScoreHistory> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId, Pageable pageable);

    /**
     * Find score history entries related to a specific game.
     */
    @Query("SELECT sh FROM ScoreHistory sh WHERE sh.game.gameId = :gameId ORDER BY sh.createdAt DESC")
    List<ScoreHistory> findByGameId(@Param("gameId") UUID gameId);

    /**
     * Count total score changes for a user.
     */
    @Query("SELECT COUNT(sh) FROM ScoreHistory sh WHERE sh.user.userId = :userId")
    long countByUserId(@Param("userId") UUID userId);
}
