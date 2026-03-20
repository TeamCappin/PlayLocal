package com.backend.playlocal.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.Notification;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.NotificationRepository;
import com.backend.playlocal.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for notifications.
 * Implements: US-5.1 (In-app notifications), US-5.2 (Email prompts)
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    public static final String TYPE_GAME_CANCELLED = "GAME_CANCELLED";
    public static final String TYPE_WAITLIST_PROMOTED = "WAITLIST_PROMOTED";
    public static final String TYPE_GAME_STARTING_SOON = "GAME_STARTING_SOON";
    public static final String TYPE_ATTENDANCE_PROMPT = "ATTENDANCE_PROMPT";

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public NotificationService(NotificationRepository notificationRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Create in-app notification for a user.
     */
    @Transactional
    public Notification createInAppNotification(UUID userId, String type, Map<String, Object> payload) {
        return createInAppNotification(userId, type, payload, null);
    }

    /**
     * Create in-app notification for a user with optional idempotency key.
     */
    @Transactional
    public Notification createInAppNotification(UUID userId, String type, Map<String, Object> payload, String idempotencyKey) {
        if (idempotencyKey != null && notificationRepository.existsByProviderMessageId(idempotencyKey)) {
            return null;
        }

        User user = userRepository.findActiveById(userId).orElse(null);
        if (user == null) {
            log.warn("Attempted to notify non-existent user: {}", userId);
            return null;
        }

        String payloadJson = null;
        try {
            payloadJson = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize notification payload", e);
        }

        Notification notification = Notification.builder()
                .user(user)
                .channel(Notification.NotificationChannel.IN_APP)
                .notifType(type)
                .payloadJson(payloadJson)
                .scheduledFor(Instant.now())
                .status(Notification.NotificationStatus.SENT)
                .sentAt(Instant.now())
                .providerMessageId(idempotencyKey)
                .build();

        return notificationRepository.save(notification);
    }

    /**
     * Schedule attendance confirmation reminder for organizer.
     * US-5.2: Email prompting organizer to confirm attendance.
     */
    @Transactional
    public Notification scheduleAttendanceReminder(Game game, Instant scheduledFor) {
        User organizer = game.getCreatedBy();
        String inAppKey = buildIdempotencyKey(TYPE_ATTENDANCE_PROMPT, game.getGameId(), organizer.getUserId());
        if (notificationRepository.existsByProviderMessageId(inAppKey)) {
            return null;
        }

        Map<String, Object> payload = Map.of(
                "gameId", game.getGameId().toString(),
                "gameTitle", game.getTitle(),
                "message", "Please confirm attendance for your game: " + game.getTitle(),
                "link", "/games/" + game.getGameId());

        String payloadJson = null;
        try {
            payloadJson = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize notification payload", e);
        }

        // Create both in-app and email notification
        Notification inAppNotification = Notification.builder()
                .user(organizer)
                .channel(Notification.NotificationChannel.IN_APP)
                .notifType(TYPE_ATTENDANCE_PROMPT)
                .payloadJson(payloadJson)
                .scheduledFor(scheduledFor)
                .status(Notification.NotificationStatus.PENDING)
                .providerMessageId(inAppKey)
                .build();

        Notification emailNotification = Notification.builder()
                .user(organizer)
                .channel(Notification.NotificationChannel.EMAIL)
                .notifType(TYPE_ATTENDANCE_PROMPT)
                .payloadJson(payloadJson)
                .scheduledFor(scheduledFor)
                .status(Notification.NotificationStatus.PENDING)
                .providerMessageId(
                        "EMAIL:" + buildIdempotencyKey(TYPE_ATTENDANCE_PROMPT, game.getGameId(), organizer.getUserId()))
                .build();

        notificationRepository.save(inAppNotification);
        notificationRepository.save(emailNotification);

        return inAppNotification;
    }

    /**
     * Get notifications for a user.
     */
    public List<NotificationDto> getUserNotifications(UUID userId) {
        return notificationRepository.findUserNotifications(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get unread notification count.
     */
    public int getUnreadCount(UUID userId) {
        return notificationRepository.countUnread(userId);
    }

    /**
     * Mark notification as read.
     */
    @Transactional
    public boolean markAsRead(UUID userId, UUID notificationId) {
        return notificationRepository.findByNotificationIdAndUser_UserId(notificationId, userId).map(n -> {
            n.setStatus(Notification.NotificationStatus.READ);
            notificationRepository.save(n);
            return true;
        }).orElse(false);
    }

    /**
     * Mark all notifications as read.
     */
    @Transactional
    public void markAllAsRead(UUID userId) {
        List<Notification> unread = notificationRepository.findUnreadNotifications(userId);
        unread.forEach(n -> n.setStatus(Notification.NotificationStatus.READ));
        notificationRepository.saveAll(unread);
    }

    /**
     * Process pending notifications (called by scheduler).
     * Stub for email sending - would integrate with SendGrid in production.
     */
    @Transactional
    public void processPendingNotifications() {
        List<Notification> pending = notificationRepository.findPendingToSend(Instant.now());

        for (Notification notification : pending) {
            if (notification.getChannel() == Notification.NotificationChannel.EMAIL) {
                // TODO: Integrate with SendGrid in production
                log.info("Would send email to user {} for notification type {}",
                        notification.getUser().getEmail(), notification.getNotifType());
            }

            notification.setStatus(Notification.NotificationStatus.SENT);
            notification.setSentAt(Instant.now());
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public Notification notifyWaitlistPromoted(Game game, UUID userId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", "Spot confirmed");
        payload.put("message", String.format("You were promoted from waitlist to confirmed for \"%s\".", game.getTitle()));
        payload.put("gameId", game.getGameId().toString());
        payload.put("gameTitle", game.getTitle());
        payload.put("link", "/games/" + game.getGameId());
        String key = buildIdempotencyKey(TYPE_WAITLIST_PROMOTED, game.getGameId(), userId);
        return createInAppNotification(userId, TYPE_WAITLIST_PROMOTED, payload, key);
    }

    @Transactional
    public Notification notifyGameStartingSoon(Game game, UUID userId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", "Game starting soon");
        payload.put("message", String.format("\"%s\" starts soon. Get ready.", game.getTitle()));
        payload.put("gameId", game.getGameId().toString());
        payload.put("gameTitle", game.getTitle());
        payload.put("link", "/games/" + game.getGameId());
        String key = buildIdempotencyKey(TYPE_GAME_STARTING_SOON, game.getGameId(), userId);
        return createInAppNotification(userId, TYPE_GAME_STARTING_SOON, payload, key);
    }

    @Transactional
    public Notification notifyAttendanceConfirmationNeeded(Game game) {
        UUID organizerId = game.getCreatedBy().getUserId();
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", "Attendance confirmation needed");
        payload.put("message", String.format("Please confirm attendance for \"%s\".", game.getTitle()));
        payload.put("gameId", game.getGameId().toString());
        payload.put("gameTitle", game.getTitle());
        payload.put("link", "/games/" + game.getGameId());
        String key = buildIdempotencyKey(TYPE_ATTENDANCE_PROMPT, game.getGameId(), organizerId);
        return createInAppNotification(organizerId, TYPE_ATTENDANCE_PROMPT, payload, key);
    }

    private String buildIdempotencyKey(String type, UUID gameId, UUID userId) {
        return String.format("IN_APP:%s:%s:%s", type, gameId, userId);
    }

    private NotificationDto mapToDto(Notification n) {
        return new NotificationDto(
                n.getNotificationId().toString(),
                n.getNotifType(),
                n.getPayloadJson(),
                n.getStatus().name(),
                n.getScheduledFor(),
                n.getSentAt());
    }

    public record NotificationDto(
            String notificationId,
            String type,
            String payload,
            String status,
            Instant scheduledFor,
            Instant sentAt) {
    }
}
