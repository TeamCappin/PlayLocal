package com.backend.playlocal.service;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.PrivacySettingsDto;
import com.backend.playlocal.model.entity.ContentVisibility;
import com.backend.playlocal.model.entity.LocationVisibilityRule;
import com.backend.playlocal.model.entity.UserPrivacySettings;
import com.backend.playlocal.repository.ContentVisibilityRepository;
import com.backend.playlocal.repository.LocationVisibilityRuleRepository;
import com.backend.playlocal.repository.UserPrivacySettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PrivacySettingsService {

    private final UserPrivacySettingsRepository privacySettingsRepository;
    private final ContentVisibilityRepository contentVisibilityRepository;
    private final LocationVisibilityRuleRepository locationVisibilityRuleRepository;

    // Visibility code constants
    private static final String VISIBILITY_PUBLIC = "public";
    private static final String VISIBILITY_FRIENDS = "friends";
    private static final String VISIBILITY_PARTICIPANTS = "participants";
    private static final String LOCATION_RULE_CONFIRMED_ONLY = "confirmed_only";

    public PrivacySettingsService(
            UserPrivacySettingsRepository privacySettingsRepository,
            ContentVisibilityRepository contentVisibilityRepository,
            LocationVisibilityRuleRepository locationVisibilityRuleRepository) {
        this.privacySettingsRepository = privacySettingsRepository;
        this.contentVisibilityRepository = contentVisibilityRepository;
        this.locationVisibilityRuleRepository = locationVisibilityRuleRepository;
    }

    /**
     * Get privacy settings for a user. Creates defaults if none exist.
     */
    @Transactional
    public PrivacySettingsDto.PrivacySettingsResponse getPrivacySettings(UUID userId) {
        UserPrivacySettings settings = privacySettingsRepository.findById(userId)
                .orElseGet(() -> createDefaultSettings(userId));
        return mapToResponse(settings);
    }

    /**
     * Update privacy settings for a user.
     */
    @Transactional
    public PrivacySettingsDto.PrivacySettingsResponse updatePrivacySettings(
            UUID userId, PrivacySettingsDto.UpdatePrivacySettingsRequest request) {
        UserPrivacySettings settings = privacySettingsRepository.findById(userId)
                .orElseGet(() -> createDefaultSettings(userId));

        if (request.getProfileVisibility() != null) {
            settings.setProfileVisibility(resolveContentVisibility(request.getProfileVisibility()));
        }
        if (request.getSkillsVisibility() != null) {
            settings.setSkillsVisibility(resolveContentVisibility(request.getSkillsVisibility()));
        }
        if (request.getHistoryVisibility() != null) {
            settings.setHistoryVisibility(resolveContentVisibility(request.getHistoryVisibility()));
        }
        if (request.getMediaDefaultVisibility() != null) {
            settings.setMediaDefaultVisibility(resolveContentVisibility(request.getMediaDefaultVisibility()));
        }
        if (request.getLocationVisibilityRule() != null) {
            settings.setLocationVisibilityRule(resolveLocationRule(request.getLocationVisibilityRule()));
        }
        if (request.getAllowProfileSearch() != null) {
            settings.setAllowProfileSearch(request.getAllowProfileSearch());
        }
        if (request.getAdPersonalizationEnabled() != null) {
            settings.setAdPersonalizationEnabled(request.getAdPersonalizationEnabled());
        }

        settings = privacySettingsRepository.save(settings);
        return mapToResponse(settings);
    }

    /**
     * Create default privacy settings for a new user.
     */
    @Transactional
    public UserPrivacySettings createDefaultSettings(UUID userId) {
        UserPrivacySettings settings = UserPrivacySettings.builder()
                .userId(userId)
                .profileVisibility(resolveContentVisibility(VISIBILITY_PUBLIC))
                .skillsVisibility(resolveContentVisibility(VISIBILITY_PUBLIC))
                .historyVisibility(resolveContentVisibility(VISIBILITY_FRIENDS))
                .mediaDefaultVisibility(resolveContentVisibility(VISIBILITY_PARTICIPANTS))
                .locationVisibilityRule(resolveLocationRule(LOCATION_RULE_CONFIRMED_ONLY))
                .allowProfileSearch(true)
                .adPersonalizationEnabled(true)
                .build();
        return privacySettingsRepository.save(settings);
    }

    /**
     * Check if a viewer can see the target user's profile.
     */
    public boolean canViewProfile(UUID targetUserId, UUID viewerUserId, boolean isFriend) {
        if (targetUserId.equals(viewerUserId)) {
            return true; // Users can always see their own profile
        }
        UserPrivacySettings settings = privacySettingsRepository.findById(targetUserId).orElse(null);
        if (settings == null) {
            return true; // Default: public
        }
        return isVisibleTo(settings.getProfileVisibility(), isFriend);
    }

    /**
     * Check if a user should appear in search results for the given viewer.
     * Friends can always find each other regardless of this setting.
     */
    public boolean isSearchable(UUID userId, boolean isFriend) {
        if (isFriend) {
            return true; // Friends can always find each other
        }
        UserPrivacySettings settings = privacySettingsRepository.findById(userId).orElse(null);
        if (settings == null) {
            return true; // Default: searchable
        }
        return Boolean.TRUE.equals(settings.getAllowProfileSearch());
    }

    private boolean isVisibleTo(ContentVisibility visibility, boolean isFriend) {
        if (visibility == null) {
            return true;
        }
        String code = visibility.getCode();
        if (VISIBILITY_PUBLIC.equals(code)) {
            return true;
        }
        if (VISIBILITY_FRIENDS.equals(code)) {
            return isFriend;
        }
        // "private" or "participants" — not visible to general viewers
        return false;
    }

    private ContentVisibility resolveContentVisibility(String code) {
        return contentVisibilityRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invalid visibility option: " + code));
    }

    private LocationVisibilityRule resolveLocationRule(String code) {
        return locationVisibilityRuleRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invalid location visibility rule: " + code));
    }

    private PrivacySettingsDto.PrivacySettingsResponse mapToResponse(UserPrivacySettings settings) {
        return PrivacySettingsDto.PrivacySettingsResponse.builder()
                .profileVisibility(
                        settings.getProfileVisibility() != null
                                ? settings.getProfileVisibility().getCode() : VISIBILITY_PUBLIC)
                .skillsVisibility(
                        settings.getSkillsVisibility() != null
                                ? settings.getSkillsVisibility().getCode() : VISIBILITY_PUBLIC)
                .historyVisibility(
                        settings.getHistoryVisibility() != null
                                ? settings.getHistoryVisibility().getCode() : VISIBILITY_FRIENDS)
                .mediaDefaultVisibility(
                        settings.getMediaDefaultVisibility() != null
                                ? settings.getMediaDefaultVisibility().getCode() : VISIBILITY_PARTICIPANTS)
                .locationVisibilityRule(
                        settings.getLocationVisibilityRule() != null
                                ? settings.getLocationVisibilityRule().getCode() : LOCATION_RULE_CONFIRMED_ONLY)
                .allowProfileSearch(Boolean.TRUE.equals(settings.getAllowProfileSearch()))
                .adPersonalizationEnabled(Boolean.TRUE.equals(settings.getAdPersonalizationEnabled()))
                .build();
    }
}
