package com.backend.playlocal.unit;

import com.backend.playlocal.model.dto.ChangePasswordRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ChangePasswordRequestTest {

    private Validator validator;
    private ChangePasswordRequest request;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();

        request = new ChangePasswordRequest();
        request.setCurrentPassword("currentPass123");
        request.setNewPassword("newPass123");
        request.setConfirmNewPassword("newPass123");
    }

    @Test
    void shouldSetAndGetCurrentPassword() {
        request.setCurrentPassword("myCurrentPassword");
        assertEquals("myCurrentPassword", request.getCurrentPassword());
    }

    @Test
    void shouldSetAndGetNewPassword() {
        request.setNewPassword("myNewPassword");
        assertEquals("myNewPassword", request.getNewPassword());
    }

    @Test
    void shouldSetAndGetConfirmNewPassword() {
        request.setConfirmNewPassword("myConfirmedPassword");
        assertEquals("myConfirmedPassword", request.getConfirmNewPassword());
    }

    @Test
    void shouldPassValidationWhenAllFieldsAreValid() {
        Set<ConstraintViolation<ChangePasswordRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty());
    }

    @Test
    void shouldFailValidationWhenCurrentPasswordIsBlank() {
        request.setCurrentPassword("");

        Set<ConstraintViolation<ChangePasswordRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(
                violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("currentPassword"))
        );
    }

    @Test
    void shouldFailValidationWhenCurrentPasswordIsNull() {
        request.setCurrentPassword(null);

        Set<ConstraintViolation<ChangePasswordRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(
                violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("currentPassword"))
        );
    }

    @Test
    void shouldFailValidationWhenNewPasswordIsBlank() {
        request.setNewPassword("");

        Set<ConstraintViolation<ChangePasswordRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(
                violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("newPassword"))
        );
    }

    @Test
    void shouldFailValidationWhenNewPasswordIsNull() {
        request.setNewPassword(null);

        Set<ConstraintViolation<ChangePasswordRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(
                violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("newPassword"))
        );
    }

    @Test
    void shouldFailValidationWhenNewPasswordIsTooShort() {
        request.setNewPassword("short");

        Set<ConstraintViolation<ChangePasswordRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(
                violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("newPassword"))
        );
    }

    @Test
    void shouldPassValidationWhenNewPasswordHasExactlyEightCharacters() {
        request.setNewPassword("12345678");

        Set<ConstraintViolation<ChangePasswordRequest>> violations = validator.validate(request);

        assertTrue(
                violations.stream().noneMatch(v -> v.getPropertyPath().toString().equals("newPassword"))
        );
    }

    @Test
    void shouldFailValidationWhenConfirmNewPasswordIsBlank() {
        request.setConfirmNewPassword("");

        Set<ConstraintViolation<ChangePasswordRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(
                violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("confirmNewPassword"))
        );
    }

    @Test
    void shouldFailValidationWhenConfirmNewPasswordIsNull() {
        request.setConfirmNewPassword(null);

        Set<ConstraintViolation<ChangePasswordRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(
                violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("confirmNewPassword"))
        );
    }
}