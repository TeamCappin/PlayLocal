package com.backend.playlocal.model.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class UserDto {

    private UserDto() {
        // Private constructor to prevent instantiation
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateProfileRequest {
        @Size(max = 100, message = "Display name must be at most 100 characters")
        private String displayName;

        @Size(max = 500, message = "Bio must be at most 500 characters")
        private String bio;

        @Size(max = 100, message = "Location must be at most 100 characters")
        private String location;

        private String defaultIntensity;

        private String availability;

        @Size(max = 20, message = "Phone number must be at most 20 characters")
        private String phone;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateUsernameRequest {
        @NotBlank(message = "Username is required")
        private String username;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsernameLookupResponse {
        private String userId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchResponse {
        private List<AuthDto.UserDto> users;
        private long totalElements;
        private int totalPages;
        private int currentPage;
    }

    /**
     * US-32: Mutual connections and recent co-play signals.
     * Visible only to logged-in users.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConnectionSignals {
        private int mutualFriendCount;
        private int coPlayCount;
    }

    /** Request body for batch connection signals (e.g. roster). */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConnectionSignalsBatchRequest {
        @NotNull(message = "userIds is required")
        private List<String> userIds;
    }

    /** Response: map of target userId -> ConnectionSignals. */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConnectionSignalsBatchResponse {
        private java.util.Map<String, ConnectionSignals> signalsByUserId;
    }
}
