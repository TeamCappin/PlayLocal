package com.backend.playlocal.unit;

import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.repository.UserRoleRepository;
import com.backend.playlocal.security.CustomUserDetailsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Unit tests for CustomUserDetailsService.
 * UserStory: US-1.1 Register/Login/Logout
 * Tests user lookup for Spring Security authentication.
 */
@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    private User activeUser;
    private User suspendedUser;
    private static final UUID TEST_USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        activeUser = User.builder()
                .userId(TEST_USER_ID)
                .email("active@example.com")
                .passwordHash("hashedPassword")
                .displayName("Active User")
                .slug("active-user-" + UUID.randomUUID())
                .status(User.UserStatus.ACTIVE)
                .reliabilityScore(100.0f)
                .build();

        suspendedUser = User.builder()
                .userId(UUID.randomUUID())
                .email("suspended@example.com")
                .passwordHash("hashedPassword")
                .displayName("Suspended User")
                .slug("suspended-user-" + UUID.randomUUID())
                .status(User.UserStatus.SUSPENDED)
                .reliabilityScore(0.0f)
                .build();
    }

    @Test
    @DisplayName("US-1.1: loadUserByUsername should return UserDetails for active user")
    void loadUserByUsername_ActiveUser_ReturnsUserDetails() {
        when(userRepository.findByEmailIgnoreCase("active@example.com")).thenReturn(Optional.of(activeUser));
        when(userRoleRepository.findRoleNamesByUserId(TEST_USER_ID)).thenReturn(List.of("user"));

        UserDetails userDetails = customUserDetailsService.loadUserByUsername("active@example.com");

        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo("active@example.com");
        assertThat(userDetails.getPassword()).isEqualTo("hashedPassword");
        assertThat(userDetails.getAuthorities())
                .extracting("authority")
                .contains("ROLE_USER");
    }

    @Test
    @DisplayName("US-1.1: loadUserByUsername should include multiple roles")
    void loadUserByUsername_MultipleRoles_IncludesAllRoles() {
        when(userRepository.findByEmailIgnoreCase("active@example.com")).thenReturn(Optional.of(activeUser));
        when(userRoleRepository.findRoleNamesByUserId(TEST_USER_ID)).thenReturn(List.of("user", "admin", "moderator"));

        UserDetails userDetails = customUserDetailsService.loadUserByUsername("active@example.com");

        assertThat(userDetails.getAuthorities())
                .extracting("authority")
                .containsExactlyInAnyOrder("ROLE_USER", "ROLE_ADMIN", "ROLE_MODERATOR");
    }

    @Test
    @DisplayName("US-1.1: loadUserByUsername should throw for non-existent user")
    void loadUserByUsername_NonExistentUser_ThrowsException() {
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername("nonexistent@example.com"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    @DisplayName("US-1.1: loadUserByUsername should throw for suspended user")
    void loadUserByUsername_SuspendedUser_ThrowsException() {
        when(userRepository.findByEmailIgnoreCase("suspended@example.com")).thenReturn(Optional.of(suspendedUser));

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername("suspended@example.com"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("not active");
    }

    @Test
    @DisplayName("US-1.1: loadUserByUsername is case insensitive for email")
    void loadUserByUsername_CaseInsensitiveEmail_Works() {
        when(userRepository.findByEmailIgnoreCase("ACTIVE@EXAMPLE.COM")).thenReturn(Optional.of(activeUser));
        when(userRoleRepository.findRoleNamesByUserId(TEST_USER_ID)).thenReturn(List.of("user"));

        UserDetails userDetails = customUserDetailsService.loadUserByUsername("ACTIVE@EXAMPLE.COM");

        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo("active@example.com");
    }
}
