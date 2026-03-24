package com.backend.playlocal.unit;

import com.backend.playlocal.config.RecaptchaConfig;
import com.backend.playlocal.service.CaptchaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CaptchaServiceTest {

    @Mock
    private RecaptchaConfig config;

    private CaptchaService captchaService;

    @BeforeEach
    void setUp() {
        captchaService = new CaptchaService(config);
    }

    @Test
    @DisplayName("validate should pass when captcha is disabled")
    void validate_Disabled_Passes() {
        when(config.isEnabled()).thenReturn(false);
        assertDoesNotThrow(() -> captchaService.validate(null));
    }

    @Test
    @DisplayName("validate should pass when disabled even with blank token")
    void validate_Disabled_BlankToken_Passes() {
        when(config.isEnabled()).thenReturn(false);
        assertDoesNotThrow(() -> captchaService.validate(""));
    }

    @Test
    @DisplayName("validate should throw when enabled and token is null")
    void validate_Enabled_NullToken_Throws() {
        when(config.isEnabled()).thenReturn(true);
        assertThatThrownBy(() -> captchaService.validate(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("CAPTCHA verification required");
    }

    @Test
    @DisplayName("validate should throw when enabled and token is blank")
    void validate_Enabled_BlankToken_Throws() {
        when(config.isEnabled()).thenReturn(true);
        assertThatThrownBy(() -> captchaService.validate("   "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("CAPTCHA verification required");
    }
}
