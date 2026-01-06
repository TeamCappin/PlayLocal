package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {

    /**
     * Find all accepted friendships for a user (either as requester or addressee).
     */
    @Query("SELECT f FROM Friendship f WHERE f.status = 'ACCEPTED' AND (f.requester.userId = :userId OR f.addressee.userId = :userId)")
    List<Friendship> findAcceptedFriendships(UUID userId);

    /**
     * Find pending friend requests received by user (they are the addressee).
     */
    @Query("SELECT f FROM Friendship f WHERE f.status = 'PENDING' AND f.addressee.userId = :userId")
    List<Friendship> findPendingRequestsReceived(UUID userId);

    /**
     * Find pending friend requests sent by user (they are the requester).
     */
    @Query("SELECT f FROM Friendship f WHERE f.status = 'PENDING' AND f.requester.userId = :userId")
    List<Friendship> findPendingRequestsSent(UUID userId);

    /**
     * Find any existing friendship between two users (regardless of status).
     */
    @Query("SELECT f FROM Friendship f WHERE (f.userLow.userId = :userLowId AND f.userHigh.userId = :userHighId)")
    Optional<Friendship> findByUserPair(UUID userLowId, UUID userHighId);

    /**
     * Check if two users are friends (accepted status).
     */
    @Query("SELECT COUNT(f) > 0 FROM Friendship f WHERE f.status = 'ACCEPTED' AND ((f.requester.userId = :userId1 AND f.addressee.userId = :userId2) OR (f.requester.userId = :userId2 AND f.addressee.userId = :userId1))")
    boolean areFriends(UUID userId1, UUID userId2);
}
