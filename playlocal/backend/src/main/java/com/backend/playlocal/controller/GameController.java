package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.GameDto;
import com.backend.playlocal.service.GameService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/games")
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
     * Get upcoming games.
     * US-2.3: Discover Games
     * US-1.3: Filters private locations based on auth status
     */
    @GetMapping
    public ResponseEntity<List<GameDto.GameResponse>> getUpcomingGames(Authentication authentication) {
        UUID userId = null;
        if (authentication != null && authentication.isAuthenticated()) {
            try {
                userId = UUID.fromString(authentication.getName());
            } catch (IllegalArgumentException e) {
                // Ignore invalid UUIDs (e.g. anonymousUser)
            }
        }
        List<GameDto.GameResponse> games = gameService.getUpcomingGames(userId);
        return ResponseEntity.ok(games);
    }

    /**
     * Get previous games created by a user.
     * US-2.6: Get Past Games
     */ 
    @GetMapping ("/pastByUserIdNeedingAttendanceUpdate/{userId}")
    public ResponseEntity<List<GameDto.GameResponse>> getPastGames(
            @PathVariable UUID userId,
            Authentication authentication) {
        UUID authenticatedUserId = null;
        if (authentication != null && authentication.isAuthenticated()) {
            try {
                authenticatedUserId = UUID.fromString(authentication.getName());
                System.out.println("User ID received from Frontend" + userId);
                // TODO MEL - Figure out what auth needs to be done here
            } catch (IllegalArgumentException e) {
                // Ignore invalid UUIDs (e.g. anonymousUser)
            }
        }
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
    public ResponseEntity<GameDto.RosterResponse> getRoster(@PathVariable UUID gameId) {
        GameDto.RosterResponse roster = gameService.getRoster(gameId);
        return ResponseEntity.ok(roster);
    }

    /**
     * Join a game (concurrency-safe).
     * US-2.5: Join/Leave + Waitlist
     */
    @PostMapping("/{gameId}/join")
    public ResponseEntity<GameDto.JoinResponse> joinGame(
            @PathVariable UUID gameId,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        GameDto.JoinResponse response = gameService.joinGame(gameId, userId);
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
}
