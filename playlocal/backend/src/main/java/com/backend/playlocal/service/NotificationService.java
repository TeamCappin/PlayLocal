package com.backend.playlocal.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.Notification;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.NotificationRepository;
import com.backend.playlocal.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    public static final String TYPE_GAME_UPDATED = "GAME_UPDATED";
    public static final String TYPE_GAME_REMOVED_REQUIREMENTS = "GAME_REMOVED_REQUIREMENTS";
    public static final String TYPE_WAITLIST_PROMOTED = "WAITLIST_PROMOTED";
    public static final String TYPE_GAME_STARTING_SOON = "GAME_STARTING_SOON";
    public static final String TYPE_ATTENDANCE_PROMPT = "ATTENDANCE_PROMPT";
    private static final String TYPE_ATTENDANCE_CONFIRMATION = "ATTENDANCE_CONFIRMATION";
    private static final String PAYLOAD_GAME_ID = "gameId";
    private static final String PAYLOAD_MESSAGE = "message";
    private static final String PAYLOAD_TITLE = "title";
    private static final String PAYLOAD_LINK = "link";
    private static final String PAYLOAD_EVENT_AT = "eventAt";
    private static final Set<String> SINGLE_EVENT_GAME_TYPES = Set.of(
            TYPE_GAME_CANCELLED,
            TYPE_GAME_REMOVED_REQUIREMENTS,
            TYPE_WAITLIST_PROMOTED,
            TYPE_GAME_STARTING_SOON,
            TYPE_ATTENDANCE_PROMPT,
            TYPE_ATTENDANCE_CONFIRMATION);

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

        return saveNotificationIfUnique(notification);
    }

    /**
     * Schedule attendance confirmation reminder for organizer.
     * US-5.2: Email prompting organizer to confirm attendance.
     */
    @Transactional
    public Notification scheduleAttendanceReminder(Game game, Instant scheduledFor) {
        User organizer = game.getCreatedBy();
        String inAppKey = buildIdempotencyKey(TYPE_ATTENDANCE_PROMPT, game.getGameId(), organizer.getUserId());
        String emailKey = "EMAIL:" + inAppKey;
        if (notificationRepository.existsByProviderMessageId(inAppKey)
                || notificationRepository.existsByProviderMessageId(emailKey)) {
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
                .providerMessageId(emailKey)
                .build();

        Notification savedInApp = saveNotificationIfUnique(inAppNotification);
        if (savedInApp == null) {
            return null;
        }
        Notification savedEmail = saveNotificationIfUnique(emailNotification);
        if (savedEmail == null) {
            return null;
        }

        return savedInApp;
    }

    /**
     * Get notifications for a user.
     */
    public List<NotificationDto> getUserNotifications(UUID userId) {
        return dedupeNotifications(notificationRepository.findUserNotifications(userId)).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get unread notification count.
     */
    public int getUnreadCount(UUID userId) {
        return dedupeNotifications(notificationRepository.findUnreadNotifications(userId)).size();
    }

    /**
     * Mark notification as read.
     */
    @Transactional
    public boolean markAsRead(UUID userId, UUID notificationId) {
        return notificationRepository.findInboxNotification(notificationId, userId).map(target -> {
            String semanticKey = buildSemanticKey(target);
            List<Notification> notificationsToUpdate = notificationRepository.findUserNotifications(userId).stream()
                    .filter(notification -> notification.getStatus() == Notification.NotificationStatus.SENT)
                    .filter(notification -> semanticKey.equals(buildSemanticKey(notification)))
                    .toList();

            if (notificationsToUpdate.isEmpty()) {
                return true;
            }

            notificationsToUpdate.forEach(notification -> notification.setStatus(Notification.NotificationStatus.READ));
            notificationRepository.saveAll(notificationsToUpdate);
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

    @Transactional
    public Notification notifyGameCancelled(Game game, UUID userId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put(PAYLOAD_TITLE, "Game cancelled");
        payload.put(PAYLOAD_MESSAGE, String.format("The game \"%s\" has been cancelled by the organizer.", game.getTitle()));
        payload.put(PAYLOAD_GAME_ID, game.getGameId().toString());
        payload.put("gameTitle", game.getTitle());
        payload.put(PAYLOAD_LINK, "/discover");
        String key = buildIdempotencyKey(TYPE_GAME_CANCELLED, game.getGameId(), userId);
        return createInAppNotification(userId, TYPE_GAME_CANCELLED, payload, key);
    }

    @Transactional
    public Notification notifyGameUpdated(Game game, UUID userId) {
        Instant eventAt = game.getUpdatedAt() != null ? game.getUpdatedAt() : Instant.now();
        Map<String, Object> payload = new HashMap<>();
        payload.put(PAYLOAD_TITLE, "Game updated");
        payload.put(PAYLOAD_MESSAGE, String.format("The game \"%s\" has been updated. Check the details for changes.",
                game.getTitle()));
        payload.put(PAYLOAD_GAME_ID, game.getGameId().toString());
        payload.put("gameTitle", game.getTitle());
        payload.put(PAYLOAD_LINK, "/games/" + game.getGameId());
        payload.put(PAYLOAD_EVENT_AT, eventAt.toString());
        String key = buildIdempotencyKey(TYPE_GAME_UPDATED, game.getGameId(), userId, eventAt.toString());
        return createInAppNotification(userId, TYPE_GAME_UPDATED, payload, key);
    }

    @Transactional
    public Notification notifyRemovedFromGameRequirements(Game game, UUID userId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put(PAYLOAD_TITLE, "Removed from game");
        payload.put(PAYLOAD_MESSAGE, String.format(
                "You no longer meet the updated requirements for \"%s\". The organizer raised the minimum reliability score.",
                game.getTitle()));
        payload.put(PAYLOAD_GAME_ID, game.getGameId().toString());
        payload.put("gameTitle", game.getTitle());
        payload.put(PAYLOAD_LINK, "/games/" + game.getGameId());
        String key = buildIdempotencyKey(TYPE_GAME_REMOVED_REQUIREMENTS, game.getGameId(), userId);
        return createInAppNotification(userId, TYPE_GAME_REMOVED_REQUIREMENTS, payload, key);
    }

    private String buildIdempotencyKey(String type, UUID gameId, UUID userId) {
        return String.format("IN_APP:%s:%s:%s", type, gameId, userId);
    }

    private String buildIdempotencyKey(String type, UUID gameId, UUID userId, String occurrenceToken) {
        return String.format("IN_APP:%s:%s:%s:%s", type, gameId, userId, occurrenceToken);
    }

    private Notification saveNotificationIfUnique(Notification notification) {
        try {
            return notificationRepository.saveAndFlush(notification);
        } catch (DataIntegrityViolationException e) {
            if (notification.getProviderMessageId() != null) {
                log.info("Skipped duplicate notification for key {}", notification.getProviderMessageId());
                return null;
            }
            throw e;
        }
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

    private List<Notification> dedupeNotifications(List<Notification> notifications) {
        Map<String, Notification> deduped = new LinkedHashMap<>();

        for (Notification notification : notifications) {
            String semanticKey = buildSemanticKey(notification);
            Notification existing = deduped.get(semanticKey);
            if (existing == null || shouldReplaceRepresentative(existing, notification)) {
                deduped.put(semanticKey, notification);
            }
        }

        return deduped.values().stream()
                .sorted(Comparator.comparing(this::notificationInstant).reversed())
                .toList();
    }

    private boolean shouldReplaceRepresentative(Notification existing, Notification candidate) {
        int existingPriority = statusPriority(existing.getStatus());
        int candidatePriority = statusPriority(candidate.getStatus());
        if (candidatePriority != existingPriority) {
            return candidatePriority > existingPriority;
        }
        return notificationInstant(candidate).isAfter(notificationInstant(existing));
    }

    private int statusPriority(Notification.NotificationStatus status) {
        return status == Notification.NotificationStatus.SENT ? 1 : 0;
    }

    private Instant notificationInstant(Notification notification) {
        if (notification.getSentAt() != null) {
            return notification.getSentAt();
        }
        if (notification.getScheduledFor() != null) {
            return notification.getScheduledFor();
        }
        return Instant.EPOCH;
    }

    private String buildSemanticKey(Notification notification) {
        Map<String, Object> payload = parsePayload(notification.getPayloadJson());
        String type = normalizeType(notification.getNotifType());
        String gameId = payloadValue(payload, PAYLOAD_GAME_ID);

        if (SINGLE_EVENT_GAME_TYPES.contains(type)) {
            return String.format("%s:%s", type, firstNonBlank(gameId, payloadValue(payload, PAYLOAD_LINK),
                    payloadValue(payload, PAYLOAD_MESSAGE), notification.getNotificationId().toString()));
        }

        if (TYPE_GAME_UPDATED.equals(type)) {
            String occurrenceToken = firstNonBlank(
                    payloadValue(payload, PAYLOAD_EVENT_AT),
                    payloadValue(payload, PAYLOAD_MESSAGE),
                    notificationInstant(notification).toString());
            return String.format("%s:%s:%s", type, firstNonBlank(gameId, "no-game"), occurrenceToken);
        }

        return String.format("%s:%s", type,
                firstNonBlank(payloadValue(payload, PAYLOAD_LINK), payloadValue(payload, PAYLOAD_TITLE),
                        payloadValue(payload, PAYLOAD_MESSAGE), notification.getNotificationId().toString()));
    }

    private Map<String, Object> parsePayload(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(payloadJson, new TypeReference<>() {
            });
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse notification payload for dedupe", e);
            return Map.of();
        }
    }

    private String payloadValue(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        return value instanceof String stringValue && !stringValue.isBlank() ? stringValue : null;
    }

    private String normalizeType(String type) {
        return type == null ? "NOTIFICATION" : type.toUpperCase();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
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
