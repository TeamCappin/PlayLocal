package com.backend.playlocal.config;

import com.resend.Resend;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "resend")
@Getter
@Setter
public class ResendConfig {

  private String apiKey;
  private String fromEmail;
  private String fromName = "PlayLocal";
  private boolean enabled = true;

  @Bean
  public Resend resend() {
    return new Resend(apiKey);
  }
}
