package com.backend.playlocal.chat;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ChatRoomService {

    private final ChatRoomRepository repo;

    public ChatRoomService(ChatRoomRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public ChatRoom getOrCreate(String gameId) {
        UUID gid = UUID.fromString(gameId);
        return repo.findByGameId(gid)
                .orElseGet(() -> repo.save(ChatRoom.create(gameId)));
    }
}
