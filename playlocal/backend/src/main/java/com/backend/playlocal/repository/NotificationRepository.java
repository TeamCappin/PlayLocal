package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query("SELECT n FROM Notification n WHERE n.user.userId = :userId AND n.channel = 'IN_APP' AND n.status IN ('SENT', 'READ') ORDER BY n.scheduledFor DESC")
    List<Notification> findUserNotifications(UUID userId);

    @Query("SELECT n FROM Notification n WHERE n.user.userId = :userId AND n.status = 'SENT' AND n.channel = 'IN_APP' ORDER BY n.scheduledFor DESC")
    List<Notification> findUnreadNotifications(UUID userId);

    @Query("SELECT n FROM Notification n WHERE n.status = 'PENDING' AND n.scheduledFor <= :now")
    List<Notification> findPendingToSend(Instant now);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.userId = :userId AND n.status = 'SENT' AND n.channel = 'IN_APP'")
    int countUnread(UUID userId);

    @Query("SELECT n FROM Notification n " +
            "WHERE n.notificationId = :notificationId " +
            "AND n.user.userId = :userId " +
            "AND n.channel = 'IN_APP' " +
            "AND n.status IN ('SENT', 'READ')")
    Optional<Notification> findInboxNotification(UUID notificationId, UUID userId);

    boolean existsByProviderMessageId(String providerMessageId);
}
