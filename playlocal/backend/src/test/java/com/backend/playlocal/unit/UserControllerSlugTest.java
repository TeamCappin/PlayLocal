package com.backend.playlocal.unit;

import com.backend.playlocal.controller.UserController;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.exception.DuplicateResourceException;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.service.ConnectionSignalsService;
import com.backend.playlocal.service.PrivacySettingsService;
import com.backend.playlocal.service.UsernameService;
import com.backend.playlocal.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserController slug endpoint.
 * Covers: getProfileBySlug
 */
@ExtendWith(MockitoExtension.class)
class UserControllerSlugTest {

    @Mock
    private UserService userService;

    @Mock
    private UsernameService usernameService;

    @Mock
    private ConnectionSignalsService connectionSignalsService;

    @Mock
    private PrivacySettingsService privacySettingsService;

    @Mock
    private Authentication authentication;

    private UserController userController;

    private AuthDto.UserDto mockUser;
    private UUID viewerId;

    @BeforeEach
    void setUp() {
        userController = new UserController(userService, usernameService, connectionSignalsService, privacySettingsService);
        viewerId = UUID.randomUUID();

        mockUser = AuthDto.UserDto.builder()
                .userId(UUID.randomUUID().toString())
                .displayName("John Doe")
                .slug("john-doe")
                .email("john@example.com")
                .reliabilityScore(95.0f)
                .build();
    }

    @Test
    @DisplayName("getProfileBySlug returns user profile for valid slug")
    void getProfileBySlug_ValidSlug_ReturnsProfile() {
        when(authentication.getName()).thenReturn(viewerId.toString());
        when(userService.getProfileBySlug("john-doe", viewerId)).thenReturn(mockUser);

        ResponseEntity<AuthDto.UserDto> response = userController.getProfileBySlug("john-doe", authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSlug()).isEqualTo("john-doe");
        assertThat(response.getBody().getDisplayName()).isEqualTo("John Doe");
        verify(userService).getProfileBySlug("john-doe", viewerId);
    }

    @Test
    @DisplayName("getProfileBySlug calls service with provided slug and viewer")
    void getProfileBySlug_CallsService_WithSlugAndViewer() {
        when(authentication.getName()).thenReturn(viewerId.toString());
        when(userService.getProfileBySlug("test-user", viewerId)).thenReturn(mockUser);

        userController.getProfileBySlug("test-user", authentication);

        verify(userService, times(1)).getProfileBySlug("test-user", viewerId);
    }

    @Test
    @DisplayName("updateUsername returns updated profile")
    void updateUsername_ValidRequest_ReturnsUpdatedUser() {
        when(authentication.getName()).thenReturn(viewerId.toString());
        UserDto.UpdateUsernameRequest request = UserDto.UpdateUsernameRequest.builder()
                .username("new-handle")
                .build();
        when(usernameService.changeSlug(viewerId, "new-handle")).thenReturn(mockUser);

        ResponseEntity<AuthDto.UserDto> response = userController.updateUsername(authentication, request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(mockUser);
        verify(usernameService).changeSlug(viewerId, "new-handle");
    }

    @Test
    @DisplayName("updateUsername propagates duplicate username conflict")
    void updateUsername_DuplicateUsername_ThrowsConflict() {
        when(authentication.getName()).thenReturn(viewerId.toString());
        UserDto.UpdateUsernameRequest request = UserDto.UpdateUsernameRequest.builder()
                .username("taken-slug")
                .build();
        when(usernameService.changeSlug(viewerId, "taken-slug"))
                .thenThrow(new DuplicateResourceException("Username already in use"));

        assertThatThrownBy(() -> userController.updateUsername(authentication, request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Username already in use");
    }

    @Test
    @DisplayName("findUserIdByUsername returns user id for existing username")
    void findUserIdByUsername_ValidUsername_ReturnsUserId() {
        String targetUserId = UUID.randomUUID().toString();
        when(usernameService.findUserIdByUsername("john-doe")).thenReturn(targetUserId);

        ResponseEntity<UserDto.UsernameLookupResponse> response = userController.findUserIdByUsername("john-doe");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getUserId()).isEqualTo(targetUserId);
        verify(usernameService).findUserIdByUsername("john-doe");
    }

    @Test
    @DisplayName("findUserIdByUsername propagates not found")
    void findUserIdByUsername_UnknownUsername_ThrowsNotFound() {
        when(usernameService.findUserIdByUsername("missing-user"))
                .thenThrow(new ResourceNotFoundException("User not found"));

        assertThatThrownBy(() -> userController.findUserIdByUsername("missing-user"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");
    }
}
