package com.backend.playlocal.unit;

import com.backend.playlocal.controller.AuthController;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.dto.ChangePasswordRequest;
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
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit tests for AuthController validation logic.
 * UserStory: US-1.1 Register/Login/Logout
 * Also covers US-7.9 Change Password validation and success flow.
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerUnitTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    @Test
    @DisplayName("US-1.1: Register with missing fields should return 400 Bad Request")
    void register_MissingFields_Returns400() throws Exception {
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

        when(authService.register(any()))
                .thenReturn(AuthDto.AuthResponse.builder().token("token").build());

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("US-7.9: Change password success should return 204 No Content")
    void changePassword_Success_Returns204() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("PlayLocalSecure2026!");
        request.setNewPassword("NewPassword123!");
        request.setConfirmNewPassword("NewPassword123!");

        Authentication authentication =
                new TestingAuthenticationToken("123e4567-e89b-12d3-a456-426614174000", null);

        doNothing().when(authService).changePassword(any(), any());

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        verify(authService).changePassword(any(), any(ChangePasswordRequest.class));
    }

    @Test
    @DisplayName("US-7.9: Change password with missing fields should return 400 Bad Request")
    void changePassword_MissingFields_Returns400() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest();

        Authentication authentication =
                new TestingAuthenticationToken("123e4567-e89b-12d3-a456-426614174000", null);

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).changePassword(any(), any());
    }

    @Test
    @DisplayName("US-7.9: Change password with blank current password should return 400 Bad Request")
    void changePassword_BlankCurrentPassword_Returns400() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("");
        request.setNewPassword("NewPassword123!");
        request.setConfirmNewPassword("NewPassword123!");

        Authentication authentication =
                new TestingAuthenticationToken("123e4567-e89b-12d3-a456-426614174000", null);

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).changePassword(any(), any());
    }

    @Test
    @DisplayName("US-7.9: Change password with short new password should return 400 Bad Request")
    void changePassword_ShortNewPassword_Returns400() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("PlayLocalSecure2026!");
        request.setNewPassword("short");
        request.setConfirmNewPassword("short");

        Authentication authentication =
                new TestingAuthenticationToken("123e4567-e89b-12d3-a456-426614174000", null);

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).changePassword(any(), any());
    }

    @Test
    @DisplayName("US-7.9: Change password with blank confirm password should return 400 Bad Request")
    void changePassword_BlankConfirmPassword_Returns400() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("PlayLocalSecure2026!");
        request.setNewPassword("NewPassword123!");
        request.setConfirmNewPassword("");

        Authentication authentication =
                new TestingAuthenticationToken("123e4567-e89b-12d3-a456-426614174000", null);

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).changePassword(any(), any());
    }

    @Test
    @DisplayName("US-7.9: Forgot password request should return 204 No Content")
    void forgotPassword_Success_Returns204() throws Exception {
        AuthDto.ForgotPasswordRequest request = AuthDto.ForgotPasswordRequest.builder()
                .email("test@example.com")
                .build();

        doNothing().when(authService).forgotPassword(any());

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        verify(authService).forgotPassword(any(AuthDto.ForgotPasswordRequest.class));
    }

    @Test
    @DisplayName("US-7.9: Forgot password with invalid email should return 400 Bad Request")
    void forgotPassword_InvalidEmail_Returns400() throws Exception {
        AuthDto.ForgotPasswordRequest request = AuthDto.ForgotPasswordRequest.builder()
                .email("invalid-email")
                .build();

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).forgotPassword(any());
    }

    @Test
    @DisplayName("US-7.9: Verify reset code should return 204 No Content")
    void verifyResetCode_Success_Returns204() throws Exception {
        AuthDto.VerifyResetCodeRequest request = AuthDto.VerifyResetCodeRequest.builder()
                .email("test@example.com")
                .code("123456")
                .build();

        doNothing().when(authService).verifyResetCode(any());

        mockMvc.perform(post("/api/v1/auth/forgot-password/verify-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        verify(authService).verifyResetCode(any(AuthDto.VerifyResetCodeRequest.class));
    }

    @Test
    @DisplayName("US-7.9: Verify reset code with invalid code format should return 400 Bad Request")
    void verifyResetCode_InvalidFormat_Returns400() throws Exception {
        AuthDto.VerifyResetCodeRequest request = AuthDto.VerifyResetCodeRequest.builder()
                .email("test@example.com")
                .code("123")
                .build();

        mockMvc.perform(post("/api/v1/auth/forgot-password/verify-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).verifyResetCode(any());
    }

    @Test
    @DisplayName("US-7.9: Resend reset code should return 204 No Content")
    void resendResetCode_Success_Returns204() throws Exception {
        AuthDto.ForgotPasswordRequest request = AuthDto.ForgotPasswordRequest.builder()
                .email("test@example.com")
                .build();

        doNothing().when(authService).resendResetCode(any());

        mockMvc.perform(post("/api/v1/auth/forgot-password/resend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        verify(authService).resendResetCode(any(AuthDto.ForgotPasswordRequest.class));
    }

    @Test
    @DisplayName("US-7.9: Reset password should return 204 No Content")
    void resetPassword_Success_Returns204() throws Exception {
        AuthDto.ResetPasswordRequest request = AuthDto.ResetPasswordRequest.builder()
                .email("test@example.com")
                .code("123456")
                .newPassword("ResetPassword123!")
                .build();

        doNothing().when(authService).resetPassword(any());

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        verify(authService).resetPassword(any(AuthDto.ResetPasswordRequest.class));
    }

    @Test
    @DisplayName("US-7.9: Reset password with short password should return 400 Bad Request")
    void resetPassword_ShortPassword_Returns400() throws Exception {
        AuthDto.ResetPasswordRequest request = AuthDto.ResetPasswordRequest.builder()
                .email("test@example.com")
                .code("123456")
                .newPassword("short")
                .build();

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).resetPassword(any());
    }

    @Test
    @DisplayName("US-7.9: Reset password with invalid code format should return 400 Bad Request")
    void resetPassword_InvalidCodeFormat_Returns400() throws Exception {
        AuthDto.ResetPasswordRequest request = AuthDto.ResetPasswordRequest.builder()
                .email("test@example.com")
                .code("abc")
                .newPassword("ResetPassword123!")
                .build();

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).resetPassword(any());
    }
}