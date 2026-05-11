package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GameRepository extends JpaRepository<Game, UUID> {

    @Query("SELECT g FROM Game g " +
            "LEFT JOIN FETCH g.sport " +
            "LEFT JOIN FETCH g.createdBy " +
            "LEFT JOIN FETCH g.location " +
            "WHERE g.gameId = :id")
    Optional<Game> findById(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT g FROM Game g " +
            "LEFT JOIN FETCH g.sport " +
            "LEFT JOIN FETCH g.createdBy " +
            "LEFT JOIN FETCH g.location " +
            "WHERE g.gameId = :gameId")
    Optional<Game> findByIdWithLock(UUID gameId);

    @Query("SELECT g FROM Game g " +
            "LEFT JOIN FETCH g.sport " +
            "LEFT JOIN FETCH g.createdBy " +
            "LEFT JOIN FETCH g.location " +
            "WHERE g.status = 'SCHEDULED' AND g.startTime > :now ORDER BY g.startTime ASC")
    List<Game> findUpcomingGames(Instant now);

    /**
     * Find upcoming games with optional filters (non-geospatial).
     * US-2.3: Discover Games
     */
    @Query("""
        SELECT g FROM Game g
        LEFT JOIN FETCH g.sport
        LEFT JOIN FETCH g.createdBy
        LEFT JOIN FETCH g.location
        WHERE g.status = 'SCHEDULED' AND g.startTime > :now
        AND (:sportName IS NULL OR :sportName = '' OR LOWER(g.sport.name) LIKE CONCAT('%', :sportName, '%'))
        AND (:skillLevel IS NULL OR LOWER(g.skillBand) = :skillLevel OR LOWER(g.skillBand) = 'all_levels')
        AND (:locationType IS NULL OR LOWER(g.indoorOutdoor) = :locationType)
        AND (:intensity IS NULL OR LOWER(g.intensityBand) = :intensity)
        ORDER BY g.startTime ASC
        """)
            List<Game> findUpcomingGamesWithFilters(
                    Instant now,
                    String sportName,     // already lowercase
                    String skillLevel,    // already lowercase
                    String locationType,  // already lowercase
                    String intensity      // already lowercase
            );


    /**
     * Find nearby games with geospatial filtering using Haversine formula.
     * US-2.3: Discover Games (Geospatial)
     * Distance is calculated in kilometers.
     * Returns game IDs ordered by distance, then by start time.
     */
    @Query(value = "SELECT g.game_id FROM game g " +
            "INNER JOIN location l ON g.location_id = l.location_id " +
            "INNER JOIN sport s ON g.sport_id = s.sport_id " +
            "WHERE g.status = 'SCHEDULED' " +
            "AND g.start_time > :now " +
            "AND l.latitude IS NOT NULL AND l.longitude IS NOT NULL " +
            "AND (:sportName IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :sportName, '%'))) " +
            "AND (:skillLevel IS NULL OR LOWER(g.skill_band) = :skillLevel OR LOWER(g.skill_band) = 'all_levels') " +
            "AND (:locationType IS NULL OR LOWER(g.indoor_outdoor) = :locationType) " +
            "AND (:intensity IS NULL OR LOWER(g.intensity_band) = :intensity) " +
            "AND (:radiusKm IS NULL OR (6371 * acos(LEAST(1.0, cos(radians(:userLat)) * cos(radians(l.latitude)) * " +
            "cos(radians(l.longitude) - radians(:userLon)) + sin(radians(:userLat)) * sin(radians(l.latitude))))) <= :radiusKm) "
            +
            "ORDER BY (6371 * acos(LEAST(1.0, cos(radians(:userLat)) * cos(radians(l.latitude)) * " +
            "cos(radians(l.longitude) - radians(:userLon)) + sin(radians(:userLat)) * sin(radians(l.latitude))))) ASC, "
            +
            "g.start_time ASC", nativeQuery = true)
    List<UUID> findNearbyGameIdsWithFilters(
            Instant now,
            Float userLat,
            Float userLon,
            Double radiusKm,
            String sportName,
            String skillLevel,
            String locationType,
            String intensity);

    @Query("SELECT g FROM Game g " +
            "LEFT JOIN FETCH g.sport " +
            "LEFT JOIN FETCH g.createdBy " +
            "LEFT JOIN FETCH g.location " +
            "WHERE g.gameId IN :gameIds")
    List<Game> findAllByGameIdIn(@Param("gameIds") List<UUID> gameIds);

    @Query("SELECT g FROM Game g " +
            "LEFT JOIN FETCH g.sport " +
            "LEFT JOIN FETCH g.createdBy " +
            "LEFT JOIN FETCH g.location " +
            "JOIN GameParticipation p ON g.gameId = p.game.gameId " +
            "WHERE g.status != 'CANCELLED' AND g.startTime < :now AND p.user.userId = :userId AND p.joinStatus = 'CONFIRMED' " +
            "ORDER BY g.endTime DESC")
    List<Game> findPastGames(UUID userId, Instant now);

    @Query("SELECT DISTINCT g FROM Game g " +
            "LEFT JOIN FETCH g.sport " +
            "LEFT JOIN FETCH g.createdBy " +
            "LEFT JOIN FETCH g.location " +
            "JOIN GameParticipation p ON g.gameId = p.game.gameId " +
            "WHERE g.status != 'CANCELLED' AND g.startTime < :now AND g.createdBy.userId = :userId AND p.attendanceStatus = 'UNKNOWN' " +
            "ORDER BY g.endTime ASC")
    List<Game> findPastGamesForUserNeedingAttendanceUpdate(UUID userId, Instant now);

    @Query("SELECT g FROM Game g " +
            "LEFT JOIN FETCH g.sport " +
            "LEFT JOIN FETCH g.createdBy " +
            "LEFT JOIN FETCH g.location " +
            "WHERE g.sport.sportId = :sportId AND g.status = 'SCHEDULED' AND g.startTime > :now")
    List<Game> findBySportAndUpcoming(UUID sportId, Instant now);

    @Query("SELECT g FROM Game g " +
            "LEFT JOIN FETCH g.sport " +
            "LEFT JOIN FETCH g.createdBy " +
            "LEFT JOIN FETCH g.location " +
            "WHERE g.createdBy.userId = :userId ORDER BY g.createdAt DESC")
    List<Game> findByOrganizer(UUID userId);

    @Query("SELECT g FROM Game g " +
            "LEFT JOIN FETCH g.sport " +
            "LEFT JOIN FETCH g.createdBy " +
            "LEFT JOIN FETCH g.location " +
            "JOIN Organizer o ON o.user.userId = g.createdBy.userId " +
            "WHERE o.organizerId = :organizerId ORDER BY g.createdAt DESC")
    List<Game> findByOrganizerId(UUID organizerId);

    @Query("SELECT g FROM Game g WHERE g.status IN ('SCHEDULED', 'IN_PROGRESS') AND g.endTime IS NOT NULL AND g.endTime <= :time")
    List<Game> findGamesToComplete(Instant time);

    @Query("SELECT g FROM Game g " +
            "LEFT JOIN FETCH g.sport " +
            "LEFT JOIN FETCH g.createdBy " +
            "LEFT JOIN FETCH g.location " +
            "WHERE g.status = 'SCHEDULED' AND g.startTime > :windowStart AND g.startTime <= :windowEnd")
    List<Game> findGamesStartingSoon(Instant windowStart, Instant windowEnd);

    @Query("SELECT g FROM Game g " +
            "LEFT JOIN FETCH g.sport " +
            "LEFT JOIN FETCH g.createdBy " +
            "LEFT JOIN FETCH g.location " +
            "WHERE g.status = 'SCHEDULED' AND g.startTime < :time")
    List<Game> findGamesNeedingStatusUpdate(Instant time);
}
