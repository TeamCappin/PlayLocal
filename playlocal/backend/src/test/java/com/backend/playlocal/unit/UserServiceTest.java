package com.backend.playlocal.unit;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.UserRepository;
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
                .slug("test-user")
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

        UserDto.SearchResponse response = userService.searchUsers("query", 0, 10);

        assertThat(response.getUsers()).hasSize(1);
        verify(userRepository).searchByDisplayNameOrEmail(eq("query"), any(PageRequest.class));
    }

    @Test
    @DisplayName("US-1.1: searchUsers without query should call repo findAllActive")
    void searchUsers_NoQuery() {
        Page<User> page = new PageImpl<>(List.of(user));
        when(userRepository.findAllActive(any(PageRequest.class))).thenReturn(page);

        UserDto.SearchResponse response = userService.searchUsers(null, 0, 10);

        assertThat(response.getUsers()).hasSize(1);
        verify(userRepository).findAllActive(any(PageRequest.class));
    }
}
