package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GameRepository extends JpaRepository<Game, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT g FROM Game g WHERE g.gameId = :gameId")
    Optional<Game> findByIdWithLock(UUID gameId);

    @Query("SELECT g FROM Game g WHERE g.status = 'SCHEDULED' AND g.startTime > :now ORDER BY g.startTime ASC")
    List<Game> findUpcomingGames(Instant now);

    @Query("SELECT g FROM Game g WHERE g.sport.sportId = :sportId AND g.status = 'SCHEDULED' AND g.startTime > :now")
    List<Game> findBySportAndUpcoming(UUID sportId, Instant now);

    @Query("SELECT g FROM Game g WHERE g.createdBy.userId = :userId ORDER BY g.createdAt DESC")
    List<Game> findByOrganizer(UUID userId);

    @Query("SELECT g FROM Game g WHERE g.status IN ('SCHEDULED', 'IN_PROGRESS') AND g.endTime IS NOT NULL AND g.endTime <= :time")
    List<Game> findGamesToComplete(Instant time);
}
