package com.backend.playlocal.unit;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.repository.EndorsementRepository;
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

        UserDto.SearchResponse response = userService.searchUsers("query", 0, 10);

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

        UserDto.SearchResponse response = userService.searchUsers(null, 0, 10);

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
