package com.backend.playlocal.config;

import com.backend.playlocal.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.http.HttpStatus;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
            CorsConfigurationSource corsConfigurationSource) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints - only unauthenticated routes
                        .requestMatchers("/api/v1/auth/register").permitAll()
                        .requestMatchers("/api/v1/auth/login").permitAll()
                        .requestMatchers("/api/v1/auth/logout").permitAll()
                        .requestMatchers("/api/v1/health").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        // Reset password
                        .requestMatchers("/api/v1/auth/forgot-password").permitAll()
                        .requestMatchers("/api/v1/auth/forgot-password/verify-code").permitAll()
                        .requestMatchers("/api/v1/auth/forgot-password/resend").permitAll()
                        .requestMatchers("/api/v1/auth/reset-password").permitAll()
                        // Email test endpoints (authenticated)
                        .requestMatchers("/api/v1/email/**").authenticated()
                        // Stats & Analytics require authentication [US-7.6]
                        .requestMatchers("/api/v1/stats/**").authenticated()
                        // Endorsements require authentication
                        .requestMatchers("/api/v1/endorsements/**").authenticated()
                        // Games are discoverable by everyone (exact location hidden for guests) [US-1.3]
                        .requestMatchers(HttpMethod.GET, "/api/v1/games").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/games/tags").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/games/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/games/*/roster").permitAll()
                        .requestMatchers("/api/v1/games/**").authenticated()
                        .requestMatchers("/ws/**").permitAll()
                        // For attendance confirmation testing [US-3.3]
                        .requestMatchers(HttpMethod.POST, "/api/v1/games/*/attendance").authenticated()
                        // Profiles require authentication to view [US-1.3 Privacy Defaults]
                        .requestMatchers("/api/v1/users/*/profile").authenticated()
                        .requestMatchers("/api/v1/users/*/endorsements").authenticated()
                        // All other endpoints require authentication
                        .anyRequest().authenticated())
                .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
