package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.FriendDto;
import com.backend.playlocal.service.FriendshipService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({ "/api/v1/friends", "/api/v2/friends" })
public class FriendController {

    private final FriendshipService friendshipService;

    public FriendController(FriendshipService friendshipService) {
        this.friendshipService = friendshipService;
    }

    /**
     * Get all friends and pending requests for the current user.
     * GET /api/v1/friends
     */
    @GetMapping
    public ResponseEntity<FriendDto.FriendsListResponse> getFriends(Authentication authentication) {
        String userId = authentication.getName();
        FriendDto.FriendsListResponse response = friendshipService.getFriendsList(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Send a friend request to another user.
     * POST /api/v1/friends/request/{userId}
     */
    @PostMapping("/request/{addresseeId}")
    public ResponseEntity<FriendDto.FriendshipAction> sendFriendRequest(
            Authentication authentication,
            @PathVariable String addresseeId) {
        String userId = authentication.getName();
        FriendDto.FriendshipAction response = friendshipService.sendFriendRequest(userId, addresseeId);
        return ResponseEntity.ok(response);
    }

    /**
     * Accept a friend request.
     * POST /api/v1/friends/{friendshipId}/accept
     */
    @PostMapping("/{friendshipId}/accept")
    public ResponseEntity<FriendDto.FriendshipAction> acceptFriendRequest(
            Authentication authentication,
            @PathVariable String friendshipId) {
        String userId = authentication.getName();
        FriendDto.FriendshipAction response = friendshipService.acceptFriendRequest(userId, friendshipId);
        return ResponseEntity.ok(response);
    }

    /**
     * Decline a friend request.
     * POST /api/v1/friends/{friendshipId}/decline
     */
    @PostMapping("/{friendshipId}/decline")
    public ResponseEntity<FriendDto.FriendshipAction> declineFriendRequest(
            Authentication authentication,
            @PathVariable String friendshipId) {
        String userId = authentication.getName();
        FriendDto.FriendshipAction response = friendshipService.declineFriendRequest(userId, friendshipId);
        return ResponseEntity.ok(response);
    }

    /**
     * Remove a friend or cancel a pending request.
     * DELETE /api/v1/friends/{friendshipId}
     */
    @DeleteMapping("/{friendshipId}")
    public ResponseEntity<FriendDto.FriendshipAction> removeFriend(
            Authentication authentication,
            @PathVariable String friendshipId) {
        String userId = authentication.getName();
        FriendDto.FriendshipAction response = friendshipService.removeFriend(userId, friendshipId);
        return ResponseEntity.ok(response);
    }
}
