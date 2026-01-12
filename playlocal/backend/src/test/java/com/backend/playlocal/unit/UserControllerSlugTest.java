package com.backend.playlocal.unit;

import com.backend.playlocal.controller.UserController;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

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

    @InjectMocks
    private UserController userController;

    private AuthDto.UserDto mockUser;

    @BeforeEach
    void setUp() {
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
        when(userService.getProfileBySlug("john-doe")).thenReturn(mockUser);

        ResponseEntity<AuthDto.UserDto> response = userController.getProfileBySlug("john-doe");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSlug()).isEqualTo("john-doe");
        assertThat(response.getBody().getDisplayName()).isEqualTo("John Doe");
        verify(userService).getProfileBySlug("john-doe");
    }

    @Test
    @DisplayName("getProfileBySlug calls service with provided slug")
    void getProfileBySlug_CallsService_WithSlug() {
        when(userService.getProfileBySlug("test-user")).thenReturn(mockUser);

        userController.getProfileBySlug("test-user");

        verify(userService, times(1)).getProfileBySlug("test-user");
    }
}
