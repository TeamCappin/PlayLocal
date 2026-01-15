package com.backend.playlocal.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatRoomService {

    private final ChatRoomRepository repo;

    public ChatRoom getOrCreate(String gameId) {
        return repo.findByGameId(gameId)
                .orElseGet(() -> repo.save(ChatRoom.create(gameId)));
    }
}
