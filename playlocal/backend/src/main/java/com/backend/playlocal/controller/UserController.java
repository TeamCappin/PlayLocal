package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
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
     */
    @GetMapping("/{userId}/profile")
    public ResponseEntity<AuthDto.UserDto> getUserProfile(@PathVariable String userId) {
        AuthDto.UserDto user = userService.getUserProfile(userId);
        return ResponseEntity.ok(user);
    }

    /**
     * Get a user's public profile by slug (URL-friendly display name).
     * GET /api/v1/users/slug/{slug}/profile
     */
    @GetMapping("/slug/{slug}/profile")
    public ResponseEntity<AuthDto.UserDto> getProfileBySlug(@PathVariable String slug) {
        AuthDto.UserDto user = userService.getProfileBySlug(slug);
        return ResponseEntity.ok(user);
    }
}
