package com.backend.playlocal.unit;

import com.backend.playlocal.controller.UserController;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.dto.PrivacySettingsDto;
import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.service.ConnectionSignalsService;
import com.backend.playlocal.service.PrivacySettingsService;
import com.backend.playlocal.service.UsernameService;
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
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
        private UsernameService usernameService;

        @Mock
        private ConnectionSignalsService connectionSignalsService;

        @Mock
        private PrivacySettingsService privacySettingsService;

        @InjectMocks
        private UserController userController;

        private MockMvc mockMvc;
        private ObjectMapper objectMapper = new ObjectMapper();

        @BeforeEach
        void setUp() {
                mockMvc = MockMvcBuilders.standaloneSetup(userController).build();

                // Mock security context for profile update
                SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken("550e8400-e29b-41d4-a716-446655440000", "password"));
        }

        @Test
        @DisplayName("US-1.1: GET /search should return search results")
        void searchUsers_ReturnsResults() throws Exception {
                UserDto.SearchResponse response = UserDto.SearchResponse.builder()
                                .users(List.of())
                                .totalElements(0)
                                .build();

                when(userService.searchUsers(eq("query"), any(Integer.class), any(Integer.class), any(UUID.class))).thenReturn(response);

                mockMvc.perform(get("/api/v1/users/search")
                                .param("q", "query")
                                .principal(new UsernamePasswordAuthenticationToken("550e8400-e29b-41d4-a716-446655440000", "pw")))
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
                                .principal(new UsernamePasswordAuthenticationToken("550e8400-e29b-41d4-a716-446655440000", "pw"))
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

                when(userService.getUserProfile(eq("test-id"), any(UUID.class))).thenReturn(response);

                mockMvc.perform(get("/api/v1/users/test-id/profile")
                                .principal(new UsernamePasswordAuthenticationToken("550e8400-e29b-41d4-a716-446655440000", "pw")))
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

                when(userService.getProfileBySlug(eq("slug-user"), any(UUID.class))).thenReturn(response);

                mockMvc.perform(get("/api/v1/users/slug/slug-user/profile")
                                .principal(new UsernamePasswordAuthenticationToken("550e8400-e29b-41d4-a716-446655440000", "pw")))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.displayName").value("Slug User"))
                                .andExpect(jsonPath("$.slug").value("slug-user"));
        }

        @Test
        @DisplayName("US-1.4: PUT /username should update username via UsernameService")
        void updateUsername_ReturnsUpdatedProfile() throws Exception {
                UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
                UserDto.UpdateUsernameRequest request = UserDto.UpdateUsernameRequest.builder()
                                .username("new-handle")
                                .build();

                AuthDto.UserDto response = AuthDto.UserDto.builder()
                                .displayName("Updated User")
                                .slug("new-handle")
                                .build();

                when(usernameService.changeSlug(eq(userId), eq("new-handle"))).thenReturn(response);

                mockMvc.perform(put("/api/v1/users/username")
                                .principal(new UsernamePasswordAuthenticationToken(userId.toString(), "pw"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.slug").value("new-handle"));
        }

        @Test
        @DisplayName("US-1.4: GET /username/{username} should resolve userId")
        void findUserIdByUsername_ReturnsUserId() throws Exception {
                String targetUserId = UUID.randomUUID().toString();
                when(usernameService.findUserIdByUsername("john-doe")).thenReturn(targetUserId);

                mockMvc.perform(get("/api/v1/users/username/john-doe"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.userId").value(targetUserId));
        }

        // ── US-7.12 Privacy: restricted profile responses ──────────────────

        @Test
        @DisplayName("US-7.12: GET /{userId}/profile returns restricted profile with trust metrics")
        void getUserProfile_Restricted_ReturnsTrustMetrics() throws Exception {
                AuthDto.UserDto response = AuthDto.UserDto.builder()
                                .userId("some-id")
                                .displayName("Private User")
                                .reliabilityScore(95.0f)
                                .gamesCount(42)
                                .endorsementsCount(7)
                                .defaultIntensity("competitive")
                                .profileRestricted(true)
                                .build();

                when(userService.getUserProfile(eq("some-id"), any(UUID.class))).thenReturn(response);

                mockMvc.perform(get("/api/v1/users/some-id/profile")
                                .principal(new UsernamePasswordAuthenticationToken("550e8400-e29b-41d4-a716-446655440000", "pw")))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.profileRestricted").value(true))
                                .andExpect(jsonPath("$.reliabilityScore").value(95.0))
                                .andExpect(jsonPath("$.gamesCount").value(42))
                                .andExpect(jsonPath("$.endorsementsCount").value(7))
                                .andExpect(jsonPath("$.bio").doesNotExist())
                                .andExpect(jsonPath("$.location").doesNotExist());
        }

        @Test
        @DisplayName("US-7.12: GET /slug/{slug}/profile returns restricted profile")
        void getProfileBySlug_Restricted_ReturnsRestricted() throws Exception {
                AuthDto.UserDto response = AuthDto.UserDto.builder()
                                .displayName("Private Slug User")
                                .slug("private-slug")
                                .profileRestricted(true)
                                .reliabilityScore(88.0f)
                                .build();

                when(userService.getProfileBySlug(eq("private-slug"), any(UUID.class))).thenReturn(response);

                mockMvc.perform(get("/api/v1/users/slug/private-slug/profile")
                                .principal(new UsernamePasswordAuthenticationToken("550e8400-e29b-41d4-a716-446655440000", "pw")))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.profileRestricted").value(true))
                                .andExpect(jsonPath("$.displayName").value("Private Slug User"))
                                .andExpect(jsonPath("$.reliabilityScore").value(88.0));
        }

        // ── US-7.12 Privacy: settings endpoints ──────────────────────────────

        @Test
        @DisplayName("US-7.12: GET /privacy-settings returns settings")
        void getPrivacySettings_ReturnsSettings() throws Exception {
                UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
                PrivacySettingsDto.PrivacySettingsResponse response = PrivacySettingsDto.PrivacySettingsResponse.builder()
                                .profileVisibility("friends")
                                .skillsVisibility("public")
                                .historyVisibility("friends")
                                .mediaDefaultVisibility("participants")
                                .locationVisibilityRule("confirmed_only")
                                .allowProfileSearch(true)
                                .build();

                when(privacySettingsService.getPrivacySettings(userId)).thenReturn(response);

                mockMvc.perform(get("/api/v1/users/privacy-settings")
                                .principal(new UsernamePasswordAuthenticationToken(userId.toString(), "pw")))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.profileVisibility").value("friends"))
                                .andExpect(jsonPath("$.allowProfileSearch").value(true));
        }

        @Test
        @DisplayName("US-7.12: PUT /privacy-settings updates and returns settings")
        void updatePrivacySettings_ReturnsUpdated() throws Exception {
                UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
                PrivacySettingsDto.PrivacySettingsResponse response = PrivacySettingsDto.PrivacySettingsResponse.builder()
                                .profileVisibility("private")
                                .skillsVisibility("public")
                                .historyVisibility("friends")
                                .mediaDefaultVisibility("participants")
                                .locationVisibilityRule("confirmed_only")
                                .allowProfileSearch(false)
                                .build();

                when(privacySettingsService.updatePrivacySettings(eq(userId), any())).thenReturn(response);

                PrivacySettingsDto.UpdatePrivacySettingsRequest request = PrivacySettingsDto.UpdatePrivacySettingsRequest.builder()
                                .profileVisibility("private")
                                .allowProfileSearch(false)
                                .build();

                mockMvc.perform(put("/api/v1/users/privacy-settings")
                                .principal(new UsernamePasswordAuthenticationToken(userId.toString(), "pw"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.profileVisibility").value("private"))
                                .andExpect(jsonPath("$.allowProfileSearch").value(false));

                verify(privacySettingsService).updatePrivacySettings(eq(userId), any());
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

        @Test
        @DisplayName("US-7.15: POST /deactivate deactivates account")
        void deactivateAccount_ReturnsNoContent() throws Exception {
                UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

                mockMvc.perform(post("/api/v1/users/deactivate")
                                .principal(new UsernamePasswordAuthenticationToken(userId.toString(), "pw")))
                                .andExpect(status().isNoContent());

                verify(userService).deactivateAccount(eq(userId));
        }

        @Test
        @DisplayName("US-7.15: DELETE /me permanently deletes account")
        void deleteAccount_ReturnsNoContent() throws Exception {
                UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

                mockMvc.perform(delete("/api/v1/users/me")
                                .principal(new UsernamePasswordAuthenticationToken(userId.toString(), "pw")))
                                .andExpect(status().isNoContent());

                verify(userService).deleteAccount(eq(userId));
        }
}
