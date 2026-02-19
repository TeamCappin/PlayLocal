package com.backend.playlocal.unit;

import com.backend.playlocal.controller.UserController;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.service.ConnectionSignalsService;
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
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

        @Mock
        private ConnectionSignalsService connectionSignalsService;

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

        @Test
        @DisplayName("US-1.4: GET /slug/{slug}/profile should return user profile")
        void getProfileBySlug_ReturnsProfile() throws Exception {
                AuthDto.UserDto response = AuthDto.UserDto.builder()
                                .displayName("Slug User")
                                .slug("slug-user")
                                .build();

                when(userService.getProfileBySlug("slug-user")).thenReturn(response);

                mockMvc.perform(get("/api/v1/users/slug/slug-user/profile"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.displayName").value("Slug User"))
                                .andExpect(jsonPath("$.slug").value("slug-user"));
        }

        @Test
        @DisplayName("US-32: GET /{targetUserId}/connection-signals returns signals for viewer and target")
        void getConnectionSignals_ReturnsSignals() throws Exception {
                UUID viewerId = UUID.fromString("550e8400-e29b-41d4-a716-446655440001");
                UUID targetId = UUID.fromString("550e8400-e29b-41d4-a716-446655440002");
                UserDto.ConnectionSignals signals = UserDto.ConnectionSignals.builder()
                                .mutualFriendCount(2)
                                .coPlayCount(1)
                                .build();

                when(connectionSignalsService.getSignals(eq(viewerId), eq(targetId))).thenReturn(signals);

                mockMvc.perform(get("/api/v1/users/" + targetId + "/connection-signals")
                                .principal(new UsernamePasswordAuthenticationToken(viewerId.toString(), "pw")))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.mutualFriendCount").value(2))
                                .andExpect(jsonPath("$.coPlayCount").value(1));
        }

        @Test
        @DisplayName("US-32: POST /connection-signals returns batch signals by userId")
        void getConnectionSignalsBatch_ReturnsBatch() throws Exception {
                UUID viewerId = UUID.fromString("550e8400-e29b-41d4-a716-446655440001");
                String targetIdStr = "550e8400-e29b-41d4-a716-446655440002";
                Map<String, UserDto.ConnectionSignals> signalsByUserId = Map.of(
                                targetIdStr,
                                UserDto.ConnectionSignals.builder().mutualFriendCount(0).coPlayCount(3).build());

                when(connectionSignalsService.getSignalsBatch(eq(viewerId), anyList())).thenReturn(signalsByUserId);

                String body = objectMapper.writeValueAsString(new UserDto.ConnectionSignalsBatchRequest(List.of(targetIdStr)));

                mockMvc.perform(post("/api/v1/users/connection-signals")
                                .principal(new UsernamePasswordAuthenticationToken(viewerId.toString(), "pw"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.signalsByUserId." + targetIdStr + ".coPlayCount").value(3))
                                .andExpect(jsonPath("$.signalsByUserId." + targetIdStr + ".mutualFriendCount").value(0));
        }
}
