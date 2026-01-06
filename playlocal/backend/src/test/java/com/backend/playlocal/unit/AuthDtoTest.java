package com.backend.playlocal.unit;

import com.backend.playlocal.model.dto.AuthDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for AuthDto.
 * UserStory: US-1.1 Register/Login/Logout
 * Tests builder/accessors for Data Transfer Objects used in Auth.
 */
class AuthDtoTest {

    @Test
    @DisplayName("US-1.1: RegisterRequest builder should work")
    void registerRequestBuilder() {
        AuthDto.RegisterRequest request = AuthDto.RegisterRequest.builder()
                .email("test@example.com")
                .password("password")
                .displayName("Test")
                .ageConfirmed(true)
                .eulaAccepted(true)
                .build();

        assertThat(request.getEmail()).isEqualTo("test@example.com");
        assertThat(request.getPassword()).isEqualTo("password");
        assertThat(request.getDisplayName()).isEqualTo("Test");
        assertThat(request.isAgeConfirmed()).isTrue();
        assertThat(request.isEulaAccepted()).isTrue();
    }

    @Test
    @DisplayName("US-1.1: LoginRequest builder should work")
    void loginRequestBuilder() {
        AuthDto.LoginRequest request = AuthDto.LoginRequest.builder()
                .email("test@example.com")
                .password("password")
                .build();

        assertThat(request.getEmail()).isEqualTo("test@example.com");
        assertThat(request.getPassword()).isEqualTo("password");
    }

    @Test
    @DisplayName("US-1.1: AuthResponse builder should work")
    void authResponseBuilder() {
        AuthDto.UserDto userDto = AuthDto.UserDto.builder().email("test").build();
        AuthDto.AuthResponse response = AuthDto.AuthResponse.builder()
                .token("token")
                .tokenType("Bearer")
                .expiresIn(3600L)
                .user(userDto)
                .build();

        assertThat(response.getToken()).isEqualTo("token");
        assertThat(response.getTokenType()).isEqualTo("Bearer");
        assertThat(response.getExpiresIn()).isEqualTo(3600L);
        assertThat(response.getUser()).isEqualTo(userDto);
    }

    @Test
    @DisplayName("US-1.1: UserDto builder should work")
    void userDtoBuilder() {
        AuthDto.UserDto user = AuthDto.UserDto.builder()
                .userId("id")
                .email("email")
                .displayName("name")
                .avatarUrl("url")
                .defaultIntensity("intensity")
                .availability("availability")
                .bio("bio")
                .location("loc")
                .reliabilityScore(100f)
                .gamesCount(10)
                .createdAt("date")
                .build();

        assertThat(user.getUserId()).isEqualTo("id");
        assertThat(user.getEmail()).isEqualTo("email");
        assertThat(user.getReliabilityScore()).isEqualTo(100f);
    }
}
