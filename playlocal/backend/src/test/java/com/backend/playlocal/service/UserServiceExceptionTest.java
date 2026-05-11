package com.backend.playlocal.service;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.repository.EndorsementRepository;
import com.backend.playlocal.repository.FriendshipRepository;
import com.backend.playlocal.repository.PlayerRatingRepository;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.service.PrivacySettingsService;
import com.backend.playlocal.service.UsernameService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceExceptionTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EndorsementRepository endorsementRepository;

    @Mock
    private PrivacySettingsService privacySettingsService;

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private PlayerRatingRepository playerRatingRepository;

    @Mock
    private UsernameService usernameService;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("US-1.1: getUserProfile should throw ResourceNotFoundException when user not found")
    void getUserProfile_UserNotFound_ThrowsException() {
        // Given
        UUID userId = UUID.randomUUID();
        when(userRepository.findActiveById(userId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> userService.getUserProfile(userId.toString()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");
    }

    @Test
    @DisplayName("US-1.1: updateProfile should throw ResourceNotFoundException when user not found")
    void updateProfile_UserNotFound_ThrowsException() {
        // Given
        UUID userId = UUID.randomUUID();
        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder().build();
        when(userRepository.findActiveById(userId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> userService.updateProfile(userId.toString(), request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");
    }
}
