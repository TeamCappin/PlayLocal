package com.backend.playlocal.controller;

import com.backend.playlocal.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private Authentication authentication;

    private NotificationController controller;
    private UUID userId;

    @BeforeEach
    void setUp() {
        controller = new NotificationController(notificationService);
        userId = UUID.randomUUID();
        when(authentication.getName()).thenReturn(userId.toString());
    }

    @Test
    void markAsRead_UsesAuthenticatedUserForOwnershipGuard() {
        UUID notificationId = UUID.randomUUID();
        when(notificationService.markAsRead(userId, notificationId)).thenReturn(true);

        ResponseEntity<Void> response = controller.markAsRead(notificationId, authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(204);
        verify(notificationService).markAsRead(userId, notificationId);
    }

    @Test
    void markAsRead_WhenNotificationMissing_ReturnsNotFound() {
        UUID notificationId = UUID.randomUUID();
        when(notificationService.markAsRead(userId, notificationId)).thenReturn(false);

        ResponseEntity<Void> response = controller.markAsRead(notificationId, authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        verify(notificationService).markAsRead(userId, notificationId);
    }

    @Test
    void getUnreadCount_ReturnsPayloadFromService() {
        when(notificationService.getUnreadCount(userId)).thenReturn(3);

        ResponseEntity<Map<String, Integer>> response = controller.getUnreadCount(authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).containsEntry("count", 3);
        verify(notificationService).getUnreadCount(userId);
    }

    @Test
    void getNotifications_DelegatesToService() {
        List<NotificationService.NotificationDto> notifications = List.of(
                new NotificationService.NotificationDto("n1", "GAME_CANCELLED", "{}", "SENT", null, null));
        when(notificationService.getUserNotifications(userId)).thenReturn(notifications);

        ResponseEntity<List<NotificationService.NotificationDto>> response = controller.getNotifications(authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).hasSize(1);
        verify(notificationService).getUserNotifications(userId);
    }
}
