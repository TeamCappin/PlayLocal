package com.backend.playlocal.service;

import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.repository.EndorsementRepository;
import com.backend.playlocal.repository.FriendshipRepository;
import com.backend.playlocal.service.PrivacySettingsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceAdditionalTest {

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

    @Test
    @DisplayName("US-1.1: searchUsers should return all active users when query is empty")
    void searchUsers_NoQuery_ReturnsAllActive() {
        // Given
        User user = User.builder()
                .userId(UUID.randomUUID())
                .displayName("Test User")
                .slug("test-user-" + UUID.randomUUID())
                .createdAt(Instant.now())
                .build();
        Page<User> page = new PageImpl<>(List.of(user));
        when(userRepository.findAllActive(any(PageRequest.class))).thenReturn(page);
        when(privacySettingsService.isSearchable(any(UUID.class), anyBoolean())).thenReturn(true);

        // When
        UUID viewerId = UUID.randomUUID();
        UserDto.SearchResponse response = userService.searchUsers("", 0, 10, viewerId);

        // Then
        assertThat(response.getUsers()).hasSize(1);
        verify(userRepository).findAllActive(any(PageRequest.class));
        verify(userRepository, never()).searchByDisplayNameOrEmail(anyString(), any(PageRequest.class));
    }

    @Test
    @DisplayName("US-1.1: updateProfile should ignore null fields in request")
    void updateProfile_PartialUpdate() {
        // Given
        UUID userId = UUID.randomUUID();
        User existingUser = User.builder()
                .userId(userId)
                .displayName("Original Name")
                .slug("original-name-" + UUID.randomUUID())
                .bio("Original Bio")
                .build();

        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When request has only some fields
        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder()
                .displayName("New Name")
                // Bio is null, should remain "Original Bio"
                .build();

        // When
        userService.updateProfile(userId.toString(), request);

        // Then
        assertThat(existingUser.getDisplayName()).isEqualTo("New Name");
        assertThat(existingUser.getBio()).isEqualTo("Original Bio");
    }
}
