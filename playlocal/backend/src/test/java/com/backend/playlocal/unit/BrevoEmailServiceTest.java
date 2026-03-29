package com.backend.playlocal.unit;

import com.backend.playlocal.config.MailConfig;
import com.backend.playlocal.model.entity.EmailLog;
import com.backend.playlocal.repository.EmailLogRepository;
import com.backend.playlocal.service.BrevoEmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import sendinblue.ApiClient;
import sendinblue.Configuration;
import sibApi.TransactionalEmailsApi;
import sibModel.CreateSmtpEmail;
import sibModel.SendSmtpEmail;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BrevoEmailServiceTest {

    @Mock
    private MailConfig config;

    @Mock
    private EmailLogRepository emailLogRepository;

    @Mock
    private TransactionalEmailsApi brevoApi;

    private BrevoEmailService emailService;

    @BeforeEach
    void setUp() throws Exception {
        // Mock the static Brevo SDK config so no real API client is created
        ApiClient mockApiClient = mock(ApiClient.class);

        try (MockedStatic<Configuration> configMock =
                 mockStatic(Configuration.class)) {
            configMock.when(Configuration::getDefaultApiClient)
                .thenReturn(mockApiClient);

            when(config.getBrevoApiKey()).thenReturn("test-api-key");
            emailService = new BrevoEmailService(config, emailLogRepository);
        }

        // Inject the mocked brevoApi via reflection
        var field = BrevoEmailService.class.getDeclaredField("brevoApi");
        field.setAccessible(true);
        field.set(emailService, brevoApi);
    }

    @Test
    @DisplayName("sendWelcomeEmail should return false when email is disabled")
    void sendWelcomeEmail_Disabled_ReturnsFalse() {
        when(config.isEnabled()).thenReturn(false);

        boolean result = emailService.sendWelcomeEmail(
            "test@example.com", "Test User");

        assertThat(result).isFalse();
        verifyNoInteractions(brevoApi);
    }

    @Test
    @DisplayName("sendWelcomeEmail should send email when enabled")
    void sendWelcomeEmail_Enabled_SendsEmail() throws Exception {
        when(config.isEnabled()).thenReturn(true);
        when(config.getFromName()).thenReturn("PlayLocal");
        when(config.getFromEmail()).thenReturn("noreply@playlocal.com");

        CreateSmtpEmail mockResult = mock(CreateSmtpEmail.class);
        when(mockResult.getMessageId()).thenReturn("<msg-123>");
        when(brevoApi.sendTransacEmail(any(SendSmtpEmail.class)))
            .thenReturn(mockResult);

        boolean result = emailService.sendWelcomeEmail(
            "test@example.com", "Test User");

        assertThat(result).isTrue();
        verify(brevoApi).sendTransacEmail(any(SendSmtpEmail.class));
        verify(emailLogRepository, times(1)).save(any(EmailLog.class));
    }

    @Test
    @DisplayName("sendWelcomeEmail should handle null displayName gracefully")
    void sendWelcomeEmail_NullName_SendsEmail() throws Exception {
        when(config.isEnabled()).thenReturn(true);
        when(config.getFromName()).thenReturn("PlayLocal");
        when(config.getFromEmail()).thenReturn("noreply@playlocal.com");

        CreateSmtpEmail mockResult = mock(CreateSmtpEmail.class);
        when(mockResult.getMessageId()).thenReturn("<msg-456>");
        when(brevoApi.sendTransacEmail(any(SendSmtpEmail.class)))
            .thenReturn(mockResult);

        boolean result = emailService.sendWelcomeEmail(
            "test@example.com", null);

        assertThat(result).isTrue();
        verify(brevoApi).sendTransacEmail(any(SendSmtpEmail.class));
    }

    @Test
    @DisplayName("sendWelcomeEmail should return false when Brevo API throws")
    void sendWelcomeEmail_ApiThrows_ReturnsFalse() throws Exception {
        when(config.isEnabled()).thenReturn(true);
        when(config.getFromName()).thenReturn("PlayLocal");
        when(config.getFromEmail()).thenReturn("noreply@playlocal.com");

        when(brevoApi.sendTransacEmail(any(SendSmtpEmail.class)))
            .thenThrow(new RuntimeException("API error"));

        boolean result = emailService.sendWelcomeEmail(
            "test@example.com", "Test User");

        assertThat(result).isFalse();
        verify(emailLogRepository, times(1)).save(any(EmailLog.class));
    }

    @Test
    @DisplayName("sendPasswordResetEmail should return false when disabled")
    void sendPasswordResetEmail_Disabled_ReturnsFalse() {
        when(config.isEnabled()).thenReturn(false);

        boolean result = emailService.sendPasswordResetEmail(
            "test@example.com", "123456");

        assertThat(result).isFalse();
        verifyNoInteractions(brevoApi);
    }

    @Test
    @DisplayName("sendMfaCodeEmail should return false when disabled")
    void sendMfaCodeEmail_Disabled_ReturnsFalse() {
        when(config.isEnabled()).thenReturn(false);

        boolean result = emailService.sendMfaCodeEmail(
            "test@example.com", "123456");

        assertThat(result).isFalse();
        verifyNoInteractions(brevoApi);
    }

    @Test
    @DisplayName("sendSignupVerificationEmail should return false when disabled")
    void sendSignupVerificationEmail_Disabled_ReturnsFalse() {
        when(config.isEnabled()).thenReturn(false);

        boolean result = emailService.sendSignupVerificationEmail(
            "test@example.com", "123456");

        assertThat(result).isFalse();
        verifyNoInteractions(brevoApi);
    }

    @Test
    @DisplayName("sendEmail should return false when disabled")
    void sendEmail_Disabled_ReturnsFalse() {
        when(config.isEnabled()).thenReturn(false);

        boolean result = emailService.sendEmail(
            "test@example.com", "Subject", "Content", "Footer");

        assertThat(result).isFalse();
        verifyNoInteractions(brevoApi);
    }
}