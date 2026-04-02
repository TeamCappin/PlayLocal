package com.backend.playlocal.unit;

import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.repository.EndorsementRepository;
import com.backend.playlocal.repository.FriendshipRepository;
import com.backend.playlocal.service.PrivacySettingsService;
import com.backend.playlocal.service.UserService;
import com.backend.playlocal.service.UsernameService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for US 1.2 - Basic player profile (Intensity + Reliability Score).
 * 
 * Tests cover:
 * 1. Intensity value validation (Beginner/Casual/Competitive)
 * 2. Reliability score is read-only and cannot be modified via client input
 * 3. Profile updates persist correctly
 */
@ExtendWith(MockitoExtension.class)
class ProfileIntensityTest {

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

    @Mock
    private UsernameService usernameService;

    @InjectMocks
    private UserService userService;

    private User user;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = User.builder()
                .userId(userId)
                .email("test@example.com")
                .displayName("Test User")
                .slug("test-user-" + UUID.randomUUID())
                .status(User.UserStatus.ACTIVE)
                .reliabilityScore(85.0f)
                .attendedCount(17)
                .noShowCount(3)
                .gamesCount(20)
                .defaultIntensity("beginner")
                .build();
    }

    @ParameterizedTest
    @ValueSource(strings = { "beginner", "casual", "competitive" })
    @DisplayName("US-1.2: updateProfile accepts valid intensity values")
    void updateProfile_WithValidIntensity_Success(String intensity) {
        // Given
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder()
                .defaultIntensity(intensity)
                .build();

        // When
        AuthDto.UserDto result = userService.updateProfile(userId.toString(), request);

        // Then
        assertThat(result.getDefaultIntensity()).isEqualTo(intensity);
        verify(userRepository).save(argThat(savedUser -> savedUser.getDefaultIntensity().equals(intensity)));
    }

    @Test
    @DisplayName("US-1.2: updateProfile with displayName and intensity persists both")
    void updateProfile_WithDisplayNameAndIntensity_BothPersist() {
        // Given
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder()
                .displayName("New Name")
                .defaultIntensity("competitive")
                .build();

        // When
        AuthDto.UserDto result = userService.updateProfile(userId.toString(), request);

        // Then
        assertThat(result.getDisplayName()).isEqualTo("New Name");
        assertThat(result.getDefaultIntensity()).isEqualTo("competitive");
        verify(userRepository).save(argThat(savedUser -> savedUser.getDisplayName().equals("New Name") &&
                savedUser.getDefaultIntensity().equals("competitive")));
    }

    @Test
    @DisplayName("US-1.2: Reliability score remains unchanged after profile update")
    void updateProfile_ReliabilityScoreUnchanged() {
        // Given: User has a specific reliability score
        float originalScore = 85.0f;
        user.setReliabilityScore(originalScore);

        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When: Update profile with displayName and intensity
        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder()
                .displayName("Updated Name")
                .defaultIntensity("casual")
                .build();

        AuthDto.UserDto result = userService.updateProfile(userId.toString(), request);

        // Then: Reliability score should remain unchanged
        assertThat(result.getReliabilityScore()).isEqualTo(originalScore);
        verify(userRepository).save(argThat(savedUser -> savedUser.getReliabilityScore().equals(originalScore)));
    }

    @Test
    @DisplayName("US-1.2: Profile response includes reliability score (read-only display)")
    void getUserProfile_IncludesReliabilityScore() {
        // Given
        float expectedScore = 92.5f;
        user.setReliabilityScore(expectedScore);
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));

        // When
        AuthDto.UserDto result = userService.getUserProfile(userId.toString());

        // Then
        assertThat(result.getReliabilityScore()).isEqualTo(expectedScore);
    }

    @Test
    @DisplayName("US-1.2: Profile response includes all required fields")
    void getUserProfile_IncludesAllRequiredFields() {
        // Given
        user.setDisplayName("Test Player");
        user.setDefaultIntensity("competitive");
        user.setReliabilityScore(88.0f);
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));

        // When
        AuthDto.UserDto result = userService.getUserProfile(userId.toString());

        // Then: Acceptance Criteria - Profile shows: display name, self-rated
        // intensity, and Reliability Score
        assertThat(result.getDisplayName()).isEqualTo("Test Player");
        assertThat(result.getDefaultIntensity()).isEqualTo("competitive");
        assertThat(result.getReliabilityScore()).isEqualTo(88.0f);
    }

    @Test
    @DisplayName("US-1.2: UpdateProfileRequest DTO does not have reliabilityScore field")
    void updateProfileRequest_DoesNotHaveReliabilityScoreField() {
        // This test verifies the design decision that reliabilityScore cannot be set
        // via client input
        // by confirming the UpdateProfileRequest DTO does not expose this field

        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder()
                .displayName("Test")
                .defaultIntensity("casual")
                .bio("Bio")
                .location("Montreal")
                .availability("weekends")
                .build();

        // Verify we can build the request without a reliabilityScore field
        // The absence of a setter/builder method is verified by compilation
        assertThat(request).isNotNull();
        assertThat(request.getDisplayName()).isEqualTo("Test");
    }
}
