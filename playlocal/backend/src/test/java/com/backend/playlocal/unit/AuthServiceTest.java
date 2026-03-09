package com.backend.playlocal.unit;

import com.backend.playlocal.exception.DuplicateResourceException;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.repository.UserRoleRepository;
import com.backend.playlocal.security.JwtService;
import com.backend.playlocal.service.AuthService;
import com.backend.playlocal.service.PrivacySettingsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

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
    private User user;

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
}
