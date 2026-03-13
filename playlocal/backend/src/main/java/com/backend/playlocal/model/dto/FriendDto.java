package com.backend.playlocal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class FriendDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FriendInfo {
        private String friendshipId;
        private String friendUserId;
        private String displayName;
        private String avatarUrl;
        private String bio;
        private String location;
        private Float reliabilityScore;
        private Integer gamesCount;
        private String status; // PENDING, ACCEPTED
        private String createdAt;
        private Boolean profileRestricted; // US-7.12: true when viewer cannot see full profile
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FriendsListResponse {
        private List<FriendInfo> friends;
        private List<FriendInfo> pendingReceived;
        private List<FriendInfo> pendingSent;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FriendshipAction {
        private String friendshipId;
        private String status;
        private String message;
    }
}
