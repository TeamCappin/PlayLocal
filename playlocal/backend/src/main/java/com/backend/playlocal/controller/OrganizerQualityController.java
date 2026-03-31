package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.OrganizerQualityDto;
import com.backend.playlocal.service.OrganizerQualityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for Organizer Quality Score (OQS).
 * Implements: US-6.1 - Organizer Quality Score
 * 
 * Endpoints:
 * - GET /api/v2/organizers/{organizerId}/oqs - Get OQS for a specific organizer
 * - GET /api/v2/organizers/me/oqs - Get OQS for current authenticated organizer
 * - GET /api/v2/organizers/{organizerId}/oqs/info - Get OQS info card with explanations
 * - GET /api/v2/organizers/{organizerId}/oqs/history - Get OQS change history
 */
@RestController
@RequestMapping("/api/v2/organizers")
public class OrganizerQualityController {

    private final OrganizerQualityService oqsService;

    public OrganizerQualityController(OrganizerQualityService oqsService) {
        this.oqsService = oqsService;
    }

    /**
     * Get OQS for a specific user.
     * Visible on organizer profiles and game details pages.
     */
    @GetMapping("/{organizerId}/oqs")
    public ResponseEntity<OrganizerQualityDto.OqsResponse> getOqs(@PathVariable String organizerId) {
        UUID organizerUUID = UUID.fromString(organizerId);
        OrganizerQualityDto.OqsResponse response = oqsService.getOqs(organizerUUID);
        return ResponseEntity.ok(response);
    }

    /**
     * Get OQS for the current authenticated user.
     */
    @GetMapping("/me/oqs")
    public ResponseEntity<OrganizerQualityDto.OqsResponse> getMyOqs(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        UUID organizerId = oqsService.getOrganizerIdForUser(userId);
        OrganizerQualityDto.OqsResponse response = oqsService.getOqs(organizerId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get OQS summary (simplified for game cards).
     */
    @GetMapping("/{organizerId}/oqs/summary")
    public ResponseEntity<OrganizerQualityDto.OqsSummary> getOqsSummary(@PathVariable String organizerId) {
        UUID organizerUUID = UUID.fromString(organizerId);
        OrganizerQualityDto.OqsSummary response = oqsService.getOqsSummary(organizerUUID);
        return ResponseEntity.ok(response);
    }

    /**
     * Get OQS info card with plain language explanations.
     * Used for the UI "info card" explaining OQS components.
     */
    @GetMapping("/{organizerId}/oqs/info")
    public ResponseEntity<OrganizerQualityDto.OqsInfoCard> getOqsInfoCard(@PathVariable String organizerId) {
        UUID organizerUUID = UUID.fromString(organizerId);
        OrganizerQualityDto.OqsInfoCard response = oqsService.getOqsInfoCard(organizerUUID);
        return ResponseEntity.ok(response);
    }

    /**
     * Get OQS info card for the current user.
     */
    @GetMapping("/me/oqs/info")
    public ResponseEntity<OrganizerQualityDto.OqsInfoCard> getMyOqsInfoCard(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        UUID organizerId = oqsService.getOrganizerIdForUser(userId);
        OrganizerQualityDto.OqsInfoCard response = oqsService.getOqsInfoCard(organizerId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get OQS change history for an organizer.
     * Audit trail showing score changes over time.
     */
    @GetMapping("/{organizerId}/oqs/history")
    public ResponseEntity<OrganizerQualityDto.OqsHistoryResponse> getOqsHistory(
            @PathVariable String organizerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID organizerUUID = UUID.fromString(organizerId);
        OrganizerQualityDto.OqsHistoryResponse response = oqsService.getOqsHistory(organizerUUID, page, Math.min(size, 50));
        return ResponseEntity.ok(response);
    }

    /**
     * Get OQS change history for the current user.
     */
    @GetMapping("/me/oqs/history")
    public ResponseEntity<OrganizerQualityDto.OqsHistoryResponse> getMyOqsHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID userId = UUID.fromString(authentication.getName());
        UUID organizerId = oqsService.getOrganizerIdForUser(userId);
        OrganizerQualityDto.OqsHistoryResponse response = oqsService.getOqsHistory(organizerId, page, Math.min(size, 50));
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
}