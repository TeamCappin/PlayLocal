package com.backend.playlocal.unit;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.repository.EndorsementRepository;
import com.backend.playlocal.repository.FriendshipRepository;
import com.backend.playlocal.service.PrivacySettingsService;
import com.backend.playlocal.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserService.
 * UserStory: US-1.1 Register/Login/Logout
 * Covers profile updates and user search logic (part of user management in US).
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EndorsementRepository endorsementRepository;

    @Mock
    private PrivacySettingsService privacySettingsService;

    @Mock
    private FriendshipRepository friendshipRepository;

    @InjectMocks
    private UserService userService;

    private User user;
    private UserDto.UpdateProfileRequest updateRequest;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .userId(UUID.randomUUID())
                .email("test@example.com")
                .displayName("Test User")
                .slug("test-user-" + UUID.randomUUID())
                .status(User.UserStatus.ACTIVE)
                .reliabilityScore(100.0f)
                .build();

        updateRequest = UserDto.UpdateProfileRequest.builder()
                .displayName("Updated Name")
                .bio("New Bio")
                .build();
    }

    @Test
    @DisplayName("US-1.1: updateProfile should update fields and return dto")
    void updateProfile_Success() {
        when(userRepository.findActiveById(user.getUserId())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthDto.UserDto result = userService.updateProfile(user.getUserId().toString(), updateRequest);

        assertThat(result.getDisplayName()).isEqualTo("Updated Name");
        assertThat(result.getBio()).isEqualTo("New Bio");
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("US-1.1: updateProfile should throw ResourceNotFoundException for invalid ID")
    void updateProfile_NotFound_ThrowsException() {
        when(userRepository.findActiveById(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateProfile(user.getUserId().toString(), updateRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("US-1.1: getUserProfile should return dto")
    void getUserProfile_Success() {
        when(userRepository.findActiveById(user.getUserId())).thenReturn(Optional.of(user));

        AuthDto.UserDto result = userService.getUserProfile(user.getUserId().toString());

        assertThat(result.getEmail()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("US-1.1: searchUsers with query should call repo search")
    void searchUsers_WithQuery() {
        Page<User> page = new PageImpl<>(List.of(user));
        when(userRepository.searchByDisplayNameOrEmail(eq("query"), any(PageRequest.class))).thenReturn(page);
        List<Object[]> batchCounts = new ArrayList<>();
        batchCounts.add(new Object[]{user.getUserId(), 10L});
        when(endorsementRepository.countEndorsementsByUserIds(anyList()))
                .thenReturn(batchCounts);
        when(privacySettingsService.isSearchable(any(UUID.class), any(), anyBoolean())).thenReturn(true);
        when(privacySettingsService.canViewProfile(any(UUID.class), any(), anyBoolean())).thenReturn(true);

        UUID viewerId = UUID.randomUUID();
        UserDto.SearchResponse response = userService.searchUsers("query", 0, 10, viewerId);

        assertThat(response.getUsers()).hasSize(1);
        assertThat(response.getUsers().get(0).getEndorsementsCount()).isEqualTo(10);
        verify(userRepository).searchByDisplayNameOrEmail(eq("query"), any(PageRequest.class));
        verify(endorsementRepository).countEndorsementsByUserIds(anyList());
    }

    @Test
    @DisplayName("US-1.1: searchUsers without query should call repo findAllActive")
    void searchUsers_NoQuery() {
        Page<User> page = new PageImpl<>(List.of(user));
        when(userRepository.findAllActive(any(PageRequest.class))).thenReturn(page);
        List<Object[]> batchCounts = new ArrayList<>();
        batchCounts.add(new Object[]{user.getUserId(), 5L});
        when(endorsementRepository.countEndorsementsByUserIds(anyList()))
                .thenReturn(batchCounts);
        when(privacySettingsService.isSearchable(any(UUID.class), any(), anyBoolean())).thenReturn(true);
        when(privacySettingsService.canViewProfile(any(UUID.class), any(), anyBoolean())).thenReturn(true);

        UUID viewerId = UUID.randomUUID();
        UserDto.SearchResponse response = userService.searchUsers(null, 0, 10, viewerId);

        assertThat(response.getUsers()).hasSize(1);
        assertThat(response.getUsers().get(0).getEndorsementsCount()).isEqualTo(5);
        verify(userRepository).findAllActive(any(PageRequest.class));
        verify(endorsementRepository).countEndorsementsByUserIds(anyList());
    }

    @Test
    @DisplayName("US-1.4: getProfileBySlug should return profile when found")
    void getProfileBySlug_Success() {
        when(userRepository.findBySlugAndDeletedAtIsNull("test-user-slug")).thenReturn(Optional.of(user));

        AuthDto.UserDto result = userService.getProfileBySlug("test-user-slug");

        assertThat(result.getEmail()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("US-1.4: getProfileBySlug should throw exception when not found")
    void getProfileBySlug_NotFound() {
        when(userRepository.findBySlugAndDeletedAtIsNull(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getProfileBySlug("unknown"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    // ── US-7.12 Privacy: searchUsers ──────────────────────────────────────

    @Test
    @DisplayName("US-7.12: searchUsers should filter out non-searchable users")
    void searchUsers_FiltersNonSearchable() {
        User hiddenUser = User.builder()
                .userId(UUID.randomUUID())
                .email("hidden@example.com")
                .displayName("Hidden User")
                .slug("hidden-user")
                .status(User.UserStatus.ACTIVE)
                .reliabilityScore(80.0f)
                .build();

        Page<User> page = new PageImpl<>(List.of(user, hiddenUser));
        when(userRepository.findAllActive(any(PageRequest.class))).thenReturn(page);
        when(endorsementRepository.countEndorsementsByUserIds(anyList())).thenReturn(new ArrayList<>());

        UUID viewerId = UUID.randomUUID();
        // user is searchable, hiddenUser is not
        when(privacySettingsService.isSearchable(eq(user.getUserId()), eq(viewerId), anyBoolean())).thenReturn(true);
        when(privacySettingsService.isSearchable(eq(hiddenUser.getUserId()), eq(viewerId), anyBoolean())).thenReturn(false);
        when(privacySettingsService.canViewProfile(any(), any(), anyBoolean())).thenReturn(true);

        UserDto.SearchResponse response = userService.searchUsers(null, 0, 10, viewerId);

        assertThat(response.getUsers()).hasSize(1);
        assertThat(response.getUsers().get(0).getDisplayName()).isEqualTo("Test User");
    }

    @Test
    @DisplayName("US-7.12: searchUsers should return restricted profile when canViewProfile is false")
    void searchUsers_ReturnsRestrictedProfile() {
        user.setBio("My bio");
        user.setLocation("San Francisco");
        user.setDefaultIntensity("competitive");

        Page<User> page = new PageImpl<>(List.of(user));
        when(userRepository.findAllActive(any(PageRequest.class))).thenReturn(page);
        List<Object[]> batchCounts = new ArrayList<>();
        batchCounts.add(new Object[]{user.getUserId(), 5L});
        when(endorsementRepository.countEndorsementsByUserIds(anyList())).thenReturn(batchCounts);
        when(privacySettingsService.isSearchable(any(UUID.class), any(), anyBoolean())).thenReturn(true);
        when(privacySettingsService.canViewProfile(any(UUID.class), any(), anyBoolean())).thenReturn(false);

        UUID viewerId = UUID.randomUUID();
        UserDto.SearchResponse response = userService.searchUsers(null, 0, 10, viewerId);

        assertThat(response.getUsers()).hasSize(1);
        AuthDto.UserDto result = response.getUsers().get(0);
        assertThat(result.getProfileRestricted()).isTrue();
        assertThat(result.getReliabilityScore()).isEqualTo(100.0f);
        assertThat(result.getEndorsementsCount()).isEqualTo(5);
        assertThat(result.getDefaultIntensity()).isEqualTo("competitive");
        assertThat(result.getBio()).isNull();
        assertThat(result.getLocation()).isNull();
    }

    @Test
    @DisplayName("US-7.12: searchUsers should always show own profile as full")
    void searchUsers_ShowsOwnProfileFull() {
        user.setBio("My bio");
        user.setLocation("Oakland");

        Page<User> page = new PageImpl<>(List.of(user));
        when(userRepository.findAllActive(any(PageRequest.class))).thenReturn(page);
        when(endorsementRepository.countEndorsementsByUserIds(anyList())).thenReturn(new ArrayList<>());

        // Viewer is the same user
        UserDto.SearchResponse response = userService.searchUsers(null, 0, 10, user.getUserId());

        assertThat(response.getUsers()).hasSize(1);
        AuthDto.UserDto result = response.getUsers().get(0);
        assertThat(result.getBio()).isEqualTo("My bio");
        assertThat(result.getLocation()).isEqualTo("Oakland");
        assertThat(result.getProfileRestricted()).isNull();
    }

    // ── US-7.12 Privacy: getUserProfile with viewerId ──────────────────

    @Test
    @DisplayName("US-7.12: getUserProfile returns full profile for own profile")
    void getUserProfile_OwnProfile_ReturnsFull() {
        user.setBio("My bio");
        when(userRepository.findActiveById(user.getUserId())).thenReturn(Optional.of(user));

        AuthDto.UserDto result = userService.getUserProfile(user.getUserId().toString(), user.getUserId());

        assertThat(result.getBio()).isEqualTo("My bio");
        assertThat(result.getProfileRestricted()).isNull();
    }

    @Test
    @DisplayName("US-7.12: getUserProfile returns restricted profile for non-friend on private profile")
    void getUserProfile_PrivateProfile_ReturnsRestricted() {
        user.setBio("Secret bio");
        user.setLocation("Hidden City");
        user.setDefaultIntensity("casual");
        when(userRepository.findActiveById(user.getUserId())).thenReturn(Optional.of(user));

        UUID viewerId = UUID.randomUUID();
        when(friendshipRepository.areFriends(viewerId, user.getUserId())).thenReturn(false);
        when(privacySettingsService.canViewProfile(user.getUserId(), viewerId, false)).thenReturn(false);
        when(endorsementRepository.countByEndorsedUser_UserId(user.getUserId())).thenReturn(3L);

        AuthDto.UserDto result = userService.getUserProfile(user.getUserId().toString(), viewerId);

        assertThat(result.getProfileRestricted()).isTrue();
        assertThat(result.getReliabilityScore()).isEqualTo(100.0f);
        assertThat(result.getDefaultIntensity()).isEqualTo("casual");
        assertThat(result.getEndorsementsCount()).isEqualTo(3);
        assertThat(result.getBio()).isNull();
        assertThat(result.getLocation()).isNull();
    }

    @Test
    @DisplayName("US-7.12: getUserProfile returns full profile for friend")
    void getUserProfile_Friend_ReturnsFull() {
        user.setBio("Visible bio");
        when(userRepository.findActiveById(user.getUserId())).thenReturn(Optional.of(user));

        UUID viewerId = UUID.randomUUID();
        when(friendshipRepository.areFriends(viewerId, user.getUserId())).thenReturn(true);
        when(privacySettingsService.canViewProfile(user.getUserId(), viewerId, true)).thenReturn(true);

        AuthDto.UserDto result = userService.getUserProfile(user.getUserId().toString(), viewerId);

        assertThat(result.getBio()).isEqualTo("Visible bio");
        assertThat(result.getProfileRestricted()).isNull();
    }

    // ── US-7.12 Privacy: getProfileBySlug with viewerId ────────────────

    @Test
    @DisplayName("US-7.12: getProfileBySlug returns restricted profile for non-friend")
    void getProfileBySlug_PrivateProfile_ReturnsRestricted() {
        user.setBio("Secret bio");
        when(userRepository.findBySlugAndDeletedAtIsNull("test-slug")).thenReturn(Optional.of(user));

        UUID viewerId = UUID.randomUUID();
        when(friendshipRepository.areFriends(viewerId, user.getUserId())).thenReturn(false);
        when(privacySettingsService.canViewProfile(user.getUserId(), viewerId, false)).thenReturn(false);
        when(endorsementRepository.countByEndorsedUser_UserId(user.getUserId())).thenReturn(0L);

        AuthDto.UserDto result = userService.getProfileBySlug("test-slug", viewerId);

        assertThat(result.getProfileRestricted()).isTrue();
        assertThat(result.getBio()).isNull();
    }

    @Test
    @DisplayName("US-7.12: getProfileBySlug returns full profile for own profile")
    void getProfileBySlug_OwnProfile_ReturnsFull() {
        user.setBio("My bio");
        when(userRepository.findBySlugAndDeletedAtIsNull("test-slug")).thenReturn(Optional.of(user));

        AuthDto.UserDto result = userService.getProfileBySlug("test-slug", user.getUserId());

        assertThat(result.getBio()).isEqualTo("My bio");
        assertThat(result.getProfileRestricted()).isNull();
    }

    @Test
    @DisplayName("US-1.4: updateProfile should regenerate slug when display name changes")
    void updateProfile_RegeneratesSlug() {
        when(userRepository.findActiveById(user.getUserId())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull(anyString(), any(UUID.class))).thenReturn(false);

        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder()
                .displayName("New Display Name")
                .build();

        AuthDto.UserDto result = userService.updateProfile(user.getUserId().toString(), request);

        assertThat(result.getDisplayName()).isEqualTo("New Display Name");
        assertThat(result.getSlug()).isEqualTo("new-display-name");
    }

    @Test
    @DisplayName("US-1.4: updateProfile handles slug collision by appending counter")
    void updateProfile_HandlesSlugCollision() {
        when(userRepository.findActiveById(user.getUserId())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Mock collision for base slug "collision-user"
        when(userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull("collision-user", user.getUserId()))
                .thenReturn(true);
        // Mock no collision for "collision-user-1"
        when(userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull("collision-user-1", user.getUserId()))
                .thenReturn(false);

        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder()
                .displayName("Collision User")
                .build();

        AuthDto.UserDto result = userService.updateProfile(user.getUserId().toString(), request);

        assertThat(result.getSlug()).isEqualTo("collision-user-1");
    }
}
