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

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserService slug and profile methods.
 * Covers: getProfileBySlug, ensureUniqueSlug, updateProfile without slug
 * mutation
 */
@ExtendWith(MockitoExtension.class)
class UserServiceSlugTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EndorsementRepository endorsementRepository;

    @Mock
    private PrivacySettingsService privacySettingsService;

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private com.backend.playlocal.repository.PlayerRatingRepository playerRatingRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .userId(UUID.randomUUID())
                .email("test@example.com")
                .displayName("Test User")
                .slug("test-user")
                .reliabilityScore(100.0f)
                .createdAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("getProfileBySlug returns user when found")
    void getProfileBySlug_UserExists_ReturnsProfile() {
        when(userRepository.findBySlugAndDeletedAtIsNull("test-user"))
                .thenReturn(Optional.of(testUser));

        AuthDto.UserDto result = userService.getProfileBySlug("test-user");

        assertThat(result.getDisplayName()).isEqualTo("Test User");
        assertThat(result.getSlug()).isEqualTo("test-user");
        verify(userRepository).findBySlugAndDeletedAtIsNull("test-user");
    }

    @Test
    @DisplayName("getProfileBySlug normalizes slug input before lookup")
    void getProfileBySlug_NormalizesInputBeforeLookup() {
        when(userRepository.findBySlugAndDeletedAtIsNull("test-user"))
                .thenReturn(Optional.of(testUser));

        AuthDto.UserDto result = userService.getProfileBySlug("  Test User!  ");

        assertThat(result.getSlug()).isEqualTo("test-user");
        verify(userRepository).findBySlugAndDeletedAtIsNull("test-user");
    }

    @Test
    @DisplayName("getProfileBySlug throws exception when user not found")
    void getProfileBySlug_UserNotFound_ThrowsException() {
        when(userRepository.findBySlugAndDeletedAtIsNull("nonexistent"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getProfileBySlug("nonexistent"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");
    }

    @Test
    @DisplayName("updateProfile updates display name without changing slug")
    void updateProfile_DisplayNameChanged_SlugUnchanged() {
        UUID userId = testUser.getUserId();
        String originalSlug = testUser.getSlug();
        String originalEmail = testUser.getEmail();
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder()
                .displayName("New Name")
                .build();

        AuthDto.UserDto result = userService.updateProfile(userId.toString(), request);

        assertThat(result.getDisplayName()).isEqualTo("New Name");
        assertThat(result.getSlug()).isEqualTo(originalSlug);
        assertThat(result.getEmail()).isEqualTo(originalEmail);
        assertThat(testUser.getSlug()).isEqualTo(originalSlug);
        assertThat(testUser.getEmail()).isEqualTo(originalEmail);
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("updateProfile updates bio without changing slug")
    void updateProfile_OnlyBioChanged_SlugUnchanged() {
        UUID userId = testUser.getUserId();
        String originalSlug = testUser.getSlug();
        String originalEmail = testUser.getEmail();
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder()
                .bio("New bio")
                .build();

        userService.updateProfile(userId.toString(), request);

        assertThat(testUser.getSlug()).isEqualTo(originalSlug);
        assertThat(testUser.getEmail()).isEqualTo(originalEmail);
        assertThat(testUser.getPhoneE164()).isNull();
        assertThat(testUser.getBio()).isEqualTo("New bio");
    }

    @Test
    @DisplayName("updateProfile updates all optional fields")
    void updateProfile_AllFieldsProvided_UpdatesAll() {
        UUID userId = testUser.getUserId();
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder()
                .displayName("Updated Name")
                .bio("Updated bio")
                .location("Montreal")
                .defaultIntensity("High")
            .availability("Weekends")
                .build();

        userService.updateProfile(userId.toString(), request);

        assertThat(testUser.getDisplayName()).isEqualTo("Updated Name");
        assertThat(testUser.getBio()).isEqualTo("Updated bio");
        assertThat(testUser.getLocation()).isEqualTo("Montreal");
        assertThat(testUser.getDefaultIntensity()).isEqualTo("High");
        assertThat(testUser.getAvailability()).isEqualTo("Weekends");
        assertThat(testUser.getSlug()).isEqualTo("test-user");
        assertThat(testUser.getEmail()).isEqualTo("test@example.com");
        assertThat(testUser.getPhoneE164()).isNull();
    }

}
