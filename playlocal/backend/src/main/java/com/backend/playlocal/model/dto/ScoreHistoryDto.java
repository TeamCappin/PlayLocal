package com.backend.playlocal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class ScoreHistoryDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreHistoryEntry {
        private String scoreHistoryId;
        private String oduserId;
        private String gameId;
        private String gameTitle;  // denormalized for display
        private float previousScore;
        private float newScore;
        private float delta;
        private String reason;  // ATTENDANCE, NO_SHOW, etc.
        private String description;
        private String createdAt;
        private String createdByUserId;
        private String createdByDisplayName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreHistoryResponse {
        private String userId;
        private String displayName;
        private float currentScore;
        private List<ScoreHistoryEntry> history;
        private long totalEntries;
        private int currentPage;
        private int totalPages;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreSummary {
        private String userId;
        private float currentScore;
        private int attendedCount;
        private int noShowCount;
        private int gamesCount;
        private float attendanceRate;  // percentage
    }
}
