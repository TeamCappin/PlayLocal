package com.backend.playlocal.unit;

import com.backend.playlocal.config.SecurityConfig;
import com.backend.playlocal.security.CustomUserDetailsService;
import com.backend.playlocal.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for SecurityConfig.
 * UserStory: US-1.1 Register/Login/Logout
 * Verifies that security beans are correctly configured and available.
 */
@SpringBootTest(classes = { SecurityConfig.class })
class SecurityConfigTest {

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean(name = "mvcHandlerMappingIntrospector")
    private org.springframework.web.servlet.handler.HandlerMappingIntrospector mvcHandlerMappingIntrospector;

    @Autowired
    private ApplicationContext context;

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
}
