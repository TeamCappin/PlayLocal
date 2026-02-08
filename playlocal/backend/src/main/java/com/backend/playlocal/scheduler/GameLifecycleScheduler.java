package com.backend.playlocal.scheduler;

import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.repository.GameRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
public class GameLifecycleScheduler {

    private final GameRepository gameRepository;

    public GameLifecycleScheduler(GameRepository gameRepository) {
        this.gameRepository = gameRepository;
    }

    @Scheduled(fixedDelayString = "${game.lifecycle.update-interval-ms:60000}")
    @Transactional
    public void completeGamesPastEndTime() {
        List<Game> gamesToComplete = gameRepository.findGamesToComplete(Instant.now());
        if (gamesToComplete.isEmpty()) {
            return;
        }

        for (Game game : gamesToComplete) {
            game.setStatus(Game.GameStatus.COMPLETED);
        }

        gameRepository.saveAll(gamesToComplete);
    }
}
