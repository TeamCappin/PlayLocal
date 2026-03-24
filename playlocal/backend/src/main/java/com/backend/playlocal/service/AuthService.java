package com.backend.playlocal.service;

import com.backend.playlocal.exception.DuplicateResourceException;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.dto.ChangePasswordRequest;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.repository.UserRoleRepository;
import com.backend.playlocal.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private static final long RESET_CODE_TTL_SECONDS = (long) 10 * 60; // 10 minutes
    private static final long MFA_CODE_TTL_SECONDS = (long) 5 * 60; // 5 minutes

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PrivacySettingsService privacySettingsService;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Temporary in-memory storage for reset codes.
     * Replace with DB table later.
     */
    private final Map<String, ResetCodeEntry> resetCodeStore = new ConcurrentHashMap<>();

    /** In-memory MFA code store keyed by email. */
    private final Map<String, MfaCodeEntry> mfaCodeStore = new ConcurrentHashMap<>();

    public AuthService(UserRepository userRepository,
                       UserRoleRepository userRoleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       PrivacySettingsService privacySettingsService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.privacySettingsService = privacySettingsService;
        this.emailService = emailService;
    }

    /**
     * Register a new user.
     * Requires age confirmation and EULA acceptance.
     */
    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered");
        }

        if (!request.isAgeConfirmed()) {
            throw new IllegalArgumentException("You must confirm you are at least 13 years old");
        }

        if (!request.isEulaAccepted()) {
            throw new IllegalArgumentException("You must accept the EULA and Terms of Service");
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .ageConfirmedAt(Instant.now())
                .build();

        user = userRepository.save(user);

        privacySettingsService.createDefaultSettings(user.getUserId());

        emailService.sendWelcomeEmail(user.getEmail(), user.getDisplayName());

        List<String> roles = userRoleRepository.findRoleNamesByUserId(user.getUserId());
        if (roles.isEmpty()) {
            roles = List.of("user");
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
     * If MFA is enabled, sends a code and returns mfaRequired=true without a token.
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

        // MFA check
        if (Boolean.TRUE.equals(user.getMfaEnabled())) {
            String code = generateSixDigitCode();
            String normalizedEmail = normalizeEmail(user.getEmail());
            mfaCodeStore.put(normalizedEmail,
                    new MfaCodeEntry(code, Instant.now().plusSeconds(MFA_CODE_TTL_SECONDS)));
            emailService.sendMfaCodeEmail(normalizedEmail, code);

            return AuthDto.AuthResponse.builder()
                    .mfaRequired(true)
                    .build();
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

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
     * Verify MFA code and return JWT on success.
     */
    public AuthDto.AuthResponse verifyMfa(AuthDto.MfaVerifyRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        MfaCodeEntry entry = mfaCodeStore.get(normalizedEmail);

        if (entry == null || entry.isExpired() || !entry.code().equals(request.getCode())) {
            throw new BadCredentialsException("Invalid or expired MFA code");
        }

        mfaCodeStore.remove(normalizedEmail);

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

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
     * Enable MFA for the authenticated user.
     */
    @Transactional
    public void enableMfa(String userId) {
        User user = userRepository.findActiveById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setMfaEnabled(true);
        userRepository.save(user);
    }

    /**
     * Disable MFA for the authenticated user.
     */
    @Transactional
    public void disableMfa(String userId) {
        User user = userRepository.findActiveById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setMfaEnabled(false);
        userRepository.save(user);
    }

    /**
     * Get MFA status for the authenticated user.
     */
    public boolean isMfaEnabled(String userId) {
        User user = userRepository.findActiveById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return Boolean.TRUE.equals(user.getMfaEnabled());
    }

    /**
     * Get current authenticated user.
     */
    public AuthDto.UserDto getCurrentUser(String userId) {
        User user = userRepository.findActiveById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToUserDto(user);
    }

    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findActiveById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new IllegalArgumentException("New password and confirmation do not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * US-7.9
     * Generates a 6-digit code and stores it temporarily in memory.
     * Does not reveal whether the email exists.
     */
    public void forgotPassword(AuthDto.ForgotPasswordRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        boolean emailExists = userRepository.existsByEmailIgnoreCase(normalizedEmail);
        if (!emailExists) {
            // Intentionally do nothing to avoid email enumeration.
            return;
        }

        String code = generateSixDigitCode();
        Instant expiresAt = Instant.now().plusSeconds(RESET_CODE_TTL_SECONDS);

        resetCodeStore.put(normalizedEmail, new ResetCodeEntry(code, expiresAt, false));

        // Send reset code via email (falls back to console log if disabled)
        emailService.sendPasswordResetEmail(normalizedEmail, code);

        System.out.println("======================================");
        System.out.println("FORGOT PASSWORD RESET CODE GENERATED");
        System.out.println("Email: " + normalizedEmail);
        System.out.println("Code: " + code);
        System.out.println("Expires At: " + expiresAt);
        System.out.println("======================================");
    }

    /**
     * Verify submitted reset code.
     */
    public void verifyResetCode(AuthDto.VerifyResetCodeRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        ResetCodeEntry entry = resetCodeStore.get(normalizedEmail);

        if (entry == null || entry.isExpired() || !entry.code().equals(request.getCode())) {
            throw new IllegalArgumentException("Invalid or expired reset code");
        }

        resetCodeStore.put(normalizedEmail, new ResetCodeEntry(
                entry.code(),
                entry.expiresAt(),
                true
        ));
    }

    /**
     * Resend = generate a fresh new 6-digit code.
     * Does not reveal whether the email exists.
     */
    public void resendResetCode(AuthDto.ForgotPasswordRequest request) {
        forgotPassword(request);
    }

    /**
     * Reset password after code verification.
     */
    @Transactional
    public void resetPassword(AuthDto.ResetPasswordRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        ResetCodeEntry entry = resetCodeStore.get(normalizedEmail);
        if (entry == null || entry.isExpired()) {
            throw new IllegalArgumentException("Invalid or expired reset code");
        }

        if (!entry.code().equals(request.getCode())) {
            throw new IllegalArgumentException("Invalid or expired reset code");
        }

        if (!entry.verified()) {
            throw new IllegalArgumentException("Reset code must be verified before resetting password");
        }

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid reset request"));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetCodeStore.remove(normalizedEmail);
    }

    private String generateSixDigitCode() {
        int number = secureRandom.nextInt(900000) + 100000;
        return String.valueOf(number);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
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
                .mfaEnabled(user.getMfaEnabled())
                .build();
    }

    private record ResetCodeEntry(
            String code,
            Instant expiresAt,
            boolean verified
    ) {
        private boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    private record MfaCodeEntry(
            String code,
            Instant expiresAt
    ) {
        private boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }
}