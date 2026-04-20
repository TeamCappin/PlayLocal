package com.backend.playlocal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class PrivacySettingsDto {

    private PrivacySettingsDto() {
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrivacySettingsResponse {
        private String profileVisibility;      // public, friends, private
        private String skillsVisibility;       // public, friends, participants, private
        private String historyVisibility;      // public, friends, private
        private String mediaDefaultVisibility; // public, friends, participants, private
        private String locationVisibilityRule; // always_visible, confirmed_only, approximate, hidden
        private boolean allowProfileSearch;
        private boolean adPersonalizationEnabled;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdatePrivacySettingsRequest {
        private String profileVisibility;
        private String skillsVisibility;
        private String historyVisibility;
        private String mediaDefaultVisibility;
        private String locationVisibilityRule;
        private Boolean allowProfileSearch;
        private Boolean adPersonalizationEnabled;
    }
}
