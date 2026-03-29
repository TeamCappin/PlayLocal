package com.backend.playlocal.scheduler;

import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.GameParticipation;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.GameRepository;
import com.backend.playlocal.service.GameService;
import com.backend.playlocal.service.NotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component
public class GameLifecycleScheduler {

    private final GameRepository gameRepository;
    private final GameParticipationRepository participationRepository;
    private final GameService gameService;
    private final NotificationService notificationService;

    public GameLifecycleScheduler(
            GameRepository gameRepository,
            GameParticipationRepository participationRepository,
            GameService gameService,
            NotificationService notificationService) {
        this.gameRepository = gameRepository;
        this.participationRepository = participationRepository;
        this.gameService = gameService;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedDelayString = "${game.lifecycle.update-interval-ms:60000}")
    @Transactional
    public void completeGamesPastEndTime() {
        List<Game> gamesToComplete = gameRepository.findGamesToComplete(Instant.now());
        if (gamesToComplete.isEmpty()) {
            return;
        }

        for (Game game : gamesToComplete) {
            gameService.completeGameByScheduler(game.getGameId());
        }
    }

    @Scheduled(fixedDelayString = "${notifications.starting-soon.interval-ms:60000}")
    @Transactional
    public void sendStartingSoonNotifications() {
        Instant now = Instant.now();
        Instant windowEnd = now.plusSeconds(2L * 60 * 60); // 2h
        List<Game> games = gameRepository.findGamesStartingSoon(now, windowEnd);
        for (Game game : games) {
            notifyParticipantsGameStartingSoon(game);
        }
    }

    @Scheduled(fixedDelayString = "${notifications.pending.interval-ms:60000}")
    @Transactional
    public void processPendingNotifications() {
        notificationService.processPendingNotifications();
    }

    private void notifyParticipantsGameStartingSoon(Game game) {
        List<GameParticipation> confirmed = participationRepository.findConfirmedByGame(game.getGameId());
        List<GameParticipation> waitlisted = participationRepository.findWaitlistedByGame(game.getGameId());
        UUID organizerId = game.getCreatedBy().getUserId();
        Set<UUID> notified = new java.util.HashSet<>();

        for (GameParticipation p : confirmed) {
            UUID userId = p.getUser().getUserId();
            if (!userId.equals(organizerId) && notified.add(userId)) {
                notificationService.notifyGameStartingSoon(game, userId);
            }
        }
        for (GameParticipation p : waitlisted) {
            UUID userId = p.getUser().getUserId();
            if (!userId.equals(organizerId) && notified.add(userId)) {
                notificationService.notifyGameStartingSoon(game, userId);
            }
        }
    }
}
