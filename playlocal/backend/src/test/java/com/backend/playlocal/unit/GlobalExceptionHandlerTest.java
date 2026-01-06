package com.backend.playlocal.unit;

import com.backend.playlocal.exception.*;
import com.backend.playlocal.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for GlobalExceptionHandler.
 * UserStory: US-1.1 Register/Login/Logout
 * Tests correct HTTP status codes and error response formats for various
 * exceptions.
 */
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("US-1.1: handleResourceNotFound should return 404")
    void handleResourceNotFound() {
        ResourceNotFoundException ex = new ResourceNotFoundException("User not found");
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleResourceNotFound(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).containsEntry("status", 404);
        assertThat(response.getBody()).containsEntry("error", "Not Found");
        assertThat(response.getBody()).containsEntry("message", "User not found");
    }

    @Test
    @DisplayName("US-1.1: handleDuplicateResource should return 409")
    void handleDuplicateResource() {
        DuplicateResourceException ex = new DuplicateResourceException("Email already exists");
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleDuplicateResource(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("status", 409);
        assertThat(response.getBody()).containsEntry("error", "Conflict");
        assertThat(response.getBody()).containsEntry("message", "Email already exists");
    }

    @Test
    @DisplayName("US-1.1: handleAccessDenied should return 403")
    void handleAccessDenied() {
        AccessDeniedException ex = new AccessDeniedException("Access denied");
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleAccessDenied(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).containsEntry("status", 403);
        assertThat(response.getBody()).containsEntry("error", "Forbidden");
        assertThat(response.getBody()).containsEntry("message", "Access denied");
    }

    @Test
    @DisplayName("US-1.1: handleBadCredentials should return 401")
    void handleBadCredentials() {
        BadCredentialsException ex = new BadCredentialsException("Invalid email or password");
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleBadCredentials(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).containsEntry("status", 401);
        assertThat(response.getBody()).containsEntry("error", "Unauthorized");
        assertThat(response.getBody()).containsEntry("message", "Invalid email or password");
    }

    @Test
    @DisplayName("US-1.1: handleValidationErrors should return 400 with field errors")
    void handleValidationErrors() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("object", "email", "Invalid email format");

        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleValidationErrors(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("status", 400);
        assertThat(response.getBody()).containsEntry("error", "Validation failed");

        @SuppressWarnings("unchecked")
        Map<String, String> fieldErrors = (Map<String, String>) response.getBody().get("fieldErrors");
        assertThat(fieldErrors).containsEntry("email", "Invalid email format");
    }

    @Test
    @DisplayName("US-1.1: handleRateLimitExceeded should return 429")
    void handleRateLimitExceeded() {
        RateLimitExceededException ex = new RateLimitExceededException("Too many requests");
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleRateLimitExceeded(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(response.getBody()).containsEntry("status", 429);
        assertThat(response.getBody()).containsEntry("message", "Too many requests");
    }

    @Test
    @DisplayName("US-1.1: handleCapacityExceeded should return 409")
    void handleCapacityExceeded() {
        CapacityExceededException ex = new CapacityExceededException("Game is full");
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleCapacityExceeded(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("status", 409);
        assertThat(response.getBody()).containsEntry("message", "Game is full");
    }

    @Test
    @DisplayName("US-1.1: handleIllegalArgument should return 400")
    void handleIllegalArgument() {
        IllegalArgumentException ex = new IllegalArgumentException("Invalid argument");
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleIllegalArgument(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("status", 400);
        assertThat(response.getBody()).containsEntry("message", "Invalid argument");
    }

    @Test
    @DisplayName("US-1.1: handleGenericException should return 500")
    void handleGenericException() {
        Exception ex = new RuntimeException("Unexpected error");
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleGenericException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).containsEntry("status", 500);
        assertThat(response.getBody()).containsEntry("error", "Internal Server Error");
        assertThat(response.getBody()).containsEntry("message", "An unexpected error occurred");
    }
}
