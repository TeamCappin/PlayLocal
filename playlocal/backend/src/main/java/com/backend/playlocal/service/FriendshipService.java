package com.backend.playlocal.service;

import com.backend.playlocal.exception.DuplicateResourceException;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.FriendDto;
import com.backend.playlocal.model.entity.Friendship;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.FriendshipRepository;
import com.backend.playlocal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    public FriendshipService(FriendshipRepository friendshipRepository, UserRepository userRepository) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
    }

    /**
     * Get all friends and pending requests for the current user.
     */
    public FriendDto.FriendsListResponse getFriendsList(String userId) {
        UUID userUuid = UUID.fromString(userId);

        List<FriendDto.FriendInfo> friends = friendshipRepository.findAcceptedFriendships(userUuid)
                .stream()
                .map(f -> mapToFriendInfo(f, userUuid))
                .collect(Collectors.toList());

        List<FriendDto.FriendInfo> pendingReceived = friendshipRepository.findPendingRequestsReceived(userUuid)
                .stream()
                .map(f -> mapToFriendInfo(f, userUuid))
                .collect(Collectors.toList());

        List<FriendDto.FriendInfo> pendingSent = friendshipRepository.findPendingRequestsSent(userUuid)
                .stream()
                .map(f -> mapToFriendInfo(f, userUuid))
                .collect(Collectors.toList());

        return FriendDto.FriendsListResponse.builder()
                .friends(friends)
                .pendingReceived(pendingReceived)
                .pendingSent(pendingSent)
                .build();
    }

    /**
     * Send a friend request to another user.
     */
    @Transactional
    public FriendDto.FriendshipAction sendFriendRequest(String requesterId, String addresseeId) {
        UUID requesterUuid = UUID.fromString(requesterId);
        UUID addresseeUuid = UUID.fromString(addresseeId);

        if (requesterUuid.equals(addresseeUuid)) {
            throw new IllegalArgumentException("Cannot send friend request to yourself");
        }

        User requester = userRepository.findActiveById(requesterUuid)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User addressee = userRepository.findActiveById(addresseeUuid)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Determine low/high for unique constraint
        UUID lowId = requesterUuid.compareTo(addresseeUuid) < 0 ? requesterUuid : addresseeUuid;
        UUID highId = requesterUuid.compareTo(addresseeUuid) < 0 ? addresseeUuid : requesterUuid;

        // Check if friendship already exists
        friendshipRepository.findByUserPair(lowId, highId)
                .ifPresent(existing -> {
                    throw new DuplicateResourceException("Friend request already exists between these users");
                });

        User userLow = requesterUuid.compareTo(addresseeUuid) < 0 ? requester : addressee;
        User userHigh = requesterUuid.compareTo(addresseeUuid) < 0 ? addressee : requester;

        Friendship friendship = Friendship.builder()
                .requester(requester)
                .addressee(addressee)
                .userLow(userLow)
                .userHigh(userHigh)
                .status(Friendship.FriendshipStatus.PENDING)
                .build();

        friendship = friendshipRepository.save(friendship);

        return FriendDto.FriendshipAction.builder()
                .friendshipId(friendship.getFriendshipId().toString())
                .status("PENDING")
                .message("Friend request sent")
                .build();
    }

    /**
     * Accept a friend request.
     */
    @Transactional
    public FriendDto.FriendshipAction acceptFriendRequest(String userId, String friendshipId) {
        UUID userUuid = UUID.fromString(userId);
        UUID friendshipUuid = UUID.fromString(friendshipId);

        Friendship friendship = friendshipRepository.findById(friendshipUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        // Only the addressee can accept
        if (!friendship.getAddressee().getUserId().equals(userUuid)) {
            throw new IllegalArgumentException("You cannot accept this request");
        }

        if (friendship.getStatus() != Friendship.FriendshipStatus.PENDING) {
            throw new IllegalArgumentException("Request is not pending");
        }

        friendship.setStatus(Friendship.FriendshipStatus.ACCEPTED);
        friendship.setRespondedAt(Instant.now());
        friendshipRepository.save(friendship);

        return FriendDto.FriendshipAction.builder()
                .friendshipId(friendshipId)
                .status("ACCEPTED")
                .message("Friend request accepted")
                .build();
    }

    /**
     * Decline a friend request.
     */
    @Transactional
    public FriendDto.FriendshipAction declineFriendRequest(String userId, String friendshipId) {
        UUID userUuid = UUID.fromString(userId);
        UUID friendshipUuid = UUID.fromString(friendshipId);

        Friendship friendship = friendshipRepository.findById(friendshipUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        // Only the addressee can decline
        if (!friendship.getAddressee().getUserId().equals(userUuid)) {
            throw new IllegalArgumentException("You cannot decline this request");
        }

        friendship.setStatus(Friendship.FriendshipStatus.DECLINED);
        friendship.setRespondedAt(Instant.now());
        friendshipRepository.save(friendship);

        return FriendDto.FriendshipAction.builder()
                .friendshipId(friendshipId)
                .status("DECLINED")
                .message("Friend request declined")
                .build();
    }

    /**
     * Remove a friend (or cancel a pending request).
     */
    @Transactional
    public FriendDto.FriendshipAction removeFriend(String userId, String friendshipId) {
        UUID userUuid = UUID.fromString(userId);
        UUID friendshipUuid = UUID.fromString(friendshipId);

        Friendship friendship = friendshipRepository.findById(friendshipUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Friendship not found"));

        // Either user can remove/cancel
        boolean isRequester = friendship.getRequester().getUserId().equals(userUuid);
        boolean isAddressee = friendship.getAddressee().getUserId().equals(userUuid);

        if (!isRequester && !isAddressee) {
            throw new IllegalArgumentException("You are not part of this friendship");
        }

        friendshipRepository.delete(friendship);

        return FriendDto.FriendshipAction.builder()
                .friendshipId(friendshipId)
                .status("REMOVED")
                .message("Friendship removed")
                .build();
    }

    private FriendDto.FriendInfo mapToFriendInfo(Friendship friendship, UUID currentUserId) {
        // Determine which user is "the friend" (the other person)
        User friend = friendship.getRequester().getUserId().equals(currentUserId)
                ? friendship.getAddressee()
                : friendship.getRequester();

        return FriendDto.FriendInfo.builder()
                .friendshipId(friendship.getFriendshipId().toString())
                .friendUserId(friend.getUserId().toString())
                .displayName(friend.getDisplayName())
                .avatarUrl(friend.getAvatarUrl())
                .bio(friend.getBio())
                .location(friend.getLocation())
                .reliabilityScore(friend.getReliabilityScore())
                .gamesCount(friend.getGamesCount())
                .status(friendship.getStatus().name())
                .createdAt(friendship.getCreatedAt() != null ? friendship.getCreatedAt().toString() : null)
                .build();
    }
}
