package com.backend.playlocal.unit;

import com.backend.playlocal.exception.DuplicateResourceException;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.repository.UserRoleRepository;
import com.backend.playlocal.security.JwtService;
import com.backend.playlocal.service.AuthService;
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
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Unit tests for AuthService.
 * UserStory: US-1.1 Register/Login/Logout
 * AcceptanceCriteria: User can register, login, and access protected resources
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

    @InjectMocks
    private AuthService authService;

    private AuthDto.RegisterRequest validRegisterRequest;
    private AuthDto.LoginRequest validLoginRequest;
    private User existingUser;

    @BeforeEach
    void setUp() {
        validRegisterRequest = AuthDto.RegisterRequest.builder()
                .email("test@example.com")
                .password("password123")
                .displayName("Test User")
                .ageConfirmed(true)
                .eulaAccepted(true)
                .build();

        validLoginRequest = AuthDto.LoginRequest.builder()
                .email("test@example.com")
                .password("password123")
                .build();

        existingUser = User.builder()
                .userId(UUID.randomUUID())
                .email("test@example.com")
                .passwordHash("hashedPassword")
                .displayName("Test User")
                .status(User.UserStatus.ACTIVE)
                .reliabilityScore(100.0f)
                .build();
    }

    @Test
    @DisplayName("US-1.1: Should register new user successfully")
    void registerSuccess() {
        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setUserId(UUID.randomUUID());
            return user;
        });
        when(userRoleRepository.findRoleNamesByUserId(any())).thenReturn(List.of("user"));
        when(jwtService.generateToken(any(), anyString(), anyList())).thenReturn("jwt-token");
        when(jwtService.getExpirationMs()).thenReturn(86400000L);

        AuthDto.AuthResponse response = authService.register(validRegisterRequest);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getTokenType()).isEqualTo("Bearer");
        assertThat(response.getUser().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("US-1.1: Should reject duplicate email registration")
    void registerDuplicateEmail() {
        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(validRegisterRequest))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Email already registered");
    }

    @Test
    @DisplayName("Legal P1: Should reject registration without age confirmation")
    void registerWithoutAgeConfirmation() {
        validRegisterRequest.setAgeConfirmed(false);

        assertThatThrownBy(() -> authService.register(validRegisterRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at least 13 years old");
    }

    @Test
    @DisplayName("Legal P0: Should reject registration without EULA acceptance")
    void registerWithoutEulaAcceptance() {
        validRegisterRequest.setEulaAccepted(false);

        assertThatThrownBy(() -> authService.register(validRegisterRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("EULA");
    }

    @Test
    @DisplayName("US-1.1: Should login successfully with correct credentials")
    void loginSuccess() {
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(userRepository.save(any())).thenReturn(existingUser);
        when(userRoleRepository.findRoleNamesByUserId(any())).thenReturn(List.of("user"));
        when(jwtService.generateToken(any(), anyString(), anyList())).thenReturn("jwt-token");
        when(jwtService.getExpirationMs()).thenReturn(86400000L);

        AuthDto.AuthResponse response = authService.login(validLoginRequest);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("jwt-token");
    }

    @Test
    @DisplayName("US-1.1: Should reject login with invalid email")
    void loginInvalidEmail() {
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(validLoginRequest))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    @DisplayName("US-1.1: Should reject login with invalid password")
    void loginInvalidPassword() {
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(validLoginRequest))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    @DisplayName("US-1.1: Should reject login for suspended user")
    void loginSuspendedUser() {
        existingUser.setStatus(User.UserStatus.SUSPENDED);
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> authService.login(validLoginRequest))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Account is not active");
    }
}
