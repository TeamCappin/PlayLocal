package com.backend.playlocal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

public class EndorsementDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @jakarta.validation.constraints.NotNull
        private UUID endorsedUserId;
        @jakarta.validation.constraints.NotNull
        private UUID gameId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    // US 3.3 Organizer Endorsements
    public static class Response {
        private UUID endorsementId;
        private UUID endorserId;
        private String endorserName;
        private UUID endorsedUserId;
        private UUID gameId;
        private String gameTitle;
        private Instant gameDate;
        private String label;
        private Instant createdAt;
    }
}
