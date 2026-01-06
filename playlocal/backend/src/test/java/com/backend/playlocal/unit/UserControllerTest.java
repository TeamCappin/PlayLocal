package com.backend.playlocal.unit;

import com.backend.playlocal.controller.UserController;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit tests for UserController.
 * UserStory: US-1.1 Register/Login/Logout
 * Tests controller endpoints for profile management.
 */
@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController).build();

        // Mock security context for profile update
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("test-user-id", "password"));
    }

    @Test
    @DisplayName("US-1.1: GET /search should return search results")
    void searchUsers_ReturnsResults() throws Exception {
        UserDto.SearchResponse response = UserDto.SearchResponse.builder()
                .users(List.of())
                .totalElements(0)
                .build();

        when(userService.searchUsers(eq("query"), any(Integer.class), any(Integer.class))).thenReturn(response);

        mockMvc.perform(get("/api/v1/users/search")
                .param("q", "query"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("US-1.1: PUT /profile should update and return profile")
    void updateProfile_ReturnsUpdatedProfile() throws Exception {
        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder()
                .displayName("Updated")
                .build();

        AuthDto.UserDto response = AuthDto.UserDto.builder()
                .displayName("Updated")
                .build();

        // Note: Authentication principal is mocked above, but standalone setup skips
        // security filters.
        // The controller gets authentication injected by argument resolver, which
        // standalone mockMvc handles if principal is set?
        // Actually standalone setup might need setCustomArgumentResolvers for
        // Authentication if not using full context.
        // However, Spring's PrincipalMethodArgumentResolver is usually registered by
        // default.

        when(userService.updateProfile(any(), any())).thenReturn(response);

        mockMvc.perform(put("/api/v1/users/profile")
                .principal(new UsernamePasswordAuthenticationToken("test-user-id", "pw"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Updated"));
    }

    @Test
    @DisplayName("US-1.1: GET /profile/{userId} should return user profile")
    void getUserProfile_ReturnsProfile() throws Exception {
        AuthDto.UserDto response = AuthDto.UserDto.builder()
                .email("test@example.com")
                .build();

        when(userService.getUserProfile("test-id")).thenReturn(response);

        mockMvc.perform(get("/api/v1/users/test-id/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }
}
