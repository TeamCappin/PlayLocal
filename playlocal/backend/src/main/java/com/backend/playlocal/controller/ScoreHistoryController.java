package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.ScoreHistoryDto;
import com.backend.playlocal.service.ReliabilityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for Score History endpoints.
 * Implements: US 2.7 - Users can view Score History on their profile
 */
@RestController
@RequestMapping("/api/v1/users")
public class ScoreHistoryController {

    private final ReliabilityService reliabilityService;

    public ScoreHistoryController(ReliabilityService reliabilityService) {
        this.reliabilityService = reliabilityService;
    }

    /**
     * Get score history for a user.
     * US 2.7: Users can view a simple "Score History" list on their profile (most recent first)
     * 
     * GET /api/v1/users/{userId}/score-history?page=0&size=10
     */
    @GetMapping("/{userId}/score-history")
    public ResponseEntity<ScoreHistoryDto.ScoreHistoryResponse> getScoreHistory(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        UUID userUUID = UUID.fromString(userId);
        ScoreHistoryDto.ScoreHistoryResponse response = reliabilityService.getScoreHistory(userUUID, page, Math.min(size, 50));
        return ResponseEntity.ok(response);
    }

    /**
     * Get score history for the current authenticated user.
     * Convenience endpoint for "my score history"
     * 
     * GET /api/v1/users/me/score-history?page=0&size=10
     */
    @GetMapping("/me/score-history")
    public ResponseEntity<ScoreHistoryDto.ScoreHistoryResponse> getMyScoreHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        UUID userId = UUID.fromString(authentication.getName());
        ScoreHistoryDto.ScoreHistoryResponse response = reliabilityService.getScoreHistory(userId, page, Math.min(size, 50));
        return ResponseEntity.ok(response);
    }

    /**
     * Get score summary for a user.
     * Returns current score and attendance statistics.
     * 
     * GET /api/v1/users/{userId}/score-summary
     */
    @GetMapping("/{userId}/score-summary")
    public ResponseEntity<ScoreHistoryDto.ScoreSummary> getScoreSummary(@PathVariable String userId) {
        UUID userUUID = UUID.fromString(userId);
        ScoreHistoryDto.ScoreSummary summary = reliabilityService.getScoreSummary(userUUID);
        return ResponseEntity.ok(summary);
    }

    /**
     * Get score summary for the current authenticated user.
     * 
     * GET /api/v1/users/me/score-summary
     */
    @GetMapping("/me/score-summary")
    public ResponseEntity<ScoreHistoryDto.ScoreSummary> getMyScoreSummary(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        ScoreHistoryDto.ScoreSummary summary = reliabilityService.getScoreSummary(userId);
        return ResponseEntity.ok(summary);
    }
}
