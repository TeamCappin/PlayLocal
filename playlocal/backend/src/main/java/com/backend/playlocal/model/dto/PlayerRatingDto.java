package com.backend.playlocal.model.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Data Transfer Objects (DTO) associated with creating and handling player ratings.
 * This class groups the request schemas and standard response schema.
 */
public class PlayerRatingDto {

    /**
     * DTO for requesting the creation of a new player rating.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotNull
        private UUID gameId;

        @NotNull
        private UUID rateeId;

        /** Rating value must be between 1 and 5 stars. */
        @Min(1)
        @Max(5)
        private int rating;

        /** Optional plaintext comment conveying feedback. */
        @Size(max = 500, message = "Comment must not exceed 500 characters")
        private String comment;
    }

    /**
     * DTO for updating an existing player rating within the allowed time limit.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        /** Rating value must be between 1 and 5 stars. */
        @Min(1)
        @Max(5)
        private int rating;

        /** Optional plaintext comment conveying feedback. */
        @Size(max = 500, message = "Comment must not exceed 500 characters")
        private String comment;
    }

    /**
     * DTO for returning player rating data back to API clients.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private UUID ratingId;
        private UUID gameId;
        private UUID raterId;
        private String raterName; // Useful for UI
        private UUID rateeId;
        private int rating;
        private String comment;
        private boolean isFlagged;
        private Instant createdAt;
        private Instant updatedAt;
    }
}
