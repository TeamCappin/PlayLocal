package com.backend.playlocal.unit;

import com.backend.playlocal.config.RecaptchaConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RecaptchaConfigTest {

    @Test
    @DisplayName("RecaptchaConfig should have correct defaults")
    void defaults() {
        RecaptchaConfig config = new RecaptchaConfig();
        assertThat(config.isEnabled()).isFalse();
        assertThat(config.getScoreThreshold()).isEqualTo(0.5);
        assertThat(config.getSecretKey()).isNull();
    }

    @Test
    @DisplayName("RecaptchaConfig setters should work")
    void setters() {
        RecaptchaConfig config = new RecaptchaConfig();
        config.setEnabled(true);
        config.setSecretKey("test-secret");
        config.setScoreThreshold(0.7);

        assertThat(config.isEnabled()).isTrue();
        assertThat(config.getSecretKey()).isEqualTo("test-secret");
        assertThat(config.getScoreThreshold()).isEqualTo(0.7);
    }
}
