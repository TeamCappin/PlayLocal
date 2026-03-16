package com.backend.playlocal.unit;

import com.backend.playlocal.config.JwtConfig;
import com.backend.playlocal.security.JwtAuthenticationFilter;
import com.backend.playlocal.security.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Unit tests for JwtAuthenticationFilter.
 * UserStory: US-1.1 Register/Login/Logout
 * Tests JWT filter chain behavior for authentication.
 */
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter jwtAuthenticationFilter;
    private JwtService jwtService;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private String validToken;
    private static final UUID TEST_USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        // Create real JwtService with test config
        JwtConfig jwtConfig = new JwtConfig();
        jwtConfig.setSecret("test-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256");
        jwtConfig.setExpiration(86400000L);
        jwtService = new JwtService(jwtConfig, null);

        jwtAuthenticationFilter = new JwtAuthenticationFilter(jwtService);

        // Use Spring's MockHttpServletRequest/Response
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();

        // Generate a valid token for testing
        validToken = jwtService.generateToken(TEST_USER_ID, "test@example.com", List.of("user"));

        // Clear security context before each test
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("US-1.1: Filter should set authentication for valid token")
    void doFilter_ValidToken_SetsAuthentication() throws ServletException, IOException {
        request.addHeader("Authorization", "Bearer " + validToken);

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName())
                .isEqualTo(TEST_USER_ID.toString());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("US-1.1: Filter should continue chain without auth for no token")
    void doFilter_NoToken_ContinuesChainWithoutAuth() throws ServletException, IOException {
        // No Authorization header set

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("US-1.1: Filter should continue chain without auth for invalid token")
    void doFilter_InvalidToken_ContinuesChainWithoutAuth() throws ServletException, IOException {
        request.addHeader("Authorization", "Bearer invalid-token");

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("US-1.1: Filter should continue chain without auth for malformed header")
    void doFilter_MalformedHeader_ContinuesChainWithoutAuth() throws ServletException, IOException {
        request.addHeader("Authorization", "NotBearer " + validToken);

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("US-1.1: Filter should extract roles as authorities from token")
    void doFilter_ValidToken_SetsCorrectAuthorities() throws ServletException, IOException {
        String tokenWithRoles = jwtService.generateToken(TEST_USER_ID, "test@example.com", List.of("user", "admin"));
        request.addHeader("Authorization", "Bearer " + tokenWithRoles);

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication().getAuthorities())
                .extracting("authority")
                .containsExactlyInAnyOrder("ROLE_USER", "ROLE_ADMIN");
    }

    @Test
    @DisplayName("US-1.1: Filter should always continue filter chain even on exception")
    void doFilter_EmptyBearer_StillContinuesChain() throws ServletException, IOException {
        // Empty bearer token should not throw but continue
        request.addHeader("Authorization", "Bearer ");

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }
}
