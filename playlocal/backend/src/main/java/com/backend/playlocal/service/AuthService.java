package com.backend.playlocal.service;

import com.backend.playlocal.exception.DuplicateResourceException;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.repository.UserRoleRepository;
import com.backend.playlocal.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, UserRoleRepository userRoleRepository,
            PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Register a new user.
     * Requires age confirmation and EULA acceptance (Legal P0/P1).
     */
    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered");
        }

        // Validate age confirmation (Legal P1)
        if (!request.isAgeConfirmed()) {
            throw new IllegalArgumentException("You must confirm you are at least 13 years old");
        }

        // Validate EULA acceptance (Legal P0)
        if (!request.isEulaAccepted()) {
            throw new IllegalArgumentException("You must accept the EULA and Terms of Service");
        }

        // Create user
        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .ageConfirmedAt(Instant.now())
                .build();

        user = userRepository.save(user);

        // Note: Default 'user' role is assigned by database trigger (V7 migration)

        // Get roles and generate token
        List<String> roles = userRoleRepository.findRoleNamesByUserId(user.getUserId());
        if (roles.isEmpty()) {
            roles = List.of("user"); // Fallback if trigger hasn't fired yet
        }
        String token = jwtService.generateToken(user.getUserId(), user.getEmail(), roles);

        return AuthDto.AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationMs() / 1000)
                .user(mapToUserDto(user))
                .build();
    }

    /**
     * Login an existing user.
     */
    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new BadCredentialsException("Account is not active");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        // Update last login
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        // Get roles and generate token
        List<String> roles = userRoleRepository.findRoleNamesByUserId(user.getUserId());
        String token = jwtService.generateToken(user.getUserId(), user.getEmail(), roles);

        return AuthDto.AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationMs() / 1000)
                .user(mapToUserDto(user))
                .build();
    }

    /**
     * Get current authenticated user.
     */
    public AuthDto.UserDto getCurrentUser(String userId) {
        User user = userRepository.findActiveById(java.util.UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToUserDto(user);
    }

    private AuthDto.UserDto mapToUserDto(User user) {
        return AuthDto.UserDto.builder()
                .userId(user.getUserId().toString())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .slug(user.getSlug())
                .avatarUrl(user.getAvatarUrl())
                .defaultIntensity(user.getDefaultIntensity())
                .availability(user.getAvailability())
                .bio(user.getBio())
                .location(user.getLocation())
                .reliabilityScore(user.getReliabilityScore())
                .gamesCount(user.getGamesCount())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }
}
