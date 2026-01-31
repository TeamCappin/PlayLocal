package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.GameTagConfirmation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GameTagConfirmationRepository extends JpaRepository<GameTagConfirmation, UUID> {
    List<GameTagConfirmation> findAllByUser_UserIdAndGame_GameId(UUID userId, UUID gameId);
    Optional<GameTagConfirmation> findByUser_UserIdAndGame_GameIdAndTag_TagId(UUID userId, UUID gameId, UUID tagId);
    boolean existsByUser_UserIdAndGame_GameIdAndTag_TagId(UUID userId, UUID gameId, UUID tagId);
}
