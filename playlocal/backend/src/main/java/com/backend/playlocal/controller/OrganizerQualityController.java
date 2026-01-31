package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.OrganizerQualityDto;
import com.backend.playlocal.security.JwtService;
import com.backend.playlocal.service.OrganizerQualityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for Organizer Quality Score (OQS).
 * Implements: US-6.1 - Organizer Quality Score
 * 
 * Endpoints:
 * - GET /api/v1/users/{userId}/oqs - Get OQS for a specific user
 * - GET /api/v1/users/me/oqs - Get OQS for current user
 * - GET /api/v1/users/{userId}/oqs/info - Get OQS info card with explanations
 * - GET /api/v1/users/{userId}/oqs/history - Get OQS change history
 */
@RestController
@RequestMapping("/api/v1")
public class OrganizerQualityController {

    private final OrganizerQualityService oqsService;
    private final JwtService jwtService;

    public OrganizerQualityController(OrganizerQualityService oqsService, JwtService jwtService) {
        this.oqsService = oqsService;
        this.jwtService = jwtService;
    }

    /**
     * Get OQS for a specific user.
     * Visible on organizer profiles and game details pages.
     */
    @GetMapping("/users/{userId}/oqs")
    public ResponseEntity<OrganizerQualityDto.OqsResponse> getOqs(@PathVariable UUID userId) {
        OrganizerQualityDto.OqsResponse response = oqsService.getOqs(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get OQS for the current authenticated user.
     */
    @GetMapping("/users/me/oqs")
    public ResponseEntity<OrganizerQualityDto.OqsResponse> getMyOqs(
            @RequestHeader("Authorization") String authHeader) {
        UUID userId = extractUserId(authHeader);
        OrganizerQualityDto.OqsResponse response = oqsService.getOqs(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get OQS summary (simplified for game cards).
     */
    @GetMapping("/users/{userId}/oqs/summary")
    public ResponseEntity<OrganizerQualityDto.OqsSummary> getOqsSummary(@PathVariable UUID userId) {
        OrganizerQualityDto.OqsSummary response = oqsService.getOqsSummary(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get OQS info card with plain language explanations.
     * Used for the UI "info card" explaining OQS components.
     */
    @GetMapping("/users/{userId}/oqs/info")
    public ResponseEntity<OrganizerQualityDto.OqsInfoCard> getOqsInfoCard(@PathVariable UUID userId) {
        OrganizerQualityDto.OqsInfoCard response = oqsService.getOqsInfoCard(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get OQS info card for the current user.
     */
    @GetMapping("/users/me/oqs/info")
    public ResponseEntity<OrganizerQualityDto.OqsInfoCard> getMyOqsInfoCard(
            @RequestHeader("Authorization") String authHeader) {
        UUID userId = extractUserId(authHeader);
        OrganizerQualityDto.OqsInfoCard response = oqsService.getOqsInfoCard(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get OQS change history for an organizer.
     * Audit trail showing score changes over time.
     */
    @GetMapping("/users/{userId}/oqs/history")
    public ResponseEntity<OrganizerQualityDto.OqsHistoryResponse> getOqsHistory(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        OrganizerQualityDto.OqsHistoryResponse response = oqsService.getOqsHistory(userId, page, size);
        return ResponseEntity.ok(response);
    }

    /**
     * Get OQS change history for the current user.
     */
    @GetMapping("/users/me/oqs/history")
    public ResponseEntity<OrganizerQualityDto.OqsHistoryResponse> getMyOqsHistory(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID userId = extractUserId(authHeader);
        OrganizerQualityDto.OqsHistoryResponse response = oqsService.getOqsHistory(userId, page, size);
        return ResponseEntity.ok(response);
    }

    /**
     * Get OQS calculation weights (for transparency).
     */
    @GetMapping("/oqs/weights")
    public ResponseEntity<OrganizerQualityDto.OqsWeights> getOqsWeights() {
        OrganizerQualityDto.OqsWeights weights = OrganizerQualityDto.OqsWeights.builder()
                .completionRateWeight(0.6f)
                .repeatPlayerRateWeight(0.4f)
                .build();
        return ResponseEntity.ok(weights);
    }

    private UUID extractUserId(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtService.extractUsername(token);
        return jwtService.extractUserId(token);
    }
}
