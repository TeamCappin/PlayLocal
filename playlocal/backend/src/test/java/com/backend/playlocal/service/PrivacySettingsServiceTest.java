package com.backend.playlocal.service;

import com.backend.playlocal.model.dto.PrivacySettingsDto;
import com.backend.playlocal.model.entity.ContentVisibility;
import com.backend.playlocal.model.entity.LocationVisibilityRule;
import com.backend.playlocal.model.entity.UserPrivacySettings;
import com.backend.playlocal.repository.ContentVisibilityRepository;
import com.backend.playlocal.repository.LocationVisibilityRuleRepository;
import com.backend.playlocal.repository.UserPrivacySettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PrivacySettingsServiceTest {

    @Mock
    private UserPrivacySettingsRepository privacySettingsRepository;

    @Mock
    private ContentVisibilityRepository contentVisibilityRepository;

    @Mock
    private LocationVisibilityRuleRepository locationVisibilityRuleRepository;

    @InjectMocks
    private PrivacySettingsService privacySettingsService;

    private UUID userId;
    private ContentVisibility publicVisibility;
    private ContentVisibility friendsVisibility;
    private ContentVisibility privateVisibility;
    private ContentVisibility participantsVisibility;
    private LocationVisibilityRule confirmedOnlyRule;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        publicVisibility = ContentVisibility.builder()
                .contentVisibilityId(UUID.randomUUID())
                .code("public")
                .description("Visible to all")
                .build();

        friendsVisibility = ContentVisibility.builder()
                .contentVisibilityId(UUID.randomUUID())
                .code("friends")
                .description("Visible to friends")
                .build();

        privateVisibility = ContentVisibility.builder()
                .contentVisibilityId(UUID.randomUUID())
                .code("private")
                .description("Visible only to owner")
                .build();

        participantsVisibility = ContentVisibility.builder()
                .contentVisibilityId(UUID.randomUUID())
                .code("participants")
                .description("Visible to participants")
                .build();

        confirmedOnlyRule = LocationVisibilityRule.builder()
                .locationVisibilityRuleId(UUID.randomUUID())
                .code("confirmed_only")
                .description("Confirmed only")
                .build();
    }

    @Test
    @DisplayName("US-7.12: getPrivacySettings returns existing settings")
    void getPrivacySettings_ExistingSettings_ReturnsSettings() {
        UserPrivacySettings settings = UserPrivacySettings.builder()
                .userId(userId)
                .profileVisibility(publicVisibility)
                .skillsVisibility(friendsVisibility)
                .historyVisibility(friendsVisibility)
                .mediaDefaultVisibility(participantsVisibility)
                .locationVisibilityRule(confirmedOnlyRule)
                .allowProfileSearch(true)
                .build();

        when(privacySettingsRepository.findById(userId)).thenReturn(Optional.of(settings));

        PrivacySettingsDto.PrivacySettingsResponse response = privacySettingsService.getPrivacySettings(userId);

        assertThat(response.getProfileVisibility()).isEqualTo("public");
        assertThat(response.getSkillsVisibility()).isEqualTo("friends");
        assertThat(response.getHistoryVisibility()).isEqualTo("friends");
        assertThat(response.getMediaDefaultVisibility()).isEqualTo("participants");
        assertThat(response.getLocationVisibilityRule()).isEqualTo("confirmed_only");
        assertThat(response.isAllowProfileSearch()).isTrue();
    }

    @Test
    @DisplayName("US-7.12: getPrivacySettings creates defaults for new user")
    void getPrivacySettings_NoSettings_CreatesDefaults() {
        when(privacySettingsRepository.findById(userId)).thenReturn(Optional.empty());
        when(contentVisibilityRepository.findByCode("public")).thenReturn(Optional.of(publicVisibility));
        when(contentVisibilityRepository.findByCode("friends")).thenReturn(Optional.of(friendsVisibility));
        when(contentVisibilityRepository.findByCode("participants")).thenReturn(Optional.of(participantsVisibility));
        when(locationVisibilityRuleRepository.findByCode("confirmed_only")).thenReturn(Optional.of(confirmedOnlyRule));
        when(privacySettingsRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        PrivacySettingsDto.PrivacySettingsResponse response = privacySettingsService.getPrivacySettings(userId);

        assertThat(response.getProfileVisibility()).isEqualTo("public");
        assertThat(response.isAllowProfileSearch()).isTrue();
        verify(privacySettingsRepository).save(any(UserPrivacySettings.class));
    }

    @Test
    @DisplayName("US-7.12: updatePrivacySettings updates profile visibility")
    void updatePrivacySettings_UpdatesProfileVisibility() {
        UserPrivacySettings settings = UserPrivacySettings.builder()
                .userId(userId)
                .profileVisibility(publicVisibility)
                .skillsVisibility(publicVisibility)
                .historyVisibility(friendsVisibility)
                .mediaDefaultVisibility(participantsVisibility)
                .locationVisibilityRule(confirmedOnlyRule)
                .allowProfileSearch(true)
                .build();

        when(privacySettingsRepository.findById(userId)).thenReturn(Optional.of(settings));
        when(contentVisibilityRepository.findByCode("private")).thenReturn(Optional.of(privateVisibility));
        when(privacySettingsRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        PrivacySettingsDto.UpdatePrivacySettingsRequest request =
                PrivacySettingsDto.UpdatePrivacySettingsRequest.builder()
                        .profileVisibility("private")
                        .build();

        PrivacySettingsDto.PrivacySettingsResponse response =
                privacySettingsService.updatePrivacySettings(userId, request);

        assertThat(response.getProfileVisibility()).isEqualTo("private");
    }

    @Test
    @DisplayName("US-7.12: updatePrivacySettings updates allowProfileSearch")
    void updatePrivacySettings_UpdatesAllowProfileSearch() {
        UserPrivacySettings settings = UserPrivacySettings.builder()
                .userId(userId)
                .profileVisibility(publicVisibility)
                .skillsVisibility(publicVisibility)
                .historyVisibility(friendsVisibility)
                .mediaDefaultVisibility(participantsVisibility)
                .locationVisibilityRule(confirmedOnlyRule)
                .allowProfileSearch(true)
                .build();

        when(privacySettingsRepository.findById(userId)).thenReturn(Optional.of(settings));
        when(privacySettingsRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        PrivacySettingsDto.UpdatePrivacySettingsRequest request =
                PrivacySettingsDto.UpdatePrivacySettingsRequest.builder()
                        .allowProfileSearch(false)
                        .build();

        PrivacySettingsDto.PrivacySettingsResponse response =
                privacySettingsService.updatePrivacySettings(userId, request);

        assertThat(response.isAllowProfileSearch()).isFalse();
    }

    @Test
    @DisplayName("US-7.12: canViewProfile returns true for own profile")
    void canViewProfile_OwnProfile_ReturnsTrue() {
        boolean result = privacySettingsService.canViewProfile(userId, userId, false);
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("US-7.12: canViewProfile returns true for public profile")
    void canViewProfile_PublicProfile_ReturnsTrue() {
        UUID viewerId = UUID.randomUUID();
        UserPrivacySettings settings = UserPrivacySettings.builder()
                .userId(userId)
                .profileVisibility(publicVisibility)
                .build();

        when(privacySettingsRepository.findById(userId)).thenReturn(Optional.of(settings));

        boolean result = privacySettingsService.canViewProfile(userId, viewerId, false);
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("US-7.12: canViewProfile returns false for friends-only profile when not friend")
    void canViewProfile_FriendsOnly_NotFriend_ReturnsFalse() {
        UUID viewerId = UUID.randomUUID();
        UserPrivacySettings settings = UserPrivacySettings.builder()
                .userId(userId)
                .profileVisibility(friendsVisibility)
                .build();

        when(privacySettingsRepository.findById(userId)).thenReturn(Optional.of(settings));

        boolean result = privacySettingsService.canViewProfile(userId, viewerId, false);
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("US-7.12: canViewProfile returns true for friends-only profile when friend")
    void canViewProfile_FriendsOnly_IsFriend_ReturnsTrue() {
        UUID viewerId = UUID.randomUUID();
        UserPrivacySettings settings = UserPrivacySettings.builder()
                .userId(userId)
                .profileVisibility(friendsVisibility)
                .build();

        when(privacySettingsRepository.findById(userId)).thenReturn(Optional.of(settings));

        boolean result = privacySettingsService.canViewProfile(userId, viewerId, true);
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("US-7.12: canViewProfile returns false for private profile")
    void canViewProfile_Private_ReturnsFalse() {
        UUID viewerId = UUID.randomUUID();
        UserPrivacySettings settings = UserPrivacySettings.builder()
                .userId(userId)
                .profileVisibility(privateVisibility)
                .build();

        when(privacySettingsRepository.findById(userId)).thenReturn(Optional.of(settings));

        boolean result = privacySettingsService.canViewProfile(userId, viewerId, true);
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("US-7.12: isSearchable returns false for non-friend when allowProfileSearch is false")
    void isSearchable_DisabledSearch_NonFriend_ReturnsFalse() {
        UserPrivacySettings settings = UserPrivacySettings.builder()
                .userId(userId)
                .allowProfileSearch(false)
                .build();

        when(privacySettingsRepository.findById(userId)).thenReturn(Optional.of(settings));

        boolean result = privacySettingsService.isSearchable(userId, false);
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("US-7.12: isSearchable returns true for friend even when allowProfileSearch is false")
    void isSearchable_DisabledSearch_Friend_ReturnsTrue() {
        boolean result = privacySettingsService.isSearchable(userId, true);
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("US-7.12: isSearchable returns true by default")
    void isSearchable_NoSettings_ReturnsTrue() {
        when(privacySettingsRepository.findById(userId)).thenReturn(Optional.empty());

        boolean result = privacySettingsService.isSearchable(userId, false);
        assertThat(result).isTrue();
    }
}
