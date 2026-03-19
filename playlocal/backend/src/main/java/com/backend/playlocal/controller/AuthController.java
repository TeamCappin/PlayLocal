package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.dto.ChangePasswordRequest;
import com.backend.playlocal.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Register a new user account.
     * US-1.1: Register/Login/Logout
     * Legal P0: EULA acceptance required
     * Legal P1: Age confirmation required (13+)
     */
    @PostMapping("/register")
    public ResponseEntity<AuthDto.AuthResponse> register(@Valid @RequestBody AuthDto.RegisterRequest request) {
        AuthDto.AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Login with existing credentials.
     * US-1.1: Register/Login/Logout
     */
    @PostMapping("/login")
    public ResponseEntity<AuthDto.AuthResponse> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        AuthDto.AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get current authenticated user.
     */
    @GetMapping("/me")
    public ResponseEntity<AuthDto.UserDto> getCurrentUser(Authentication authentication) {
        String userId = authentication.getName();
        AuthDto.UserDto user = authService.getCurrentUser(userId);
        return ResponseEntity.ok(user);
    }

    /**
     * Logout (client-side token invalidation).
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        String userId = authentication.getName();
        authService.changePassword(userId, request);
        return ResponseEntity.noContent().build();
    }

    /**
     * US-7.9: Forgot Password - request reset code.
     * Always returns 204 so we do not reveal whether the email exists.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody AuthDto.ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.noContent().build();
    }

    /**
     * Verify the 6-digit reset code.
     */
    @PostMapping("/forgot-password/verify-code")
    public ResponseEntity<Void> verifyResetCode(@Valid @RequestBody AuthDto.VerifyResetCodeRequest request) {
        authService.verifyResetCode(request);
        return ResponseEntity.noContent().build();
    }

    /**
     * Resend a new reset code.
     * Also returns 204 to avoid revealing whether email exists.
     */
    @PostMapping("/forgot-password/resend")
    public ResponseEntity<Void> resendResetCode(@Valid @RequestBody AuthDto.ForgotPasswordRequest request) {
        authService.resendResetCode(request);
        return ResponseEntity.noContent().build();
    }

    /**
     * Reset password using verified 6-digit code.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody AuthDto.ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }
}