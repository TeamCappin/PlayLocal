package com.backend.playlocal.unit;

import com.backend.playlocal.config.ResendConfig;
import com.backend.playlocal.repository.EmailLogRepository;
import com.backend.playlocal.service.ResendEmailService;
import com.resend.Resend;
import com.resend.services.emails.Emails;
import com.resend.services.emails.model.CreateEmailResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResendEmailServiceTest {

    @Mock
    private Resend resend;

    @Mock
    private ResendConfig config;

    @Mock
    private EmailLogRepository emailLogRepository;

    @Mock
    private Emails emails;

    private ResendEmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new ResendEmailService(resend, config, emailLogRepository);
    }

    @Test
    @DisplayName("sendWelcomeEmail should return false when email is disabled")
    void sendWelcomeEmail_Disabled_ReturnsFalse() {
        when(config.isEnabled()).thenReturn(false);

        boolean result = emailService.sendWelcomeEmail("test@example.com", "Test User");

        assertThat(result).isFalse();
        verify(resend, never()).emails();
    }

    @Test
    @DisplayName("sendWelcomeEmail should send email when enabled")
    void sendWelcomeEmail_Enabled_SendsEmail() throws Exception {
        when(config.isEnabled()).thenReturn(true);
        when(config.getFromName()).thenReturn("PlayLocal");
        when(config.getFromEmail()).thenReturn("noreply@playlocal.com");
        when(resend.emails()).thenReturn(emails);

        CreateEmailResponse response = mock(CreateEmailResponse.class);
        when(response.getId()).thenReturn("email-123");
        when(emails.send(any())).thenReturn(response);

        boolean result = emailService.sendWelcomeEmail("test@example.com", "Test User");

        assertThat(result).isTrue();
        verify(emails).send(any());
        verify(emailLogRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("sendWelcomeEmail should handle null displayName gracefully")
    void sendWelcomeEmail_NullName_SendsEmail() throws Exception {
        when(config.isEnabled()).thenReturn(true);
        when(config.getFromName()).thenReturn("PlayLocal");
        when(config.getFromEmail()).thenReturn("noreply@playlocal.com");
        when(resend.emails()).thenReturn(emails);

        CreateEmailResponse response = mock(CreateEmailResponse.class);
        when(response.getId()).thenReturn("email-456");
        when(emails.send(any())).thenReturn(response);

        boolean result = emailService.sendWelcomeEmail("test@example.com", null);

        assertThat(result).isTrue();
        verify(emails).send(any());
    }

    @Test
    @DisplayName("sendPasswordResetEmail should return false when disabled")
    void sendPasswordResetEmail_Disabled_ReturnsFalse() {
        when(config.isEnabled()).thenReturn(false);

        boolean result = emailService.sendPasswordResetEmail("test@example.com", "123456");

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("sendMfaCodeEmail should return false when disabled")
    void sendMfaCodeEmail_Disabled_ReturnsFalse() {
        when(config.isEnabled()).thenReturn(false);

        boolean result = emailService.sendMfaCodeEmail("test@example.com", "123456");

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("sendSignupVerificationEmail should return false when disabled")
    void sendSignupVerificationEmail_Disabled_ReturnsFalse() {
        when(config.isEnabled()).thenReturn(false);

        boolean result = emailService.sendSignupVerificationEmail("test@example.com", "123456");

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("sendEmail should return false when disabled")
    void sendEmail_Disabled_ReturnsFalse() {
        when(config.isEnabled()).thenReturn(false);

        boolean result = emailService.sendEmail("test@example.com", "Subject", "Content", "Footer");

        assertThat(result).isFalse();
    }
}
