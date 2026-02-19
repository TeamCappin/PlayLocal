package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.service.ConnectionSignalsService;
import com.backend.playlocal.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final ConnectionSignalsService connectionSignalsService;

    public UserController(UserService userService, ConnectionSignalsService connectionSignalsService) {
        this.userService = userService;
        this.connectionSignalsService = connectionSignalsService;
    }

    /**
     * Search users by name or email.
     * GET /api/v1/users/search?q=query&page=0&size=20
     */
    @GetMapping("/search")
    public ResponseEntity<UserDto.SearchResponse> searchUsers(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UserDto.SearchResponse response = userService.searchUsers(q, page, Math.min(size, 100));
        return ResponseEntity.ok(response);
    }

    /**
     * Update the authenticated user's profile.
     * PUT /api/v1/users/profile
     */
    @PutMapping("/profile")
    public ResponseEntity<AuthDto.UserDto> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UserDto.UpdateProfileRequest request) {
        String userId = authentication.getName();
        AuthDto.UserDto updatedUser = userService.updateProfile(userId, request);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Get a user's public profile by ID.
     * GET /api/v1/users/{userId}/profile
     * Secured: Requires authentication [US-1.3 Privacy Defaults]
     */
    @GetMapping("/{userId}/profile")
    public ResponseEntity<AuthDto.UserDto> getUserProfile(@PathVariable String userId) {
        AuthDto.UserDto user = userService.getUserProfile(userId);
        return ResponseEntity.ok(user);
    }

    /**
     * Get a user's public profile by slug (URL-friendly display name).
     * GET /api/v1/users/slug/{slug}/profile
     * Secured: Requires authentication [US-1.3 Privacy Defaults]
     */
    @GetMapping("/slug/{slug}/profile")
    public ResponseEntity<AuthDto.UserDto> getProfileBySlug(@PathVariable String slug) {
        AuthDto.UserDto user = userService.getProfileBySlug(slug);
        return ResponseEntity.ok(user);
    }

    /**
     * US-32: Get connection signals (mutual friends + co-play in last 60 days) between current user and target.
     * Signals visible only to logged-in users.
     */
    @GetMapping("/{targetUserId}/connection-signals")
    public ResponseEntity<UserDto.ConnectionSignals> getConnectionSignals(
            @PathVariable String targetUserId,
            Authentication authentication) {
        UUID viewerId = UUID.fromString(authentication.getName());
        UUID targetId = UUID.fromString(targetUserId);
        UserDto.ConnectionSignals signals = connectionSignalsService.getSignals(viewerId, targetId);
        return ResponseEntity.ok(signals);
    }

    /**
     * US-32: Batch get connection signals for multiple users (e.g. roster). No N+1.
     */
    @PostMapping("/connection-signals")
    public ResponseEntity<UserDto.ConnectionSignalsBatchResponse> getConnectionSignalsBatch(
            @Valid @RequestBody UserDto.ConnectionSignalsBatchRequest request,
            Authentication authentication) {
        UUID viewerId = UUID.fromString(authentication.getName());
        List<UUID> targetIds = request.getUserIds().stream()
                .map(UUID::fromString)
                .collect(Collectors.toList());
        var signalsByUserId = connectionSignalsService.getSignalsBatch(viewerId, targetIds);
        return ResponseEntity.ok(new UserDto.ConnectionSignalsBatchResponse(signalsByUserId));
    }
}
