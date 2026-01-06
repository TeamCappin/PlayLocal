package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.Block;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BlockRepository extends JpaRepository<Block, UUID> {

    @Query("SELECT b FROM Block b WHERE b.blocker.userId = :blockerId AND b.blocked.userId = :blockedId")
    Optional<Block> findByBlockerAndBlocked(UUID blockerId, UUID blockedId);

    @Query("SELECT b FROM Block b WHERE b.blocker.userId = :userId")
    List<Block> findByBlocker(UUID userId);

    @Query("SELECT b.blocked.userId FROM Block b WHERE b.blocker.userId = :userId")
    List<UUID> findBlockedUserIds(UUID userId);

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM Block b WHERE b.blocker.userId = :blockerId AND b.blocked.userId = :blockedId")
    boolean existsBlockBetween(UUID blockerId, UUID blockedId);
}
