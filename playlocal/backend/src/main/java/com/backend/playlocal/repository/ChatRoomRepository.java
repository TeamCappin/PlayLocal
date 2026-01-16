package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {
    Optional<ChatRoom> findByGameId(UUID gameId);
}