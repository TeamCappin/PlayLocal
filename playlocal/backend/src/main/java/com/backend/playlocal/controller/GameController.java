package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.GameDto;
import com.backend.playlocal.service.GameService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({ "/api/v1/games", "/api/v2/games" })
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    /**
     * Create a new game.
     * US-2.1: Create Game
     */
    @PostMapping
    public ResponseEntity<GameDto.GameResponse> createGame(
            @Valid @RequestBody GameDto.CreateRequest request,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        GameDto.GameResponse response = gameService.createGame(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get upcoming games with optional geospatial filtering.
     * US-2.3: Discover Games 
     * US-1.3: Filters private locations based on auth status
     */
    @GetMapping
    public ResponseEntity<List<GameDto.GameResponse>> getUpcomingGames(
            @RequestParam(required = false) Float lat,
            @RequestParam(required = false) Float lon,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) String sportName,
            @RequestParam(required = false) String skillLevel,
            @RequestParam(required = false) String locationType,
            @RequestParam(required = false) String intensity,
            Authentication authentication) {
        UUID userId = null;
        if (authentication != null && authentication.isAuthenticated()) {
            try {
                userId = UUID.fromString(authentication.getName());
            } catch (IllegalArgumentException e) {
                // Ignore invalid UUIDs (e.g. anonymousUser)
            }
        }

        // If location parameters are provided, use geospatial search, else use simple upcoming games query without the distance filtering
        if (lat != null && lon != null) {
            List<GameDto.GameResponse> games = gameService.findNearbyGames(
                    lat, lon, radiusKm, sportName, skillLevel, locationType, intensity, userId);
            return ResponseEntity.ok(games);
        } else {
            List<GameDto.GameResponse> games = gameService.getUpcomingGames(
                    sportName, skillLevel, locationType, intensity, userId);
            return ResponseEntity.ok(games);
        }
    }

    /**
     * Get game participation for a specific userId and gameID.
     * US-2.6: Get Game Participation
     */
    @GetMapping("/gameParticipation/{gameId}")
    public ResponseEntity<GameDto.ParticipantDto> getGameParticipation(
            @PathVariable UUID gameId,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        GameDto.ParticipantDto participation = gameService.getGameParticipation(gameId, userId);
        return ResponseEntity.ok(participation);
    }

    /**
     * Get previous games of a user for which join status has been confirmed and
     * game not cancelled.
     * US-2.6: Get Past Games
     */
    @GetMapping("/past")
    public ResponseEntity<List<GameDto.GameResponse>> getPastGames(
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        List<GameDto.GameResponse> games = gameService.getPastGames(userId);
        return ResponseEntity.ok(games);
    }

    /**
     * Get previous games created by a user for which the rsvp roster needs to be
     * updated.
     * US-2.6: Get Past Games Needing Attendance Update
     */
    @GetMapping("/pastByUserIdNeedingAttendanceUpdate")
    public ResponseEntity<List<GameDto.GameResponse>> getPastGamesForUserNeedingAttendanceUpdate(
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        List<GameDto.GameResponse> games = gameService.getPastGamesForUserNeedingAttendanceUpdate(userId);
        return ResponseEntity.ok(games);
    }

    /**
     * Get game by ID.
     * US-2.4: Game Page
     * US-1.3: Hides exact location if user is not confirmed participant
     */
    @GetMapping("/{gameId}")
    public ResponseEntity<GameDto.GameResponse> getGameById(@PathVariable UUID gameId, Authentication authentication) {
        UUID userId = null;
        if (authentication != null && authentication.isAuthenticated()) {
            try {
                userId = UUID.fromString(authentication.getName());
            } catch (IllegalArgumentException e) {
                // Ignore invalid UUIDs (e.g. anonymousUser)
            }
        }
        GameDto.GameResponse game = gameService.getGameById(gameId, userId);
        return ResponseEntity.ok(game);
    }

    /**
     * Get game roster (confirmed + waitlisted participants).
     * US-2.4: Game Page
     */
    @GetMapping("/{gameId}/roster")
    public ResponseEntity<GameDto.RosterResponse> getRoster(@PathVariable UUID gameId, Authentication authentication) {
        UUID requestingUserId = requireAuthenticatedUserId(authentication);
        GameDto.RosterResponse roster = gameService.getRoster(gameId, requestingUserId);
        return ResponseEntity.ok(roster);
    }

    /**
     * Join a game (concurrency-safe).
     * US-2.5: Join/Leave + Waitlist
     * US-4.2: Community-Specific Game Filters (with tag confirmations)
     */
    @PostMapping("/{gameId}/join")
    public ResponseEntity<GameDto.JoinResponse> joinGame(
            @PathVariable UUID gameId,
            @RequestBody(required = false) GameDto.JoinRequest joinRequest,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        GameDto.JoinResponse response = gameService.joinGame(gameId, userId, joinRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * Leave a game.
     * US-2.5: Join/Leave + Waitlist
     */
    @DeleteMapping("/{gameId}/leave")
    public ResponseEntity<Void> leaveGame(
            @PathVariable UUID gameId,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        gameService.leaveGame(gameId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Update game settings.
     * US-4.1: Organizer can change threshold before game starts
     */
    @PutMapping("/{gameId}")
    public ResponseEntity<GameDto.GameResponse> updateGame(
            @PathVariable UUID gameId,
            @Valid @RequestBody GameDto.UpdateRequest request,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        GameDto.GameResponse response = gameService.updateGame(gameId, userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Cancel a game (organizer only).
     * US-2.4: Game Page - Organizer controls to cancel the game
     */
    @DeleteMapping("/{gameId}")
    public ResponseEntity<GameDto.GameResponse> cancelGame(
            @PathVariable UUID gameId,
            Authentication authentication) {
        UUID userId = requireAuthenticatedUserId(authentication);
        GameDto.GameResponse response = gameService.cancelGame(gameId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Mark a game as completed (organizer only).
     */
    @PostMapping("/{gameId}/complete")
    public ResponseEntity<GameDto.GameResponse> completeGame(
            @PathVariable UUID gameId,
            Authentication authentication) {
        UUID userId = requireAuthenticatedUserId(authentication);
        GameDto.GameResponse response = gameService.completeGame(gameId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get organizer progression (provisional/full and eligible completed games) for a game.
     */
    @GetMapping("/{gameId}/organizer-progress")
    public ResponseEntity<GameDto.OrganizerProgressResponse> getOrganizerProgress(@PathVariable UUID gameId) {
        GameDto.OrganizerProgressResponse response = gameService.getOrganizerProgress(gameId);
        return ResponseEntity.ok(response);
    }

    /**
     * Archive a game (organizer only).
     */
    @PostMapping("/{gameId}/archive")
    public ResponseEntity<GameDto.GameResponse> archiveGame(
            @PathVariable UUID gameId,
            Authentication authentication) {
        UUID userId = requireAuthenticatedUserId(authentication);
        GameDto.GameResponse response = gameService.archiveGame(gameId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all available community tags.
     * US-4.2: Community-Specific Game Filters
     */
    @GetMapping("/tags")
    public ResponseEntity<List<GameDto.TagDto>> getAllTags() {
        List<GameDto.TagDto> tags = gameService.getAllTags();
        return ResponseEntity.ok(tags);
    }

    private UUID requireAuthenticatedUserId(Authentication authentication) {
        if (authentication == null) {
            throw new BadCredentialsException("Authentication is required");
        }

        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException e) {
            throw new BadCredentialsException("Invalid authentication principal");
        }
    }
}
