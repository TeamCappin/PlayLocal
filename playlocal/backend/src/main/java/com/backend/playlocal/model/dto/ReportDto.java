package com.backend.playlocal.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

public class ReportDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String reportedUserId;
        private String gameId;
        private String endorsementId;

        @NotNull(message = "Report type is required")
        private String reportType; // HARASSMENT, SPORTSMANSHIP, SAFETY, SPAM, OTHER

        @NotBlank(message = "Details are required")
        private String details;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportResponse {
        private String reportId;
        private String reporterUserId;
        private String reportedUserId;
        private String gameId;
        private String endorsementId;
        private String reportType;
        private String details;
        private String status;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResolveRequest {
        @NotNull(message = "Status is required")
        private String status; // RESOLVED_ACTION_TAKEN, RESOLVED_NO_ACTION, DISMISSED

        private String resolutionAction; // warned, suspended, banned, content_removed
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModerationQueueItem {
        private String reportId;
        private String reportType;
        private String status;
        private String reportedUserName;
        private String reporterUserName;
        private String details;
        private Instant createdAt;
    }
}
