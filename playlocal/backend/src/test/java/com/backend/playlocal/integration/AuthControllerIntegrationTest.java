package com.backend.playlocal.integration;

import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AuthController endpoints.
 * UserStory: US-1.1 Register/Login/Logout
 * Tests all authentication endpoints with a real database.
 */
@AutoConfigureMockMvc
class AuthControllerIntegrationTest extends IntegrationTestBase {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private com.backend.playlocal.repository.UserRoleRepository userRoleRepository;

        @Autowired
        private PasswordEncoder passwordEncoder;

        private static final String BASE_URL = "/api/v1/auth";

        @BeforeEach
        void setUp() {
                // Clean up test users (keep seeded demo users)
                cleanupUser("integration-test@example.com");
                cleanupUser("newuser@example.com");
        }

        private void cleanupUser(String email) {
                userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
                        // Delete all roles associated with the user first to avoid FK constraints
                        // We need to fetch all roles (active and revoked) but the repo only exposes
                        // active ones
                        // For now, simpler to just use what we have or add a method.
                        // Better: findActiveRolesByUserId is available.
                        java.util.List<com.backend.playlocal.model.entity.UserRole> roles = userRoleRepository
                                        .findActiveRolesByUserId(user.getUserId());
                        userRoleRepository.deleteAll(roles);

                        // Note: If there are revoked roles, this might still fail.
                        // But in these tests we only create active roles.

                        userRepository.delete(user);
                });
        }

        // ==========================================
        // REGISTER ENDPOINT TESTS
        // ==========================================

        @Test
        @DisplayName("US-1.1: POST /register - Success with valid data")
        void register_Success() throws Exception {
                AuthDto.RegisterRequest request = AuthDto.RegisterRequest.builder()
                                .email("newuser@example.com")
                                .password("password123")
                                .displayName("New User")
                                .ageConfirmed(true)
                                .eulaAccepted(true)
                                .build();

                MvcResult result = mockMvc.perform(post(BASE_URL + "/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.token").isNotEmpty())
                                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                                .andExpect(jsonPath("$.user.email").value("newuser@example.com"))
                                .andReturn();

                // Verify user was created in database
                assertThat(userRepository.existsByEmailIgnoreCase("newuser@example.com")).isTrue();
        }

        @Test
        @DisplayName("US-1.1: POST /register - Duplicate email returns 409")
        void register_DuplicateEmail() throws Exception {
                // First registration
                AuthDto.RegisterRequest request = AuthDto.RegisterRequest.builder()
                                .email("integration-test@example.com")
                                .password("password123")
                                .displayName("Test User")
                                .ageConfirmed(true)
                                .eulaAccepted(true)
                                .build();

                mockMvc.perform(post(BASE_URL + "/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated());

                // Second registration with same email
                mockMvc.perform(post(BASE_URL + "/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("US-1.1: POST /register - Invalid email returns 400")
        void register_InvalidEmail() throws Exception {
                AuthDto.RegisterRequest request = AuthDto.RegisterRequest.builder()
                                .email("not-an-email")
                                .password("password123")
                                .displayName("Test User")
                                .ageConfirmed(true)
                                .eulaAccepted(true)
                                .build();

                mockMvc.perform(post(BASE_URL + "/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Legal P0: POST /register - EULA not accepted returns 400")
        void register_EulaNotAccepted() throws Exception {
                AuthDto.RegisterRequest request = AuthDto.RegisterRequest.builder()
                                .email("newuser@example.com")
                                .password("password123")
                                .displayName("Test User")
                                .ageConfirmed(true)
                                .eulaAccepted(false) // Not accepted
                                .build();

                mockMvc.perform(post(BASE_URL + "/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }

        // ==========================================
        // LOGIN ENDPOINT TESTS
        // ==========================================

        @Test
        @DisplayName("US-1.1: POST /login - Success with valid credentials")
        void login_Success() throws Exception {
                // First register a user
                createTestUser("integration-test@example.com", "password123");

                AuthDto.LoginRequest loginRequest = AuthDto.LoginRequest.builder()
                                .email("integration-test@example.com")
                                .password("password123")
                                .build();

                mockMvc.perform(post(BASE_URL + "/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").isNotEmpty())
                                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                                .andExpect(jsonPath("$.user.email").value("integration-test@example.com"));
        }

        @Test
        @DisplayName("US-1.1: POST /login - Invalid credentials returns 401")
        void login_InvalidCredentials() throws Exception {
                AuthDto.LoginRequest loginRequest = AuthDto.LoginRequest.builder()
                                .email("nonexistent@example.com")
                                .password("wrongpassword")
                                .build();

                mockMvc.perform(post(BASE_URL + "/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("US-1.1: POST /login - Wrong password returns 401")
        void login_WrongPassword() throws Exception {
                createTestUser("integration-test@example.com", "correctpassword");

                AuthDto.LoginRequest loginRequest = AuthDto.LoginRequest.builder()
                                .email("integration-test@example.com")
                                .password("wrongpassword")
                                .build();

                mockMvc.perform(post(BASE_URL + "/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isUnauthorized());
        }

        // ==========================================
        // ME ENDPOINT TESTS
        // ==========================================

        @Test
        @DisplayName("US-1.1: GET /me - Success with valid token")
        void me_WithValidToken() throws Exception {
                // Register and get token
                String token = registerAndGetToken("integration-test@example.com", "password123");

                mockMvc.perform(get(BASE_URL + "/me")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.email").value("integration-test@example.com"));
        }

        @Test
        @DisplayName("US-1.1: GET /me - Unauthorized/Forbidden without token")
        void me_WithoutToken() throws Exception {
                mockMvc.perform(get(BASE_URL + "/me"))
                                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("US-1.1: GET /me - Unauthorized/Forbidden with invalid token")
        void me_WithInvalidToken() throws Exception {
                mockMvc.perform(get(BASE_URL + "/me")
                                .header("Authorization", "Bearer invalid-token"))
                                .andExpect(status().isUnauthorized());
        }

        // ==========================================
        // LOGOUT ENDPOINT TESTS
        // ==========================================

        @Test
        @DisplayName("US-1.1: POST /logout - Returns 204 No Content")
        void logout_Success() throws Exception {
                mockMvc.perform(post(BASE_URL + "/logout"))
                                .andExpect(status().isNoContent());
        }

        // ==========================================
        // HELPER METHODS
        // ==========================================

        private void createTestUser(String email, String password) {
                if (!userRepository.existsByEmailIgnoreCase(email)) {
                        User user = User.builder()
                                        .email(email)
                                        .passwordHash(passwordEncoder.encode(password))
                                        .displayName("Test User")
                                        .slug("test-user-" + UUID.randomUUID())
                                        .status(User.UserStatus.ACTIVE)
                                        .reliabilityScore(100.0f)
                                        .ageConfirmedAt(java.time.Instant.now())
                                        .build();
                        userRepository.save(user);
                }
        }

        private String registerAndGetToken(String email, String password) throws Exception {
                AuthDto.RegisterRequest request = AuthDto.RegisterRequest.builder()
                                .email(email)
                                .password(password)
                                .displayName("Test User")
                                .ageConfirmed(true)
                                .eulaAccepted(true)
                                .build();

                MvcResult result = mockMvc.perform(post(BASE_URL + "/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andReturn();

                AuthDto.AuthResponse response = objectMapper.readValue(
                                result.getResponse().getContentAsString(),
                                AuthDto.AuthResponse.class);
                return response.getToken();
        }
}
