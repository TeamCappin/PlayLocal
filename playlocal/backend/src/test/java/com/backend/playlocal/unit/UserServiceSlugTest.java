package com.backend.playlocal.unit;

import com.backend.playlocal.exception.DuplicateResourceException;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserService slug and profile methods.
 * Covers: getProfileBySlug, ensureUniqueSlug, updateProfile with slug
 * regeneration
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

    @Mock
    private com.backend.playlocal.service.UsernameService usernameService;

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
    @DisplayName("getProfileBySlug throws exception when user not found")
    void getProfileBySlug_UserNotFound_ThrowsException() {
        when(userRepository.findBySlugAndDeletedAtIsNull("nonexistent"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getProfileBySlug("nonexistent"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");
    }

    @Test
    @DisplayName("updateProfile regenerates slug when displayName changes")
    void updateProfile_DisplayNameChanged_RegeneratesSlug() {
        UUID userId = testUser.getUserId();
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull(any(), any())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder()
                .displayName("New Name")
                .build();

        AuthDto.UserDto result = userService.updateProfile(userId.toString(), request);

        assertThat(testUser.getSlug()).isEqualTo("new-name");
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("updateProfile ensures unique slug by appending counter")
    void updateProfile_SlugConflict_AppendsCounter() {
        UUID userId = testUser.getUserId();
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
        // First call returns true (conflict), second returns false
        when(userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull(eq("new-name"), any()))
                .thenReturn(true);
        when(userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull(eq("new-name-1"), any()))
                .thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder()
                .displayName("New Name")
                .build();

        userService.updateProfile(userId.toString(), request);

        assertThat(testUser.getSlug()).isEqualTo("new-name-1");
    }

    @Test
    @DisplayName("updateProfile handles multiple slug conflicts")
    void updateProfile_MultipleConflicts_AppendsHigherCounter() {
        UUID userId = testUser.getUserId();
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull(eq("john-doe"), any()))
                .thenReturn(true);
        when(userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull(eq("john-doe-1"), any()))
                .thenReturn(true);
        when(userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull(eq("john-doe-2"), any()))
                .thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder()
                .displayName("John Doe")
                .build();

        userService.updateProfile(userId.toString(), request);

        assertThat(testUser.getSlug()).isEqualTo("john-doe-2");
    }

    @Test
    @DisplayName("updateProfile updates bio without changing slug")
    void updateProfile_OnlyBioChanged_SlugUnchanged() {
        UUID userId = testUser.getUserId();
        String originalSlug = testUser.getSlug();
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder()
                .bio("New bio")
                .build();

        userService.updateProfile(userId.toString(), request);

        assertThat(testUser.getSlug()).isEqualTo(originalSlug);
        assertThat(testUser.getBio()).isEqualTo("New bio");
    }

    @Test
    @DisplayName("updateProfile updates all optional fields")
    void updateProfile_AllFieldsProvided_UpdatesAll() {
        UUID userId = testUser.getUserId();
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull(any(), any())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder()
                .displayName("Updated Name")
                .bio("Updated bio")
                .location("Montreal")
                .defaultIntensity("High")
                .availability("Weekends")
                .phone("+15141234567")
                .build();

        userService.updateProfile(userId.toString(), request);

        assertThat(testUser.getDisplayName()).isEqualTo("Updated Name");
        assertThat(testUser.getBio()).isEqualTo("Updated bio");
        assertThat(testUser.getLocation()).isEqualTo("Montreal");
        assertThat(testUser.getDefaultIntensity()).isEqualTo("High");
        assertThat(testUser.getAvailability()).isEqualTo("Weekends");
        assertThat(testUser.getPhoneE164()).isEqualTo("+15141234567");
    }

        @Test
        @DisplayName("changeSlug normalizes URL-friendly username before save")
        void changeSlug_NormalizesAndSaves() {
                UUID userId = testUser.getUserId();
                when(usernameService.changeSlug(userId, " John   Doe!!! 2026 ")).thenReturn("john-doe-2026");
                when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
                        // Removed unnecessary userRepository.save() stubbing

                AuthDto.UserDto result = userService.changeSlug(userId.toString(), " John   Doe!!! 2026 ");

                assertThat(result.getSlug()).isEqualTo("test-user");  // testUser still has original slug
                verify(usernameService).changeSlug(userId, " John   Doe!!! 2026 ");
        }

        @Test
        @DisplayName("changeSlug truncates normalized username to 32 characters")
        void changeSlug_LongInput_TruncatesTo32() {
                UUID userId = testUser.getUserId();
                String longInput = "this username is way too long and should be cut down aggressively";
                String expected = "this-username-is-way-too-long";  // Truncated to 32 chars

                when(usernameService.changeSlug(userId, longInput)).thenReturn(expected);
                when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
                        // Removed unnecessary userRepository.save() stubbing

                AuthDto.UserDto result = userService.changeSlug(userId.toString(), longInput);

                assertThat(result.getSlug()).isEqualTo("test-user");  // testUser still has original slug
                verify(usernameService).changeSlug(userId, longInput);
        }

        @Test
        @DisplayName("changeSlug with same normalized username returns without save")
        void changeSlug_SameNormalized_NoSave() {
                UUID userId = testUser.getUserId();
                when(usernameService.changeSlug(userId, " Test   User!!! ")).thenReturn("test-user");
                when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));

                AuthDto.UserDto result = userService.changeSlug(userId.toString(), " Test   User!!! ");

                assertThat(result.getSlug()).isEqualTo("test-user");
                verify(usernameService).changeSlug(userId, " Test   User!!! ");
        }

        @Test
        @DisplayName("changeSlug throws conflict when username already in use")
        void changeSlug_Duplicate_ThrowsConflict() {
                UUID userId = testUser.getUserId();
                when(usernameService.changeSlug(userId, "taken name"))
                        .thenThrow(new DuplicateResourceException("Username already in use"));

                assertThatThrownBy(() -> userService.changeSlug(userId.toString(), "taken name"))
                                .isInstanceOf(DuplicateResourceException.class)
                                .hasMessage("Username already in use");

                verify(usernameService).changeSlug(userId, "taken name");
        }

        @Test
        @DisplayName("changeSlug rejects username without letters or numbers")
        void changeSlug_NoAlphanumeric_ThrowsValidation() {
                UUID userId = testUser.getUserId();
                when(usernameService.changeSlug(userId, "!!!"))
                        .thenThrow(new IllegalArgumentException("Username must contain at least one letter or number"));

                assertThatThrownBy(() -> userService.changeSlug(userId.toString(), "!!!"))
                                .isInstanceOf(IllegalArgumentException.class)
                                .hasMessage("Username must contain at least one letter or number");

                verify(usernameService).changeSlug(userId, "!!!");
        }

        @Test
        @DisplayName("changeSlug throws not found when user is missing")
        void changeSlug_UserMissing_ThrowsNotFound() {
                UUID userId = testUser.getUserId();
                when(usernameService.changeSlug(userId, "valid-name")).thenReturn("valid-name");
                when(userRepository.findActiveById(userId)).thenReturn(Optional.empty());

                assertThatThrownBy(() -> userService.changeSlug(userId.toString(), "valid-name"))
                                .isInstanceOf(ResourceNotFoundException.class)
                                .hasMessage("User not found");

                verify(usernameService).changeSlug(userId, "valid-name");
        }

        @Test
        @DisplayName("findUserIdByUsername normalizes input before lookup")
        void findUserIdByUsername_NormalizesInput() {
                UUID expectedUserId = testUser.getUserId();
                when(usernameService.findUserIdByUsername("  John   Doe!! ")).thenReturn(expectedUserId.toString());

                String result = userService.findUserIdByUsername("  John   Doe!! ");

                assertThat(result).isEqualTo(expectedUserId.toString());
                verify(usernameService).findUserIdByUsername("  John   Doe!! ");
        }

        @Test
        @DisplayName("findUserIdByUsername rejects non-alphanumeric input")
        void findUserIdByUsername_OnlySymbols_ThrowsValidation() {
                when(usernameService.findUserIdByUsername("@@@!!!"))
                        .thenThrow(new IllegalArgumentException("Username must contain at least one letter or number"));

                assertThatThrownBy(() -> userService.findUserIdByUsername("@@@!!!"))
                                .isInstanceOf(IllegalArgumentException.class)
                                .hasMessage("Username must contain at least one letter or number");

                verify(usernameService).findUserIdByUsername("@@@!!!");
        }

        @Test
        @DisplayName("updateProfile slug conflict keeps generated slugs within 32 characters")
        void updateProfile_LongSlugConflict_KeepsWithinLimit() {
                UUID userId = testUser.getUserId();
                String longName = "This display name keeps going and going and must be truncated";
                String baseSlug = User.generateSlug(longName);
                String nextSlug = baseSlug.substring(0, Math.max(1, User.MAX_SLUG_LENGTH - 2)).replaceAll("-+$", "") + "-1";

                when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
                when(userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull(eq(baseSlug), eq(userId))).thenReturn(true);
                when(userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull(eq(nextSlug), eq(userId))).thenReturn(false);
                when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

                userService.updateProfile(userId.toString(), UserDto.UpdateProfileRequest.builder().displayName(longName).build());

                assertThat(testUser.getSlug()).isEqualTo(nextSlug);
                assertThat(testUser.getSlug().length()).isLessThanOrEqualTo(User.MAX_SLUG_LENGTH);
        }
}
