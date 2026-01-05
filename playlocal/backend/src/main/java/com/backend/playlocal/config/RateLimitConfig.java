package com.backend.playlocal.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "rate-limit")
public class RateLimitConfig {

    private LoginLimit login = new LoginLimit();
    private ReportLimit report = new ReportLimit();
    private GeneralLimit general = new GeneralLimit();

    public static class LoginLimit {
        private int maxAttempts = 5;
        private int windowMinutes = 15;

        public int getMaxAttempts() {
            return maxAttempts;
        }

        public void setMaxAttempts(int maxAttempts) {
            this.maxAttempts = maxAttempts;
        }

        public int getWindowMinutes() {
            return windowMinutes;
        }

        public void setWindowMinutes(int windowMinutes) {
            this.windowMinutes = windowMinutes;
        }
    }

    public static class ReportLimit {
        private int maxPerHour = 10;

        public int getMaxPerHour() {
            return maxPerHour;
        }

        public void setMaxPerHour(int maxPerHour) {
            this.maxPerHour = maxPerHour;
        }
    }

    public static class GeneralLimit {
        private int requestsPerMinute = 60;

        public int getRequestsPerMinute() {
            return requestsPerMinute;
        }

        public void setRequestsPerMinute(int requestsPerMinute) {
            this.requestsPerMinute = requestsPerMinute;
        }
    }

    public LoginLimit getLogin() {
        return login;
    }

    public void setLogin(LoginLimit login) {
        this.login = login;
    }

    public ReportLimit getReport() {
        return report;
    }

    public void setReport(ReportLimit report) {
        this.report = report;
    }

    public GeneralLimit getGeneral() {
        return general;
    }

    public void setGeneral(GeneralLimit general) {
        this.general = general;
    }
}
