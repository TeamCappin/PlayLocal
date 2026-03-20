package com.backend.playlocal.service;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.GameParticipation;
import com.backend.playlocal.model.entity.Location;
import com.backend.playlocal.model.entity.Sport;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.GameRepository;
import com.backend.playlocal.repository.GameTagAssignmentRepository;
import com.backend.playlocal.repository.GameTagConfirmationRepository;
import com.backend.playlocal.repository.GameTagRepository;
import com.backend.playlocal.repository.GameVisibilityRepository;
import com.backend.playlocal.repository.LocationRepository;
import com.backend.playlocal.repository.SportRepository;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.repository.EndorsementRepository;
import com.backend.playlocal.repository.FriendshipRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GameServiceLifecycleTest {

    @Mock
    private GameRepository gameRepository;
    @Mock
    private GameParticipationRepository participationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SportRepository sportRepository;
    @Mock
    private LocationRepository locationRepository;
    @Mock
    private GameVisibilityRepository gameVisibilityRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private OrganizerQualityService oqsService;
    @Mock
    private EndorsementRepository endorsementRepository;
    @Mock
    private GameTagRepository tagRepository;
    @Mock
    private GameTagAssignmentRepository tagAssignmentRepository;
    @Mock
    private GameTagConfirmationRepository tagConfirmationRepository;
    @Mock
    private PrivacySettingsService privacySettingsService;
    @Mock
    private FriendshipRepository friendshipRepository;

    @InjectMocks
    private GameService gameService;

    private UUID gameId;
    private User organizer;
    private User confirmedUser;
    private User waitlistedUser;
    private Game game;

    @BeforeEach
    void setUp() {
        gameId = UUID.randomUUID();
        organizer = User.builder()
                .userId(UUID.randomUUID())
                .displayName("Organizer")
                .reliabilityScore(100.0f)
                .build();
        confirmedUser = User.builder()
                .userId(UUID.randomUUID())
                .displayName("Confirmed")
                .reliabilityScore(90.0f)
                .build();
        waitlistedUser = User.builder()
                .userId(UUID.randomUUID())
                .displayName("Waitlisted")
                .reliabilityScore(80.0f)
                .build();

        game = Game.builder()
                .gameId(gameId)
                .createdBy(organizer)
                .sport(Sport.builder().name("Basketball").build())
                .location(Location.builder().city("Montreal").name("Court").build())
                .title("Test Game")
                .status(Game.GameStatus.SCHEDULED)
                .startTime(Instant.now().plusSeconds(3600))
                .build();

        lenient().when(gameRepository.save(any(Game.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(participationRepository.countConfirmedParticipants(gameId)).thenReturn(1);
        lenient().when(participationRepository.findWaitlistedByGame(gameId)).thenReturn(List.of());
        lenient().when(tagAssignmentRepository.findAllByGame(game)).thenReturn(List.of());
    }

    @Test
    void cancelGame_AsOrganizer_CancelsAndNotifiesParticipants() {
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
        GameParticipation waitlistedParticipation = GameParticipation.builder()
                .game(game)
                .user(waitlistedUser)
                .joinStatus(GameParticipation.JoinStatus.WAITLISTED)
                .build();

        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
        when(participationRepository.findConfirmedByGame(gameId))
                .thenReturn(List.of(organizerParticipation, confirmedParticipation));
        when(participationRepository.findWaitlistedByGame(gameId))
                .thenReturn(List.of(waitlistedParticipation));

        gameService.cancelGame(gameId, organizer.getUserId());

        ArgumentCaptor<Game> gameCaptor = ArgumentCaptor.forClass(Game.class);
        verify(gameRepository).save(gameCaptor.capture());
        assertThat(gameCaptor.getValue().getStatus()).isEqualTo(Game.GameStatus.CANCELLED);
        assertThat(gameCaptor.getValue().getCancelledAt()).isNotNull();

        ArgumentCaptor<UUID> userCaptor = ArgumentCaptor.forClass(UUID.class);
        verify(notificationService, times(2))
                .createInAppNotification(userCaptor.capture(), eq("GAME_CANCELLED"), anyMap());
        assertThat(userCaptor.getAllValues())
                .containsExactlyInAnyOrder(confirmedUser.getUserId(), waitlistedUser.getUserId());
    }

    @Test
    void cancelGame_AsNonOrganizer_ThrowsAccessDenied() {
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        assertThatThrownBy(() -> gameService.cancelGame(gameId, UUID.randomUUID()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void completeGame_AsOrganizer_SetsCompleted() {
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        gameService.completeGame(gameId, organizer.getUserId());

        ArgumentCaptor<Game> gameCaptor = ArgumentCaptor.forClass(Game.class);
        verify(gameRepository).save(gameCaptor.capture());
        assertThat(gameCaptor.getValue().getStatus()).isEqualTo(Game.GameStatus.COMPLETED);
        verify(notificationService).notifyAttendanceConfirmationNeeded(gameCaptor.getValue());
    }

    @Test
    void completeGame_WhenAlreadyCompleted_DoesNotSaveAgain() {
        game.setStatus(Game.GameStatus.COMPLETED);
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        gameService.completeGame(gameId, organizer.getUserId());

        verify(gameRepository, times(0)).save(any(Game.class));
        verify(notificationService, times(0)).notifyAttendanceConfirmationNeeded(any(Game.class));
    }

    @Test
    void completeGameByScheduler_CompletesAndNotifiesOrganizer() {
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        gameService.completeGameByScheduler(gameId);

        ArgumentCaptor<Game> gameCaptor = ArgumentCaptor.forClass(Game.class);
        verify(gameRepository).save(gameCaptor.capture());
        assertThat(gameCaptor.getValue().getStatus()).isEqualTo(Game.GameStatus.COMPLETED);
        verify(notificationService).notifyAttendanceConfirmationNeeded(gameCaptor.getValue());
    }

    @Test
    void completeGame_WhenCancelled_Throws() {
        game.setStatus(Game.GameStatus.CANCELLED);
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        assertThatThrownBy(() -> gameService.completeGame(gameId, organizer.getUserId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("cancelled");
    }

    @Test
    void completeGame_WhenArchived_Throws() {
        game.setStatus(Game.GameStatus.ARCHIVED);
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        assertThatThrownBy(() -> gameService.completeGame(gameId, organizer.getUserId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("archived");
    }

    @Test
    void completeGame_AsNonOrganizer_ThrowsAccessDenied() {
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        assertThatThrownBy(() -> gameService.completeGame(gameId, UUID.randomUUID()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only the organizer can modify this game");
    }

    @Test
    void completeGame_GameMissing_ThrowsNotFound() {
        when(gameRepository.findById(gameId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> gameService.completeGame(gameId, organizer.getUserId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void archiveGame_WhenScheduled_Throws() {
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        assertThatThrownBy(() -> gameService.archiveGame(gameId, organizer.getUserId()))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void archiveGame_WhenInProgress_Throws() {
        game.setStatus(Game.GameStatus.IN_PROGRESS);
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        assertThatThrownBy(() -> gameService.archiveGame(gameId, organizer.getUserId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("in_progress");
    }

    @Test
    void archiveGame_WhenCompleted_Archives() {
        game.setStatus(Game.GameStatus.COMPLETED);
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        gameService.archiveGame(gameId, organizer.getUserId());

        ArgumentCaptor<Game> gameCaptor = ArgumentCaptor.forClass(Game.class);
        verify(gameRepository).save(gameCaptor.capture());
        assertThat(gameCaptor.getValue().getStatus()).isEqualTo(Game.GameStatus.ARCHIVED);
    }

    @Test
    void archiveGame_WhenAlreadyArchived_DoesNotSave() {
        game.setStatus(Game.GameStatus.ARCHIVED);
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        gameService.archiveGame(gameId, organizer.getUserId());

        verify(gameRepository, times(0)).save(any(Game.class));
    }

    @Test
    void archiveGame_GameMissing_ThrowsNotFound() {
        when(gameRepository.findById(gameId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> gameService.archiveGame(gameId, organizer.getUserId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void leaveGame_WhenArchived_Throws() {
        Game archivedGame = Game.builder()
                .gameId(gameId)
                .createdBy(organizer)
                .status(Game.GameStatus.ARCHIVED)
                .build();
        GameParticipation participation = GameParticipation.builder()
                .game(archivedGame)
                .user(confirmedUser)
                .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                .build();

        when(participationRepository.findByGameAndUser(gameId, confirmedUser.getUserId()))
                .thenReturn(Optional.of(participation));

        assertThatThrownBy(() -> gameService.leaveGame(gameId, confirmedUser.getUserId()))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void leaveGame_WhenConfirmedUserLeaves_PromotesWaitlistedAndNotifies() {
        GameParticipation leavingParticipation = GameParticipation.builder()
                .game(game)
                .user(confirmedUser)
                .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                .participationRole(GameParticipation.ParticipationRole.PARTICIPANT)
                .build();
        GameParticipation promotedParticipation = GameParticipation.builder()
                .game(game)
                .user(waitlistedUser)
                .joinStatus(GameParticipation.JoinStatus.WAITLISTED)
                .waitlistPosition(1)
                .participationRole(GameParticipation.ParticipationRole.PARTICIPANT)
                .build();

        when(participationRepository.findByGameAndUser(gameId, confirmedUser.getUserId()))
                .thenReturn(Optional.of(leavingParticipation));
        when(participationRepository.findFirstWaitlisted(gameId))
                .thenReturn(List.of(promotedParticipation));

        gameService.leaveGame(gameId, confirmedUser.getUserId());

        assertThat(promotedParticipation.getJoinStatus()).isEqualTo(GameParticipation.JoinStatus.CONFIRMED);
        assertThat(promotedParticipation.getWaitlistPosition()).isNull();
        verify(participationRepository).decrementWaitlistPositionsAfter(gameId, 1);
        verify(notificationService).notifyWaitlistPromoted(game, waitlistedUser.getUserId());
    }

    @Test
    void cancelGame_WhenParticipantAppearsInBothLists_NotifiesOnlyOnce() {
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
        GameParticipation duplicateWaitlistedParticipation = GameParticipation.builder()
                .game(game)
                .user(confirmedUser)
                .joinStatus(GameParticipation.JoinStatus.WAITLISTED)
                .build();

        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
        when(participationRepository.findConfirmedByGame(gameId))
                .thenReturn(List.of(organizerParticipation, confirmedParticipation));
        when(participationRepository.findWaitlistedByGame(gameId))
                .thenReturn(List.of(duplicateWaitlistedParticipation));

        gameService.cancelGame(gameId, organizer.getUserId());

        verify(notificationService, times(1))
                .createInAppNotification(eq(confirmedUser.getUserId()), eq("GAME_CANCELLED"), anyMap());
    }

    @Test
    void cancelGame_WhenNotificationServiceIsNull_StillCancels() {
        GameParticipation confirmedParticipation = GameParticipation.builder()
                .game(game)
                .user(confirmedUser)
                .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                .build();

        GameService gameServiceWithoutNotifications = new GameService(
                gameRepository,
                participationRepository,
                userRepository,
                sportRepository,
                gameVisibilityRepository,
                endorsementRepository,
                tagRepository,
                tagAssignmentRepository,
                tagConfirmationRepository,
                null,
                oqsService,
                locationRepository,
                privacySettingsService,
                friendshipRepository);

        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
        when(participationRepository.findConfirmedByGame(gameId))
                .thenReturn(List.of(confirmedParticipation));
        when(participationRepository.findWaitlistedByGame(gameId))
                .thenReturn(List.of());

        gameServiceWithoutNotifications.cancelGame(gameId, organizer.getUserId());

        verify(gameRepository).save(any(Game.class));
        verify(oqsService).onGameCancelled(gameId);
    }

    @Test
    void cancelGame_GameMissing_ThrowsNotFound() {
        when(gameRepository.findById(gameId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> gameService.cancelGame(gameId, organizer.getUserId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
