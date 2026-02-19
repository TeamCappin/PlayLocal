package com.backend.playlocal.model.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

public class GameDto {

    private GameDto() {
        // Private constructor to prevent instantiation
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title must be at most 255 characters")
        private String title;

        private String description;

        @NotBlank(message = "Sport is required")
        private String sportName;

        // Location details
        @NotBlank(message = "Location name is required")
        @Size(max = 255, message = "Location name must be at most 255 characters")
        private String locationName;

        @Size(max = 500, message = "Address line must be at most 500 characters")
        private String addressLine;

        @Size(max = 100, message = "City must be at most 100 characters")
        private String city;
        private Float latitude;
        private Float longitude;

        private String indoorOutdoor;
        private String intensityBand;
        private String skillBand;

        @Min(value = 2, message = "Minimum players must be at least 2")
        @Builder.Default
        private Integer minPlayers = 2;

        @Max(value = 100, message = "Maximum players cannot exceed 100")
        @Builder.Default
        private Integer maxPlayers = 20;

        @Builder.Default
        private Boolean allowWaitlist = true;

        @Min(value = 0, message = "Minimum reliability must be non-negative")
        @Max(value = 100, message = "Minimum reliability cannot exceed 100")
        private Float minReliabilityRequired;

        @NotNull(message = "Start time is required")
        @Future(message = "Start time must be in the future")
        private Instant startTime;

        private Instant endTime;

        // US-4.2: Community tags
        private List<String> tagNames;

        // US-4.2: Age requirements
        @Min(value = 13, message = "Minimum age must be at least 13")
        @Max(value = 120, message = "Minimum age cannot exceed 120")
        private Integer minAge;

        @Min(value = 13, message = "Maximum age must be at least 13")
        @Max(value = 120, message = "Maximum age cannot exceed 120")
        private Integer maxAge;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GameResponse {
        private String gameId;
        private String title;
        private String description;
        private String sportName;
        // US-1.3 Privacy Defaults: `location` (exact) is visible to the game organizer
        // and confirmed participants.
        private LocationDto location;
        // US-1.3 Privacy Defaults: `approximateLocation` is visible to all users.
        private String approximateLocation;
        // US-1.3: Flag indicating if current user has access to exact location
        private Boolean hasExactLocationAccess;
        private String indoorOutdoor;
        private String intensityBand;
        private String skillBand;
        private Integer minPlayers;
        private Integer maxPlayers;
        private Boolean allowWaitlist;
        private Float minReliabilityRequired;
        private Instant startTime;
        private Instant endTime;
        private String status;
        private OrganizerDto organizer;
        private Integer confirmedCount;
        private Integer waitlistCount;
        private Instant createdAt;

        // US-4.2: Community tags and age requirements
        private List<TagDto> tags;
        private Integer minAge;
        private Integer maxAge;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationDto {
        private String name;
        private String addressLine;
        private String city;
        private Float latitude;
        private Float longitude;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrganizerDto {
        private String userId;
        private String displayName;
        private Float reliabilityScore;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantDto {
        private String participationId;
        private String userId;
        private String displayName;
        private String avatarUrl;
        private String role;
        private String joinStatus;
        private String attendanceStatus;
        private Integer waitlistPosition;
        private Float reliabilityScore;
        private Instant joinedAt;
        private Boolean isEndorsedByOrganizer;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JoinResponse {
        private String participationId;
        private String joinStatus;
        private Integer waitlistPosition;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RosterResponse {
        private List<ParticipantDto> confirmed;
        private List<ParticipantDto> waitlisted;
        private Integer maxPlayers;
        private Integer spotsAvailable;
    }

    // US-4.1 / US-4.3: Update game request (all editable fields except title/sport)
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String title;
        private String description;
        private String indoorOutdoor;
        private String intensityBand;
        private String skillBand;
        private Integer minPlayers;
        private Integer maxPlayers;
        private Boolean allowWaitlist;

        @Min(value = 0, message = "Minimum reliability must be non-negative")
        @Max(value = 100, message = "Minimum reliability cannot exceed 100")
        private Float minReliabilityRequired;

        // Location (update existing location fields)
        private String locationName;
        private String addressLine;
        private String city;
        private Float latitude;
        private Float longitude;

        private Instant startTime;
        private Instant endTime;
        private String visibility; // code: public, friends, invite

        private List<String> tagNames;
        @Min(13) @Max(120)
        private Integer minAge;
        @Min(13) @Max(120)
        private Integer maxAge;
    }

    // US-4.2: Tag DTO
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TagDto {
        private String tagId;
        private String name;
        private String tagType;
        private Boolean isRestricted;
    }

    // US-4.2: Join request with tag confirmations
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JoinRequest {
        private List<String> confirmedTagIds; // IDs of restricted tags user confirms eligibility for
    }
}
