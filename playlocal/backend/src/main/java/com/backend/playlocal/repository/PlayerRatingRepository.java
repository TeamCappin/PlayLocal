package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.PlayerRating;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA Repository for managing PlayerRating entities.
 * Includes custom queries for retrieving aggregate rating metrics.
 */
@Repository
public interface PlayerRatingRepository extends JpaRepository<PlayerRating, UUID> {

    /**
     * Checks if a player has already rated another player for a specific game.
     *
     * @param gameId The UUID of the game.
     * @param raterId The UUID of the user giving the rating.
     * @param rateeId The UUID of the user receiving the rating.
     * @return true if the rating exists, false otherwise.
     */
    boolean existsByGameGameIdAndRaterUserIdAndRateeUserId(UUID gameId, UUID raterId, UUID rateeId);

    /**
     * Retrieves all ratings received by a specific user.
     *
     * @param rateeId The JVM user UUID.
     * @return A list of PlayerRatings for the specified user.
     */
    List<PlayerRating> findByRateeUserId(UUID rateeId);

    /**
     * Retrieves all ratings given by a specific user.
     *
     * @param raterId The JVM user UUID.
     * @return A list of PlayerRatings made by the specified user.
     */
    List<PlayerRating> findByRaterUserId(UUID raterId);
    
    /**
     * Calculates the average star rating for a specific player.
     *
     * @param rateeId The user UUID of the ratee.
     * @return A Double representation of the average rating, or null if no ratings exist.
     */
    @Query("SELECT AVG(pr.rating) FROM PlayerRating pr WHERE pr.ratee.userId = :rateeId")
    Double getAverageRatingForUser(@Param("rateeId") UUID rateeId);

    /**
     * Calculates the total count of ratings the user has received.
     *
     * @param rateeId The user UUID of the ratee.
     * @return A Long count of all received ratings.
     */
    @Query("SELECT COUNT(pr) FROM PlayerRating pr WHERE pr.ratee.userId = :rateeId")
    Long getRatingCountForUser(@Param("rateeId") UUID rateeId);
}
