package com.backend.playlocal.model.dto;

import lombok.*;

import java.util.List;

/**
 * DTOs for Organizer Quality Score (OQS).
 * Implements: US-6.1 - Organizer Quality Score
 */
public class OrganizerQualityDto {

    /**
     * OQS response shown on organizer profiles and game details.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OqsResponse {
        private String userId;
        private String displayName;
        private Float oqsScore;
        private Float gameCompletionRate;
        private Float repeatPlayerRate;
        private Integer totalGamesHosted;
        private Integer completedGames;
        private Integer cancelledGames;
        private Integer totalUniquePlayers;
        private Integer repeatPlayers;
        private String confidenceLevel;  // LOW, MEDIUM, HIGH
        private String confidenceDescription;
        private String lastCalculatedAt;
    }

    /**
     * Simplified OQS info for display in game cards and lists.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OqsSummary {
        private String userId;
        private Float oqsScore;
        private String confidenceLevel;
        private Integer totalGamesHosted;
    }

    /**
     * OQS history entry for audit trail display.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OqsHistoryEntry {
        private String historyId;
        private String organizerId;
        private String gameId;
        private String gameTitle;
        private Float previousOqs;
        private Float newOqs;
        private Float delta;
        private Float previousCompletionRate;
        private Float newCompletionRate;
        private Float previousRepeatRate;
        private Float newRepeatRate;
        private String reason;
        private String description;
        private String createdAt;
    }

    /**
     * OQS history response with pagination.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OqsHistoryResponse {
        private String organizerId;
        private String displayName;
        private Float currentOqs;
        private List<OqsHistoryEntry> history;
        private Long totalEntries;
        private Integer currentPage;
        private Integer totalPages;
    }

    /**
     * Info card content explaining OQS components in plain language.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OqsInfoCard {
        private Float oqsScore;
        private String overallDescription;
        
        // Game Completion Rate explanation
        private Float gameCompletionRate;
        private String completionRateDescription;
        private Integer completedGames;
        private Integer totalGames;
        
        // Repeat Player Rate explanation
        private Float repeatPlayerRate;
        private String repeatRateDescription;
        private Integer repeatPlayers;
        private Integer totalUniquePlayers;
        
        // Confidence indicator explanation
        private String confidenceLevel;
        private String confidenceDescription;
        private Integer gamesForNextLevel;
    }

    /**
     * OQS component weights (for transparency).
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OqsWeights {
        private Float completionRateWeight;
        private Float repeatPlayerRateWeight;
    }
}
