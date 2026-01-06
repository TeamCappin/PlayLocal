package com.backend.playlocal.unit;

import com.backend.playlocal.controller.AuthController;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit tests for AuthController validation logic.
 * UserStory: US-1.1 Register/Login/Logout
 * Tests field validation (@Valid) which may not be fully covered by integration
 * tests.
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerUnitTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    @Test
    @DisplayName("US-1.1: Register with missing fields should return 400 Bad Request")
    void register_MissingFields_Returns400() throws Exception {
        // Empty request
        AuthDto.RegisterRequest request = AuthDto.RegisterRequest.builder().build();

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("US-1.1: Register with invalid email should return 400 Bad Request")
    void register_InvalidEmail_Returns400() throws Exception {
        AuthDto.RegisterRequest request = AuthDto.RegisterRequest.builder()
                .email("invalid-email")
                .password("password")
                .displayName("Test")
                .ageConfirmed(true)
                .eulaAccepted(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("US-1.1: Login with missing fields should return 400 Bad Request")
    void login_MissingFields_Returns400() throws Exception {
        AuthDto.LoginRequest request = AuthDto.LoginRequest.builder().build();

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("US-1.1: Register success should return 201 Created")
    void register_Success_Returns201() throws Exception {
        AuthDto.RegisterRequest request = AuthDto.RegisterRequest.builder()
                .email("test@example.com")
                .password("StrongPass1!")
                .displayName("Test")
                .ageConfirmed(true)
                .eulaAccepted(true)
                .build();

        when(authService.register(any())).thenReturn(AuthDto.AuthResponse.builder().token("token").build());

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }
}
