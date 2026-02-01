package com.backend.playlocal.model.dto;

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
    public static class SearchResponse {
        private List<AuthDto.UserDto> users;
        private long totalElements;
        private int totalPages;
        private int currentPage;
    }
}
