package com.backend.playlocal.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.Notification;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.NotificationRepository;
import com.backend.playlocal.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository, userRepository, new ObjectMapper());
        userId = UUID.randomUUID();
        user = User.builder().userId(userId).email("user@example.com").displayName("User").build();
    }

    @Test
    void markAsRead_WhenNotificationOwnedByUser_MarksRead() {
        Notification notification = Notification.builder()
                .notificationId(UUID.randomUUID())
                .user(user)
                .status(Notification.NotificationStatus.SENT)
                .build();
        when(notificationRepository.findByNotificationIdAndUser_UserId(notification.getNotificationId(), userId))
                .thenReturn(Optional.of(notification));

        boolean marked = notificationService.markAsRead(userId, notification.getNotificationId());

        assertThat(marked).isTrue();
        assertThat(notification.getStatus()).isEqualTo(Notification.NotificationStatus.READ);
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsRead_WhenNotificationBelongsToAnotherUser_DoesNothing() {
        UUID notificationId = UUID.randomUUID();
        when(notificationRepository.findByNotificationIdAndUser_UserId(notificationId, userId))
                .thenReturn(Optional.empty());

        boolean marked = notificationService.markAsRead(userId, notificationId);

        assertThat(marked).isFalse();
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void notifyGameStartingSoon_CreatesIdempotentInAppNotification() {
        Game game = Game.builder()
                .gameId(UUID.randomUUID())
                .title("Test Match")
                .createdBy(user)
                .startTime(Instant.now().plusSeconds(1800))
                .build();
        when(notificationRepository.existsByProviderMessageId(any())).thenReturn(false);
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));

        notificationService.notifyGameStartingSoon(game, userId);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getNotifType()).isEqualTo(NotificationService.TYPE_GAME_STARTING_SOON);
        assertThat(saved.getProviderMessageId())
                .isEqualTo("IN_APP:GAME_STARTING_SOON:" + game.getGameId() + ":" + userId);
        assertThat(saved.getStatus()).isEqualTo(Notification.NotificationStatus.SENT);
    }

    @Test
    void createInAppNotification_WhenIdempotencyKeyExists_ReturnsNull() {
        when(notificationRepository.existsByProviderMessageId("key-1")).thenReturn(true);

        Notification created = notificationService.createInAppNotification(
                userId,
                NotificationService.TYPE_GAME_STARTING_SOON,
                Map.of("message", "hello"),
                "key-1");

        assertThat(created).isNull();
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void createInAppNotification_WhenUserMissing_ReturnsNull() {
        when(userRepository.findActiveById(userId)).thenReturn(Optional.empty());

        Notification created = notificationService.createInAppNotification(
                userId,
                NotificationService.TYPE_GAME_CANCELLED,
                Map.of("message", "cancelled"));

        assertThat(created).isNull();
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void scheduleAttendanceReminder_WhenAlreadyScheduled_ReturnsNull() {
        Game game = Game.builder()
                .gameId(UUID.randomUUID())
                .title("League Match")
                .createdBy(user)
                .build();
        when(notificationRepository.existsByProviderMessageId(anyString())).thenReturn(true);

        Notification scheduled = notificationService.scheduleAttendanceReminder(game, Instant.now().plusSeconds(300));

        assertThat(scheduled).isNull();
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void processPendingNotifications_MarksPendingAsSent() {
        Notification emailPending = Notification.builder()
                .notificationId(UUID.randomUUID())
                .user(user)
                .channel(Notification.NotificationChannel.EMAIL)
                .notifType(NotificationService.TYPE_ATTENDANCE_PROMPT)
                .status(Notification.NotificationStatus.PENDING)
                .build();
        Notification inAppPending = Notification.builder()
                .notificationId(UUID.randomUUID())
                .user(user)
                .channel(Notification.NotificationChannel.IN_APP)
                .notifType(NotificationService.TYPE_GAME_STARTING_SOON)
                .status(Notification.NotificationStatus.PENDING)
                .build();
        when(notificationRepository.findPendingToSend(any())).thenReturn(List.of(emailPending, inAppPending));

        notificationService.processPendingNotifications();

        assertThat(emailPending.getStatus()).isEqualTo(Notification.NotificationStatus.SENT);
        assertThat(emailPending.getSentAt()).isNotNull();
        assertThat(inAppPending.getStatus()).isEqualTo(Notification.NotificationStatus.SENT);
        assertThat(inAppPending.getSentAt()).isNotNull();
        verify(notificationRepository).save(emailPending);
        verify(notificationRepository).save(inAppPending);
    }

    @Test
    void notifyAttendanceConfirmationNeeded_UsesOrganizerAndTypeConstant() {
        Game game = Game.builder()
                .gameId(UUID.randomUUID())
                .title("Evening Soccer")
                .createdBy(user)
                .build();
        when(notificationRepository.existsByProviderMessageId(anyString())).thenReturn(false);
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));

        notificationService.notifyAttendanceConfirmationNeeded(game);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getNotifType()).isEqualTo(NotificationService.TYPE_ATTENDANCE_PROMPT);
        assertThat(saved.getProviderMessageId())
                .isEqualTo("IN_APP:ATTENDANCE_PROMPT:" + game.getGameId() + ":" + userId);
    }
}
