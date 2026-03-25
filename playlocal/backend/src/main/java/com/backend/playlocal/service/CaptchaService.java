package com.backend.playlocal.service;

import com.backend.playlocal.config.RecaptchaConfig;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class CaptchaService {

    private static final String VERIFY_URL =
            "https://www.google.com/recaptcha/api/siteverify?secret=%s&response=%s";

    private final RecaptchaConfig config;
    private final RestTemplate restTemplate = new RestTemplate();

    public CaptchaService(RecaptchaConfig config) {
        this.config = config;
    }

    /**
     * Validates a reCAPTCHA v3 token. If CAPTCHA is disabled, always passes.
     */
    public void validate(String token) {
        if (!config.isEnabled()) {
            return;
        }

        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("CAPTCHA verification required");
        }

        String url = String.format(VERIFY_URL, config.getSecretKey(), token);
        VerifyResponse response = restTemplate.postForObject(url, null, VerifyResponse.class);

        if (response == null || !response.isSuccess()) {
            throw new IllegalArgumentException("CAPTCHA verification failed");
        }

        if (response.getScore() < config.getScoreThreshold()) {
            throw new IllegalArgumentException("CAPTCHA score too low");
        }
    }

    @Data
    private static class VerifyResponse {
        private boolean success;
        private double score;
        private String action;
        @JsonProperty("challenge_ts")
        private String challengeTs;
        private String hostname;
        @JsonProperty("error-codes")
        private String[] errorCodes;
    }
}
