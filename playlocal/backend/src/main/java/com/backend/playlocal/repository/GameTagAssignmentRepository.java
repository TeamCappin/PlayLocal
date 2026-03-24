package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.GameTagAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GameTagAssignmentRepository extends JpaRepository<GameTagAssignment, UUID> {
    List<GameTagAssignment> findAllByGame(Game game);
    List<GameTagAssignment> findAllByGame_GameId(UUID gameId);
    List<GameTagAssignment> findAllByGame_GameIdIn(List<UUID> gameIds);
    void deleteAllByGame(Game game);
}
