package com.backend.playlocal.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "recaptcha")
@Getter
@Setter
public class RecaptchaConfig {

    private String secretKey;
    private boolean enabled;
    private double scoreThreshold = 0.5;
}
