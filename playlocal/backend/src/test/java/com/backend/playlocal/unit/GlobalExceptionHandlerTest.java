package com.backend.playlocal.unit;

import com.backend.playlocal.exception.*;
import com.backend.playlocal.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.lang.reflect.Method;
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
    void handleValidationErrors() throws Exception {
        // Use real BindingResult and exception to avoid mock pollution with subclass mock maker
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "object");
        bindingResult.addError(new FieldError("object", "email", "Invalid email format"));
        MethodParameter param = new MethodParameter(Object.class.getMethod("equals", Object.class), 0);
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(param, bindingResult);

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
    @DisplayName("US-1.1: handleIllegalState should return 400")
    void handleIllegalState() {
        IllegalStateException ex = new IllegalStateException("Invalid state");
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleIllegalState(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("status", 400);
        assertThat(response.getBody()).containsEntry("message", "Invalid state");
    }

    @Test
    @DisplayName("US-1.1: handleDataIntegrityViolation with uq_friendship_pair should return 409 with specific message")
    void handleDataIntegrityViolation_UniqueConstraint_FriendshipPair() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "duplicate key value violates unique constraint \"uq_friendship_pair\""
        );
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleDataIntegrityViolation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("status", 409);
        assertThat(response.getBody()).containsEntry("message", "Friend request already exists between these users");
    }

    @Test
    @DisplayName("US-1.1: handleDataIntegrityViolation with unique constraint should return 409 with generic message")
    void handleDataIntegrityViolation_UniqueConstraint_Generic() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "unique constraint violation"
        );
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleDataIntegrityViolation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("status", 409);
        assertThat(response.getBody()).containsEntry("message", "A duplicate record already exists. Please try again.");
    }

    @Test
    @DisplayName("US-1.1: handleDataIntegrityViolation with ck_friendship_low_high should return 409 with specific message")
    void handleDataIntegrityViolation_CheckConstraint_FriendshipLowHigh() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "check constraint \"ck_friendship_low_high\" violated"
        );
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleDataIntegrityViolation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("status", 409);
        assertThat(response.getBody()).containsEntry("message", "Invalid friendship relationship");
    }

    @Test
    @DisplayName("US-1.1: handleDataIntegrityViolation with foreign key should return 409 with specific message")
    void handleDataIntegrityViolation_ForeignKey() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "foreign key constraint violation REFERENCES users"
        );
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleDataIntegrityViolation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("status", 409);
        assertThat(response.getBody()).containsEntry("message", "Referenced resource not found");
    }

    @Test
    @DisplayName("US-1.1: handleDataIntegrityViolation with REFERENCES should return 409 with specific message")
    void handleDataIntegrityViolation_References() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "constraint violation REFERENCES table"
        );
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleDataIntegrityViolation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("status", 409);
        assertThat(response.getBody()).containsEntry("message", "Referenced resource not found");
    }

    @Test
    @DisplayName("US-1.1: handleDataIntegrityViolation with not null should return 409 with specific message")
    void handleDataIntegrityViolation_NotNull() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "not null constraint violation"
        );
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleDataIntegrityViolation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("status", 409);
        assertThat(response.getBody()).containsEntry("message", "Required field is missing");
    }

    @Test
    @DisplayName("US-1.1: handleDataIntegrityViolation with NULL should return 409 with specific message")
    void handleDataIntegrityViolation_Null() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "NULL constraint violation"
        );
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleDataIntegrityViolation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("status", 409);
        assertThat(response.getBody()).containsEntry("message", "Required field is missing");
    }

    @Test
    @DisplayName("US-1.1: handleDataIntegrityViolation with null message should return 409 with generic message")
    void handleDataIntegrityViolation_NullMessage() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException((String) null);
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleDataIntegrityViolation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("status", 409);
        assertThat(response.getBody()).containsEntry("message", "Database constraint violation");
    }

    @Test
    @DisplayName("US-1.1: handleDataIntegrityViolation with unknown error should return 409 with generic message")
    void handleDataIntegrityViolation_UnknownError() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "some unknown constraint violation"
        );
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleDataIntegrityViolation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("status", 409);
        assertThat(response.getBody()).containsEntry("message", "Database constraint violation");
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
