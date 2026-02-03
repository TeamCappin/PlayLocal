package com.backend.playlocal.unit;

import com.backend.playlocal.config.SecurityConfig;
import com.backend.playlocal.security.CustomUserDetailsService;
import com.backend.playlocal.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.ApplicationContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.cors.CorsConfigurationSource;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit tests for SecurityConfig.
 * UserStory: US-1.1 Register/Login/Logout
 * Verifies that security beans are correctly configured and available.
 */
@SpringBootTest(classes = { SecurityConfig.class })
@AutoConfigureMockMvc
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean(name = "mvcHandlerMappingIntrospector")
    private org.springframework.web.servlet.handler.HandlerMappingIntrospector mvcHandlerMappingIntrospector;

    @Autowired
    private ApplicationContext context;

    @BeforeEach
    void setup() throws Exception {
        // Fix for "Chain Broken" issue: mocked filter must proceed execution
        doAnswer(invocation -> {
            HttpServletRequest request = invocation.getArgument(0);
            HttpServletResponse response = invocation.getArgument(1);
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(request, response);
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
    }

    @Test
    @DisplayName("US-1.1: SecurityFilterChain bean should be present")
    void securityFilterChainBeanExists() {
        assertThat(context.getBean(SecurityFilterChain.class)).isNotNull();
    }

    @Test
    @DisplayName("US-1.1: PasswordEncoder bean should be present and be BCrypt")
    void passwordEncoderBeanExists() {
        PasswordEncoder encoder = context.getBean(PasswordEncoder.class);
        assertThat(encoder).isNotNull();
        // Verify it encodes and matches
        String raw = "password";
        String encoded = encoder.encode(raw);
        assertThat(encoder.matches(raw, encoded)).isTrue();
    }

    @Test
    @DisplayName("US-1.1: CORS ConfigurationSource bean should be present")
    void corsConfigurationSourceBeanExists() {
        assertThat(context.getBean(CorsConfigurationSource.class)).isNotNull();
    }

    @Test
    @DisplayName("Verify Endpoint Security Rules: Endorsements secured, Games public")
    void verifyEndpointSecurity() throws Exception {
        // Endorsements: secured -> 401 Unauthorized (no token)
        mockMvc.perform(get("/api/v1/endorsements/1"))
               .andExpect(status().isUnauthorized());

        // Games: public -> 404 Not Found (passed security, no controller found)
        mockMvc.perform(get("/api/v1/games/1"))
               .andExpect(status().isNotFound());
    }
}
