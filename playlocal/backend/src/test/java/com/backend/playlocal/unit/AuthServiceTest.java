package com.backend.playlocal.unit;

import com.backend.playlocal.exception.DuplicateResourceException;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.repository.UserRoleRepository;
import com.backend.playlocal.security.JwtService;
import com.backend.playlocal.service.AuthService;
import com.backend.playlocal.service.PrivacySettingsService;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.ChangePasswordRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.Map;

import static org.mockito.ArgumentMatchers.eq;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthService.
 * UserStory: US-1.1 Register/Login/Logout
 * Covers core business logic for authentication.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private PrivacySettingsService privacySettingsService;

    @InjectMocks
    private AuthService authService;

    private AuthDto.RegisterRequest registerRequest;
    private AuthDto.LoginRequest loginRequest;
    private AuthDto.ForgotPasswordRequest forgotPasswordRequest;
    private AuthDto.VerifyResetCodeRequest verifyResetCodeRequest;
    private AuthDto.ResetPasswordRequest resetPasswordRequest;
    private User user;
    private ChangePasswordRequest changePasswordRequest;

    @BeforeEach
    void setUp() {
        registerRequest = AuthDto.RegisterRequest.builder()
                .email("test@example.com")
                .password("password")
                .displayName("Test User")
                .ageConfirmed(true)
                .eulaAccepted(true)
                .build();

        loginRequest = AuthDto.LoginRequest.builder()
                .email("test@example.com")
                .password("password")
                .build();

        user = User.builder()
                .userId(UUID.randomUUID())
                .email("test@example.com")
                .passwordHash("encodedPassword")
                .displayName("Test User")
                .slug("test-user-" + UUID.randomUUID())
                .status(User.UserStatus.ACTIVE)
                .build();

        forgotPasswordRequest = AuthDto.ForgotPasswordRequest.builder()
                .email("test@example.com")
                .build();

        verifyResetCodeRequest = AuthDto.VerifyResetCodeRequest.builder()
                .email("test@example.com")
                .code("000000")
                .build();

        resetPasswordRequest = AuthDto.ResetPasswordRequest.builder()
                .email("test@example.com")
                .code("000000")
                .newPassword("ResetPassword123!")
                .build();

        changePasswordRequest = new ChangePasswordRequest();
        changePasswordRequest.setCurrentPassword("PlayLocalSecure2026!");
        changePasswordRequest.setNewPassword("NewPassword123!");
        changePasswordRequest.setConfirmNewPassword("NewPassword123!");
    }

    // private helper methods

    @SuppressWarnings("unchecked")
    private Map<String, Object> getResetCodeStore() throws Exception {
        Field field = AuthService.class.getDeclaredField("resetCodeStore");
        field.setAccessible(true);
        return (Map<String, Object>) field.get(authService);
    }

    private Object invokeRecordMethod(Object target, String methodName) throws Exception {
        Method method = target.getClass().getDeclaredMethod(methodName);
        method.setAccessible(true);
        return method.invoke(target);
    }

    // ==========================================
    // REGISTER TESTS
    // ==========================================

    @Test
    @DisplayName("US-1.1: Register should succeed with valid data")
    void register_Success() {
        when(userRepository.existsByEmailIgnoreCase(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userRoleRepository.findRoleNamesByUserId(any())).thenReturn(List.of("user"));
        when(jwtService.generateToken(any(), any(), any())).thenReturn("jwt-token");
        when(jwtService.getExpirationMs()).thenReturn(3600000L);

        AuthDto.AuthResponse response = authService.register(registerRequest);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getUser().getEmail()).isEqualTo("test@example.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("US-1.1: Register should throw DuplicateResourceException for existing email")
    void register_DuplicateEmail_ThrowsException() {
        when(userRepository.existsByEmailIgnoreCase(registerRequest.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email already registered");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Legal P1: Register should throw IllegalArgumentException if age not confirmed")
    void register_AgeNotConfirmed_ThrowsException() {
        registerRequest.setAgeConfirmed(false);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("must confirm you are at least 13");
    }

    @Test
    @DisplayName("Legal P0: Register should throw IllegalArgumentException if EULA not accepted")
    void register_EulaNotAccepted_ThrowsException() {
        registerRequest.setEulaAccepted(false);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("must accept the EULA");
    }

    // ==========================================
    // LOGIN TESTS
    // ==========================================

    @Test
    @DisplayName("US-1.1: Login should succeed with valid credentials")
    void login_Success() {
        when(userRepository.findByEmailIgnoreCase(loginRequest.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())).thenReturn(true);
        when(userRoleRepository.findRoleNamesByUserId(user.getUserId())).thenReturn(List.of("user"));
        when(jwtService.generateToken(any(), any(), any())).thenReturn("jwt-token");

        AuthDto.AuthResponse response = authService.login(loginRequest);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        verify(userRepository).save(user); // Should update last login
    }

    @Test
    @DisplayName("US-1.1: Login should throw BadCredentialsException for wrong password")
    void login_WrongPassword_ThrowsException() {
        when(userRepository.findByEmailIgnoreCase(loginRequest.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("US-1.1: Login should throw BadCredentialsException for non-existent user")
    void login_UserNotFound_ThrowsException() {
        when(userRepository.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("US-1.1: Login should throw BadCredentialsException for inactive user")
    void login_InactiveUser_ThrowsException() {
        user.setStatus(User.UserStatus.SUSPENDED);
        when(userRepository.findByEmailIgnoreCase(loginRequest.getEmail())).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Account is not active");
    }

    // ==========================================
    // GET CURRENT USER TESTS
    // ==========================================

    @Test
    @DisplayName("US-1.1: getCurrentUser should return user dto")
    void getCurrentUser_Success() {
        when(userRepository.findActiveById(any())).thenReturn(Optional.of(user));

        AuthDto.UserDto dto = authService.getCurrentUser(user.getUserId().toString());

        assertThat(dto.getEmail()).isEqualTo(user.getEmail());
        assertThat(dto.getReliabilityScore()).isEqualTo(100.0f);
    }

    // Test Password Changes

    @Test
    @DisplayName("US-7.11: changePassword should succeed with valid current password and matching confirmation")
    void changePassword_Success() {
        UUID userId = user.getUserId();

        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(changePasswordRequest.getCurrentPassword(), user.getPasswordHash()))
                .thenReturn(true);
        when(passwordEncoder.encode(changePasswordRequest.getNewPassword()))
                .thenReturn("newEncodedPassword");

        authService.changePassword(userId.toString(), changePasswordRequest);

        assertThat(user.getPasswordHash()).isEqualTo("newEncodedPassword");
        verify(userRepository).findActiveById(userId);
        verify(passwordEncoder).matches("PlayLocalSecure2026!", "encodedPassword");
        verify(passwordEncoder).encode("NewPassword123!");
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("US-7.11: changePassword should throw ResourceNotFoundException when user is not found")
    void changePassword_UserNotFound_ThrowsException() {
        UUID missingUserId = UUID.randomUUID();

        when(userRepository.findActiveById(missingUserId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.changePassword(missingUserId.toString(), changePasswordRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");

        verify(passwordEncoder, never()).matches(any(), any());
        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("US-7.11: changePassword should throw BadCredentialsException when current password is incorrect")
    void changePassword_WrongCurrentPassword_ThrowsException() {
        UUID userId = user.getUserId();

        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(changePasswordRequest.getCurrentPassword(), user.getPasswordHash()))
                .thenReturn(false);

        assertThatThrownBy(() -> authService.changePassword(userId.toString(), changePasswordRequest))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Current password is incorrect");

        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("US-7.11: changePassword should throw IllegalArgumentException when new password confirmation does not match")
    void changePassword_ConfirmationMismatch_ThrowsException() {
        UUID userId = user.getUserId();
        changePasswordRequest.setConfirmNewPassword("differentPassword");

        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(changePasswordRequest.getCurrentPassword(), user.getPasswordHash()))
                .thenReturn(true);

        assertThatThrownBy(() -> authService.changePassword(userId.toString(), changePasswordRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("New password and confirmation do not match");

        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("US-7.11: changePassword should throw IllegalArgumentException when userId is not a valid UUID")
    void changePassword_InvalidUuid_ThrowsException() {
        assertThatThrownBy(() -> authService.changePassword("not-a-uuid", changePasswordRequest))
                .isInstanceOf(IllegalArgumentException.class);

        verify(userRepository, never()).findActiveById(any());
        verify(passwordEncoder, never()).matches(any(), any());
        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any());
    }

    // test forgot password US 7.9


    @Test
    @DisplayName("US-7.9: forgotPassword should store a 6-digit code for existing email")
    void forgotPassword_ExistingEmail_StoresCode() throws Exception {
        when(userRepository.existsByEmailIgnoreCase("test@example.com")).thenReturn(true);

        authService.forgotPassword(forgotPasswordRequest);

        Map<String, Object> store = getResetCodeStore();
        assertThat(store).containsKey("test@example.com");

        Object entry = store.get("test@example.com");
        String code = (String) invokeRecordMethod(entry, "code");
        Instant expiresAt = (Instant) invokeRecordMethod(entry, "expiresAt");
        boolean verified = (boolean) invokeRecordMethod(entry, "verified");

        assertThat(code).matches("\\d{6}");
        assertThat(expiresAt).isAfter(Instant.now());
        assertThat(verified).isFalse();
    }

    @Test
    @DisplayName("US-7.9: forgotPassword should do nothing visible for non-existent email")
    void forgotPassword_NonExistentEmail_DoesNothing() throws Exception {
        when(userRepository.existsByEmailIgnoreCase("test@example.com")).thenReturn(false);

        authService.forgotPassword(forgotPasswordRequest);

        Map<String, Object> store = getResetCodeStore();
        assertThat(store).doesNotContainKey("test@example.com");
    }

    @Test
    @DisplayName("US-7.9: verifyResetCode should succeed for valid stored code")
    void verifyResetCode_ValidCode_Succeeds() throws Exception {
        when(userRepository.existsByEmailIgnoreCase("test@example.com")).thenReturn(true);

        authService.forgotPassword(forgotPasswordRequest);

        Map<String, Object> store = getResetCodeStore();
        Object entryBefore = store.get("test@example.com");
        String generatedCode = (String) invokeRecordMethod(entryBefore, "code");

        verifyResetCodeRequest.setCode(generatedCode);

        authService.verifyResetCode(verifyResetCodeRequest);

        Object entryAfter = store.get("test@example.com");
        boolean verified = (boolean) invokeRecordMethod(entryAfter, "verified");
        assertThat(verified).isTrue();
    }

    @Test
    @DisplayName("US-7.9: verifyResetCode should throw when code is invalid")
    void verifyResetCode_InvalidCode_ThrowsException() {
        when(userRepository.existsByEmailIgnoreCase("test@example.com")).thenReturn(true);

        authService.forgotPassword(forgotPasswordRequest);
        verifyResetCodeRequest.setCode("999999");

        assertThatThrownBy(() -> authService.verifyResetCode(verifyResetCodeRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid or expired reset code");
    }

    @Test
    @DisplayName("US-7.9: resendResetCode should create a reset code for existing email")
    void resendResetCode_ExistingEmail_StoresCode() throws Exception {
        when(userRepository.existsByEmailIgnoreCase("test@example.com")).thenReturn(true);

        authService.resendResetCode(forgotPasswordRequest);

        Map<String, Object> store = getResetCodeStore();
        assertThat(store).containsKey("test@example.com");

        Object entry = store.get("test@example.com");
        String code = (String) invokeRecordMethod(entry, "code");
        assertThat(code).matches("\\d{6}");
    }

    @Test
    @DisplayName("US-7.9: resetPassword should succeed after code verification")
    void resetPassword_AfterVerification_Succeeds() throws Exception {
        when(userRepository.existsByEmailIgnoreCase("test@example.com")).thenReturn(true);
        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("ResetPassword123!")).thenReturn("resetEncodedPassword");

        authService.forgotPassword(forgotPasswordRequest);

        Map<String, Object> store = getResetCodeStore();
        Object entry = store.get("test@example.com");
        String generatedCode = (String) invokeRecordMethod(entry, "code");

        verifyResetCodeRequest.setCode(generatedCode);
        authService.verifyResetCode(verifyResetCodeRequest);

        resetPasswordRequest.setCode(generatedCode);

        authService.resetPassword(resetPasswordRequest);

        assertThat(user.getPasswordHash()).isEqualTo("resetEncodedPassword");
        verify(userRepository).findByEmailIgnoreCase("test@example.com");
        verify(passwordEncoder).encode("ResetPassword123!");
        verify(userRepository).save(user);
        assertThat(store).doesNotContainKey("test@example.com");
    }

    @Test
    @DisplayName("US-7.9: resetPassword should throw when code was not verified first")
    void resetPassword_NotVerified_ThrowsException() throws Exception {
        when(userRepository.existsByEmailIgnoreCase("test@example.com")).thenReturn(true);

        authService.forgotPassword(forgotPasswordRequest);

        Map<String, Object> store = getResetCodeStore();
        Object entry = store.get("test@example.com");
        String generatedCode = (String) invokeRecordMethod(entry, "code");

        resetPasswordRequest.setCode(generatedCode);

        assertThatThrownBy(() -> authService.resetPassword(resetPasswordRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("verified");
    }

    @Test
    @DisplayName("US-7.9: resetPassword should throw when code is invalid")
    void resetPassword_InvalidCode_ThrowsException() {
        resetPasswordRequest.setCode("123456");

        assertThatThrownBy(() -> authService.resetPassword(resetPasswordRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid or expired reset code");

        verify(userRepository, never()).findByEmailIgnoreCase(any());
        verify(userRepository, never()).save(any());
    }





}
