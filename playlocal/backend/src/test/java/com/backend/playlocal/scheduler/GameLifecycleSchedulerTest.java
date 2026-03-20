package com.backend.playlocal.scheduler;

import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.GameParticipation;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.GameRepository;
import com.backend.playlocal.service.GameService;
import com.backend.playlocal.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GameLifecycleSchedulerTest {

    @Mock
    private GameRepository gameRepository;

    @Mock
    private GameParticipationRepository participationRepository;

    @Mock
    private GameService gameService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private GameLifecycleScheduler scheduler;

    private Game game;
    private User organizer;
    private User confirmedUser;
    private User waitlistedUser;

    @BeforeEach
    void setUp() {
        organizer = User.builder().userId(UUID.randomUUID()).build();
        confirmedUser = User.builder().userId(UUID.randomUUID()).build();
        waitlistedUser = User.builder().userId(UUID.randomUUID()).build();
        game = Game.builder()
                .gameId(UUID.randomUUID())
                .createdBy(organizer)
                .status(Game.GameStatus.SCHEDULED)
                .title("Morning Basketball")
                .startTime(Instant.now().plusSeconds(1800))
                .build();
    }

    @Test
    void completeGamesPastEndTime_UsesGameServiceCompletionFlow() {
        when(gameRepository.findGamesToComplete(any())).thenReturn(List.of(game));

        scheduler.completeGamesPastEndTime();

        verify(gameService).completeGameByScheduler(game.getGameId());
    }

    @Test
    void completeGamesPastEndTime_WhenNoGames_DoesNothing() {
        when(gameRepository.findGamesToComplete(any())).thenReturn(List.of());

        scheduler.completeGamesPastEndTime();

        verify(gameService, never()).completeGameByScheduler(any());
    }

    @Test
    void sendStartingSoonNotifications_NotifiesUniqueParticipantsExcludingOrganizer() {
        GameParticipation organizerParticipation = GameParticipation.builder()
                .game(game)
                .user(organizer)
                .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                .build();
        GameParticipation confirmedParticipation = GameParticipation.builder()
                .game(game)
                .user(confirmedUser)
                .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                .build();
        GameParticipation duplicateWaitlisted = GameParticipation.builder()
                .game(game)
                .user(confirmedUser)
                .joinStatus(GameParticipation.JoinStatus.WAITLISTED)
                .waitlistPosition(2)
                .build();
        GameParticipation waitlistedParticipation = GameParticipation.builder()
                .game(game)
                .user(waitlistedUser)
                .joinStatus(GameParticipation.JoinStatus.WAITLISTED)
                .waitlistPosition(1)
                .build();

        when(gameRepository.findGamesStartingSoon(any(), any())).thenReturn(List.of(game));
        when(participationRepository.findConfirmedByGame(game.getGameId()))
                .thenReturn(List.of(organizerParticipation, confirmedParticipation));
        when(participationRepository.findWaitlistedByGame(game.getGameId()))
                .thenReturn(List.of(waitlistedParticipation, duplicateWaitlisted));

        scheduler.sendStartingSoonNotifications();

        verify(notificationService, times(1)).notifyGameStartingSoon(game, confirmedUser.getUserId());
        verify(notificationService, times(1)).notifyGameStartingSoon(game, waitlistedUser.getUserId());
        verify(notificationService, never()).notifyGameStartingSoon(game, organizer.getUserId());
    }

    @Test
    void processPendingNotifications_DelegatesToNotificationService() {
        scheduler.processPendingNotifications();
        verify(notificationService).processPendingNotifications();
    }

    @Test
    void sendStartingSoonNotifications_WhenNoGames_DoesNotNotifyAnyone() {
        when(gameRepository.findGamesStartingSoon(any(), any())).thenReturn(List.of());

        scheduler.sendStartingSoonNotifications();

        verify(notificationService, never()).notifyGameStartingSoon(any(), any());
    }
}
