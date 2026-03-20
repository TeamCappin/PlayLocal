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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;

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

    @Test
    void scheduleAttendanceReminder_CreatesPendingInAppAndEmailNotifications() {
        Game game = Game.builder()
                .gameId(UUID.randomUUID())
                .title("Night Run")
                .createdBy(user)
                .build();
        Instant scheduledFor = Instant.now().plusSeconds(1200);
        when(notificationRepository.existsByProviderMessageId(anyString())).thenReturn(false);

        List<Notification> savedNotifications = new ArrayList<>();
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification saved = invocation.getArgument(0);
            savedNotifications.add(saved);
            return saved;
        });

        Notification inApp = notificationService.scheduleAttendanceReminder(game, scheduledFor);

        assertThat(inApp).isNotNull();
        assertThat(savedNotifications).hasSize(2);
        assertThat(savedNotifications)
                .extracting(Notification::getChannel)
                .containsExactlyInAnyOrder(
                        Notification.NotificationChannel.IN_APP,
                        Notification.NotificationChannel.EMAIL);
        assertThat(savedNotifications)
                .extracting(Notification::getStatus)
                .containsOnly(Notification.NotificationStatus.PENDING);
        assertThat(savedNotifications)
                .extracting(Notification::getProviderMessageId)
                .allSatisfy(id -> assertThat(id).contains(game.getGameId().toString()).contains(userId.toString()));
    }

    @Test
    void notifyWaitlistPromoted_CreatesTypedNotificationWithIdempotencyKey() {
        Game game = Game.builder()
                .gameId(UUID.randomUUID())
                .title("Pickup Volleyball")
                .createdBy(user)
                .build();
        when(notificationRepository.existsByProviderMessageId(anyString())).thenReturn(false);
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));

        notificationService.notifyWaitlistPromoted(game, userId);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getNotifType()).isEqualTo(NotificationService.TYPE_WAITLIST_PROMOTED);
        assertThat(saved.getProviderMessageId())
                .isEqualTo("IN_APP:WAITLIST_PROMOTED:" + game.getGameId() + ":" + userId);
    }

    @Test
    void getUserNotifications_MapsEntitiesToDtos() {
        Notification notification = Notification.builder()
                .notificationId(UUID.randomUUID())
                .notifType(NotificationService.TYPE_GAME_CANCELLED)
                .payloadJson("{\"message\":\"cancelled\"}")
                .status(Notification.NotificationStatus.SENT)
                .scheduledFor(Instant.now())
                .sentAt(Instant.now())
                .build();
        when(notificationRepository.findUserNotifications(userId)).thenReturn(List.of(notification));

        List<NotificationService.NotificationDto> notifications = notificationService.getUserNotifications(userId);

        assertThat(notifications).hasSize(1);
        assertThat(notifications.get(0).type()).isEqualTo(NotificationService.TYPE_GAME_CANCELLED);
        assertThat(notifications.get(0).payload()).isEqualTo("{\"message\":\"cancelled\"}");
    }

    @Test
    void getUnreadCount_DelegatesToRepository() {
        when(notificationRepository.countUnread(userId)).thenReturn(7);

        int unread = notificationService.getUnreadCount(userId);

        assertThat(unread).isEqualTo(7);
    }

    @Test
    void markAllAsRead_UpdatesUnreadNotifications() {
        Notification unread1 = Notification.builder()
                .notificationId(UUID.randomUUID())
                .status(Notification.NotificationStatus.SENT)
                .build();
        Notification unread2 = Notification.builder()
                .notificationId(UUID.randomUUID())
                .status(Notification.NotificationStatus.SENT)
                .build();
        when(notificationRepository.findUnreadNotifications(userId)).thenReturn(List.of(unread1, unread2));

        notificationService.markAllAsRead(userId);

        assertThat(unread1.getStatus()).isEqualTo(Notification.NotificationStatus.READ);
        assertThat(unread2.getStatus()).isEqualTo(Notification.NotificationStatus.READ);
        verify(notificationRepository).saveAll(List.of(unread1, unread2));
    }

    @Test
    void createInAppNotification_WhenPayloadSerializationFails_StillSavesNotification() throws Exception {
        ObjectMapper failingMapper = mock(ObjectMapper.class);
        NotificationService service = new NotificationService(notificationRepository, userRepository, failingMapper);
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));
        when(failingMapper.writeValueAsString(any())).thenThrow(new com.fasterxml.jackson.core.JsonProcessingException("boom") {
        });

        service.createInAppNotification(userId, NotificationService.TYPE_GAME_CANCELLED, Map.of("message", "x"));

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getPayloadJson()).isNull();
    }

    @Test
    void scheduleAttendanceReminder_WhenPayloadSerializationFails_StillCreatesNotifications() throws Exception {
        ObjectMapper failingMapper = mock(ObjectMapper.class);
        NotificationService service = new NotificationService(notificationRepository, userRepository, failingMapper);
        Game game = Game.builder()
                .gameId(UUID.randomUUID())
                .title("Serializer Edge")
                .createdBy(user)
                .build();
        when(notificationRepository.existsByProviderMessageId(anyString())).thenReturn(false);
        when(failingMapper.writeValueAsString(any())).thenThrow(new com.fasterxml.jackson.core.JsonProcessingException("boom") {
        });

        Notification created = service.scheduleAttendanceReminder(game, Instant.now().plusSeconds(60));

        assertThat(created).isNotNull();
        verify(notificationRepository, times(2)).save(any(Notification.class));
    }
}
