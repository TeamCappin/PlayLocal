package com.backend.playlocal.unit;

import com.backend.playlocal.controller.UserController;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.service.ConnectionSignalsService;
import com.backend.playlocal.service.PrivacySettingsService;
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
        userController = new UserController(userService, connectionSignalsService, privacySettingsService);
        viewerId = UUID.randomUUID();
        when(authentication.getName()).thenReturn(viewerId.toString());

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
        when(userService.getProfileBySlug("test-user", viewerId)).thenReturn(mockUser);

        userController.getProfileBySlug("test-user", authentication);

        verify(userService, times(1)).getProfileBySlug("test-user", viewerId);
    }
}
