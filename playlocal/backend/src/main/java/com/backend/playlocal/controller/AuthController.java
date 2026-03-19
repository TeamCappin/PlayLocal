package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.service.AuthService;
import com.backend.playlocal.model.dto.ChangePasswordRequest;
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
     * Note: With stateless JWT, logout is handled client-side by discarding the
     * token.
     * Future: Implement token blacklist for true server-side logout.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // Stateless JWT - client discards token
        // Could implement token blacklist for enhanced security
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
}
